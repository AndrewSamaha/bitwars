# Build progress transport decision plan

## Polling baseline before the SSE experiment

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

**Recommendation from this initial capture:** keep the shared 500 ms poll and do not add SSE
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

The SSE experiment now uses a global progress batch at approximately 500 ms
intervals while construction is active. The web stream sends only the
authenticated player's states, including a full initial batch on connect.
Clients accept only nondecreasing ticks for a run, replace their progress
state from each full batch, and fall back to the v3 endpoint after a stale or
disconnected stream. The polling baseline below remains the comparison point.
The SSE connection summary reports
wire-frame bytes, while the polling baseline reports JSON response-body bytes;
use browser network transfer sizes for a like-for-like byte comparison.

## 24-bot diagnostic run: trial-24-020

The diagnostic run used the same 24-bot scenario and completed with all bots
succeeding:

```bash
pnpm --filter @bitwars/player-mcp bot-runner -- \
  --count 24 --run-tag trial-24-020 --ramp-ms 500 \
  --timeout-seconds 1200 --allow-game-writes
```

The engine's existing `engine_tick_phase_timing` record now has a nested
`build_progress_redis_publish` phase. Its `samples` count is the number of
attempted progress batch writes in that window; `p95_ms` and `max_ms` measure
only the existing Redis `SET` plus `XADD` call. This phase is inside
`delta_publish`, after the `economy` phase. A failed publish still contributes
a duration and emits the existing engine warning.

Each bot's stdout JSONL includes one `progress_fallback` record per fallback
attempt, emitted at scenario end. The record has the poll start time,
player ID, watched IDs, watch age, time since the last accepted progress batch, time since
any SSE frame, last progress tick and source timestamp, count of states in the
last progress batch, HTTP status and number of states returned when available,
and any request error.
The runner summary still reports total fallback requests. Diagnostics are
bounded to 1,000 records per bot; the run should remain well below that limit.

The web app's `build_progress_sse_connection` Axiom record now includes player
ID and, for live progress frames, the count, mean, maximum, and count over
1,000 ms of time from the batch's engine timestamp to completion of the SSE
write. Initial snapshots and bootstrap catch-up frames are excluded from these
age fields. A live frame that is at least 1,000 ms old also emits a
`build_progress_sse_lag` record with player ID and server tick, at most once per
10 seconds per connection. The engine and web app clocks must be synchronized
for this age to be meaningful. Query the runner's exact start/end time for engine and HTTP
metrics, and extend the end by about 10 seconds for connection-close records.

Read the three layers together:

| Observation | Leading explanation to investigate |
| --- | --- |
| Fallback returns no state | The watch outlived the active build; check command completion and final clearing batch. |
| Fallback returns a state and engine Redis publish durations are high | The engine's Redis write may be delaying publication. |
| Fallback returns a state and web live source age exceeds 1 second | Delay is between engine timestamp and SSE write; inspect stream backlog and web processing. |
| Fallback returns a state, web age stays low, but all bot SSE frames go quiet | Delay is after the web write or at the client's stream reader. |
| Fallback returns a state, other SSE frames keep arriving, and web age stays low | Check watch age, owner selection, progress batch cadence, and the fallback threshold. |

These summaries do not correlate a specific Redis write to a specific fallback.
If the first run points to an ambiguous layer, add short-lived tracing for a
small sample of server ticks rather than logging every batch on the engine's
hot path. Compare bot completion, fallback count, SSE bytes, and `economy` and
`delta_publish` timing with `trial-24-018` and `trial-24-019`.

In `trial-24-020`, 41 fallback requests occurred: 22 followed an empty prior
batch and returned an active build, 17 came from one bot that kept watching
after its build command finished, and two followed a nonempty batch by just
over 1 second. The engine's longest measured batch Redis write was 4.0 ms;
the web server's longest live batch source age was 880 ms. These results led
to a 1,250 ms stale threshold, a fresh grace period when watched IDs change,
and clearing the scripted bot's watch as soon as the command becomes terminal.

For the next comparison, restart the web app and player MCP processes and run
the same scenario with a new tag, such as `trial-24-021`. Compare the fallback
diagnostic categories with `trial-24-020`, then check that SSE bytes, bot
completion, and economy/tick timings remain close to the prior 500 ms runs.

## 24-bot polling baseline: trial-24-017

The runner started 24 bots on 2026-10-12 at 21:14:04 UTC and finished at
21:21:01 UTC (417.5 seconds); all 24 completed. Axiom measurements below use
that exact interval. The endpoint records have no run tag, so the counts are
attributed by time and could include another client using the endpoint during
the run. The runner summary is at
`.metrics/player-mcp/runs/trial-24-017/summary.json`.

| Measure | Polling baseline |
| --- | ---: |
| Successful `/api/v3/build-state` requests | 8,337 |
| Mean request rate over the full run | 20.0/s |
| Peak request rate in a 10-second bucket | 47.9/s |
| Application response bodies | 1,322,033 bytes (1.26 MiB) |
| Mean / p95 response body | 158.6 / 165 bytes |
| Requested IDs / returned states | 8,337 / 8,275 |
| Route duration p50 / p95 / p99 | 22.2 / 64.6 / 142.8 ms |
| Redis read duration p50 / p95 / p99 | 5.2 / 37.1 / 74.3 ms |
| Connected players, maximum / mean across engine timing windows | 24 / 16.6 |
| World entities, maximum | 861 |
| Engine tick p95, mean / maximum across 28 timing windows | 38.8 / 163.2 ms |
| Engine CPU capacity use, mean across timing windows | 8.9% |

Each request asked for one ID, and 99.3% returned a build state. Response-body
bytes exclude HTTP headers and SSE traffic. The engine figures are summaries
of published timing windows, not percentiles over all individual ticks. This
bot run did not measure browser display age, frame time, or web-server CPU. For an SSE comparison,
use the same bot workflow and count, record owner-filtered SSE event count and
bytes, and compare server and engine metrics at similar connected-player and
entity counts. Repeat the browser freshness capture separately.
