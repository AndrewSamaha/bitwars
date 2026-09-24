/** The sprite scale used by the live game renderer. */
export function gameEntityScale(entityScale = 1, visualScale = 1) {
  return entityScale * visualScale / 2;
}
