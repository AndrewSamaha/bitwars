import { getEnv } from "@/lib/utils";
import { xReadWithBuffers } from "@/lib/db/utils/redis-streams";
import { createSseChannel } from "@/lib/db/utils/sse-channel";
import { bootstrapAndCatchUp } from "@/lib/db/utils/bootstrap";
import { emitBuildProgressBatch, emitEventFromBuffer, type ProgressDelivery } from "@/lib/db/utils/delta";
import { logger, withAxiom } from "@/lib/axiom/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { redis } from "@/lib/db/connection";
import { VisibilityFilter } from "@/lib/db/utils/visibility";
import { trackPlayerConnection } from "@/lib/db/utils/player-presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";
const HEARTBEAT_INTERVAL_MS = 10_000;
const XREAD_BLOCK_MS = 1_000; // Also publish pause/resume controls while the simulation is idle.
const XRANGE_BATCH_COUNT = 512;
const SNAPSHOT_RETRY_MS = 250;

export const GET = withAxiom(async (req: Request) => {
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const lastEventId = req.headers.get("last-event-id");
  const sid = url.searchParams.get("sid") || undefined;
  const actingAsId = url.searchParams.get("as")?.trim() || undefined;

  const GAME_ID = getEnv("GAME_ID", DEFAULT_GAME_ID);

  const logPrefix = `[sse ${Date.now().toString(36)}]`;
  const log = (...args: any[]) => console.log(logPrefix, ...args);
  const logErr = (...args: any[]) => console.error(logPrefix, ...args);

  const channel = createSseChannel({ heartbeatMs: HEARTBEAT_INTERVAL_MS, log });

  logger.info("v2/stream:init", { GAME_ID, sid, sinceParam, lastEventId });

  const { auth, res } = await requireAuthOr401();
  if (res) return res; // 401 when not authenticated; ensures only authenticated clients get stream and join enqueue.

  // M6: Keep the player id available for join enqueue after bootstrap. A join
  // must not be enqueued before we have established a durable stream cursor,
  // otherwise its spawn delta can land in the snapshot-to-tail handoff gap.
  const playerId = auth?.playerId as string | undefined;

  const end = async () => {
    await channel.close();
  };

  channel.attachAbortSignal(req.signal, () => {
    // nothing else needed; channel.close() is invoked in handler
  });

  // Redis Streams helpers moved to '@/lib/db/utils/redis-streams'

  // Set up connection and streaming logic
  (async () => {
    let stopTracking: (() => Promise<void>) | undefined;
    const connectedAt = Date.now();
    let progressEvents = 0;
    let progressBytes = 0;
    let liveProgressAgeSamples = 0;
    let liveProgressAgeSumMs = 0;
    let liveProgressAgeMaxMs = 0;
    let liveProgressAgeOver1000 = 0;
    let liveProgressAgeNegative = 0;
    let lastProgressLagLogAt = 0;
    const recordProgress = (bytes: number) => {
      if (bytes <= 0) return;
      progressEvents++;
      progressBytes += bytes;
    };
    const recordLiveProgressDelivery = (delivery: ProgressDelivery) => {
      const ageMs = delivery.sent_at_ms - delivery.source_time_ms;
      if (ageMs < 0) {
        liveProgressAgeNegative++;
        return;
      }
      liveProgressAgeSamples++;
      liveProgressAgeSumMs += ageMs;
      liveProgressAgeMaxMs = Math.max(liveProgressAgeMaxMs, ageMs);
      if (ageMs >= 1_000) {
        liveProgressAgeOver1000++;
        if (delivery.sent_at_ms - lastProgressLagLogAt >= 10_000) {
          lastProgressLagLogAt = delivery.sent_at_ms;
          logger.info("build_progress_sse_lag", {
            game_id: GAME_ID, player_id: playerId, server_tick: delivery.server_tick,
            source_age_ms: ageMs,
          });
        }
      }
    };
    try {
      if (playerId) {
        try { stopTracking = await trackPlayerConnection(GAME_ID, playerId); }
        catch (error) { logger.warn("v2/stream:presence:start:error", { GAME_ID, playerId, error: String(error) }); }
      }
      // (Handshake and boot delay removed; client now gates readiness.)

      const streamEvents = `rts:match:${GAME_ID}:events`;
      const contentDefsKey = `rts:match:${GAME_ID}:content_defs`;
      const contentDefs = await redis.get(contentDefsKey);
      const parsedContent = contentDefs ? JSON.parse(contentDefs) : {};
      const entityTypes = parsedContent.entity_types ?? {};
      const visibility = new VisibilityFilter(actingAsId ?? playerId ?? "", entityTypes, parsedContent.technologies ?? {});
      let lastId: string | undefined;
      let previousRuntime = await redis.get(`rts:match:${GAME_ID}:runtime`);

      // Visibility state is connection-local, so every connection starts from
      // a filtered snapshot rather than replaying an unfiltered cursor.
      logger.info("v2/stream:bootstrap:start", { GAME_ID, sid, resumedFrom: sinceParam ?? lastEventId });
      while (!channel.isClosed() && !lastId) {
          const bootLast = await bootstrapAndCatchUp(GAME_ID, channel, () => channel.isClosed(), (msg, e) => {
            logErr(msg, e);
            logger.error("v2/stream:bootstrap:error", { GAME_ID, sid, msg, error: e?.message || String(e) });
          }, visibility, recordProgress, playerId);
        if (bootLast) {
          lastId = bootLast;
          logger.info("v2/stream:bootstrap:complete", { GAME_ID, sid, lastId });
          break;
        }
        log("snapshot unavailable; waiting before bootstrap retry");
        await new Promise((resolve) => setTimeout(resolve, SNAPSHOT_RETRY_MS));
      }

      if (!lastId || channel.isClosed()) return;

      // A full progress batch gives new connections a current owner-scoped
      // state. Clients use server_tick to ignore older catch-up events.
      const latestProgress = await redis.get(`rts:match:${GAME_ID}:build_progress_snapshot`);
      const currentRuntime = await redis.get(`rts:match:${GAME_ID}:runtime`);
      const runtimeRunId = currentRuntime ? JSON.parse(currentRuntime).run_id : undefined;
      let progressBatch: Record<string, unknown> = {
        type: "build-progress", run_id: runtimeRunId, server_tick: 0,
        server_time_ms: Date.now(), states: [], recipients: [],
      };
      if (latestProgress) {
        try {
          const saved = JSON.parse(latestProgress);
          if (saved?.type === "build-progress" && saved.run_id === runtimeRunId) progressBatch = saved;
        } catch { /* An invalid batch is replaced by the empty snapshot. */ }
      }
      recordProgress(await emitBuildProgressBatch(channel, undefined, progressBatch, playerId, true));

      // The snapshot/catch-up cursor is durable. Enqueue the new player's join
      // only after it is established, so the spawn is guaranteed to be a delta
      // after this cursor (and is readable even if XREAD starts a moment later).
      if (playerId && !actingAsId) {
        const joinRequestedKey = `rts:match:${GAME_ID}:join_requested`;
        const pendingJoinsKey = `rts:match:${GAME_ID}:pending_joins`;
        const added = await redis.sadd(joinRequestedKey, playerId);
        if (added === 1) {
          await redis.rpush(pendingJoinsKey, playerId);
          logger.info("v2/stream:join_enqueued", { GAME_ID, playerId, afterCursor: lastId });
        }
      }

      logger.info("v2/stream:live:start", { GAME_ID, sid, from: lastId, stream: streamEvents });

      while (!channel.isClosed()) {
        try {
          const entries = await xReadWithBuffers(streamEvents, lastId, XREAD_BLOCK_MS, XRANGE_BATCH_COUNT);
          const runtime = await redis.get(`rts:match:${GAME_ID}:runtime`);
          if (runtime && runtime !== previousRuntime) {
            const next = JSON.parse(runtime);
            const previous = previousRuntime ? JSON.parse(previousRuntime) : {};
            if (previous.run_id && next.run_id !== previous.run_id) {
              await channel.write(`event: world-reset\ndata: ${JSON.stringify(next)}\n\n`);
              break;
            }
            await channel.write(`event: runtime\ndata: ${runtime}\n\n`);
            previousRuntime = runtime;
          }
          if (!entries || entries.length === 0) {
            // timeout, emit heartbeat has already been doing pings
            continue;
          }
          for (const ent of entries) {
            const id = ent.id;
            const dataBuf = ent.data;
            if (!dataBuf) continue;
            const sentProgressBytes = await emitEventFromBuffer(channel, id, dataBuf, (msg, e) => {
              logErr(`${msg} (live)`, e);
              logger.error("v2/stream:emit:error", { GAME_ID, sid, id, msg, error: e?.message || String(e) });
            }, visibility, playerId, recordLiveProgressDelivery);
            recordProgress(sentProgressBytes);
            lastId = id;
          }
        } catch (e: any) {
          // Attempt a simple retry loop on transient errors
          logErr("xread error", e?.message || e);
          logger.warn("v2/stream:xread:error", { GAME_ID, sid, error: e?.message || String(e) });
          // small delay before retry to avoid hot loop
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
      }
    } catch (e) {
      logErr("fatal error", e);
      logger.error("v2/stream:fatal", { GAME_ID, sid, error: (e as any)?.message || String(e) });
    } finally {
      await end();
      if (stopTracking) {
        try { await stopTracking(); }
        catch (error) { logger.warn("v2/stream:presence:close:error", { GAME_ID, playerId, error: String(error) }); }
      }
      logger.info("build_progress_sse_connection", {
        event_type: "build_progress_sse_connection",
        game_id: GAME_ID,
        player_id: playerId,
        progress_events: progressEvents,
        progress_bytes: progressBytes,
        live_progress_age_samples: liveProgressAgeSamples,
        live_progress_age_mean_ms: liveProgressAgeSamples ? liveProgressAgeSumMs / liveProgressAgeSamples : null,
        live_progress_age_max_ms: liveProgressAgeSamples ? liveProgressAgeMaxMs : null,
        live_progress_age_over_1000_count: liveProgressAgeOver1000,
        live_progress_age_negative_count: liveProgressAgeNegative,
        connection_duration_ms: Date.now() - connectedAt,
      });
      logger.info("v2/stream:close", { GAME_ID, sid });
    }
  })();

  return new Response(channel.readable, { headers: channel.headers });
});
