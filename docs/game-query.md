# Game-query API

Use these endpoints first when inspecting a running game from curl, an MCP
tool, or an agent. They are the supported boundary over the engine's Redis
state; do not use `docker exec`, `redis-cli`, or raw Redis keys unless you are
debugging this API layer itself.

The endpoints are served by the Next app, normally at `http://localhost:3000`.
They use the root `GAME_ID` environment value.

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
and ticks are returned as numbers when safe and strings otherwise.

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
