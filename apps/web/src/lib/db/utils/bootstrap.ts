import { redis } from "@/lib/db/connection";
import { decodeSnapshotBinary } from "@/lib/db/utils/binary-encoding";
import { mapSnapshotToJson } from "@/lib/db/utils/protobuf";
import { sseFormat } from "@/lib/db/utils/sse";
import type { SseChannel } from "@/lib/db/utils/sse-channel";
import { xRangeWithBuffers } from "@/lib/db/utils/redis-streams";
import { emitDeltaFromBuffer } from "@/lib/db/utils/delta";

const XRANGE_BATCH_COUNT = 512;

export async function bootstrapAndCatchUp(
  gameId: string,
  channel: SseChannel,
  isClosed: () => boolean,
  logErr: (...args: any[]) => void
): Promise<string | undefined> {
  const keySnapshot = `snapshot:${gameId}`;
  const keySnapshotMeta = `snapshot_meta:${gameId}`;
  const streamDeltas = `deltas:${gameId}`;

  let lastId: string | undefined = undefined;

  const meta = await (redis as any).hgetall(keySnapshotMeta);
  const boundaryId = meta?.["boundary_stream_id"] as string | undefined;
  const snapshotBuf: Buffer | null = (await (redis as any).getBuffer?.(keySnapshot)) ?? null;

  if (!snapshotBuf) {
    return undefined;
  }

  try {
    const snapshot = decodeSnapshotBinary(snapshotBuf);
    const payload = mapSnapshotToJson(snapshot as any);
    await channel.write(
      sseFormat({ event: "snapshot", id: boundaryId || "0-0", data: payload })
    );
  } catch (e) {
    logErr("snapshot decode error", e);
  }

  // Gap catch-up after boundary
  let nextStart = `(${boundaryId || "0-0"}`; // exclusive
  while (!isClosed()) {
    const entries = await xRangeWithBuffers(streamDeltas, nextStart, "+", XRANGE_BATCH_COUNT);
    if (!entries || entries.length === 0) break;
    for (const ent of entries) {
      const id = ent.id;
      const dataBuf = ent.data;
      if (!dataBuf) continue;
      await emitDeltaFromBuffer(channel, id, dataBuf, (msg, e) => logErr(`${msg} (gap)`, e));
      lastId = id;
    }
    nextStart = `(${entries[entries.length - 1]!.id}`;
    if (entries.length < XRANGE_BATCH_COUNT) break; // drained
  }

  return lastId;
}
