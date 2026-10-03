# Localized Resources

**Status:** Proposed

## Goal

Replace the effectively player-wide usable resource pool with entity-local inventories. Players should need to distribute resources across their territory to keep entities operating and to enable construction, repair, and other resource-consuming actions.

This builds on the data-driven resource types, entity upkeep, collector, refinery, snapshot, and client state already present in the project. The existing per-player ledger may remain for HUD/economy reporting, but it must no longer authorize an entity to spend resources it does not carry.

## Proposed model

- Every player-owned entity has an authoritative inventory keyed by resource type. Resource amounts and capacities are per entity; absent entries mean zero. The content definition supplies `max_capacity` per resource type. Entity state carries current amounts through snapshots and deltas.
- Collection places resources in the collector's inventory. A refinery becomes a local inventory/drop-off destination rather than crediting an unrestricted player balance. Whether refinery capacity is just the normal entity capacity or requires a distinct storage profile is open.
- Maintenance and other recurring entity operating costs are paid from that entity's own inventory. Upkeep that cannot be paid causes periodic damage to that entity. An entity may still pay for some resource types while failing to pay another; damage policy needs a decision below.
- A data-defined sharing profile lets an entity distribute specified resources to compatible friendly entities within range. Habitats will use this. Sharing is automatic and server-authoritative; recipients may be topped up toward capacity from the habitat's available stock.
- Worker and transport entities can move resources between entities, including habitats. A player command selects source, destination, resource type, and amount (or a load/unload behavior); the unit transports the cargo in its own inventory. The exact intent shape should reuse the existing intent lifecycle and queueing rules.
- Inventories, transfer cargo, damage, and sharing outcomes are authoritative simulation state and must survive snapshots, reconnects, and deterministic replay.

## Content and state shape

Candidate content fields:

```yaml
max_capacity:
  energy: 100
  food: 20
resource_sharing:
  range: 500
  resources: [energy, food]
```

The schema should clarify whether capacity omission means zero or unlimited; zero is the safer default for localized storage. The current `collector.carry_capacity` should be reconciled with per-resource capacity: ideally collection is constrained by `max_capacity`, with any existing field migrated or deprecated rather than maintaining two competing limits.

Entity runtime state needs a resource inventory map. Transport cargo should use that same inventory so cargo is visible and has one capacity rule. Protobuf snapshot and entity delta, Rust state, serialization/hash, frontend world types, stream mapping, and selected-entity UI all need to carry the inventory.

## Gameplay rules to pin down

1. **Collection and deposit:** transport collection fills collector inventory; delivery transfers that inventory to a local recipient with room. Proximity collection credits the collecting entity directly. Resource capacity caps both paths.
2. **Spending:** all entity-bound costs debit the acting/operating entity: maintenance, sensor operation (currently combined with maintenance accounting), repair, build/upgrade, and any future ability cost. Decide whether a producing entity needs to hold the entire build cost or can receive supplies while work proceeds.
3. **Sharing:** sharing transfers inventory, it does not create resources. Define resource compatibility, whether transfer is equalized or recipient-priority/top-up, and stable ordering when multiple recipients compete. Cap transfer by recipient free capacity and donor stock.
4. **Transfer orders:** worker/transport cargo is local inventory; loading debits source and unloading credits destination. Reject or partially fulfill incompatible/full/empty transfers without losing resources. Moving, interruption, death, and destination loss must preserve or deterministically drop/return cargo.
5. **Upkeep failure:** determine the cadence and damage rate, whether damage starts as soon as any upkeep is short, what happens when only some cost types are available, and whether the entity can recover by receiving resources. Damage should be explicitly tagged (for example `starvation`/`upkeep`) so UI presentation does not emit the combat `entity-under-attack` audio event.

## Implementation plan

1. **Lock rules and migration behavior.** Answer the questions below. Inventory starts, existing player ledger, and already-running match migration must be defined before changing simulation behavior.
2. **Content schema.** Add per-resource entity capacity and optional sharing profile; reconcile `carry_capacity`, refineries, and any existing local capacity concepts. Update validation and content definitions.
3. **Authoritative state and wire format.** Add per-entity inventories to engine/sim entities, protobuf snapshots/deltas, state restore, deterministic serialization/hash, and frontend world state. Preserve backward decoding by defaulting missing inventories to empty (or apply a defined migration grant).
4. **Route resource flows through inventories.** Update collection, refinery delivery, upkeep, sensor operation, construction/upgrades, repair, and other costs. Remove global-ledger spending as a gameplay fallback; preserve aggregate totals only for reporting if still useful.
5. **Add sharing.** On deterministic ticks, find eligible same-owner entities in range, apply the chosen donor/recipient ordering and top-up policy, and replicate resulting inventory changes.
6. **Add directed transfers.** Extend intent validation and execution for load/transport/unload using existing movement and queue lifecycle. Add client controls for choosing resource, amount, source, and destination plus cargo/inventory visibility.
7. **Add upkeep damage.** Apply deterministic damage from unpaid upkeep, introduce a damage cause/type in authoritative events, and ensure only hostile attack causes raise the under-attack audio event. Keep death/despawn handling shared with existing damage resolution.
8. **Update HUD and entity UI.** Retain the player resource HUD only as a clearly labeled aggregate/report if desired; show local inventory/capacity on selected entities and cargo on workers/transports.
9. **Verify.** Add focused simulation checks for capacity, collection/deposit, costs, sharing contention/range, transfers/interruption, upkeep damage/audio cause, snapshots/reconnect, and replay determinism.

## Open questions

1. **What happens to starting resources?** Should spawn resources be assigned to named spawn entities (likely habitat), divided among owned entities, or remain in a player account that must be explicitly loaded?
2. **Do all player-owned entities have capacities?** If so, what should unspecified capacity mean, and which current entity types need which capacities?
3. **How does sharing choose among recipients and donors?** Should habitats keep a reserve for their own upkeep, then top up nearby units in stable ID order? Does sharing run before or after upkeep each tick?
4. **What exactly is “maintain a full resource capacity”?** Fill all configured resources to max, fill only upkeep requirements, or maintain a configurable target percentage? How quickly can sharing move stock?
5. **What are transfer controls and semantics?** One-shot amount vs repeat/continuous supply; whether workers need separate load and unload orders; whether transfers can target any owned entity or only compatible storage.
6. **What does a refinery do after localization?** Is it only a deposit target, or does it also transform resources / accept selected types / share stock?
7. **How do partially paid upkeep and damage work?** Require all listed resources for full upkeep? Damage per missing resource unit, flat damage on a failed interval, or no payment and a fixed damage rate? Can zero-upkeep units ever take upkeep damage?
8. **Which costs are local?** The proposal makes build, repair, sensor operation, and maintenance local to the responsible entity. Should production instead draw from a nearby network/storage entity, or require workers to supply the producer first?
9. **What happens to inventory on death, capture, ownership change, and entity upgrades?** Drop a resource entity, transfer to captor, destroy stock, or move it to replacement entity?
10. **How should existing games migrate?** Empty local inventories could immediately damage entities with upkeep. Should a migration seed existing entities from the old ledger, pause upkeep until supplied, or require a new match/content version?
11. **How much inventory state may clients see?** All entities in the snapshot, only visible entities, or owned entities plus visible enemy inventory?

## Related docs

- [M7 Resource Ledger](../milestones/m7-resource-ledger.md)
- [M8 Resource Collection](../milestones/m8-resource-collection.md)
- [Entity Intent System Requirements](./entity-intents.md)
- [Entities and Abilities Requirements](./entities-and-abilities.md)
