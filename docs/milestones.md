# Development Milestones (Incremental, Demo-Oriented)

**Last updated:** 2025-10-02 08:00:00 -0400

This roadmap lays out small, demonstrable steps toward the full data-driven, scriptable, long-running RTS intent system.
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

## M3: Pathfinding Integration and Movement Polish (No Queue Assumptions)

### Goals

- Grid or navmesh pathfinder with incremental replanning; add **stop radius** and **arrival facing**.

### Deliverables

- Path component + path-follow system; recompute budget ≤ configured µs/tick.
- No oscillation at destination; configurable `stop_radius` and final `facing`.
- Clear behavior when a `REPLACE_ACTIVE` arrives mid-path (cancel old path cleanly).

### Acceptance Criteria

- Obstacle detour demo; arrival stabilization within ≤ 2 ticks; replay equals golden hash.

---

## M4: Data-Driven Entities (Static), Content Hash, and Pinning (Handshake Explicit)

### Goals

- JSON/YAML entity/ability defs; deterministic build-time **content hash**.
- Server handshake emits `{protocol_version, content_version}`; client logs both and warns on mismatch.

### Deliverables

- Loader at server startup; content hash ignores whitespace/map ordering.
- Client stores `content_version` alongside its persisted local queues and warns if they were created under a different content pack.

### Acceptance Criteria

- M0–M3 behaviors unchanged under content pinning; client refuses unknown major protocol.

---

## M5: Abilities as First-Class Intents (Client Queue Still Applies)

### Goals

- Generalize intents to `Ability`; model `Move` as `Ability(move)` with targeting schema; add cooldowns.

### Deliverables

- Ability registry (server-native), targeting validation, cooldown tracking.
- Client queue UI shows ability name + target + “may fail” warnings (cooldown/resource).
- Server rejection reasons surfaced in UI; client decides whether to keep or drop subsequent queued items on reject.

### Acceptance Criteria

- `Move` respects cooldown; invalid targets rejected with clear reasons; replace semantics still preempt.

---

## M6: Reservations and Basic Resources (v1)

### Goals

- Simple resource ledger + reservation/escrow; example ability “Dash” that consumes resource and has cast time.

### Deliverables

- Escrow keyed by `intent_id`; refund rules on cancel; progress tracking for cast/channel.
- Client queue behavior for “cast time” intents: show progress; allow `REPLACE_ACTIVE` to cancel and refund.

### Acceptance Criteria

- Double-spend prevention proven with two players racing; refunds verified on cancel paths.

---

## M7: Server-Side Scripting (Lua) Pilot — Guardrails First

### Goals

- Sandboxed Lua for one ability (e.g., `Dash`): `canExecute` and `onTick`.

### Deliverables

- Deterministic RNG seeded by `match_id`; CPU/memory quotas (instruction step + wall-clock).
- `SCRIPT_ERROR` unwinds reservations and active intent safely; client receives clear failure reason.

### Acceptance Criteria

- Scripted `Dash` runs deterministically across replays; failures do not corrupt state.

---

## M8: Ability Library and Versioning (Match-Pinned)

### Goals

- Match-scoped mapping `ability_id -> current_version`; version-aware dispatch; echo `ability_id@version_used`.

### Deliverables

- VM/module cache keyed by version; upgrade affects **new** intent executions only.
- Client persists queued intents with `{ability_id, desired_version?}` or “server decides”, plus UX warning if queue was built under older content.

### Acceptance Criteria

- Upgrading an ability toggles behavior for new intents; in-flight intent keeps prior version, verified in replay.

---

## M9: Long-Running Match Evolution (Maintenance Tick) — Adjusted for Client Queues

### Goals

- Maintenance tick concept; simulate content pack upgrade and reconcile client-queued intents.

### Deliverables

- Server publishes a “maintenance/upgrade notice” including `{content_version_old -> new, effective_tick}`.
- Client-side migration rules for **queued (not-yet-sent) intents**:
  - drop incompatible,
  - rewrite targets where possible,
  - or prompt user / mark as “needs review.”
- Server-side policy for **active** intents during upgrade (finish current, cancel, or migrate).

### Acceptance Criteria

- Demo shows upgrade: active intent handled per policy; client queue is migrated/trimmed and continues to execute.

---

## M10: Observability and Replay v1 — Deepen the Seeds (Queue Metrics Shift)

### Goals

- Structured logs for lifecycle/script errors; metrics for acceptance/reject rates and preemption.
- Replay replays the **client→server intent stream** tied to a `{protocol_version, content_version}` with golden runs in CI.

### Deliverables

- Log schema; metrics export; `replay:from-stream` tooling.
- Metrics include:
  - server: active intents, cancels, rejects, dedupe hits
  - client (optional telemetry): local queue lengths and drop reasons

### Acceptance Criteria

- Replays produce identical outcomes across runs with same `{content_version, protocol_version}`; CI golden job passes.

---

## Cross-Cutting Invariants (apply to all milestones from M0.1 onward)

- **Determinism:** Same input stream + same tick schedule ⇒ same world hash (`xxh3` over sorted entities).
- **Idempotency:** Reapplying any subset of already-applied commands/deltas does not change world hash.
- **Latency budgets (dev/LAN):** Submit → first referenced delta ≤ 50ms p50 / 150ms p95.
- **Backpressure:** Define behavior when server is overloaded (`max_cmds_per_tick`, batch ms, reject reasons) and surface it in UI & logs.
- **Client queue persistence:** Client queues survive refresh/restart; reconnect handshake prevents duplicates/skips.
- **Persistence:** On server restart, recover from latest snapshot + input stream offset at minimum.

---

## Implementation Order Notes (Updated)

- M0 gameplay → M0.1 guardrails (lifecycle/IDs/ticks/replay/latency).
- **M1 implements client queues + server active-only execution**, with replace preemption.
- M2 hardens ordering/idempotency and makes reconnect bulletproof.
- M3–M6 expand movement/abilities/resources without assuming server-side FIFO.
- M7–M9 add scripting and version/evolution controls, with explicit client-queue migration.
- M10 formalizes observability/replay already seeded in M0.1 and exercised along the way.

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
