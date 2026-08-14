import { getEnv } from "@/lib/utils";
import { xReadWithBuffers } from "@/lib/db/utils/redis-streams";
import { createSseChannel } from "@/lib/db/utils/sse-channel";
import { bootstrapAndCatchUp } from "@/lib/db/utils/bootstrap";
import { emitEventFromBuffer } from "@/lib/db/utils/delta";
import { logger, withAxiom } from "@/lib/axiom/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { redis } from "@/lib/db/connection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";
const HEARTBEAT_INTERVAL_MS = 10_000;
const XREAD_BLOCK_MS = 15_000; // as per spec
const XRANGE_BATCH_COUNT = 512;
const SNAPSHOT_RETRY_MS = 250;

export const GET = withAxiom(async (req: Request) => {
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const lastEventId = req.headers.get("last-event-id");
  const sid = url.searchParams.get("sid") || undefined;

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
    try {
      // (Handshake and boot delay removed; client now gates readiness.)

      // Determine resume behavior
      let startFromId: string | undefined = undefined;
      if (sinceParam && sinceParam.trim().length > 0) {
        startFromId = sinceParam;
      } else if (lastEventId && lastEventId.trim().length > 0) {
        startFromId = lastEventId;
      }

      const streamEvents = `rts:match:${GAME_ID}:events`;

      let lastId = startFromId; 

      if (!lastId) {
        // Full bootstrap: snapshot + gap catch-up using the snapshot boundary
        // as the live cursor. On a fresh engine, wait for its first snapshot
        // rather than replaying the complete match history from 0-0.
        logger.info("v2/stream:bootstrap:start", { GAME_ID, sid });
        while (!channel.isClosed() && !lastId) {
          const bootLast = await bootstrapAndCatchUp(GAME_ID, channel, () => channel.isClosed(), (msg, e) => {
            logErr(msg, e);
            logger.error("v2/stream:bootstrap:error", { GAME_ID, sid, msg, error: e?.message || String(e) });
          });
          if (bootLast) {
            lastId = bootLast;
            logger.info("v2/stream:bootstrap:complete", { GAME_ID, sid, lastId });
            break;
          }
          log("snapshot unavailable; waiting before bootstrap retry");
          await new Promise((resolve) => setTimeout(resolve, SNAPSHOT_RETRY_MS));
        }
      } else {
        log("resuming from", lastId);
        logger.info("v2/stream:resume", { GAME_ID, sid, lastId });
      }

      if (!lastId || channel.isClosed()) return;

      // The snapshot/catch-up cursor is durable. Enqueue the new player's join
      // only after it is established, so the spawn is guaranteed to be a delta
      // after this cursor (and is readable even if XREAD starts a moment later).
      if (playerId) {
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
          if (!entries || entries.length === 0) {
            // timeout, emit heartbeat has already been doing pings
            continue;
          }
          for (const ent of entries) {
            const id = ent.id;
            const dataBuf = ent.data;
            if (!dataBuf) continue;
            await emitEventFromBuffer(channel, id, dataBuf, (msg, e) => {
              logErr(`${msg} (live)`, e);
              logger.error("v2/stream:emit:error", { GAME_ID, sid, id, msg, error: e?.message || String(e) });
            });
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
      logger.info("v2/stream:close", { GAME_ID, sid });
    }
  })();

  return new Response(channel.readable, { headers: channel.headers });
});
