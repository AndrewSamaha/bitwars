export * as proto_entity from "./gen/entity_pb";
export * as proto_snapshot from "./gen/snapshot_pb";
export type EntityId = string;
export interface Position {
    x: number;
    y: number;
}
export interface Health {
    hp: number;
    max: number;
}
export interface Unit {
    id: EntityId;
    pos: Position;
    health: Health;
}
//# sourceMappingURL=index.d.ts.map