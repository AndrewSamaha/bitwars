# Scenarios

Scenarios replace the one shared game world with explicit initial entities. YAML
files live in `packages/content/scenarios/` and are committed like other content.
There is one active world, not parallel game instances. This is a development
feature; authenticated controls are disabled in production unless
`SCENARIOS_ENABLED=true` is configured for the web server.

Restart the engine once after installing this feature. Subsequent scenario
loads, reloads, captures and simulation controls require no restart.

## Start quickly

Open `/content/scenarios` while signed in, select `wireless-energy`, and click
**Load (replace world)**. Or use the in-game terminal:

```text
scenario list
scenario validate wireless-energy
scenario load wireless-energy
scenario step
scenario step 60
scenario resume
scenario pause
scenario reload
scenario status
scenario bookmark energy-shortage energy maintenance
scenario bookmark habitat-and-worker energy --entities=3,4
```

Load and reload always start paused at tick zero. Reload reads the saved YAML
again, or uses the last loaded document if it has not been saved. `step` schedules exactly the
requested number of ticks (1–3600), then stays paused. Other players' clients
refresh automatically. Controls and captures are processed between ticks,
including while paused. Pending requests expire from the result store after
five minutes; a queued operation can still execute if the engine resumes later.

The wireless-energy sample has a yellow star at (0,0), a solar collector at
(1250,0), a habitat at (3500,0), and a worker at (3700,0). Select the solar
collector and assign energy collection while paused, then resume or step. The
collector is within the star's collection range and outside its radiation ring;
the habitat is outside direct stellar collection range but within its own
4000-unit sharing range of the collector. The habitat starts with low energy,
500 food and 500 minerals so wireless receipt and sharing are easy to observe.
Orders submitted while paused apply on the next simulated tick.

## YAML format (version 1)

```yaml
version: 1
id: example
name: Example
tags: []
players: [player]
technologies:
  player: [space_age]
entities:
  - id: 1
    entity_type: habitat
    owner: player
    position: {x: 0, y: 0}
    health: 400
    resources: {energy: 500, food: 500, minerals: 500}
```

Entity IDs are explicit positive, unique JavaScript-safe integers. Entities load
in ID order. Position and resources must be finite, health must be positive and
at most the type's maximum, and inventory cannot exceed the content definition's
capacity. Unknown types, resources, technologies, slots and schema fields are
rejected. Health defaults to the type's maximum; omitted resources start empty.
Optional `cargo: {resource: minerals, amount: 20}` captures a collector's separate
carry buffer and must fit its carry capacity. Worlds are limited to 5000 entities
and YAML requests to 2 MB. Procedural scenery, normal player spawn loadouts and
automatic raider spawning are disabled; authored raiders still run their AI.

The first player slot binds to the authenticated loading player. More slots
require explicit bindings in the editor, e.g. `{"player2":"UUID"}`. System
owners `universe` and `raiders` need no bindings. Technologies are explicit:
normal spawn-granted technology is not added implicitly.

Validation allocates the replacement state before modifying the current world.
A schema or capacity error leaves the running world intact. Load clears orders,
movement, upkeep and other fractional counters, collector retries, combat
cooldowns and NPC runtime state. A new run ID rejects commands queued for the
previous world and clears client entity/fog memory, selection and intent state.
A reconnect within the same run retains the local command queue.

## Bookmarks

Bookmarks are ordinary editable scenario YAML files with a name, tags and a
`captured_tick` field. The engine captures authoritative inventory, collection
cargo, health, ownership, positions and player technologies at a tick boundary.
Account UUIDs become portable player slots; the requesting player's slot comes
first. Capture all entities, specific entity IDs, or a circular area in the editor.
Entities excluded from a capture are not pulled in automatically, so include
nearby resource sources and donors when the scenario needs them. Multiple
captured players need bindings on load.

Captured active orders, velocities, upkeep fractions, cooldowns and random
runtime state are cleared on load. Bookmarks reconstruct a useful initial state;
they are not exact replay checkpoints. Duplicate bookmark IDs are rejected;
**Save** intentionally replaces an existing authored scenario.

## HTTP operations

`GET /api/content/scenarios` lists YAML and runtime status; `GET` with `id`
returns one document; with `request_id` retrieves a queued operation's result.
These routes require a player session.

`POST /api/content/scenarios` accepts `action`:

- `validate`, `save`, `load`: `yaml` or saved `id`, optional `bindings`.
- `reload`, `pause`, `resume`: no additional fields.
- `step`: optional `ticks` (default 1).
- `bookmark`: unique `id`, optional `tags`, `entity_ids`, or `center: {x,y}`
  and `radius`.

Clients send their current `run_id` to reject stale controls. The API supplies it
for callers that omit it. The first slot always binds to the authenticated
player. The API waits up to five seconds for an engine acknowledgement, then
returns HTTP 202 with `request_id` when still pending. Saving requires successful
engine validation and does not write a file if validation times out. Bookmark
files are written when their result is retrieved; failed disk writes are reported.

For read-only tooling use `GET /api/v2/game-query/scenarios`, which reports
runtime status and scenario metadata using the existing game-query development
access policy. No Redis access is needed. To return to normal procedural gameplay, restart
with `RESTORE_GAMESTATE_ON_RESTART=false` (the usual fresh-game setting).

## Runnable check

Run `scenario validate wireless-energy` with the engine running. It executes the
same parser, capacity checks and state construction as load without replacing
the world. In the editor, set the habitat's energy above its 5000 capacity and
use **Validate**: the error should name entity 3 and energy; the world's run ID
and tick state remain unchanged.
