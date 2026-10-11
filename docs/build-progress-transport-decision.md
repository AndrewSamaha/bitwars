# Build progress transport decision plan

## Current state

The world SSE stream carries entity snapshots, deltas, and intent lifecycle
events, but no construction progress. The renderer and selected-entity panel
need progress for build, upgrade, and research UI. Both now read a shared client
store that polls `/api/v3/build-state` every 500 ms for the union of their entity
IDs. The v3 endpoint reads only those fields from the active-intents Redis hash.
`/api/v2/build-state` remains available for older clients.

This reduces duplicate browser requests but does not establish whether polling
or SSE is cheaper at game scale. The server request timings in the dev log are
not a transport comparison: they omit browser scheduling, bytes, Redis work,
and the latency from an engine update to a painted progress arc.

## Decision criteria

Measure these for the same workload and report median and p95 where applicable:

| Metric | Why it matters |
| --- | --- |
| Engine progress update to visible UI update | User-perceived freshness; record both the detail percentage and rendered arc. |
| HTTP requests and response bytes per client-minute | Polling cost, including empty or unchanged responses. |
| SSE event count and bytes per client-minute | Push cost, including progress events when nobody is watching. |
| Redis commands, bytes, and CPU | Polling reads versus the work required to publish and fan out progress. |
| Next.js CPU, memory, and p95 endpoint/event processing time | Capacity per connected client. |
| Browser main-thread time and dropped frames | Parsing, store updates, and arc rendering. |
| Engine tick p95/p99 | Ensure progress publishing does not slow simulation. |

Also verify correctness: owner-only delivery, start and completion, cancellation,
pause, reconnect, world reset, and changes of selected entity. A stream design
must send an initial progress state on connect, then update or remove it when
the authoritative intent changes. Avoid exposing progress for other players.

## Comparison procedure

1. Establish a target freshness budget for progress UI (the current poll
   interval is 500 ms). Capture an authoritative engine update timestamp or
   tick, a browser receive timestamp, and the next painted frame. Time the
   endpoint and Redis read separately. Count the bytes and requests in browser
   network traces and server telemetry.
2. Run three repeatable scenarios: one player with one active build (including
   selection), a normal match with several active builds, and a high-concurrency
   match with many clients and builds. Include idle periods, and repeat with a
   slow network and a reconnect. Use the same game state and client count for
   each variant.
3. Compare (a) the shared 500 ms poll, (b) a slower poll such as 1 s if it
   meets the freshness budget, and (c) owner-filtered progress events on the
   existing SSE connection, throttled to the needed UI rate. Do not publish at
   the 60 Hz engine tick rate solely for this display.
4. Prefer the simplest variant that meets the freshness budget and correctness
   checks without worsening engine tick latency or browser frames. If SSE saves
   meaningful Redis/HTTP work at expected concurrency, move progress to that
   stream and remove the poll. If progress is rare and polling stays cheap,
   retain the shared poll. Record workload size, numbers, and the chosen
   threshold so the decision can be revisited as concurrent players grow.

The single-client development log alone cannot identify the crossover point.
