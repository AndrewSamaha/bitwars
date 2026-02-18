import { redis } from "@/lib/db/connection";
import { decodeSnapshotBinary } from "@/lib/db/utils/binary-encoding";
import { mapSnapshotToJson } from "@/lib/db/utils/protobuf";
import { sseFormat } from "@/lib/db/utils/sse";
import type { SseChannel } from "@/lib/db/utils/sse-channel";
import { xRangeWithBuffers } from "@/lib/db/utils/redis-streams";
import { emitEventFromBuffer } from "@/lib/db/utils/delta";
import { readCollectorStatesByEntityIds } from "@/lib/db/utils/collector-state";
import { logger } from "@/lib/axiom/server";

const XRANGE_BATCH_COUNT = 512;

export async function bootstrapAndCatchUp(
  gameId: string,
  channel: SseChannel,
  isClosed: () => boolean,
  logErr: (...args: any[]) => void
): Promise<string | undefined> {
  const keySnapshot = `snapshot:${gameId}`;
  const keySnapshotMeta = `snapshot_meta:${gameId}`;
  const streamEvents = `rts:match:${gameId}:events`;

  let lastId: string | undefined = undefined;

  const meta = await (redis as any).hgetall(keySnapshotMeta);
  const boundaryId = meta?.["boundary_stream_id"] as string | undefined;
  const snapshotBuf: Buffer | null = (await (redis as any).getBuffer?.(keySnapshot)) ?? null;

  if (!snapshotBuf) {
    logger.warn("v2/bootstrap:snapshot:missing", { GAME_ID: gameId });
    return undefined;
  }

  try {
    const snapshot = decodeSnapshotBinary(snapshotBuf);
    const payload = mapSnapshotToJson(snapshot as any);
    const collectorStates = await readCollectorStatesByEntityIds(
      gameId,
      Array.isArray((payload as any)?.entities)
        ? (payload as any).entities.map((e: any) => e.id)
        : [],
    );
    if (Array.isArray((payload as any)?.entities)) {
      for (const entity of (payload as any).entities) {
        const state = collectorStates.get(String(entity?.id ?? ""));
        if (state) entity.collector_state = state;
      }
    }
    const entCount = Array.isArray((payload as any)?.entities) ? (payload as any).entities.length : 0;
    let concerningEntities = 0;
    let greatEntities = 0;
    if (Array.isArray((payload as any)?.entities)) {
      for (const s of (payload as any).entities) {
        const hasPos = !!s?.pos;
        const hasVel = !!s?.vel;
        if (hasPos && hasVel) greatEntities++; else concerningEntities++;
      }
    }
    logger.info("v2/bootstrap:snapshot", { GAME_ID: gameId, boundaryId: boundaryId || null, entCount, concerningEntities, greatEntities });
    await channel.write(
      sseFormat({ event: "snapshot", id: boundaryId || "0-0", data: payload })
    );
  } catch (e) {
    logErr("snapshot decode error", e);
    logger.error("v2/bootstrap:snapshot:error", { GAME_ID: gameId, error: (e as any)?.message || String(e) });
  }

  // Gap catch-up after boundary
  let nextStart = `(${boundaryId || "0-0"}`; // exclusive
  logger.info("v2/bootstrap:gap:start", { GAME_ID: gameId, from: nextStart, stream: streamEvents, batchCount: XRANGE_BATCH_COUNT });
  let firstGapLogged = false;
  let firstEmitCount = 0;
  while (!isClosed()) {
    const entries = await xRangeWithBuffers(streamEvents, nextStart, "+", XRANGE_BATCH_COUNT);
    if (!entries || entries.length === 0) break;
    if (!firstGapLogged) {
      const ids = entries.slice(0, 5).map((e) => e.id);
      const sizes = entries.slice(0, 5).map((e) => e.data?.length ?? 0);
      logger.debug("v2/bootstrap:gap:first-batch", { GAME_ID: gameId, count: entries.length, ids, sizes });
      firstGapLogged = true;
    }
    for (const ent of entries) {
      const id = ent.id;
      const dataBuf = ent.data;
      if (!dataBuf) continue;
      await emitEventFromBuffer(channel, id, dataBuf, (msg, e) => logErr(`${msg} (gap)`, e));
      if (firstEmitCount < 5) {
        firstEmitCount++;
        logger.debug("v2/bootstrap:emit:first", { GAME_ID: gameId, id, size: dataBuf.length });
      }
      lastId = id;
    }
    nextStart = `(${entries[entries.length - 1]!.id}`;
    if (entries.length < XRANGE_BATCH_COUNT) break; // drained
  }
  logger.info("v2/bootstrap:gap:complete", { GAME_ID: gameId, lastId: lastId || null });

  return lastId;
}
