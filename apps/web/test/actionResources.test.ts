import { describe, expect, it } from "vitest";
import { actionResourceSource, canAffordAction, linkedStorageAmount, spendableResourceAmount } from "@/features/hud/actionResources";
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
      { ...habitat, remembered: { last_seen_tick: 1 } },
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

const storageTypes = {
  ...entityTypes,
  processor: { depot: true, depot_range: 2000 },
  planet_blue_inhabitated: { depot: true, depot_range: 4000 },
  food_storage_container: { depot: true, depot_range: 2000 },
  mineral_storage_container: { depot: true, depot_range: 2000 },
};
const hub: Entity = {
  id: 10, entity_type_id: "processor", owner_player_id: "me", pos: { x: 0, y: 0 },
  resources: [{ resource_type: "food", amount: 5 }, { resource_type: "minerals", amount: 10 }, { resource_type: "energy", amount: 9 }],
};
const foodStorage: Entity = {
  id: 11, entity_type_id: "food_storage_container", owner_player_id: "me", pos: { x: 100, y: 0 },
  resources: [{ resource_type: "food", amount: 30 }, { resource_type: "minerals", amount: 600 }, { resource_type: "energy", amount: 600 }],
};
const mineralStorage: Entity = {
  id: 12, entity_type_id: "mineral_storage_container", owner_player_id: "me", pos: { x: 200, y: 0 },
  resources: [{ resource_type: "food", amount: 600 }, { resource_type: "minerals", amount: 40 }, { resource_type: "energy", amount: 600 }],
};
const worker: Entity = { ...actor, id: 13, pos: { x: 300, y: 0 }, resources: [] };

describe.each(["processor", "planet_blue_inhabitated"] as const)("%s linked storage", hubType => {
  const mainHub = { ...hub, entity_type_id: hubType };

  it("spends linked food and minerals without transferring physical stock, ignoring other container resources", () => {
    const entities = [mainHub, foodStorage, mineralStorage, worker];
    expect(actionResourceSource("13", entities, storageTypes)).toBe(mainHub);
    expect(mainHub.resources?.find(r => r.resource_type === "food")?.amount).toBe(5);
    expect(linkedStorageAmount(mainHub, "food", entities, storageTypes)).toBe(30);
    expect(spendableResourceAmount(mainHub, "minerals", entities, storageTypes)).toBe(50);
    expect(canAffordAction("13", entities, storageTypes, { food: 35, minerals: 50, energy: 9 })).toBe(true);
    expect(canAffordAction("13", entities, storageTypes, { food: 36 })).toBe(false);
    expect(canAffordAction("13", entities, storageTypes, { minerals: 51 })).toBe(false);
    expect(canAffordAction("13", entities, storageTypes, { energy: 10 })).toBe(false);
  });

  it("uses the hub radius inclusively, not the storage container's radius or a chain", () => {
    const radius = storageTypes[hubType].depot_range;
    const edge = { ...foodStorage, pos: { x: radius, y: 0 } };
    expect(canAffordAction("13", [mainHub, edge, worker], storageTypes, { food: 35 })).toBe(true);
    expect(canAffordAction("13", [mainHub, { ...edge, pos: { x: radius + 0.1, y: 0 } }, worker], storageTypes, { food: 35 })).toBe(false);
    const remoteWorker = { ...worker, pos: { x: radius + 2500, y: 0 }, supply: { depot_id: 10, missing_resources: [], operational: true, waiting_for: "" } };
    expect(canAffordAction("13", [mainHub, foodStorage, remoteWorker], storageTypes, { food: 1 })).toBe(false);
    const remoteHub = { ...mainHub, id: 14, pos: { x: radius + 200, y: 0 }, resources: [] };
    expect(canAffordAction("14", [mainHub, foodStorage, remoteHub], storageTypes, { food: 1 })).toBe(false);
  });

  it("does not link dead, remembered, hostile, or non-depot containers", () => {
    for (const container of [
      { ...foodStorage, health: 0 },
      { ...foodStorage, remembered: { last_seen_tick: 1 } },
      { ...foodStorage, owner_player_id: "enemy" },
      { ...foodStorage, entity_type_id: "worker" },
    ]) {
      expect(canAffordAction("13", [mainHub, container, worker], storageTypes, { food: 6 })).toBe(false);
    }
    expect(actionResourceSource("13", [{ ...mainHub, health: 0 }, foodStorage, worker], storageTypes)?.id).toBe(11);
    expect(canAffordAction("13", [{ ...mainHub, health: 0 }, foodStorage, worker], storageTypes, { food: 30 })).toBe(true);
    expect(canAffordAction("13", [{ ...mainHub, remembered: { last_seen_tick: 1 } }, foodStorage, worker], storageTypes, { food: 31 })).toBe(false);
  });
});

it("prefers a hub over a closer or stale-bound container, but retains an eligible bound hub", () => {
  const bound = { ...worker, supply: { depot_id: 11, missing_resources: [], operational: true, waiting_for: "" } };
  expect(actionResourceSource("13", [bound, foodStorage, hub], storageTypes)?.id).toBe(10);
  const farHub = { ...hub, id: 15, pos: { x: 1000, y: 0 }, resources: [] };
  const boundHub = { ...bound, supply: { ...bound.supply!, depot_id: 15 } };
  expect(actionResourceSource("13", [boundHub, hub, farHub, foodStorage], storageTypes)?.id).toBe(15);
  expect(canAffordAction("13", [boundHub, hub, farHub, foodStorage], storageTypes, { food: 35 })).toBe(false);
  expect(actionResourceSource("13", [bound, foodStorage], storageTypes)?.id).toBe(11);
});

it("retains direct container spending beyond all hub coverage without importing unrelated depots", () => {
  const distantContainer = { ...foodStorage, pos: { x: 5000, y: 0 } };
  const distantWorker = { ...worker, pos: { x: 5001, y: 0 } };
  expect(actionResourceSource("13", [hub, distantContainer, distantWorker], storageTypes)?.id).toBe(11);
  expect(canAffordAction("13", [hub, distantContainer, distantWorker], storageTypes, { food: 30 })).toBe(true);
  expect(canAffordAction("13", [hub, distantContainer, distantWorker], storageTypes, { food: 31 })).toBe(false);
  expect(canAffordAction("11", [hub, distantContainer], storageTypes, { food: 30 })).toBe(true);
});
