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
actually gathered; depleted sources stay in the world but are skipped by
collectors. Transport collectors deliver partial cargo when their source depletes.

Tooltips show remaining / initial stock for sources inside player sensor coverage.
Target-side visibility range alone does not reveal resource stock, and remembered
entities outside coverage do not show the resource row. Usable inventories remain
visible only to their owners.

Older snapshots without deposit state initialize finite sources from the fixed
content amount on the first collection tick. No historical depletion can be
reconstructed from those snapshots.
