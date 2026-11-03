import { describe, expect, it } from "vitest";
import { collectionCapacityStatus } from "../src/features/gamestate/events";

describe("collection capacity", () => {
  const capacities = { minerals: 50, food: 50, energy: 50 };

  it("allows an empty or partial requested resource despite full unrelated stores", () => {
    const supplies = [{ resource_type: "food", amount: 50 }, { resource_type: "energy", amount: 60 }];
    expect(collectionCapacityStatus(supplies, capacities, "minerals")).toBe("available");
    expect(collectionCapacityStatus([...supplies, { resource_type: "minerals", amount: 49 }], capacities, "minerals")).toBe("available");
    expect(collectionCapacityStatus(undefined, capacities, "minerals")).toBe("available");
  });

  it.each([50, 60])("marks requested minerals at %i as full independently of other stores", (amount) => {
    expect(collectionCapacityStatus([{ resource_type: "minerals", amount }], capacities, "minerals")).toBe("full");
    expect(collectionCapacityStatus([{ resource_type: "minerals", amount }], capacities, "food")).toBe("available");
  });

  it("distinguishes missing or zero capacity from full usable storage", () => {
    expect(collectionCapacityStatus(undefined, { minerals: 0 }, "minerals")).toBe("unavailable");
    expect(collectionCapacityStatus([{ resource_type: "minerals", amount: 10 }], { minerals: 0 }, "minerals")).toBe("unavailable");
    expect(collectionCapacityStatus(undefined, { food: 50 }, "minerals")).toBe("unavailable");
  });
});
