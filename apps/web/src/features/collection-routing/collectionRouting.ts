import { contentManager } from "../content/contentManager";
import { gameConnection } from "../gamestate/connection";
import { GAMESTATE_UPDATED_EVENT } from "../gamestate/events";
import { minimapMemory } from "../gamestate/minimapMemory";
import { game } from "../gamestate/world";
import { intentQueue, type CollectionRouter } from "../intent-queue/intentQueueManager";
import type { Assignment, PlanRequest, PlanResult, RouteEntity, TravelPlan } from "./planner";

type ManagedOrder = {
  assignment: Assignment;
  send: (plan?: TravelPlan) => void;
  plan?: TravelPlan;
  accepted: boolean;
  pending: boolean;
  dirty?: boolean;
  revision: number;
  fingerprint: string;
  blockedActivity: boolean;
  holding?: boolean;
  expectedDepotId?: number;
};
type ReconnectedOrder = {
  entity_id: number;
  client_cmd_id?: string;
  intent_kind?: string;
  collect_resource_type_id?: string;
  collect_nearest_compatible?: boolean;
  collect_travel_plan?: {
    source_entity_id: number | string;
    depot_entity_id: number | string;
    waypoint_ids: Array<number | string>;
    initial_waypoint_ids: Array<number | string>;
    initial_to_depot: boolean;
  };
};

class CollectionRouting implements CollectionRouter {
  private worker: Worker | null = null;
  private playerId: string | null = null;
  private runId = "";
  private epoch = 0;
  private serial = 0;
  private orders = new Map<number, ManagedOrder>();
  private pending = new Map<number, { entityId: number; epoch: number; revision: number }>();
  private statuses = new Map<number, string>();
  private listeners = new Set<() => void>();
  private timer: number | undefined;
  private live = false;
  private holdingEntity: number | null = null;
  private hazards = new Map<number, RouteEntity>();
  private hazardContext = "";
  private savedHazards = "";
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  getStatus(entityId: number) { return this.statuses.get(entityId) ?? ""; }
  private status(entityId: number, value: string) {
    if (this.getStatus(entityId) === value) return;
    if (value) this.statuses.set(entityId, value); else this.statuses.delete(entityId);
    for (const listener of this.listeners) listener();
  }

  start(playerId: string | null) {
    if (this.playerId !== playerId) this.reset();
    this.playerId = playerId;
    this.runId = game.runId;
    intentQueue.setCollectionRouter(this);
    const update = () => {
      if (this.timer !== undefined) return;
      this.timer = window.setTimeout(() => { this.timer = undefined; this.refresh(); }, 200);
    };
    const unsubscribeContent = contentManager.subscribe(update);
    const unsubscribeConnection = gameConnection.subscribe(() => {
      const live = gameConnection.getSnapshot() === "live";
      if (!live) this.suspend();
      this.live = live;
      if (live) update();
    });
    window.addEventListener(GAMESTATE_UPDATED_EVENT, update);
    this.live = gameConnection.getSnapshot() === "live";
    update();
    return () => {
      window.removeEventListener(GAMESTATE_UPDATED_EVENT, update);
      unsubscribeContent(); unsubscribeConnection();
      clearTimeout(this.timer); this.timer = undefined;
      this.suspend();
      intentQueue.setCollectionRouter(null);
    };
  }

  adopt(orders: ReconnectedOrder[], playerId?: string, runId = game.runId) {
    if (playerId && playerId !== this.playerId) { this.reset(); this.playerId = playerId; }
    this.runId = runId;
    const context = `${this.playerId}:${runId}`;
    if (context !== this.hazardContext) {
      this.hazardContext = context;
      this.hazards.clear();
      try {
        const saved = JSON.parse(localStorage.getItem("bitwars:collection-hazards") ?? "null") as { context: string; entities: RouteEntity[] } | null;
        if (saved?.context === context) for (const entity of saved.entities) {
          if (Number.isSafeInteger(entity.id) && Number.isFinite(entity.pos?.x) && Number.isFinite(entity.pos?.y)) this.hazards.set(entity.id, entity);
        }
      } catch { /* Missing/corrupt browser memory cannot reveal unknown hazards. */ }
    }
    for (const [entityId, state] of intentQueue.getAllEntityStates()) {
      const id = Number(entityId), hold = state.collectionRoutingHold;
      if (!hold || hold.playerId !== this.playerId || this.orders.has(id)) continue;
      const active = orders.find(order => Number(order.entity_id) === id);
      if (active && active.client_cmd_id !== hold.holdClientCmdId) { intentQueue.setCollectionRoutingHold(id, undefined); continue; }
      this.orders.set(id, { assignment: hold.assignment, plan: hold.plan, accepted: true, holding: true,
        send: plan => { if (plan) intentQueue.submitPlannedCollection(id, hold.assignment, plan); },
        pending: false, revision: ++this.serial, fingerprint: "", blockedActivity: false });
    }
    const present = new Set<number>();
    for (const active of orders) {
      if (active.intent_kind?.toLowerCase() !== "collect") continue;
      const id = Number(active.entity_id);
      present.add(id);
      if (this.orders.has(id)) continue;
      const plan = active.collect_travel_plan;
      if (!plan && !active.collect_resource_type_id && !active.collect_nearest_compatible) continue;
      const assignment = { resourceTypeId: active.collect_resource_type_id, nearestCompatible: !!active.collect_nearest_compatible };
      this.orders.set(id, {
        assignment, send: travelPlan => { if (travelPlan) intentQueue.submitPlannedCollection(id, assignment, travelPlan); },
        plan: plan ? { sourceEntityId: Number(plan.source_entity_id), depotEntityId: Number(plan.depot_entity_id),
          waypointIds: plan.waypoint_ids.map(Number), initialWaypointIds: plan.initial_waypoint_ids.map(Number), initialToDepot: plan.initial_to_depot } : undefined,
        accepted: true, pending: false, revision: ++this.serial, fingerprint: "", blockedActivity: false,
      });
    }
    for (const [id, order] of this.orders) if (order.accepted && !order.holding && !present.has(id)) this.cancel(id);
  }

  request(entityId: number, assignment: Assignment, send: (plan?: TravelPlan) => void) {
    this.cancel(entityId);
    const entity = Array.from(game.world.with("id")).find(entry => Number(entry.id) === entityId);
    const definition = contentManager.getEntityType(entity?.entity_type_id ?? "");
    if (definition?.collector && (definition.collector.transport_rate_per_second ?? 8) <= 0) { send(); return; }
    if (!this.live || !this.playerId || !game.ready) {
      this.status(entityId, "Routing blocked: reconnect before issuing collection orders."); return;
    }
    this.orders.set(entityId, { assignment, send, accepted: false, pending: false, revision: ++this.serial, fingerprint: "", blockedActivity: false });
    this.refresh();
  }

  cancel(entityId: number) {
    if (this.holdingEntity === entityId) return;
    this.orders.delete(entityId);
    if (intentQueue.getEntityState(entityId).collectionRoutingHold) intentQueue.setCollectionRoutingHold(entityId, undefined);
    this.status(entityId, "");
  }

  reassign(entityId: number, targetId: number) {
    const order = this.orders.get(entityId);
    if (!order?.accepted) { this.cancel(entityId); return; }
    order.expectedDepotId = targetId;
    order.revision = ++this.serial;
    order.pending = false;
  }

  cargoChanged(entityId: number) {
    const order = this.orders.get(entityId);
    if (!order?.accepted) { this.cancel(entityId); return; }
    order.revision = ++this.serial;
    order.pending = false;
    order.fingerprint = "";
  }
  reset() {
    this.suspend();
    this.orders.clear();
    this.hazards.clear();
    this.hazardContext = "";
    this.statuses.clear();
    for (const listener of this.listeners) listener();
    this.runId = game.runId;
  }

  forget(entityId: number | string) {
    if (!this.hazards.delete(Number(entityId))) return;
    this.saveHazards();
  }

  private saveHazards() {
    const value = JSON.stringify({ context: this.hazardContext, entities: [...this.hazards.values()] });
    if (value === this.savedHazards) return;
    this.savedHazards = value;
    try { localStorage.setItem("bitwars:collection-hazards", value); } catch { /* Browser storage may be unavailable. */ }
  }
  private suspend() {
    this.epoch++;
    this.worker?.terminate(); this.worker = null;
    this.pending.clear(); this.live = false;
    for (const [id, order] of this.orders) {
      order.pending = false;
      if (!order.accepted) this.cancel(id);
    }
  }

  private refresh() {
    if (this.runId !== game.runId) { this.reset(); this.runId = game.runId; }
    if (!this.live || !this.playerId || !game.ready || gameConnection.getSnapshot() !== "live") return;
    const definitions = contentManager.getContent()?.entity_types;
    if (!definitions) return;
    const entities = new Map<number, RouteEntity>();
    for (const [id, entity] of this.hazards) entities.set(id, entity);
    // Minimap sightings survive full reconnect snapshots, unlike streamed entities.
    for (const entity of minimapMemory.entries()) entities.set(Number(entity.id), { ...entity, id: Number(entity.id) });
    for (const entity of game.world.with("id", "pos")) entities.set(Number(entity.id), {
      id: Number(entity.id), pos: { ...entity.pos }, entity_type_id: entity.entity_type_id,
      owner_player_id: entity.owner_player_id, health: entity.health, remembered: entity.remembered,
      resource_deposit: entity.resource_deposit, resources: entity.resources,
      supply: entity.supply, collector_state: entity.collector_state,
    });
    for (const entity of entities.values()) {
      if (definitions[entity.entity_type_id ?? ""]?.radiation_sources?.length) {
        this.hazards.set(entity.id, { id: entity.id, entity_type_id: entity.entity_type_id, pos: { ...entity.pos }, remembered: true });
      } else this.hazards.delete(entity.id);
    }
    this.saveHazards();
    const relevant = [...entities.values()].filter(entity => {
      const definition = definitions[entity.entity_type_id ?? ""];
      return definition && (definition.radiation_sources?.length || definition.resource_node || definition.depot || entity.entity_type_id === "waypoint");
    }).sort((a, b) => a.id - b.id);
    const fingerprint = JSON.stringify([contentManager.getContentVersion(), relevant.map(entity => [entity.id, entity.entity_type_id, entity.owner_player_id,
      entity.pos, (entity.health ?? 1) > 0, entity.resource_deposit ? entity.resource_deposit.remaining > 0 : true,
      definitions[entity.entity_type_id ?? ""]?.depot ? Object.entries(definitions[entity.entity_type_id ?? ""]?.max_capacity ?? {})
        .map(([resource, capacity]) => [resource, capacity > (entity.resources?.find(entry => entry.resource_type === resource)?.amount ?? 0)]) : null])]);
    for (const [id, order] of this.orders) {
      const worker = entities.get(id);
      if (!worker || worker.owner_player_id !== this.playerId) { this.cancel(id); continue; }
      if (order.expectedDepotId !== undefined && Number(worker.supply?.delivery_depot_id ?? 0) !== order.expectedDepotId) continue;
      order.expectedDepotId = undefined;
      const active = intentQueue.getEntityState(id).active;
      if (order.accepted && !order.holding && active && active.kind !== "collect") { this.cancel(id); continue; }
      const blocked = worker.collector_state?.activity === "routing_blocked";
      const orderFingerprint = `${fingerprint}:${worker.entity_type_id}:${worker.supply?.delivery_depot_id ?? 0}`;
      const changed = order.fingerprint !== orderFingerprint;
      const becameBlocked = blocked && !order.blockedActivity;
      order.blockedActivity = blocked;
      if (order.pending) {
        if (changed || becameBlocked) order.dirty = true;
        continue;
      }
      if (!changed && !becameBlocked && !order.dirty) continue;
      order.dirty = false;
      order.fingerprint = orderFingerprint;
      const request: PlanRequest = { workerId: id, playerId: this.playerId, entities: [...entities.values()], definitions, assignment: order.assignment,
        pinned: order.plan ? { sourceEntityId: order.plan.sourceEntityId,
          depotEntityId: Number(worker.supply?.delivery_depot_id) || order.plan.depotEntityId } : undefined,
        currentPlan: order.accepted && !order.holding && !blocked ? order.plan : undefined };
      if (!this.worker) {
        try {
          this.worker = new Worker(new URL("./planner.worker.ts", import.meta.url), { type: "module" });
          this.worker.onmessage = (event: MessageEvent<{ id: number; result: PlanResult }>) => this.complete(event.data.id, event.data.result);
          this.worker.onerror = () => {
            this.suspend();
            for (const entityId of this.orders.keys()) this.status(entityId, "Routing blocked: planner worker failed. Reconnect or issue collection again.");
          };
        } catch {
          this.status(id, "Routing blocked: this browser could not start the route planner."); continue;
        }
      }
      const requestId = ++this.serial;
      order.pending = true;
      this.pending.set(requestId, { entityId: id, epoch: this.epoch, revision: order.revision });
      this.status(id, "Planning radiation-safe collection route…");
      this.worker.postMessage({ id: requestId, request });
    }
  }

  private complete(requestId: number, result: PlanResult) {
    this.refresh();
    const pending = this.pending.get(requestId);
    this.pending.delete(requestId);
    if (!pending || pending.epoch !== this.epoch || !this.live || gameConnection.getSnapshot() !== "live" || this.runId !== game.runId) return;
    const order = this.orders.get(pending.entityId);
    if (!order || order.revision !== pending.revision) return;
    order.pending = false;
    if (order.dirty) {
      this.refresh();
      return;
    }
    if (result.kind === "retained") {
      this.status(pending.entityId, "Radiation-safe collection route retained");
      return;
    }
    if (result.kind === "blocked") {
      if (order.accepted && !order.holding) {
        const worker = Array.from(game.world.with("id", "pos")).find(entity => Number(entity.id) === pending.entityId);
        if (worker?.pos) {
          order.holding = true;
          this.holdingEntity = pending.entityId;
          try { intentQueue.handleMoveCommand(pending.entityId, { ...worker.pos }, { shift: false, ctrl: false }); }
          finally { this.holdingEntity = null; }
          const holdClientCmdId = intentQueue.getEntityState(pending.entityId).active?.clientCmdId;
          if (holdClientCmdId && this.playerId) intentQueue.setCollectionRoutingHold(pending.entityId,
            { playerId: this.playerId, assignment: order.assignment, plan: order.plan, holdClientCmdId });
        }
      }
      this.status(pending.entityId, `Routing blocked: ${result.reason}`); return;
    }
    if (result.kind === "proximity") { order.send(); this.cancel(pending.entityId); return; }
    order.plan = result.travelPlan;
    order.accepted = true;
    order.holding = false;
    order.send(result.travelPlan);
    this.status(pending.entityId, "Radiation-safe collection route planned");
  }
}

export const collectionRouting = new CollectionRouting();
