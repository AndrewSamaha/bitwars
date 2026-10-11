import type { EntityTypeDef } from "@/features/content/contentManager";
import type { Entity } from "@/features/gamestate/world";

export function transferableResourceAmount(
  entity: Entity | undefined,
  definition: Pick<EntityTypeDef, "resource_reserves"> | undefined,
  resource: string,
): number {
  const amount = entity?.resources?.find((entry) => entry.resource_type === resource)?.amount ?? 0;
  return Math.max(0, amount - (definition?.resource_reserves?.[resource] ?? 0));
}
