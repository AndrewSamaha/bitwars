import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { ObservationJournal, type PlayerChange } from "./observationJournal.js";

export type GameEntity = {
  id: number | string;
  owner_player_id?: string;
  entity_type_id?: string;
  pos?: { x: number; y: number };
  [key: string]: unknown;
};

export type PlayerEvent = {
  cursor: number;
  event: string;
  id?: string;
  received_at_ms: number;
  bytes: number;
  data: unknown;
};

export type CommandStatus = {
  client_cmd_id: string;
  run_id: string;
  entity_id: number;
  intent_type: IntentInput["type"];
  client_seq: number;
  accepted_http: boolean;
  http_status: number;
  lifecycle_state?: number;
  lifecycle_reason?: number;
  intent_id?: string;
  server_tick?: string;
  terminal: boolean;
  updated_at_ms: number;
};

export type GameplayEvent = {
  event_id: string;
  event_type: string;
  server_tick: number;
  occurred_at_ms: number;
  victim: { entity_id: number; entity_type_id: string; owner_player_id: string };
  attacker?: { entity_id: number; entity_type_id: string; owner_player_id: string };
  cause: string;
};

export type GameplayEventBatch = { events: GameplayEvent[]; next_cursor: string; has_more: boolean };

export type CollectorState = Record<string, unknown> & { entity_id: number | string };

export type ProgressFallbackDiagnostic = {
  time_ms: number;
  player_id?: string;
  watched_entity_ids: string[];
  watch_age_ms: number;
  silence_ms: number;
  stream_silence_ms: number;
  last_stream_tick: number;
  last_stream_source_time_ms: number;
  last_stream_state_count: number;
  response_status?: number;
  returned_state_count?: number;
  request_ms?: number;
  error?: string;
};

export type WaitCondition =
  | { type: "command_terminal"; client_cmd_id: string }
  | { type: "command_state"; client_cmd_id: string; state: number }
  | { type: "entity_type_count"; entity_type_id: string; at_least: number }
  | { type: "collector_activity"; entity_id: number; activity: string; resource_type_id?: string }
  | { type: "resource_at_least"; entity_id: number; resource_type_id: string; amount: number };

export type IntentInput =
  | { type: "Resupply"; entity_id: number; depot_id: number; target_amounts: Record<string, number>; policy?: string }
  | { type: "Move"; entity_id: number; target: { x: number; y: number }; policy?: string }
  | { type: "Build"; entity_id: number; blueprint_id: string; policy?: string }
  | { type: "Upgrade"; entity_id: number; target_entity_type_id: string; policy?: string }
  | { type: "Research"; entity_id: number; technology_id: string; policy?: string }
  | { type: "Collect"; entity_id: number; resource_type_id?: string; nearest_compatible?: boolean; policy?: string }
  | { type: "Repair"; entity_id: number; target_id: number; policy?: string }
  | { type: "Deliver" | "Transport"; entity_id: number; target_id: number; donor_id?: number; resource_type_ids: string[]; policy?: string };

type Session = {
  handle: string;
  username: string;
  cookie: string;
  playerId?: string;
  runId?: string;
  clientSeq: number;
  tick?: number | string;
  connected: boolean;
  snapshotSeen: boolean;
  handshakeSeen: boolean;
  closed: boolean;
  sending: boolean;
  generation: number;
  entities: Map<string, GameEntity>;
  collectorStates: Map<string, CollectorState>;
  commands: Map<string, CommandStatus>;
  pendingLifecycles: Map<string, Record<string, unknown>[]>;
  resyncRecordedGeneration: number;
  journal?: ObservationJournal;
  historyComplete: boolean;
  activeIntents: unknown[];
  progress: Record<string, unknown>;
  progressStreamStates: Record<string, unknown>;
  progressStreamRunId: string;
  progressStreamTick: number;
  lastProgressStreamAt: number;
  lastAnyStreamAt: number;
  lastProgressSourceTimeMs: number;
  progressStreamEvents: number;
  progressStreamBytes: number;
  watchIds: string[];
  progressWatchChangedAt: number;
  events: PlayerEvent[];
  eventBytes: number;
  nextCursor: number;
  droppedEvents: number;
  streamBytes: number;
  progressRequests: number;
  progressBytes: number;
  progressFallbacks: ProgressFallbackDiagnostic[];
  progressPending: boolean;
  reconnects: number;
  lastError?: string;
  abort?: AbortController;
  progressTimer?: ReturnType<typeof setInterval>;
  wake: Set<() => void>;
};

type GatewayOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  maxPlayers?: number;
  maxEvents?: number;
  maxEventBytes?: number;
  progressIntervalMs?: number;
  reconnectDelayMs?: number;
  journalDir?: string;
};

function uuidV7(): string {
  const bytes = randomBytes(16);
  let time = BigInt(Date.now());
  for (let index = 5; index >= 0; index--) {
    bytes[index] = Number(time & 0xffn);
    time >>= 8n;
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function entity(value: unknown): GameEntity | undefined {
  const data = object(value);
  if (!data || (typeof data.id !== "number" && typeof data.id !== "string")) return undefined;
  return data as GameEntity;
}

function collectorState(value: unknown): CollectorState | undefined {
  const data = object(value);
  return data && (typeof data.entity_id === "number" || typeof data.entity_id === "string")
    ? data as CollectorState : undefined;
}

const TERMINAL_LIFECYCLE_STATES = new Set([5, 6, 7]);

function parseSseFrame(frame: string): { event: string; id?: string; data: unknown } | undefined {
  let event = "message";
  let id: string | undefined;
  const lines: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const separator = line.indexOf(":");
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? "" : line.slice(separator + 1).replace(/^ /, "");
    if (field === "event") event = value;
    if (field === "id") id = value;
    if (field === "data") lines.push(value);
  }
  if (lines.length === 0) return undefined;
  const raw = lines.join("\n");
  let data: unknown = raw;
  try { data = JSON.parse(raw); } catch { /* An SSE payload need not be JSON. */ }
  return { event, id, data };
}

export class PlayerGateway {
  private readonly sessions = new Map<string, Session>();
  private readonly baseUrl: URL;
  private readonly fetchImpl: typeof fetch;
  private readonly maxPlayers: number;
  private readonly maxEvents: number;
  private readonly maxEventBytes: number;
  private readonly progressIntervalMs: number;
  private readonly reconnectDelayMs: number;
  private readonly journalDir: string;

  constructor(options: GatewayOptions) {
    this.baseUrl = new URL(options.baseUrl);
    if (!["http:", "https:"].includes(this.baseUrl.protocol)) throw new Error("baseUrl must use HTTP(S)");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxPlayers = options.maxPlayers ?? 200;
    this.maxEvents = options.maxEvents ?? 256;
    this.maxEventBytes = options.maxEventBytes ?? 2_000_000;
    this.progressIntervalMs = options.progressIntervalMs ?? 500;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 500;
    this.journalDir = options.journalDir ?? resolve(process.cwd(), ".player-journal");
  }

  private request(session: Session, path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetchImpl(new URL(path, this.baseUrl), {
      ...init,
      headers: { Cookie: session.cookie, ...init.headers },
    });
  }

  async getGameplayEvents(handle: string, after: string): Promise<GameplayEventBatch> {
    const response = await this.request(this.required(handle),
      `/api/v2/gameplay-events?after=${encodeURIComponent(after)}`, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`gameplay events request failed: HTTP ${response.status}`);
    return await response.json() as GameplayEventBatch;
  }

  private required(handle: string): Session {
    const session = this.sessions.get(handle);
    if (!session || session.closed) throw new Error("unknown or closed player handle");
    return session;
  }

  private ensureJournal(session: Session, runId: string): void {
    if (session.runId !== runId) {
      session.commands.clear();
      session.pendingLifecycles.clear();
      session.activeIntents = [];
      session.collectorStates.clear();
      session.journal = undefined;
      session.historyComplete = true;
    }
    if (session.journal) return;
    try {
      session.journal = new ObservationJournal(this.journalDir, session.username, runId);
      for (const change of session.journal.all()) {
        const command = object(change.data.command) as CommandStatus | undefined;
        if (command?.client_cmd_id) session.commands.set(command.client_cmd_id, command);
      }
      session.journal.append({
        run_id: runId, kind: "resync", received_at_ms: Date.now(),
        data: { reason: session.journal.recoveredIncompleteRow ? "incomplete_journal_row" : "mcp_session_started" },
      });
    } catch (error) {
      session.historyComplete = false;
      session.lastError = `observation journal: ${String(error)}`;
    }
  }

  private appendChange(session: Session, kind: PlayerChange["kind"], data: Record<string, unknown>): void {
    if (!session.runId || !session.journal) return;
    try {
      session.journal.append({
        run_id: session.runId, tick: session.tick, kind,
        received_at_ms: Date.now(), data,
      });
    } catch (error) {
      session.historyComplete = false;
      session.lastError = `observation journal: ${String(error)}`;
    }
    this.wake(session);
  }

  private setActiveIntent(session: Session, command: CommandStatus): void {
    if (command.lifecycle_state === 1) return;
    const active = session.activeIntents.filter(item => {
      const intent = object(item);
      return command.terminal
        ? intent?.client_cmd_id !== command.client_cmd_id
        : intent?.entity_id !== command.entity_id;
    });
    if (!command.terminal) {
      active.push({
        entity_id: command.entity_id, intent_id: command.intent_id,
        client_cmd_id: command.client_cmd_id, player_id: session.playerId,
        started_tick: command.server_tick, intent_kind: command.intent_type.toLowerCase(),
      });
    }
    session.activeIntents = active;
  }

  private applyLifecycle(session: Session, data: Record<string, unknown>): void {
    const commandId = data.clientCmdId;
    if (typeof commandId !== "string") return;
    const previous = session.commands.get(commandId);
    if (!previous) {
      session.pendingLifecycles.set(commandId, [...(session.pendingLifecycles.get(commandId) ?? []), data]);
      return;
    }
    const state = Number(data.state);
    const command: CommandStatus = {
      ...previous, lifecycle_state: state, lifecycle_reason: Number(data.reason),
      intent_id: String(data.intentId ?? ""), server_tick: String(data.serverTick ?? ""),
      terminal: TERMINAL_LIFECYCLE_STATES.has(state), updated_at_ms: Date.now(),
    };
    session.commands.set(commandId, command);
    this.setActiveIntent(session, command);
    this.appendChange(session, "lifecycle", { command, lifecycle: data });
  }

  async connectPlayer(username: string): Promise<{ handle: string; status: ReturnType<PlayerGateway["getPlayerState"]> }> {
    if (this.sessions.size >= this.maxPlayers) throw new Error("player limit reached");
    if (!/^(?:loadtest|agent)-[a-zA-Z0-9_-]{1,48}$/.test(username)) {
      throw new Error("test usernames must start with loadtest- or agent- and use only letters, digits, _ or -");
    }
    if ([...this.sessions.values()].some(session => session.username === username)) {
      throw new Error("test username is already connected");
    }
    const login = await this.fetchImpl(new URL("/api/players/login", this.baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: username, color: "" }),
    });
    if (!login.ok) throw new Error(`login failed: HTTP ${login.status}`);
    const cookie = login.headers.get("set-cookie")?.match(/(?:^|,\s*)player_token=([^;]+)/)?.[1];
    if (!cookie) throw new Error("login returned no player_token cookie");
    // Recheck after the network await: concurrent calls may have used the same name.
    if (this.sessions.size >= this.maxPlayers) throw new Error("player limit reached");
    if ([...this.sessions.values()].some(session => session.username === username)) {
      throw new Error("test username is already connected");
    }
    const handle = randomBytes(24).toString("hex");
    const session: Session = {
      handle, username, cookie: `player_token=${cookie}`, clientSeq: 0,
      connected: false, snapshotSeen: false, handshakeSeen: false,
      closed: false, sending: false, generation: 0, entities: new Map(),
      collectorStates: new Map(), commands: new Map(), pendingLifecycles: new Map(), resyncRecordedGeneration: 0, historyComplete: true,
      activeIntents: [], progress: {}, progressStreamStates: {}, progressStreamRunId: "",
      progressStreamTick: -1, lastProgressStreamAt: 0, lastAnyStreamAt: 0, lastProgressSourceTimeMs: 0, progressStreamEvents: 0,
      progressStreamBytes: 0, watchIds: [], progressWatchChangedAt: 0, events: [], eventBytes: 0,
      nextCursor: 1, droppedEvents: 0, streamBytes: 0, progressRequests: 0,
      progressBytes: 0, progressFallbacks: [], progressPending: false, reconnects: 0, wake: new Set(),
    };
    this.sessions.set(handle, session);
    session.progressTimer = setInterval(() => { void this.pollProgress(session); }, this.progressIntervalMs);
    void this.streamLoop(session);
    return { handle, status: this.getPlayerState(handle) };
  }

  private async handshake(session: Session, generation: number): Promise<void> {
    const response = await this.request(session, "/api/v2/reconnect");
    if (!response.ok) throw new Error(`reconnect handshake failed: HTTP ${response.status}`);
    const data = object(await response.json());
    if (!data || session.closed || session.generation !== generation) return;
    const handshakeRunId = String(data.run_id ?? "");
    if (session.runId && handshakeRunId && session.runId !== handshakeRunId) {
      // A snapshot from a newer run won the race. Reopen and handshake again.
      session.abort?.abort();
      return;
    }
    if (handshakeRunId) this.ensureJournal(session, handshakeRunId);
    session.runId = handshakeRunId || session.runId;
    session.playerId = typeof data.player_id === "string" ? data.player_id : session.playerId;
    session.clientSeq = Math.max(session.clientSeq, Number(data.last_processed_client_seq) || 0);
    session.activeIntents = Array.isArray(data.active_intents) ? data.active_intents : [];
    for (const value of session.activeIntents) {
      const active = object(value);
      const commandId = active?.client_cmd_id;
      if (typeof commandId !== "string") continue;
      const command = session.commands.get(commandId);
      if (command) session.commands.set(commandId, {
        ...command, lifecycle_state: 3, terminal: false, updated_at_ms: Date.now(),
      });
    }
    session.handshakeSeen = true;
    this.wake(session);
  }

  private async streamLoop(session: Session): Promise<void> {
    while (!session.closed) {
      const generation = ++session.generation;
      session.snapshotSeen = false;
      session.handshakeSeen = false;
      session.connected = false;
      const abort = new AbortController();
      session.abort = abort;
      try {
        const response = await this.request(session, "/api/v2/gamestate/stream", {
          headers: { Accept: "text/event-stream" }, signal: abort.signal,
        });
        if (!response.ok || !response.body) throw new Error(`SSE failed: HTTP ${response.status}`);
        session.connected = true;
        session.lastProgressStreamAt = Date.now();
        session.lastAnyStreamAt = session.lastProgressStreamAt;
        this.wake(session);
        const handshake = this.handshake(session, generation).catch(error => {
          session.lastError = String(error);
          abort.abort();
        });
        await this.consumeSse(session, response.body);
        await handshake;
      } catch (error) {
        if (!session.closed && !abort.signal.aborted) session.lastError = String(error);
      } finally {
        abort.abort();
        session.connected = false;
        session.lastProgressStreamAt = 0;
        this.wake(session);
      }
      if (!session.closed) {
        session.reconnects++;
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelayMs));
      }
    }
  }

  private async consumeSse(session: Session, body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    try {
      while (!session.closed) {
        const { value, done } = await reader.read();
        if (done) break;
        session.streamBytes += value.byteLength;
        pending += decoder.decode(value, { stream: true });
        let boundary: RegExpExecArray | null;
        while ((boundary = /\r?\n\r?\n/.exec(pending))) {
          const frame = pending.slice(0, boundary.index);
          pending = pending.slice(boundary.index + boundary[0].length);
          const parsed = parseSseFrame(frame);
          if (parsed) this.acceptEvent(session, parsed, Buffer.byteLength(frame));
        }
        if (pending.length > 4_000_000) throw new Error("SSE frame exceeds 4 MB");
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  }

  private acceptEvent(session: Session, event: { event: string; id?: string; data: unknown }, bytes: number): void {
    session.lastAnyStreamAt = Date.now();
    const data = object(event.data);
    if (event.event === "snapshot" && data) {
      const incomingRunId = typeof data.run_id === "string" ? data.run_id : undefined;
      if (session.runId && incomingRunId && session.runId !== incomingRunId) {
        session.handshakeSeen = false;
        session.clientSeq = 0;
        void this.handshake(session, session.generation).catch(error => {
          session.lastError = String(error);
          session.abort?.abort();
        });
      }
      if (incomingRunId) this.ensureJournal(session, incomingRunId);
      session.runId = incomingRunId ?? session.runId;
      session.tick = data.tick as number | string | undefined;
      if (session.reconnects > 0 && session.resyncRecordedGeneration !== session.generation) {
        this.appendChange(session, "resync", { reason: "stream_reconnected", generation: session.generation });
        session.resyncRecordedGeneration = session.generation;
      }
      session.entities.clear();
      session.collectorStates.clear();
      for (const item of Array.isArray(data.entities) ? data.entities : []) {
        const parsed = entity(item);
        if (parsed) session.entities.set(String(parsed.id), parsed);
      }
      for (const item of Array.isArray(data.collector_states) ? data.collector_states : []) {
        const parsed = collectorState(item);
        if (parsed) session.collectorStates.set(String(parsed.entity_id), parsed);
      }
      session.snapshotSeen = true;
    } else if (event.event === "delta" && data) {
      session.tick = data.tick as number | string | undefined;
      for (const id of Array.isArray(data.removed_entity_ids) ? data.removed_entity_ids : []) {
        const previous = session.entities.get(String(id));
        if (previous?.owner_player_id === session.playerId) this.appendChange(session, "entity_removed", { entity_id: id });
        session.entities.delete(String(id));
        session.collectorStates.delete(String(id));
      }
      for (const id of Array.isArray(data.hidden_entity_ids) ? data.hidden_entity_ids : []) {
        session.entities.delete(String(id));
        session.collectorStates.delete(String(id));
      }
      for (const item of Array.isArray(data.updates) ? data.updates : []) {
        const update = entity(item);
        if (!update) continue;
        const previous = session.entities.get(String(update.id));
        const merged = { ...previous, ...update };
        session.entities.set(String(update.id), merged);
        if (!previous && merged.owner_player_id === session.playerId) {
          this.appendChange(session, "entity_created", { entity: merged });
        }
      }
      for (const item of Array.isArray(data.collector_state_updates) ? data.collector_state_updates : []) {
        const update = collectorState(item);
        if (!update) continue;
        const id = String(update.entity_id);
        const previous = session.collectorStates.get(id);
        const merged = { ...previous, ...update };
        session.collectorStates.set(id, merged);
        if (session.entities.get(id)?.owner_player_id === session.playerId &&
            JSON.stringify(previous) !== JSON.stringify(merged)) {
          this.appendChange(session, "collector_state", { collector_state: merged });
        }
      }
    } else if (event.event === "lifecycle" && data && data.playerId === session.playerId) {
      this.applyLifecycle(session, data);
    } else if (event.event === "build-progress" && data) {
      const runId = typeof data.run_id === "string" ? data.run_id : "";
      const tick = Number(data.server_tick);
      if (runId && runId !== session.progressStreamRunId) {
        session.progressStreamRunId = runId;
        session.progressStreamTick = -1;
      }
      if (Number.isSafeInteger(tick) && tick >= session.progressStreamTick &&
          (!session.runId || !runId || runId === session.runId)) {
        session.progressStreamTick = tick;
        session.lastProgressStreamAt = Date.now();
        session.lastProgressSourceTimeMs = Number(data.server_time_ms) || 0;
        session.progressStreamStates = object(data.build_state_by_entity) ?? {};
        session.progress = Object.fromEntries(Object.entries(session.progressStreamStates)
          .filter(([id]) => session.watchIds.includes(id)));
        session.progressStreamEvents++;
        session.progressStreamBytes += bytes;
      }
    } else if (event.event === "world-reset") {
      this.appendChange(session, "world_reset", { reset: data ?? {} });
      session.snapshotSeen = false;
      session.handshakeSeen = false;
      session.entities.clear();
      session.collectorStates.clear();
      session.commands.clear();
      session.pendingLifecycles.clear();
      session.journal = undefined;
      session.progress = {};
      session.progressStreamStates = {};
      session.progressStreamRunId = "";
      session.progressStreamTick = -1;
      session.lastProgressStreamAt = 0;
      session.lastAnyStreamAt = 0;
      session.lastProgressSourceTimeMs = 0;
      session.watchIds = [];
      session.progressWatchChangedAt = 0;
      session.runId = undefined;
      session.clientSeq = 0;
    }
    const record: PlayerEvent = {
      cursor: session.nextCursor++, event: event.event, id: event.id,
      received_at_ms: Date.now(), bytes, data: event.data,
    };
    session.events.push(record);
    session.eventBytes += bytes;
    while (session.events.length > this.maxEvents || session.eventBytes > this.maxEventBytes) {
      const removed = session.events.shift();
      if (!removed) break;
      session.eventBytes -= removed.bytes;
      session.droppedEvents++;
    }
    this.wake(session);
  }

  private wake(session: Session): void {
    for (const wake of session.wake) wake();
    session.wake.clear();
  }

  async observeEvents(handle: string, cursor = 0, limit = 50, waitMs = 0) {
    const session = this.required(handle);
    const read = () => session.events.filter(item => item.cursor > cursor).slice(0, limit);
    if (read().length === 0 && waitMs > 0) {
      await new Promise<void>(resolve => {
        const wake = () => { clearTimeout(timer); session.wake.delete(wake); resolve(); };
        const timer = setTimeout(wake, Math.min(waitMs, 5_000));
        session.wake.add(wake);
        if (read().length || session.closed) wake();
      });
    }
    const events = read();
    const oldest = session.events[0]?.cursor ?? session.nextCursor;
    return {
      events,
      next_cursor: events.at(-1)?.cursor ?? cursor,
      gap: cursor < oldest - 1,
      dropped_events: session.droppedEvents,
      connected: session.connected,
      ready: session.connected && session.snapshotSeen && session.handshakeSeen,
    };
  }

  getPlayerState(handle: string) {
    const session = this.required(handle);
    const owned = [...session.entities.values()].filter(item => item.owner_player_id === session.playerId);
    const collectorStates = [...session.collectorStates.values()].filter(
      item => session.entities.get(String(item.entity_id))?.owner_player_id === session.playerId,
    );
    return {
      username: session.username,
      player_id: session.playerId,
      run_id: session.runId,
      client_seq: session.clientSeq,
      tick: session.tick,
      connected: session.connected,
      ready: session.connected && session.snapshotSeen && session.handshakeSeen,
      visible_entity_count: session.entities.size,
      owned_entities: owned,
      collector_states: collectorStates,
      active_intents: session.activeIntents,
      progress: session.progress,
      watched_entity_ids: session.watchIds,
      change_cursor: session.journal?.cursor ?? 0,
      history_complete: session.historyComplete,
      metrics: {
        stream_bytes: session.streamBytes,
        progress_requests: session.progressRequests,
        progress_response_bytes: session.progressBytes,
        progress_stream_events: session.progressStreamEvents,
        progress_stream_bytes: session.progressStreamBytes,
        reconnects: session.reconnects,
        dropped_events: session.droppedEvents,
      },
      progress_fallbacks: session.progressFallbacks,
      last_error: session.lastError,
    };
  }

  getVisibleEntities(handle: string, entityTypeIds: string[] = []) {
    const session = this.required(handle);
    const types = new Set(entityTypeIds);
    const entities = [...session.entities.values()]
      .filter(item => types.size === 0 || (item.entity_type_id !== undefined && types.has(item.entity_type_id)))
      .sort((left, right) => {
        const a = String(left.id);
        const b = String(right.id);
        if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
          const first = BigInt(a);
          const second = BigInt(b);
          return first < second ? -1 : first > second ? 1 : 0;
        }
        return a < b ? -1 : a > b ? 1 : 0;
      });
    return { run_id: session.runId, tick: session.tick, ready: session.connected && session.snapshotSeen && session.handshakeSeen, entities };
  }

  getCommand(handle: string, clientCmdId: string): CommandStatus | null {
    return this.required(handle).commands.get(clientCmdId) ?? null;
  }

  getChanges(handle: string, cursor = 0, limit = 100, runId?: string) {
    const session = this.required(handle);
    const reset = Boolean(runId && runId !== session.runId);
    if (reset || !session.journal || cursor > session.journal.cursor) {
      return {
        run_id: session.runId, changes: [], next_cursor: session.journal?.cursor ?? 0,
        has_more: false, gap: true, observation: this.getPlayerState(handle),
      };
    }
    const batch = session.journal.after(cursor, limit);
    const gap = !session.historyComplete || session.journal.all().some(
      change => change.cursor > cursor && change.kind === "resync",
    );
    return {
      run_id: session.runId, ...batch, gap,
      ...(gap ? { observation: this.getPlayerState(handle) } : {}),
    };
  }

  private conditionMet(session: Session, condition: WaitCondition): boolean {
    if (condition.type === "command_terminal") return !!session.commands.get(condition.client_cmd_id)?.terminal;
    if (condition.type === "command_state") return session.commands.get(condition.client_cmd_id)?.lifecycle_state === condition.state;
    if (condition.type === "entity_type_count") {
      return [...session.entities.values()].filter(
        item => item.owner_player_id === session.playerId && item.entity_type_id === condition.entity_type_id,
      ).length >= condition.at_least;
    }
    if (condition.type === "collector_activity") {
      const state = session.collectorStates.get(String(condition.entity_id));
      return session.entities.get(String(condition.entity_id))?.owner_player_id === session.playerId &&
        state?.activity === condition.activity &&
        (!condition.resource_type_id || state?.resource_type === condition.resource_type_id);
    }
    const owned = session.entities.get(String(condition.entity_id));
    if (!owned || owned.owner_player_id !== session.playerId) return false;
    const resources = Array.isArray(owned.resources) ? owned.resources : [];
    return resources.some(item => {
      const resource = object(item);
      return resource?.resource_type === condition.resource_type_id && Number(resource.amount) >= condition.amount;
    });
  }

  async waitForObservation(handle: string, condition: WaitCondition, waitMs = 0, runId?: string) {
    const session = this.required(handle);
    const deadline = Date.now() + Math.min(Math.max(waitMs, 0), 60_000);
    while (!session.closed && (!runId || runId === session.runId) && !this.conditionMet(session, condition)) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise<void>(resolve => {
        const wake = () => { clearTimeout(timer); session.wake.delete(wake); resolve(); };
        const timer = setTimeout(wake, remaining);
        session.wake.add(wake);
        if (this.conditionMet(session, condition) || session.closed || (runId && runId !== session.runId)) wake();
      });
    }
    return {
      met: !session.closed && (!runId || runId === session.runId) && this.conditionMet(session, condition),
      run_changed: Boolean(runId && runId !== session.runId),
      observation: this.getPlayerState(handle),
    };
  }

  setProgressWatch(handle: string, ids: number[]): { watched_entity_ids: string[] } {
    const session = this.required(handle);
    const unique = [...new Set(ids.map(String))].sort();
    for (const id of unique) {
      if (session.entities.get(id)?.owner_player_id !== session.playerId) {
        throw new Error(`entity ${id} is not known to be owned by this player`);
      }
    }
    if (unique.join(",") !== session.watchIds.join(",")) {
      session.progressWatchChangedAt = unique.length ? Date.now() : 0;
    }
    session.watchIds = unique;
    const source = session.lastProgressStreamAt ? session.progressStreamStates : session.progress;
    session.progress = Object.fromEntries(Object.entries(source).filter(([id]) => unique.includes(id)));
    return { watched_entity_ids: unique };
  }

  private async pollProgress(session: Session): Promise<void> {
    if (session.closed || !session.connected || !session.watchIds.length || session.progressPending ||
        Date.now() - Math.max(session.lastProgressStreamAt, session.progressWatchChangedAt) < 1_250) return;
    session.progressPending = true;
    const ids = session.watchIds;
    const streamTick = session.progressStreamTick;
    const generation = session.generation;
    const startedAtMs = Date.now();
    const silenceMs = startedAtMs - session.lastProgressStreamAt;
    const streamSilenceMs = startedAtMs - session.lastAnyStreamAt;
    const lastStreamSourceTimeMs = session.lastProgressSourceTimeMs;
    const lastStreamStateCount = Object.keys(session.progressStreamStates).length;
    const diagnostic: ProgressFallbackDiagnostic = {
      time_ms: startedAtMs,
      player_id: session.playerId,
      watched_entity_ids: [...ids],
      watch_age_ms: startedAtMs - session.progressWatchChangedAt,
      silence_ms: silenceMs,
      stream_silence_ms: streamSilenceMs,
      last_stream_tick: streamTick,
      last_stream_source_time_ms: lastStreamSourceTimeMs,
      last_stream_state_count: lastStreamStateCount,
    };
    if (session.progressFallbacks.length < 1_000) session.progressFallbacks.push(diagnostic);
    try {
      const response = await this.request(session, `/api/v3/build-state?ids=${encodeURIComponent(ids.join(","))}`);
      session.progressRequests++;
      const body = await response.text();
      session.progressBytes += Buffer.byteLength(body);
      const data = response.ok ? object(JSON.parse(body)) : undefined;
      const states = object(data?.build_state_by_entity) ?? {};
      diagnostic.response_status = response.status;
      diagnostic.returned_state_count = Object.keys(states).length;
      diagnostic.request_ms = Date.now() - startedAtMs;
      if (!response.ok) throw new Error(`progress request failed: HTTP ${response.status}`);
      if (ids === session.watchIds && streamTick === session.progressStreamTick && generation === session.generation) {
        session.progress = states;
      }
    } catch (error) {
      diagnostic.error = String(error);
      session.lastError = String(error);
    } finally {
      session.progressPending = false;
    }
  }

  async sendIntent(handle: string, input: IntentInput) {
    const session = this.required(handle);
    if (!session.connected || !session.snapshotSeen || !session.handshakeSeen || !session.runId) {
      throw new Error("player is not ready to send intents");
    }
    if (session.entities.get(String(input.entity_id))?.owner_player_id !== session.playerId) {
      throw new Error("entity is not known to be owned by this player");
    }
    if (session.sending) throw new Error("a player intent submission is already in flight");
    session.sending = true;
    const clientSeq = ++session.clientSeq;
    const clientCmdId = uuidV7();
    try {
      const response = await this.request(session, "/api/v1/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input, run_id: session.runId, client_seq: clientSeq,
          client_cmd_id: clientCmdId, policy: input.policy ?? "REPLACE_ACTIVE",
        }),
      });
      const body = await response.text();
      let result: unknown = body;
      try { result = JSON.parse(body); } catch { /* Preserve non-JSON errors. */ }
      const command: CommandStatus = {
        client_cmd_id: clientCmdId, run_id: session.runId, entity_id: input.entity_id,
        intent_type: input.type, client_seq: clientSeq, accepted_http: response.ok,
        http_status: response.status, terminal: !response.ok, updated_at_ms: Date.now(),
      };
      session.commands.set(clientCmdId, command);
      this.appendChange(session, "command_submitted", { command });
      const pending = session.pendingLifecycles.get(clientCmdId);
      if (pending) {
        session.pendingLifecycles.delete(clientCmdId);
        for (const lifecycle of pending) this.applyLifecycle(session, lifecycle);
      }
      return { accepted_http: response.ok, status: response.status, client_seq: clientSeq, client_cmd_id: clientCmdId, result };
    } finally {
      session.sending = false;
    }
  }

  disconnectPlayer(handle: string): { disconnected: true } {
    const session = this.required(handle);
    session.closed = true;
    session.abort?.abort();
    if (session.progressTimer) clearInterval(session.progressTimer);
    this.wake(session);
    this.sessions.delete(handle);
    return { disconnected: true };
  }

  close(): void {
    for (const handle of [...this.sessions.keys()]) this.disconnectPlayer(handle);
  }
}
