# Scripted bot runner

The runner starts multiple copies of the [scripted discovery bot](mcp-test.md#scripted-discovery-bot). Each bot is a separate process with its own player MCP server and player identity. The runner does not share a gateway or an MCP connection between bots.

From the repository root:

```bash
pnpm --filter @bitwars/player-mcp bot-runner -- \
  --count 10 --run-tag trial-001 --ramp-ms 500 \
  --timeout-seconds 1200 --allow-game-writes
```

Use a new `--run-tag` for every invocation. The example creates `loadtest-trial-001-01` through `loadtest-trial-001-10`. These bots join and change the active game, including building and collecting. Run against a disposable match when possible.

## Options

| Option | Meaning | Default |
| --- | --- | --- |
| `--count N` | Number of bots, from 1 to 1000 | 1 |
| `--run-tag TAG` | Required unique run label; 1–35 letters, digits, `_`, or `-` | — |
| `--ramp-ms MS` | Delay between bot launches; `0` launches a burst | 500 |
| `--timeout-seconds S` | Scenario deadline for each bot, measured from that bot's start | 1200 |
| `--cleanup-grace-seconds S` | Extra time before the runner stops a bot that has not exited | 30 |
| `--base-url URL` | Game HTTP endpoint | `http://127.0.0.1:3000` |
| `--allow-remote` | Permit a nonlocal game URL | off |
| `--output-dir PATH` | Directory for this run's logs and summary | `.metrics/player-mcp/runs/TAG` |
| `--allow-game-writes` | Required acknowledgment of game writes | off |

The output directory must not already exist. This prevents a reused tag from overwriting a prior run. Give each bot enough time to finish the build steps; the deadline starts when that bot launches, rather than when the first bot launches. The runner allows the extra cleanup interval for disconnect and process exit, then sends `SIGTERM` and, after five more seconds, `SIGKILL`. On macOS and Linux it signals each bot's process group so its MCP server is stopped too.

## Results

The runner writes one stdout JSON record when each bot starts and finishes, then a final `runner_result` record. It also writes:

```text
.metrics/player-mcp/runs/trial-001/
  loadtest-trial-001-01.stdout.jsonl
  loadtest-trial-001-01.stderr.log
  ...
  summary.json
```

`summary.json` contains counts, timing, exit codes, signals, timeout flags, each bot's `scenario_result` when present, and log paths. A bot succeeds only when it exits with code 0 and emits a matching `scenario_result` with `success: true`. The runner exits with code 0 only if **all** requested bots succeed. Any failed, timed out, interrupted, or unstarted bot makes it exit with code 1. A configuration or output directory error also exits with code 1 and emits `runner_error` on stderr.

Failed bots include a `failure` object in their `bot_finished` record and per-bot `summary.json` result. Its `reason` is a stable category. If a command's entity was destroyed or an entity disappeared during a step, the bot checks player-visible gameplay history and includes `entity_id`, `cause`, and the attacker entity and owner when known. An opposing player attack uses `reason: "entity_destroyed_by_other_player"`; an interrupted command without a matching destruction event uses `reason: "command_interrupted"`. The original error, command lifecycle fields, and event ID remain available for diagnosis. A history lookup problem appears as `diagnostic_error` and does not replace the original failure. Runner timeouts and missing bot results have their own failure reasons. The final `runner_result` and `summary.json` include `failure_reasons` counts.

For example, a destroyed builder produces `failure: { "reason": "entity_destroyed_by_other_player", "entity_id": 896, "cause": "dismantle", "attacker_player_id": "...", "attacker": { "entity_id": 817, "owner_player_id": "..." } }` in its `bot_finished` record. `attacker_player_id` also appears directly on the `bot_finished` record and the per-bot summary result for filtering. The bot still exits with code 1 and has status `failed`.

`Ctrl-C` stops new launches, signals active bot process groups, waits for their exit, and records unstarted bots in the summary. Bot stdout and stderr remain separate so concurrent runs do not interleave their step records. Logs and summaries live under ignored `.metrics/` by default; copy them elsewhere if they must be retained.

The engine's Axiom `engine_tick_timing` and `engine_tick_phase_timing` records include `connected_player_count`, sampled at the end of each tick timing window. It counts distinct authenticated players with a live game SSE connection, so two tabs or streams for one player count once. Connections refresh a 30-second lease every 10 seconds; a crashed stream drops out after its lease expires. The **Engine Tick Timing** dashboard has p50 and p95 tick-duration scatter plots against this count. The plots only include records emitted after the updated web and engine services are running.

The same dashboard has an **Economy subphase p95 duration** chart with separate series for repairs, collection, deliveries, builds, research, and maintenance/sharing. These six timings are nested within the existing total `economy` phase; each measures elapsed time including any awaited I/O. The chart receives data after the updated engine starts and publishes its next timing window.

## Scaling path

This process model is simple to isolate and diagnose, but it uses roughly two processes and one gateway connection per bot. If process count, memory, connection count, or startup time becomes the limiting factor, a later runner can keep the same per-player result contract while using a shared gateway with multiple player handles. Measure those limits before making that change.
