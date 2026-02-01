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

DONE: see docs/milestones/m0.1-intent-lifecycle.md for deliverables and acceptance criteria

---

## M1: Intent Queueing and Replace/Append Semantics (Revised)

* Goals

  * Per-entity **FIFO IntentQueue** with policies: `REPLACE_ACTIVE`, `APPEND`, `CLEAR_THEN_APPEND`.
  * **Shift-queueing** on client; visible waypoint ghosts; echo queue state with `intent_id@server_tick_created`.

* Deliverables

  * **Server**

    * `IntentQueue` component; queue processor integrated into tick loop.
    * **Preemption rules**: `Move` is preemptible; interruption emits `CANCELED(reason=INTERRUPTED)`.
    * Dedup by `client_cmd_id`; per-player `client_seq` validation (store last seen; drop older).
    * Tick-bounded batching: `max_cmds_per_tick`, `max_batch_ms`.
    * `protocol_version` attached on all envelopes; engine refuses mismatched major.
  * **Client UX**

    * Click = `REPLACE_ACTIVE`; **Shift+Click** = `APPEND`; **Ctrl+Click** = `CLEAR_THEN_APPEND`.
    * Waypoint/queue UI with small order indices; hovering shows policy tooltip.
    * Queue panel lists intents as `[#] Move → (x,y) — intent_id@server_tick`.
  * **Schema (excerpt)**

    ```protobuf
    message IntentEnvelope {
      bytes  client_cmd_id = 1;   // UUIDv7 (16 bytes)
      bytes  intent_id     = 2;   // server-assigned
      string player_id     = 3;
      uint64 client_seq    = 4;   // per-player increasing
      uint64 server_tick   = 5;   // set on ACCEPTED
      IntentPolicy policy  = 6;   // REPLACE_ACTIVE | APPEND | CLEAR_THEN_APPEND
      uint32 protocol_version = 7; // wire protocol major
      oneof payload {
        MoveIntent move = 10;
      }
    }
    ```

* Acceptance Criteria

  * **Sequential waypoints**: 3 Shift-queued moves execute in order; arrival within `stop_radius` marks FINISHED.
  * **Interrupt test**: a non-shift click mid-route cancels current + clears future, new target starts same tick or next; logs show `CANCELED(INTERRUPTED)` and new `ACCEPTED`.
  * **Dedup test**: resubmitting identical `client_cmd_id` does not duplicate queue entries (UI count & logs prove it).
  * **Determinism**: mini-replay of the input stream reproduces identical final world hash and the same queue history.
  * **Latency report**: p50/p95 printed for M1 demo run and stored to `./.metrics/latest.json`.

---

## M2: Basic Networking Robustness (Ordering, Idempotency, Batching) — *tightened*

* Goals

  * Idempotent apply via `client_cmd_id`; tolerate reordering/duplication; tick-bounded batching.

* Deliverables

  * Dedupe store keyed by `(player_id, client_cmd_id)` with TTL.
  * Chaos harness: reorder, drop, dupe; assertions for single apply and correct final state.
  * All deltas/events include `server_tick` and `protocol_version`.

* Acceptance Criteria

  * Synthetic tests (CI) pass for reorder/dupe scenarios; world hashes match golden results.
  * Wire version mismatch (major) is rejected with a clear error.

---

## M3: Pathfinding Integration and Movement Polish — *clarified invariants*

* Goals

  * Grid or navmesh pathfinder with incremental replanning; add **stop radius** and **arrival facing**.

* Deliverables

  * Path component + path-follow system; recompute budget ≤ configured µs/tick.
  * No oscillation at destination; configurable `stop_radius` and final `facing`.

* Acceptance Criteria

  * Obstacle detour demo; arrival stabilization within ≤ 2 ticks; replay equals golden hash.

---

## M4: Data-Driven Entities (Static), Content Hash, and Pinning — *handshake explicit*

* Goals

  * JSON/YAML entity/ability defs; deterministic build-time **content hash**.
  * Server handshake emits `{protocol_version, content_version}`; client logs both and warns on mismatch.

* Deliverables

  * Loader at server startup; content hash ignores whitespace/map ordering.
  * Logs surface the pinned content on both sides.

* Acceptance Criteria

  * M0–M3 behaviors unchanged under content pinning; client refuses unknown major protocol.

---

## M5: Abilities as First-Class Intents (Simple, No Scripting Yet)

* Goals

  * Generalize intents to `Ability`; model `Move` as `Ability(move)` with targeting schema; add cooldowns.

* Deliverables

  * Ability registry (server-native), targeting validation, cooldown tracking.
  * UI surfaces **rejected** reasons (e.g., `COOLDOWN`) and disabled states.

* Acceptance Criteria

  * `Move` respects cooldown; invalid targets rejected with clear reasons; queue respects ability readiness.

---

## M6: Reservations and Basic Resources (v1)

* Goals

  * Simple resource ledger + reservation/escrow; example ability “Dash” that consumes resource and has cast time.

* Deliverables

  * Escrow keyed by `intent_id`; refund rules on cancel; progress tracking for cast/channel.

* Acceptance Criteria

  * Double-spend prevention proven with two clients racing; refunds verified on cancel paths.

---

## M7: Server-Side Scripting (Lua) Pilot — *guardrails first*

* Goals

  * Sandboxed Lua for one ability (e.g., `Dash`): `canExecute` and `onTick`.

* Deliverables

  * Deterministic RNG seeded by `match_id`; CPU/memory quotas (instruction step + wall-clock).
  * `SCRIPT_ERROR` unwinds reservations/queues safely; golden determinism test included.

* Acceptance Criteria

  * Scripted `Dash` runs deterministically across replays; failures surface clearly and do not corrupt state.

---

## M8: Ability Library and Versioning (Match-Pinned)

* Goals

  * Match-scoped mapping `ability_id -> current_version`; version-aware dispatch; echo `ability_id@version_used`.

* Deliverables

  * VM/module cache keyed by version; upgrade affects **new** evaluations only.

* Acceptance Criteria

  * Upgrading an ability toggles behavior for new intents; in-flight intents keep prior version, verified in replay.

---

## M9: Long-Running Match Evolution (Maintenance Tick)

* Goals

  * Maintenance tick concept; simulate content pack upgrade and queued-intent migration.

* Deliverables

  * Upgrade orchestration with **dry-run “what would migrate”** metrics before mutating queues.

* Acceptance Criteria

  * Demo shows auto-upgrade for compatible queues and explicit policy for incompatible ones.

---

## M10: Observability and Replay v1 — *deepen the seeds*

* Goals

  * Structured logs for lifecycle/script errors; metrics for queue lengths & acceptance rate.
  * Minimal replay that replays from input stream tied to a content version, with **golden runs in CI**.

* Deliverables

  * Log schema; metrics export; `replay:from-stream` tooling; timeline view (text/UI) stitching lifecycle for a single intent.

* Acceptance Criteria

  * Replays produce identical outcomes across runs with same `content_version`; CI golden job passes.

---

## Cross-Cutting Invariants (apply to all milestones from M0.1 onward)

* **Determinism:** Same inputs + same tick schedule ⇒ same world hash (`xxh3` over sorted entities).
* **Idempotency:** Reapplying any subset of already-applied deltas does not change world hash.
* **Latency budgets (dev/LAN):** Submit → first referenced delta ≤ 50ms p50 / 150ms p95.
* **Backpressure:** Define behavior when `IntentQueue` > N (reject, drop oldest, or throttle), and surface it in UI & logs.
* **Persistence:** On restart, recover from latest snapshot + input stream offset at minimum.

---

## Implementation Order Notes

* Finish **M0** gameplay → immediately land **M0.1** guardrails (lifecycle/IDs/ticks/replay/latency).
* M1–M3 harden queueing & movement with robustness and simple pathfinding.
* M4–M6 introduce content pinning and a basic resource/escrow model.
* M7–M9 add scripting and version/evolution controls.
* M10 formalizes observability/replay already seeded in M0.1 and exercised along the way.

---

## Demo Checklist Template (per milestone)

* Feature toggle(s) and build steps documented.
* Commands to start server and client.
* **Three always-on checks:**

  1. **Determinism** (replay last N → identical hash),
  2. **Idempotency** (double-apply last K deltas on a clone → identical hash),
  3. **Latency** (p50/p95 metrics file).
* Demo script (click path) with expected outcomes.
* Logs/metrics to verify acceptance criteria.
