export const GAME_WORLD_SCALE = 0.5;

/** The sprite scale used by the live game renderer. */
export function gameEntityScale(entityScale = 1, visualScale = 1) {
  return entityScale * visualScale / 2;
}

/** The sprite scale after the live game's world transform. */
export function gameScreenEntityScale(entityScale = 1, visualScale = 1) {
  return GAME_WORLD_SCALE * gameEntityScale(entityScale, visualScale);
}
