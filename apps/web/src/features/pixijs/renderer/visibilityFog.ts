export type VisibilitySource = { x: number; y: number; range: number };

export function isWithinSensorRange(
  position: { x: number; y: number },
  sources: Iterable<VisibilitySource>,
): boolean {
  for (const source of sources) {
    const dx = source.x - position.x;
    const dy = source.y - position.y;
    if (dx * dx + dy * dy <= source.range * source.range) return true;
  }
  return false;
}

type PositionedEntity = {
  entity_type_id?: string;
  owner_player_id?: string;
  pos: { x: number; y: number };
};

export function getOwnedSensorSources(
  entities: Iterable<PositionedEntity>,
  playerId: string | null,
  getSensorRange: (entityTypeId: string) => number | undefined,
): VisibilitySource[] {
  if (!playerId) return [];
  return Array.from(entities).flatMap((entity) => {
    const range = getSensorRange(entity.entity_type_id ?? "") ?? 0;
    return entity.owner_player_id === playerId && Number.isFinite(range) && range > 0
      ? [{ x: entity.pos.x, y: entity.pos.y, range }]
      : [];
  });
}
