import { describe, expect, it } from "vitest";
import { transferableResourceAmount } from "@/features/hud/resourceInventory";

describe("transferable inventory", () => {
  it("makes all cargo transferable and ignores deprecated reserves", () => {
    const definition = { resource_reserves: { food: 5 } };
    for (const [food, expected] of [[50, 50], [5, 5], [3, 3]]) {
      const entity = { resources: [{ resource_type: "food", amount: food }] };
      expect(transferableResourceAmount(entity, definition, "food")).toBe(expected);
      expect(transferableResourceAmount(entity, undefined, "food")).toBe(food);
    }
    expect(transferableResourceAmount(undefined, definition, "food")).toBe(0);
  });
});
