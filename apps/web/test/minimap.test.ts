import { describe, expect, it } from "vitest";
import { minimapOffsetToWorld, worldToMinimapOffset } from "@/features/pixijs/utils/minimap";

describe("minimap projection", () => {
  it("inverts the Poincare distance compression", () => {
    const offset = worldToMinimapOffset(18_000, -24_000, 0, 0, 100, 45_000);
    const world = minimapOffsetToWorld(offset.x, offset.y, 100, 45_000);
    expect(world.x).toBeCloseTo(18_000);
    expect(world.y).toBeCloseTo(-24_000);
  });
});
