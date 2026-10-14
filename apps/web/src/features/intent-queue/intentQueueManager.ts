/** Server-owned route display, pending command previews, and ordered submissions. */
import { v7 as uuidv7 } from "uuid";

// ── Types ──────────────────────────────────────────────────────────────────

export type IntentPolicyName = "REPLACE_ACTIVE" | "APPEND" | "CLEAR_THEN_APPEND";

export type PendingMoveCommand = {
  clientCmdId: string;
  entityId: number;
  target: { x: number; y: number };
  policy: IntentPolicyName;
  createdAt: number;
  finished?: boolean;
};

export type MoveRouteSummary = {
  waypoints: Array<{ x: number; y: number }>;
  next_waypoint_index: number;
  last_client_cmd_id?: string;
};
export type MoveOrderPayload = {
  entity_id: number | string;
  player_id: string;
  intent_id: string;
  client_cmd_id: string;
  last_client_cmd_id?: string;
  started_tick: number | string;
  route: MoveRouteSummary | null;
};
export type MoveOrderRemovalPayload = {
  entity_id: number | string;
  player_id: string;
  client_cmd_id: string;
};

export type ActiveIntentKind = "convoy" | "move" | "collect" | "build" | "upgrade" | "repair" | "research" | "deliver" | "transport" | "unknown";

export type ActiveIntentInfo = {
  clientCmdId: string;
  entityId: number;
  /** Collect intents keep an entity busy but do not have a location to render. */
  kind: ActiveIntentKind;
  target?: { x: number; y: number };
  route?: MoveRouteSummary;
  transfer?: { donorId: number; targetId: number; resourceTypeIds: string[] };
  intentId?: string;      // server-assigned, set on ACCEPTED
  serverTick?: string;    // set on ACCEPTED
};

export type PerEntityState = {
  pendingMoves: PendingMoveCommand[];
  active: ActiveIntentInfo | null;
};

type PersistedState = {
  schemaVersion?: number;
  migrationNotice?: string | null;
  runId?: string;
  clientSeq: number;
  entities: Record<string, PerEntityState>;
};

export type SendIntentParams =
  | {
      kind: "Convoy";
      entityIds: number[];
      target: { x: number; y: number };
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Deliver" | "Transport";
      donorId?: number;
      entityId: number;
      targetId: number;
      resourceTypeIds: string[];
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Move";
      entityId: number;
      target: { x: number; y: number };
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Collect";
      entityId: number;
      resourceTypeId?: string;
      nearestCompatible: boolean;
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Build";
      entityId: number;
      blueprintId: string;
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Upgrade";
      entityId: number;
      targetEntityTypeId: string;
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Repair";
      entityId: number;
      targetId: number;
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    }
  | {
      kind: "Research";
      entityId: number;
      technologyId: string;
      clientCmdId: string;
      clientSeq: number;
      policy: IntentPolicyName;
    };

type SendCallback = (params: SendIntentParams) => Promise<void>;
type StateChangeListener = () => void;

// ── M2: Reconnect handshake response shape ─────────────────────────────────

export type ReconnectHandshake = {
  run_id?: string;
  server_tick: number;
  protocol_version: number;
  content_version: string;          // M4: xxh3 hex hash of server content pack
  player_id?: string;               // M7: current player id (for resource ledger)
  last_processed_client_seq: number;
  active_intents: Array<{
    entity_id: number;
    intent_id: string;
    client_cmd_id: string;
    player_id: string;
    started_tick: number;
    intent_kind?: string;
    transfer_route?: { donor_id: number; target_id: number; resource_type_ids: string[] };
    move_target?: { x: number; y: number };
    move_route?: MoveRouteSummary;
    blueprint_id?: string;
    progress?: number;
  }>;
};

// ── Lifecycle state / reason numeric values (matches proto enum) ───────────

const LIFECYCLE_STATE_ACCEPTED   = 2;
const LIFECYCLE_STATE_FINISHED   = 5;
const LIFECYCLE_STATE_CANCELED   = 6;
const LIFECYCLE_STATE_REJECTED   = 7;


// ── Manager ────────────────────────────────────────────────────────────────

export class IntentQueueManager {
  private clientSeq = 0;
  private stateRevision = 0;
  private submissionTail: Promise<void> = Promise.resolve();
  private pendingCommands = new Map<string, SendIntentParams>();
  private migrationNotice: string | null = null;
  private runId = "";
  private worldGeneration = 0;
  private entities = new Map<string, PerEntityState>();
  private storageKey: string;
  private sendCallback: SendCallback | null = null;
  private listeners = new Set<StateChangeListener>();
  private cmdToEntity = new Map<string, number>();
  private cmdToKind = new Map<string, "convoy" | "move" | "collect" | "build" | "upgrade" | "repair" | "research" | "deliver" | "transport">();

  constructor(storageKey = "bitwars:intent-queue") {
    this.storageKey = storageKey;
    this.restore();
  }

  resetForWorld(runId?: string) {
    if (runId && runId === this.runId) return;
    this.runId = runId ?? "";
    this.worldGeneration++;
    this.clientSeq = 0;
    this.entities.clear();
    this.pendingCommands.clear();
    this.cmdToEntity.clear();
    this.cmdToKind.clear();
    this.persist();
    this.notify();
  }

  // ── Wiring ─────────────────────────────────────────────────────────────

  /** Provide the callback that actually POSTs an intent to the server. */
  setSendCallback(cb: SendCallback) {
    this.sendCallback = cb;
  }

  /** Subscribe to state changes (for React re-renders). Returns unsubscribe. */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /** Replace all member plans with one authoritative group order. */
  handleConvoyCommand(entityIds: number[], target: { x: number; y: number }) {
    const clientCmdId = uuidv7();
    this.clientSeq++;
    for (const entityId of entityIds) {
      const state = this.getOrCreate(entityId);
      state.pendingMoves = [];
      state.active = { clientCmdId, entityId, kind: "convoy", target };
    }
    this.cmdToKind.set(clientCmdId, "convoy");
    this.persist();
    this.notify();
    void this.submit({ kind: "Convoy", entityIds, target, clientCmdId,
      clientSeq: this.clientSeq, policy: "REPLACE_ACTIVE" });
  }

  /** Send every waypoint mutation immediately; the server owns execution. */
  handleMoveCommand(entityId: number, target: { x: number; y: number },
    modifiers: { shift: boolean; ctrl: boolean }) {
    const policy: IntentPolicyName = modifiers.ctrl ? "CLEAR_THEN_APPEND"
      : modifiers.shift ? "APPEND" : "REPLACE_ACTIVE";
    const clientCmdId = uuidv7();
    const state = this.getOrCreate(entityId);
    if (policy === "REPLACE_ACTIVE") {
      state.pendingMoves = [];
      state.active = { clientCmdId, entityId, kind: "move", target };
    }
    state.pendingMoves.push({ clientCmdId, entityId, target, policy, createdAt: Date.now() });
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, "move");
    this.clientSeq++;
    void this.submit({ kind: "Move", entityId, target, clientCmdId, clientSeq: this.clientSeq, policy });
    this.persist(); this.notify();
  }

  /**
   * Send a maintained Collect intent immediately.
   * Collect does not participate in the local waypoint queue.
   */
  handleCollectCommand(
    entityId: number,
    assignment: { resourceTypeId?: string; nearestCompatible: boolean },
    policy: IntentPolicyName = "REPLACE_ACTIVE",
  ) {
    const clientCmdId = uuidv7();
    this.sendCollectNow(entityId, clientCmdId, assignment, policy);
  }

  /** Deliver currently held resources in one trip. */
  handleDeliverCommand(entityId: number, targetId: number, resourceTypeIds: string[], donorId?: number) {
    const clientCmdId = uuidv7();
    const state = this.getOrCreate(entityId);
    state.pendingMoves = [];
    state.active = { clientCmdId, entityId, kind: donorId ? "transport" : "deliver", ...(donorId ? { transfer: { donorId, targetId, resourceTypeIds } } : {}) };
    this.clientSeq++;
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, donorId ? "transport" : "deliver");
    this.persist();
    this.notify();
    void this.submit({ kind: donorId ? "Transport" : "Deliver", donorId, entityId, targetId, resourceTypeIds,
      clientCmdId, clientSeq: this.clientSeq, policy: "REPLACE_ACTIVE" });
  }

  /** Start repairing a selected friendly target immediately. */
  handleRepairCommand(entityId: number, targetId: number) {
    const clientCmdId = uuidv7();
    const state = this.getOrCreate(entityId);
    state.pendingMoves = [];
    state.active = { clientCmdId, entityId, kind: "repair" };
    this.clientSeq++;
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, "repair");
    this.persist();
    this.notify();
    void this.submit({
      kind: "Repair",
      entityId,
      targetId,
      clientCmdId,
      clientSeq: this.clientSeq,
      policy: "REPLACE_ACTIVE",
    });
  }

  /** Start a content-defined production action immediately. */
  handleBuildCommand(entityId: number, blueprintId: string) {
    const clientCmdId = uuidv7();
    this.clientSeq += 1;
    const state = this.getOrCreate(entityId);
    state.pendingMoves = [];
    state.active = { clientCmdId, entityId, kind: "build" };
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, "build");
    this.persist();
    this.notify();
    void this.submit({
      kind: "Build",
      entityId,
      blueprintId,
      clientCmdId,
      clientSeq: this.clientSeq,
      policy: "REPLACE_ACTIVE",
    });
  }

  /** Start an in-place, content-defined upgrade immediately. */
  handleUpgradeCommand(entityId: number, targetEntityTypeId: string) {
    const clientCmdId = uuidv7();
    this.clientSeq += 1;
    const state = this.getOrCreate(entityId);
    state.pendingMoves = [];
    state.active = { clientCmdId, entityId, kind: "upgrade" };
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, "upgrade");
    this.persist();
    this.notify();
    void this.submit({
      kind: "Upgrade",
      entityId,
      targetEntityTypeId,
      clientCmdId,
      clientSeq: this.clientSeq,
      policy: "REPLACE_ACTIVE",
    });
  }

  /** Start research at a content-defined research-capable entity. */
  handleResearchCommand(entityId: number, technologyId: string) {
    const clientCmdId = uuidv7();
    this.clientSeq += 1;
    const state = this.getOrCreate(entityId);
    state.pendingMoves = [];
    state.active = { clientCmdId, entityId, kind: "research" };
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, "research");
    this.persist(); this.notify();
    void this.submit({ kind: "Research", entityId, technologyId, clientCmdId, clientSeq: this.clientSeq, policy: "REPLACE_ACTIVE" });
  }

  /** Rehydrate authoritative action/route state; never replay local waypoints. */
  async reconcileWithServer(retryStale = true): Promise<ReconnectHandshake | null> {
    const generation = this.worldGeneration;
    const revision = this.stateRevision;
    let handshake: ReconnectHandshake;
    try {
      const response = await fetch("/api/v2/reconnect");
      if (!response.ok) return null;
      handshake = await response.json();
    } catch { return null; }
    if (generation !== this.worldGeneration && handshake.run_id !== this.runId) return null;
    if (handshake.run_id && handshake.run_id !== this.runId) this.resetForWorld(handshake.run_id);
    this.clientSeq = Math.max(this.clientSeq, handshake.last_processed_client_seq);
    if (revision !== this.stateRevision) {
      return retryStale && this.pendingCommands.size === 0 ? this.reconcileWithServer(false) : null;
    }
    const serverByEntity = new Map(handshake.active_intents.map((item) => [item.entity_id, item]));
    for (const id of new Set([...this.entities.keys()].map(Number).concat([...serverByEntity.keys()]))) {
      const state = this.getOrCreate(id);
      // An HTTP request may have enqueued a command that the engine has not
      // ingested yet. Keep its optimistic root until lifecycle/route delivery.
      if (state.active && this.pendingCommands.has(state.active.clientCmdId)) continue;
      const item = serverByEntity.get(id);
      if (!item) {
        const root = state.active?.clientCmdId;
        state.active = null;
        state.pendingMoves = state.pendingMoves.filter((item) => !item.finished && item.clientCmdId !== root);
        continue;
      }
      const kindName = item.intent_kind?.toLowerCase() ?? "unknown";
      const kind = ["convoy", "move", "collect", "build", "repair", "upgrade", "research", "deliver", "transport"].includes(kindName)
        ? kindName as ActiveIntentKind : "unknown";
      state.active = { entityId: id, clientCmdId: item.client_cmd_id, intentId: item.intent_id,
        serverTick: String(item.started_tick), kind,
        ...((kind === "move" || kind === "convoy") && item.move_target ? { target: item.move_target } : {}),
        ...(kind === "move" && item.move_route ? { route: item.move_route } : {}),
        ...(item.transfer_route ? { transfer: { donorId: item.transfer_route.donor_id,
          targetId: item.transfer_route.target_id, resourceTypeIds: item.transfer_route.resource_type_ids } } : {}),
      };
      if (kind !== "convoy") this.cmdToEntity.set(item.client_cmd_id, id);
      if (kind !== "unknown") this.cmdToKind.set(item.client_cmd_id, kind);
      this.retirePendingMoves(state, item.move_route?.last_client_cmd_id || item.client_cmd_id);
    }
    this.persist(); this.notify();
    return handshake;
  }

  /** Apply owner-filtered snapshot/delta routes, preserving newer local commands. */
  applyMoveOrders(orders: MoveOrderPayload[], removals: MoveOrderRemovalPayload[] = [], replace = false) {
    this.stateRevision++;
    if (replace) {
      const present = new Set(orders.map((order) => Number(order.entity_id)));
      for (const [id, state] of this.entities) {
        if (!present.has(Number(id)) && state.active?.kind === "move"
          && !this.pendingCommands.has(state.active.clientCmdId)) {
          const root = state.active.clientCmdId;
          state.active = null;
          state.pendingMoves = state.pendingMoves.filter((item) => !item.finished && item.clientCmdId !== root);
        }
      }
    }
    for (const removal of removals) {
      const state = this.entities.get(String(removal.entity_id));
      if (state?.active?.clientCmdId === removal.client_cmd_id) {
        state.active = null;
        this.pendingCommands.delete(removal.client_cmd_id);
        state.pendingMoves = state.pendingMoves.filter((item) => !item.finished && item.clientCmdId !== removal.client_cmd_id);
      }
    }
    for (const order of orders) {
      if (!order.route) continue;
      const state = this.getOrCreate(Number(order.entity_id));
      if (state.active && state.active.clientCmdId !== order.client_cmd_id
        && (this.pendingCommands.has(state.active.clientCmdId)
          || state.pendingMoves.some((item) => item.clientCmdId === state.active?.clientCmdId))) continue;
      state.active = { entityId: Number(order.entity_id), kind: "move",
        clientCmdId: order.client_cmd_id, intentId: order.intent_id, serverTick: String(order.started_tick),
        route: order.route, target: order.route.waypoints[order.route.next_waypoint_index] };
      this.cmdToEntity.set(order.client_cmd_id, Number(order.entity_id));
      this.cmdToKind.set(order.client_cmd_id, "move");
      this.retirePendingMoves(state, order.last_client_cmd_id || order.client_cmd_id);
    }
    this.persist(); this.notify();
  }

  onLifecycleEvent(event: { entityId?: number; routeEdit?: boolean; clientCmdId: string;
    intentId: string; playerId: string; serverTick: string; state: number; reason: number }) {
    this.stateRevision++;
    const command = this.pendingCommands.get(event.clientCmdId);
    const pendingEntity = this.cmdToEntity.get(event.clientCmdId);
    const pendingState = pendingEntity == null ? undefined : this.entities.get(String(pendingEntity));
    if (event.routeEdit) {
      if (event.state === LIFECYCLE_STATE_FINISHED) {
        const preview = pendingState?.pendingMoves.find((item) => item.clientCmdId === event.clientCmdId);
        if (preview) preview.finished = true;
      } else if (event.state === LIFECYCLE_STATE_REJECTED && pendingState) {
        pendingState.pendingMoves = pendingState.pendingMoves.filter((item) => item.clientCmdId !== event.clientCmdId);
      }
    } else {
      if (event.state === LIFECYCLE_STATE_ACCEPTED && command?.kind === "Move" && pendingState) {
        const newer = pendingState.active && this.pendingCommands.get(pendingState.active.clientCmdId);
        if (!newer || newer.clientSeq <= command.clientSeq) {
          pendingState.active = { entityId: command.entityId, kind: "move", clientCmdId: event.clientCmdId,
            intentId: event.intentId, serverTick: event.serverTick, target: command.target };
        }
      }
      for (const [id, state] of this.entities) {
        if (event.entityId && Number(id) !== event.entityId) continue;
        if (state.active?.clientCmdId !== event.clientCmdId) continue;
        if (event.state === LIFECYCLE_STATE_ACCEPTED) {
          state.active.intentId = event.intentId; state.active.serverTick = event.serverTick;
        } else if ([LIFECYCLE_STATE_FINISHED, LIFECYCLE_STATE_CANCELED, LIFECYCLE_STATE_REJECTED].includes(event.state)) {
          state.active = null;
          state.pendingMoves = state.pendingMoves.filter((item) => !item.finished && item.clientCmdId !== event.clientCmdId);
        }
      }
      if (event.state === LIFECYCLE_STATE_REJECTED && pendingState) {
        pendingState.pendingMoves = pendingState.pendingMoves.filter((item) => item.clientCmdId !== event.clientCmdId);
      }
    }
    if ([LIFECYCLE_STATE_ACCEPTED, LIFECYCLE_STATE_FINISHED, LIFECYCLE_STATE_CANCELED, LIFECYCLE_STATE_REJECTED].includes(event.state)) {
      this.pendingCommands.delete(event.clientCmdId);
    }
    this.persist(); this.notify();
    if (event.state === LIFECYCLE_STATE_REJECTED && !event.routeEdit) void this.reconcileWithServer();
  }

  private retirePendingMoves(state: PerEntityState, clientCmdId: string) {
    const index = state.pendingMoves.findIndex((item) => item.clientCmdId === clientCmdId);
    if (index >= 0) {
      for (const item of state.pendingMoves.splice(0, index + 1)) this.pendingCommands.delete(item.clientCmdId);
    }
  }

  getMigrationNotice() { return this.migrationNotice; }
  dismissMigrationNotice() { this.migrationNotice = null; this.persist(); this.notify(); }
  whenSubmitted() { return this.submissionTail; }

  /** All command kinds share the same sequence-ordered HTTP submission chain. */
  private submit(params: SendIntentParams): Promise<void> {
    const generation = this.worldGeneration;
    const callback = this.sendCallback;
    this.pendingCommands.set(params.clientCmdId, params);
    this.stateRevision++;
    const send = async () => {
      if (generation !== this.worldGeneration) return;
      try {
        if (!callback) throw new Error("Intent transport is unavailable");
        await callback(params);
      } catch {
        if (generation !== this.worldGeneration) return;
        this.pendingCommands.delete(params.clientCmdId);
        const ids = params.kind === "Convoy" ? params.entityIds : [params.entityId];
        for (const id of ids) {
          const state = this.getOrCreate(id);
          state.pendingMoves = state.pendingMoves.filter((item) => item.clientCmdId !== params.clientCmdId);
        }
        this.persist(); this.notify();
        // Acceptance may have happened before the HTTP connection failed.
        void this.reconcileWithServer();
      }
    };
    this.submissionTail = this.submissionTail.then(send, send);
    return this.submissionTail;
  }

  // ── Accessors ──────────────────────────────────────────────────────────

  getEntityState(entityId: number): PerEntityState {
    return this.getOrCreate(entityId);
  }

  getAllEntityStates(): Map<string, PerEntityState> {
    return this.entities;
  }

  getClientSeq(): number {
    return this.clientSeq;
  }

  getEntityIdForClientCmd(clientCmdId: string): number | null {
    const v = this.cmdToEntity.get(clientCmdId);
    return typeof v === "number" ? v : null;
  }

  getKindForClientCmd(clientCmdId: string): "convoy" | "move" | "collect" | "build" | "upgrade" | "repair" | "research" | "deliver" | "transport" | null {
    return this.cmdToKind.get(clientCmdId) ?? null;
  }

  /** Entity IDs with an active order or pending waypoint preview. */
  getActiveEntityIds(): number[] {
    const ids: number[] = [];
    for (const [key, state] of this.entities) {
      if (state.active || state.pendingMoves.length > 0) {
        ids.push(Number(key));
      }
    }
    return ids;
  }

  /** Remaining authoritative destinations plus unsatisfied edit previews. */
  getWaypoints(entityId: number): Array<{ x: number; y: number; active: boolean; pending: boolean }> {
    const state = this.entities.get(String(entityId));
    if (!state) return [];
    let out: Array<{ x: number; y: number; active: boolean; pending: boolean }> = [];
    if (state.active?.kind === "move" && state.active.route) {
      out = state.active.route.waypoints.slice(state.active.route.next_waypoint_index)
        .map((point, index) => ({ ...point, active: index === 0, pending: false }));
    } else if ((state.active?.kind === "move" || state.active?.kind === "convoy") && state.active.target) {
      out = [{ ...state.active.target, active: true, pending: false }];
    }
    for (const command of state.pendingMoves) {
      if (command.policy === "REPLACE_ACTIVE") out = [];
      else if (command.policy === "CLEAR_THEN_APPEND") out = out.slice(0, 1);
      out.push({ ...command.target, active: out.length === 0, pending: true });
    }
    return out;
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private getOrCreate(entityId: number): PerEntityState {
    const key = String(entityId);
    let state = this.entities.get(key);
    if (!state) {
      state = { pendingMoves: [], active: null };
      this.entities.set(key, state);
    }
    return state;
  }

  private async sendCollectNow(
    entityId: number,
    clientCmdId: string,
    assignment: { resourceTypeId?: string; nearestCompatible: boolean },
    policy: IntentPolicyName,
  ) {
    const state = this.getOrCreate(entityId);
    // Collection replaces the move plan; subsequent Move edits are validated
    // by the server against this maintained order.
    if (policy === "REPLACE_ACTIVE" || policy === "CLEAR_THEN_APPEND") {
      state.pendingMoves = [];
    }
    this.clientSeq++;
    this.cmdToEntity.set(clientCmdId, entityId);
    this.cmdToKind.set(clientCmdId, "collect");
    state.active = { clientCmdId, entityId, kind: "collect" };
    this.persist();
    this.notify();
    if (!this.sendCallback) return;
    try {
      await this.submit({
        kind: "Collect",
        entityId,
        resourceTypeId: assignment.resourceTypeId,
        nearestCompatible: assignment.nearestCompatible,
        clientCmdId,
        clientSeq: this.clientSeq,
        policy,
      });
    } catch (err) {
      console.error("[IntentQueue] send collect failed", err);
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      try { listener(); } catch { /* ignore */ }
    }
  }

  private persist() {
    try {
      const data: PersistedState = { schemaVersion: 2, migrationNotice: this.migrationNotice,
        clientSeq: this.clientSeq, runId: this.runId,
        entities: Object.fromEntries([...this.entities].map(([id, state]) =>
          [id, { active: state.active, pendingMoves: [] }])) };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch { /* SSR guard / quota exceeded */ }
  }

  private restore() {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as PersistedState;
      this.clientSeq = data.clientSeq || 0;
      this.runId = data.runId || "";
      this.migrationNotice = data.migrationNotice ?? null;
      if (data.schemaVersion !== 2 && Object.values(data.entities || {}).some((state) =>
        ((state as unknown as { queue?: unknown[] }).queue?.length ?? 0) > 0)) {
        this.migrationNotice = "Saved waypoints were cleared during this update. Reissue any remaining destinations.";
      }
      this.entities = new Map(Object.entries(data.entities || {}).map(([id, state]) =>
        [id, { active: state.active ?? null, pendingMoves: [] }]));
      this.persist();
    } catch { /* Ignore corrupt browser storage; reconnect restores server state. */ }
  }

}

// ── Module singleton (like `game` in world.ts) ────────────────────────────

export const intentQueue = new IntentQueueManager();
