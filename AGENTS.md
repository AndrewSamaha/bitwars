# Agent guidance

For inspecting or controlling the running game's published state, read
[`docs/game-query.md`](docs/game-query.md) first. Favor its HTTP endpoints rather
than reading or writing Redis directly. Prefer direct Redis access as a failover.
Use the `bitwars_game_query` MCP tools when available to access those endpoints
without shell network requests. The `bitwars_player` MCP is the player interface;
game-query provides authoritative inspection without logging in as a player.

For workmux integration or delegated task assignments, read
[`docs/workmux-workflow.v4.md`](docs/workmux-workflow.v4.md) and follow the
[`workmux-integration` skill](.agents/skills/workmux-integration/SKILL.md).
Integration agents delegate feature implementation and corrections, then own
review, merging, and validation. Task agents commit their results, write a local
completion report, and notify the integration target supplied in their brief.
Integration agents monitor outstanding tasks and continue through review and
validation when notified; a `done` status alone does not mean acceptance.
