import type { EntityTypeDef } from "@/features/content/contentManager";
import type { Entity } from "@/features/gamestate/world";

type LogisticsDefinition = Pick<EntityTypeDef, "depot" | "depot_range" | "collector">;

const STORAGE_RESOURCE: Record<string, string> = {
  food_storage_container: "food",
  mineral_storage_container: "minerals",
};

function liveOwned(entity: Entity, owner: string): boolean {
  return entity.owner_player_id === owner && !entity.remembered && (entity.health === undefined || entity.health > 0);
}

function withinRange(entity: Entity, depot: Entity, range: number): boolean {
  if (!entity.pos || !depot.pos) return false;
  const dx = entity.pos.x - depot.pos.x;
  const dy = entity.pos.y - depot.pos.y;
  return dx * dx + dy * dy <= range * range;
}

/** A container is linked only to a living hub of the same owner within that hub's own radius. */
export function linkedStorageAmount(hub: Entity, resource: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>): number {
  if (resource !== "food" && resource !== "minerals") return 0;
  const range = entityTypes[hub.entity_type_id ?? ""]?.depot_range ?? 0;
  if (!hub.owner_player_id || !liveOwned(hub, hub.owner_player_id)
    || !entityTypes[hub.entity_type_id ?? ""]?.depot || STORAGE_RESOURCE[hub.entity_type_id ?? ""]) return 0;
  let amount = 0;
  for (const container of entities) {
    if (STORAGE_RESOURCE[container.entity_type_id ?? ""] !== resource
      || !entityTypes[container.entity_type_id ?? ""]?.depot
      || !liveOwned(container, hub.owner_player_id)
      || !withinRange(container, hub, range)) continue;
    amount += container.resources?.find(entry => entry.resource_type === resource)?.amount ?? 0;
  }
  return amount;
}

/** Physical inventory remains separate from the hub's spendable linked food/minerals. */
export function spendableResourceAmount(source: Entity, resource: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>): number {
  return (source.resources?.find(entry => entry.resource_type === resource)?.amount ?? 0)
    + linkedStorageAmount(source, resource, entities, entityTypes);
}

/** Prefer a hub over a container, preserving an eligible binding within the same class. */
export function actionResourceSource(actorId: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>): Entity | undefined {
  const actor = entities.find(e => String(e.id) === actorId);
  if (!actor?.owner_player_id || !liveOwned(actor, actor.owner_player_id)) return undefined;
  const def = entityTypes[actor.entity_type_id ?? ""];
  if (def?.depot) return actor;
  let boundHub: Entity | undefined;
  let nearestHub: Entity | undefined;
  let boundContainer: Entity | undefined;
  let nearestContainer: Entity | undefined;
  let hubDistance = Infinity;
  let containerDistance = Infinity;
  for (const candidate of entities) {
    if (!liveOwned(candidate, actor.owner_player_id) || !actor.pos || !candidate.pos) continue;
    const candidateDef = entityTypes[candidate.entity_type_id ?? ""];
    if (!candidateDef?.depot) continue;
    const dx = candidate.pos.x - actor.pos.x;
    const dy = candidate.pos.y - actor.pos.y;
    const distance = dx * dx + dy * dy;
    if (distance > (candidateDef.depot_range ?? 0) ** 2) continue;
    const bound = String(candidate.id) === String(actor.supply?.depot_id);
    if (STORAGE_RESOURCE[candidate.entity_type_id ?? ""]) {
      if (bound) boundContainer = candidate;
      if (distance < containerDistance || (distance === containerDistance && Number(candidate.id) < Number(nearestContainer?.id))) {
        nearestContainer = candidate;
        containerDistance = distance;
      }
    } else {
      if (bound) boundHub = candidate;
      if (distance < hubDistance || (distance === hubDistance && Number(candidate.id) < Number(nearestHub?.id))) {
        nearestHub = candidate;
        hubDistance = distance;
      }
    }
  }
  return boundHub ?? nearestHub ?? boundContainer ?? nearestContainer
    ?? ((def?.collector?.transport_rate_per_second ?? 0) > 0 ? actor : undefined);
}

export function canAffordAction(actorId: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>, costs: Record<string, number>): boolean {
  const actor = entities.find(e => String(e.id) === actorId);
  if (actor?.supply?.operational === false) return false;
  const source = actionResourceSource(actorId, entities, entityTypes);
  return Object.entries(costs).every(([resource, cost]) => (source ? spendableResourceAmount(source, resource, entities, entityTypes) : 0) + 1e-9 >= cost);
}
