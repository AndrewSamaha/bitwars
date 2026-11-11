import { describe, expect, it } from "vitest";
import type { EntityTypeDef } from "../src/features/content/contentManager";
import { CollectionPlanner, MovePlanner, type PlanRequest, type RouteEntity } from "../src/features/collection-routing/planner";

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

function groupFixture(): PlanRequest {
  const request = fixture();
  request.definitions.hub = { ...base, depot: true, depot_range: 1000, max_capacity: { minerals: 100, food: 100 } };
  request.definitions.storage = { ...base, depot: true, depot_range: 2000, shareable_with_hub: ["minerals"], max_capacity: { minerals: 100, food: 100 } };
  request.entities[1]!.entity_type_id = "hub";
  request.entities.push(
    { id: 10, entity_type_id: "storage", owner_player_id: "me", pos: { x: -1800, y: 0 } },
    { id: 11, entity_type_id: "storage", owner_player_id: "me", pos: { x: -1900, y: 0 } },
  );
  return request;
}

describe("user Move routing", () => {
  it("uses owned corridor waypoints to detour around remembered radiation", () => {
    const request = fixture();
    request.entities.push({ ...star, remembered: true }, ...detour);
    expect(new MovePlanner().plan({
      entityId: 1, playerId: "me", entities: request.entities, definitions: request.definitions,
      start: { x: -2000, y: 0 }, target: { x: 2000, y: 0 },
    })).toEqual({ kind: "planned", via: [detour[0]!.pos, detour[1]!.pos] });
  });
  it("keeps direct Move when safe or when no owned local waypoint network exists", () => {
    const request = fixture();
    const move = { entityId: 1, playerId: "me", entities: request.entities, definitions: request.definitions,
      start: { x: -2000, y: 0 }, target: { x: 2000, y: 0 } };
    const planner = new MovePlanner();
    expect(planner.plan(move)).toEqual({ kind: "planned", via: [] });
    request.entities.push(star, { ...detour[0]!, owner_player_id: "enemy" });
    expect(planner.plan(move)).toEqual({ kind: "planned", via: [] });
    request.entities.push(detour[0]!, detour[1]!);
    request.definitions.worker!.radiation_shielding = { heat: { damage_multiplier: 0 } };
    expect(planner.plan(move)).toEqual({ kind: "planned", via: [] });
  });
  it("blocks unsafe Move when a local network cannot supply a short safe detour", () => {
    const request = fixture();
    request.entities.push(star, detour[0]!);
    const result = new MovePlanner().plan({
      entityId: 1, playerId: "me", entities: request.entities, definitions: request.definitions,
      start: { x: -2000, y: 0 }, target: { x: 2000, y: 0 },
    });
    expect(result).toMatchObject({ kind: "blocked", reason: expect.stringContaining("1.5x") });
  });
});

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
    request.entities.push({ ...star, remembered: { last_seen_tick: 1 } });
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
  it.each([2, 10, 15])("retains %i food while collecting minerals even when food dropoff storage is full", (food) => {
    const request = fixture();
    request.definitions.worker!.max_capacity!.energy = 50;
    request.entities[0]!.resources = [{ resource_type: "food", amount: food }, { resource_type: "energy", amount: 50 }];
    request.entities[1]!.resources = [{ resource_type: "food", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, initialToDepot: false } });
  });
  it.each(["moving_to_dropoff", "delivering", "waiting_for_dropoff"])("ignores stale %s food state after assigning minerals", (activity) => {
    const request = fixture();
    request.entities[0]!.resources = [{ resource_type: "food", amount: 10 }, { resource_type: "minerals", amount: 2 }];
    request.entities[0]!.collector_state = { activity, resource_type: "food" };
    request.entities[1]!.resources = [{ resource_type: "food", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, initialToDepot: false } });
    request.entities[0]!.collector_state.resource_type = "minerals";
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { initialToDepot: true } });
  });
  it.each([10, 15])("delivers %i requested minerals without needing food dropoff capacity", (minerals) => {
    const request = fixture();
    request.entities[0]!.resources = [{ resource_type: "food", amount: 10 }, { resource_type: "minerals", amount: minerals }];
    request.entities[1]!.resources = [{ resource_type: "food", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, depotEntityId: 2, initialToDepot: true } });
  });
  it.each([0, undefined])("blocks an explicit resource with %s capacity even with existing cargo", (capacity) => {
    const request = fixture();
    if (capacity === undefined) delete request.definitions.worker!.max_capacity!.minerals;
    else request.definitions.worker!.max_capacity!.minerals = capacity;
    request.entities[0]!.resources = [{ resource_type: "minerals", amount: 2 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "no_capacity", resourceTypeId: "minerals" });
    request.entities[0]!.resources = [];
    expect(new CollectionPlanner().plan(request).kind).toBe("blocked");
  });
  it("skips zero-capacity resources and their stale cargo for nearest-compatible collection", () => {
    const request = fixture();
    request.assignment = { nearestCompatible: true };
    request.definitions.worker!.max_capacity!.food = 0;
    request.entities[0]!.resources = [{ resource_type: "food", amount: 5 }];
    request.entities[0]!.collector_state = { activity: "delivering", resource_type: "food" };
    request.entities.push({ id: 8, entity_type_id: "food", pos: { x: -2000, y: 0 } });
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, initialToDepot: false } });
    request.definitions.worker!.max_capacity!.minerals = 0;
    expect(new CollectionPlanner().plan(request).kind).toBe("blocked");
  });
  it("keeps manual standalone assignment waiting at a full depot and pins only the source", () => {
    const request = fixture(); request.entities[0]!.supply = { delivery_depot_id: 9 };
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "assigned_depot_unavailable", sourceEntityId: 3, depotEntityId: 9 });
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    const planner = new CollectionPlanner();
    const result = planner.plan(request);
    expect(result).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 3, depotEntityId: 2 } });
    if (result.kind !== "planned") throw new Error("Expected waiting route");
    request.currentPlan = result.travelPlan;
    expect(planner.plan(request)).toEqual({ kind: "retained" });
    request.pinned = { sourceEntityId: 99 };
    expect(planner.plan(request)).toMatchObject({ kind: "blocked", reasonCode: "source_unavailable", resourceTypeId: "minerals", sourceEntityId: 99 });
  });
  it("breaks equal-distance failover ties by depot ID", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 11)!.pos = { x: -1800, y: 0 };
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 10 } });
  });
  it("fails over from a full hub to mineral-sharing storage without changing the assignment", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.pinned = { sourceEntityId: 3 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 11 } });
    expect(request.entities[0]!.supply!.delivery_depot_id).toBe(2);
  });
  it("keeps the reverse waypoint itinerary when full cargo fails over to linked storage", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[0]!.pos = { x: 2000, y: 0 };
    request.entities[0]!.resources = [{ resource_type: "minerals", amount: 10 }];
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.push(star, ...detour);
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: {
      depotEntityId: 10, initialToDepot: true, waypointIds: [4, 5], initialWaypointIds: [5, 4],
    } });
  });
  it("uses the assigned full container's hub and keeps a current destination while it has room", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 10, depot_id: 2 };
    request.entities.find(entity => entity.id === 10)!.resources = [{ resource_type: "minerals", amount: 100 }];
    const planner = new CollectionPlanner();
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 2 } });
    request.currentPlan = { sourceEntityId: 3, depotEntityId: 2, waypointIds: [], initialWaypointIds: [], initialToDepot: false };
    expect(planner.plan(request)).toEqual({ kind: "retained" });
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    expect(planner.plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 11 } });
  });
  it("accepts its assigned container even if that container is not shareable with its hub", () => {
    const request = groupFixture();
    request.definitions.storage!.shareable_with_hub = ["food"];
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities[0]!.supply = { delivery_depot_id: 10 };
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 10 } });
    request.entities[1]!.resources = [];
    request.entities.find(entity => entity.id === 10)!.resources = [{ resource_type: "minerals", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 2 } });
  });
  it("uses only same-owner, in-range, resource-sharing depots from the anchor's hub", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 10)!.owner_player_id = "enemy";
    request.entities.find(entity => entity.id === 11)!.pos.x = -500;
    request.entities.push({ id: 12, entity_type_id: "storage", owner_player_id: "me", pos: { x: -1900, y: 0 } });
    request.definitions.storage!.shareable_with_hub = ["food"];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 2 } });
    request.definitions.storage!.shareable_with_hub = ["minerals"];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 12 } });
  });
  it("chooses the nearest covering hub to a container, preferring the worker's hub", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 10, depot_id: 20 };
    request.entities.find(entity => entity.id === 10)!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.push(
      { id: 20, entity_type_id: "hub", owner_player_id: "me", pos: { x: -1700, y: 0 } },
      { id: 21, entity_type_id: "storage", owner_player_id: "me", pos: { x: -900, y: 0 } },
    );
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 11)!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 20)!.resources = [{ resource_type: "minerals", amount: 100 }];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 21 } });
    request.entities[0]!.supply!.depot_id = 2;
    request.entities.find(entity => entity.id === 11)!.resources = [];
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 11 } });
  });
  it("distinguishes incompatible from full groups and retains an accepted waiting route", () => {
    const request = groupFixture(); request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.definitions.hub!.max_capacity!.minerals = 0;
    request.definitions.storage!.max_capacity!.minerals = 0;
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "assigned_depot_unavailable", depotEntityId: 2 });
    request.definitions.storage!.max_capacity!.minerals = 100;
    for (const depot of request.entities.filter(entity => entity.entity_type_id === "storage")) {
      depot.resources = [{ resource_type: "minerals", amount: 100 }];
    }
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "depot_group_full", depotEntityId: 2 });
    request.definitions.hub!.max_capacity!.minerals = 100;
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    const planner = new CollectionPlanner();
    const result = planner.plan(request);
    expect(result).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 2 } });
    if (result.kind !== "planned") throw new Error("Expected waiting route");
    request.currentPlan = result.travelPlan;
    expect(planner.plan(request)).toEqual({ kind: "retained" });
  });
  it("rejects a destroyed or foreign explicit anchor rather than crossing to other depots", () => {
    const request = groupFixture(); request.entities[0]!.supply = { delivery_depot_id: 10 };
    request.entities.find(entity => entity.id === 10)!.health = 0;
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "assigned_depot_unavailable", depotEntityId: 10 });
    request.entities.find(entity => entity.id === 10)!.health = 100;
    request.entities.find(entity => entity.id === 10)!.owner_player_id = "enemy";
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "assigned_depot_unavailable", depotEntityId: 10 });
    request.entities.find(entity => entity.id === 10)!.owner_player_id = "me";
    request.entities.find(entity => entity.id === 10)!.pos.x = NaN;
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "blocked", reasonCode: "assigned_depot_unavailable", depotEntityId: 10 });
  });
  it("skips the nearest depot's unsafe route when another group destination has a safe route", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[0]!.pos = { x: 2000, y: 0 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 11)!.pos = { x: -1700, y: 0 };
    request.entities.find(entity => entity.id === 10)!.pos = { x: -1800, y: 700 };
    request.definitions.star!.radiation_sources![0]!.max_effective_distance = 300;
    request.entities.push({ ...star, pos: { x: -1700, y: 0 } },
      { id: 30, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 0, y: 400 } });
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { depotEntityId: 10, waypointIds: [] } });
  });
  it("keeps a safe accepted full depot when open alternatives have unsafe routes", () => {
    const request = groupFixture();
    request.entities[0]!.supply = { delivery_depot_id: 2 };
    request.entities[0]!.pos = { x: 2000, y: 0 };
    request.entities[1]!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 10)!.resources = [{ resource_type: "minerals", amount: 100 }];
    request.entities.find(entity => entity.id === 11)!.pos = { x: -1700, y: 700 };
    request.currentPlan = { sourceEntityId: 3, depotEntityId: 2, waypointIds: [], initialWaypointIds: [], initialToDepot: false };
    request.definitions.star!.radiation_sources![0]!.max_effective_distance = 300;
    request.entities.push({ ...star, pos: { x: -1700, y: 700 } },
      { id: 30, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 0, y: 400 } });
    expect(new CollectionPlanner().plan(request)).toEqual({ kind: "retained" });
  });
  it("identifies a depleted pinned source even when another discovered source remains viable", () => {
    const request = fixture();
    request.entities.push({ id: 8, entity_type_id: "minerals", pos: { x: 3000, y: 0 }, resource_deposit: { remaining: 100 } });
    request.entities[2]!.resource_deposit = { remaining: 0 };
    request.pinned = { sourceEntityId: 3 };
    expect(new CollectionPlanner().plan(request)).toMatchObject({
      kind: "blocked", reasonCode: "source_unavailable", resourceTypeId: "minerals", sourceEntityId: 3,
    });
    request.pinned = undefined;
    expect(new CollectionPlanner().plan(request)).toMatchObject({ kind: "planned", travelPlan: { sourceEntityId: 8 } });
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
