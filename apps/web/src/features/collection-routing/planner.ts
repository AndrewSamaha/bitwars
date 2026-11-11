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
  currentPlan?: TravelPlan;
};
export type CollectionBlockCode =
  | "worker_unavailable" | "not_collector" | "no_capacity" | "source_unavailable"
  | "assigned_depot_unavailable" | "depot_unavailable" | "no_safe_recurring_route"
  | "no_safe_initial_route" | "planner_failed" | "planner_worker_failed" | "planner_worker_start_failed";
export type CollectionBlock = {
  kind: "blocked";
  reason: string;
  reasonCode: CollectionBlockCode;
  resourceTypeId?: string;
  sourceEntityId?: number;
  depotEntityId?: number;
};
export type PlanResult = { kind: "planned"; travelPlan: TravelPlan } | { kind: "retained" } | { kind: "proximity" } | CollectionBlock;
export type MovePlanRequest = Pick<PlanRequest, "playerId" | "entities" | "definitions"> & {
  entityId: number;
  start: { x: number; y: number };
  target: { x: number; y: number };
};
export type MovePlanResult = { kind: "planned"; via: Point[] } | { kind: "blocked"; reason: string };
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
function hazardsFor(request: Pick<PlanRequest, "entities" | "definitions">, worker: RouteEntity): Hazard[] {
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

/** The same radiation graph serves transport trips and one-off Move legs. */
class WaypointRouter {
  private cacheKey = "";
  private points: RouteEntity[] = [];
  private edges: Array<Array<{ to: number; cost: number }>> = [];

  route(start: Point, end: Point, points: RouteEntity[], hazards: Hazard[]): number[] | null {
    if (safeSegment(start, end, hazards)) return [];
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

function corridorPoints(request: Pick<PlanRequest, "playerId" | "entities">, start: Point, end: Point): RouteEntity[] {
  const corridorWidth = Math.max(MIN_CORRIDOR_WIDTH, CORRIDOR_DISTANCE_RATIO * distance(start, end));
  return request.entities.filter(entity => entity.entity_type_id === "waypoint" && entity.owner_player_id === request.playerId
    && !entity.remembered && (entity.health ?? 1) > 0
    && distanceToSegment(entity.pos, start, end) <= corridorWidth).sort((a, b) => a.id - b.id);
}

export class MovePlanner {
  private router = new WaypointRouter();

  plan(request: MovePlanRequest): MovePlanResult {
    const worker = request.entities.find(entity => entity.id === request.entityId);
    if (!worker || worker.owner_player_id !== request.playerId || worker.remembered || (worker.health ?? 1) <= 0) {
      return { kind: "blocked", reason: "Moving entity is unavailable or not owned by you." };
    }
    const points = corridorPoints(request, request.start, request.target);
    if (!points.length) return { kind: "planned", via: [] };
    const ids = this.router.route(request.start, request.target, points, hazardsFor(request, worker));
    if (ids === null || ids.length >= 256) return { kind: "blocked", reason: "No radiation-safe Move route within 1.5x direct distance and 255 intermediate destinations. Reposition nearby owned waypoints." };
    return { kind: "planned", via: ids.map(id => points.find(point => point.id === id)!.pos) };
  }
}

/** Worker-owned cache; only graph/profile changes rebuild waypoint edges. */
export class CollectionPlanner {
  private router = new WaypointRouter();

  plan(request: PlanRequest): PlanResult {
    const blocked = (reasonCode: CollectionBlockCode, reason: string, sourceEntityId?: number, depotEntityId?: number): CollectionBlock => {
      const resourceTypeId = request.assignment.resourceTypeId
        ?? request.definitions[request.entities.find(entity => entity.id === sourceEntityId)?.entity_type_id ?? ""]?.resource_node?.resource_type;
      return { kind: "blocked", reason, reasonCode, ...(resourceTypeId ? { resourceTypeId } : {}),
        ...(sourceEntityId ? { sourceEntityId } : {}), ...(depotEntityId ? { depotEntityId } : {}) };
    };
    const worker = request.entities.find(entity => entity.id === request.workerId);
    if (!worker || worker.owner_player_id !== request.playerId || worker.remembered) return blocked("worker_unavailable", "Worker is unavailable or not owned by you.");
    const definition = request.definitions[worker.entity_type_id ?? ""];
    if (!definition?.collector) return blocked("not_collector", "Entity cannot collect resources.");
    if ((definition.collector.transport_rate_per_second ?? 8) <= 0) return { kind: "proximity" };
    const collects = definition.collector.collects ?? [];
    const hasCapacity = (resource: string) => (definition.max_capacity?.[resource] ?? 0) > 0;
    const explicitResource = request.assignment.nearestCompatible ? undefined : request.assignment.resourceTypeId;
    if (explicitResource && !hasCapacity(explicitResource)) return blocked("no_capacity", `Worker has no capacity for ${explicitResource}.`);
    const preferredCargo = explicitResource ? [explicitResource] : [worker.collector_state?.resource_type, ...collects];
    const cargo = preferredCargo
      .filter((resource): resource is string => !!resource && collects.includes(resource) && hasCapacity(resource))
      .map(resource => worker.resources?.find(entry => entry.resource_type === resource && entry.amount > 0))
      .find(entry => entry !== undefined);
    const resource = explicitResource ?? cargo?.resource_type;
    const nearest = (a: RouteEntity, b: RouteEntity) => distance(worker.pos, a.pos) - distance(worker.pos, b.pos) || a.id - b.id;
    const sources = request.entities.filter(entity => {
      const node = request.definitions[entity.entity_type_id ?? ""]?.resource_node;
      return (entity.health ?? 1) > 0 && (entity.resource_deposit?.remaining ?? 1) > 0 && node?.collection_mode === "transport"
        && collects.includes(node.resource_type) && hasCapacity(node.resource_type) && (resource === undefined || node.resource_type === resource);
    }).sort(nearest);
    const source = request.pinned ? sources.find(entity => entity.id === request.pinned!.sourceEntityId) : sources[0];
    if (!source) return blocked("source_unavailable", "No compatible discovered transport source is available.", request.pinned?.sourceEntityId);
    const sourceResource = request.definitions[source.entity_type_id ?? ""]!.resource_node!.resource_type;
    const sourceCargo = cargo?.resource_type === sourceResource ? cargo : undefined;
    const initialToDepot = !!sourceCargo && (sourceCargo.amount >= definition.max_capacity![sourceResource]!
      || (worker.collector_state?.resource_type === sourceResource
        && ["moving_to_dropoff", "delivering", "waiting_for_dropoff"].includes(worker.collector_state.activity)));
    const assigned = Number(worker.supply?.delivery_depot_id ?? 0);
    const depots = request.entities.filter(entity => {
      const depot = request.definitions[entity.entity_type_id ?? ""];
      const remaining = (resourceId: string) => (depot?.max_capacity?.[resourceId] ?? 0) - (entity.resources?.find(entry => entry.resource_type === resourceId)?.amount ?? 0);
      return !entity.remembered && entity.id !== worker.id && entity.owner_player_id === request.playerId && (entity.health ?? 1) > 0
        && depot?.depot && (!assigned || entity.id === assigned) && remaining(sourceResource) > 0;
    }).sort(nearest);
    const depot = request.pinned ? depots.find(entity => entity.id === request.pinned!.depotEntityId) : depots[0];
    if (!depot) return blocked(assigned ? "assigned_depot_unavailable" : "depot_unavailable",
      assigned ? "Assigned collection depot is unavailable or has no compatible capacity." : "No owned collection depot has compatible capacity.",
      source.id, request.pinned?.depotEntityId ?? (assigned || undefined));
    const points = corridorPoints(request, depot.pos, source.pos);
    const current = request.currentPlan;
    if (current && current.sourceEntityId === source.id && current.depotEntityId === depot.id) {
      const hazards = hazardsFor(request, worker);
      const markers = current.waypointIds.map(id => points.find(point => point.id === id));
      const initial = current.initialWaypointIds.map(id => request.entities.find(entity => entity.id === id
        && entity.entity_type_id === "waypoint" && entity.owner_player_id === request.playerId
        && !entity.remembered && (entity.health ?? 1) > 0));
      if (markers.every(point => point !== undefined) && initial.every(point => point !== undefined)) {
        const recurring = [depot, ...markers as RouteEntity[], source];
        const approach = [worker, ...initial as RouteEntity[], current.initialToDepot ? depot : source];
        // No server route cursor is published. Prove every possible next leg safe
        // rather than guessing which initial/recurring waypoint remains active.
        const targets = [source, depot, ...markers as RouteEntity[], ...initial as RouteEntity[]];
        const safe = points.length === 0 || (recurring.every((point, index) =>
          index === 0 || safeSegment(recurring[index - 1]!.pos, point.pos, hazards))
          && approach.every((point, index) => index === 0 || safeSegment(approach[index - 1]!.pos, point.pos, hazards))
          && targets.every(point => safeSegment(worker.pos, point.pos, hazards)));
        if (safe) return { kind: "retained" };
      }
    }
    // Without a local waypoint network, preserve ordinary direct travel and its risks.
    if (points.length === 0) return { kind: "planned", travelPlan: {
      sourceEntityId: source.id, depotEntityId: depot.id, waypointIds: [], initialWaypointIds: [], initialToDepot,
    } };
    const hazards = hazardsFor(request, worker);
    // The shared router caches edges for this waypoint network and radiation profile.
    const route = this.router.route(depot.pos, source.pos, points, hazards);
    if (route === null) return blocked("no_safe_recurring_route", "No radiation-safe route between depot and source within 1.5x direct distance. Reposition nearby owned waypoints.", source.id, depot.id);
    const initial = this.router.route(worker.pos, initialToDepot ? depot.pos : source.pos, points, hazards);
    if (initial === null) return blocked("no_safe_initial_route", "No radiation-safe initial approach within 1.5x direct distance. Move the worker to safety or reposition nearby owned waypoints.", source.id, depot.id);
    return { kind: "planned", travelPlan: { sourceEntityId: source.id, depotEntityId: depot.id, waypointIds: route, initialWaypointIds: initial, initialToDepot } };
  }

}
