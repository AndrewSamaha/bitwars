import { type Graphics } from "pixi.js";
import type { EntityTypeDef } from "@/features/content/contentManager";

export type RadiationSource = NonNullable<EntityTypeDef["radiation_sources"]>[number];

function parseHexColor(value: string | undefined): number | undefined {
  const hex = value?.trim().replace(/^#/, "");
  if (!hex || !/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return undefined;
  const expanded = hex.length === 3 ? [...hex].map((digit) => `${digit}${digit}`).join("") : hex;
  return Number.parseInt(expanded, 16);
}

/** Draw the radiation bands exactly as they appear in the game world. */
export function drawRadiationRanges(
  graphics: Graphics,
  sources: readonly RadiationSource[] | undefined,
  x: number,
  y: number,
) {
  if (!sources?.length) return;

  for (const source of sources) {
    const ranges = [
      {
        radius: source.max_effective_distance,
        borderColor: source.max_effective_distance_border_color,
        fillColor: source.max_effective_distance_fill_color,
      },
      {
        radius: source.full_damage_distance,
        borderColor: source.full_damage_distance_border_color,
        fillColor: source.full_damage_distance_fill_color,
      },
      {
        radius: source.min_effective_distance,
        borderColor: source.min_effective_distance_border_color,
        fillColor: source.min_effective_distance_fill_color,
      },
    ]
      .filter((range) => Number.isFinite(range.radius) && (range.borderColor || range.fillColor))
      .sort((a, b) => (b.radius ?? 0) - (a.radius ?? 0));

    for (const range of ranges) {
      const radius = range.radius ?? 0;
      const fillColor = parseHexColor(range.fillColor);
      const borderColor = parseHexColor(range.borderColor);
      if (radius <= 0 || (fillColor === undefined && borderColor === undefined)) continue;

      graphics.circle(x, y, radius);
      if (fillColor !== undefined) graphics.fill({ color: fillColor, alpha: 0.12 });
      if (borderColor !== undefined) graphics.stroke({ width: 2, color: borderColor, alpha: 0.7 });
    }
  }
}
