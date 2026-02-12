# Development Milestones (Incremental, Demo-Oriented)

**Last updated:** 2026-02-11 -0500

This roadmap lays out small, demonstrable steps toward a data-driven RTS intent system.
Each milestone targets a vertical slice that can be shown end-to-end: client issues intents → server validates/executes → client receives deltas and updates UI.

---

## M-Foundation: COMPLETE - Baseline Infra and Typed Pipeline

* Goals

  * Ensure local dev environment and data pipeline are in place and reliable.
  * Establish Protobuf-typed state across engine and client with Redis as the transport.
* Deliverables

  * Redis Stack via `docker-compose.yml` with browser UI at `http://localhost:8001/redis-stack/browser`.
  * `rts-engine` POC loop that publishes snapshots/deltas to Redis.
  * Protobuf schemas under `packages/schemas/` and generated TS types in `packages/shared/`.
  * Next.js app can connect and read typed snapshots/deltas from Redis.
* Acceptance Criteria

  * `docker compose up -d` + `pnpm dev` produces live snapshots/deltas; client decodes using generated types.
  * Binary reads from Redis verified; logs/console confirm successful decode and message counts.

---

## M0: COMPLETE 2025-10-02 - Hello-RTS — Single Unit, Single Ability (Move)

* See detailed plan: [docs/milestones/m0-hello-rts.md](./milestones/m0-hello-rts.md)

* Goals

  * Demonstrate a minimal vertical slice using the existing stack: client issues `Move` intent; server processes; client renders.
  * Keep entity definition minimal; defer full data-driven loader to M4.

* Deliverables

  * Users spawn into game with one unit
  * Server-side movement loop: store per-entity position and optional motion target; on each tick, advance toward target at a fixed speed; mark complete on arrival and emit typed deltas.
  * `Move` intent handler: validate ownership and basic pathability (stub path ok), set motion target, mark IN_PROGRESS until arrival.
  * Client: click-to-move UI; selection/hover indicators (using current HUD context); emits `client_cmd_id` per intent.
  * Deltas include position/velocity under protobuf schema; periodic snapshots continue to function.
  * Intent submission path: Phase A (direct injection for demos); Phase B (Redis stream ingestion from `apps/web`).

* Acceptance Criteria

  * Clicking ground enqueues `MoveIntent`; entity moves and arrives; client renders smooth updates.
  * Server logs include intent lifecycle (accepted → in_progress → finished) with correlation IDs (`player_id`, `intent_id`).
  * Schema decoding verified on client; no breaking changes to snapshot/delta pipeline.

---

## M0.1: DONE — Intent Lifecycle, IDs, and Observability Seed
> Adds thin guardrails and hooks without changing gameplay scope.

* Goals

  * Lock the canonical **intent lifecycle** and identifiers.
  * Stamp **`server_tick`** everywhere.
  * Seed **observability + mini-replay** to protect determinism/idempotency later.

* Intent lifecycle (summary)

  * Canonical states: **RECEIVED → ACCEPTED → IN_PROGRESS → BLOCKED? → FINISHED | CANCELED | REJECTED**. Engine emits **LifecycleEvent** per transition with enum reason (`INTERRUPTED`, `DUPLICATE`, `OUT_OF_ORDER`, `INVALID_TARGET`, `PROTOCOL_MISMATCH`, etc.). **IntentEnvelope** carries `client_cmd_id`/`intent_id` (UUIDv7 bytes), `player_id`, `client_seq`, `server_tick`, `protocol_version`, and policy (`REPLACE_ACTIVE` | `APPEND` | `CLEAR_THEN_APPEND`).

* Deliverables (all done)

  * Intent envelope (transport wrapper); lifecycle states & events; identifiers & ordering (UUIDv7, dedupe, client_seq); wire/streams (Redis intents + events); protocol header and mismatch rejection; mini-replay tests (`pnpm test:replay:x`); latency probe CLI (`pnpm run latency:probe`); **schema/contract CI guardrails** (`pnpm schema:check`, GitHub Action; proto changes require version bump or PR label `compat: non-breaking`).

* Details and acceptance criteria: [m0.1-intent-lifecycle.md](./milestones/m0.1-intent-lifecycle.md).

---

## M1: DONE Client-Side Intent Queueing + Replace/Append Semantics (Revised)

### Goals

- Make **queueing a client responsibility** (UX + persistence): the client maintains per-entity FIFO queues for that player.
- Keep the server **authoritative**, but only required to track **one active intent per entity** (no server-side FIFO queue in M1).
- Preserve the same user semantics: `REPLACE_ACTIVE`, `APPEND`, `CLEAR_THEN_APPEND`.

### Key design decision (M1+)

- **Client is the queue.** The client decides when to send the next intent (typically when the prior intent completes).
- **Server is the executor.** The server executes at most one intent per entity at a time; it validates, applies, and emits lifecycle events / state deltas.
- **Policy still exists on the wire**, but in M1 the server only *needs* it to implement **preemption (replace/cancel)** and clear diagnostics.

### Deliverables

#### Server

- Active intent state per entity (`active_intent_id`, `state`, `started_tick`, optional progress).
- **Preemption rules**: `Move` is preemptible; `REPLACE_ACTIVE` cancels the current intent (emit `CANCELED(reason=INTERRUPTED)`), then starts the new one.
- **Busy behavior** (no server queue):
  - If an entity already has an active intent:
    - `REPLACE_ACTIVE`: cancel + start new.
    - `APPEND` / `CLEAR_THEN_APPEND`: **reject** with `REJECTED(reason=ENTITY_BUSY)` (client should not send these while busy).
- Dedup by `client_cmd_id`; per-player `client_seq` validation.
- Tick-bounded ingress: `max_cmds_per_tick`, `max_batch_ms`.
- `protocol_version` on all envelopes; engine refuses mismatched major.

#### Client UX + Local Persistence

- Per-player, per-entity **IntentQueue persisted locally** (e.g., IndexedDB/localStorage) with `client_cmd_id` and `client_seq`.
- Input mapping:
  - Click = `REPLACE_ACTIVE` (clear local queue for those entities, send immediately)
  - Shift+Click = `APPEND` (append locally; send immediately only if entity is idle)
  - Ctrl+Click = `CLEAR_THEN_APPEND` (clear local queue, append one; send immediately only if idle)
- Waypoint/queue UI with small order indices; queue panel lists “local queued” + “server active”.
- Reconciliation:
  - When the server accepts an intent, map `client_cmd_id -> intent_id@server_tick_created` for display.

#### Schema (excerpt)

```protobuf
message IntentEnvelope {
  bytes  client_cmd_id = 1;     // UUIDv7 (16 bytes)
  bytes  intent_id     = 2;     // server-assigned on ACCEPTED (empty on client->server)
  string player_id     = 3;
  uint64 client_seq    = 4;     // per-player increasing
  uint64 server_tick   = 5;     // set by server on ACCEPTED/events
  IntentPolicy policy  = 6;     // REPLACE_ACTIVE | APPEND | CLEAR_THEN_APPEND
  uint32 protocol_version = 7;  // wire protocol major
  oneof payload {
    MoveIntent move = 10;
  }
}
```

### Acceptance Criteria

- **Sequential waypoints (client-queued):**
  - Player Shift-queues 3 moves.
  - Client sends the **first** immediately (if idle), holds the next 2 locally.
  - On `FINISHED` for move #1, client sends move #2; on `FINISHED` for #2, sends #3.
  - Server logs prove intents were **received over time** (not all at once) and executed in order.
- **Interrupt test (replace):**
  - While moving, a non-shift click triggers `REPLACE_ACTIVE`.
  - Server cancels current intent (`CANCELED(INTERRUPTED)`) and starts new target same tick or next.
  - Client clears its local queue and shows only the new active target.
- **Dedup test:**
  - Resubmitting identical `client_cmd_id` does not double-apply; server emits `DUPLICATE` outcome; client state remains consistent.
- **Reconnect test:**
  - Client restarts mid-move with local queued items remaining.
  - Client syncs with server active intent and last processed seq, then continues sending remaining queued intents upon completion.
- **Determinism (server replay):**
  - Mini-replay of the **client→server intent stream** reproduces identical final world hash.

---

## M2: DONE — Networking Robustness + Reconnect Sync (Adjusted)

### Goals

- Idempotent apply via `client_cmd_id`; tolerate reordering/duplication.
- Make reconnect reliable when queues live on the client.

### Deliverables

- 1. **DONE** (M1) Server dedupe store keyed by `(player_id, client_cmd_id)` with TTL.
- 2. **DONE** Per-entity last-processed tracking (per-player `last_processed_client_seq` + per-entity active-intent state persisted to Redis as JSON). See [ADR-003](./adr/003-serialization-strategy-hot-vs-reconnect.md) for serialisation strategy.
- 3. **DONE** Reconnect handshake endpoint (`GET /api/v2/reconnect`) + client-side `reconcileWithServer()` on `IntentQueueManager`:
  - returns `{server_tick, protocol_version, per-entity active_intent_id/state, last_processed_client_seq}`.
  - Client calls on every SSE open (initial + reconnect); advances `clientSeq`, syncs active slots, drains idle queues.
- 4. **DONE** Chaos harness (`crates/sim/tests/chaos.rs`): 11 tests covering reorder, drop, dupe, and combined scenarios with golden xxh3 hash assertions. In-memory dedupe added to `sim::Engine`.

### Acceptance Criteria

- **DONE** Synthetic tests pass for reorder/dupe scenarios; world hashes match golden results (`cargo test -p sim chaos` — 11 tests).
- **DONE** Reconnect scenario reliably resumes client queues without duplicated or skipped intents (reconnect handshake + `reconcileWithServer()`).
- **DONE** (M0.1) Wire major mismatch rejected with clear error.

---

## M3: **DONE** — Movement Polish (Pathfinding Deferred)

> **Scope change:** Pathfinding (grid/navmesh, incremental replanning, obstacle
> detour) is deferred to a future milestone.  There is no concept of obstacles
> or terrain in the game yet, so building pathfinding now would require inventing
> placeholder geometry with no guarantee those abstractions survive real game
> design decisions (tile-based? navmesh? destructible?).  Pathfinding will slot
> in naturally once obstacles are introduced, likely after M5 or M6 when there
> are multiple ability types and game objects to navigate around.
>
> M3 retains the **movement polish** deliverables, which have immediate value:
> the engine already has `stop_radius` and `MotionTarget` in the schema, but
> arrival stabilisation and oscillation prevention had not been formally tested
> or hardened.

### Goals

- Harden arrival behavior: configurable **stop radius**, no oscillation.
- Clean cancel-mid-move when `REPLACE_ACTIVE` preempts.

### Deliverables

- **DONE** — No oscillation at destination; configurable `stop_radius`. Overshoot
  clamping in both `sim` and `rts-engine`: when `speed × dt ≥ effective distance`,
  the entity snaps to the stop boundary instead of overshooting and oscillating.
  (`sim/src/systems.rs::tick_movement`, `rts-engine/src/engine/intent.rs::follow_targets`)
- **DONE** — Clear behavior when `REPLACE_ACTIVE` arrives mid-move: velocity is
  zeroed immediately on replacement, preventing residual drift from the old
  direction. (`sim/src/intent.rs::apply_intent`)
- **DONE** — Arrival stabilization verified in `sim/tests/movement.rs` (6 tests)
  with golden hashes: arrival within stop radius, no-oscillation at boundary,
  immediate arrival, replace-active mid-move, stationary no-drift,
  two-entities-same-target. Chaos and determinism golden hashes regenerated.

### Acceptance Criteria

- **DONE** — Arrival stabilization within ≤ 1 tick of reaching stop radius (overshoot
  clamp snaps on the exact tick); replay equals golden hash.
- **DONE** — Mid-move preemption leaves no residual velocity or drift.

### Deferred to future milestone

- Grid or navmesh pathfinder with incremental replanning.
- Path component + path-follow system; recompute budget ≤ configured µs/tick.
- Obstacle detour demo.
- **Facing / orientation**: The velocity vector encodes direction while moving
  (`atan2(vel.y, vel.x)`), but a zero velocity vector has no direction.  A
  dedicated `facing` field on `Entity` is not needed today — there are no
  buildings, turrets, or abilities that depend on orientation while stationary.
  Add `float facing` to the proto schema when a consumer exists (likely M5
  abilities or when static structures are introduced).

---

## M4: **DONE** Data-Driven Entities (Static), Content Hash, and Pinning (Handshake Explicit)

### Goals

- JSON/YAML entity/ability defs; deterministic build-time **content hash**.
- Server handshake emits `{protocol_version, content_version}`; client logs both and warns on mismatch.

### Deliverables

- Loader at server startup; content hash ignores whitespace/map ordering.
- Client stores `content_version` alongside its persisted local queues and warns if they were created under a different content pack.

### Acceptance Criteria

- M0–M3 behaviors unchanged under content pinning; client refuses unknown major protocol.

---

## M5: Camera + World Space + Map UX (Client-first)
see docs/milestones/m5/m5-camera-worldspace-mapux.md for details

### Goals

- Establish a stable **world-coordinate space** and camera transform for all future gameplay.
- Improve demoability and “RTS feel” without expanding server simulation scope.

### Deliverables

- Client camera:
  - Pan/scroll over the world (WASD).
  - Show absolute world coordinates on screen
  - Correct screen→world coordinate conversion for click-to-move and selection.
- Deterministic, procedural background generated from **world coordinates** (consistent for all clients). See docs/milestones/m5/procedurally-generated-background.md for details
- Minimap v1 (full reveal for now):
  - 1/10th scale
  - Shows unit dots and viewport rectangle.

### Acceptance Criteria

- Panning does not break click targeting (move/selection still land in correct world coordinates).
- Background is identical for all clients at the same world coordinates.
- Minimap tracks camera position correctly.

---

## M6: Player Ownership + Spawn + Control Gating

### Goals

- Introduce **player ownership** for entities.
- Ensure players spawn with a minimal owned set and can only command what they own.

### Deliverables

- Schema/content:
  - `owner_player_id` (or equivalent) on entities; support `neutral` ownership for resources.
- Server:
  - Spawn rules on join: each player receives starting entities at a spawn point.
  - Validation: reject intents targeting entities not owned by the issuing player.
- Client:
  - Selection/command UI only operates on owned units.
  - Owned-vs-nonowned visuals (simple outline tint is fine).

### Acceptance Criteria

- With two clients connected, each can only issue commands for their own units; server rejects cross-control deterministically.
- Reconnect continues to reconcile ownership-correct active intents.

---

## M7: Resource Ledger + Resource HUD

### Goals

- Add the authoritative numbers layer needed for gathering and production.
- Make resources visible in the UI early to support later milestones.

### Deliverables

- Server:
  - Per-player resource ledger (authoritative).
  - Deltas/events for resource changes keyed by `player_id`.
- Client:
  - HUD component that shows current resources and updates live.
  - Resource state is pinned to `{protocol_version, content_version}` like other state.

### Acceptance Criteria

- Resource totals in the HUD match server state across reconnect and replay.
- Ledger updates remain deterministic (golden hash unchanged under replay).

---

## M8: Resource Nodes + Gathering Loop + Refinery Deposit

### Goals

- Deliver a full economy loop: gather → carry → deposit → repeat.
- Introduce a **maintained/continuous behavior** intent pattern (without scripting).

### Deliverables

- Entities:
  - Resource node entity with remaining amount (finite or infinite for v1).
  - Refinery building entity (owned, static).
  - Worker unit with carry capacity.
- Server (simulation rules):
  - Gather behavior:
    - Move into gather range.
    - Gather ticks until carry is full or node is empty.
    - Auto-travel to **nearest owned refinery**; deposit; return to node; repeat.
  - Interruption:
    - `REPLACE_ACTIVE` cancels gathering immediately and the worker obeys the new command.
- Client:
  - Basic feedback: gathering state indicator; node/refinery icons; minimap icons.

### Acceptance Criteria

- A worker can be redirected mid-loop and immediately stops the old behavior.
- Two players gathering from the same node behaves deterministically (tie rules documented).

---

## M9: Unit Production (Costs, Build Time, Spawn)

### Goals

- Convert resources into new units over time.
- Provide a second, demo-friendly economic loop: gather → build → rally.

### Deliverables

- Server:
  - Production ability on a building (refinery or separate producer building).
  - Resource costs applied deterministically (pay upfront or reserve; rules documented).
  - Build timer; unit spawns on completion at a spawn offset / rally point.
  - Cancel rules (refund policy documented).
- Client:
  - Build UI (simple buttons) + production progress indicator.
  - Optional: client maintains a **local build queue** (UX) while server remains active-only.

### Acceptance Criteria

- Replays reproduce identical unit spawn timing and positions.
- Cancel/refund behavior is deterministic and visible in HUD.

---

## M10: Combat v1 — Attack Target / Attack-Move + Ranged Projectiles

### Goals

- Introduce maintained combat behaviors with clear interruption semantics.
- Add projectile visuals/events for ranged attacks.

### Deliverables

- Server:
  - Health, damage, and death/despawn.
  - Attack behavior:
    - Acquire/maintain target.
    - Move into attack range.
    - Attack at fixed cadence.
    - Pursue if target moves out of range (if allowed by unit).
    - Stop on interruption, target death, or attacker death.
  - Projectile event stream (visual-only is OK): emit “shot fired” events with positions and tick.
- Client:
  - Show projectiles (missile/bullet/laser style).
  - Hit feedback and health bars.

### Acceptance Criteria

- `REPLACE_ACTIVE` immediately interrupts attack; server emits clear lifecycle reason.
- Combat outcomes are deterministic under replay (including projectile events if derived from sim ticks).

---

## M11: AoE + Periodic Effects (Distance Falloff)

### Goals

- Support area damage patterns (e.g., radiation aura) with distance-based falloff.
- Keep computation/networking cheap and deterministic.

### Deliverables

- Server:
  - AoE source component/system:
    - Applies damage periodically to entities in radius.
    - Falloff by distance (e.g., inverse-square or a simple squared-distance curve).
  - Clear stacking rule for overlapping AoEs (additive or max—document it).
- Client:
  - Optional radius visualization for debugging and tuning.

### Acceptance Criteria

- Overlapping AoEs produce predictable results (documented stacking/order).
- Replay produces identical world hash.

---

## M12: Fog-of-War v1 (Cheap + Network-Friendly)

### Goals

- Prevent players from seeing everything while keeping CPU/bandwidth reasonable.
- Integrate fog with minimap and selection.

### Deliverables

- Server:
  - Visibility radius per unit type (from content defs).
  - Per-player visible set computed on a configurable cadence (every tick or every N ticks).
  - Delta filtering:
    - Entities outside visibility omitted or reduced to “last-known” (choose and document).
- Client:
  - Fog rendering:
    - Unexplored = hidden
    - Explored but not visible = darkened (optional in v1; OK to do visible-only first)
  - Minimap integrates fog/visibility.

### Acceptance Criteria

- A client cannot infer unseen enemy unit positions from deltas beyond what rules explicitly allow.
- Bandwidth scales with visible entities rather than total world size in basic tests.

---

# Invariants

- **Determinism:** Same input stream + same tick schedule ⇒ same world hash (`xxh3` over sorted entities).
- **Idempotency:** Reapplying any subset of already-applied commands/deltas does not change world hash.
- **Latency budgets (dev/LAN):** Submit → first referenced delta ≤ 50ms p50 / 150ms p95.
- **Backpressure:** Define behavior when server is overloaded (`max_cmds_per_tick`, batch ms, reject reasons) and surface it in UI & logs.
- **Client queue persistence:** Client queues survive refresh/restart; reconnect handshake prevents duplicates/skips.
- **Visibility (post-M12):** A player’s client must not receive state for unseen enemy entities except what the rules explicitly allow (e.g., last-known ghosts if implemented).
- **Persistence:** On server restart, recover from latest snapshot + input stream offset at minimum.

---

## Implementation Order Notes (Updated)

- M0 gameplay → M0.1 guardrails (lifecycle/IDs/ticks/replay/latency).
- **M1 implements client queues + server active-only execution**, with replace preemption.
- M2 hardens ordering/idempotency and makes reconnect bulletproof.
- M3 (movement polish) improves the existing demo immediately; pathfinding remains deferred until obstacles/terrain exist.
- M4 introduces content pinning and deterministic content hashing.
- M5 improves client world navigation (camera/minimap/background) to support all later demos.
- M6 establishes ownership/spawn/control gating.
- M7 adds the resource ledger + HUD.
- M8–M9 deliver the economy loop (gather → deposit → build).
- M10–M11 deliver combat (targeted + AoE).
- M12 adds fog-of-war and per-player visibility filtering.

---

## Demo Checklist Template (per milestone)

- Feature toggle(s) and build steps documented.
- Commands to start server and client.
- **Three always-on checks:**
  1. **Determinism** (replay last N inputs → identical hash),
  2. **Idempotency** (dedupe/reapply checks → identical hash),
  3. **Latency** (p50/p95 metrics file).
- Demo script (click path) with expected outcomes.
- Logs/metrics to verify acceptance criteria.
