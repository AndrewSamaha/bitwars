# MCP-connected deterministic headless player

## Purpose

The first-class load-test design has two pieces: a **player gateway exposed as
an MCP server** and a **deterministic player that connects to it as an MCP
client**. The gateway speaks the game's existing authenticated HTTP/SSE
protocol; the player chooses actions from observed state. Neither loads the
renderer or image assets. Run many independent players to find where
simultaneous connections, polling, intent submission, or simulation begin to
degrade. A small real-browser cohort still measures rendering and perceived
latency.

```text
deterministic players -- MCP calls --> player gateway -- HTTP/SSE --> game
       decisions and replay log          protocol/session state       existing APIs
```

The load runner must actually use the MCP interface. Keep the gateway's game
protocol implementation modular enough to test directly, but do not make a
direct-HTTP bot the primary path. Measure gateway overhead separately and use
a matched direct-protocol run later if needed to validate a suspected gateway
bottleneck.

Run load tests against a disposable match and accounts. Opening the world SSE
stream may enqueue a player join, and submitted intents change game state. Do
not point the harness at a match whose state must be preserved.

## Boundary between the two pieces

The gateway owns authentication, one backend SSE connection per virtual
player, snapshot/delta parsing, reconnect handshakes, `run_id` and
`client_seq`, progress polling, intent submission, and event buffering. It
holds test credentials and cookies; MCP callers receive an opaque player
handle, not those credentials. It must not share one backend SSE connection or
coalesce different players' progress requests, because that would understate
the load on the game server. Its internal protocol adapter should have no
direct Redis dependency.

Expose a small, typed MCP tool surface:

| Operation | Responsibility |
| --- | --- |
| `connect_player` | Bind a provisioned test identity, open its SSE stream, perform the handshake, and return an opaque handle plus readiness state. |
| `observe_events` | Return a bounded batch since a cursor, optionally waiting briefly; report gaps/overflow explicitly. Include receive timestamps and raw-byte counts. |
| `get_player_state` | Return the gateway's current player-visible state and connection/sequence status, derived from that player's stream and handshake. |
| `send_intent` | Submit an action for an owned entity with the current `run_id`, next sequence, and unique command ID; return IDs needed to correlate lifecycle events. |
| `disconnect_player` | Close the player's SSE stream, timers, and buffers and release the handle. |

Progress observations can be included in `observe_events` or
`get_player_state`; the gateway still performs the real
`/api/v3/build-state` requests on the prescribed schedule. MCP's own
request/response or streaming transport is **not** the game's SSE connection.
Batching gateway-to-runner observations avoids one MCP call per world event,
while bounded buffers and explicit overflow prevent silent data loss. Avoid
an unbounded long-lived MCP call per player.

The deterministic player owns a seeded policy, scenario mix, action pacing,
and a replay log of inputs, decisions, and results. It calls only the gateway
tools to observe and act. Base decisions on ordered observations and game ticks
where possible; use a seeded scheduler for timing jitter. Replaying a seed
should reproduce choices and action order, not promise identical network
arrival times or server scheduling. Capture the seed, scenario version,
content version, run ID, and player identity mapping with results.

Provision distinct test accounts outside the timed portion of a run. Scope
opaque handles to the authorized load runner, cap active handles, redact
credentials from results, and restrict the gateway to a disposable test
environment. Do not expose generic Redis or arbitrary HTTP proxy tools.
The existing [game-query API](game-query.md) may supply authoritative
read-only assertions after or alongside a run; it must not replace the
player-facing paths under test.

## One virtual player's behavior

Each virtual player has a distinct authenticated session, backend connection,
and intent sequence, represented by one gateway handle. Do not reuse one
player's cookie or `client_seq` across bots: that would measure many
connections to one player, not many simultaneous players. The player drives
the following flow through MCP; the gateway performs the underlying requests.

1. Authenticate as a test player and open
   `GET /api/v2/gamestate/stream`. Parse SSE events continuously, including
   the initial snapshot, deltas, lifecycle events, and world resets. Record
   connection time, time to first snapshot, event lag, bytes, and disconnects.
2. On every SSE open, call `GET /api/v2/reconnect`. Reconcile the returned
   `run_id`, player ID, active intents, and last processed `client_seq` before
   sending a new command. Wait for the snapshot and player-owned entities as
   needed; a freshly joined player may not own an entity immediately.
3. For active build, upgrade, or research jobs, request the relevant owned
   entity IDs from `GET /api/v3/build-state` at the client's current 500 ms
   cadence. Mirror the shared client store: one request for the union of IDs,
   and no polling when there are no IDs to observe. Record response size,
   latency, unchanged responses, and age of returned progress. The separate
   browser recorder remains the source for *painted* progress age.
4. Send realistic `POST /api/v1/intent` commands for owned entities. Use a
   fresh UUIDv7 `client_cmd_id`, monotonically increasing per-player
   `client_seq`, and the current `run_id`. Correlate each submission with its
   lifecycle events; count accepted, rejected, timed-out, and completed
   commands. Do not send another command solely to maximize request rate unless
   that is an explicitly separate stress scenario.
5. Handle reconnects and world resets as a browser would, including a fresh
   handshake and sequence reconciliation. Shut down SSE connections cleanly
   when a virtual player exits.

Keep player behavior configurable rather than making every bot issue the same
command at the same instant. Useful profiles are an idle connected observer,
an active mover, and a player with an advancing build. Give them independent
timing jitter so the normal run does not accidentally become a synchronized
burst test; run deliberate bursts separately.

## Implementation milestones

1. Define the typed MCP operations, player-handle lifecycle, bounded event
   cursor semantics, and per-player metrics. Implement one gateway-backed
   player that joins, receives a snapshot, completes the reconnect handshake,
   sends one valid intent, observes its lifecycle, and disconnects.
2. Add reconnect/world-reset handling and progress polling, with tests for
   first connect, sequence reconciliation, ownership, missing events, and
   clean shutdown. Verify that each MCP player creates exactly one expected
   backend SSE connection and its own HTTP traffic.
3. Add a seeded deterministic policy and replay log. Test that the same
   recorded observations and seed produce the same decisions and action order.
4. Add the multi-player runner, account pool, profiles, concurrency ramp, and
   metrics export. First compare idle SSE and SSE-plus-polling, then add
   active intents and builds.
5. Validate the harness itself: measure MCP/gateway CPU, memory, queue delay,
   and event-buffer overflow. If it saturates before the game server, scale or
   replace the generator and compare with a matched direct-protocol run before
   claiming a server capacity limit.

## Tests to run

| Scenario | What it isolates or reveals |
| --- | --- |
| Increasing numbers of idle SSE players | Connection capacity, snapshot/join cost, idle stream lag, reconnect rate, and Redis blocking-read behavior. |
| Same players with progress polling | Added HTTP, auth, Redis, and response-byte cost of the 500 ms shared poll. Include both active and no-observed-ID periods. |
| Several players issuing intents and building | Engine ingress/tick capacity, event fan-out, ownership filtering, and progress freshness under actual world changes. |
| Join and reconnect bursts | Cold-start snapshots, handshake contention, recovery time, and sequence correctness. |
| Sustained load plus a small real-browser cohort | Whether real UI progress and controls remain responsive while headless players consume backend capacity. |

Ramp through increasing concurrent-player counts (for example 1, 10, 25, 50,
100, then 200), holding each level long enough to collect stable p95 values.
Repeat a steady-state run and a burst run at each important threshold. Record
the number of active builds, owned and total entities, game ID, hardware,
deployment topology, and network conditions with every result. Stop increasing
load when correctness or latency becomes unacceptable; the goal is to identify
the limiting component, not just produce a maximum player number.

The idle-SSE test deserves early attention. The current stream route invokes a
blocking `XREAD` for each client, while `streamRedis` is a shared connection
within a web-server process. Concurrent reads may queue behind one another
when the event stream is quiet. Measure first-event and steady-state event lag
as clients increase before attributing any lag to the engine. This is a
hypothesis to verify, not a measured capacity limit.

## Measurements and decision points

- Client: concurrent connections, connection and first-snapshot p50/p95,
  SSE event lag, reconnects/errors, intent submission-to-lifecycle p50/p95,
  reject/timeout/completion counts, and per-player request/event bytes.
- Progress: request rate, response bytes, unchanged-response percentage, and
  progress age. Keep the existing **p95 painted progress age <= 500 ms** target
  for the real-browser cohort; headless receive age is a diagnostic, not an
  interchangeable substitute.
- Web/Redis: web CPU and memory, route p95, Redis CPU/command rate, blocked
  clients and queueing, plus per-process connection counts. Compare idle SSE
  alone with SSE plus polling to separate their costs.
- Engine: tick p95/p99 and over-budget ticks, intent ingress/backlog,
  entity/build counts, and time to publish lifecycle and world updates.
- Generator: its own CPU, memory, sockets, and network throughput, so a
  saturated load machine is not mistaken for a server limit.

The single-client polling capture in
[`build-progress-transport-decision.md`](build-progress-transport-decision.md)
reported 114.6 requests/minute. At 100 similarly polling clients, that is
roughly 191 requests/second *by arithmetic only*, not a capacity measurement.
The headless run should test the actual rate and its effect on freshness and
server resources.

Compare runs under the same world size and player mix. A useful outcome is the
first concurrency level at which one of the following consistently fails:
snapshot or event timeliness, intent correctness/latency, progress freshness,
engine tick budget, or server resource headroom. Only then decide whether to
change SSE fan-out, polling cadence, deployment capacity, or simulation work.
