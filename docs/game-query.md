# Game-query API

Use these endpoints first when inspecting a running game from curl, an MCP
tool, or an agent. They are the supported boundary over the engine's Redis
state; do not use `docker exec`, `redis-cli`, or raw Redis keys unless you are
debugging this API layer itself.

The endpoints are served by the Next app, normally at `http://localhost:3000`.
They use the root `GAME_ID` environment value.

## Codex MCP access

The project's `.codex/config.toml` registers `bitwars_game_query`, a local stdio
adapter in `packages/player-mcp/src/gameQueryServer.ts`. Restart the Codex MCP
connection or session after configuration changes; check `/mcp` for availability.
The project must be trusted for project MCP configuration to load.

Use `get_snapshot`, `get_owners`, `get_entity`, `get_scenarios`, or
`get_script_debug` instead of running curl in the shell. The adapter makes GET
requests to the existing endpoints and does not expose debug capture writes.
It uses `BITWARS_GAME_QUERY_BASE_URL` (default `http://127.0.0.1:3000`), accepts
only local HTTP targets, and needs the web app running. MCP access avoids shell
network escalation for each request; host or organization MCP policies still
apply. The configured tool approval mode is `approve`.

For resource oscillations, compare successive snapshot ticks, entity resource
balances, and player ledger `spend_total`. Snapshots are the latest published
state, not a per-tick history. This adapter changes no game storage.

## Development access

`GAME_QUERY_REQUIRE_AUTH=false` makes the endpoints available without auth for
local iteration. It is the current default in `.env` and `.env.example`.

When `GAME_QUERY_REQUIRE_AUTH=true` (or `1`), every game-query endpoint throws
an error because M2M authentication has not been implemented. Do not enable it
until that authentication path exists.

## Read endpoints

```bash
# Complete latest authoritative snapshot
curl http://localhost:3000/api/v2/game-query/snapshot

# Owner IDs represented in the current snapshot
curl http://localhost:3000/api/v2/game-query/owners

# One entity by its numeric ID
curl http://localhost:3000/api/v2/game-query/entities/532

# Lua debug setting and the most recent captured state
curl 'http://localhost:3000/api/v2/game-query/script-debug?owner=raiders'
```

Snapshots and entities are JSON-safe API representations: protobuf integer IDs
and ticks are returned as numbers when safe and strings otherwise. Snapshots
include `sentry_orders` with route cursor/direction, formation anchor and slots,
and phase, alongside `move_orders` and `convoys`. The authoritative snapshot query also
includes `generation_state_json`, a versioned server checkpoint containing
historical player-start reservations and pending join diagnostics. It remains a
JSON string so 64-bit IDs/revision hashes retain their exact representation.
Pending entries retain their selected loadout and last failure reason. An empty
checkpoint denotes an older world; procedural joins require a reservation
backfill or a fresh world. Normal player snapshot mapping does not expose this
operator checkpoint.

## Write endpoint

The only current game-query write is Lua debug capture control:

```bash
curl -X POST 'http://localhost:3000/api/v2/game-query/script-debug?owner=raiders' \
  -H 'Content-Type: application/json' \
  -d '{"enabled":true}'
```

Set `enabled` to `false` to stop capture. The most recent snapshot remains
available briefly after stopping, so it can be inspected.

Do not add a generic Redis query or write endpoint. Add an explicit operation
to `apps/web/src/lib/game-query/` and expose only that operation through a
purpose-specific route.

## Scenario status

```bash
curl http://localhost:3000/api/v2/game-query/scenarios
```

Returns the active run ID, scenario ID, pause state, tick and remaining step
count, plus saved scenario metadata. This is read-only. Authenticated scenario
controls and YAML management are documented in
[scenarios.md](requirements/scenarios.md).

Escort orders (protocol 17) appear in snapshot `escort_orders`, with root IDs,
owner, `target_entity_id`, and member slots containing offsets, stable slot
indices, and status (`forming`, `in_formation`, `catching_up`, `engaging`, or
`returning`). Escort follows entity positions rather than a fixed route. Player
streams filter orders to their owner; this administrative snapshot exposes all.

Collection discovery is now recorded authoritatively per player in the server-only
`discovered_entities_json` snapshot checkpoint, exposed by the authoritative snapshot endpoint. Both transport and proximity
collection select only discovered sources, including sources no longer visible.
Discovery uses operational sensors, technology effects and target visibility ranges,
and continues while players are disconnected. Player streams omit this checkpoint.
Older snapshots without discovery history start empty and discover currently visible
entities on the next completed simulation tick; earlier exploration cannot be reconstructed.

Last-known observations are checkpointed separately as `player_knowledge`, which this
authoritative snapshot endpoint exposes for every player. Each entry has `player_id`
and `observations` containing `entity_id`, `entity_type_id`, `owner_player_id`, `pos`,
and `last_seen_tick`. Hidden observations retain their last-observed values rather
than exposing current entity state. Normal player snapshots expose only the
authenticated/acting player's `remembered_entities`; deltas carry
`remembered_entity_updates` and `forgotten_entity_ids`. World sprites still respect
the type's `fog_memory` policy, while minimap sightings remain independent.
Legacy checkpoints without `player_knowledge` cannot recover earlier last-known
positions from discovery IDs; observations start accumulating on the next tick.

## Content reload diagnostics

```bash
# Active revision, last 100 reloads, current client reports and retained client transitions
curl http://localhost:3000/api/v2/game-query/content-reloads

# Original immutable manifest for an accepted SHA256 revision
curl http://localhost:3000/api/v2/game-query/content-revisions/<revision>

# Exact accepted definitions and per-entity definition/asset hashes
curl 'http://localhost:3000/api/v2/content?revision=<revision>'
```

These reads do not stage or activate content. Snapshot responses now include
`content_revision`, which identifies definitions/artwork, not the changing entity
positions, health, stock or orders.

Each reload operation records a dashed-UUID `reload_id`, candidate/base revisions,
requester and time, status transitions, activation tick, and structured error when
applicable. Rejection preserves the active world. Restart recovery and notification
failures are exposed separately from successful activation.

`clients` contains reports received within two minutes, including advertised and
loaded definition revisions, rendered asset-bundle hashes and detailed load errors.
`client_events` retains the latest 100 client state changes, so a decode failure
remains traceable by reload ID after the client recovers. These are client-reported
diagnostics, not an authoritative claim about a remote renderer.

The same information appears under **Live content** on the `/content/` pages.
Authenticated `POST /api/content/reload` stages current authored files and returns
`content_reload` with the operation ID. An optional `base_revision` provides an
optimistic lock. Editor definition/sprite/mask saves stage automatically.
Authenticated clients post synchronization reports to `/api/v2/content/report`;
this does not change game content.

