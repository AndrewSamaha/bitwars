# Latency Probe CLI

## Overview

The Latency Probe sends 100 `Move` intents to the RTS engine and measures **submit → first lifecycle event** (RECEIVED or ACCEPTED) latency per intent. It reports p50/p95 and writes a JSON metrics file under `./.metrics/m0.1/`. Use it to baseline pipeline latency (Redis + engine ingest + stream publish) and to catch regressions.

## Requirements

- Redis instance accessible via `GAMESTATE_REDIS_URL` (or default `redis://127.0.0.1:6379`).
- The RTS engine **running** and consuming `rts:match:<game_id>:intents`, publishing lifecycle events to `rts:match:<game_id>:events`.
- The `rts-engine` Rust workspace (runs via `cargo` or `pnpm`).

## Running the CLI

**Via pnpm (recommended):**

```bash
pnpm run latency:probe -- <game_id> [entity_id] [timeout_secs]
```

**Via cargo:**

```bash
cargo run -p rts-engine --bin latency_probe -- <game_id> [entity_id] [timeout_secs]
```

### Example usage

```bash
# Default entity_id=1, timeout=30s; uses GAMESTATE_REDIS_URL or redis://127.0.0.1:6379
pnpm run latency:probe -- testgameid

# Explicit entity and 30s timeout
pnpm run latency:probe -- testgameid 1 30

# Custom Redis URL
GAMESTATE_REDIS_URL=redis://localhost:6379 pnpm run latency:probe -- mygame 1 60
```

## Arguments

1. **`<game_id>`** (required) – Match identifier; must match the engine’s `GAME_ID` so the probe and engine use the same Redis streams.
2. **`[entity_id]`** (optional, default `1`) – Entity ID for the Move intents. The engine must have at least one entity with this ID.
3. **`[timeout_secs]`** (optional, default `30`) – How long to wait for lifecycle events before giving up. Intents that don’t receive RECEIVED/ACCEPTED within this time are counted as timed out.

## Environment

- **`GAMESTATE_REDIS_URL`** – Redis URL (default `redis://127.0.0.1:6379`).

## Behavior

- Opens **two** Redis connections: one for publishing intents, one for reading the events stream.
- Spawns a reader task that blocks on `XREAD "$"` (new events only) **before** publishing, so no lifecycle events are missed.
- Publishes 100 Move intents with unique UUIDv7 `client_cmd_id` and `client_seq` 1..100, spacing publishes by 1 ms to avoid duplicate `client_cmd_id` in the engine’s dedupe window.
- Correlates each RECEIVED/ACCEPTED lifecycle event to its intent via `client_cmd_id` and records latency (receive time − submit time).
- Stops when 100 latencies are collected or `timeout_secs` elapses.
- Writes JSON to `./.metrics/m0.1/latency_probe_<YYYYMMDD_HHMMSS>.json` with `run_ts_iso8601`, `game_id`, `num_sent`, `num_measured`, `timeout_secs`, `p50_ms`, `p95_ms`, `min_ms`, `max_ms`, `latencies_ms`.
- Prints a short summary to the console (n, timed out, p50, p95, min, max).

## Output example

```
Publishing 100 Move intents (entity_id=1)...
Wrote .metrics/m0.1/latency_probe_20260201_204207.json

Latency (submit → first RECEIVED/ACCEPTED):
  n = 100 (0 timed out)
  p50 = 7764.08 ms
  p95 = 14517.84 ms
  min = 10.38 ms  max = 15358.77 ms
```

## Tips

- Start the engine first with the same `GAME_ID` (e.g. `GAME_ID=testgameid cargo run -p rts-engine`), then run the probe.
- High p50/p95 with 100 intents on one entity is expected: the engine processes moves sequentially, so later intents are accepted only after earlier ones progress. The **min** latency is the best approximation of pure pipeline latency.
- If all 100 time out, check that the engine is running, `game_id` matches, and Redis is reachable.
- If you see “duplicate client_cmd_id” or “out of order” in engine logs, the probe’s 1 ms spacing and monotonic `client_seq` should avoid that; ensure only one probe run per game at a time.
