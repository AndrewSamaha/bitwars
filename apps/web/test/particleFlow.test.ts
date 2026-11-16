import { expect, it } from "vitest";
import { Graphics } from "pixi.js";
import { drawEnemyHalo, resolveParticleFlowEffects, shouldDrawEnemyHalo } from "@/features/pixijs/effects/particle_flow";
import type { Entity } from "@/features/gamestate/world";

it.each([
  ["collector_solar", "proximity_collecting", "energy", "star_yellow"],
  ["worker", "gathering", "minerals", "minerals"],
])("keeps simultaneous %s flows distinct in the world overlay", (type, activity, resource, sourceType) => {
  const source: Entity = { id: 1, entity_type_id: sourceType, pos: { x: 0, y: 0 } };
  const world = { entities: () => [source], getEntityType: (id: string) => id === "collector_solar" ? { collector: { vfx: "solar_proximity" as const } } : id === "worker" ? { collector: { vfx: "mineral_transport" as const } } : undefined };
  const collectors: Entity[] = [2, 3].map((id) => ({
    id,
    entity_type_id: type,
    pos: { x: id * 100, y: 0 },
    collector_state: {
      activity, resource_type: resource,
      effective_rate_per_second: 10,
    },
  }));
  const effects = collectors.flatMap((entity) => resolveParticleFlowEffects(entity, world));
  expect(effects).toHaveLength(2);
  expect(new Set(effects.map((effect) => effect.key)).size).toBe(2);
  expect(effects.map((effect) => effect.targetWorldPos.x)).toEqual([200, 300]);
});

it("renders repair activity as a green flow to the target", () => {
  const target: Entity = { id: 9, entity_type_id: "habitat", pos: { x: 10, y: 20 } };
  const worker: Entity = {
    id: 2,
    entity_type_id: "worker",
    pos: { x: 0, y: 0 },
    combat_effect_state: { activity: "repairing", target_id: 9, attack_id: "repair" },
  };
  const [effect] = resolveParticleFlowEffects(worker, {
    entities: () => [worker, target],
    getEntityType: () => undefined,
  });
  expect(effect?.key).toBe("repair-flow:2:9");
  expect(effect?.color).toBe(0x22_c5_5e);
  expect(effect?.targetWorldPos).toEqual(target.pos);
});

it("shows the red enemy halo only at the minimap's 1024-unit scale", () => {
  const enemy: Entity = { id: 42, entity_type_id: "worker", owner_player_id: "opponent", pos: { x: 0, y: 0 } };
  expect(shouldDrawEnemyHalo(enemy, "player", 512, true)).toBe(false);
  expect(shouldDrawEnemyHalo(enemy, "player", 1024, true)).toBe(true);
  expect(shouldDrawEnemyHalo(enemy, "player", 2048, true)).toBe(true);
  expect(shouldDrawEnemyHalo({ ...enemy, owner_player_id: "raiders" }, "player", 1024, true)).toBe(true);
  expect(shouldDrawEnemyHalo({ ...enemy, owner_player_id: "player" }, "player", 1024, true)).toBe(false);
  expect(shouldDrawEnemyHalo({ ...enemy, owner_player_id: "universe" }, "player", 1024, true)).toBe(false);
  expect(shouldDrawEnemyHalo({ ...enemy, remembered: { last_seen_tick: 10 } }, "player", 1024, true)).toBe(false);
  expect(shouldDrawEnemyHalo(enemy, null, 1024, true)).toBe(false);
  expect(shouldDrawEnemyHalo(enemy, "player", 1024, false)).toBe(false);
});

it("renders the hostile pulse red at three times the collector halo's size", () => {
  const halo = new Graphics();
  drawEnemyHalo(halo, 0);
  expect(halo.context.instructions.map(({ data }) => typeof data.style === "number" ? data.style : data.style.color)).toEqual([
    0xef_44_44, 0xff_8a_65, 0xff_d0_c4, 0xff_8a_65,
  ]);
  expect(halo.getLocalBounds().width).toBe(504);
});

it.each(["collector_solar", "collector_solar_v2"])("shows %s transmission only for actual production", (kind) => {
  const depot: Entity = { id: 1453, entity_type_id: "habitat", pos: { x: 100, y: 0 } };
  const collector: Entity = { id: 1393, entity_type_id: kind, pos: { x: 0, y: 0 },
    collector_state: { activity: "proximity_collecting", resource_type: "energy",
      effective_rate_per_second: 3, receiving_entity_id: 1453 } };
  const world = { entities: () => [depot], getEntityType: () => ({ collector: { vfx: "solar_proximity" as const } }) };
  const transmissions = () => resolveParticleFlowEffects(collector, world).filter(e => e.key.startsWith("solar-transmission"));
  expect(transmissions()[0]?.targetWorldPos).toEqual(depot.pos);
  collector.collector_state!.effective_rate_per_second = 0;
  expect(transmissions()).toHaveLength(0);
  collector.collector_state!.activity = "waiting_for_depot_capacity";
  expect(transmissions()).toHaveLength(0);
});
