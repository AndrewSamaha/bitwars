import { describe, expect, it } from "vitest";
import type { EntityTypeDef } from "../src/features/content/contentManager";
import { CollectionPlanner, type PlanRequest, type RouteEntity } from "../src/features/collection-routing/planner";

const base: EntityTypeDef = { fog_memory: "retain_last_known", speed: 0, stop_radius: 0, mass: 1, health: 100 };
function fixture(): PlanRequest {
  return {
    workerId: 1, playerId: "me", assignment: { resourceTypeId: "minerals", nearestCompatible: false },
    definitions: {
      worker: { ...base, speed: 100, collector: { transport_rate_per_second: 8, collects: ["food", "minerals"] }, max_capacity: { minerals: 10, food: 10 } },
      minerals: { ...base, resource_node: { collection_mode: "transport", resource_type: "minerals" } },
      food: { ...base, resource_node: { collection_mode: "transport", resource_type: "food" } },
      habitat: { ...base, depot: true, max_capacity: { minerals: 100, food: 100 } },
      waypoint: base,
      star: { ...base, radiation_sources: [{ radiation_type: "heat", damage_per_second: 10, max_effective_distance: 1200 }] },
    },
    entities: [
      { id: 1, entity_type_id: "worker", owner_player_id: "me", pos: { x: -2000, y: 0 } },
      { id: 2, entity_type_id: "habitat", owner_player_id: "me", pos: { x: -2000, y: 0 } },
      { id: 3, entity_type_id: "minerals", pos: { x: 2000, y: 0 } },
    ],
  };
}
const star: RouteEntity = { id: 6, entity_type_id: "star", pos: { x: 0, y: 0 } };
const detour: RouteEntity[] = [
  { id: 4, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: -1000, y: 1400 } },
  { id: 5, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 1000, y: 1400 } },
];

describe("collection routing", () => {
  it("retains an unchanged collection contract when an unrelated depot moves or cargo phase changes", () => {
    const request = fixture();
    const planner = new CollectionPlanner();
    const first = planner.plan(request);
    if (first.kind !== "planned") throw new Error("Expected initial route");
    request.currentPlan = first.travelPlan;
    request.entities.push({ id: 20, entity_type_id: "habitat", owner_player_id: "me", pos: { x: 5000, y: 5000 } });
    request.entities[0]!.resources = [{ resource_type: "minerals", amount: 10 }];
    request.entities[0]!.collector_state = { activity: "moving_to_dropoff" };
    expect(planner.plan(request)).toEqual({ kind: "retained" });
    request.entities.at(-1)!.pos.x += 100;
    expect(planner.plan(request)).toEqual({ kind: "retained" });
  });
  it("replaces an unsafe active direct route after discovering a hazard and holds if its detour is lost", () => {
    const request = fixture();
    const planner = new CollectionPlanner();
    const first = planner.plan(request);
    if (first.kind !== "planned") throw new Error("Expected initial route");
    request.currentPlan = first.travelPlan;
    request.entities.push(star, ...detour.map(entity => ({ ...entity })));
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [4, 5] } });
    request.entities.find(entity => entity.id === 5)!.health = 0;
    expect(planner.plan(request).kind).toBe("blocked");
  });
  it("uses a safe direct segment without inventing waypoints", () => {
    expect(new CollectionPlanner().plan(fixture())).toEqual({ kind: "planned", travelPlan: {
      sourceEntityId: 3, depotEntityId: 2, waypointIds: [], initialWaypointIds: [], initialToDepot: false,
    } });
  });
  it("travels directly through known radiation when no local waypoint network exists", () => {
    const request = fixture();
    request.entities.push({ ...star, remembered: { last_seen_at: 1 } });
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [], initialWaypointIds: [] } });
  });
  it("ignores remote, foreign, destroyed, and remembered waypoints when enabling safe routing", () => {
    const request = fixture();
    request.entities.push(star,
      { ...detour[0]!, id: 10, pos: { x: 10000, y: 0 } },
      { ...detour[0]!, id: 11, owner_player_id: "enemy" },
      { ...detour[0]!, id: 12, health: 0 },
      { ...detour[0]!, id: 13, remembered: true });
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [], initialWaypointIds: [] } });
  });
  it("includes the corridor boundary and invalidates the network when the last local marker leaves", () => {
    const request = fixture();
    const marker = { ...detour[0]!, pos: { x: 0, y: 1500 } };
    request.entities.push({ ...star, remembered: true }, marker);
    const planner = new CollectionPlanner();
    expect(planner.plan(request).kind).toBe("blocked");
    marker.pos.y += 0.001;
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [] } });
  });
  it("widens the corridor to 25 percent of longer hub-resource trips", () => {
    const request = fixture();
    request.entities[0]!.pos.x = request.entities[1]!.pos.x = -4000;
    request.entities[2]!.pos.x = 4000;
    request.entities.push(star, { ...detour[0]!, pos: { x: 0, y: 2000 } });
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [4] } });
  });
  it("rejects safe detours exceeding 1.5 times direct distance", () => {
    const request = fixture();
    request.entities[0]!.pos.x = request.entities[1]!.pos.x = -500;
    request.entities[2]!.pos.x = 500;
    request.definitions.star!.radiation_sources![0]!.max_effective_distance = 100;
    const marker = { ...detour[0]!, pos: { x: 0, y: 550 } };
    request.entities.push(star, marker);
    const planner = new CollectionPlanner();
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [4] } });
    marker.pos.y = 570;
    expect(planner.plan(request)).toMatchObject({ kind: "blocked", reason: expect.stringContaining("1.5x") });
  });
  it("caps the initial approach independently of the recurring hub-resource route", () => {
    const request = fixture();
    request.entities.push(star, ...detour);
    request.entities[0]!.pos = { x: 0, y: -1400 };
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reason: expect.stringContaining("initial approach") });
  });
  it("uses owned waypoints in depot-to-source order, never foreign waypoint shortcuts", () => {
    const request = fixture();
    request.entities.push(star, ...detour);
    const planner = new CollectionPlanner();
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [4, 5], initialWaypointIds: [4, 5] } });
    request.entities = request.entities.map(entity => entity.id === 5 ? { ...entity, owner_player_id: "enemy" } : entity);
    expect(planner.plan(request).kind).toBe("blocked");
  });
  it("invalidates cached edges when a waypoint or radiation profile changes", () => {
    const request = fixture(); request.entities.push(star, ...detour.map(entity => ({ ...entity, pos: { ...entity.pos } })));
    const planner = new CollectionPlanner();
    expect(planner.plan(request).kind).toBe("planned");
    request.entities.find(entity => entity.id === 5)!.pos.y = 0;
    expect(planner.plan(request).kind).toBe("blocked");
    request.definitions.worker!.radiation_shielding = { heat: { damage_multiplier: 0 } };
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { waypointIds: [] } });
  });
  it("applies the shielding distance offset and conservative 100-unit margin", () => {
    const request = fixture(); request.entities.push({ ...star, pos: { x: 0, y: 1250 } }, detour[0]!);
    const planner = new CollectionPlanner();
    expect(planner.plan(request).kind).toBe("blocked");
    request.definitions.worker!.radiation_shielding = { heat: { distance_offset: 100, damage_multiplier: 0.5 } };
    expect(planner.plan(request).kind).toBe("planned");
  });
  it("plans the initial reverse leg for full cargo and continues gathering partial cargo", () => {
    const request = fixture(); request.entities.push(star, ...detour);
    request.entities[0]!.pos = { x: 2000, y: 0 };
    request.entities[0]!.resources = [{ resource_type: "minerals", amount: 10 }];
    const planner = new CollectionPlanner();
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { initialToDepot: true, initialWaypointIds: [5, 4] } });
    request.entities[0]!.resources[0]!.amount = 5;
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { initialToDepot: false, initialWaypointIds: [] } });
  });
  it("delivers incompatible cargo before collecting the newly assigned resource", () => {
    const request = fixture(); request.entities[0]!.resources = [{ resource_type: "food", amount: 2 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, initialToDepot: true } });
  });
  it("honors a manual depot without fallback, full capacity, and pinned endpoints", () => {
    const request = fixture(); request.entities[0]!.supply = { delivery_depot_id: 9 };
    expect(new CollectionPlanner().plan(request).kind).toBe("blocked");
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    expect(new CollectionPlanner().plan(request).kind).toBe("blocked");
    request.entities[1]!.resources = [];
    request.pinned = { sourceEntityId: 99, depotEntityId: 2 };
    expect(new CollectionPlanner().plan(request).kind).toBe("blocked");
  });
  it("resolves source distance ties by entity ID and ignores incompatible/depleted sources", () => {
    const request = fixture(); request.assignment = { nearestCompatible: true };
    request.entities.push({ id: 8, entity_type_id: "food", pos: { x: -6000, y: 0 } });
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3 } });
    request.entities[2]!.resource_deposit = { remaining: 0 };
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 8 } });
  });
  it("ignores fuel outside collects and follows server cargo preference rather than alphabetical resource order", () => {
    const request = fixture();
    request.definitions.worker!.max_capacity!.energy = 100;
    request.entities[0]!.resources = [{ resource_type: "energy", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { initialToDepot: false } });
    request.entities[0]!.resources.push({ resource_type: "food", amount: 2 }, { resource_type: "minerals", amount: 5 });
    request.entities[0]!.collector_state = { activity: "gathering", resource_type: "minerals" };
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, initialToDepot: false } });
  });
  it("leaves proximity collection unchanged", () => {
    const request = fixture(); request.definitions.worker!.collector!.transport_rate_per_second = 0; request.entities.push(star);
    expect(new CollectionPlanner().plan(request)).toEqual({ kind: "proximity" });
  });
});
