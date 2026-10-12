# Bitwars player MCP discovery test

## Purpose

Use the local Bitwars player MCP to run player workflows against the active game
world. These experiments intentionally mutate the world. They are meant to:

- make player workflows repeatable so they can be exercised and compared;
- discover and document new workflows and capability gaps; and
- provide workflows and blueprints that can later pressure test the game
  server at scale.

For this discovery run, use the following sequence:

1. Order one worker to collect minerals and another to collect food.
2. Move a third worker to a safe position near the nearest sun and build a
   solar collector.
3. Move the habitat near that sun, outside radiation damage.
4. Build two more workers; order one to collect minerals and the other to
   collect food.

Record what the MCP state reveals, which commands are accepted, how resulting
entities/orders can be identified, and any capability gaps needed for a
higher-level scenario controller.

## Connect

The project-scoped Codex MCP configuration is in `.codex/config.toml`. It
starts the local stdio server in `packages/player-mcp`, targets
`http://127.0.0.1:3000`, opts into writes, and asks for tool approval. In a
local Codex session, confirm `bitwars_player` is connected (`/mcp`) and use its
tools for player actions; do not substitute direct game HTTP calls. The
configured tool set includes `connect_player`, `get_observation`,
`get_changes`, `get_command`, `wait_for_observation`, `set_progress_watch`,
`send_intent`, `disconnect_player`, and the legacy `get_player_state` and
`observe_events` views.

The gateway accepts `loadtest-*` usernames and logs in the player on connect.
The requested mission authorizes the player actions listed here and the
resulting changes to the active world. The active world may be changed
repeatedly for workflow experiments; do not load or reload a scenario, replace
the world, use another player identity, or target a remote game unless that is
part of the explicitly requested experiment.

## Procedure

1. Read [`game-query.md`](game-query.md) and
   [`requirements/scenarios.md`](requirements/scenarios.md). Connect with a
   unique `loadtest-*` username; wait until `get_player_state` reports the
   snapshot and handshake ready. Record the run ID and inspect owned entities,
   positions, resource nodes, and the nearest sun before acting.
2. Confirm the state has the expected habitat and at least three owned workers;
   confirm the worker/habitat build options and resources are sufficient. If
   identity, ownership, or resource selection is ambiguous, stop and report it.
3. Send `Collect` for `minerals` and `food` to two distinct workers. For the
   third worker, compute a point outside the sun's radiation radius and move
   there. For `star_yellow`, the content's maximum effective radiation
   distance is 1200 world units; use a generous margin beyond it (and account
   for any shielding/geometry) rather than targeting the boundary. Observe
   state/events to verify each command before continuing.
4. Before the solar build, account for the current build semantics. The MCP
   `Build` input exposes `blueprint_id` but no placement coordinate. Although
   the intent route fills the protobuf `location` field with `(0, 0)`, the
   engine currently spawns completed products near the builder's position.
   Spawn distance is the sum of the builder and product hull radii, and the
   angle is derived from the new entity ID. The client does not select the
   product's final position. Do not treat `(0, 0)` as the build location. Move
   the worker to a suitable build area, then use the actual resulting entity
   position from state/events to verify that the collector is outside the
   sun's radiation radius before continuing. Do not bypass MCP with direct
   HTTP.
5. If safe placement is possible, build `collector_solar`. Identify the new
   collector, issue its `Collect` intent for `energy`, and verify its activity.
   Move the habitat to a safe point near the same sun, and build two `worker` entities from the
   habitat. Discover each new worker from subsequent state/events rather than
   guessing IDs, then issue the mineral and food collection intents. Confirm
   orders and resulting state, and disconnect the MCP player when finished.

Use `get_observation` and `wait_for_observation` between dependent actions; do not
blindly batch the sequence. Keep a short record of entity IDs, chosen
targets/distances, intent outcomes, and any missing state or tool capability.
The world is shared and these intents mutate it by design. Record the active
run and observed state before acting, and stop if the connected game is remote,
the player identity or ownership is ambiguous, or the state indicates that
these specific actions would interfere with unrelated play. Do not treat the
fact that this is a shared world, by itself, as a reason to avoid the requested
workflow experiment.

## Observation contract for bots and agents

`get_observation` returns the current owned entities, collector states, active
intents, build progress, `run_id`, `tick`, and `change_cursor`. `get_changes`
returns ordered semantic changes after a cursor: entity creation/removal,
collector state transitions, command submission/lifecycle, and stream resyncs.
The journal is stored on disk under `packages/player-mcp/.player-journal` by
default (override with `BITWARS_PLAYER_MCP_JOURNAL_DIR`) and survives an MCP
server restart. Keep the `run_id` with the cursor; pass both on each subsequent
`get_changes` call. Start from the `change_cursor` in the first ready
`get_observation`, then drain pages while `has_more` is true. Each MCP session
records a resync boundary, so a cursor saved before a restart reports a gap.

After `send_intent`, retain its `client_cmd_id`. `get_command` reports its HTTP
receipt and latest lifecycle state; `wait_for_observation` can wait for that
command to become terminal, for a new owned entity count, collector activity,
or a resource threshold. Each wait is limited to 60 seconds; `met: false` means
the condition was not reached during that wait, not that the command failed.
For long builds, set a progress watch on the builder, repeat the wait as needed,
and check `get_command` plus `get_observation.progress` between waits. Progress
is a percentage and timestamp only; it does not explain a stall. The engine
currently leaves a resource-stalled build `IN_PROGRESS` without publishing a
`BLOCKED` lifecycle reason. Lifecycle states 5, 6, and 7 are terminal. For a solar
collector, wait for the new `collector_solar` entity, inspect its position, then
send `Collect` for `energy` from that entity and wait for its command lifecycle
or collector activity. A completed build alone does not start collection.

If `get_changes` reports `gap: true`, use its current `observation` to
reconcile command IDs and entity state before acting again. A stream reconnect
marks a possible gap, since upstream events could have been missed; the
current snapshot restores state but cannot reconstruct every intervening
transition. The legacy `observe_events` tool remains a bounded raw SSE debug
view and can drop events under load.

The deterministic bot consumes `get_changes` and stops on a gap. Pass
`--step-ticks N` to schedule decisions in game ticks; `--step-ms` remains
available for wall-clock runs. Record the returned observation and change
stream when exact replay matters, since network timing still determines which
tick a live bot first sees.
