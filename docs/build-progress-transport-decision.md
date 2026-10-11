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

## Baseline capture (500 ms polling)

The initial freshness target is **p95 displayed progress age at or below
500 ms**. The engine updates progress every tick, so most intermediate values
are intentionally skipped. Measure how old the value on screen is, rather than
waiting for every engine value to appear.

The engine writes `progress_updated_at_unix_ms` with each active build,
upgrade, or research update. The v3 endpoint passes it through, includes
`server_time_ms` for a browser/server clock-offset estimate, and reports Redis
and route durations in `Server-Timing`. The browser recorder samples the age of
the progress arc on rendered frames, the selected-entity panel at its next
animation frame, fetch duration, response-body bytes, and frame time. It does not record
anything until started.

1. Run the updated engine and web app. Restarting the engine in its default
   configuration resets game state, so use a disposable match or the normal
   restore procedure. Existing intents written by an older engine have no
   timestamp; a live progress update from the updated engine is needed.
2. Open the game as a player, start a build or research job that is actively
   advancing, and select the entity. In Chrome DevTools Console, run
   `window.bitwarsBuildProgressMetrics.start()`. Let it advance for at least
   60 seconds. A resource-starved or paused job can show an old but still
   correct value; capture that condition separately.
3. Run `window.bitwarsBuildProgressMetrics.stop()` and save its JSON result
   alongside the player count, active-build count, browser/network conditions,
   game ID, and whether the entity was selected. A `renderedAgeSamples` value of
   zero means there was no timestamped active progress to measure.
4. Capture idle time separately to measure background request cost. Repeat
   the advancing-progress capture for the scenarios below, then compare p95 displayed
   age with 500 ms. The recorder reports application response-body bytes; use
   Chrome Network's transferred-size column when wire bytes matter. Use engine
   tick telemetry and host/Redis monitoring for the server-side capacity
   measures in the table below.

The age calculation estimates browser/server clock offset from each response.
The engine and Next.js hosts must have synchronized clocks; otherwise their
clock skew appears as progress age. Record that clock setup with the results.

### First reported capture

One browser run was reported with the 500 ms shared poll. The workload details
(player count, active-build count, network conditions, and selection state) were
not recorded, so treat this as a single-client baseline, not a scale test.

| Measure | Result |
| --- | ---: |
| Duration / requests | 217.7 s / 416 |
| Requests / response body | 114.6 per min / 27.4 KiB per min |
| Unchanged responses | 0% |
| Fetch / Redis / route p95 | 33.8 / 2.4 / 6.1 ms |
| Rendered arc age p50 / p95 | 273 / 500.5 ms (12,496 samples) |
| Selected-panel age p95 | 41.5 ms (205 paint samples) |
| Frame interval p95 / frames over 33 ms | 18.9 ms / 0.2% |
| Estimated server clock offset | 8 ms |
| Recorder's 500 ms target check | `false` |

The rendered-age p95 is **0.5 ms above** the target. That is a literal miss,
but too small to justify a transport change from one run; timing jitter,
sampling, and clock-offset estimation could readily account for it. The
273 ms median and approximately 500 ms p95 are consistent with a 500 ms poll.
The endpoint and Redis timings are small relative to the freshness budget, and
the observed frame metrics show no obvious browser-rendering regression in this
run. The 0% unchanged figure applies to this capture only; measure an idle
period separately. Panel age is sampled only on panel paints, whereas arc age
is sampled on rendered frames, so their p95 values are not directly comparable.

**Recommendation for now:** keep the shared 500 ms poll and do not add SSE
progress events or slow polling based on this capture alone. Repeat an active
build capture with workload metadata, collect an idle capture, then measure
several builds and concurrent clients. If repeated rendered-age p95 values
materially exceed 500 ms, investigate scheduling and end-to-end delay before
choosing a transport. Compare a slower poll and throttled, owner-filtered SSE
only under matched workloads, using the capacity and correctness criteria below.

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
