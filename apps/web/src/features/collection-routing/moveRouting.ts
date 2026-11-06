import { contentManager } from "../content/contentManager";
import { gameConnection } from "../gamestate/connection";
import { minimapMemory } from "../gamestate/minimapMemory";
import { game } from "../gamestate/world";
import { intentQueue, type MoveRouter } from "../intent-queue/intentQueueManager";
import { MovePlanner, type MovePlanRequest, type MovePlanResult, type RouteEntity } from "./planner";

type Point = { x: number; y: number };
type Modifiers = { shift: boolean; ctrl: boolean };

class MoveRouting implements MoveRouter {
  private playerId: string | null = null;
  private worker: Worker | null = null;
  private workerUnavailable = false;
  private readonly localPlanner = new MovePlanner();
  private serial = 0;
  private versions = new Map<number, number>();
  private tails = new Map<number, Promise<void>>();
  private pending = new Map<number, { request: MovePlanRequest; resolve: (result: MovePlanResult) => void }>();

  start(playerId: string | null) {
    this.reset();
    this.playerId = playerId;
    intentQueue.setMoveRouter(this);
    return () => { this.reset(); intentQueue.setMoveRouter(null); this.playerId = null; };
  }

  reset() {
    this.worker?.terminate();
    this.worker = null;
    this.workerUnavailable = false;
    for (const { resolve } of this.pending.values()) resolve({ kind: "blocked", reason: "Move routing stopped." });
    this.pending.clear();
    for (const id of this.tails.keys()) this.versions.set(id, (this.versions.get(id) ?? 0) + 1);
    this.tails.clear();
  }

  cancel(entityId: number) {
    this.versions.set(entityId, (this.versions.get(entityId) ?? 0) + 1);
    this.tails.delete(entityId);
  }

  request(entityId: number, target: Point, modifiers: Modifiers, send: (via: Point[]) => void) {
    if (!modifiers.shift && !modifiers.ctrl) this.cancel(entityId);
    const version = this.versions.get(entityId) ?? 0;
    const previous = this.tails.get(entityId) ?? Promise.resolve();
    const next = previous.then(async () => {
      if (version !== this.versions.get(entityId)) return;
      const request = this.prepare(entityId, target, modifiers);
      if (!request) {
        window.dispatchEvent(new CustomEvent("bitwars:command-feedback", { detail: "Move routing unavailable: wait for the live world and content." }));
        return;
      }
      const result = await this.plan(request);
      if (version !== this.versions.get(entityId) || request.playerId !== this.playerId || !game.ready || gameConnection.getSnapshot() !== "live") return;
      if (result.kind === "blocked") {
        window.dispatchEvent(new CustomEvent("bitwars:command-feedback", { detail: result.reason }));
      } else {
        send(result.via);
      }
    });
    this.tails.set(entityId, next);
    void next.then(() => { if (this.tails.get(entityId) === next) this.tails.delete(entityId); },
      () => { if (this.tails.get(entityId) === next) this.tails.delete(entityId); });
  }

  private prepare(entityId: number, target: Point, modifiers: Modifiers): MovePlanRequest | null {
    if (!this.playerId || !game.ready || gameConnection.getSnapshot() !== "live") return null;
    const definitions = contentManager.getContent()?.entity_types;
    if (!definitions) return null;
    const entities = new Map<number, RouteEntity>();
    for (const entity of minimapMemory.entries()) entities.set(Number(entity.id), { ...entity, id: Number(entity.id) });
    for (const entity of game.world.with("id", "pos")) entities.set(Number(entity.id), {
      id: Number(entity.id), pos: { ...entity.pos }, entity_type_id: entity.entity_type_id,
      owner_player_id: entity.owner_player_id, health: entity.health, remembered: entity.remembered,
    });
    const mover = entities.get(entityId);
    if (!mover) return null;
    const state = intentQueue.getEntityState(entityId);
    const route = state.active?.kind === "move" ? state.active.route : undefined;
    const currentLeg = route?.waypoints[route.next_waypoint_index]
      ?? (state.active?.kind === "move" ? (state.pendingMoves.find(item => item.policy === "REPLACE_ACTIVE")?.via?.[0] ?? state.active.target) : undefined);
    const lastEdit = state.pendingMoves.at(-1);
    const start = modifiers.ctrl ? currentLeg ?? mover.pos
      : modifiers.shift ? lastEdit?.target ?? route?.waypoints.at(-1) ?? (state.active?.kind === "move" ? state.active.target : undefined) ?? mover.pos
      : mover.pos;
    return { entityId, playerId: this.playerId, start, target, entities: [...entities.values()], definitions };
  }

  private planLocally(request: MovePlanRequest): MovePlanResult {
    try {
      return this.localPlanner.plan(request);
    } catch (error) {
      console.error("[MoveRouting] route planner failed", error);
      return { kind: "blocked", reason: "Move route planning failed. No Move order was sent." };
    }
  }

  private failWorker(error: unknown) {
    console.error("[MoveRouting] route Worker failed; planning on the main thread", error);
    this.worker?.terminate();
    this.worker = null;
    this.workerUnavailable = true;
    for (const { request, resolve } of this.pending.values()) resolve(this.planLocally(request));
    this.pending.clear();
  }

  private plan(request: MovePlanRequest): Promise<MovePlanResult> {
    if (this.workerUnavailable) return Promise.resolve(this.planLocally(request));
    if (!this.worker) {
      try {
        this.worker = new Worker(new URL("./planner.worker.ts", import.meta.url), { type: "module" });
        this.worker.onmessage = (event: MessageEvent<{ id: number; result: MovePlanResult }>) => {
          const pending = this.pending.get(event.data.id);
          if (pending) { this.pending.delete(event.data.id); pending.resolve(event.data.result); }
        };
        this.worker.onerror = event => this.failWorker(event);
      } catch (error) {
        this.failWorker(error);
        return Promise.resolve(this.planLocally(request));
      }
    }
    const id = ++this.serial;
    // Node 20 and older browsers do not provide Promise.withResolvers.
    return new Promise(resolve => {
      this.pending.set(id, { request, resolve });
      try {
        this.worker!.postMessage({ id, kind: "move", request });
      } catch (error) {
        this.failWorker(error);
      }
    });
  }
}

export const moveRouting = new MoveRouting();
