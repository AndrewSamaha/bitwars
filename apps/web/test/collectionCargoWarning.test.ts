import { expect, it } from "vitest";
import { hasFullIncompatibleCargo } from "../src/features/gamestate/events";

it("warns on full or over-capacity incompatible cargo, not partial or compatible cargo", () => {
  const capacities = { minerals: 50, food: 50 };
  const cargo = (resource_type: string, amount: number) => [{ resource_type, amount }];
  expect(hasFullIncompatibleCargo(cargo("minerals", 50), capacities, "food")).toBe(true);
  expect(hasFullIncompatibleCargo(cargo("minerals", 60), capacities, "food")).toBe(true);
  expect(hasFullIncompatibleCargo(cargo("minerals", 49), capacities, "food")).toBe(false);
  expect(hasFullIncompatibleCargo(cargo("food", 50), capacities, "food")).toBe(false);
  expect(hasFullIncompatibleCargo(cargo("energy", 50), capacities, "food")).toBe(false);
  expect(hasFullIncompatibleCargo(undefined, capacities, "food")).toBe(false);
  expect(hasFullIncompatibleCargo(cargo("minerals", 0), { minerals: 0 }, "food")).toBe(false);
});
