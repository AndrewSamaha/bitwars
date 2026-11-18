# Collector routing notification churn

Investigation at `e61ed80679180845c9d415e7502f9bfd4f52fe7e`; no product changes.

## Conclusion and confidence

The browser planner can repeatedly replace a valid Collect route to chase tiny,
temporary openings in almost-full linked depots. Capacity is measured as current
stock headroom, without reserving incoming cargo. A candidate need only have
positive room, even if it cannot unload the worker's remaining load. This is a
confirmed executable failure mode, consistent with the supplied runtime evidence.
Two depots that remain **exactly** full do not, by themselves, produce this loop
for an accepted, assigned route: the planner retains its waiting endpoint.

The task brief reports repeated Collect acceptance, `cancel context=replace_active`,
and restart for workers 974, 981, 982, 1295 and 1303 every roughly 2–3 seconds,
with successful intent HTTP responses. That observation was supplied by the
integration agent, not independently captured here. It supports real command
churn rather than duplicate rendering. The specific causes of changing capacity
at depots 1414/1426 (spending, transfers, competing deliveries, or another change)
remain hypotheses. The read-only game-query `get_snapshot({})` attempt returned
`TypeError: fetch failed`; no live balances, assignments, or browser planner inputs
were obtained. No Redis access or game-state writes were performed.

## Code path

- `apps/web/src/features/collection-routing/collectionRouting.ts`, `refresh()`:
  a 200 ms coalesced game-state listener replans on a global fingerprint change.
  The fingerprint includes each depot/resource's boolean `capacity > stock`;
  crossing full/open at any depot invalidates every managed order. Entering
  `waiting_for_dropoff` separately triggers a replan. Numeric headroom changes
  that stay positive are not represented, so recovery can also be delayed.
- `apps/web/src/features/collection-routing/planner.ts`, `CollectionPlanner.plan()`
  (roughly lines 202–310): assignment selects a hub/linked-depot group. This is
  distinct from the worker's funding `supply.depot_id`. `remaining()` subtracts
  current stock only; `available` accepts any `remaining > 0` and sorts by worker
  distance, not capacity. No incoming collection reservation is used in this path.
  `partialDropoff` applies while waiting with cargo greater than current room;
  `better` means only another depot has more room than the current one, with no
  requirement to fit the load. Thus 0.005 room beats zero for a 6.4 load.
  Outside waiting, a current depot with positive room is preferred, but a full
  current depot goes behind open candidates even while the worker is en route.
  The current/assigned compatible full endpoints are appended as fallbacks;
  they do not displace an open candidate with a usable route.
- `collectionRouting.ts`, `complete()`: retained or identical plans avoid sends.
  Changed depot IDs defeat `sameTravelPlan`, invoke `order.send`, and dispatch
  `CollectionDestinationChanged` immediately upon submission. This event indicates
  a client routing decision, not confirmed arrival or accepted unloading.
  `intentQueueManager.ts`, `submitPlannedCollection()` uses a new UUID and
  `REPLACE_ACTIVE`; normal collection send callbacks also submit replacement
  orders according to their original policy. Engine `intent.rs` cancels an active
  action under that policy, explaining the reported cancel/restart records.
- `services/rts-engine/src/engine/collection_routes.rs`, planned collection step:
  the engine travels to the specified depot and calls `deposit_collection_inventory`.
  Remaining cargo produces `waiting_for_dropoff`; it retries that endpoint on later
  ticks. It does not select another linked endpoint in this path. Route validation
  allows compatible full endpoints, which is necessary for waiting. A successful
  acceptance does not promise available unloading capacity at arrival.
- `GameStateStreamBridge.tsx`, collector updates (roughly lines 435–441): waiting
  notifications are edge-triggered on activity changing into `waiting_for_dropoff`.
  Replacement travel leaves waiting; the next failed/partial unload enters it
  again. `LifecycleToasts.tsx` publishes every reroute and dropoff-blocked event;
  `messageLog.ts` appends them (retaining the last 100) without deduplication.
  `collectionRouting.block()` deduplicates blocked reason signatures, but does
  not govern these reroute/wait messages. Repeated messages are expected from
  repeated real transitions; deduplicating display alone would leave the churn.

## Executable reproduction

A dependency-free Node 24 probe imported the actual `CollectionPlanner` directly
from its TypeScript source. Synthetic definitions: worker mineral capacity 10,
cargo 6.4, mineral source at (500,0), assigned hub #2 at (0,0), linked storage #4
at (200,0), both mineral capacities 100, hub range 1000, no hazards or waypoints.
Worker at (0,0), activity `waiting_for_dropoff`; current plan source #3, depot #2,
empty waypoint lists, `initialToDepot: true`. Each planned result becomes the next
`currentPlan`. `node --input-type=module` with `node:assert/strict` verified:

| Step | Hub stock | Storage stock | Planner result |
| --- | ---: | ---: | --- |
| 1 | 100 | 99.995 | Plan depot #4 |
| 2 | 99.995 | 100 | Plan depot #2 |
| 3 | 100 | 99.995 | Plan depot #4 |
| 4 | 100 | 100 | Retained at #4 |
| 5, activity changed to moving_to_dropoff | 99.995 | 100 | Plan depot #2 |

All five assertions passed. Stock alternation was synthetic input, not a claim
that the engine generated it in this run. Node emitted its existing module-type
warning and exited 0. The probe demonstrates both waiting oscillation and
mid-travel redirection without modifying repository code or starting services.

Existing tests explain the gap: `collectionRouting.test.ts` covers fractional
hub headroom with an empty alternative and full-group retention. The partial
dropoff test never adopts the resulting storage plan before its final retention
assertion. `collectionRoutingLifecycle.test.ts` tests one waiting transition and
unchanged follow-up state, not repeated deliveries/capacity crossings or workers
contending for the same opening.

## Smallest proposed correction and regression plan

Change depot selection rather than merely suppressing notifications. For an
accepted cargo delivery, keep the current valid route/waiting endpoint unless
an alternative offers meaningful unloading capacity. A concrete conservative
rule is that capacity-only failover must fit the remaining requested-resource
cargo (with a consistent numeric tolerance), rather than merely exceed current
headroom. Apply it both while waiting and while moving to a dropoff; retain the
current full endpoint when no alternative qualifies. Continue retrying local
partial deposits and preserve source/assignment/geometry invalidation behavior.
This trades opportunistic small partial deliveries for stable waiting, so confirm
that policy with the integration owner before implementation.

Update refresh eligibility to notice when an alternative crosses the required
cargo threshold, not just zero headroom; otherwise a retained worker can miss
newly sufficient space. Reuse the existing identical-plan guard. Do not disable
routing validation or reject full-depot routes at the engine boundary.

Current-stock capacity can disappear before arrival even with a fit rule.
Incoming-load reservations or a retry/cooldown policy may be needed for sustained
multi-worker contention. Those are larger changes; the investigation does not
establish that reservations are necessary to resolve the reported incident.

Useful regression scenarios:

1. Alternate fractional headroom between two nearly full linked depots over
   several waiting/moving transitions: no replacement churn; worker keeps cargo.
2. Both depots exactly full: retain valid route and wait; opening enough space
   triggers one safe failover, including headroom changes that remain positive.
3. Partial local deposit plus recurring spending: finish at the same depot when
   alternatives cannot fit the remainder; preserve unrelated resource cargo.
4. An alternative can fit the remainder: reroute once, preserve assigned depot,
   reverse waypoint itinerary and initial cargo-delivery direction.
5. Several workers target one newly opened depot; consume its room before arrival.
   Assert stable recovery and bounded command/message rates over multiple cycles.
6. Invalid source/depot/assignment/waypoint and radiation changes still block or
   replan; unchanged geometry and plans still avoid replacement commands.
7. Repeated identical waiting deltas emit no extra message; genuine new waiting
   transitions and successful changed destinations remain observable.

## Validation and runtime follow-up

`git diff --check` is the required documentation check. No product code changed.
The five direct planner assertions above passed. Vitest/typecheck were skipped:
this task checkout has no installed `node_modules`/Vitest binary. No shared
services were started, stopped, or reset; no dependency installation was needed.

Integration should capture successive read-only snapshots and browser planner
inputs around a reversal for worker 981: assigned depot, active destination,
cargo, collector activity, precise per-resource depot headroom, active command
ID and tick. Compare player ledger `spend_total` and transfers to establish why
room reopens. Correlate those inputs with intent accept/cancel and UI events;
also check whether multiple active browser tabs manage the same workers. Multiple
tabs are an unverified possible amplifier, not required for this reproduction.
After a fix, observe several capacity cycles with all listed workers and confirm
bounded replacements, preserved cargo and eventual unloading. This documentation
commit needs no runtime restart; any future client fix needs loaded clients to
refresh before judging runtime behavior.
