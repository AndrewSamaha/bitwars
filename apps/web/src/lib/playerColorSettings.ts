export const DEFAULT_PRIMARY_OPACITY = 0.5;
export const DEFAULT_SECONDARY_OPACITY = 0.5;
export const DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD = 0.25;
export const MAX_SECONDARY_BRIGHTNESS_THRESHOLD = 0.85;
const SECONDARY_BRIGHTNESS_FEATHER = 0.15;

export function isPlayerColorOpacity(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function isSecondaryBrightnessThreshold(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_SECONDARY_BRIGHTNESS_THRESHOLD;
}

/** Invariant coverage remains untinted, even when it intersects another mask. */
export function tintableSpriteAlpha(spriteAlpha: number, invariantMaskAlpha: number): number {
  return Math.max(0, spriteAlpha - Math.min(spriteAlpha, invariantMaskAlpha));
}

/** Primary coverage is removed before either color's opacity is applied. */
export function secondaryCoverageAlpha(spriteAlpha: number, primaryMaskAlpha: number, brightness: number, threshold: number): number {
  const availableAlpha = Math.max(0, spriteAlpha - primaryMaskAlpha);
  if (threshold === 0) return availableAlpha;
  const position = Math.max(0, Math.min(1, (brightness / 255 - threshold) / SECONDARY_BRIGHTNESS_FEATHER));
  const brightnessWeight = position * position * (3 - 2 * position);
  return Math.round(availableAlpha * brightnessWeight);
}
