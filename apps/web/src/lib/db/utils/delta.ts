import type { SseChannel } from "@/lib/db/utils/sse-channel";
import { sseFormat } from "@/lib/db/utils/sse";
import { mapDeltaToJson } from "@/lib/db/utils/protobuf";
import { EventsStreamRecordSchema } from "@bitwars/shared/gen/intent_pb";
import { fromBinary } from "@bufbuild/protobuf";
import { stringify as uuidStringify } from "uuid";
import type { VisibilityFilter } from "@/lib/db/utils/visibility";

export type ProgressDelivery = {
  source_time_ms: number;
  sent_at_ms: number;
  server_tick: number;
};

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

export async function emitBuildProgressBatch(
  channel: SseChannel,
  id: string | undefined,
  batch: Record<string, unknown>,
  playerId?: string,
  force = false,
  onDelivery?: (delivery: ProgressDelivery) => void,
): Promise<number> {
  if (batch.type !== "build-progress") return 0;
  if (!playerId) return 0;
  const recipients = Array.isArray(batch.recipients) ? batch.recipients : [];
  if (!force && !recipients.includes(playerId)) return 0;
  const states = Array.isArray(batch.states) ? batch.states : [];
  const build_state_by_entity: Record<string, unknown> = {};
  for (const value of states) {
    if (!value || typeof value !== "object") continue;
    const state = value as Record<string, unknown>;
    if (state.owner_player_id !== playerId) continue;
    const entityId = Number(state.entity_id);
    if (!Number.isSafeInteger(entityId) || entityId <= 0) continue;
    build_state_by_entity[String(entityId)] = {
      blueprint_id: state.blueprint_id,
      progress: state.progress,
      progress_updated_at_unix_ms: state.progress_updated_at_unix_ms,
    };
  }
  const frame = sseFormat({ event: "build-progress", id, data: {
    type: "build-progress",
    run_id: batch.run_id,
    server_tick: batch.server_tick,
    server_time_ms: batch.server_time_ms,
    build_state_by_entity,
  } });
  await channel.write(frame);
  if (onDelivery) {
    const sourceTimeMs = Number(batch.server_time_ms);
    const serverTick = Number(batch.server_tick);
    if (Number.isFinite(sourceTimeMs) && Number.isSafeInteger(serverTick)) {
      onDelivery({ source_time_ms: sourceTimeMs, sent_at_ms: Date.now(), server_tick: serverTick });
    }
  }
  return Buffer.byteLength(frame);
}

export async function emitEventFromBuffer(
  channel: SseChannel,
  id: string,
  dataBuf: Buffer,
  logErr: (...args: any[]) => void,
  visibility?: VisibilityFilter,
  progressPlayerId?: string,
  onProgressDelivery?: (delivery: ProgressDelivery) => void,
): Promise<number> {
  // Engine control markers share the durable stream with protobuf game events.
  if (dataBuf[0] === 123) {
    try {
      const marker = JSON.parse(dataBuf.toString());
      if (marker.type === "world-reset") await channel.write(sseFormat({ event: "world-reset", id, data: marker }));
      if (marker.type === "build-progress") return await emitBuildProgressBatch(channel, id, marker, progressPlayerId, false, onProgressDelivery);
    } catch (error) { logErr("control marker decode error", error); }
    return 0;
  }
  const record = bufferToEventsStreamRecord(dataBuf);
  if (!record || !record.record) {
    logErr("events record decode error", { id });
    return 0;
  }

  switch (record.record.case) {
    case "lifecycle": {
      if (visibility && record.record.value.playerId !== visibility.playerId) break;
      const payload = {
        type: "lifecycle",
        entityId: record.record.value.entityId.toString(),
        intentId: uuidBytesToString(record.record.value.intentId),
        clientCmdId: uuidBytesToString(record.record.value.clientCmdId),
        playerId: record.record.value.playerId,
        serverTick: record.record.value.serverTick.toString(),
        state: record.record.value.state,
        reason: record.record.value.reason,
        protocolVersion: record.record.value.protocolVersion,
        minimumDistanceViolation: record.record.value.minimumDistanceViolation
          ? {
              blockingEntityId: record.record.value.minimumDistanceViolation.blockingEntityId.toString(),
              requiredDistance: record.record.value.minimumDistanceViolation.requiredDistance,
              actualDistance: record.record.value.minimumDistanceViolation.actualDistance,
            }
          : undefined,
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
  return 0;
}
