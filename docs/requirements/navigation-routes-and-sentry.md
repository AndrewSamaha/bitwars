# Server navigation routes and Sentry

Status: approved behavior; implementation begins with server Move routes.

## Goals and agreed behavior

1. Move waypoint execution becomes authoritative on the server. Browser disconnects
   must not prevent subsequent legs from starting.
2. Sentry is a maintained server order for one or more ships. It follows a route
   forward and backward continuously, without repeating endpoints.
3. A single ship's initial waypoint is its authoritative position at acceptance.
   A group's initial waypoint is the authoritative centroid at acceptance.
4. Groups assemble and travel using an anchor and stable formation offsets at the
   slowest surviving member's speed. Ships break formation when engaging enemies.
5. Sentry uses the existing click/Shift-click waypoint interaction. It starts on
   the first destination click; no draft confirmation step is required.
6. Individual replacement orders detach only their target member. Death removes a
   member. Remaining offsets stay stable; a one-member order can continue.

## Existing implementation

- `engine/intent.rs`: one active action per entity, Move steering and completion.
- `engine/convoy.rs`: group validation, assembly, anchor movement, member lifecycle.
- `engine/mod.rs`: command ingestion, both tick paths, combat eligibility, recovery.
- `combat.rs`: deterministic acquisition, pursuit, range, cooldowns, damage.
- `io/redis.rs`: active tracking, reconnect summaries and world checkpoints.
- `intentQueueManager.ts`: browser waypoint execution and localStorage persistence.
- `GameStage.tsx`: click/keyboard handling, destination assignment, route rendering.

Active player actions currently suppress autonomous combat entirely. Convoy writes
positions after ordinary physics. Sentry must change eligibility for its members
and explicitly arbitrate movement; simply allowing combat during a convoy would
have pursuit overwritten by the formation mover.

## Shared concepts

`NavigationRoute` owns waypoints, next waypoint index, traversal direction and
traversal mode (`finish` or `ping_pong`). Advancing a route is deterministic and
independent of entity movement, combat, Redis and UI. Endpoints are visited once
per reversal: `Start, A, B, C, B, A, Start, A, ...`.

Orders own identity, owner, members, lifecycle, route and interruption policy.
Formation state owns anchor, offsets and assembly progress. Extract formation
mechanics from Convoy rather than copying them into Sentry. Convoy remains a
finite trip; Sentry remains active across waypoint arrivals and combat.

Limits: at most 256 members and 256 retained waypoints per route. Validate owned,
living, mobile members and finite destinations before mutating any action.
Reject over-limit edits atomically. Consecutive identical destinations must not
cause an unbounded loop within a tick.

## Milestone 1: migrate Move routes

### Command semantics

- Click / `REPLACE_ACTIVE`: replace the selected entity's current order with a new
  Move route whose first destination is the clicked point.
- Shift-click / `APPEND`: append immediately to an active Move route; start a new
  Move route if idle. Reject `ENTITY_BUSY` if another kind of order is active.
- Ctrl-click / `CLEAR_THEN_APPEND`: on an active Move route, retain the current leg,
  discard later destinations, and append the clicked point. If idle, start a new
  Move route. Reject when another kind of order is active.
- Multi-selection retains independent Move routes and existing destination
  assignment. Convoy remains an explicit separate command.

Appending is a route edit with its own command ID and sequence number. It does
not replace the root order identity or emit a cancellation for that order. Emit
ACCEPTED and FINISHED for the edit itself; root FINISHED means the entire Move
route has ended. Internal leg arrivals never release the member action slot.
Deduplication and sequencing apply to edits exactly as to other commands.

Each accepted Move creates one server order with entity ID, owner, root command
and intent IDs, start tick, and route. Existing steering and stop radii apply to
each leg. Leg completion updates the active destination for the next tick. An
individual replacement/death removes both its Move action and route.

### Persistence and publication

Checkpoint Move orders and route cursors together with entity positions. Recover
only valid orders whose latest tracking still identifies that root order; never
resurrect a later replacement. Recovery uses the latest checkpoint, with the same
rollback window as other world state. Browser reconnect needs no replay of
waypoints to continue execution.

Publish owner-only Move route summaries through snapshots, route-change deltas,
and reconnect. Include root identity, current waypoint index and ordered
waypoints. Update tracking when the active leg or route changes. Completion and
replacement publish route removal even when position and velocity do not change.

### Browser cutover

- Send Shift/Ctrl edits immediately; retain only display/pending state locally.
- Stop draining local queues on lifecycle events and reconnect.
- Keep optimistic edit IDs separate from the active root command, so an edit's
  FINISHED/REJECTED cannot clear the root order.
- Serialize intent HTTP submissions per browser session so rapid waypoint edits
  arrive in sequence. A failed submission must not block later submissions.
- Render authoritative current and remaining waypoints. Show pending destinations
  until accepted or rejected; reconcile on connection failure.
- Version persisted storage. Discard legacy unsent browser queues rather than
  replaying them alongside server routes; preserve the sequence counter and
  reconcile active orders. Surface a one-time migration notice if a queue was
  discarded. Never silently claim those old destinations were migrated.
- Retire local execution fields and stale comments once all consumers have moved.
- Bump protocol version with the browser cutover, then restart engine and web
  together. Backend route support can land first while the old client still
  submits single destinations.

### Acceptance checks

Execution continues across disconnects; append/clear semantics work while moving
and idle; busy non-Move orders reject without mutation; edits preserve root IDs;
intermediate arrivals do not emit root FINISHED; replacement/death remove routes;
reconnect and checkpoint recovery retain route progress; owner filtering covers
both updates and removals; fast clicks remain ordered; no legacy queue draining.

## Milestone 2: shared formation navigation

Extract slot assignment, assembly and shared anchor advancement into a mover
usable by Convoy and Sentry. Preserve existing Convoy behavior and member-scoped
lifecycle events. A caller chooses its destination and decides what arrival means.
The mover must support suspension and regrouping without finishing actions.

Acceptance: deterministic slots, largest-hull clearance, assembly barrier, minimum
speed, exact arrival, stable offsets after detach/death, and checkpoint recovery.

## Milestone 3: Sentry order and UI

A new Sentry command accepts member IDs and the first destination. Capture the
starting position/centroid server-side, prepend it, assign deterministic slots,
and start assembly. Single-member Sentry uses zero offset and needs no formation
assembly. Route traversal uses `ping_pong`.

Select Sentry, click to start, Shift-click to append destinations to the same
order. Capture the member selection for that order so selection changes cannot
accidentally append to an unrelated group. An append identifies the order by its
root ID. Normal click replaces with a new Sentry order. Ctrl-click preserves the
current target and starting waypoint, removes future user destinations, and
installs the new endpoint; remap the cursor explicitly and preserve the active
leg rather than teleporting or skipping it.

If appending while moving in reverse, preserve the current target and direction.
The new endpoint will be visited on the next outward traversal. Appending during
combat edits the stored route without changing the interruption anchor or current
leg. Sentry selection clears Move/Convoy and other command modes. Display the
complete route, direction/current destination, and assembly/patrol/combat/regroup
status. Choose a non-conflicting keyboard shortcut during UI implementation.

### Combat and resumption

Phases: `assembling -> patrolling -> engaged -> regrouping -> patrolling`.
Combat may interrupt assembly or regrouping too. Preserve the phase/route target
being interrupted and freeze the group's navigation anchor.

Combat must report engagement decisions (attacker, target, strategy) independently
of shot events; approaching and cooldown waiting still count as engaged. Preserve
current deterministic targeting and weapon rules. Allow autonomous combat for
Sentry members while ordinary Move/Convoy keep existing suppression.

When a member acquires an eligible enemy, pause group route advancement. Members
with `approach` pursue and attack independently at their own speeds and ranges.
Other members hold or react using their own combat profiles. No group formation
position write may override a member's combat movement. Resolve movement ownership
before integration; combat currently also snaps positions near weapon range, so
that behavior must be accounted for in the refactor.

Once all surviving members have no eligible targets, return to stable offsets
around the saved interruption anchor, then resume the same route target and
direction. Clear residual pursuit velocities before holding/regrouping. Target
death, leaving acquisition range and lost validity all end engagement when no
replacement target is available. Another encounter during regrouping suspends it
again without advancing the route. Do not reset weapon cooldowns on phase changes.

Open policy: a pursuit leash would prevent an enemy drawing patrols arbitrarily
far away. Initial implementation preserves existing acquisition behavior unless
an explicit leash distance is agreed; do not invent a content default silently.

### Persistence and lifecycle

Persist route, direction, cursor, anchor, offsets, phase, interruption state and
members with the world checkpoint. Re-evaluate combat targets against the recovered
world; do not trust stale target IDs or resume an invalid chase. Keep an explicit
safe recovery rule for each phase. Sentry never emits FINISHED on waypoint arrival;
it ends by cancellation, replacement, or losing its final member.

Route edits and membership changes are atomic at command validation and Redis
tracking boundaries. Reconnect and streaming publish owner-only route, member and
phase summaries. Extend explicit game-query representations for inspection.

### Acceptance checks

Single and grouped ping-pong patrols; server-captured origin; Shift/Ctrl editing in
both directions and during combat; independent pursuit with different ranges;
cooldown waiting; target loss/death and reacquisition; regrouping before resumption;
combat during assembly/regrouping; member replacement/death; no movement overwrite;
checkpoint recovery in every phase; no target/destination information leak.

## Implementation progress

- [x] Inspect movement, combat, convoy, UI and persistence boundaries.
- [x] Record agreed behavior and migration plan.
- [x] Server Move route execution and reusable route traversal.
- [x] Move route checkpoints, Redis tracking and reconnect summaries.
- [x] Owner-only route summaries in snapshots/game-query.
- [ ] Route-change streaming, including removal notifications.
- [ ] Browser cutover, queue migration and route display.
- [ ] Shared formation mover.
- [ ] Sentry command, edits and UI.
- [ ] Combat arbitration, regrouping and Sentry recovery.

### First implementation increment

The backend supports active Move route append/clear, root-preserving leg
advancement, and checkpoint recovery. Reconnect includes `move_route` in each
active Move summary. `Snapshot.move_orders` is projected through owner filtering.
The browser remains on its existing queue behavior until route-change streaming
and the client storage migration are implemented together. Sentry is specified
but not exposed as a command yet. Ping-pong traversal is implemented and tested
as a reusable primitive; combat and formation integration remain later milestones.
