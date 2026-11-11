import type { Graphics } from "pixi.js";
import type { TravelPlan } from "@/features/collection-routing/planner";

type Point = { x: number; y: number };
type RouteGraphics = Pick<Graphics, "moveTo" | "lineTo" | "circle" | "stroke">;

/** The engine traverses depot → waypoints → source, then reverses the same waypoints. */
export function drawCollectionRoute(graphics: RouteGraphics, plan: TravelPlan, positions: ReadonlyMap<number, Point>): boolean {
  const source = positions.get(plan.sourceEntityId);
  const depot = positions.get(plan.depotEntityId);
  // Missing observations must not turn a safe multi-hop route into a false direct line.
  if (!source || !depot || plan.waypointIds.some(id => !positions.has(id))) return false;

  graphics.moveTo(depot.x, depot.y);
  for (const id of plan.waypointIds) {
    const point = positions.get(id)!;
    graphics.lineTo(point.x, point.y);
  }
  graphics.lineTo(source.x, source.y);
  for (let index = plan.waypointIds.length - 1; index >= 0; index--) {
    const point = positions.get(plan.waypointIds[index]!)!;
    graphics.lineTo(point.x, point.y);
  }
  graphics.lineTo(depot.x, depot.y).stroke({ width: 2, color: 0x55ccaa, alpha: 0.75 });
  graphics.circle(source.x, source.y, 7).circle(depot.x, depot.y, 7)
    .stroke({ width: 2, color: 0x55ccaa });
  for (const id of plan.waypointIds) {
    const point = positions.get(id)!;
    graphics.circle(point.x, point.y, 5).stroke({ width: 1.5, color: 0x55ccaa });
  }
  return true;
}
