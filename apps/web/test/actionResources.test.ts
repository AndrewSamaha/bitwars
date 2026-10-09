import { describe, expect, it } from "vitest";
import { canAffordAction } from "@/features/hud/actionResources";
import type { Entity } from "@/features/gamestate/world";

const entityTypes = { habitat: { resource_sharing: { range: 4000 } } };
const actor: Entity = { id: 718, entity_type_id: "worker", owner_player_id: "me", pos: { x: 0, y: 0 }, resources: [{ resource_type: "energy", amount: 50 }] };
const habitat: Entity = { id: 680, entity_type_id: "habitat", owner_player_id: "me", pos: { x: 300, y: 0 }, resources: [{ resource_type: "energy", amount: 1000 }, { resource_type: "minerals", amount: 1000 }] };
const costs = { energy: 200, minerals: 200 };

describe("local action affordability", () => {
  it("allows building with local donor resources even when the actor cannot carry the full cost", () => {
    expect(canAffordAction("718", [actor, habitat], entityTypes, costs)).toBe(true);
  });

  it("cannot spend remote, hostile, or remembered inventory", () => {
    for (const donor of [
      { ...habitat, pos: { x: 4000.1, y: 0 } },
      { ...habitat, owner_player_id: "other" },
      { ...habitat, remembered: { last_seen_at: 1 } },
      { ...habitat, entity_type_id: "worker" },
    ]) {
      expect(canAffordAction("718", [actor, donor], entityTypes, costs)).toBe(false);
    }
  });

  it("uses each donor's range inclusively and requires every resource", () => {
    expect(canAffordAction("718", [actor, { ...habitat, pos: { x: 4000, y: 0 } }], entityTypes, costs)).toBe(true);
    expect(canAffordAction("718", [actor, { ...habitat, resources: [{ resource_type: "energy", amount: 100 }] }], entityTypes, costs)).toBe(false);
  });

  it("supports fractional costs without rounding and cannot authorize a missing actor", () => {
    expect(canAffordAction("718", [actor], entityTypes, { energy: 49.5 })).toBe(true);
    expect(canAffordAction("718", [actor], entityTypes, { energy: 50.01 })).toBe(false);
    expect(canAffordAction("missing", [habitat], entityTypes, costs)).toBe(false);
  });
});
