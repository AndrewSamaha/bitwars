export const DEFAULT_PRIMARY_OPACITY = 0.5;
export const DEFAULT_SECONDARY_OPACITY = 0.5;

export function isPlayerColorOpacity(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

/** Primary coverage is removed before either color's opacity is applied. */
export function secondaryCoverageAlpha(spriteAlpha: number, primaryMaskAlpha: number): number {
  return Math.max(0, spriteAlpha - primaryMaskAlpha);
}
