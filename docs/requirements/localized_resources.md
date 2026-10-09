# Localized Resources

**Status:** Proposed

## Goal

Replace the effectively player-wide usable resource pool with entity-local inventories. Players should need to distribute resources across their territory to keep entities operating and to enable construction, repair, and other resource-consuming actions.

This builds on the data-driven resource types, entity upkeep, collector, refinery, snapshot, and client state already present in the project. The existing per-player ledger may remain for HUD/economy reporting, but it must no longer authorize an entity to spend resources it does not carry.

## Proposed model

- Every player-owned entity has an authoritative inventory keyed by resource type. Resource amounts and capacities are per entity; absent entries mean zero. The content definition supplies `max_capacity` per resource type. Entity state carries current amounts through snapshots and deltas.
- Collection places resources in the collector's inventory. Any configured collection drop-off receives resources into its local inventory rather than crediting an unrestricted player balance. Refineries use the same generic entity inventory/drop-off capabilities, with high per-resource capacities; they have no separate resource-accounting behavior.
- Maintenance and other recurring entity operating costs are paid from that entity's own inventory. On a normal maintenance charging tick, missing any required resource causes 1 upkeep damage, even if other upkeep resources were paid.
- A data-defined sharing profile lets an entity distribute specified resources to compatible friendly entities within range. Habitats will use this. Sharing is automatic and server-authoritative; recipients may be topped up toward capacity from the habitat's available stock.
- Worker and transport entities can move selected resources between assigned donor and recipient entities, including habitats. The unit transports cargo in its own inventory. The exact per-trip loading rule should reuse the existing intent lifecycle and queueing rules.
- Inventories, transfer cargo, damage, and sharing outcomes are authoritative simulation state and must survive snapshots, reconnects, and deterministic replay.

## Current starting-resource behavior

`services/rts-engine/config/spawn.yaml` configures `starting_resources` as `food: 500`, `minerals: 500`, and `energy: 500`. `ensure_spawned` grants these amounts once per player into `GameState.ledger`, keyed by player ID, after spawning that player's loadout. The snapshot persists this as `player_ledgers`; `/api/players/me` exposes it to the existing resource HUD. Current gameplay costs also debit that player ledger.

This correctly implements a player-wide starting balance, but it is not sufficient for localized resources: no entity receives those amounts, and an entity-local cost cannot spend them. The spawn loadout already includes a `habitat`, which is a natural initial stockpile, but the grant code does not select or initialize a recipient. Keep the spawn-config amounts and HUD aggregate, but change the grant to put the configured starting stock into a configured player-owned storage entity (recommended default: the spawned habitat), subject to that entity's capacity. If the selected loadout lacks the configured recipient or the starting stock exceeds capacity, spawn validation should report a configuration error rather than silently losing resources.

The player ledger should then be derived from/synchronized with entity inventories for display and economy reporting; it must not remain a second spendable pool. For deterministic spawn and restore, inventory must be stored in world/entity state and snapshots, not reconstructed from current spawn config after the player has joined.

## Ways to assign inventory during spawn

The existing spawn path chooses one `Loadout` (`entity_type_id → count`), passes it to `on_player_spawn`, which appends entities to `GameState.entities`, and then grants the player-wide starting balance. The spawned slice is available in `ensure_spawned`, but the loadout is a `HashMap`: entity iteration order is unspecified, and a type/count map does not identify a particular instance when there are duplicates.

Two reasonable options:

1. **Keep loadouts as-is; configure starting inventory by entity type.** Replace/extend `starting_resources` with a map or list keyed by recipient type, such as `starting_inventories: [{ entity_type: habitat, resources: { energy: 500, ... } }]`. After spawn, find the matching newly created owned entity and initialize its inventory. Validate that the selected loadout contains exactly one matching entity and that its configured capacity can hold the grant. This is the smallest change and suits the current single-habitat start.
2. **Make loadouts structured spawn entries.** Each loadout contains entries like `{ type: habitat, count: 1, resources: {...} }`; `on_player_spawn` initializes inventory while creating each entity. This associates inventory with the exact spawned entry and scales to multiple copies or distinct entity roles, but changes the loadout schema and spawn code more broadly.

Recommendation: use option 1 now, with an explicit recipient type and clear validation. Move to option 2 if a loadout needs different starting inventories for multiple entities of the same type. Avoid putting starting inventory on the general entity content definition: that would grant it on every spawn/build of that type, rather than only at player join.

## Content and state shape

Candidate content fields:

```yaml
max_capacity:
  energy: 100
  food: 20
resource_sharing:
  range: 500
```

Every player-owned entity type must declare `max_capacity`; omission is a content schema error. The mapping declares capacities for each supported resource, with unsupported resources unavailable to that entity. The current `collector.carry_capacity` should be reconciled with per-resource capacity: ideally collection is constrained by `max_capacity`, with any existing field migrated or deprecated rather than maintaining two competing limits.

Entity runtime state needs a resource inventory map. Transport cargo should use that same inventory so cargo is visible and has one capacity rule. Protobuf snapshot and entity delta, Rust state, serialization/hash, frontend world types, and stream mapping all need to carry the inventory. Only send inventory state for entities owned by the receiving player. Show owned entity inventory in its hover tooltip and in the bottom entity status bar, using resource bars for current amount versus capacity.

## Gameplay rules to pin down

1. **Collection and deposit:** transport collection fills collector inventory; delivery transfers that inventory to a local recipient with room. Proximity collection credits the collecting entity directly. Resource capacity caps both paths.
2. **Spending:** maintenance and sensor operation debit the operating entity, repair costs debit the repairer and nearby friendly resource-sharing donors, upgrade costs debit the upgrading entity, and research costs debit the researcher. A producer may start construction when the full build cost is available across one or more donors, each within its configured resource-sharing range of the builder. Resources remain in donor inventories and are progressively debited from donors in entity-ID order as construction proceeds.
3. **Lifecycle:** an upgraded entity's replacement inherits its inventory. In all other cases, including destruction and ownership change/capture, its inventory is lost. Resource theft by another entity is a possible future mechanic.
4. **Sharing:** sharing transfers inventory, it does not create resources. Sharing range is declared on the sharing entity type. Recipients are all same-owner entities within that range that have maintenance costs, and a recipient only receives a resource type that it uses for upkeep. Each donor pays its own due maintenance and sensor costs before sharing. Accrued fractional upkeep is reserved until its whole-unit payment is due; only unreserved stock is shared. Solar collectors pay their upkeep before wireless donation, and habitats receive wireless supply before checking their upkeep. Donors with an unpaid due payment cannot share that tick. A habitat does not return energy to a collector that supplied it wirelessly that tick. For resources with a sharing policy, supply goes to requesting recipients in descending priority, then distance, then entity-ID order, capped by the refill target. Resources without a policy retain the existing capacity-based, entity-ID-ordered transfers. Stock blocked by full recipients stays with the habitat for a later sharing tick.
5. **Transfer orders:** the player assigns both a donor resource container and a recipient resource container. Any entity that uses or carries resources may be the recipient. Worker/transport cargo is local inventory; loading debits the donor and unloading credits the recipient. Transfers use a maintained, long-running intent like `Collect`, repeating supply behavior until replaced or interrupted. Reject or partially fulfill incompatible/full/empty transfers without losing resources. If either endpoint disappears, cancel the transfer intent and notify the player with a dedicated `TRANSFER_ENDPOINT_LOST_EVENT`, modeled on `COLLECTION_WAITING_EVENT`, with a player-facing toast.
   - The interaction sequence is: select the worker to show its actions in the bottom status bar; choose `Transport Resources`; select a donor entity; if it is eligible, show its available resources in the bottom status bar; select one or more available resource types; select a recipient entity to assign it.
   - If the selected donor has none of a selected resource available, the worker waits and retries while the intent remains active, following the existing wait behavior when a collection point is full.
   - Workers load as much of each selected resource as possible, bounded by donor stock, recipient free capacity, and the worker's current shared `carry_capacity`. Per-resource transport capacity may be added later.
   - If the recipient has no capacity for the selected resource, the worker waits and retries while the intent remains active.
   - Clicking open space or the worker again resets the action/intent selection state.
6. **Upkeep failure:** only when a whole-unit maintenance or sensor payment is due, if the entity lacks any resource type required for that payment, reduce its health by 1. No damage is applied on ticks with no payment due. It may still spend available upkeep resources; missing types do not create debt. Tag this as upkeep damage so UI presentation does not emit the combat `entity-under-attack` audio event. A per-entity damage amount can be added later.

## Implementation plan

1. **Lock rules and rollout behavior.** Inventory starts and already-decided gameplay rules are defined below. Existing matches need no migration; reset the game after implementation.
2. **Content schema.** Add per-resource entity capacity and optional sharing profile; reconcile `carry_capacity`, refineries, and any existing local capacity concepts. Update validation and content definitions.
3. **Authoritative state and wire format.** Add per-entity inventories to engine/sim entities, protobuf snapshots/deltas, state restore, deterministic serialization/hash, and frontend world state. Preserve backward decoding by defaulting missing inventories to empty (or apply a defined migration grant).
4. **Route resource flows through inventories.** Update collection, refinery delivery, upkeep, sensor operation, construction/upgrades, repair, and other costs. Remove global-ledger spending as a gameplay fallback; preserve aggregate totals only for reporting if still useful.
5. **Add sharing.** On deterministic ticks, find eligible same-owner entities in range, apply the chosen donor/recipient ordering and top-up policy, and replicate resulting inventory changes.
6. **Add directed transfers.** Extend intent validation and execution for load/transport/unload using existing movement and queue lifecycle. Add client controls for choosing donor and recipient containers, resource selection, and cargo/inventory visibility.
7. **Add upkeep damage.** Apply deterministic damage from unpaid upkeep, introduce a damage cause/type in authoritative events, and ensure only hostile attack causes raise the under-attack audio event. Keep death/despawn handling shared with existing damage resolution.
8. **Update HUD and entity UI.** Retain the player resource HUD only as a clearly labeled aggregate/report if desired. Show local inventory/capacity in owned-entity hover tooltips and the bottom entity status bar, with resource bars; show cargo through the same inventory UI for workers/transports.
9. **Verify.** Add focused simulation checks for capacity, collection/deposit, costs, sharing contention/range, transfers/interruption, upkeep damage/audio cause, snapshots/reconnect, and replay determinism.

## Open questions

1. **Starting resources — decided:** assign the configured stock to the player's spawned habitat, preserving existing amounts. Configure recipient type and validate that each chosen loadout has one habitat with sufficient capacity. Structured loadout entries can wait until inventories need to vary by instance.
2. **Entity capacities — decided:** every player-owned entity type must declare `max_capacity`; omission is a schema error. Define capacity only for resources that entity can carry.
3. **Sharing eligibility and policy — decided:** sharing range is defined in the sharer's schema. Every same-owner entity within range with maintenance costs is a recipient for each resource type it uses for upkeep. The sharer pays its own maintenance first, retains its configured reserve, then supplies requesting recipients by priority, distance and entity ID, subject to refill targets. Unconfigured resources retain capacity-based sharing.
4. **Sharing cadence:** sharing runs on the normal simulation tick unless profiling shows that needs throttling. It does not repeatedly rebalance inventories within a tick.
5. **Transfer intent — decided:** resource movement is a maintained, long-running intent like collection, repeating until replaced or interrupted. UI sequence: select worker; choose `Transport Resources` from its bottom-bar actions; select an eligible donor; select one or more of the donor's available resource types shown in the bottom bar; select a recipient. A recipient must use or carry the selected resource. If the donor lacks selected resources or the recipient has no room, the worker waits and retries while the intent stays active. The worker loads as much as possible under its current shared `carry_capacity` and the donor/recipient inventory limits, delivers, and repeats. Per-resource cargo capacities may be added later. Clicking open space or the worker again resets selection. If either endpoint disappears, cancel the intent and emit a dedicated transfer-endpoint-lost UI event like `COLLECTION_WAITING_EVENT`, so the player sees a toast.
6. **Refineries — decided:** use generic entity inventory and collection drop-off capabilities; configure high resource capacities so players can use refineries as local stockpiles. No separate refinery-specific resource accounting or transformation mechanic is needed.
7. **Upkeep damage — decided:** an entity missing any resource required for a due whole-unit maintenance or sensor payment loses 1 health on that tick. Ticks without a payment due cause no starvation damage. For habitat sensor energy at 5/minute, this is approximately 1 damage every 12 seconds. Tag the damage cause as upkeep, distinct from hostile attacks. A per-entity damage setting is a future extension.
8. **Local costs — decided:** maintenance and sensor operation are paid by the operating entity, repair by the repairer and nearby friendly resource-sharing donors, upgrades by the upgrading entity, and research by the researcher. A producer may start construction when the full build cost is available across one or more donors, each within its configured resource-sharing range of the builder. Construction and repair spend progressively from eligible donor inventories in entity-ID order; resources do not need to be transferred into the acting entity first. Each repair tick checks all required resources before charging any donor or restoring health.
9. **Entity lifecycle — decided:** the replacement entity inherits its inventory on upgrade. Inventory is lost on destruction, capture, and other ownership changes. A future entity ability may steal resources from other entities.
10. **Existing games — decided:** no migration is needed; perform a full `game:reset` after implementation.
11. **Inventory visibility and UI — decided:** clients receive inventory only for entities they own. Show inventory in the hover tooltip when hovering an owned entity and in the bottom entity status bar, using actual resource bars to show amount versus capacity.

## Related docs

- [M7 Resource Ledger](../milestones/m7-resource-ledger.md)
- [M8 Resource Collection](../milestones/m8-resource-collection.md)
- [Entity Intent System Requirements](./entity-intents.md)
- [Entities and Abilities Requirements](./entities-and-abilities.md)

## Deliver currently held resources

`Deliver` is a single-trip intent, separate from the maintained donor-to-recipient transport order.
For a selected movable entity with local inventory or collection cargo, show `[d] Deliver` in
its bottom details pane. The picker lists held resources with quantities, supports multiple
selections and `[A]ll`, then asks the player to click a friendly recipient with room for at least
one selected resource. Clicking the carrier again, open space, or Escape cancels the picker.
Delivery interrupts collection, follows the recipient to hull contact distance, transfers selected
collection cargo first and then local inventory up to the recipient's per-resource capacities,
and finishes. Incompatible resources and excess stock remain on the carrier. Missing/dead or
newly hostile endpoints cancel through the existing intent lifecycle notification. New orders
replace delivery normally; canceled trips preserve inventory and cargo.

## Maintained resource transport (implemented)

Select one movable worker/collector with a positive `carry_capacity`, then choose
`[s] Transport Resources`. Click a friendly donor, select one or more of its
available compatible resources (`[A]ll` selects the displayed choices), then click
a different friendly recipient. The recipient must have capacity for every
selected resource; it may already be full. Open space, clicking the carrier again,
or Escape cancels the picker. A new command replaces the active route.

The maintained route reuses the Deliver wire payload with a nonzero `donor_id`;
ordinary Deliver has `donor_id = 0` and remains a single trip. Both endpoints follow
moving entities to hull contact distance. Loading immediately debits the donor
and credits local carrier inventory. Pickup uses per-resource capacity, recipient
free space, and the shared `carry_capacity`. Unrelated upkeep stock is retained;
food/energy upkeep buffers do not consume the shipment quota. Resource choices
are deduplicated and loaded in resource-ID order, with workers processed in entity
ID order. Existing collection cargo consumes carry room and is unloaded first if
its type is selected. Partial unloading retains leftovers and waits at the recipient.
Unselected collection cargo stays aboard and can fill the carry hold, blocking
pickup. The details bar reports this wait; use Deliver to unload that cargo before
reassigning the transport route.
There are no capacity reservations between workers; a recipient that fills while
a worker is traveling makes that worker wait, preserving its inventory.

An empty donor or full recipient retries every second without finishing the
intent. The details bar shows the route, resource types and travel/wait phase.
A missing, dead, hostile or incompatible endpoint cancels with the authoritative
`TRANSFER_ENDPOINT_LOST` lifecycle reason and the UI's
`TRANSFER_ENDPOINT_LOST_EVENT` toast. Stock still on a surviving worker remains
there. Routes reconnect normally and restore from tracking when server snapshot
restore is enabled; carried inventory determines the initial restore phase.

For a small runnable check, load the `resource-transport` scenario, select worker
3, choose Transport Resources, select processor 1, choose minerals, and select
habitat 2. Resume: the worker should repeatedly move at most 50 minerals from
processor to habitat each trip. When the processor empties, the worker remains
assigned and waits there. Refilling it should resume deliveries automatically.


### Per-resource sharing policies

`resource_sharing.resources` optionally maps resource IDs to policies. All four
policy fields are required; amounts are inventory units, not percentages:

```yaml
resource_sharing:
  range: 4000
  wireless_receives: [energy]
  resources:
    energy:
      priority: 10
      refill_below: 700
      fill_to: 900
      reserve: 900
```

A receiver starts requesting when stock is strictly below `refill_below`, keeps
requesting until reaching `fill_to`, and then stops until the lower threshold
is crossed again. Higher `priority` wins over distance; entity ID breaks equal
distance ties. Wireless solar delivery, automatic sharing, and collection cargo drop-offs all
use these requests. Collection carriers choose eligible requesting refineries by
priority, distance and entity ID, unload only to the target, then keep delivering
any excess cargo to another requesting destination. If none requests resources,
they hold position with the cargo until a destination becomes eligible. Explicit
Deliver and Transport orders keep their player-selected destinations and
capacity-based transfers. A policy also opts a resource into receipt even without upkeep costs.
Outgoing transfers retain the greater of `reserve` and accrued upkeep. These
reserves apply to automatic sharing, not explicit spending or transport intents.
Refill flags are runtime state and reset on engine restart or scenario reset.

Validation requires a known resource with positive capacity, a 32-bit integer
priority, `0 <= refill_below <= fill_to <= max_capacity`, and
`0 <= reserve <= max_capacity`, with finite amounts. Monaco shows the field
hints and cross-field errors; entity saves and engine content loading enforce
the same constraints.

Habitats can use the example above; outgoing reserve should leave stock available
for nearby upkeep recipients. Factories use priority 0,
`refill_below: 3000`, `fill_to: 3000`, and `reserve: 50`, so they accumulate
leftover energy but can help refill a low habitat.
