import { randomBytes } from "node:crypto";

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

export type IntentInput =
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
  activeIntents: unknown[];
  progress: Record<string, unknown>;
  watchIds: string[];
  events: PlayerEvent[];
  eventBytes: number;
  nextCursor: number;
  droppedEvents: number;
  streamBytes: number;
  progressRequests: number;
  progressBytes: number;
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

  constructor(options: GatewayOptions) {
    this.baseUrl = new URL(options.baseUrl);
    if (!["http:", "https:"].includes(this.baseUrl.protocol)) throw new Error("baseUrl must use HTTP(S)");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxPlayers = options.maxPlayers ?? 200;
    this.maxEvents = options.maxEvents ?? 256;
    this.maxEventBytes = options.maxEventBytes ?? 2_000_000;
    this.progressIntervalMs = options.progressIntervalMs ?? 500;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 500;
  }

  private request(session: Session, path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetchImpl(new URL(path, this.baseUrl), {
      ...init,
      headers: { Cookie: session.cookie, ...init.headers },
    });
  }

  private required(handle: string): Session {
    const session = this.sessions.get(handle);
    if (!session || session.closed) throw new Error("unknown or closed player handle");
    return session;
  }

  async connectPlayer(username: string): Promise<{ handle: string; status: ReturnType<PlayerGateway["getPlayerState"]> }> {
    if (this.sessions.size >= this.maxPlayers) throw new Error("player limit reached");
    if (!/^loadtest-[a-zA-Z0-9_-]{1,48}$/.test(username)) {
      throw new Error("test usernames must start with loadtest- and use only letters, digits, _ or -");
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
      activeIntents: [], progress: {}, watchIds: [], events: [], eventBytes: 0,
      nextCursor: 1, droppedEvents: 0, streamBytes: 0, progressRequests: 0,
      progressBytes: 0, progressPending: false, reconnects: 0, wake: new Set(),
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
    session.runId = handshakeRunId || session.runId;
    session.playerId = typeof data.player_id === "string" ? data.player_id : session.playerId;
    session.clientSeq = Math.max(session.clientSeq, Number(data.last_processed_client_seq) || 0);
    session.activeIntents = Array.isArray(data.active_intents) ? data.active_intents : [];
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
      session.runId = incomingRunId ?? session.runId;
      session.tick = data.tick as number | string | undefined;
      session.entities.clear();
      for (const item of Array.isArray(data.entities) ? data.entities : []) {
        const parsed = entity(item);
        if (parsed) session.entities.set(String(parsed.id), parsed);
      }
      session.snapshotSeen = true;
    } else if (event.event === "delta" && data) {
      session.tick = data.tick as number | string | undefined;
      for (const id of Array.isArray(data.removed_entity_ids) ? data.removed_entity_ids : []) session.entities.delete(String(id));
      for (const id of Array.isArray(data.hidden_entity_ids) ? data.hidden_entity_ids : []) session.entities.delete(String(id));
      for (const item of Array.isArray(data.updates) ? data.updates : []) {
        const update = entity(item);
        if (update) session.entities.set(String(update.id), { ...session.entities.get(String(update.id)), ...update });
      }
    } else if (event.event === "world-reset") {
      session.snapshotSeen = false;
      session.handshakeSeen = false;
      session.entities.clear();
      session.progress = {};
      session.watchIds = [];
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
      active_intents: session.activeIntents,
      progress: session.progress,
      watched_entity_ids: session.watchIds,
      metrics: {
        stream_bytes: session.streamBytes,
        progress_requests: session.progressRequests,
        progress_response_bytes: session.progressBytes,
        reconnects: session.reconnects,
        dropped_events: session.droppedEvents,
      },
      last_error: session.lastError,
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
    session.watchIds = unique;
    session.progress = Object.fromEntries(Object.entries(session.progress).filter(([id]) => unique.includes(id)));
    if (unique.length) void this.pollProgress(session);
    return { watched_entity_ids: unique };
  }

  private async pollProgress(session: Session): Promise<void> {
    if (session.closed || !session.connected || !session.watchIds.length || session.progressPending) return;
    session.progressPending = true;
    const ids = session.watchIds;
    try {
      const response = await this.request(session, `/api/v3/build-state?ids=${encodeURIComponent(ids.join(","))}`);
      session.progressRequests++;
      const body = await response.text();
      session.progressBytes += Buffer.byteLength(body);
      if (!response.ok) throw new Error(`progress request failed: HTTP ${response.status}`);
      if (ids === session.watchIds) {
        const data = object(JSON.parse(body));
        session.progress = object(data?.build_state_by_entity) ?? {};
      }
    } catch (error) {
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
