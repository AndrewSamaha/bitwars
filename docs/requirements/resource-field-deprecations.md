# Resource field deprecations

**Date:** 2026-10-18
**Applies to:** Depot logistics, intent protocol 18, economy snapshot version 1.

These legacy fields remain accepted for content decoding and syntax validation. They have no resource-sharing effect. Bundled entity content no longer sets them. The generated entity JSON Schema marks the fields `deprecated: true`, and the content editor warns when they appear.

| Deprecated field | Replacement / behavior |
| --- | --- |
| `resource_sharing` | `depot: true` and `depot_range`; physical shipments between depots |
| `resource_sharing.range` | `depot_range`, which authorizes local spending and does not transfer stock |
| `resource_sharing.wireless_receives` | Local producers credit their one associated depot directly |
| `resource_sharing.resources` | Removed policy system; depots retain stock until spending or explicit shipping |
| `resource_sharing.resources.*.priority` | Ignored; consumers pay in deterministic order from one depot |
| `resource_sharing.resources.*.overflow_priority` | Ignored; physical inflows are limited by capacity |
| `resource_sharing.resources.*.refill_below` | Ignored; no automatic inventory refill |
| `resource_sharing.resources.*.fill_to` | Ignored; no automatic inventory refill |
| `resource_sharing.resources.*.reserve` | Ignored; explicit routes can load available depot stock |
| `resource_reserves` | Ignored; carrier inventory is cargo, with no protected upkeep buffer |
| `refinery` / `refinery.accepts` | Depot status and positive `max_capacity` entries determine drop-off eligibility |
| `collector.deposit_entity_types` | Collectors choose compatible same-owner depots |
| `builds[].spend_rates`, `upgrades[].spend_rates` | `duration_seconds`; rates are retained only as a duration fallback for legacy content, never as progressive construction debits |

`max_capacity`, `build_cost`, `maintenance_cost_per_minute`, `sensor.cost_per_minute`, and collector gathering rates remain active. Maintenance and sensor costs debit a funded associated depot atomically, preserving onboard reserves. When no eligible depot can cover the bill, the entity pays from its own inventory instead. Neither payment combines partial stocks from different sources. Shortages pause capabilities without causing starvation damage.

The previously deprecated protobuf collector `carry_amount` and `carry_capacity` fields remain compatibility-only. Physical cargo uses entity inventory. Historical starvation event decoding remains for compatibility, but depot logistics does not generate starvation damage.

Older populated matches require an explicit archive/reset before deployment. This change does not reset or migrate the running game automatically. See the [implementation spec](./depot-logistics.md).
