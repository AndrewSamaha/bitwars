import { decodeDeltaBinary } from "@/lib/db/utils/binary-encoding";
import { mapDeltaToJson } from "@/lib/db/utils/protobuf";
import { sseFormat } from "@/lib/db/utils/sse";
import type { SseChannel } from "@/lib/db/utils/sse-channel";

export async function emitDeltaFromBuffer(
  channel: SseChannel,
  id: string,
  dataBuf: Buffer,
  logErr: (...args: any[]) => void
): Promise<void> {
  try {
    const delta = decodeDeltaBinary(dataBuf);
    const payload = mapDeltaToJson(delta as any);
    if ((payload as any)?.tick !== undefined && (payload as any)?.updates !== undefined) {
      if (((payload as any).tick === 0 || (payload as any).tick === "0") && (payload as any).updates.length === 0) {
        logErr("decoded empty delta — likely schema mismatch; did you run gen:ts? wrong GAME_ID?");
      }
    }
    await channel.write(sseFormat({ event: "delta", id, data: payload }));
  } catch (e) {
    logErr("delta decode error", e);
  }
}
