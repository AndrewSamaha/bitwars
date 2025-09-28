# M0: Hello-RTS — Single Unit Click-to-Move

Last updated: 2025-09-28 12:28:49 -0400

This milestone delivers a minimal, end-to-end demo of server-authoritative movement using the existing stack: client issues a Move intent; server validates and advances motion per tick; client decodes typed deltas and renders smooth updates.

## Current state (baseline)

- Engine tick loop and publishing
  - `services/rts-engine/src/engine/mod.rs` — `Engine::run()` advances state and publishes deltas/snapshots.
  - `services/rts-engine/src/physics.rs` — currently applies random forces and integrates with damping.
  - `services/rts-engine/src/engine/state.rs` — `GameState { tick, entities }` where `entities` are protobuf `Entity`.
  - `services/rts-engine/src/io/redis.rs` — publishes `Delta` (Redis stream) and `Snapshot` (key + meta hash).
- Protobuf types (subset)
  - `services/rts-engine/src/pb/bitwars.rs` — `Entity { id, pos, vel, force }`, `EntityDelta` (sparse), `Snapshot`, `Delta`.
- Client app
  - `apps/web/` — Next.js app with dev routes and utilities; can read snapshots/deltas with generated TS types.

## Goals

- Server-authoritative movement loop for one unit.
- Client click-to-move UX that issues a Move intent with `client_cmd_id`.
- Deterministic advancement toward a target at a fixed speed with arrival detection.
- Typed deltas (pos/vel) flow end-to-end.

## Deliverables

- Users spawn into game with one unit. [DONE]
- Server-side movement loop (framework-agnostic): store per-entity position and optional motion target; each tick, advance position toward target at a fixed speed; mark complete on arrival and emit typed deltas. [DONE]
- Intent submission path (Phase A: direct injection for demos; Phase B: Redis stream ingestion from `apps/web`). [DONE via Redis stream ingestion + CLI]
- Lifecycle logging: accepted → in_progress → finished with correlation IDs. [DONE]

## Engine specifics (rts-engine)

- Data structures (minimal, hand-rolled; no ECS framework needed):
  - Plan (earlier doc): embed queues/targets in `GameState` and use Rust enums.
  - Actual (current code): use protobuf-backed intents and a manager module:
    - `services/rts-engine/src/engine/intent.rs`: `IntentManager` maintains `intent_queues` and `current_action` per entity.
    - Uses protobuf `packages/schemas/proto/intent.proto` (`pb::Intent`, `ActionState`, `MoveState`, `MotionTarget`).
    - Motion target is represented inside `ActionState::Move` rather than a separate `GameState` map.

- Tick pipeline changes (`services/rts-engine/src/engine/mod.rs`): [DONE]
  1. Ingest intents from Redis stream `intents:{game_id}` and log accept.
  2. `IntentManager::process_pending()` starts next actions per entity.
  3. `IntentManager::follow_targets(&mut state, cfg.default_entity_speed, dt)` sets velocity, detects arrival, logs finish.
  4. `integrate(...)` applies velocity to position.
  - Random forces removed from the loop for M0 (no longer applied).

- Config additions (`services/rts-engine/src/config.rs`): [PARTIAL]
  - `default_entity_speed: f32` [DONE]
  - `default_stop_radius: f32` [DONE]
  - `enable_random_forces: bool` [OPTIONAL / N/A for M0] (random forces are disabled in code)

## API and data contracts

- Protobuf schema changes: [DIFFERS]
  - Earlier plan: none required for M0.
  - Actual: introduced `packages/schemas/proto/intent.proto` and server uses protobuf intents and action state. This is acceptable and will carry into later milestones.
- Intent transport (Phase B): [DONE]
  - Redis Stream `intents:{game_id}` entries with a single field `data` (binary) carrying a protobuf `Intent`.
  - Suggested JSON payload for fast iteration:
    ```json
    {
      "type": "Move",
      "entity_id": 1,
      "target": { "x": 50.0, "y": 75.0 },
      "client_cmd_id": "uuid-...",
      "player_id": "p1"
    }
    ```
  - On ingest: validate ownership (stub allowed in M0), enqueue into `intent_queues`.

## Logs and observability

- On accept: [DONE]
  - `accept intent=Move client_cmd_id=... player_id=... entity_id=... target=(x,y) tick=...`
- On start (target set): [DONE]
  - `start intent=Move client_cmd_id=... entity_id=... target=(x,y) tick=...`
- On finish (arrival): [DONE]
  - `finish intent=Move client_cmd_id=... entity_id=... tick=...`
- Once per second summary (already present via `log_sample`):
  - `tick=... | id:1 pos=(...), vel=(...) ...`

## Acceptance criteria

- Clicking ground enqueues a Move intent with a `client_cmd_id`. [PARTIAL] (tested via CLI + client visualization; web POST wiring can follow in Phase B)
- Server applies Move deterministically; entity advances to target and arrives (within `stop_radius`). [DONE]
- Client decodes protobuf deltas and renders smooth motion. [DONE]
- Logs show accepted → in_progress → finished with correlation IDs. [DONE]

## Demo steps

1. Start infra and dev processes
   ```bash
   docker compose up -d
   pnpm dev
   ```
2. Open app, verify the user spawns with one unit.
3. Click a destination on the map; confirm Move intent is sent and logged with `client_cmd_id`.
4. Watch the unit move and arrive; verify deltas in the client and that logs show lifecycle completion.
5. Optional: use Redis UI at `http://localhost:8001/redis-stack/browser` to observe deltas stream and snapshot.

## Phase plan

- Phase A (internal proof):
  - Provide a dev-only path to enqueue Move intents (engine example or admin route) and validate server movement loop.
- Phase B (integrated path):
  - Implement Redis stream ingestion for intents and wire web `POST /api/move` (or equivalent) to write Move payloads.

## Open questions

- Ownership validation for M0 vs later (stub now, enforce later when auth/session are ready).
- Numeric stability: ensure speed/integration work consistently with current `integrate` damping; may disable damping while target-following to avoid drift.
- Whether to expose `target` in deltas for UI markers in M0 or defer to M1.
