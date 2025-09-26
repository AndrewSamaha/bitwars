# Development Milestones (Incremental, Demo-Oriented)

Last updated: 2025-09-26 06:50:11 -0400

This roadmap lays out small, demonstrable steps toward the full data-driven, scriptable, long-running RTS intent system.
Each milestone targets a vertical slice that can be shown end-to-end: client issues intents → server validates/executes → client receives deltas and updates UI.

## M0: Hello-RTS — Single Unit, Single Ability (Move)

- Goals
  - Server-authoritative loop with fixed tick (e.g., 20–30 Hz).
  - Define one entity type `worker` with movement stats in static JSON.
  - Implement one ability: `Move` to a point.
  - Implement intent pipeline: client → server `MoveIntent` → server executes path/motion → deltas to client.
  - No queueing, no combat, no resources.
- Deliverables
  - Minimal ECS: `Transform`, `Velocity`, `Mover`.
  - Intent handler for `Move`: validate ownership and pathability; set a motion target; IN_PROGRESS until arrival.
  - Deltas: position/velocity; periodic snapshots.
  - Demo UI: click-to-move a single unit; show current target and simple progress.
- Acceptance Criteria
  - Click creates a `MoveIntent`; unit moves with basic steering; client receives smooth position updates.
  - Server logs include intent lifecycle (accepted → in_progress → finished) and `intent_id` correlation.

## M1: Intent Queueing and Replace/Append Semantics

- Goals
  - Per-entity FIFO intent queue with modifiers: replace current, append, clear.
  - Shift-queueing on client.
- Deliverables
  - `IntentQueue` component and queue processor.
  - Client UX to queue multiple moves (e.g., waypoints) with simple icons.
- Acceptance Criteria
  - Queued waypoints execute sequentially; replace/append/clear behaves as expected.

## M2: Basic Networking Robustness (Ordering, Idempotency, Batching)

- Goals
  - Add `client_cmd_id` and per-player sequence numbers; idempotent server apply.
  - Batch intents per tick; tolerate out-of-order delivery.
- Deliverables
  - Server dedupe by `client_cmd_id`; log duplicates dropped.
  - Wire protocol messages versioned; include `server_tick` with deltas.
- Acceptance Criteria
  - Synthetic network tests show correct behavior under reordering/duplication.

## M3: Pathfinding Integration and Movement Polish

- Goals
  - Integrate a simple grid or navmesh pathfinder with incremental replanning.
  - Add stop radius and facing at destination.
- Deliverables
  - Path component and path-following system; basic avoidance parameters.
- Acceptance Criteria
  - Units navigate around obstacles; movement feels stable at destination.

## M4: Data-Driven Entities (Static), Content Hash, and Pinning

- Goals
  - Move entity/ability definitions to JSON/YAML with a build-time content hash.
  - Server advertises `content_version` in handshake; client verifies.
- Deliverables
  - Loader for definitions into memory at server startup.
  - Deterministic content hash calculation and logging.
- Acceptance Criteria
  - M0–M3 features work unchanged under content pinning.

## M5: Abilities as First-Class Intents (Simple, No Scripting Yet)

- Goals
  - Generalize intents to include `Ability` type; model `Move` as an ability with a targeting schema.
  - Add per-ability cooldown to show the pattern.
- Deliverables
  - Ability registry, targeting validation, cooldown tracking.
- Acceptance Criteria
  - `Move` obeys cooldown; invalid targets are rejected with clear reasons.

## M6: Reservations and Basic Resources (v1)

- Goals
  - Introduce a simple resource ledger and reservation manager.
  - Add a cheap test ability (e.g., "Dash") that consumes resource and has a short cast time.
- Deliverables
  - Reservation API (hard at start) and escrow handling; progress tracking for cast/channel.
- Acceptance Criteria
  - Resource checks/escrows prevent double-spend; refunds on cancel rules demonstrated.

## M7: Server-Side Scripting (Lua) Pilot

- Goals
  - Add sandboxed Lua; implement `canExecute` and `onTick` for one ability (e.g., `Dash`).
  - Deterministic RNG; CPU/memory quotas; error handling.
- Deliverables
  - VM pool, hook API, minimal `ctx` surface; golden test for determinism.
- Acceptance Criteria
  - Ability logic runs in Lua deterministically; failures surface as `SCRIPT_ERROR` with logs.

## M8: Ability Library and Versioning (Match-Pinned)

- Goals
  - Introduce match-scoped Ability Library mapping `ability_id -> current_version`.
  - Echo `ability_id@version_used` in server updates for UI/replay.
- Deliverables
  - Version-aware script dispatch; VM/module cache keyed by versioned IDs.
- Acceptance Criteria
  - Upgrading an ability version (dev switch) affects new evaluations; in-progress actions keep prior version.

## M9: Long-Running Match Evolution (Maintenance Tick)

- Goals
  - Implement a maintenance tick concept; simulate a content pack upgrade.
  - Auto-migrate queued intents where compatible; policy for incompatible queues.
- Deliverables
  - Upgrade orchestration; migration evaluation for queued intents; metrics/logging.
- Acceptance Criteria
  - Simple scenario demonstrates ability auto-upgrade and queued intent migration behavior.

## M10: Observability and Replay v1

- Goals
  - Structured logs for intent lifecycle and script errors; metrics for queue lengths, acceptance rate.
  - Minimal replay that replays from input stream tied to a content version.
- Deliverables
  - Log schema; basic metrics export; replay tooling.
- Acceptance Criteria
  - Replays produce identical outcomes across runs with same content version.

---

## Implementation Order Notes
- Focus first on M0–M3 to establish the core loop and robustness.
- M4–M6 introduce the data model and reservations while keeping logic server-native.
- M7–M9 add scripting and version/evolution controls.
- M10 adds observability and replay to support iteration and debugging.

## Demo Checklist Template (per milestone)
- Feature toggle(s) and build steps documented.
- Commands to start server and client.
- Demo script (click path) with expected outcomes.
- Logs/metrics to verify acceptance criteria.
