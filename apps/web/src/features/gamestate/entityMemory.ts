import type { World } from "miniplex";
import type { RememberedEntity } from "./minimapMemory";
import type { Entity } from "./world";

/** Project server knowledge into the world without replacing a currently visible entity. */
export function reconcileRememberedEntity(
  world: World<Entity>,
  byId: Map<string, Entity>,
  id: string | number,
  observation: RememberedEntity | undefined,
  fogMemory: string | undefined,
  hidden = false,
) {
  const key = String(id);
  const existing = byId.get(key);
  if (existing && !existing.remembered && !hidden) return;
  if (!observation || fogMemory !== "retain_last_known") {
    if (existing) {
      world.remove(existing);
      byId.delete(key);
    }
    return;
  }
  if (existing) {
    // Preserve UI references, but never retain hidden live state or movement/actions.
    if (!existing.remembered) {
      for (const component of [
        "vel", "health", "supply", "resources", "resource_deposit", "collector_state",
        "combat_effect_state", "radiation_damage_last_at", "radiation_shed_started_at",
        "active_intent_kind", "active_intent_id", "active_intent_started_tick",
        "active_intent_move_target", "selectable",
      ] as const) world.removeComponent(existing, component);
    }
    existing.entity_type_id = observation.entity_type_id;
    existing.owner_player_id = observation.owner_player_id;
    existing.pos = { ...observation.pos };
    world.addComponent(existing, "remembered", { ...observation.remembered });
    return;
  }
  const entity: Entity = {
    id: observation.id,
    entity_type_id: observation.entity_type_id,
    owner_player_id: observation.owner_player_id,
    pos: { ...observation.pos },
    remembered: { ...observation.remembered },
  };
  world.add(entity);
  byId.set(key, entity);
}
