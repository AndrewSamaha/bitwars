import type { SseChannel } from "@/lib/db/utils/sse-channel";
import { sseFormat } from "@/lib/db/utils/sse";
import { mapDeltaToJson } from "@/lib/db/utils/protobuf";
import { EventsStreamRecordSchema } from "@bitwars/shared/gen/intent_pb";
import { fromBinary } from "@bufbuild/protobuf";
import { stringify as uuidStringify } from "uuid";
import type { VisibilityFilter } from "@/lib/db/utils/visibility";

function bufferToEventsStreamRecord(buf: Buffer) {
  try {
    return fromBinary(EventsStreamRecordSchema, new Uint8Array(buf));
  } catch (err) {
    return undefined;
  }
}

/**
 * Convert 16-byte UUID bytes to a dashed UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).
 * Returns empty string for missing/invalid input.
 *
 * CONVENTION: All UUID bytes crossing the SSE boundary must be serialised as
 * dashed UUID strings. See .cursor/rules/uuid-serialization.mdc
 */
function uuidBytesToString(bytes: Uint8Array | undefined): string {
  if (!bytes || bytes.length !== 16) return "";
  return uuidStringify(bytes);
}

export async function emitEventFromBuffer(
  channel: SseChannel,
  id: string,
  dataBuf: Buffer,
  logErr: (...args: any[]) => void,
  visibility?: VisibilityFilter,
): Promise<void> {
  const record = bufferToEventsStreamRecord(dataBuf);
  if (!record || !record.record) {
    logErr("events record decode error", { id });
    return;
  }

  switch (record.record.case) {
    case "lifecycle": {
      if (visibility && record.record.value.playerId !== visibility.playerId) break;
      const payload = {
        type: "lifecycle",
        intentId: uuidBytesToString(record.record.value.intentId),
        clientCmdId: uuidBytesToString(record.record.value.clientCmdId),
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
      const filtered = visibility ? visibility.filterDelta(deltaJson) : deltaJson;
      if (filtered) await channel.write(sseFormat({ event: "delta", id, data: filtered }));
      break;
    }
    case "laserShot": {
      const shot = record.record.value;
      const payload = {
        type: "laser_shot",
        attacker_id: shot.attackerId.toString(),
        target_id: shot.targetId.toString(),
        origin: shot.origin ? { x: shot.origin.x, y: shot.origin.y } : undefined,
        target: shot.target ? { x: shot.target.x, y: shot.target.y } : undefined,
        server_tick: shot.serverTick.toString(),
      };
      if (!visibility || (payload.origin && visibility.isPositionVisible(payload.origin)) || (payload.target && visibility.isPositionVisible(payload.target))) {
        await channel.write(sseFormat({ event: "laser-shot", id, data: payload }));
      }
      break;
    }
    default:
      logErr(`unsupported events record case ${record.record.case}`);
  }
}
