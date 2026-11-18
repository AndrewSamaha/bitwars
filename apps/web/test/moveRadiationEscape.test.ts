import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { expect, it } from "vitest";
import type { EntityTypeDef } from "../src/features/content/contentManager";
import { MovePlanner, type MovePlanRequest } from "../src/features/collection-routing/planner";

const definitions = parse(readFileSync(new URL("../../../packages/content/entities.yaml", import.meta.url), "utf8")).entity_types as Record<string, EntityTypeDef>;
function fixture(type = "battleship", x = 600): MovePlanRequest {
  return { entityId: 1, playerId: "me", start: { x, y: 0 }, target: { x: 2200, y: 0 }, definitions: structuredClone(definitions), entities: [
    { id: 1, entity_type_id: type, owner_player_id: "me", pos: { x, y: 0 } },
    { id: 2, entity_type_id: "star_yellow", pos: { x: 0, y: 0 } },
    { id: 3, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 700, y: 0 } },
  ] };
}
const direct = { kind: "planned", via: [] };
it.each(["battleship", "fighter_v1", "heavy_fighter"])("escapes real solar radiation with zero safe initial edges: %s", type => {
  const request = fixture(type);
  expect(definitions[type]).toBeDefined();
  expect(definitions[type]!.radiation_shielding).toBeUndefined();
  expect(new MovePlanner().plan(request)).toEqual(direct);
});
it.each([1199, 1200, 1250, 1300])("allows escape at radius %s including conservative padding", x => {
  expect(new MovePlanner().plan(fixture("battleship", x))).toEqual(direct);
});
it("escapes without waypoints and with a network exceeding stretch", () => {
  const request = fixture();
  request.entities.pop();
  expect(new MovePlanner().plan(request)).toEqual(direct);
  request.entities.push({ id: 3, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 1400, y: 1400 } });
  request.target = { x: 1400, y: 0 };
  expect(new MovePlanner().plan(request)).toEqual(direct);
});
it("accepts an across-center escape even though it initially moves inward", () => {
  const request = fixture();
  request.target = { x: -2200, y: 0 };
  expect(new MovePlanner().plan(request)).toEqual(direct);
});
it("accepts escape from overlapping hazards with opposing initial radial vectors", () => {
  const request = fixture();
  request.entities.push({ id: 4, entity_type_id: "star_yellow", pos: { x: 1200, y: 0 } });
  request.target = { x: 3000, y: 0 };
  expect(new MovePlanner().plan(request)).toEqual(direct);
});
it("prefers safe onward waypoint routing around another hazard", () => {
  const request = fixture("battleship", 1000);
  request.target = { x: 5000, y: 0 };
  request.entities.push({ id: 4, entity_type_id: "star_yellow", pos: { x: 2500, y: 0 } });
  request.entities.push(...[1500, 3500].map((x, i) => ({ id: 5 + i, entity_type_id: "waypoint", owner_player_id: "me", pos: { x, y: 1400 } })));
  expect(new MovePlanner().plan(request)).toEqual({ kind: "planned", via: [{ x: 1500, y: 1400 }, { x: 3500, y: 1400 }] });
});
it("preserves outside-start blocking, full shielding, offset boundaries and inner safe cores", () => {
  const request = fixture("battleship", 1400);
  request.target = { x: -2200, y: 0 };
  expect(new MovePlanner().plan(request).kind).toBe("blocked");
  request.definitions.battleship!.radiation_shielding = { stellar_heat: { damage_multiplier: 0 } };
  expect(new MovePlanner().plan(request)).toEqual(direct);
  request.start.x = 1000;
  request.definitions.battleship!.radiation_shielding = { stellar_heat: { distance_offset: 400, damage_multiplier: 0.5 } };
  expect(new MovePlanner().plan(request).kind).toBe("blocked");
  request.start.x = 900;
  expect(new MovePlanner().plan(request)).toEqual(direct);
  request.definitions.battleship!.radiation_shielding = undefined;
  request.definitions.star_yellow!.radiation_sources![0]!.min_effective_distance = 1200;
  request.start.x = 600;
  expect(new MovePlanner().plan(request).kind).toBe("blocked");
  request.target = { x: 800, y: 0 };
  expect(new MovePlanner().plan(request)).toEqual(direct);
});
it("allows partial outward progress but does not relax inward movement within an annulus", () => {
  const request = fixture();
  request.target.x = 800;
  expect(new MovePlanner().plan(request)).toEqual(direct);
  request.target.x = 400;
  expect(new MovePlanner().plan(request).kind).toBe("blocked");
});
