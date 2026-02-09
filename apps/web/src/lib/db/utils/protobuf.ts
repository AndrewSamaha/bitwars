import { type Delta } from "@bitwars/shared/gen/delta_pb";
import { type Snapshot } from "@bitwars/shared/gen/snapshot_pb";

// Helpers to convert protobuf-es messages into compact, client-friendly JSON
export const biToNumOrStr = (v: bigint): number | string => {
  const num = Number(v);
  return Number.isSafeInteger(num) ? num : v.toString();
};

// Entity has entity_type_id (proto field 2); TS codegen may use camelCase
export const mapDeltaToJson = (d: Delta) => ({
  type: "delta" as const,
  tick: biToNumOrStr(d.tick),
  updates: (d.updates ?? []).map((u) => ({
    id: biToNumOrStr(u.id),
    ...(u.pos ? { pos: { x: u.pos.x, y: u.pos.y } } : {}),
    ...(u.vel ? { vel: { x: u.vel.x, y: u.vel.y } } : {}),
    ...(u.force ? { force: { x: u.force.x, y: u.force.y } } : {}),
  })),
});

export const mapSnapshotToJson = (s: Snapshot) => ({
  type: "snapshot" as const,
  tick: biToNumOrStr(s.tick),
  entities: (s.entities ?? []).map((e) => {
    const eAny = e as { entityTypeId?: string };
    return {
      id: biToNumOrStr(e.id),
      ...(eAny.entityTypeId ? { entity_type_id: eAny.entityTypeId } : {}),
      ...(e.pos ? { pos: { x: e.pos.x, y: e.pos.y } } : {}),
      ...(e.vel ? { vel: { x: e.vel.x, y: e.vel.y } } : {}),
      ...(e.force ? { force: { x: e.force.x, y: e.force.y } } : {}),
    };
  }),
});