# 003 - Serialization Strategy: Protobuf on Hot Path, JSON on Reconnect

Date: 2026-02-07
Status: Accepted

## Context

The engine writes data to Redis on two very different paths:

1. **Hot path (every tick / every intent):** Snapshots, deltas, lifecycle events,
   and intent envelopes are published to Redis Streams and consumed in real time
   by the SSE bridge. These messages are decoded on every tick by every connected
   client.  Wire size, encode/decode speed, and schema evolution via field
   numbers all matter here.

2. **Reconnect path (rare, per-session):** Per-entity active-intent tracking and
   per-player `last_processed_client_seq` are written on each intent
   state-change but are only *read* when a client reconnects or the engine
   restarts.  These reads are infrequent (once per reconnect), and
   human-readability in `redis-cli` / RedisInsight is valuable for debugging.

We needed a clear convention so future contributors know which format to use
when adding new data to Redis.

## Decision

- **Protobuf** is the required format for all data on the **tick-critical hot
  path**: snapshots, deltas, lifecycle events, intent envelopes, and any future
  per-tick messages.  Protobuf gives us compact binary encoding, fast
  encode/decode, and backward-compatible schema evolution via field numbers.

- **JSON** (via `serde_json`) is acceptable for data that is written per
  state-change but only **read on reconnect or engine restore**, such as the M2
  per-entity active-intent tracking entries in the `active_intents` hash.  JSON
  keeps these entries human-readable in Redis tooling and avoids the overhead of
  maintaining a dedicated `.proto` message for data that is never decoded on the
  hot path.

### Boundary rule

> If a Redis value is read inside the main `Engine::run()` tick loop, it **must**
> be protobuf.  If it is only read during startup restore or a reconnect
> handshake, JSON is fine.

### Current usage

| Redis key / stream | Format | Read frequency | Rationale |
|---|---|---|---|
| `rts:match:{id}:events` (deltas, lifecycle) | Protobuf | Every tick | Hot path; wire size matters |
| `rts:match:{id}:snapshots` | Protobuf | On connect / restore | Large payload; protobuf is ~3× smaller |
| `rts:match:{id}:intents` | Protobuf | Every tick | Hot path; schema evolution via field numbers |
| `snapshot:{id}` (latest snapshot KV) | Protobuf | On connect / restore | Reuses Snapshot message |
| `rts:match:{id}:dedupe:*` | Hex string | Every tick (GET/SETEX) | Scalar value; no structured format needed |
| `rts:match:{id}:player_seq` | Scalar u64 | Reconnect / restore | Single number per player |
| `rts:match:{id}:active_intents` | **JSON** | Reconnect / restore | Human-readable; infrequent reads |

## Consequences

- **Positive:** Clear, enforceable rule. New contributors can quickly determine
  the right format.  JSON tracking entries are trivially inspectable during
  development (`HGETALL rts:match:demo-001:active_intents` returns readable
  output).
- **Negative:** Two serialization formats in the codebase.  Mitigated by the
  bright-line boundary rule above—there is no ambiguity about which to use.
- **Migration path:** If reconnect data ever moves onto the hot path (e.g.,
  per-tick sync), it must be migrated to protobuf.

## Alternatives Considered

- **Protobuf everywhere:** More uniform, but adds a `.proto` message and codegen
  for data that is only read on reconnect.  The extra compile-time cost and
  reduced debuggability in Redis tooling were not justified.
- **JSON everywhere:** Simpler serialization, but unacceptable decode overhead
  for per-tick messages (deltas, lifecycle events) and loses protobuf's
  backward-compatible field-number evolution.
- **MessagePack / CBOR:** Compact binary JSON alternatives.  Added a dependency
  with no clear advantage over protobuf (already in use) for hot-path data, and
  loses human-readability for reconnect data.

## References

- M2 milestone: per-entity last-processed tracking (`docs/milestones.md`)
- ADR-002: Strongly-Typed Intents and ActionState Container
- `services/rts-engine/src/io/redis.rs` — tracking methods and module-level comment
