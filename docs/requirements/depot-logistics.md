# Depot Logistics and Physical Supply Lines

**Status:** Implemented in source; pending deployment and balance playtesting.
**Date:** 2026-10-18

## Purpose

Preserve localized resources and vulnerable, long-distance supply lines while replacing the current per-entity resource-sharing policies with a small set of predictable rules. Players should manage production, stockpiles, shipping throughput, routes, and escorts. Local distribution within a base is abstracted through a depot.

This proposes a replacement for the sharing and spending model in [Localized Resources](./localized_resources.md) and [Resource Inventory Migration](./resource-inventory-migration.md). Those documents describe the previous model and remain historical context. Existing running matches are not modified automatically.

## Core model

- A depot holds an authoritative inventory. Friendly entities within its service radius may spend from it.
- Each consumer uses exactly one depot. A depot with no `shareable_with_hub` resources is a hub: it may pay from its own stock plus resources declared shareable by nearby storage depots. Other nearby hubs and carrier cargo are not pooled.
- A hub can draw only the declared resources from living, same-owner storage depots within **the hub's** `depot_range`. The consumer must remain in that hub's service radius. Storage depots do not extend coverage, relay stock, or borrow from other depots.
- Withdrawal happens only when an entire operating or action bill is affordable. Debit hub stock first, then eligible containers by entity ID; an unaffordable bill changes no inventory. No resources are deposited into the hub or automatically redistributed between depots.
- Resources otherwise move between depots aboard physical ships. Loading debits the source, transit holds cargo on the carrier, and unloading credits the destination.
- Destroying a carrier destroys its cargo. Destroying a depot or container destroys its inventory.
- Ordinary consumers do not need local resource inventories, refill thresholds, priorities, overflow policies, or operating reserves.
- Workers and freighters retain inventories for cargo. Cargo is not simultaneously treated as an upkeep buffer.

The player resource HUD may report aggregate holdings, but that total never authorizes spending. Entity UI must distinguish a hub's physical stock from the available stock it can draw from nearby linked containers; the server remains authoritative when stock or range changes.

## Entity schema

Add a top-level boolean `depot`, defaulting to `false`, and a service radius `depot_range`. Reuse existing per-resource `max_capacity` for depot stock and carrier cargo. A depot may declare `shareable_with_hub` as an array of distinct resource IDs with positive capacity; absent or empty means it is a hub. Only declared resources can be drawn by nearby hubs.

Illustrative habitat configuration, retaining its current capacities and former sharing range:

```yaml
habitat:
  depot: true
  depot_range: 4000
  max_capacity:
    energy: 1000
    food: 3000
    minerals: 1000
```

`depot: true` means nearby same-owner entities may spend resources stored on this entity. Depots without `shareable_with_hub`, including habitats, processors, and inhabited planets, can also draw the declared stock of nearby shareable storage depots when paying bills. Food and mineral storage containers declare `shareable_with_hub: [food]` and `shareable_with_hub: [minerals]`, respectively; their other stock is not linked. A positive, finite `depot_range` is required for a depot. Depot status alone does not enable gathering, transport, construction, research, or repair; existing capabilities continue to define those actions.

### Initial inventory

Entity definitions may specify `initial_resources`, a map of resource IDs to
amounts granted once when a new entity is created, including player loadouts and
completed construction. Omission grants nothing. Each amount must be finite,
nonnegative, name a known resource, and not exceed that resource's `max_capacity`.
These are ordinary spendable resources, not protected maintenance reserves.

`worker` and `scout` start with their full capacities: 50 energy, 50 food, and
50 minerals each. Explicit player-start `starting_resources` override the grant
for their listed resources on the configured recipient. Loading saved state,
reloading content, and upgrading an existing entity do not reapply the grant.

This model replaces `resource_sharing`, including `wireless_receives`, per-resource priorities, overflow priorities, refill thresholds, fill targets, and outgoing reserves. Remove `resource_reserves` when cargo no longer funds upkeep. Ordinary consumers should not be required to declare positive inventory capacities.

## Mapping to current entities

| Entity | Proposed role |
| --- | --- |
| `habitat` | General depot; retains worker/scout production, research, and local energy collection |
| `worker`, `marine_worker` | Gather, build, repair, deliver cargo, or operate a repeating freight route |
| `resource_transport` | Larger carrier using the same freight orders as workers |
| `factory`, `military_factory` | Consume from one nearby depot to produce ships |
| `collector_solar` and upgrades | Contribute collected energy to one nearby depot |
| `processor` | Mineral-focused depot for mining outposts |
| `food_storage_container`, `mineral_storage_container` | Smaller depots with specialized capacities |
| Fighters | Protect depots, collectors, and shipments; no individual resource inventory in the initial model |

Factories cease to be independent stockpiles in this proposal. Specialized depot resource capacities must still support any retained local operating costs, or those costs must be revised.

Workers can [Resupply](./resupply.md) physical cargo at a depot for remote construction.

## Depot association and local distribution

Automatically associate a consumer with a nearby same-owner depot when needed. Prefer a hub over a depot with `shareable_with_hub` resources when both cover the consumer, then keep the hub association while valid. Outside hub coverage, shareable storage depots remain independent depots. Show the association and coverage in the UI.

Use a deterministic nearest-depot choice, with entity ID breaking distance ties. For operating costs, if the associated depot and its eligible linked storage cannot cover the entire bill, switch to the nearest eligible depot that can, with entity ID breaking distance ties. Persist the new association. If no depot can cover the full bill, keep the current association and report the shortage. Depots fund their own operation; hubs can draw declared resources from nearby shareable storage depots but not other hubs. Reassociate when the current depot becomes invalid. Manual collection destination assignment is available as described below; spending associations still use automatic selection.

Check range when spending or contributing resources. Moving a depot or container changes its service or linked-storage coverage. There is no stock transfer into a consumer or hub merely because it enters coverage.

Solar collectors move into the radiation source's collection band and transmit energy wirelessly to their collection destination; they never travel to a depot to unload. A full destination reports `waiting_for_depot_capacity`; a missing or out-of-range destination reports `waiting_for_depot`. Both states hold position at the source and resume when wireless delivery is possible. Source approach movement still runs when the destination is full.

Proximity production falls linearly with center-to-center source distance:
`collector.proximity_rate_per_second * (max_distance - distance) / (max_distance - min_distance)`.
The source defines both distances through `resource_node`. Production is full at
the inner boundary, half at the band's midpoint, and zero at or beyond the outer
boundary; below the inner boundary and zero-width bands also produce nothing.
An in-band collector at zero strength reports `idle`, not a depot-capacity shortage.
This does not alter transport harvesting rates.

`star_yellow.resource_node.max_effective_distance` is 15,000 world units and its
inner distance remains 10. This reach applies to all compatible proximity
collectors, including habitats and inhabited planets. Radiation and
`collector.minimum_distance` spacing rules remain independent and unchanged.

For local production, gathered energy credits the associated depot up to capacity. Excess cannot be credited or silently moved elsewhere. Transport collection remains physical: workers gather into cargo and deliver to a depot. Retain ordinary capacity and compatibility checks.

## Assigning collection destinations

Select solar collectors or workers, press **[A] Assign**, and click a friendly compatible depot. Multiple selected collectors may be assigned together. Assignment changes a persistent collection destination without replacing the active order; an idle collector still needs a Collect order. It does not change the depot used to pay for operations or construction.

Solar collectors still require their assigned destination's service coverage and never fall back. Workers physically deliver cargo; the persistent `supply.delivery_depot_id` is the player's assignment, while the active Collect plan's `depot_entity_id` is its effective drop-off. A worker assigned to a hub may deliver to that hub or a living, same-owner storage depot within the hub's `depot_range` that declares the collected resource in `shareable_with_hub`. A worker assigned to a storage depot may also use its covering hub and that hub's matching containers: prefer the worker's associated hub if it covers the assigned depot, otherwise the nearest covering hub (entity ID breaks ties). If no hub covers the assigned depot, only that depot is eligible. The assigned depot itself remains eligible for any resource it can hold, even when it shares a different resource with the hub. Destroyed or hostile explicit assignments do not fall back; neither group changes nor delivery change the assignment.

The worker retains its effective drop-off while it has room for the collected resource. When full, the browser planner selects the nearest eligible group member with room (entity ID breaks ties), builds a safe replacement route and submits a replacement Collect order. If all compatible recipients are full, a valid current route stays active and waits for room; a newly issued Collect may plan a waiting route to the full assigned depot. If alternatives lack safe routes, the current valid route remains rather than being replaced by a hold. A worker without a connected route planner holds its existing route until capacity frees or the client reconnects; automatic offline routing to a different depot is not available. The engine checks group membership when accepting and advancing a planned route, but never treats group inventories as a shared drop-off balance. Cargo stays on the worker until physically unloaded.

Assignments survive stopping/restarting Collect, reconnects, and snapshot restoration. In Assign mode, **Use automatic destination** clears the explicit destination: solar returns to its automatic supply-depot association, while workers choose a compatible depot with room and keep a valid chosen drop-off while it has room. Explicit Deliver and Transport orders continue to use their own specified destinations. The detail panel distinguishes the assigned depot from the effective destination when they differ. A destination-change notification enters the message log only on an actual route switch; an unchanged `waiting_for_dropoff` state does not repeat its blocked toast.

Collection capacity is independent per resource. Explicit Collect orders gather and deliver only the requested resource: full food or energy does not block mineral gathering or cause those supplies to be unloaded. Planned collection routes likewise deliver only their source resource. If the requested resource is full, deliver that resource before gathering more; if its capacity is zero, collection cannot gather it. Explicit collection warnings describe only the requested resource's storage, never another full resource. Explicit Deliver and Transport orders retain their configured resource lists.

### Collection route recomputation

Changes to discovered hazards, resource sources, depots, or owned waypoints trigger
route evaluation, not unconditional replacement of the active Collect intent.
An unrelated moving habitat must not restart collectors whose existing routes
remain valid. Ordinary cargo phase changes do not redefine the recurring route;
entering `waiting_for_dropoff` after a partial unload triggers one reevaluation.

The browser planner retains the active source/depot/waypoint contract while its
geometry is valid and the current drop-off can unload the remaining cargo, or
when no eligible alternative can take more. A full or partially insufficient
drop-off triggers evaluation of other group members without changing the pinned
source. A hub's small recurring free capacity from spending must not strand a
worker carrying substantially more cargo.
With a local waypoint network, retention requires safe recurring segments,
the submitted initial approach, and every possible next leg from the worker.
The server does not publish its exact collection waypoint cursor, so this is
deliberately conservative: ambiguous paths near hazards may require a
replacement even when the server's actual remaining path is safe. Without a
local waypoint network, ordinary direct travel retains its existing
radiation-risk policy.

Invalid routes are replanned; a valid replacement is submitted with REPLACE_ACTIVE.
If no safe route exists and no valid waiting route can be retained, an accepted
collection enters a position hold once. Held or server-blocked collection must
obtain a fresh plan before resuming. Only one planner request per collector is
in flight; further updates mark it dirty and coalesce into a fresh evaluation
before an obsolete result can issue commands.

Source depletion is different from a full drop-off: a visible zero deposit,
an authoritative `source_depleted` Collect rejection, or a running route's
`route_block_code: source_depleted` excludes that source from the current order
and selects another discovered compatible source. Hidden remembered sources have
no known stock; if one is rejected, it is excluded rather than retried. A
fresh, positive observation can restore an excluded source. Replacement plans
use a depot-first initial leg when cargo remains aboard. If no candidate
remains, collection waits without resubmitting the same failed source and
reevaluates when discoveries change. A new explicit Collect resets these
per-order exclusions. The browser must be connected to choose another
radiation-safe route; a disconnected engine cannot select a new endpoint.

### Jettison cargo

Select an owned, living mobile cargo carrier with resources aboard and choose **[J] Jettison cargo**. The action supports multiple selected carriers when every selected entity is eligible; empty carriers, stationary entities, depots, and enemy entities are excluded. Issuing the command immediately discards **all** onboard resources, with no confirmation dialog, refund, or recoverable cargo drop.

Jettison is immediate and does not replace active orders, queued work, or collection/delivery-depot assignments. A worker waiting to unload incompatible cargo can resume its existing collection assignment after the inventory is cleared. Repeating delivery, transport, or resupply orders remain active and may load new resources afterward.

The authenticated intent endpoint accepts `type: "JettisonCargo"` and a positive safe-integer `entity_id`, using the normal command UUID and sequence fields. The engine validates ownership and carrier eligibility before clearing inventory, then emits Accepted/Finished for this command independently of the active order. Player MCP `send_intent` accepts the same type. Deploy the updated engine and web/shared protocol code together; no match reset is required.

## Spending and shortages

Construction, upgrades, research, and repair use one eligible funding source: one depot or remote carrier cargo. A hub's eligible shareable storage extends its available balance for declared resources, but payments cannot combine unrelated depots or cargo.

- Inside hub coverage, a worker's construction is funded by its associated hub and its eligible linked storage containers.
- Outside depot coverage, a worker may build using its own cargo if it carries the entire required cost.
- Pay construction costs upfront when construction starts; construction still takes time. Separate build duration from the old progressive resource-spending behavior.
- A factory pauses before starting work it cannot fund. Research and repair pause when their required payment cannot be made.
- Retained operating costs debit the associated depot and, if it is a hub, its linked storage directly. An unaffordable payment does not partially debit any inventory or create debt.
- Remove automatic starvation damage. Shortages produce visible operational states instead of health loss.
- Remove food and energy upkeep inventories from workers, freighters, and fighters in the initial version. Their movement and basic operation must not require cargo reserves.

The exact effects of unpaid building operation, including sensors and defenses, require a capability-by-capability decision before implementation. Do not accidentally disable retreat or basic carrier movement during a shortage.

## Freight routes

A route identifies a source depot, destination depot, and resource. Start with one resource per route to avoid mixed-cargo allocation rules. Reuse the existing maintained transport intent lifecycle and one-trip delivery where practical.

1. Travel to the source and load up to available source stock and cargo capacity, bounded by destination free capacity observed at loading.
2. Travel to the destination and unload as much as fits.
3. Repeat until replaced or canceled.

An empty source causes waiting and retrying. A full destination causes waiting with cargo retained; capacity may have changed during transit. Partial unloading preserves the remainder aboard. Canceling or replacing an order preserves cargo. Missing, destroyed, or newly hostile endpoints cancel the route with a visible notification, reusing existing endpoint-loss behavior where possible.

Loading and unloading use physical contact/proximity under the existing transport rules. Cargo is never also counted as depot stock. Explicit shipment orders may load available stock without hidden reserve policies; players must account for the source's needs.

## Expansion using existing capabilities

Current workers carry 50 minerals and 50 energy, while a habitat costs 1,000 of each. A worker therefore cannot independently carry a habitat construction kit with current tuning.

Use mobile habitats for initial expansion:

1. A worker builds a habitat inside the home depot's coverage using home stock.
2. The new habitat moves to a distant resource site, accompanied by workers and escorts.
3. Workers collect into the new habitat, establishing a local stockpile.
4. Workers operate shipments between the outpost and home; larger transports later increase throughput.

Existing habitats have speed 60. Storage containers and processors are also mobile in current content. Initially allow a loaded depot to move, making it a valuable convoy target. Balance depot mobility and capacity against dedicated freighters. A cheaper frontier depot or dedicated construction shipment can be considered later.

## Example supply line

Workers mine into a remote processor with its current 10,000-mineral capacity. Workers carry up to 50 minerals per trip to the home habitat. A `resource_transport` can carry up to 500 minerals per trip. A nearby military factory spends the habitat's minerals to build fighters.

If the trip takes three minutes each way, travel time and cargo capacity constrain delivery throughput. Raiders destroying one freighter reduce throughput. Destroying all freighters stops incoming supply, but production continues until the home stockpile is exhausted. The player can escort replacements, reroute, increase carrier count, or accumulate a larger buffer before attacking.

Distance, production rate, loading time, cargo capacity, and stockpile size determine how many carriers are needed. Preserve these physical constraints instead of creating an abstract connection that credits resources over time.

## Convoys and escorts

Resource rules alone do not make protection reliable. Convoy movement must keep carriers and escorts together at the slowest member's travel speed. Escorts should remain with the convoy and engage threats without routinely abandoning the shipment.

Audit existing group movement and combat behavior before implementation. If it cannot support these behaviors, convoy/escort support is a distinct required gameplay change, not an assumed consequence of freight routes.

## Optional later fleet supply

Initially, logistics sustains construction, repair, and replacement ships. Fighters do not consume individually carried food or energy. Escorts matter because shipments sustain military production.

If extended fleet operations need direct logistical limits later, consider one endurance meter replenished by stocked depots or supply ships. Low endurance could reduce combat effectiveness while preserving retreat movement. This is outside the initial proposal and must not recreate per-resource fighter inventories and refill policies.

## Implementation outline

1. Finalize outstanding operation, construction, and lifecycle rules below.
2. Add depot schema validation, content editor support, and the entity-role mapping.
3. Replace sharing with deterministic depot association and single-source spending. Retain inventory only where stock or cargo is physically held.
4. Adapt collection, local energy production, transport, construction, research, upgrades, repair, and operating costs.
5. Remove obsolete sharing policies, refill state, reserve handling, and starvation damage behavior.
6. Show depot associations, local stock, cargo, route status, coverage, and shortage reasons in the UI.
7. Verify convoy movement and escort behavior, implementing missing support.
8. Define reset or migration behavior for existing games and update snapshots, deltas, deterministic state, scenarios, and generated schemas as needed.

## Acceptance criteria

- A consumer cannot spend from a distant depot, a player-wide total, or a chain of overlapping depot ranges.
- Each payment is atomic across resource types and uses one eligible hub with its linked shareable storage, one independent storage depot, or one carrier's cargo.
- Multiple consumers cannot spend the same stock; processing order is deterministic.
- Loading, transit, partial unloading, waiting, cancellation, and destruction preserve the stated resource accounting.
- Nearby consumers work without per-entity refill policies or upkeep inventories.
- Collection and local energy generation stop crediting stock when the destination cannot accept it.
- Lost routes produce a clear notification; shortages identify the affected capability and funding depot.
- A remote mining outpost can supply home production through workers, with larger transports increasing throughput.
- Destroying shipments reduces delivered supply and eventually pauses dependent production after stock runs out.
- Moving or destroying a depot immediately affects eligibility without duplicating or silently relocating inventory.
- Depot inventories, carrier cargo, routes, and any stored associations survive reconnect and restore; deterministic replay produces the same spending and transfers.
- Convoys and escorts can travel together reliably enough to defend a supply line.

## Implementation decisions and rollout

- `habitat` has service radius 4,000; `processor` and both storage containers use 2,000. Existing depot capacities are retained. Ordinary factories and defenses have no physical resource inventory.
- Buildings retain depot-paid operating costs. All resources in a payment are checked before any debit. Missing operating supply pauses powered combat, sensors, production, research, and repair; movement remains available and hulls take no starvation damage. Generation can replenish an empty depot and collection retains its existing maintained `Collect` order.
- Workers, marine workers, resource transports, scouts, fighters, heavy fighters, battleships, and science vessels have no carried upkeep requirements. Research and repairs still consume resources for their explicit work.
- Build and upgrade options now declare `duration_seconds`. Existing rates were converted into equivalent durations. Costs are paid once when simulation work first starts, with no cancellation or destruction refund. Payment identity and progress are checkpointed in the same entity snapshot as inventories to prevent duplicate charges after restore.
- Research continues to charge atomically as work progresses. Research and upgrade progress can be restored along with construction.
- Solar collection without a valid depot pauses resource intake; full depots also stop intake. There is no solar collector buffer. Positive depot capacity determines accepted resources.
- Depot selection prefers hubs (depots without `shareable_with_hub` resources) over shareable storage depots, then nearest distance and entity ID; a valid hub association stays fixed while it can fund operating costs, otherwise the consumer switches to the nearest eligible depot that can cover the entire operating bill. Hub withdrawals link only declared resources in nearby shareable storage depots, never other hubs; spending associations remain automatic. Collection destinations can be assigned independently using the Assign command.
- Freight routes select one resource. One-trip delivery can select several held resources. Existing convoy formation and leashed escort orders are reused.
- Depots retain current movement capabilities. Destruction loses their stock; upgrades retain inventory under the existing entity transformation behavior. No new capture mechanic is introduced.
- Authoritative and client intent protocol versions are now 19. Snapshots use `economy_version: 1`. The upgraded engine refuses to restore an older populated player match, rather than silently discarding consumer stock or misinterpreting partially paid construction.
- Before deploying to an existing match, archive the old match and perform an explicit `game:reset`. Implementation does not reset the running game. Bundled scenarios were adapted by relocating old consumer stock to physical depots; above-capacity saved stock remains preserved and cannot receive further inflows until room exists.
- Deprecated configuration remains decodable and syntax-validated but does not enable sharing, reservations, or old drop-off behavior. See [Resource field deprecations](./resource-field-deprecations.md).

## Future tuning

- Playtest depot ranges, specialized storage capacities, and mobile depot speed/capacity against dedicated freighters.
- Consider a cheaper frontier depot if mobile-habitat expansion is too expensive.
- Consider manual depot assignment if automatic association is insufficient.
- Fleet endurance and mixed-resource route allocation remain outside this implementation.

## Validation

All engine targets compile, frontend TypeScript checking passes, replay tests pass, and 42 focused web tests pass. The engine suite passes 123 tests with one Redis integration test ignored and three pre-existing failures excluded. Those three failures also reproduce in an isolated unchanged checkout: scout speed and worker repair-efficiency content expectations, and the celestial-field planet-count expectation. The broader web suite's existing build-state import, delivery dispatch, Redis mock, and spawn-validation failures also reproduce unchanged. Live deployment and balance playtesting have not been performed.

## Related documents

- [Localized Resources](./localized_resources.md)
- [Resource Inventory Migration](./resource-inventory-migration.md)
- [Entity Intent System Requirements](./entity-intents.md)
- [Entities and Abilities Requirements](./entities-and-abilities.md)
