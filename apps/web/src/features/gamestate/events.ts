import type { Entity } from "./world";

/** Emitted after the client ECS has incorporated an authoritative state update. */
export const GAMESTATE_UPDATED_EVENT = "bitwars:gamestate-updated";
export const ENTITY_DESPAWN_EVENT = "bitwars:entity-despawn";

export type GameStateUpdatedDetail = { entityIds?: string[] };

export function dispatchGameStateUpdated(entityIds?: string[]) {
  window.dispatchEvent(
    new CustomEvent<GameStateUpdatedDetail>(GAMESTATE_UPDATED_EVENT, {
      detail: entityIds ? { entityIds } : undefined,
    }),
  );
}

/** Emitted immediately before a streamed entity is removed from the client world. */
export function dispatchEntityDespawn(entity: Entity) {
  window.dispatchEvent(new CustomEvent<Entity>(ENTITY_DESPAWN_EVENT, { detail: entity }));
}
