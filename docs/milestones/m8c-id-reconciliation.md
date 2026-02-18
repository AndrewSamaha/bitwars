# M8c Pixi Entity-ID Reconciliation

## Scope

- Goal: eliminate stale/ghost entity sprites by making render objects authoritative to ECS entity ids.
- Goal: keep visual behavior stable (no full-scene pop/reset).
- Non-goal: redesign camera centering/spawn camera behavior in this milestone.

## Problem Statement

- Current rendering path can leave orphaned Pixi containers after snapshot/reconnect transitions.
- Symptoms:
  - Sprite appears at wrong/stale location.
  - Hover id can still be valid.
  - Move intent and waypoint line follow backend/ECS position while visible sprite stays fixed.
  - Full page refresh resolves issue (hard scene reset).

## Design

## 1) Authoritative mapping

- Maintain a single render index: `Map<EntityId, PixiEntityRef>`.
- `PixiEntityRef` contains:
  - `container`
  - `sprite`
  - optional cached metadata (`lastEntityTypeId`, `lastOwnerId`, etc.).
- WeakSet/implicit attachment is removed as source of truth.

## 2) Reconciliation loop

- On each render tick:
1. Build a `liveIds` set from ECS entities with required components (`id`, `pos`).
2. For each ECS entity:
  - if id missing in render index: create container+sprite, register events, insert map entry.
  - if id exists: update position/scale/rotation/visual state.
  - if `entity_type_id` changed: update sprite texture.
3. For each id in render index not in `liveIds`: destroy/remove container and delete map entry.

## 3) Snapshot/reconnect behavior

- Snapshot apply only mutates ECS world; renderer reconciliation handles creation/removal from ids.
- No special "clear all render children" step required.
- Reconnect and bootstrap become ordinary ECS diff events from renderer perspective.

## 4) Event handler safety

- Pointer/hover/select handlers resolve entity by current id from ECS (or are detached with container destroy).
- No handler should hold long-lived references that survive entity removal.
- Container destruction path must remove listeners and destroy children.

## 5) Layer ownership

- World visual layers under `worldContainer` are explicit:
  - `entityLayer` (reconciled by id)
  - `waypointLayer` (rebuilt each frame or separately managed)
  - optional debug layers
- Reconciliation only manages `entityLayer`, avoiding collateral deletes.

## Invariants

- For every live ECS entity id, there is exactly one Pixi container in `entityLayer`.
- No Pixi entity container exists for ids absent from ECS.
- Pointer interactions always map to a live ECS id.
- Texture/owner/hover state derives from current ECS state, never stale cached entity object identity.

## Implementation Plan

1. Introduce `entityRenderIndex: Map<string, PixiEntityRef>` inside `GameStage`.
2. Refactor current attach/update/remove code into explicit functions:
   - `ensureRenderObject(entity)`
   - `updateRenderObject(entity, ref)`
   - `destroyRenderObject(id, ref)`
   - `reconcileEntityLayer()`
3. Remove `WeakSet attached` and object-identity attachment assumptions.
4. Ensure sprite texture refresh on `entity_type_id` change via cached last type id.
5. Ensure destruction path always:
   - removes from parent,
   - clears event listeners,
   - destroys container/sprite.
6. Keep minimap logic unchanged (already ECS-driven).

## Observability (small footprint)

- Add dev-only counter badge/logs:
  - `ecs_entities`
  - `pixi_entities`
  - `orphan_pruned_this_tick`
- Optional warning if `Math.abs(ecs_entities - pixi_entities) > 0` after reconciliation.

## Test Plan

## Manual

1. Spawn/join without refresh:
  - verify visible entity positions match hover coordinates.
2. Issue move from newly spawned entities:
  - sprite and waypoint originate at same world position.
3. Force reconnect / stream interruption:
  - no duplicate or stuck-center sprites.
4. Despawn/remove scenario:
  - removed entity id disappears visually within one reconciliation tick.

## Automated (lightweight)

- Unit-level tests around pure reconciliation helpers (if extracted):
  - create missing ids
  - update existing ids
  - prune stale ids
  - texture swap when `entity_type_id` changes

## Risks / Tradeoffs

- Slight per-frame map/set overhead (`O(n)`), usually negligible versus draw cost.
- Requires careful layering so non-entity graphics are not accidentally reconciled/pruned.
- Strongly improves correctness and future maintainability compared to targeted cleanup patches.

## Acceptance Criteria

- No ghost sprites after snapshot/reconnect/join without page refresh.
- Click/hover/move interactions always correspond to currently rendered entity position.
- `ecs_entities === pixi_entities` after reconciliation in steady state.
