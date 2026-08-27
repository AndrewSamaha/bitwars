import { describe, expect, it } from "vitest";
import { spreadMoveTargets } from "@/features/pixijs/utils/moveTargets";

describe("spreadMoveTargets", () => {
  it("keeps every selected hull from overlapping", () => {
    const radii = [12, 50, 18, 16, 10];
    const targets = spreadMoveTargets({ x: 100, y: 200 }, radii);

    for (let a = 0; a < targets.length; a++) for (let b = a + 1; b < targets.length; b++) {
      expect(Math.hypot(targets[a]!.x - targets[b]!.x, targets[a]!.y - targets[b]!.y))
        .toBeGreaterThan(radii[a]! + radii[b]!);
    }
  });
});
