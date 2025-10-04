import type { SseChannel } from "@/lib/db/utils/sse-channel";
import { sseFormat } from "@/lib/db/utils/sse";
import { mapDeltaToJson } from "@/lib/db/utils/protobuf";
import { EventsStreamRecordSchema } from "@bitwars/shared/gen/intent_pb";
import { fromBinary } from "@bufbuild/protobuf";

function bufferToEventsStreamRecord(buf: Buffer) {
  try {
    return fromBinary(EventsStreamRecordSchema, new Uint8Array(buf));
  } catch (err) {
    return undefined;
  }
}

export async function emitEventFromBuffer(
  channel: SseChannel,
  id: string,
  dataBuf: Buffer,
  logErr: (...args: any[]) => void
): Promise<void> {
  const record = bufferToEventsStreamRecord(dataBuf);
  if (!record || !record.record) {
    logErr("events record decode error", { id });
    return;
  }

  switch (record.record.case) {
    case "lifecycle": {
      const payload = {
        type: "lifecycle",
        intentId: Buffer.from(record.record.value.intentId ?? new Uint8Array()).toString("hex"),
        clientCmdId: Buffer.from(record.record.value.clientCmdId ?? new Uint8Array()).toString("hex"),
        playerId: record.record.value.playerId,
        serverTick: record.record.value.serverTick.toString(),
        state: record.record.value.state,
        reason: record.record.value.reason,
        protocolVersion: record.record.value.protocolVersion,
      };
      await channel.write(sseFormat({ event: "lifecycle", id, data: payload }));
      break;
    }
    case "delta": {
      const deltaJson = mapDeltaToJson(record.record.value as any);
      await channel.write(sseFormat({ event: "delta", id, data: deltaJson }));
      break;
    }
    default:
      logErr(`unsupported events record case ${record.record.case}`);
  }
}
