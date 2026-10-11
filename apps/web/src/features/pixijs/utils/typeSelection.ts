import type { Entity } from "@/features/gamestate/world";

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/** Select current, owned entities whose sprites intersect the viewport. */
export function selectEntitiesOfTypeInView(
  candidates: Iterable<{ entity: Entity; bounds: Bounds }>,
  entityTypeId: string,
  playerId: string,
  viewport: { width: number; height: number },
): string[] {
  const ids: string[] = [];
  for (const { entity, bounds } of candidates) {
    if (entity.id === undefined || entity.remembered || entity.owner_player_id !== playerId
      || entity.entity_type_id !== entityTypeId) continue;
    if (bounds.maxX >= 0 && bounds.minX <= viewport.width
      && bounds.maxY >= 0 && bounds.minY <= viewport.height) ids.push(String(entity.id));
  }
  return ids;
}
