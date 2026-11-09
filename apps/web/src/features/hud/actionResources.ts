import type { EntityTypeDef } from "@/features/content/contentManager";
import type { Entity } from "@/features/gamestate/world";

type LogisticsDefinition = Pick<EntityTypeDef, "depot" | "depot_range" | "collector" | "shareable_with_hub">;

export function isHubDepot(definition: LogisticsDefinition | undefined): boolean {
  return !!definition?.depot && !definition.shareable_with_hub?.length;
}

function liveOwned(entity: Entity, owner: string): boolean {
  return entity.owner_player_id === owner && !entity.remembered && (entity.health === undefined || entity.health > 0);
}

function withinRange(entity: Entity, depot: Entity, range: number): boolean {
  if (!entity.pos || !depot.pos) return false;
  const dx = entity.pos.x - depot.pos.x;
  const dy = entity.pos.y - depot.pos.y;
  return dx * dx + dy * dy <= range * range;
}

/** A storage depot is linked only to a living hub of the same owner within that hub's own radius. */
export function linkedStorageAmount(hub: Entity, resource: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>): number {
  const hubDefinition = entityTypes[hub.entity_type_id ?? ""];
  const range = hubDefinition?.depot_range ?? 0;
  if (!hub.owner_player_id || !liveOwned(hub, hub.owner_player_id) || !isHubDepot(hubDefinition)) return 0;
  let amount = 0;
  for (const container of entities) {
    const containerDefinition = entityTypes[container.entity_type_id ?? ""];
    if (!containerDefinition?.depot || !containerDefinition.shareable_with_hub?.includes(resource)
      || !liveOwned(container, hub.owner_player_id)
      || !withinRange(container, hub, range)) continue;
    amount += container.resources?.find(entry => entry.resource_type === resource)?.amount ?? 0;
  }
  return amount;
}

/** Physical inventory remains separate from the hub's spendable linked storage. */
export function spendableResourceAmount(source: Entity, resource: string, entities: readonly Entity[], entityTypes: Record<string, LogisticsDefinition>): number {
  return (source.resources?.find(entry => entry.resource_type === resource)?.amount ?? 0)
    + linkedStorageAmount(source, resource, entities, entityTypes);
}

/** Include configured resources and any additional stock or shareable resources visible locally. */
export function resourceDisplayKeys(
  source: Entity | undefined,
  entities: readonly Entity[],
  entityTypes: Record<string, LogisticsDefinition>,
  resourceTypes: Record<string, { order?: number }>,
): string[] {
  const keys = new Set(Object.keys(resourceTypes));
  for (const stock of source?.resources ?? []) keys.add(stock.resource_type);
  if (source && isHubDepot(entityTypes[source.entity_type_id ?? ""])) {
    for (const storage of entities) {
      const definition = entityTypes[storage.entity_type_id ?? ""];
      if (!definition?.depot || !definition.shareable_with_hub?.length || !source.owner_player_id
        || !liveOwned(storage, source.owner_player_id)
        || !withinRange(storage, source, entityTypes[source.entity_type_id ?? ""]?.depot_range ?? 0)) continue;
      for (const resource of definition.shareable_with_hub) keys.add(resource);
    }
  }
  return [...keys].sort((a, b) => (resourceTypes[a]?.order ?? Number.MAX_SAFE_INTEGER)
    - (resourceTypes[b]?.order ?? Number.MAX_SAFE_INTEGER) || a.localeCompare(b));
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
    if (!isHubDepot(candidateDef)) {
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
