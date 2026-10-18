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
and phase, alongside `move_orders` and `convoys`.

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
