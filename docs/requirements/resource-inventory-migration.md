# Shared inventory and upkeep reserve migration

## Agreed model

Each entity has one current amount per resource. Cargo and upkeep consume that same amount, under the existing per-resource `max_capacity`. Add optional entity-type configuration:

```yaml
resource_reserves:
  food: 5
  energy: 5
```

A configured reserve is an automatic-supply target and the stock retained during outgoing sharing, delivery, and transport loading from that entity. It is not a second balance or extra capacity. Upkeep and explicit build/upgrade/research/repair payments can consume it. Omitted resource entries preserve existing behavior (no delivery reserve; automatic sharing can fill capacity). Existing `resource_sharing.resources.*.reserve` remains the donor's automatic-sharing-only floor; outgoing sharing protects the larger floor. Explicit transport continues to bypass sharing priorities/refill targets.

For workers, marine workers, and resource transports, start with five food and five energy. Five food covers 2.5 minutes of their current upkeep. These amounts are tuning values, editable in the content editor. Automatic supply fills only the configured buffer, leaving the remaining inventory available for shipments. Existing above-reserve stock remains usable; nothing is discarded.

## Phase 1: reserves and directed transport — implemented

- [x] Rust content schema: `EntityTypeDef.resource_reserves`, defaults, serialization, validation of known resources and `0 <= reserve <= max_capacity` with positive capacity.
- [x] Client content type, generated JSON Schema/Monaco hints and completion, semantic markers, entity create/save validation, generated preload definitions.
- [x] Content: worker, marine_worker, resource_transport; leave storage/habitat sharing policies intact.
- [x] Automatic sharing: configured reserves cap incoming top-ups and protect outgoing stock; missing fields retain compatibility.
- [x] Directed transport: load only donor surplus, retain the carrier's upkeep buffer when unloading, and use above-reserve selected inventory to decide whether a shipment is aboard. A buffer alone must not trigger empty round trips. Preserve shared `collector.carry_capacity` for now: selected shipment resources above reserve plus non-upkeep inventory consume the quota; unrelated upkeep stock does not.
- [x] One-shot delivery: retain buffer and advertise only transferable amounts in the picker; keep collection cargo deliverable during the transition.
- [x] Restore/intent validation: distinguish transferable inventory from reserve-only inventory; preserve existing saved inventories and routes without a reset.
- [x] UI: selected inventory totals stay unchanged; transfer pickers and transport status show transferable inventory rather than an empty legacy cargo bucket.
- [x] Focused tests: repeated two-worker food trips, conservation, mixed-resource carry limits, retained buffers and partial receiver capacity, upkeep consuming shipments, zero/invalid reserve validation, omitted-reserve and legacy-cargo compatibility, editor help and UI transferable amounts. Actual restart/restore and browser interaction remain untested.

No entity protobuf changes or additional per-entity resource balances are needed for this phase. Engine restart and client refresh apply the content/code changes. Do not reset the match.

## Phase 2: remove legacy resource-node cargo

Resource-node `Collect` still uses `Engine.carry_by_entity` / `CarryState`, separate from entity inventory. Complete its conversion as a separate, reviewable step:

- Collection admission/gathering/deposit: fill actual entity inventory, respect per-resource capacity and reserves, preserve deposit priority/overflow behavior and node binding.
- Reconcile or retire `collector.carry_capacity`: identify every use in collection, directed transport, eligibility, schema, content, and UI before changing its meaning. Per-resource capacity is the final inventory limit; decide explicitly whether a shared shipment quota remains useful.
- Intent switching/cancellation/destruction/upgrades: remove cargo credit/cleanup paths without losing or duplicating resources; protect retained upkeep stock during deposits.
- Snapshot migration: fold saved legacy collection cargo into inventory exactly once; deal explicitly with combined amounts exceeding capacity. Never silently clamp/discard stock. Preserve pending transfers and construction progress.
- Snapshot/delta/collector telemetry: carry amounts become derived UI values, not another authoritative resource balance. Audit `collector_state.proto`, Rust/TS generated bindings, Redis restore, visibility filtering, frontend world/stream mapping, tooltips/status, terminal descriptions, sim codec/hashes, and reconnect.
- Tests/fixtures: save/restore legacy and new snapshots, interrupted collection, multi-resource transfers, capacity boundaries, conservation across sharing/upkeep/delivery, deterministic replay, telemetry ownership filtering.

## Existing issues to keep separate

Completed technologies are currently not restored from snapshots. Fix that before relying on a restart to preserve researched unlocks. The full engine unit suite has five content-dependent failures on unchanged HEAD (habitat upkeep, celestial counts, and content/repair expectations); do not change gameplay to make those fixtures pass.

## Phase 1 verification

Focused client/editor tests cover reserve hints and invalid values, transferable inventory, local action affordability, and the resource banner. Engine regressions cover repeated two-worker food transport, shared multi-resource shipment capacity, donor/recipient/carrier buffers, upkeep consuming the same inventory, partial recipient capacity, and legacy collection-cargo delivery compatibility. Content generation and TypeScript checks pass. Live browser use and an actual engine restart/restore were not exercised; completed-technology restore remains an independent issue.
