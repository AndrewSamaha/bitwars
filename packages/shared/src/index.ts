export type EntityId = string;

export interface Position { x: number; y: number; }
export interface Health { hp: number; max: number; }

export interface Unit {
  id: EntityId;
  pos: Position;
  health: Health;
  // add more common components here
}
