import type { EntityTypeDef } from "@/features/content/contentManager";
import type { Entity } from "@/features/gamestate/world";

type LogisticsDefinition = Pick<EntityTypeDef, "depot" | "depot_range" | "collector">;

/** One stable depot, or a carrier's own cargo outside depot coverage. */
export function actionResourceSource(actorId: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>): Entity | undefined {
  const actor = entities.find(e => String(e.id) === actorId);
  if (!actor?.owner_player_id || actor.remembered || (actor.health !== undefined && actor.health <= 0)) return undefined;
  const def = entityTypes[actor.entity_type_id ?? ""];
  if (def?.depot) return actor;
  const eligible = entities.filter(e => {
    if (e.remembered || e.owner_player_id !== actor.owner_player_id || (e.health !== undefined && e.health <= 0) || !actor.pos || !e.pos) return false;
    const d = entityTypes[e.entity_type_id ?? ""];
    return d?.depot && Math.hypot(e.pos.x-actor.pos.x,e.pos.y-actor.pos.y) <= (d.depot_range ?? 0);
  });
  const bound = eligible.find(e => String(e.id) === String(actor.supply?.depot_id));
  const nearest = eligible.sort((a,b) => {
    const distance = (e: Entity) => Math.hypot(e.pos!.x-actor.pos!.x,e.pos!.y-actor.pos!.y);
    return distance(a)-distance(b) || Number(a.id)-Number(b.id);
  })[0];
  return bound ?? nearest ?? ((def?.collector?.transport_rate_per_second ?? 0) > 0 ? actor : undefined);
}

export function canAffordAction(actorId: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>, costs: Record<string, number>): boolean {
  const actor = entities.find(e => String(e.id) === actorId);
  if (actor?.supply?.operational === false) return false;
  const source = actionResourceSource(actorId, entities, entityTypes);
  return Object.entries(costs).every(([resource,cost]) => (source?.resources?.find(e => e.resource_type === resource)?.amount ?? 0) + 1e-9 >= cost);
}
