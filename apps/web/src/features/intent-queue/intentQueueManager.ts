/**
 * Client-Side Intent Queue Manager (M1 + M2)
 *
 * Maintains per-player, per-entity FIFO queues persisted to localStorage.
 * The server only tracks one active intent per entity; the client decides
 * when to send the next intent (typically on FINISHED / CANCELED).
 *
 * Policies:
 *  - Click          = REPLACE_ACTIVE  (clear local queue, send immediately)
 *  - Shift+Click    = APPEND          (append locally; send only if entity idle)
 *  - Ctrl+Click     = CLEAR_THEN_APPEND (clear queue, append one; send if idle)
 *
 * M2 additions:
 *  - reconcileWithServer(): call on reconnect to sync local queue state with
 *    the server's tracking data (last_processed_client_seq, active intents).
 *    Prevents duplicate or skipped intents after a page refresh or disconnect.
 */

import { v7 as uuidv7 } from "uuid";

// ── Types ──────────────────────────────────────────────────────────────────

export type IntentPolicyName = "REPLACE_ACTIVE" | "APPEND" | "CLEAR_THEN_APPEND";

export type QueuedMoveIntent = {
  clientCmdId: string;
  entityId: number;
  target: { x: number; y: number };
  policy: IntentPolicyName;
  createdAt: number;
};

export type ActiveIntentInfo = {
  clientCmdId: string;
  entityId: number;
  target: { x: number; y: number };
  intentId?: string;      // server-assigned, set on ACCEPTED
  serverTick?: string;    // set on ACCEPTED
};

export type PerEntityState = {
  queue: QueuedMoveIntent[];
  active: ActiveIntentInfo | null;
};

type PersistedState = {
  clientSeq: number;
  entities: Record<string, PerEntityState>;
};

export type SendIntentParams = {
  entityId: number;
  target: { x: number; y: number };
  clientCmdId: string;
  clientSeq: number;
  policy: IntentPolicyName;
};

type SendCallback = (params: SendIntentParams) => Promise<void>;
type StateChangeListener = () => void;

// ── M2: Reconnect handshake response shape ─────────────────────────────────

export type ReconnectHandshake = {
  server_tick: number;
  protocol_version: number;
  last_processed_client_seq: number;
  active_intents: Array<{
    entity_id: number;
    intent_id: string;
    client_cmd_id: string;
    player_id: string;
    started_tick: number;
  }>;
};

// ── Lifecycle state / reason numeric values (matches proto enum) ───────────

const LIFECYCLE_STATE_ACCEPTED   = 2;
const LIFECYCLE_STATE_FINISHED   = 5;
const LIFECYCLE_STATE_CANCELED   = 6;
const LIFECYCLE_STATE_REJECTED   = 7;

const LIFECYCLE_REASON_ENTITY_BUSY = 7;

// ── Manager ────────────────────────────────────────────────────────────────

class IntentQueueManager {
  private clientSeq = 0;
  private entities = new Map<string, PerEntityState>();
  private storageKey: string;
  private sendCallback: SendCallback | null = null;
  private listeners = new Set<StateChangeListener>();

  constructor(storageKey = "bitwars:intent-queue") {
    this.storageKey = storageKey;
    this.restore();
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

  /**
   * Handle a move command issued by user input.
   * Applies the policy, updates the local queue, and sends if appropriate.
   */
  handleMoveCommand(
    entityId: number,
    target: { x: number; y: number },
    modifiers: { shift: boolean; ctrl: boolean },
  ) {
    const policy: IntentPolicyName = modifiers.ctrl
      ? "CLEAR_THEN_APPEND"
      : modifiers.shift
        ? "APPEND"
        : "REPLACE_ACTIVE";

    const clientCmdId = uuidv7();
    const state = this.getOrCreate(entityId);

    if (policy === "REPLACE_ACTIVE") {
      // Clear local queue and send immediately (preempt).
      state.queue = [];
      this.sendIntentNow(entityId, clientCmdId, target, policy);
    } else if (policy === "CLEAR_THEN_APPEND") {
      // Clear local queue, add one item, send only if entity idle.
      state.queue = [];
      if (!state.active) {
        this.sendIntentNow(entityId, clientCmdId, target, policy);
      } else {
        state.queue.push({ clientCmdId, entityId, target, policy, createdAt: Date.now() });
        this.persist();
        this.notify();
      }
    } else {
      // APPEND: add to local queue, send only if entity idle.
      if (!state.active) {
        this.sendIntentNow(entityId, clientCmdId, target, policy);
      } else {
        state.queue.push({ clientCmdId, entityId, target, policy, createdAt: Date.now() });
        this.persist();
        this.notify();
      }
    }
  }

  /**
   * M2: Reconcile local queue state with the server after a reconnect.
   *
   * Fetches the reconnect handshake from the server and:
   * 1. Advances clientSeq to at least last_processed_client_seq so future
   *    intents won't be rejected as out-of-order.
   * 2. For each entity, syncs the local "active" slot with the server's view:
   *    - If the server has an active intent whose client_cmd_id matches our
   *      local active, keep it (server is still working on it).
   *    - If the server has an active intent we don't know about, mark it
   *      locally so we don't send another until it finishes.
   *    - If the server has no active intent but we do, our active was lost
   *      (server restarted, intent finished while we were away, etc.) —
   *      clear it and drain the queue.
   * 3. For any entity that is now idle with queued intents, sends the next.
   *
   * Returns the handshake payload for callers that need server_tick /
   * protocol_version, or null if the fetch failed.
   */
  async reconcileWithServer(): Promise<ReconnectHandshake | null> {
    let handshake: ReconnectHandshake;
    try {
      const resp = await fetch("/api/v2/reconnect");
      if (!resp.ok) {
        console.warn("[IntentQueue] reconnect handshake failed:", resp.status);
        return null;
      }
      handshake = await resp.json();
    } catch (err) {
      console.warn("[IntentQueue] reconnect handshake error:", err);
      return null;
    }

    // 1. Advance clientSeq so future sends aren't rejected as out-of-order
    if (handshake.last_processed_client_seq > this.clientSeq) {
      console.log(
        `[IntentQueue] advancing clientSeq ${this.clientSeq} -> ${handshake.last_processed_client_seq}`
      );
      this.clientSeq = handshake.last_processed_client_seq;
    }

    // Build a lookup of server-side active intents by entity_id
    const serverActiveByEntity = new Map<number, (typeof handshake.active_intents)[0]>();
    for (const ai of handshake.active_intents) {
      serverActiveByEntity.set(ai.entity_id, ai);
    }

    // 2. Reconcile each entity's active slot
    const entitiesToDrain: number[] = [];

    // Check entities we know about locally
    for (const [entityIdStr, entityState] of this.entities) {
      const entityId = Number(entityIdStr);
      const serverActive = serverActiveByEntity.get(entityId);
      serverActiveByEntity.delete(entityId); // mark as handled

      if (entityState.active) {
        if (serverActive && serverActive.client_cmd_id === entityState.active.clientCmdId) {
          // Server is still executing our active intent — keep it, update intentId if needed
          if (serverActive.intent_id && !entityState.active.intentId) {
            entityState.active.intentId = serverActive.intent_id;
          }
        } else if (serverActive) {
          // Server has a different active intent for this entity (shouldn't happen
          // normally, but could if another client controls the same entity).
          // Replace our local active with the server's view.
          entityState.active = {
            clientCmdId: serverActive.client_cmd_id,
            entityId,
            target: { x: 0, y: 0 }, // target unknown from handshake; will be overwritten on FINISHED
            intentId: serverActive.intent_id,
            serverTick: String(serverActive.started_tick),
          };
        } else {
          // Server has no active intent — ours was lost. Clear and drain.
          entityState.active = null;
          entitiesToDrain.push(entityId);
        }
      } else {
        // We have no local active
        if (serverActive) {
          // Server has one we didn't know about — mark busy so we don't send
          entityState.active = {
            clientCmdId: serverActive.client_cmd_id,
            entityId,
            target: { x: 0, y: 0 },
            intentId: serverActive.intent_id,
            serverTick: String(serverActive.started_tick),
          };
        } else {
          // Both agree: idle. Drain queue if anything is queued.
          if (entityState.queue.length > 0) {
            entitiesToDrain.push(entityId);
          }
        }
      }
    }

    // Handle server-active entities we didn't have locally at all
    for (const [entityId, serverActive] of serverActiveByEntity) {
      const entityState = this.getOrCreate(entityId);
      entityState.active = {
        clientCmdId: serverActive.client_cmd_id,
        entityId,
        target: { x: 0, y: 0 },
        intentId: serverActive.intent_id,
        serverTick: String(serverActive.started_tick),
      };
    }

    this.persist();
    this.notify();

    // 3. Drain queues for entities that are now idle
    for (const entityId of entitiesToDrain) {
      await this.sendNextFromQueue(entityId);
    }

    return handshake;
  }

  /**
   * Called when a lifecycle SSE event arrives.
   * Drives queue draining: on FINISHED / CANCELED for the active intent,
   * sends the next queued intent.
   */
  onLifecycleEvent(event: {
    clientCmdId: string;
    intentId: string;
    playerId: string;
    serverTick: string;
    state: number;
    reason: number;
  }) {
    for (const [entityIdStr, entityState] of this.entities) {
      if (entityState.active?.clientCmdId !== event.clientCmdId) continue;

      if (event.state === LIFECYCLE_STATE_ACCEPTED) {
        // Reconciliation: record server-assigned intentId + tick
        entityState.active!.intentId = event.intentId;
        entityState.active!.serverTick = event.serverTick;
        this.persist();
        this.notify();
        return;
      }

      if (event.state === LIFECYCLE_STATE_FINISHED || event.state === LIFECYCLE_STATE_CANCELED) {
        // Intent completed — clear active, send next from queue.
        entityState.active = null;
        this.persist();
        this.notify();
        this.sendNextFromQueue(Number(entityIdStr));
        return;
      }

      if (event.state === LIFECYCLE_STATE_REJECTED) {
        // Rejected — clear active.
        entityState.active = null;
        // For ENTITY_BUSY keep queue intact (retry when idle).
        // For other rejections, clear queue as the server disagrees.
        if (event.reason !== LIFECYCLE_REASON_ENTITY_BUSY) {
          entityState.queue = [];
        }
        this.persist();
        this.notify();
        return;
      }

      // Other states (RECEIVED, IN_PROGRESS, BLOCKED) — informational, no action.
      return;
    }
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

  /** Returns all entity IDs that have active or queued intents. */
  getActiveEntityIds(): number[] {
    const ids: number[] = [];
    for (const [key, state] of this.entities) {
      if (state.active || state.queue.length > 0) {
        ids.push(Number(key));
      }
    }
    return ids;
  }

  /** Get all waypoint targets for an entity (active + queued), in order. */
  getWaypoints(entityId: number): Array<{ x: number; y: number; active: boolean }> {
    const state = this.entities.get(String(entityId));
    if (!state) return [];
    const out: Array<{ x: number; y: number; active: boolean }> = [];
    if (state.active) {
      out.push({ ...state.active.target, active: true });
    }
    for (const q of state.queue) {
      out.push({ ...q.target, active: false });
    }
    return out;
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private getOrCreate(entityId: number): PerEntityState {
    const key = String(entityId);
    let state = this.entities.get(key);
    if (!state) {
      state = { queue: [], active: null };
      this.entities.set(key, state);
    }
    return state;
  }

  private async sendIntentNow(
    entityId: number,
    clientCmdId: string,
    target: { x: number; y: number },
    policy: IntentPolicyName,
  ) {
    const state = this.getOrCreate(entityId);
    this.clientSeq++;
    state.active = { clientCmdId, entityId, target };
    this.persist();
    this.notify();

    if (this.sendCallback) {
      try {
        await this.sendCallback({
          entityId,
          target,
          clientCmdId,
          clientSeq: this.clientSeq,
          policy,
        });
      } catch (err) {
        console.error("[IntentQueue] send failed", err);
      }
    }
  }

  private async sendNextFromQueue(entityId: number) {
    const state = this.getOrCreate(entityId);
    if (state.queue.length === 0) return;

    const next = state.queue.shift()!;
    // Queued items use APPEND when sent (entity should now be idle).
    await this.sendIntentNow(entityId, next.clientCmdId, next.target, "APPEND");
  }

  private notify() {
    for (const listener of this.listeners) {
      try { listener(); } catch { /* ignore */ }
    }
  }

  private persist() {
    try {
      const data: PersistedState = {
        clientSeq: this.clientSeq,
        entities: Object.fromEntries(this.entities),
      };
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
      this.entities = new Map(Object.entries(data.entities || {}));
    } catch { /* ignore corrupted data */ }
  }
}

// ── Module singleton (like `game` in world.ts) ────────────────────────────

export const intentQueue = new IntentQueueManager();
