import { describe, expect, it } from "vitest";
import { transferableResourceAmount } from "@/features/hud/resourceInventory";

describe("transferable inventory", () => {
  it("shows shipment surplus without counting or exposing upkeep buffers as cargo", () => {
    const definition = { resource_reserves: { food: 5 } };
    for (const [food, expected] of [[50, 45], [5, 0], [3, 0]]) {
      const entity = { resources: [{ resource_type: "food", amount: food }] };
      expect(transferableResourceAmount(entity, definition, "food")).toBe(expected);
      expect(transferableResourceAmount(entity, undefined, "food")).toBe(food);
    }
    expect(transferableResourceAmount(undefined, definition, "food")).toBe(0);
  });
});
