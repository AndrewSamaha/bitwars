import type { EntityTypeDef } from "../content/contentManager";

export type TravelPlan = {
  sourceEntityId: number;
  depotEntityId: number;
  waypointIds: number[];
  initialWaypointIds: number[];
  initialToDepot: boolean;
};
export type RouteEntity = {
  id: number;
  entity_type_id?: string;
  owner_player_id?: string;
  pos: { x: number; y: number };
  health?: number;
  remembered?: unknown;
  resource_deposit?: { remaining: number } | null;
  resources?: Array<{ resource_type: string; amount: number }>;
  supply?: { delivery_depot_id?: number | string };
  collector_state?: { activity: string; resource_type?: string };
};
export type Assignment = { resourceTypeId?: string; nearestCompatible: boolean };
export type PlanRequest = {
  workerId: number;
  playerId: string;
  entities: RouteEntity[];
  definitions: Record<string, EntityTypeDef>;
  assignment: Assignment;
  pinned?: Pick<TravelPlan, "sourceEntityId" | "depotEntityId">;
};
export type PlanResult = { kind: "planned"; travelPlan: TravelPlan } | { kind: "proximity" } | { kind: "blocked"; reason: string };
type Point = { x: number; y: number };
type Hazard = Point & { inner: number; outer: number };
const MARGIN = 100;
const MIN_CORRIDOR_WIDTH = 1500;
const CORRIDOR_DISTANCE_RATIO = 0.25;
const MAX_ROUTE_STRETCH = 1.5;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x, dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq)) : 0;
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

/** Include remembered hazards: losing sensor coverage never makes a segment safe. */
function hazardsFor(request: PlanRequest, worker: RouteEntity): Hazard[] {
  const shielding = request.definitions[worker.entity_type_id ?? ""]?.radiation_shielding;
  return request.entities.flatMap(entity => entity.id === worker.id ? [] :
    (request.definitions[entity.entity_type_id ?? ""]?.radiation_sources ?? []).flatMap(source => {
      const shield = shielding?.[source.radiation_type];
      if ((source.damage_per_second ?? 0) <= 0 || (shield?.damage_multiplier ?? 1) <= 0) return [];
      const offset = Math.max(0, shield?.distance_offset ?? 0);
      const outer = (source.max_effective_distance ?? 0) - offset;
      if (outer <= 0) return [];
      return [{ ...entity.pos, inner: Math.max(0, (source.min_effective_distance ?? 0) - offset - MARGIN), outer: outer + MARGIN }];
    }));
}

function safeSegment(a: Point, b: Point, hazards: Hazard[]): boolean {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  return hazards.every(hazard => {
    const t = lengthSq ? Math.max(0, Math.min(1, ((hazard.x - a.x) * dx + (hazard.y - a.y) * dy) / lengthSq)) : 0;
    const nearest = Math.hypot(a.x + t * dx - hazard.x, a.y + t * dy - hazard.y);
    const farthest = Math.max(distance(a, hazard), distance(b, hazard));
    return nearest > hazard.outer || farthest < hazard.inner;
  });
}

/** Worker-owned cache; only graph/profile changes rebuild waypoint edges. */
export class CollectionPlanner {
  private cacheKey = "";
  private points: RouteEntity[] = [];
  private edges: Array<Array<{ to: number; cost: number }>> = [];

  plan(request: PlanRequest): PlanResult {
    const blocked = (reason: string): PlanResult => ({ kind: "blocked", reason });
    const worker = request.entities.find(entity => entity.id === request.workerId);
    if (!worker || worker.owner_player_id !== request.playerId || worker.remembered) return blocked("Worker is unavailable or not owned by you.");
    const definition = request.definitions[worker.entity_type_id ?? ""];
    if (!definition?.collector) return blocked("Entity cannot collect resources.");
    if ((definition.collector.transport_rate_per_second ?? 8) <= 0) return { kind: "proximity" };
    const collects = definition.collector.collects ?? [];
    const cargo = [worker.collector_state?.resource_type, request.assignment.resourceTypeId, ...collects]
      .filter((resource): resource is string => !!resource && collects.includes(resource))
      .map(resource => worker.resources?.find(entry => entry.resource_type === resource && entry.amount > 0))
      .find(entry => entry !== undefined);
    const mismatch = !!cargo && !request.assignment.nearestCompatible && cargo.resource_type !== request.assignment.resourceTypeId;
    const resource = cargo && !mismatch ? cargo.resource_type : request.assignment.nearestCompatible ? undefined : request.assignment.resourceTypeId;
    const nearest = (a: RouteEntity, b: RouteEntity) => distance(worker.pos, a.pos) - distance(worker.pos, b.pos) || a.id - b.id;
    const sources = request.entities.filter(entity => {
      const node = request.definitions[entity.entity_type_id ?? ""]?.resource_node;
      return (entity.health ?? 1) > 0 && (entity.resource_deposit?.remaining ?? 1) > 0 && node?.collection_mode === "transport"
        && collects.includes(node.resource_type) && (resource === undefined || node.resource_type === resource);
    }).sort(nearest);
    const source = request.pinned ? sources.find(entity => entity.id === request.pinned!.sourceEntityId) : sources[0];
    if (!source) return blocked("No compatible discovered transport source is available.");
    const sourceResource = request.definitions[source.entity_type_id ?? ""]!.resource_node!.resource_type;
    const initialToDepot = !!cargo && (mismatch || cargo.amount >= (definition.max_capacity?.[cargo.resource_type] ?? Infinity)
      || ["moving_to_dropoff", "delivering", "waiting_for_dropoff"].includes(worker.collector_state?.activity ?? ""));
    const assigned = Number(worker.supply?.delivery_depot_id ?? 0);
    const depots = request.entities.filter(entity => {
      const depot = request.definitions[entity.entity_type_id ?? ""];
      const remaining = (resourceId: string) => (depot?.max_capacity?.[resourceId] ?? 0) - (entity.resources?.find(entry => entry.resource_type === resourceId)?.amount ?? 0);
      return !entity.remembered && entity.id !== worker.id && entity.owner_player_id === request.playerId && (entity.health ?? 1) > 0
        && depot?.depot && (!assigned || entity.id === assigned) && remaining(sourceResource) > 0
        && (!initialToDepot || !cargo || remaining(cargo.resource_type) > 0);
    }).sort(nearest);
    const depot = request.pinned ? depots.find(entity => entity.id === request.pinned!.depotEntityId) : depots[0];
    if (!depot) return blocked(assigned ? "Assigned collection depot is unavailable or has no compatible capacity." : "No owned collection depot has compatible capacity.");
    const corridorWidth = Math.max(MIN_CORRIDOR_WIDTH, CORRIDOR_DISTANCE_RATIO * distance(depot.pos, source.pos));
    const points = request.entities.filter(entity => entity.entity_type_id === "waypoint" && entity.owner_player_id === request.playerId
      && !entity.remembered && (entity.health ?? 1) > 0
      && distanceToSegment(entity.pos, depot.pos, source.pos) <= corridorWidth).sort((a, b) => a.id - b.id);
    // Without a local waypoint network, preserve ordinary direct travel and its risks.
    if (points.length === 0) return { kind: "planned", travelPlan: {
      sourceEntityId: source.id, depotEntityId: depot.id, waypointIds: [], initialWaypointIds: [], initialToDepot,
    } };
    const hazards = hazardsFor(request, worker);
    const key = JSON.stringify([points.map(entity => [entity.id, entity.pos.x, entity.pos.y]), hazards]);
    if (key !== this.cacheKey) {
      this.cacheKey = key;
      this.points = points;
      this.edges = points.map(() => []);
      for (let a = 0; a < points.length; a++) for (let b = a + 1; b < points.length; b++) {
        if (!safeSegment(points[a]!.pos, points[b]!.pos, hazards)) continue;
        const cost = distance(points[a]!.pos, points[b]!.pos);
        this.edges[a]!.push({ to: b, cost }); this.edges[b]!.push({ to: a, cost });
      }
    }
    const route = this.route(depot.pos, source.pos, hazards);
    if (route === null) return blocked("No radiation-safe route between depot and source within 1.5x direct distance. Reposition nearby owned waypoints.");
    const initial = this.route(worker.pos, initialToDepot ? depot.pos : source.pos, hazards);
    if (initial === null) return blocked("No radiation-safe initial approach within 1.5x direct distance. Move the worker to safety or reposition nearby owned waypoints.");
    return { kind: "planned", travelPlan: { sourceEntityId: source.id, depotEntityId: depot.id, waypointIds: route, initialWaypointIds: initial, initialToDepot } };
  }

  private route(start: Point, end: Point, hazards: Hazard[]): number[] | null {
    if (safeSegment(start, end, hazards)) return [];
    const count = this.points.length;
    const costs = new Float64Array(count).fill(Infinity);
    const previous = new Int32Array(count).fill(-1);
    const visited = new Uint8Array(count);
    for (let i = 0; i < count; i++) if (safeSegment(start, this.points[i]!.pos, hazards)) costs[i] = distance(start, this.points[i]!.pos);
    let best = Infinity, finish = -1;
    for (let step = 0; step < count; step++) {
      let current = -1;
      for (let i = 0; i < count; i++) if (!visited[i] && (current < 0 || costs[i]! < costs[current]!)) current = i;
      if (current < 0 || !Number.isFinite(costs[current]) || costs[current]! >= best) break;
      visited[current] = 1;
      const point = this.points[current]!.pos;
      const total = costs[current]! + distance(point, end);
      if (total < best && safeSegment(point, end, hazards)) { best = total; finish = current; }
      for (const edge of this.edges[current]!) {
        const next = costs[current]! + edge.cost;
        if (next < costs[edge.to]!) { costs[edge.to] = next; previous[edge.to] = current; }
      }
    }
    if (finish < 0 || best > MAX_ROUTE_STRETCH * distance(start, end)) return null;
    const ids: number[] = [];
    for (let current = finish; current >= 0; current = previous[current]!) ids.push(this.points[current]!.id);
    return ids.length <= 256 ? ids.reverse() : null;
  }
}
