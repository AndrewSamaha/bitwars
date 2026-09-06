import { expect, it } from "vitest";
import { resolveParticleFlowEffects } from "@/features/pixijs/effects/particle_flow";
import type { Entity } from "@/features/gamestate/world";

it.each([
  ["collector_solar", "proximity_collecting", "energy", "star_yellow"],
  ["worker", "gathering", "minerals", "minerals"],
])("keeps simultaneous %s flows distinct in the world overlay", (type, activity, resource, sourceType) => {
  const source: Entity = { id: 1, entity_type_id: sourceType, pos: { x: 0, y: 0 } };
  const world = { entities: () => [source], getEntityType: () => undefined };
  const collectors: Entity[] = [2, 3].map((id) => ({
    id,
    entity_type_id: type,
    pos: { x: id * 100, y: 0 },
    collector_state: {
      activity, resource_type: resource,
      carry_amount: 0, carry_capacity: 0, effective_rate_per_second: 10,
    },
  }));
  const effects = collectors.flatMap((entity) => resolveParticleFlowEffects(entity, world));
  expect(effects).toHaveLength(2);
  expect(new Set(effects.map((effect) => effect.key)).size).toBe(2);
  expect(effects.map((effect) => effect.targetWorldPos.x)).toEqual([200, 300]);
});
