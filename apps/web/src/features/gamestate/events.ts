/** Emitted after the client ECS has incorporated an authoritative state update. */
export const GAMESTATE_UPDATED_EVENT = "bitwars:gamestate-updated";

export type GameStateUpdatedDetail = { entityIds?: string[] };

export function dispatchGameStateUpdated(entityIds?: string[]) {
  window.dispatchEvent(
    new CustomEvent<GameStateUpdatedDetail>(GAMESTATE_UPDATED_EVENT, {
      detail: entityIds ? { entityIds } : undefined,
    }),
  );
}
