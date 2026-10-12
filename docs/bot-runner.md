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

`Ctrl-C` stops new launches, signals active bot process groups, waits for their exit, and records unstarted bots in the summary. Bot stdout and stderr remain separate so concurrent runs do not interleave their step records. Logs and summaries live under ignored `.metrics/` by default; copy them elsewhere if they must be retained.

## Scaling path

This process model is simple to isolate and diagnose, but it uses roughly two processes and one gateway connection per bot. If process count, memory, connection count, or startup time becomes the limiting factor, a later runner can keep the same per-player result contract while using a shared gateway with multiple player handles. Measure those limits before making that change.
