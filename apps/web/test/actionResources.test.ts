import { describe, expect, it } from "vitest";
import { canAffordAction } from "@/features/hud/actionResources";
import type { Entity } from "@/features/gamestate/world";

const entityTypes = { habitat: { depot: true, depot_range: 4000 }, worker: { collector: { transport_rate_per_second: 8 } } };
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

  it("uses the depot's range inclusively and requires every resource", () => {
    expect(canAffordAction("718", [actor, { ...habitat, pos: { x: 4000, y: 0 } }], entityTypes, costs)).toBe(true);
    expect(canAffordAction("718", [actor, { ...habitat, resources: [{ resource_type: "energy", amount: 100 }] }], entityTypes, costs)).toBe(false);
  });

  it("supports fractional costs without rounding and cannot authorize a missing actor", () => {
    expect(canAffordAction("718", [actor], entityTypes, { energy: 49.5 })).toBe(true);
    expect(canAffordAction("718", [actor], entityTypes, { energy: 50.01 })).toBe(false);
    expect(canAffordAction("missing", [habitat], entityTypes, costs)).toBe(false);
  });
});

it("never combines depot stock with carrier cargo or other depots", () => {
  const empty = { ...habitat, resources: [{resource_type: "energy", amount: 150}] };
  expect(canAffordAction("718", [actor, empty], entityTypes, { energy: 200 })).toBe(false);
  expect(canAffordAction("718", [actor, empty, {...habitat,id: 999,pos:{x:350,y:0}}], entityTypes, costs)).toBe(false);
});
it("retains its assigned empty depot when a closer stocked depot appears", () => {
  const assigned = {...actor,supply:{depot_id:680,operational:true,waiting_for:"",missing_resources:[]}};
  expect(canAffordAction("718", [assigned,{...habitat, resources:[]},{...habitat,id: 999,pos:{x:1,y:0}}], entityTypes, costs)).toBe(false);
});
