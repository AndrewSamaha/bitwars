# Intent CLI Tool

## Overview

The Intent CLI publishes `IntentEnvelope` messages directly to the RTS engine’s Redis stream. Use it to simulate client submissions while testing lifecycle, dedupe, and sequencing logic.

## Requirements

- Redis instance accessible via URL (e.g., `redis://127.0.0.1:6379`).
- The `rts-engine` Rust workspace dependencies (runs via `cargo`).

## Running the CLI

```bash
cargo run -p rts-engine --bin intent_cli -- \
  redis://127.0.0.1:6379 demo-001 \
  move 1 15.0 22.0 11111111-2222-4333-8444-555555555555 demo-player 1
```

### Arguments

1. **`<redis_url>`** – target Redis endpoint.
2. **`<game_id>`** – match identifier, aligns with engine `GAME_ID`.
3. **`move`** – command keyword (currently only `move` is supported).
4. **`<entity_id>`** – numeric entity identifier to command.
5. **`<x>` / `<y>`** – destination coordinates.
6. **`<client_cmd_id>`** – UUID string; auto-generated if parsing fails.
7. **`<player_id>`** – issuing player identifier.
8. **`<client_seq>`** – monotonic sequence number per player.

## Behavior

- Wraps payload into an `IntentEnvelope` with `protocol_version=1` and default policy `REPLACE_ACTIVE`.
- Generates a new `intent_id` and preserves provided `client_cmd_id` (parsed as UUIDv7 when possible).
- Publishes to the stream keyed by `rts:match:{game_id}:intents` using `RedisClient::publish_intent_envelope()` in `services/rts-engine/src/io/redis.rs`.
- On success, prints the Redis stream ID returned by XADD.

## Tips

- Keep `client_seq` increasing to avoid `REJECTED(OUT_OF_ORDER)` responses.
- Reuse `client_cmd_id` to test dedupe behavior (`REJECTED(DUPLICATE)`).
- Pair with `redis-cli XREAD` or the web SSE route to observe emitted lifecycle events.
