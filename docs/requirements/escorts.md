# Escort orders

Status: implemented in protocol 17; automated verification recorded below.

Escort is a maintained order for one or more ships to accompany an owned mobile
entity. The escorted entity (the leader) keeps its own orders. Its authoritative
position anchors the escorts' formation through collection, delivery, waiting,
and subsequent trips. There is no destination to click and no arrival that ends
the escort order.

## What the current implementation provides

- `services/rts-engine/src/engine/intent.rs` owns one active action per entity,
  ordinary Move steering, speed limits, stop radii, and action replacement.
- `engine/navigation.rs` owns server Move routes and waypoint progression. Move
  targets are coordinates, rather than references to moving entities.
- `engine/convoy.rs` validates 2–256 members atomically, claims their action slots,
  assembles at a captured centroid, and travels to a fixed destination at the
  slowest surviving member's speed. Arrival finishes the order. Replacement or
  death removes individual members without changing surviving offsets.
- `engine/formation.rs` supplies deterministic hull-spaced slots, exact assembly,
  rigid anchor travel, and suspension. Convoy and Sentry share this component.
- `engine/sentry.rs` supplies maintained formation orders, autonomous combat
  arbitration, recovery, and owner-only order updates/removals. After combat,
  Sentry regroups at a frozen interruption anchor and resumes its route.
- `engine/mod.rs` controls collection/delivery movement, combat eligibility,
  physics, formation advancement, lifecycle, and both simulation tick paths.

Putting the worker in a Convoy would replace its collection/delivery action and
make the trip end at a fixed point. Repeated Move commands would lose the stable
order identity and require continuous retargeting. Escort needs a persistent
entity reference and movement ownership for followers only.

## Command behavior

Select 1–256 mobile ships, choose **Escort**, then click an owned mobile leader.
The command replaces only the selected escorts' actions and routes. The leader
retains its collection/delivery state, cargo, destination choices, and timing.
The leader does not have to become a member of another formation.

Example: two fighters escort a food transport. They assemble around it while it
loads, follow when it departs for a habitat, hold their offsets while it unloads,
and accompany its return trip. Changing the transport's assignment changes where
the escorts go without issuing another escort command.

### Formation and movement

Use stable offsets around the leader, with its own position reserved at zero.
Start with a world-axis square lattice, filling cells outward from the reserved
center in a deterministic order and assigning escorts by numeric entity ID.
Spacing is twice the largest hull radius among leader and escorts plus one world
unit. One escort gets a nonzero offset. Existing centered Convoy slots cannot be
used unchanged: a single member would otherwise occupy the leader's position.

For each escort, the desired position is `leader.position + offset`. Hold the
offset when the leader stops. Keep offsets across member removal; do not recenter
survivors. Separate orders on the same leader should share one slot allocation
namespace so their escorts do not receive overlapping slots. New members take
unused cells without moving existing members. Persist that allocation.

The leader continues at its normal speed and never waits or slows for guards,
including during initial assembly, catch-up, combat, and return from combat.
Each escort uses up to its own content speed to catch up; movement never
teleports it or exceeds its speed limit. Guard ships will generally be faster
than workers, but eligibility does not require this.

Catch-up speed is not the escort's permanent travel speed. Clamp each step to
the current slot so a fast guard cannot overshoot it. On reaching that slot,
reduce speed to match the leader's actual displacement per tick, retaining the
offset. If the leader stops, the settled escort stops; if it changes speed or
direction, the escort adjusts and catches up again as needed. Use resolved leader
displacement rather than its content maximum speed or possibly stale velocity.
This requires no new boost mechanic or acceleration model: use the existing
movement limits, with bounded correction while displaced and matched motion
once settled. Verify that the transition does not cause oscillation or repeated
full-speed bursts around the slot.

An escort that is too slow falls behind and catches up when possible. Display
this as **catching up**, rather than claiming the formation is intact.

Implement pursuit as a bounded step toward the leader's resolved position for
the current tick. Reuse the exact per-member approach underlying formation
assembly; add an explicit follow-anchor operation that can skip engaged members.
Do not use rigid `TravelTo`: that advances a shared anchor at minimum group speed
and writes every member directly to its slot, which could snap a lagging ship.
The leader must never be position-written by the escort mover.

There is no assembly barrier for the leader. **Forming**, **in formation**, and
**catching up** describe follower readiness, not permission for the leader to
depart. Use a small documented positional tolerance with hysteresis for these UI
states; keep movement clamping precise and avoid per-tick status flicker.

### Combat

Escorting fighters should defend while scouts can simply accompany the leader.
Explicitly allow Escort members through autonomous combat eligibility, as Sentry
does; an ordinary active action currently suppresses autonomous combat.

Use the existing weapon, acquisition, cooldown, and targeting rules. Add a finite
escort leash around the leader so an enemy cannot draw defenders indefinitely
away from the transport. Acquisition and pursuit must respect the leash as well
as existing combat ranges; the leash follows the leader. The leash radius uses
that guard's existing content-defined `combat.acquisition_range`. Both the guard
and candidate target must be inside this leader-centered radius to engage. This
retains a finite, content-controlled pursuit boundary without a new balance knob.

An engaged escort temporarily gives movement to combat. Non-engaged escorts keep
following; the leader never stops because a defender engages. When an enemy dies,
becomes invalid, or leaves the leash, the escort returns to its slot around the
leader's current position. It does not return to a frozen encounter location.
Preserve weapon cooldowns through transitions. Report per-member **engaging** or
**returning** status because the group can contain both fighting and following
ships. Order summaries may aggregate these statuses.

Combat is a temporary interruption within the same Escort order, not a replacement
Attack order or membership removal. Retain the leader reference and reserved
slot throughout. Automatically catch up at the escort's available speed after
combat, then reduce to the leader's speed on rejoining. No player command or
whole-group regroup barrier is needed. A new eligible threat may interrupt return
subject to the same leash. Explicit player-issued replacement commands still
detach the ship and end its automatic return behavior.

This uses the combat interruption pattern already implemented for Sentry.
Current Convoy orders suppress autonomous combat; adding combat to Convoy itself
is a separate change.

Resolve movement ownership before physics, and apply follower positioning only
to non-engaged escorts after the leader's movement is resolved. Account for combat
position clamps as well as velocities. No formation write may overwrite pursuit,
and no escort write may move the leader.

### Validation and lifetime

Validate the entire request before replacing any action:

- Unique, living, owned, mobile escorts; 1–256 per request and at most 256 total
  escorts per leader. Finite positions and valid hull/speed definitions.
- A living, owned, mobile leader with valid geometry, excluded from escort IDs.
- Replacement policy only initially; waypoint append policies do not apply.
- No escort chains in version one: a leader cannot itself be escorting, and an
  escort candidate cannot currently lead another escort order. Reject atomically
  rather than silently canceling dependent orders. A leader may use Move, Collect,
  Deliver, Convoy, or Sentry; followers track its resolved position in every case.

A new individual order for an escort detaches only that ship. A rejected order
changes nothing. The remaining ships keep their slots. Replacing the leader's
own task does not cancel escorts. Explicitly selecting it in a new group command
still applies that command's normal action semantics.

Escort remains active while the leader is idle, loading, unloading, or blocked.
It ends through cancellation/replacement, loss of the escort, or loss of a valid
leader. If the leader is destroyed, removed, changes owner, or becomes ineligible,
cancel surviving escort actions with an explicit target-loss reason and stop
escort steering at their current positions. Do not pick another leader or convert
to a different persistent order automatically. Normal idle behavior may resume.
An empty order dissolves; a one-member order remains valid.

If an upgrade changes hull geometry, recompute safe spacing deterministically
and reform without snapping ships. This is an explicit geometry-change exception
to fixed offsets; ordinary member removal preserves the previous spacing.

## Command, persistence, and UI

Proposed command payload: `Escort { entity_ids, target_entity_id }`, with the usual
command UUID, sequence, run ID, and replacement policy. Protocol 17 adds a dedicated envelope
payload and an explicit Escort order representation. Do not represent it externally as a stream of ordinary Move edits.

The escorts occupy active action slots; the leader does not acquire an extra
action. Reuse shared command identity and member-scoped lifecycle events from
Convoy/Sentry. Validate before mutation and persist member tracking atomically.
Emit acceptance/progress per escort, cancellation on replacement or target loss,
and removal when the order ends. Reaching a slot never emits root FINISHED.

Checkpoint identity, owner, leader ID, stable slot allocation, spacing, and member
state with world positions. Recover only members whose latest tracking still
identifies that order. Resolve the leader against the recovered world, recompute
following status, and re-evaluate combat targets; do not restore stale pursuit.
Keep the existing checkpoint rollback window and browser-independent execution.

Publish owner-only summaries through snapshots, deltas, reconnect, and explicit
game-query representations, including removals when nothing moves. Include the
leader ID, members/offsets, and member statuses. Avoid duplicating the moving
anchor in streamed order updates: clients can derive it from leader position.
Do not leak leader references or private orders to other player streams.

The UI shows a leader highlight and escort links/slots, the leader's name/ID, and
member readiness or combat status. Clicking empty space while choosing Escort
does not turn it into Move. Reject invalid targets visibly. Modifier keys do not
queue destinations. A new batch may join an existing leader without replacing
previous escorts; retain separate command identities and shared slot allocation.
Provide cancellation through the existing order cancellation interaction, or add
an explicit stop-escorting action if no such interaction exists.

## Agreed travel policy

Escort never adds a wait-for-guards or minimum-group-speed constraint to the
leader. Formation can temporarily stretch during catch-up or combat. Restoring
it is the escorts' responsibility, while the worker continues its existing task.

## Implementation sequence and acceptance

1. Add leader-relative geometry and bounded follow-anchor movement. Verify one
   escort, mixed hulls/speeds, stationary/moving leaders, abrupt direction changes,
   no snapping, damping independence, and stable slots after detach/death. Verify
   fast catch-up transitions to matched speed without overshoot or oscillation,
   including leader stops/restarts; slow escorts never delay the leader.
2. Add Escort protocol, validation, membership, lifecycle, and both tick paths.
   Verify collection/delivery state and cargo remain intact through repeated
   trips; leader task replacement/idle, invalid requests, chains, multiple batches,
   group-controlled leaders, ownership changes, and target death.
3. Add combat eligibility and explicit leash configuration. Verify cooldown
   waiting, pursuit at the boundary, a moving leader, independent member combat,
   automatic return to the current leader with the same order and slot, matched
   speed after rejoining, and no competing position/velocity writes. The worker
   must continue through all combat and return phases.
4. Add checkpoint/tracking recovery, private publication, reconnect, game-query,
   and UI. Verify disconnects, every member phase on recovery, later replacements
   not resurrected, order removals, and owner filtering.

Keep the existing Move, Convoy, and Sentry behavior covered by regression checks.
This proposal adds neither pathfinding nor obstacle avoidance; collision-free
slots describe the settled formation, not guaranteed collision-free catch-up
trajectories.

## Implementation and verification

Select guards, choose **Escort (E)**, and click another owned mobile ship.
Selected guards render live links to their leader-relative slots. Orders &
Waypoints displays leader ID and member status. Issue an ordinary replacement
order to stop escorting with an individual guard.

`engine/escort.rs` owns validation, leader-relative slot allocation, following,
combat interruption, lifecycle, publication and recovery. Worker actions are never
claimed. Shared slot indices prevent overlap across batches; spacing grows for
larger hulls and stays stable when members leave. Recovery resets members to
returning and re-evaluates combat. Redis tracking and root summaries update in one
transaction; snapshots and deltas expose explicit owner-filtered Escort state.

Engine and web must restart together for protocol 17. The implementation does
not require changes to entity content.

Verification: 12 new engine tests cover following, speed matching, combat/leash
and cooldown behavior, validation, shared slots, target loss and recovery. All
41 targeted web tests pass, including 18 new Escort tests for HTTP encoding,
validation, lifecycle, reconnect, private projection and stale removals. Web
TypeScript checking passes. The full engine suite has the same ten failures as
the unchanged engine baseline with the current content edits; 123 tests pass
and one is ignored. Live browser gameplay validation has not been performed.
