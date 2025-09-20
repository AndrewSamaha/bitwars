import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import { fromBinary } from "@bufbuild/protobuf";

export function decodeSnapshotBinary(buf: Buffer) {
  const msg = fromBinary(SnapshotSchema, new Uint8Array(buf));
  if (typeof msg.tick !== "bigint") {
    console.warn("[sse] snapshot.tick not bigint — schema/runtime mismatch?", typeof msg.tick);
  }
  if (!Array.isArray(msg.entities)) {
    console.warn("[sse] snapshot.entities not array — schema/runtime mismatch?");
  }
  return msg;
}

export function decodeDeltaBinary(buf: Buffer) {
  const msg = fromBinary(DeltaSchema, new Uint8Array(buf));
  if (typeof msg.tick !== "bigint") {
    console.warn("[sse] delta.tick not bigint — schema/runtime mismatch?", typeof msg.tick);
  }
  if (!Array.isArray(msg.updates)) {
    console.warn("[sse] delta.updates not array — schema/runtime mismatch?");
  }
  return msg;
}