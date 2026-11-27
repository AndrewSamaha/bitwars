# Agent guidance

For inspecting or controlling the running game's published state, read
[`docs/game-query.md`](docs/game-query.md) first. Favor its HTTP endpoints rather
than reading or writing Redis directly. Prefer direct Redis access as a failover.
Use the `bitwars_game_query` MCP tools when available to access those endpoints
without shell network requests. The `bitwars_player` MCP is the player interface;
game-query provides authoritative inspection without logging in as a player.

For workmux integration or delegated task assignments, read
[`docs/workmux-workflow.v5.md`](docs/workmux-workflow.v5.md) and follow the
[`workmux-integration` skill](.agents/skills/workmux-integration/SKILL.md).
Local `main` is reserved for syncing with GitHub; never merge feature/task work
into it. Task work merges into the integration feature branch, which reaches
`main` through its PR. Stop and follow v5 recovery guidance if local `main`
shows ahead/diverged commits.
Integration agents delegate feature implementation and corrections, then own
review, merging, and validation. Task agents commit their results, write a local
completion report, and notify the integration target supplied in their brief.
Integration agents monitor outstanding tasks and continue through review and
validation when notified; a `done` status alone does not mean acceptance.

## Architecture and tick performance

- **Server authority.** Clients send intents and may predict or render feedback,
  but the server decides gameplay outcomes. Client predictions and presentation
  state must not become authoritative. See
  [ADR 004](docs/adr/004-render-effects-from-authoritative-state.md).
- **Tick hot path.** Explain how added work scales with entities and intents.
  Justify new scans, allocations, serialization, and I/O on the simulation tick
  path. For material changes to tick cost, compare p95/p99 tick duration and
  missed tick budgets against a baseline using the same representative workload.

### Role checklist

- **Architect:** Identify where authority lives, what runs per tick, how it
  scales, and how to verify correctness and performance.
- **Plan selector (supervisor):** Reject plans that break server authority or add
  unbounded tick work. Compare viable plans on tick cost, complexity, and how
  well their proposed checks cover the requirements.
- **UI/UX designer:** Describe the player's goal, inputs, feedback, and recovery
  before coding. Cover applicable pending, accepted, rejected, stale, and
  visibility-limited states. Specify what the client may predict and what must
  wait for server confirmation. Reuse existing interactions where possible,
  and flag new server signals or per-tick work for reconciliation with the
  architect and supervisor.
- **Coder:** Preserve these invariants and flag material deviations from the
  selected plan. Avoid unnecessary per-tick work.
- **Code reviewer:** Trace the actual authority boundary and tick path in the
  diff. Flag missing evidence for material performance changes; a passing build
  does not establish tick performance.
  For player-facing changes, also check the agreed interaction flow and edge
  states, not just the happy path.
