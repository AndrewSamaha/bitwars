# Entity Intent System Requirements

Last updated: 2025-09-26 06:42:01 -0400

## Purpose

Define a robust, RTS-style intent system where players issue commands (intents) for entities (units/buildings). The authoritative server validates and executes intents, and the client receives entity state deltas/snapshots. Supports queued commands, long-running actions, prediction, and reconciliation.

## Core Concepts

- **Intent**
  - Identifiers: `intent_id`, `client_cmd_id` (idempotency), `issued_at`, `tick`.
  - Types: `Move`, `Attack`, `Gather`, `Build`, `Train`, `Ability`, `Patrol`, `HoldPosition`, `Rally`, etc.
  - Targeting: by `entity_id`, `position`, `area`, `direction`, `self`, or `none`.
  - Parameters: stance, formation, pathing flags, repeat count, patrol waypoints, build blueprint, rally target, ability payload.
  - Source: issuing `player_id`, source entity/group/squad ids.
  - Preconditions: ownership, resources, tech unlocks, cooldowns, range/LOS, pop cap, pathability, placement validity.
  - Effects: resource reservations, state transitions, spawned entities.

- **Lifecycle**
  - States: `QUEUED` → `VALIDATING` → `READY` → `IN_PROGRESS` → (`BLOCKED` | `INTERRUPTED`) → `SUCCEEDED` | `FAILED` | `CANCELLED`.
  - Progress: percent, sub-steps, ETA, remaining distance/time/work.
  - Failures: invalid target, path failed, resource shortfall, target lost, interrupted, building destroyed, OOR/LOS, reconciliation.
  - Interruptibility: instant vs channeling, lockouts.
  - Cancellation: by player, superseded by new order (front/append/replace), or system.

## Server Authority and Validation

- **Ownership & Permissions**: control only own units (configurable shared control/spectator). Per-player and per-entity rate limits/flood control.
- **Deterministic Validation**: authoritative tick-based checks to avoid divergence.
- **Resources & Capacity**: ledger validation with reservations/escrow; production/build slot availability.
- **Visibility & Tech**: LOS/fog enforced server-side; tech tree prerequisites.
- **Cooldowns/Charges**: per ability/unit validation.

### Reservation Semantics

- **Hard vs Soft**:
  - Hard: deduct resources at enqueue or at start (per intent type policy).
  - Soft: provisional allocation with timeouts; auto-cancel if shortage arises.
- **Slots/Queues**: building production queues and parallel slots.
- **Optional Path Reservation**: reduce deadlocks in narrow chokepoints.

## Data-Driven Entities and Scripting Hooks

- **Entity/Ability Definitions**
  - Entities and abilities are defined in data (e.g., JSON/YAML seeded into Postgres) and version-controlled.
  - Each ability is a first-class, data-defined intent type with stable `ability_id` and a content `version`.

- **Scripting Model (Server-Authoritative)**
  - Sandbox (e.g., Lua) provides hooks: `canExecute(context)`, `onStart(ctx)`, `onTick(ctx)`, `onInterrupt(ctx)`, `onComplete(ctx)`.
  - Hooks are deterministic: no wall-clock, no filesystem/network, deterministic RNG seeded per match/tick.
  - Strict CPU/memory quotas; failures surface as intent `FAILED` with reason `SCRIPT_ERROR`.

- **Validation and Costs via Hooks**
  - `canExecute` returns `{ ok, reason?, cost_vector?, reservations? }` consumed by the reservation manager.
  - Targeting schema is declared in data (point/entity/area/self) and drives both client UI and server checks.

- **Client Prediction**
  - Client mirrors static data (cooldowns, ranges, costs) for UX; authoritative resolution stays server-side.
  - If client lacks script parity, treat predictions as hints and reconcile from server updates.

- **Ability Library Resolution**
  - Ability references resolve through a match-scoped Ability Library mapping `ability_id -> current_version`.
  - New validations/executions use the current ability version. In-progress actions continue with the version they started with until completion/interrupt.
  - Queued intents referencing older versions attempt auto-migration to the current version if compatible; otherwise they retain their original version or surface a warning and allow cancel with refund policy (see ADR-002).

## Queues, Chaining, and Grouping

- **Per-Entity Queue**: FIFO with modifiers (insert-front, append, replace current, clear). Capacity limits and overflow policy. Reordering/cancel via IDs.
- **Group Intents**: broadcast to selection; per-entity specialization (melee/ranged). Formations and cohesion. Arrival sync policies: all-at-once, staggered, leader-follow, min-threshold.
- **Compound Intents**: e.g., Gather → Carry → Dropoff → Repeat; Build Site → Construct → Finish → Set Rally. Chained dependencies and failure propagation policy.
- **Retargeting Policies**: on target death/move/path fail—retarget nearest, chase, repath with backoff, or cancel based on stance.

## Action Execution and Movement

- **Pathfinding**: long-path planning + incremental replanning; avoidance, collision, unit sizes, terrain costs, dynamic obstacles; optional formation-aware pathing.
- **Movement**: stop radius, desired facing at destination, leashing/pursuit for attack-move, micro behaviors (kite/hold) by stance.
- **Combat & Abilities**: target acquisition, selection heuristics, cooldowns/charges, cast times, channeling, interrupts, buffs/debuffs, AoE shapes, projectile travel.
- **Economy & Production**: worker harvest cycles, capacity, drop-off points, node depletion; building placement validation (footprint, blockers, rotation, slope); production queues; rally points.

## Networking and Synchronization

- **Client → Server**
  - Intent message includes: `client_cmd_id`, `player_id`, `entity_ids`, intent payload, queueing modifier, input tick.
  - Ordering: per-player monotonic sequencing; accept OOO arrival with dedupe by `client_cmd_id`.
  - Throttling/batching: per-tick batches.

- **Server → Client**
  - Entity deltas with periodic snapshots tagged with `server_tick`.
  - Intent state updates: accepted/rejected/in-progress/progress percent.
  - Reconciliation hints: authoritative pos/vel, action state, resource balances.
  - Compression & interest management: within vision; optional fog-relevant hints.

- **Client Prediction & Reconciliation**
  - Local echo of orders, immediate UI feedback.
  - Predicted movement/animations with smoothing corrections.
  - Small rollback window or elastic correction; clear rejected/modified orders with reasons.

## Determinism and Simulation

- **Tick Model**: fixed-timestep authoritative simulation; input cutoff/buffering.
- **Numeric Stability**: fixed-point or constrained floating point; deterministic RNG seeded per match/tick.
- **Platform Parity**: avoid non-deterministic APIs.

## UX and Controls

- **Queueing UX**: shift-queue, insert-front, clear, reorder; visual waypoints and intent icons in-world and in unit panel.
- **Feedback**: actionable errors and reasons on validation failure; progress bars for long actions.
- **Stances/Behaviors**: aggressive/defensive/hold/stand-ground; auto-cast toggles per ability.

## Edge Cases and Policies

- **Entity Death/Disable**: cancel remaining intents; optional reroute for squads; refund policies on cancel/interrupt/target destruction (configurable).
- **Ownership Changes**: capture/mind-control; ally control handoff/shared control.
- **Environment Changes**: terrain/building placement blocking; fog reappearance; path invalidation; desync reconciliation impact on current intents.
- **Persistence**: save/load matches including intent queues and progress.

## Security and Anti-Cheat

- Authoritative checks only on server.
- Rate limits, spam protection.
- Strict schema validation/decoding; ignore unknown fields via versioning.

## Versioning and Modding

- Versioned intent schema; backward-compatible extensions.
- Feature flags for rollout.
- Scriptable/DSL action definitions with validated preconditions/effects.
-
- **Content Versioning and Match Pinning**
  - All entity/ability data is bundled into a signed content pack with a content hash/version.
  - Each match is pinned to an immutable content version to preserve fairness and determinism.

- **Long-Running Matches and Mid-Match Evolution**
  - Servers may support controlled, mid-match evolution for multi-week games via migration policies:
    - Additive, backward-compatible changes only (e.g., new unit types) OR
    - Scheduled migrations at maintenance ticks with explicit compatibility shims.
  - Intent validation and script hooks must handle version-aware behavior. When evolution occurs, both old and new ability versions may coexist; entities reference their bound version.
  - Hot reload allowed in development; production changes only by content-pack upgrades with strict gating.

## Observability and Tooling

- **Logging/Tracing**: per-intent lifecycle logs with correlation IDs (`player_id`, `intent_id`, `entity_id`); sampled traces for heavy battles.
- **Metrics**: acceptance rate, queue lengths, client→server latency, failure reasons, path failure rate.
- **Replay/Debug**: capture intent streams for deterministic replay; in-game debug overlay for queued intents, blockers, path heatmaps.

## Data Model (High-Level)

- **Components (ECS)**
  - `IntentQueue`: ordered list with modifiers.
  - `CurrentAction`: type, state, progress, started_at_tick, params.
  - `Reservations`: resources/time/slots held.
  - `Cooldowns`, `Stance`, `SquadId`.

- **Global/Per-Player**
  - `ResourceLedger` with reservations.
  - `TechState`, `Population`.
  - `ProductionQueues` per building.

## Testing

- Unit tests for validation rules/reservations.
- Simulation tests for gather/build loops and retargeting.
- Fuzzing for intent storms, path failures, cancel/replace races.
- Determinism tests: cross-platform tick equivalence.

## Open Decisions

- When to charge resources: enqueue vs start vs refundable deposits.
- Client input delay vs immediate prediction.
- Queue capacity limits and overflow defaults.
- Formation sophistication and arrival sync defaults.
- Determinism strategy: fixed-point vs constrained FP.
- Replay format: input-stream vs state delta recording.
 - Scripting engine and sandbox: Lua vs JS/WASM; quotas and deterministic APIs.
 - Content pipeline: data source of truth (files vs DB), seeding, signing, and content hash strategy.
 - Mid-match evolution policy: allowed change types, migration windows, and compatibility shims.
 - Client prediction policy for data-defined abilities: mirrored scripts vs server-trust with hints.
