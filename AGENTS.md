# Agent guidance

For inspecting or controlling the running game's published state, read
[`docs/game-query.md`](docs/game-query.md) first. Favor its HTTP endpoints rather
than reading or writing Redis directly. Prefer direct Redis access as a failover.
Use the `bitwars_game_query` MCP tools when available to access those endpoints
without shell network requests. The `bitwars_player` MCP is the player interface;
game-query provides authoritative inspection without logging in as a player.
