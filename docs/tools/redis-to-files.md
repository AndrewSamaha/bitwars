# Redis to Files Tool

A generic tool that reads gamestate from Redis at two points in time and outputs them to files for ingestion by the offline replay engine.

## Purpose

This tool enables you to:
1. **Extract real game data** from Redis at specific timestamps
2. **Use Redis data as source-of-truth** for validation
3. **Compare offline simulation results** against actual Redis state
4. **Create test fixtures** from real game sessions

## Usage

```bash
cd services/rts-engine
cargo run --bin redis_to_files <game_id> <time1> <time2> [output_dir] [time_window_seconds]
```

### Parameters

- `game_id`: Redis game ID (e.g., "demo-001")
- `time1`: First timestamp (Unix timestamp, 'now', or 'current')
- `time2`: Second timestamp (Unix timestamp, 'now', or 'current')
- `output_dir`: Output directory (default: ./redis_data)
- `time_window_seconds`: Time window around each timestamp (default: 60)

### Examples

```bash
# Extract data from now and 1 hour ago
cargo run --bin redis_to_files demo-001 now 1640995200

# Extract data from two specific timestamps with custom output directory
cargo run --bin redis_to_files demo-001 1640995200 1640995800 ./output 30

# Extract data from current time and 2 hours ago with 5-minute window
cargo run --bin redis_to_files demo-001 now current ./game_data 300
```

## Output Files

For each timestamp, the tool creates:

- `{prefix}_snapshot.bin` - Game snapshot at that time
- `{prefix}_deltas.bin` - Entity deltas within the time window
- `{prefix}_intents.bin` - Intent envelopes within the time window
- `{prefix}_summary.txt` - Human-readable summary of extracted data

Where `{prefix}` is either `time1` or `time2`.

## Using with Replay Engine

Once you have the extracted files, you can use them with the replay engine:

```bash
# Run replay with extracted snapshot
cargo run --bin replay ./redis_data/time1_snapshot.bin

# Run replay with snapshot and intents
cargo run --bin replay ./redis_data/time1_snapshot.bin ./redis_data/time1_intents.bin
```

## Environment Variables

- `GAMESTATE_REDIS_URL`: Redis connection URL (default: redis://127.0.0.1:6379)
- `GAME_ID`: Default game ID (can be overridden by command line)

## Data Sources

The tool reads from these Redis streams and keys:

- `snapshot:{game_id}` - Current game snapshot
- `snapshot_meta:{game_id}` - Snapshot metadata (tick, timestamp)
- `rts:match:{game_id}:events` - Events stream (deltas, lifecycle events)
- `rts:match:{game_id}:intents` - Intents stream (player intents)

## Time Window

The tool uses a configurable time window around each timestamp to capture:
- **Deltas** that occurred within the window
- **Intents** that were submitted within the window

This ensures you capture all relevant game state changes around the target time.

## Use Cases

1. **Regression Testing**: Extract real game data, replay offline, compare results
2. **Debugging**: Capture game state at specific moments for analysis
3. **Test Data Generation**: Create realistic test fixtures from actual gameplay
4. **Performance Analysis**: Compare offline vs online simulation performance
5. **State Validation**: Verify that offline simulation matches live game state