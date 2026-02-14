# M7: Resource Ledger + Resource HUD — Approach and Findings

## Goals (from [milestones.md](../milestones.md))

- Add the **authoritative numbers layer** needed for gathering and production (M8+).
- Make resources **visible in the UI early** to support later milestones.

## Deliverables (summary)

| Layer   | Deliverable |
|--------|-------------|
| Server | Per-player resource ledger (authoritative). |
| Server | Deltas/events for resource changes keyed by `player_id`. |
| Client | HUD component that shows current resources and updates live. |
| Client | Resource state pinned to `{protocol_version, content_version}` like other state. |

## Acceptance Criteria

- Resource totals in the HUD match server state across **reconnect** and **replay**.
- Ledger updates remain **deterministic** (golden hash unchanged under replay).

---

## Current State (relevant)

### Server / Engine

- **Game state** ([`services/rts-engine/src/engine/state.rs`](../../services/rts-engine/src/engine/state.rs)): `GameState` has `tick` and `entities` only. No resource ledger.
- **Snapshot** ([`packages/schemas/proto/snapshot.proto`](../../packages/schemas/proto/snapshot.proto)): `Snapshot` has `tick` and `repeated Entity entities`. No resource data.
- **Publish path** ([`services/rts-engine/src/io/redis.rs`](../../services/rts-engine/src/io/redis.rs)): `publish_snapshot(state, boundary)` builds `Snapshot { tick, entities: state.entities }` and writes binary to Redis. No ledger serialization.
- **Restore**: On restore from Redis, engine rebuilds `GameState` from the stored snapshot; adding a ledger field requires it to be part of the snapshot and restored the same way.
- **M6 spawn**: `ensure_spawned(player_id)` creates entities for a joining player; no resource grant today. Optional for M7: grant starting resources here (deterministic).

### Sim crate (determinism / replay)

- **World state** ([`services/rts-engine/crates/sim/src/state.rs`](../../services/rts-engine/crates/sim/src/state.rs)): `WorldState` has `tick` and `entities` only. Used for golden-hash and replay tests.
- **Hashing** ([`services/rts-engine/crates/sim/src/codec.rs`](../../services/rts-engine/crates/sim/src/codec.rs)): `to_sorted_json(&engine.state)` produces deterministic JSON from `WorldState`; `world_hash(engine)` in movement/chaos/determinism tests asserts on this hash. **Adding ledger to state implies including it in this JSON so replay determinism still holds.**

### Client

- **HUD state** ([`apps/web/src/features/hud/components/HUDContext.tsx`](../../apps/web/src/features/hud/components/HUDContext.tsx)): Already has `Resources` (`gold`, `wood`, `stone`), `RES_SET` / `RES_DELTA` actions, and `getResource` selector. **Resources are local state only** — not driven by server.
- **Game state bridge** ([`apps/web/src/features/gamestate/components/GameStateStreamBridge.tsx`](../../apps/web/src/features/gamestate/components/GameStateStreamBridge.tsx)): On SSE `snapshot` / `delta`, applies only **entities** to the miniplex world. No handling of resource payloads.
- **Snapshot/delta payloads** ([`apps/web/src/lib/db/utils/protobuf.ts`](../../apps/web/src/lib/db/utils/protobuf.ts)): `mapSnapshotToJson` / `mapDeltaToJson` map proto to JSON for SSE. Snapshot currently has `tick` and `entities` only.
- **Bootstrap** ([`apps/web/src/lib/db/utils/bootstrap.ts`](../../apps/web/src/lib/db/utils/bootstrap.ts)): Decodes snapshot from Redis and sends `snapshot` SSE event with that JSON. Reconnect flow uses the same snapshot; **resource state will match server after reconnect if snapshot carries full ledger and client applies it.**
- **Current player identity**: Reconnect handshake ([`apps/web/src/app/api/v2/reconnect/route.ts`](../../apps/web/src/app/api/v2/reconnect/route.ts)) does **not** return `player_id` to the client. The client can obtain “my” player id via auth (e.g. same as intent submission) or we can add `player_id` to the reconnect response so the bridge can authoritatively select “my” resources from the snapshot.

### Entity intents / data model

- [Entity intents doc](../../docs/requirements/entity-intents.md) mentions **`ResourceLedger` with reservations** and open decisions (when to charge: enqueue vs start vs refundable). M7 focuses on **totals only**; reservations can be a later refinement.

---

## Design principle: Data-driven resource types

Resource types must be **data-driven** (content- or config-defined), not hardcoded. This keeps the system theme-agnostic and **easily swappable**: e.g. fantasy (gold, wood, iron) vs sci-fi (power, theta, food) is a content change, not a code change.

- **Wire and engine**: Resource type identifiers are **strings** (e.g. in `ResourceEntry.resource_type`). The ledger stores arbitrary type IDs; no enum or fixed list in code.
- **Content pack**: Resource **definitions** (id, display name, icon, display order) should live in the same content pipeline as entity/ability definitions (e.g. M4-style). The client uses this list to decide which resources to show and in what order.
- **Client HUD**: The Resource HUD component should **iterate over content-defined resource types** (or over the keys present in the server snapshot for the current player), not over a hardcoded list like "gold, wood, stone". That way swapping themes only requires changing the content pack.

---

## Spawn configuration: Starting resources

The **spawn configuration framework** (see [m6-spawning.md](m6/m6-spawning.md)) should be **updated to specify what resources players spawn with**. Starting resources are part of the match setup, not hardcoded constants.

- **Spawn config shape**: Extend spawn config (e.g. YAML) with a **starting resources** section — e.g. a map or list of `resource_type_id → amount` that is applied when a player is spawned via `ensure_spawned`. Same config can define different starting resources per loadout or a single shared starting resource set for all players.
- **Engine**: In `ensure_spawned`, after creating entities, apply the starting resources from the spawn config to the ledger for that `player_id`. Deterministic: same config ⇒ same starting state.
- **Result**: Fantasy maps can specify `gold: 100, wood: 50`; sci-fi maps can specify `power: 200, theta: 0, food: 50`. No code change when switching themes.

---

## Proposed Approach

### 1. Schema: Resource ledger in Snapshot (and optional Delta)

- **Snapshot**: Add a representation of the full per-player resource ledger so that reconnect and replay have a single source of truth.
  - Option A — **Repeated message**: e.g. `repeated PlayerResourceLedger player_ledgers` with `message PlayerResourceLedger { string player_id = 1; repeated ResourceEntry resources = 2; }` and `message ResourceEntry { string resource_type = 1; int64 amount = 2; }`. Simple, deterministic order if we sort by `player_id` when serializing for hash.
  - Option B — **Map**: Proto3 `map<string, ResourceMap>` where `ResourceMap` is another message (e.g. repeated ResourceEntry). Maps have undefined iteration order in some runtimes; for **determinism** we must either avoid relying on map order in the sim hash or serialize ledger in a canonical order (e.g. sorted keys) when building the hash. Option A avoids that.
- **Delta / events**: For “deltas/events for resource changes keyed by player_id” we can either:
  - **Snapshot-only in M7**: Clients get resource state from each snapshot (periodic + bootstrap). No new event type; simplest.
  - **ResourceDelta event**: Add a new record type in `EventsStreamRecord` (e.g. `ResourceDelta resource_delta = 3`) carrying per-player deltas or full ledger slice. Clients apply incremental updates between snapshots. Better for live feel; more code and tests.
- **Recommendation**: Implement **Snapshot-only** for M7 (ledger in Snapshot, client applies on snapshot). Add **ResourceDelta** in a follow-up if we want sub-snapshot live updates without waiting for the next full snapshot.

### 2. Engine: Ledger in GameState and publish/restore

- Add a **ledger** field to `GameState`, e.g. `HashMap<String, HashMap<String, i64>>` (player_id → resource_type → amount). Use a type alias or small struct for clarity.
- **Init**: On clean start, ledger is empty.
- **Restore**: When restoring from Redis snapshot, decode the new snapshot fields and populate `state.ledger`; if missing (old snapshot), treat as empty.
- **Spawn (M6)**: In `ensure_spawned`, grant **starting resources from the spawn configuration** (see [Spawn configuration: Starting resources](#spawn-configuration-starting-resources)). Spawn config defines resource type IDs and amounts; engine applies them deterministically (no RNG in amounts).
- **Publish**: In `publish_snapshot`, include the ledger in the `Snapshot` proto so Redis and clients receive it.
- **Tick**: No ledger mutation in the main tick loop for M7 (gathering/deposit is M8). Ledger only changes on spawn or, later, on explicit rules.

### 3. Sim crate: Ledger in WorldState and determinism

- Add a **ledger** (or equivalent) to the sim’s `WorldState` so that `engine.state` carries it. Use the same shape as engine (e.g. sorted for JSON) or a type that serializes to a canonical form.
- **`to_sorted_json`**: Include the ledger in the serialized state. Sort player ids and resource types so the JSON is deterministic. Existing movement/chaos/determinism tests don’t touch resources; with an **empty** ledger the hash can remain unchanged if we add the field but default to empty. New tests that change resources will get new golden hashes.
- **Snapshot decode in sim**: If the sim decodes snapshots (e.g. `from_snapshot_proto`), extend it to decode the new ledger fields so replay tests can load snapshots that contain resources.

### 4. Client: Apply server resource state to HUD

- **Snapshot payload**: Extend the typed snapshot payload (e.g. in `GameStateStreamBridge`) to include `resource_ledger` or `player_ledgers` (matching proto). Extend `mapSnapshotToJson` to include the new fields.
- **Current player**: Establish a single source of truth for “my player_id” (e.g. add `player_id` to reconnect response and store it, or use existing auth/me so the bridge can read it). The bridge must know which player’s resources to show.
- **Apply on snapshot**: In `applySnapshot`, after applying entities, read the ledger for the current player and call HUD `setResources` (or equivalent) so that `state.resources` reflects server state. Same on bootstrap and reconnect (reconnect reuses snapshot from stream).
- **Optional — resource delta**: If we add ResourceDelta events later, add a listener that applies incremental updates to the HUD for the current player.

### 5. Client: Resource HUD component

- Add a **visible** HUD component (e.g. `ResourceHUD` or resource strip) that displays current resources from `useHUD().state.resources` or `selectors.getResource`. Place it in the main layout (e.g. top bar) so it’s always visible when the HUD is mounted.
- **Data-driven display**: The component should **iterate over content-defined resource types** (or over the resource keys received from the server for the current player), not over a hardcoded list. Display order and labels (and optional icons) come from the content pack so that switching themes (e.g. fantasy → sci-fi) requires only content changes.
- No new HUD state needed; the existing `Resources` type (with extensible keys) and `RES_SET` already support arbitrary resource type IDs. We only need to **drive** that state from the server (snapshot) and **render** it from content-defined metadata.

### 6. Pinning to protocol_version and content_version

- Resource state is part of the same snapshot that carries entities; it is published and restored under the same `protocol_version` and `content_version` as the rest of the game state. No extra pinning step — **reconnect and replay use the same snapshot**, so resource totals match (acceptance criterion).

---

## Complexity

| Area              | Complexity | Notes |
|-------------------|------------|--------|
| Proto changes     | Low        | Add messages and optional fields; regenerate Rust + TS. |
| Engine state       | Medium     | New field, init/restore/publish paths; spawn integration optional. |
| Sim crate          | Medium     | WorldState + codec + deterministic sort; existing tests keep same hash if ledger empty. |
| Client bridge      | Low–Medium | Snapshot payload extension; need current player_id; one-time apply on snapshot. |
| Resource HUD UI    | Low        | New component reading existing HUD state; layout/placement. |
| Reconnect / replay | Low        | Already snapshot-driven; just include ledger in snapshot and apply on client. |

**Overall: medium.** Touches proto, engine, sim, and client in a few places; no new game mechanics (no gathering yet).

---

## Risks

| Risk | Mitigation |
|------|------------|
| **Schema backward compatibility** | New snapshot fields optional or default to empty; old clients ignore new fields; old snapshots without ledger decode as empty ledger. |
| **Determinism** | Ledger only updated in deterministic code paths (init, restore, spawn grant). Include ledger in sim `to_sorted_json` with canonical key order; document that no RNG affects ledger. |
| **Golden hash churn** | Add ledger to WorldState with default empty; existing sim tests don’t set it, so hashes unchanged. New resource tests get new golden hashes and are documented. |
| **Client “my player_id”** | Add `player_id` to reconnect response and have bridge/store use it, or use existing auth (e.g. `/players/me`) so the bridge can resolve current player when applying snapshot resources. |
| **Multi-player / spectator** | M7 only shows the **current** player’s resources in the HUD. Other players’ totals are not displayed; spectator mode can be a later extension. |

---

## Open Decisions

1. **Include `player_id` in reconnect response**: Simplifies “my resources” on the client; recommended.
2. **ResourceDelta events in M7 vs later**: Snapshot-only is enough for acceptance criteria; add deltas later if we want finer-grained live updates.
3. **Content pack format for resource definitions**: Whether resource display metadata (name, icon, order) lives alongside entity definitions in the existing content pack or in a separate resource-definitions file; either way it should be part of the same content versioning pipeline.

---

## Implementation Order (suggested)

1. **Proto**: Add `PlayerResourceLedger` / `ResourceEntry` (or equivalent) and add `player_ledgers` (or one struct with map) to `Snapshot`. Regenerate Rust and TS.
2. **Spawn config**: Extend the spawn configuration framework to define starting resources (resource_type_id → amount) per spawn / loadout.
3. **Engine**: Add ledger to `GameState`; init and restore; include in `publish_snapshot`. In `ensure_spawned`, grant starting resources from spawn config.
4. **Sim**: Add ledger to `WorldState`; extend `to_sorted_json` (and `from_snapshot_proto` if used) with canonical ordering; confirm existing golden hashes unchanged with empty ledger.
5. **Client**: Extend snapshot payload types and `mapSnapshotToJson`; in `GameStateStreamBridge`, on snapshot apply, set HUD resources for current player (resolve player_id via reconnect or auth). Add `ResourceHUD` component that iterates over content-defined resource types for display; mount in layout.
6. **Content**: Add resource definitions (id, display name, order, optional icon) to the content pack so the HUD and any other UI can render resources in a theme-consistent way.
7. **Reconnect**: If chosen, add `player_id` to reconnect response and have client store it for bridge use.
8. **Tests**: Determinism/replay test that includes ledger in state and asserts golden hash; optional integration test that snapshot → client shows correct resources after reconnect.

---

## References

- [milestones.md](../milestones.md) — M7 goals, deliverables, acceptance criteria.
- [entity-intents.md](../../docs/requirements/entity-intents.md) — ResourceLedger and reservations (future).
- [chaos-harness.md](../../docs/tools/chaos-harness.md) — Golden hash and determinism.
- [m6-spawning.md](m6/m6-spawning.md) — Spawn-on-join; `ensure_spawned` is the hook for optional starting resources.
