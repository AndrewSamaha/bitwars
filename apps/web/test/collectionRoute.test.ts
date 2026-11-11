import { expect, it } from "vitest";
import { drawCollectionRoute } from "../src/features/pixijs/renderer/collectionRoute";

const plan = { sourceEntityId: 3, depotEntityId: 2, waypointIds: [4, 5], initialWaypointIds: [6], initialToDepot: false };

it("draws a collection circuit through waypoints in both engine traversal directions", () => {
  const path: Array<[number, number]> = [];
  const graphics = {
    moveTo(x: number, y: number) { path.push([x, y]); return this; },
    lineTo(x: number, y: number) { path.push([x, y]); return this; },
    circle() { return this; },
    stroke() { return this; },
  } as unknown as Parameters<typeof drawCollectionRoute>[0];
  const positions = new Map([
    [2, { x: 0, y: 0 }], [4, { x: 10, y: 20 }], [5, { x: 30, y: 40 }],
    [3, { x: 50, y: 0 }],
  ]);
  expect(drawCollectionRoute(graphics, plan, positions)).toBe(true);
  expect(path).toEqual([[0, 0], [10, 20], [30, 40], [50, 0], [30, 40], [10, 20], [0, 0]]);

  path.length = 0;
  positions.delete(5);
  expect(drawCollectionRoute(graphics, plan, positions)).toBe(false);
  expect(path).toEqual([]);
});
