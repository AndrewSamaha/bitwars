import type { EntityTypeDef } from "@/features/content/contentManager";
import type { Entity } from "@/features/gamestate/world";

/** Match the engine's actor inventory plus same-owner donors in each donor's sharing range. */
export function canAffordAction(
  actorId: string,
  entities: readonly Entity[],
  entityTypes: Record<string, Pick<EntityTypeDef, "resource_sharing">>,
  costs: Record<string, number>,
): boolean {
  const actor = entities.find((entity) => String(entity.id) === actorId);
  if (!actor?.owner_player_id || actor.remembered) return false;
  const donors = entities.filter((entity) => {
    if (entity.remembered || entity.owner_player_id !== actor.owner_player_id) return false;
    if (entity === actor) return true;
    if (!actor.pos || !entity.pos) return false;
    const range = entityTypes[entity.entity_type_id ?? ""]?.resource_sharing?.range;
    if (range === undefined) return false;
    const dx = entity.pos.x - actor.pos.x;
    const dy = entity.pos.y - actor.pos.y;
    return dx * dx + dy * dy <= range * range;
  });
  return Object.entries(costs).every(([resource, cost]) => {
    const available = donors.reduce((total, donor) =>
      total + (donor.resources?.find((entry) => entry.resource_type === resource)?.amount ?? 0), 0);
    return available + Number.EPSILON >= cost;
  });
}
