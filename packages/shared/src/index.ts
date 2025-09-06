// packages/shared/src/index.ts
export * as proto_entity from "./gen/entity_pb";
export * as proto_snapshot from "./gen/snapshot_pb";

// usage:
// import { proto_entity } from "@bitwars/shared";
// const e: proto_entity.Entity = ...

export type EntityId = string;

export interface Position { x: number; y: number; }
export interface Health { hp: number; max: number; }

export interface Unit {
  id: EntityId;
  pos: Position;
  health: Health;
  // add more common components here
}
