# Agent guidance

For inspecting or controlling the running game's published state, read
[`docs/game-query.md`](docs/game-query.md) first. Favor its HTTP endpoints rather
than reading or writing Redis directly. Prefer direct Redis access as a failover.
