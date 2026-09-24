import { describe, expect, it } from "vitest";
import { gameEntityScale, gameScreenEntityScale } from "../src/features/pixijs/renderer/entityScale";

describe("gameEntityScale", () => {
  it("matches the live entity and visual scale rule", () => {
    expect(gameEntityScale()).toBe(0.5);
    expect(gameEntityScale(2, 4)).toBe(4);
    expect(gameScreenEntityScale(2, 4)).toBe(2);
  });
});
