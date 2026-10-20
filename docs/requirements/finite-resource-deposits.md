# Finite resource deposits

`resource_node.amount` in `packages/content/entities.yaml` defines a source's
initial resource stock. Omit it for an unlimited source, such as a star's energy.
Zero creates an already depleted source. This stock is separate from the usable
inventory governed by `max_capacity`.

`resource_amounts` in `services/rts-engine/config/spawn.yaml` overrides the fixed
amount for generated sources, keyed by entity type:

```yaml
resource_amounts:
  minerals:
    average: 10000
    sd: 2000
    min: 2000
    max: 20000
```

Each source receives one normal sample with the configured average and standard
deviation, clamped to the inclusive min/max bounds. The bounds must be nonnegative,
the average must lie within them, and sd must be nonnegative. A zero sd gives a
fixed amount. Scenarios use the fixed content amount for repeatable starting stock.

Authoritative entity state carries `resource_deposit.amount` (the sampled initial
amount) and `resource_deposit.remaining`. Both survive snapshots and deltas,
including a remaining amount of zero. Collection debits the source by the amount
actually gathered. By default, depleted sources stay in the world but are skipped
by collectors. Transport collectors deliver partial cargo when their source depletes.

Tooltips show remaining / initial stock for sources inside player sensor coverage.
Target-side visibility range alone does not reveal resource stock, and remembered
entities outside coverage do not show the resource row. Usable inventories remain
visible only to their owners.

Older snapshots without deposit state initialize finite sources from the fixed
content amount on the first collection tick. No historical depletion can be
reconstructed from those snapshots.

## Renewable deposits

Resource nodes may define a normalized Hill regeneration curve and an optional
replacement entity type on depletion:

```yaml
regeneration:
  model: hill
  max_rate_per_second: 7.529411764705882
  half_saturation_fraction: 0.5
  exponent: 4
depleted_entity_type_id: dead_planet_blue
```

With `x = remaining / amount`, `a = half_saturation_fraction`, and `n = exponent`,
the replenishment rate is `max_rate_per_second * x^n * (1 + a^n) / (x^n + a^n)`.
The maximum rate is the rate at full stock. The underlying Hill factor is half
saturated at `x = a`; normalization makes the rate there slightly greater than
half the configured maximum rate. Blue planets use the settings above: 4 food/sec
at 50% stock and approximately 7.529 food/sec at full stock. A worker actively
harvests 8 food/sec; delivery trips reduce its average harvesting rate.

All three Hill parameters are required, finite, and positive; the half-saturation
fraction must not exceed 1. Renewable nodes require a positive finite content
amount. Each planet uses its own sampled or restored deposit maximum at runtime.
Omitting regeneration preserves nonrenewable behavior.

Every collection tick initializes missing deposits, grows living nonempty
renewable deposits by `rate * simulation_elapsed_seconds` (capped at their
maximum), then collects resources. Zero stock never grows back. After collection,
a depleted node with `depleted_entity_type_id` transforms in place, preserving its
ID, owner, and position. It receives the replacement type's health and fixed
initial deposit; blue planets become dead planets with 1,000 minerals. Cached
collector assignments to the source are cleared, and partially loaded workers
continue delivering their existing cargo before collecting again. Depletion
replacement also works for nonrenewable sources; the target must exist and differ
from the source type.

Existing snapshots need no migration: regeneration uses the saved maximum and
remaining stock. Already exhausted blue planets convert on their next collection
tick. The ordinary entity-type and deposit deltas publish growth and conversion.
