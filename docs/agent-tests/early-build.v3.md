# Early Build Test — v3: execution and handoff guide

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

## What changed from v2

- Treat IDs, coordinates, resource totals, and ticks from previous runs as
  historical evidence, never current inputs.
- Allocate the workers actually owned. The core workflow needs three, not
  the five assumed by v2's opening checklist.
- Select `food` and `minerals` explicitly. `nearest_compatible` selects a
  compatible source; it does not guarantee the resource the agent intended.
- Separate submission, acceptance, progress, completion, and productive use.
  A resource decrease or an idle worker alone proves none of these.
- Remove the contradictory instruction to stay outside 1200 units of a star
  while remaining within 400 units of its center. Sensor range is not a
  universal energy collection distance.
- Replace passive waiting and repeated build submissions with progress
  checks, corrective actions, and continued work toward unmet criteria.
- Keep this guide intact; write each execution's evidence and improvements
  to a new report.

## 1. Create the report and establish MCP access

Create `docs/agent-tests/early-build.v3.run-<UTC timestamp>.md` before connecting.
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

If a required capability remains unavailable, finish a blocked report with
the diagnostic evidence and exact next recovery step. Do not claim connection
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
collection order, or you accidentally give it one, correct that now: use a
`Move` intent with `policy: "REPLACE_ACTIVE"` on that owned worker, verify
the replacement and arrival, then send its `Build` intent with the intended
policy. Check live schemas and command results. Do not wait for a continuous
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
2. Submit once with `send_intent`; retain `client_cmd_id` and any returned
   sequence/receipt. Use `get_command` to distinguish transport receipt from
   engine lifecycle. Never invent a missing sequence or lifecycle outcome.
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
   distant habitat can leave a build resource-stalled. Do not move a habitat
   unless that action is within the requested scope; otherwise choose a
   feasible site or report the missing precondition.
3. Send one solar build and enable `set_progress_watch` for the builder.
   Inspect progress and command state between bounded waits. `Build` has no
   placement coordinate: the engine spawns the product near the builder,
   with offset determined by hull sizes and entity ID. Do not assume the
   builder's exact coordinates are the product's coordinates.
4. Compare against the pre-build owned entity set and identify the new
   `collector_solar` by owner, type, creation evidence, and position. An
   entity count increase alone may be unrelated. Confirm its health and
   safe position; do not infer completion from an energy decrease.
5. Send `Collect` with `resource_type_id: "energy"` on the new collector.
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

Copy this template to the new run report and fill every section:

```markdown
# Early build v3 run — <UTC timestamp>

## Outcome and scope
Status: not started | running | success | partial | blocked
Requested goal and authorized world/identity:
Guide used: docs/agent-tests/early-build.v3.md
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
passwords, tokens, or authentication headers. Preserve v1/v2 as historical
records. Propose future guide changes with evidence; do not promote an
unverified hypothesis into a rule for the next agent.
