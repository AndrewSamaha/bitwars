import type { Entity } from "./world";

/** Emitted after the client ECS has incorporated an authoritative state update. */
export const GAMESTATE_UPDATED_EVENT = "bitwars:gamestate-updated";
export const ENTITY_EXPLODED_EVENT = "bitwars:entity-exploded";
export const ENTITY_DETECTED_EVENT = "bitwars:entity-detected";

export type GameStateUpdatedDetail = { entityIds?: string[] };

export function dispatchGameStateUpdated(entityIds?: string[]) {
  window.dispatchEvent(
    new CustomEvent<GameStateUpdatedDetail>(GAMESTATE_UPDATED_EVENT, {
      detail: entityIds ? { entityIds } : undefined,
    }),
  );
}

/** Emitted when an authoritative removal should be presented as an entity explosion. */
export function dispatchEntityExploded(entity: Entity) {
  window.dispatchEvent(new CustomEvent<Entity>(ENTITY_EXPLODED_EVENT, { detail: entity }));
}

/** Emitted when a non-owned entity enters this client's sensor coverage. */
export function dispatchEntityDetected(entity: Entity) {
  if (!entity.pos) return;
  window.dispatchEvent(new CustomEvent<Entity>(ENTITY_DETECTED_EVENT, { detail: entity }));
}
