import { describe, expect, it } from "vitest";
import {
  addResourceChange,
  RESOURCE_TREND_WINDOW,
  resourceChanges,
} from "@/features/hud/resourceChanges";

describe("resource changes", () => {
  it("reports gains and losses without treating newly loaded resources as gains", () => {
    expect(
      resourceChanges(
        { energy: 10, food: 8 },
        { energy: 13, food: 6, minerals: 20 },
      ),
    ).toEqual({
      energy: 3,
      food: -2,
      minerals: 0,
    });
  });

  it("keeps a change visible until it ages out of the trend window", () => {
    let trend = addResourceChange([], 10);
    for (let update = 1; update < RESOURCE_TREND_WINDOW; update += 1) {
      trend = addResourceChange(trend.changes, 0);
    }
    expect(trend.average).toBe(1);

    trend = addResourceChange(trend.changes, 0);
    expect(trend.average).toBe(0);
  });
});
