# M6: Player Ownership + Spawn + Control Gating — Approach

## Goals

- Introduce **player ownership** for entities.
- Ensure players **spawn with a minimal owned set** and can **only command what they own**.

## Deliverables (from milestones.md)

- **Schema/content:** `owner_player_id` (or equivalent) on entities; support `neutral` ownership for resources.
- **Server:** Spawn rules on join: each player receives starting entities at a spawn point. Validation: reject intents targeting entities not owned by the issuing player.
- **Client:** Selection/command UI only operates on owned units. Owned-vs-nonowned visuals. Player and other player units appear as different colors on the minimap.

## Acceptance Criteria

- With two clients connected, each can only issue commands for their own units; server rejects cross-control deterministically.
- Reconnect continues to reconcile ownership-correct active intents.
- Cannot issue intents, actions, abilities, etc. on entities the player does not own.

---

## Current State (brief)

- **Entity proto:** No owner field. `Entity` has `id`, `entity_type_id`, `pos`, `vel`, `force`.
- **Intent flow:** Client sends Move (and future intents) with `entity_id`; API sets `player_id` on the envelope from auth (`auth.playerId`). Engine ingests envelope and calls `IntentManager::try_activate` with no ownership check—any `entity_id` is accepted if the entity exists and policy allows.
- **Init:** `init_world` in `engine/state.rs` creates entities from `spawn_manifest` (type + count) or legacy `num_entities`; all entities are unowned.
- **Reconnect:** `GET /api/v2/reconnect` returns `active_intents` filtered by `entry.player_id === playerId`; no entity ownership check.
- **Client:** ECS entities have `id`, `pos`, `vel`, `entity_type_id` (and render state). No `owner`. Selection and commands apply to any entity; no “current player” in UI logic for ownership. Minimap draws all units the same color.

---

## Proposed Approach

### 1. Schema: add `owner_player_id` to Entity

- **entity.proto:** Add `string owner_player_id = 6;` (or next free field number). Empty string = unowned/legacy; `"neutral"` = neutral (for future resources); otherwise a player identifier (e.g. the same string used in `IntentEnvelope.player_id`).
- **entity_delta.proto:** Add `optional string owner_player_id = 5;` so ownership changes can be delta’d (e.g. for future transfer or spawn-in).
- **Regenerate:** Run buf/protoc so Rust (`prost`) and TS (`@bufbuild`) get the new field. Update any snapshot/delta encoding that builds `Entity` or `EntityDelta` to set the new field.

**Content:** No change to `entities.yaml` required for M6. Ownership is assigned at spawn by the engine from config; content can later tag types as “neutral” if needed.

---

### 2. Server: spawn rules and ownership assignment

- **Config:** Extend engine config so that spawn can assign owners. Two concrete options:
  - **Option A — Per-player spawn manifest:** e.g. `spawn_players: [{ player_id: "alice", spawn_min, spawn_max, entities: [{ entity_type_id, count }] }, ...]`. For each entry, create that many entities in that player’s spawn range and set `owner_player_id = player_id`.
  - **Option B — Single manifest + fixed player list:** e.g. `player_ids: ["alice", "bob"]` and keep one `spawn_manifest`. When creating entities, assign owners in round-robin (first entity to alice, second to bob, third to alice, …) or by contiguous blocks (first N to alice, next N to bob). Spawn position can stay as today (single `spawn_min`/`spawn_max`) or be extended later with per-player spawn regions.

Recommendation for M6: **Option B** with contiguous blocks—simplest. Example: `player_ids: ["player-1", "player-2"]`, `spawn_manifest: [("worker", 2), ("scout", 1)]` → player-1 gets first 3 entities, player-2 gets next 3. So we need a total entity count and a deterministic order (e.g. same as current init_world order); then assign `owner_player_id` by index into `player_ids`. If `player_ids` is empty, leave `owner_player_id` empty (backward compatible).

- **init_world:** When creating each entity, set `entity.owner_player_id` from the chosen player for that index. If no player list or index out of range, set `""`.

- **Spawn “on join”:** The milestone says “each player receives starting entities at a spawn point.” For a single-match engine that starts once, “on join” can mean “at match start, entities are already assigned to players from config.” No need for a separate “join” RPC that spawns entities later in M6 unless we want it. So: define the player set and spawn layout in config; at `init_world`, assign ownership. If we later add dynamic join, we can add a “spawn for player X” step when they connect.

---

### 3. Server: reject intents for non-owned entities

- **Before `try_activate`:** In the engine path that handles an intent envelope (e.g. `handle_envelope` or equivalent), resolve the target entity from `state.entities` by `entity_id` (from the intent payload). If the entity does not exist, emit `REJECTED` with `INVALID_TARGET` (or similar) and do not call `try_activate`. If the entity exists, check `entity.owner_player_id == metadata.player_id` (with usual string comparison; treat empty as “no owner”). If not owned by the issuing player, emit `REJECTED` with a new reason and do not call `try_activate`.

- **New lifecycle reason:** Add e.g. `NOT_OWNED` (or `NOT_OWNER`) to `LifecycleReason` in the proto so the client can show “You don’t own this unit” instead of a generic error.

- **Determinism:** Rejection is deterministic: same envelope (same `player_id`, same `entity_id`) and same snapshot ⇒ same outcome. No server-side queue for non-owned entities.

---

### 4. Reconnect: ownership-correct active intents

- Reconnect already returns only active intents where `entry.player_id === playerId`. For M6 we do not transfer ownership, so an intent that was accepted is always for an entity owned by that player at accept time. Optional hardening: when building the reconnect response, optionally verify that each entity in `active_intents` still has `owner_player_id == playerId` by reading the latest snapshot (or a cached entity set). If we don’t have a cheap way to do that, leave as-is; then “reconcile ownership-correct active intents” is satisfied by “we only ever accept intents for owned entities, and we only return this player’s intents.”

- If we later add ownership transfer or spawn-after-join, we can filter `active_intents` to only include entities the player currently owns.

---

### 5. Client: know “my” player id

- The client must know the current player’s id to gate selection and to drive owned-vs-other visuals. Today the client sends requests to `/api/v1/intent` and `/api/v2/reconnect` with auth; the server reads `player_id` from the session/JWT.

- **Proposal:** Expose the current player id to the client via an existing or new API, e.g. `GET /api/v2/me` or `/api/players/me` returning `{ player_id, ... }`, or include `player_id` in the first SSE event or in the stream URL response. Alternatively, if the client already has a session that encodes the same id, decode it once (e.g. from a small “whoami” endpoint) and store in React state or context so GameStage and HUD can read it.

- Use a single source of truth (e.g. `PlayerContext` or `useCurrentPlayerId()`) so selection, command UI, and minimap all use the same value.

---

### 6. Client: selection and command UI only on owned units

- **Selection:** When the user clicks an entity, only treat it as selected if `entity.owner_player_id === myPlayerId` (or equivalent). If the entity is not owned by the current player, either ignore the click or show a “you don’t own this unit” hint and do not add it to selection. So: in the entity’s `pointerdown` handler (or the shared selection logic), check ownership before calling `setSelection([...])`.

- **Commands (e.g. Move):** Only allow issuing Move (and future abilities) for entities that are both selected and owned. The ground-click and action buttons should already be gated by selection; add an extra guard: do not send an intent if any targeted entity is not owned by the current player. This prevents accidentally sending commands for non-owned entities (e.g. from a stale selection). Server will reject anyway, but client avoids useless requests and gives a consistent UX.

- **Data:** Snapshot and delta must carry `owner_player_id` into the client ECS. So in `mapSnapshotToJson` / `mapDeltaToJson` (and in the bridge that applies snapshot/delta), include `owner_player_id` on each entity. Extend the client `Entity` type (e.g. in `world.ts`) with `owner_player_id?: string` so selection and UI can read it.

---

### 7. Client: owned-vs-nonowned visuals

- **In-world:** Differentiate owned vs non-owned units (e.g. outline tint or color). For example: owned = current highlight/selection color; non-owned = muted or different tint. Reuse existing hover/selection styling where possible and add a branch on `entity.owner_player_id === myPlayerId`.

- **Minimap:** Use different colors by owner: e.g. “my” units one color (e.g. current light blue), other players’ units another color (e.g. orange or gray). Neutral could be a third color. Requires passing `owner_player_id` (and `myPlayerId`) into the minimap draw logic and choosing color per entity.

---

### 8. Implementation order (suggested)

1. **Proto + codegen:** Add `owner_player_id` to Entity and EntityDelta; add `NOT_OWNED` to LifecycleReason; regenerate Rust and TS.
2. **Server init:** Extend config with player list and ownership assignment in `init_world` (e.g. round-robin or blocks); set `owner_player_id` on every spawned entity.
3. **Server validation:** In the intent handling path, resolve entity by id, then check ownership; if not owned, emit REJECTED(NOT_OWNED) and skip `try_activate`. Add tests: two players, each can only move own units; cross-player intent is rejected.
4. **Client data:** Map `owner_player_id` in snapshot/delta and in the bridge; add to client Entity type.
5. **Client “my” player:** Add a small API or use existing auth to expose current player id; provide it via context or hook.
6. **Client selection/commands:** Gate selection and intent submission on ownership.
7. **Client visuals:** Owned vs non-owned tint in-world; minimap colors by owner.
8. **Reconnect:** Confirm behavior (no code change required if we only return intents by `player_id`); document or add an optional ownership check if desired.

---

### 9. Edge cases and notes

- **Empty or missing `owner_player_id`:** Treat as “no owner.” Server should not accept intents for such entities from any player (or define a rule, e.g. “only server can assign owner”). For M6, all spawn-assigned entities have a non-empty owner; legacy/neutral use `""` or `"neutral"`.
- **Neutral:** Supporting `"neutral"` in the proto and in validation (no player can command neutral entities) is enough for “support neutral ownership for resources” in the deliverable; no need to spawn neutral entities in M6 if we’re not doing resources yet.
- **Protocol version / schema:** New field on Entity is additive; old clients will ignore `owner_player_id`. New clients must handle missing `owner_player_id` (treat as empty string) for backward compatibility during rollout.

This approach satisfies the M6 goals, deliverables, and acceptance criteria while fitting the existing intent, reconnect, and client architecture.
