# Early Build Test — v5: execution and handoff guide

## Purpose and scope

**Begin playing now when given this file as your agent instructions.** This
document is the task: connect through MCP as `agent-nemo` to the configured
local game, establish food and mineral collection, build and activate one
solar collector, and document the results and process improvements in a new
run report that another agent can use without conversation history.

The user authorizes logging in as this player and issuing the collection,
movement, construction, and activation intents needed for this workflow,
including moving the owned habitat for construction resource access. Inspect
and continue the player's existing state rather than assuming a fresh spawn.
If the user explicitly supplies another identity or scope, use that instead.
Do not reset the world, load a scenario, or switch identities to bypass a
failure. Additional builds are optional experiments after the core goal.

Read the whole guide, then create the report, discover tools, connect, and
carry out the workflow. Do not ask what to do next, offer a menu of actions,
or stop after explaining a plan or establishing the baseline. Choose routine
implementation details yourself and continue through verification and the
written handoff. Ask for input only when a concrete blocker requires
information or permission you do not have; first complete all independent
diagnostics and record the blocker. Honor actual tool approval requirements.

**Keep playing until every core completion criterion is verified.** A partial
report is a checkpoint, not permission to end the task. There is no default
run deadline or fixed recovery-attempt budget. Do not stop because a wait
expired, two observations showed no progress, an accidental order was sent,
or writing a handoff would be easier than correcting the current state.
Only stop early for an explicit user stop/limit, an enforced execution limit,
or a demonstrated external blocker that cannot be resolved with available
authorized actions. Explain that blocker with evidence and the exact missing
capability; do not describe an unfinished run as complete.

If the user explicitly asks only to review or edit this file, perform that
document task without starting a game run. Otherwise, receiving this file as
the run instructions means execute it, not offer to execute it.

Read [game-query.md](../game-query.md) for authoritative inspection and
[mcp-test.md](../mcp-test.md) for the current player workflow and observation
contract. Inspect live tool schemas before calling them; MCP tool prefixes
can differ between hosts. Repository guidance and current schemas take
precedence over historical examples here.

## Lessons from the previous run

The report `early-build.v4.run-20261025T173106Z.md` recorded repeated
accidental Collect calls without exact Move payloads or command IDs. It does
not establish that the transport converted Move into Collect. Its claim of
journal corruption also lacks diagnostic evidence. Treat both as unverified
claims; use actual tool arguments, submission receipts, command lifecycle,
and observed state to distinguish input mistakes from gateway or engine issues.
Do not import its entity IDs, positions, or assumptions into a new run.

Collection loops can be replaced immediately. Reserve the builder and move
it while the food and mineral workers continue collecting. Delivery criteria
require a verified delivery, not termination of the collection loop. Two
submissions with the same unexpected outcome trigger investigation before
another write; this limits blind repetition, not progress toward the goal.
A report update is followed by the next gameplay tool call while authorized
work remains.

## Mandatory tool selection and receipt check

For this workflow, use `move_entity`, `build_entity`, and `collect_resource`
whenever advertised. These flat tools construct the corresponding intent
server-side. All accept optional `policy`, defaulting to `REPLACE_ACTIVE`;
use that policy explicitly for the actions below. Use `send_intent` only when
the corresponding dedicated tool is unavailable, and record why fallback
was necessary.

Discover all three dedicated tools before gameplay. If they are missing after
an update, restart or reconnect the host's MCP server connection and rediscover
its tools. Calling `disconnect_player` and `connect_player` changes the player
session; it does not refresh the host's advertised tool schemas. Avoid repeated
player reconnects for payload mistakes.

These are structural examples, not literal calls. Substitute the live handle,
owned IDs, and computed safe numeric coordinates; use the discovered tool prefix:

```javascript
// Establish the economy on two distinct workers.
collect_resource({
  handle: HANDLE, entity_id: FOOD_WORKER_ID,
  resource_type_id: "food", policy: "REPLACE_ACTIVE"
})
collect_resource({
  handle: HANDLE, entity_id: MINERAL_WORKER_ID,
  resource_type_id: "minerals", policy: "REPLACE_ACTIVE"
})
// Redirect the builder now, replacing its continuous collection order.
move_entity({
  handle: HANDLE, entity_id: BUILDER_ID,
  x: SAFE_X, y: SAFE_Y, policy: "REPLACE_ACTIVE"
})
// After arrival and verification of construction resource access.
build_entity({
  handle: HANDLE, entity_id: BUILDER_ID,
  blueprint_id: "collector_solar", policy: "REPLACE_ACTIVE"
})
// After identifying the completed, safely positioned collector.
collect_resource({
  handle: HANDLE, entity_id: NEW_COLLECTOR_ID,
  resource_type_id: "energy", policy: "REPLACE_ACTIVE"
})
```

Before each submission, compare the actual tool and arguments with the current
role map and desired next state. Immediately record the sanitized tool name,
actual arguments, `client_cmd_id`, `client_seq`, `accepted_http`, `status`, and
`submitted_intent`. Verify the receipt's intent type, entity ID, policy, and
action-specific fields before the next dependent action. For movement, require
`submitted_intent.type === "Move"` and matching `target.x` and `target.y`.
For construction, require `Build` and `blueprint_id: "collector_solar"`.
For collection, require `Collect` and the intended explicit resource type.
Record unavailable receipt fields as unavailable rather than inventing them.
A matching receipt confirms gateway submission; HTTP acceptance does not prove
engine acceptance or completion. Verify lifecycle and observed state separately.

If a receipt or observed state contradicts the intended command:

1. Inspect the actual tool name and arguments. A `collect_resource` call or
   Collect payload is a Collect attempt, even if prose describes movement.
   Correct the tool selection and inputs; do not blame transport or reconnect
   the player to fix an input mistake.
2. If the actual call is `move_entity` with correct inputs but its receipt
   contains Collect, preserve the exact call and receipt as mismatch evidence.
   If the receipt correctly contains Move but state appears unchanged, inspect
   `get_command` and a fresh observation/change stream. Distinguish rejected,
   queued, active, completed, and stale observations; an old collector-state
   field alone does not prove conversion.
3. Recheck the live schema, handle, owner, run ID, policy, and entity ID. If
   needed, inspect `packages/player-mcp/src/server.ts` and `playerGateway.ts`
   read-only to understand serialization and lifecycle behavior. Diagnose
   journal gaps using returned gap/resync/error evidence; do not label a
   journal corrupt solely because a reconnect changed the available history.
4. If a genuine mismatch persists, save a minimal reproduction: exact call,
   command ID, receipt/lifecycle, before/after ticks, and relevant state.
   Use an available authorized alternative (for example, another owned
   worker after reconciling its orders). Do not reset the world, change
   identities, patch the server, or bypass player MCP to conceal the issue.
   Only an evidenced failure that prevents all feasible authorized routes
   is an external blocker.

### Generic intent fallback

Only when the corresponding dedicated tool is unavailable, use `send_intent`
with `{handle, intent}`. Verify the nested type, owned entity ID, policy, and
action fields before calling it. The fallback intent shapes are:

```javascript
{ type: "Move", entity_id: BUILDER_ID,
  target: { x: SAFE_X, y: SAFE_Y }, policy: "REPLACE_ACTIVE" }
{ type: "Build", entity_id: BUILDER_ID,
  blueprint_id: "collector_solar", policy: "REPLACE_ACTIVE" }
{ type: "Collect", entity_id: COLLECTOR_ID,
  resource_type_id: RESOURCE_TYPE, policy: "REPLACE_ACTIVE" }
```

For Move, require computed numeric target coordinates and remove Collect-only
fields such as `resource_type_id` and `nearest_compatible`. Apply the same
receipt and lifecycle checks as for dedicated tools.

## Execution order: advance the builder while the economy runs

Maintain one current role map: food worker, mineral worker, builder, habitat,
chosen star, and later the new collector. Update it only deliberately.

1. Establish ready connection and baseline; reserve the builder ID.
2. Use `collect_resource` to send one explicit food order to the food worker
   and one explicit mineral order to the mineral worker. Confirm their assignments.
3. Compute the builder's safe route/site and resource access. Call `move_entity`
   immediately, replacing any existing collection loop. Do not assign it a
   third collection order or wait for the other workers' deliveries.
4. Confirm arrival, build once, monitor progress, identify the product,
   check safety, and activate energy collection.
5. During bounded build/travel waits, verify food and mineral deliveries.
   Once a criterion is proven, keep it checked unless later evidence
   invalidates it. Continue toward the remaining criteria.
6. Verify solar production, finalize the evidence report, and clean up.

Before each observation-only wait, identify the in-flight command or physical
process expected to advance. If no solar-related command has been submitted,
waiting for solar progress cannot help: issue its next prerequisite action.

## 1. Create the report and establish MCP access

Create `docs/agent-tests/early-build.v5.run-<UTC timestamp>.md` before connecting.
Use the template below, preserving unknown fields as `unknown` until observed.
Never copy old run values into the new report. Do not commit unless requested.

1. Discover the available `bitwars_player` and `bitwars_game_query` tools.
   Use player MCP for login and intents; use game-query MCP for authoritative
   inspection. Do not substitute shell HTTP for player actions.
2. If tools are missing, inspect `.codex/config.toml` and
   `packages/player-mcp/src/server.ts` without printing credentials. Check
   project trust, server startup errors, local web-app availability, and the
   configured target. Record the failing layer and exact sanitized error.
   A configuration edit may require restarting the MCP connection/session;
   editing configuration alone does not establish a connection. Do not make
   unrelated configuration changes or start duplicate services.
3. For authoritative inspection, fall back to the documented game-query HTTP
   endpoints if its MCP is unavailable. Direct Redis is a last resort when
   supported inspection fails; document the reason and keep inspection read-only.
4. Connect with `connect_player` using `username: "agent-nemo"` unless the
   user explicitly specified another identity. Retain the returned
   opaque handle. Call `get_observation` until snapshot and handshake are
   ready; a returned handle alone does not prove readiness.
5. Record the target, username, owner identity, handle, `run_id`, initial tick,
   UTC time, and `change_cursor`. Handles are session-local; do not assume
   that one saved in a report can be reused after a restart.

If a required capability remains unavailable after diagnostics and feasible
recovery attempts, finish a blocked report with the diagnostic evidence and
exact next recovery step. Do not claim connection
success based on configured tool names alone.

## 2. Establish a baseline and plan

From a ready observation, identify owned entities by owner, not ID range or
visibility. Record worker and habitat IDs, positions, health, resources,
collector states, active intents, and existing solar collectors. Use
`get_visible_entities` for visible stars and resource nodes; authoritative
inspection can help diagnose missing or inconsistent player state.

Confirm at least three available owned workers, a resource-supplying habitat,
visible/discovered compatible sources, and the current build options/costs.
If the loadout differs, record it and state a feasible allocation before
acting. Do not replace an existing build or unrelated order accidentally.

For the usual three-worker start:

| Role | Intent | Evidence required |
| --- | --- | --- |
| Food worker | `Collect`, `resource_type_id: "food"` | Correct collector resource/activity, then a delivery |
| Mineral worker | `Collect`, `resource_type_id: "minerals"` | Correct collector resource/activity, then a delivery |
| Builder | Safe move, then `Build`, `blueprint_id: "collector_solar"` | Command progress, then a new owned collector |

`Collect` requires exactly one of `resource_type_id` or
`nearest_compatible: true`. Check the observed assigned resource after sending.
Collection loops do not end automatically after a delivery; do not wait for
them to become idle before deliberately reassigning an available worker.

Reserve the third worker as builder immediately. If it already has a
collection order, or you accidentally give it one, correct that now: use
`move_entity` with `policy: "REPLACE_ACTIVE"` on that owned worker, verify
the replacement and arrival, then call `build_entity` with the intended
blueprint and policy. Check live schemas and command results. Do not wait for a continuous
collection loop to complete, and do not queue the move behind that loop.
Changing this test player's worker roles is authorized. Keep the other two
workers collecting their respective resources while advancing the build;
you need not wait for both deliveries before moving the builder.

## 3. Execute through evidence checkpoints

Before the first intent, record the actual UTC start time using an available
clock tool or system clock. Record a deadline only if the user or execution
environment supplies one; otherwise write `none — continue until verified
success`. The first 100 ticks are an orientation target, not a completion
promise. Build duration is measured in simulation time; record ticks and UTC
time separately and inspect pause state if ticks stop advancing. Obtain
timestamps from a clock when logging milestones and finish; never invent
elapsed time, derive wall time from game ticks, or copy a planned deadline
as the actual finish time.

For each dependent action:

1. Record its precondition, entity ID, exact intent payload, and pre-action tick.
2. Submit once using the corresponding dedicated tool (or the documented
   fallback only if unavailable). Apply the mandatory receipt check above
   and retain its command ID and sequence. Use `get_command` to distinguish
   gateway submission and HTTP receipt from engine lifecycle. Never invent
   a missing sequence or lifecycle outcome.
3. Observe with `get_observation`, `get_changes`, and/or
   `wait_for_observation`. Wait calls must be at most 60 seconds; use shorter
   waits when needed to provide progress updates. `met: false` means the wait
   expired, not that the command failed.
4. Verify the intended state change before continuing. Record observed tick,
   evidence, and outcome. If the result is ambiguous, reconcile state before
   retrying; a timed-out response may still have applied the command.

Retain `run_id` with the change cursor. Drain `get_changes` pages while
`has_more` is true. On `gap: true`, reconcile against the returned current
observation, command records, and entity state before further writes. Record
any history that cannot be recovered. On a run change, stop writes and report
that the original run can no longer be continued with its old IDs/cursors.

### Safe solar construction and activation

1. Verify current radiation, hull, collection, spacing, and construction
   resource-sharing rules. Current documentation gives `star_yellow` a
   1200-unit maximum radiation distance; recheck if content has changed.
   For a point `(x,y)` and star `(sx,sy)`, center distance is
   `sqrt((x-sx)^2 + (y-sy)^2)`. Check the route as well as the destination,
   including other stars. Add clearance for hulls and spawn offset.
2. Move the builder to a safe construction area with resource access. A
   distant habitat can leave a build resource-stalled. Moving this owned
   habitat for resource access is authorized: compute and verify a safe
   habitat route/position if needed, and check effects on food/mineral
   deliveries. Choose a different safe site if that better preserves supply.
3. Call `build_entity` once for `collector_solar` and enable
   `set_progress_watch` for the builder.
   Inspect progress and command state between bounded waits. `Build` has no
   placement coordinate: the engine spawns the product near the builder,
   with offset determined by hull sizes and entity ID. Do not assume the
   builder's exact coordinates are the product's coordinates.
4. Compare against the pre-build owned entity set and identify the new
   `collector_solar` by owner, type, creation evidence, and position. An
   entity count increase alone may be unrelated. Confirm its health and
   safe position; do not infer completion from an energy decrease.
5. Call `collect_resource` with `resource_type_id: "energy"` on the new collector.
   Verify energy collector activity (such as `proximity_collecting`) and
   observed production/delivery evidence. Construction alone does not
   activate collection. Inspect current source range and minimum-spacing
   requirements if collection does not start.

Current preloaded content lists a solar build cost of 50 energy and 100
minerals and a worker build duration of about 83.33 simulation seconds.
These are reference values, not promises about the active run. Habitat and
worker upkeep, other intents, deliveries, and storage caps affect resource
deltas. Use current definitions, command evidence, and ledger `spend_total`
when available rather than calling a ~52-energy net decrease the build cost.

## 4. Diagnose stalls, recover, and continue

- After two consecutive observation intervals with no measurable progress,
  inspect tick advancement, readiness, command lifecycle, build progress,
  resource supply/sharing range, ownership, health, and source discovery.
  Progress timestamps alone do not explain a stall; the engine may leave a
  resource-stalled build `IN_PROGRESS` without a `BLOCKED` reason. Two such
  intervals trigger diagnosis and corrective action, not termination.
- Change one relevant condition at a time. Log the hypothesis, evidence,
  corrective action, and result. Retry only after a confirmed failure or
  reconciled outcome; do not replace an active build just because an
  observation timed out. If a correction fails twice, change the approach
  based on new evidence rather than repeating it blindly or ending the run.
  Consider worker reassignment, safe alternative sites/routes, habitat supply
  positioning, and explicit resource selection as applicable.
- If no compatible source is discovered, investigate visibility/discovery;
  do not assume authoritative visibility means the player can collect it.
- After every checkpoint, choose an unmet criterion and perform the next
  action that advances it. If a command is legitimately progressing, continue
  bounded observation while maintaining the economy. If a prerequisite is
  missing, work to establish it. Ordinary travel, collection, construction,
  recoverable command errors, and occupied workers are not external blockers.
- Keep status `running` while recovery is possible. Update the report during
  play, then resume tool use in the same task. Stop early only under the
  conditions in the opening instructions. Report `partial` for a forced
  interruption or `blocked` for a demonstrated external blocker, with unmet
  criteria and evidence. Do not claim success from unrelated resource growth.
- After verified success or a justified early stop, disable progress watches
  and disconnect the player. Do not disconnect merely to finish a checkpoint. Record
  cleanup failures. Disconnecting does not imply that game orders stop;
  describe any orders left running. Preserve evidence even after failure.

## 5. Completion criteria and report template

Mark `success` only when all core criteria have evidence: ready MCP connection,
verified ownership, food delivery, mineral delivery, new solar entity, safe
solar position, and activated energy collection with production evidence.
Until then, keep playing and recording status `running`, except for the
explicit early-stop conditions above. Separate cleanup outcome from gameplay
outcome. Once all criteria pass, finalize the report and finish the task.

Before finalizing, check the report against observed evidence. A completed
mineral delivery satisfies that criterion even if its worker has started the
next cycle. Resource deltas alone may be ambiguous; obtain collector/dropoff
events or equivalent corroborating state. Use one outcome section and one
selected status value; remove template alternatives and duplicate sections.
Record exact payloads and observed ticks rather than `Various` placeholders.
Use `unknown` for unavailable timestamps; never write invented `16:xx:xx`
values. Separate baseline from latest/final state. Update the existing
criteria and outcome sections instead of appending contradictory copies.
Keep logging concise enough that gameplay remains the main activity.

For delivery evidence, capture an assigned worker carrying the relevant
resource toward its depot, followed by dropoff/emptied cargo and a matching
depot balance or ledger change, or use a directly recorded delivery event.
A later collection cycle does not undo that delivery. If evidence is missing,
observe the next delivery while continuing builder work; do not restart the
whole run or wait for collection to stop.

Before ending the task, evaluate every checkbox against evidence. If any
is unmet and an authorized action remains, perform that action now. A
checkpoint or list of next steps is not a completed task. For an early stop,
record the specific unavailable dependency or enforced limit and why no
available recovery can advance the remaining goals.

Copy this template to the new run report and fill every section:

```markdown
# Early build v5 run — <UTC timestamp>

## Outcome and scope
Status: not started | running | success | partial | blocked
Requested goal and authorized world/identity:
Guide used: docs/agent-tests/early-build.v5.md
Repository revision (if available):
Clock source / actual UTC start / actual UTC finish:
Explicit user/environment deadline (or none):
Target and available MCP tools:
Username / owner / session handle:
Run ID / initial tick / final tick:
Latest change cursor and associated run ID:

## Baseline and final state
Owned entity IDs/types, positions, health, and existing orders:
Assigned worker roles and source IDs/resource types:
Resource balances by entity at baseline/final ticks:
Build options/costs, supply range, chosen star, route, and safety calculation:
New collector ID, position, health, activity, production evidence:

## Action and evidence log
| UTC / tick | Entity | Exact tool + payload | Command ID / receipt / lifecycle | Observed result and evidence |
| --- | --- | --- | --- | --- |

## Criteria
- [ ] Connection ready and ownership verified
- [ ] Food delivered
- [ ] Minerals delivered
- [ ] Solar build completed; new entity identified
- [ ] Actual collector position verified safe
- [ ] Energy collection activated and production observed
For each checked item, cite a log row or saved observation.

## Failures and recovery
Sanitized errors, observation gaps, stalled ticks/progress, hypotheses,
attempt counts, corrective actions, and results:

## Process improvements
For each improvement: prior instruction/problem -> observed evidence ->
replacement instruction -> verification result (or explicitly untested).
Separate confirmed mechanics, run-specific observations, and hypotheses.

## Handoff
Cleanup result and orders still running:
Completed work and unfinished criteria:
Next exact tool/action, its prerequisites, and expected confirming evidence:
Evidence for success or justified early stop:
Recovery approaches tried and next approach if interrupted:
On resume: reconnect if needed, verify current run and ownership, refresh
observation, and reconcile saved commands before sending another intent.
```

Keep the report self-contained: include relevant sanitized results or link
durable repository artifacts, not conversation-only references. Do not store
passwords, tokens, or authentication headers. Preserve earlier prompt versions and run reports as historical
records. Propose future guide changes with evidence; do not promote an
unverified hypothesis into a rule for the next agent.
