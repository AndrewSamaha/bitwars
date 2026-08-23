import { describe, expect, it, vi } from "vitest";
import type { Graphics } from "pixi.js";
import { drawBuildArc } from "@/features/hud/graphics/hoverIndicator";

function graphics() {
  const result = {
    clear: vi.fn(),
    circle: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
  };
  result.circle.mockReturnValue(result);
  result.arc.mockReturnValue(result);
  return result;
}

describe("drawBuildArc", () => {
  it("draws a half circle at 50% progress", () => {
    const result = graphics();
    drawBuildArc(result as unknown as Graphics, 0.5);
    expect(result.arc).toHaveBeenCalledWith(0, 0, 190, -Math.PI / 2, Math.PI / 2);
  });

  it("draws a complete circle at 100% progress", () => {
    const result = graphics();
    drawBuildArc(result as unknown as Graphics, 1);
    expect(result.circle).toHaveBeenCalledWith(0, 0, 190);
  });
});
