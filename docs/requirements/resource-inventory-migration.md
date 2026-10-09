# Shared inventory and upkeep reserve migration

## Agreed model

Each entity has one current amount per resource. Cargo and upkeep consume that same amount, under the existing per-resource `max_capacity`. Add optional entity-type configuration:

```yaml
resource_reserves:
  food: 5
  energy: 5
```

A configured reserve is an automatic-supply target and the stock retained during outgoing sharing, delivery, and transport loading from that entity. It is not a second balance or extra capacity. Upkeep and explicit build/upgrade/research/repair payments can consume it. Omitted resource entries retain no explicit delivery reserve. Automatic sharing now supplies one minute of upkeep before any bulk allocation (see the upkeep-first rules below). Existing `resource_sharing.resources.*.reserve` remains the donor's automatic-sharing-only floor; outgoing sharing protects the larger floor. Explicit transport continues to bypass sharing priorities/refill targets.

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

## Phase 2: one inventory for collection and transport — implemented

- [x] Resource-node collection credits entity inventory immediately. Gathering respects each resource's `max_capacity`, and upkeep/actions consume those same resources before delivery.
- [x] Collection deposits retain `resource_reserves` and follow recipient sharing priorities, refill targets and overflow priorities. Partial unloads keep the undelivered inventory aboard.
- [x] Retired `collector.carry_capacity` from Rust/client content types, YAML and generated Monaco schema/preload definitions. `max_capacity` is the sole inventory limit. Mixed shipments use each resource's capacity independently; there is no shared shipment quota. A positive `collector.transport_rate_per_second` enables maintained transport.
- [x] Removed `Engine.carry_by_entity` / `CarryState`. Switching assignments delivers the previous resource first; interrupting collection leaves inventory intact. Upgrades preserve inventory, and destruction removes it with the entity.
- [x] Snapshot restore merges each legacy collector's `carry_amount` into inventory and clears the legacy fields. New snapshots/deltas write zero legacy cargo fields, which protobuf omits. Existing combined stock above capacity is preserved and cannot receive further units of that resource until room is available. Subsequent restores do not add cargo again.
- [x] Preserved collector assignment/activity metadata during restore and retained existing route/construction restore paths. Completed technologies now restore from the snapshot rather than being dropped.
- [x] UI/terminal displays and delivery pickers read inventory once. Removed duplicate cargo amounts from frontend projections; collector telemetry retains activity, assignment, resource type and effective rate. Ownership filtering remains in place.
- [x] Scenario capture writes inventory only. Legacy scenario `cargo` remains readable and merges into inventory; migrated overflow inventory can reload. Converted bundled fixtures and checked they validate.
- [x] Replay snapshot decoding and deterministic state now include ownership, per-entity inventory and resource-node deposits. Legacy cargo is included in decoded inventory.
- [x] Tests cover legacy/new snapshot round trips, invalid legacy amounts, researched unlocks, inventory conservation across collection/upkeep/deposit, assignment changes, retained buffers, partial deposits, overflow, independent multi-resource capacity, sparse inventory deltas and editor hints.

Apply with an engine restart and client refresh; **do not reset the match**. Old content definitions must remove `collector.carry_capacity`; use `max_capacity` for each resource. The bundled definitions are already updated. The running engine has not been restarted as part of this change.

## Verification and existing failures

Phase 2: TypeScript and all 22 focused UI/editor tests pass, as do the simulation tests and all-target Rust compilation. The engine library suite passes 81 tests with one ignored integration test and the same five pre-existing content-dependent failures (content/repair expectations, habitat upkeep fixtures, celestial counts).

The `two_entities_move` golden replay also fails on unchanged HEAD with the identical position and hash mismatch; movement behavior was not changed to satisfy that stale fixture. Actual live restart/reconnect and browser interaction remain untested. Snapshot migration is covered by protobuf round-trip unit tests; no game data was reset or modified.


## Upkeep-first automatic sharing

- Wireless collectors retain an operating buffer before supplying receivers. Local sharing then fills operating buffers before charging upkeep, so nearby supply is usable on the payment tick.
- An explicit `resource_reserves` entry sets the operating target. Otherwise use one minute of maintenance plus sensor costs, capped at capacity and at least one whole unit for positive costs. A zero explicit target opts out. For a basic defense pylon the default energy target is 32.5.
- Within each donor's range, scarce supply equalizes the lowest fractions of operating targets first. Multiple donors recalculate current coverage, and all transfers conserve inventory. Range, ownership, health, upgrade exclusions, accrued upkeep, and explicit outgoing reserves still apply.
- Bulk transfers happen after upkeep. Retain `fill_to` while actively refilling, or `refill_below` otherwise, in addition to the operating buffer and outgoing reserve. Transfer only to strictly higher effective receiving priority; equal priorities cannot circulate bulk stock. Collection drop-off preferences and explicit transport/action payment semantics are unchanged.
- Regression tests cover the habitat/factory/pylon arrangement, repeated stable bulk allocation, a minute of pylon upkeep, scarce supply, differing upkeep rates, multiple donors, explicit targets, capacity limits, priority transitions and eligibility guards.

No new schema fields, inventory balances or reset are needed. Restart the engine to apply the behavior. Live/browser testing and the actual restart were not performed.
