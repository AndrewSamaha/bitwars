import { buildProgressMetrics } from "./buildProgressMetrics";

export type BuildState = {
  blueprint_id: string;
  progress: number;
  progress_updated_at_unix_ms?: number;
};
export type BuildStateById = Record<string, BuildState>;
export type BuildProgressStreamBatch = {
  run_id?: string;
  server_tick?: number;
  server_time_ms?: number;
  build_state_by_entity?: BuildStateById;
};

const POLL_INTERVAL_MS = 500;
const STREAM_STALE_MS = 1_250;

async function fetchBuildStates(ids: string[]): Promise<BuildStateById> {
  const sentAtMs = Date.now();
  const startedAt = performance.now();
  const response = await fetch(
    `/api/v3/build-state?ids=${encodeURIComponent(ids.join(","))}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Build state request failed: ${response.status}`);
  const body = await response.text();
  const receivedAtMs = Date.now();
  const data = JSON.parse(body) as {
    build_state_by_entity?: BuildStateById;
    server_time_ms?: number;
  };
  if (buildProgressMetrics.enabled) {
    buildProgressMetrics.recordRequest(
      sentAtMs,
      receivedAtMs,
      performance.now() - startedAt,
      new TextEncoder().encode(body).length,
      data.server_time_ms,
      response.headers.get("Server-Timing"),
    );
  }
  return data.build_state_by_entity ?? {};
}

function sameStates(left: BuildStateById, right: BuildStateById): boolean {
  const leftIds = Object.keys(left);
  return (
    leftIds.length === Object.keys(right).length &&
    leftIds.every(
      (id) =>
        left[id]?.blueprint_id === right[id]?.blueprint_id &&
        left[id]?.progress === right[id]?.progress &&
        left[id]?.progress_updated_at_unix_ms ===
          right[id]?.progress_updated_at_unix_ms,
    )
  );
}

/** One polling request for the union of IDs required by all mounted consumers. */
export class BuildProgressStore {
  private sources = new Map<symbol, Set<string>>();
  private listeners = new Set<() => void>();
  private snapshot: BuildStateById = {};
  private ids: string[] = [];
  private idsKey = "";
  private idsRevision = 0;
  private interval: ReturnType<typeof setInterval> | undefined;
  private initialPoll: ReturnType<typeof setTimeout> | undefined;
  private inFlight = false;
  private streamStates: BuildStateById = {};
  private streamRunId = "";
  private streamTick = -1;
  private lastStreamAt = 0;
  private watchChangedAt = 0;

  constructor(
    private readonly load: (
      ids: string[],
    ) => Promise<BuildStateById> = fetchBuildStates,
  ) {}

  getSnapshot = (): BuildStateById => this.snapshot;
  getProgress = (id: string): number | undefined => this.snapshot[id]?.progress;
  streamConnected(): void {
    this.lastStreamAt = Date.now();
  }
  applyStreamBatch(batch: BuildProgressStreamBatch, bodyBytes: number): void {
    const tick = Number(batch.server_tick);
    if (!Number.isSafeInteger(tick) || tick < 0) return;
    const runId = typeof batch.run_id === "string" ? batch.run_id : "";
    if (runId && runId !== this.streamRunId) {
      this.streamRunId = runId;
      this.streamTick = -1;
    }
    if (tick < this.streamTick) return;
    this.streamTick = tick;
    this.lastStreamAt = Date.now();
    this.streamStates = batch.build_state_by_entity ?? {};
    buildProgressMetrics.recordStreamEvent(bodyBytes);
    this.publish(Object.fromEntries(Object.entries(this.streamStates).filter(([id]) => this.ids.includes(id))));
  }

  streamDisconnected(): void {
    this.lastStreamAt = 0;
  }

  resetStream(): void {
    this.streamStates = {};
    this.streamRunId = "";
    this.streamTick = -1;
    this.lastStreamAt = 0;
    this.publish({});
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setIds(source: symbol, ids: Iterable<string>): void {
    this.sources.set(source, new Set(ids));
    this.syncIds();
  }

  removeSource(source: symbol): void {
    this.sources.delete(source);
    this.syncIds();
  }

  private syncIds(): void {
    const ids = [
      ...new Set([...this.sources.values()].flatMap((source) => [...source])),
    ].sort();
    const key = ids.join(",");
    if (key === this.idsKey) return;
    const wasIdle = this.ids.length === 0;
    this.ids = ids;
    this.idsKey = key;
    this.idsRevision++;
    this.watchChangedAt = ids.length ? Date.now() : 0;
    const retained = Object.fromEntries(
      Object.entries(this.lastStreamAt ? this.streamStates : this.snapshot).filter(([id]) => ids.includes(id)),
    );
    this.publish(retained);
    if (ids.length === 0) {
      if (this.interval !== undefined) clearInterval(this.interval);
      if (this.initialPoll !== undefined) clearTimeout(this.initialPoll);
      this.interval = undefined;
      this.initialPoll = undefined;
    } else if (wasIdle) {
      this.initialPoll = setTimeout(() => {
        this.initialPoll = undefined;
        void this.poll();
      }, 0);
      this.interval = setInterval(() => {
        void this.poll();
      }, POLL_INTERVAL_MS);
    }
  }

  private publish(next: BuildStateById): void {
    if (sameStates(this.snapshot, next)) return;
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  private async poll(): Promise<void> {
    if (this.inFlight || this.ids.length === 0 ||
        Date.now() - Math.max(this.lastStreamAt, this.watchChangedAt) < STREAM_STALE_MS) return;
    const ids = this.ids;
    const revision = this.idsRevision;
    const streamTick = this.streamTick;
    const streamAt = this.lastStreamAt;
    this.inFlight = true;
    try {
      const states = await this.load(ids);
      if (revision === this.idsRevision && streamTick === this.streamTick && streamAt === this.lastStreamAt) {
        buildProgressMetrics.recordAppliedResponse(
          !sameStates(this.snapshot, states),
        );
        this.publish(states);
      }
    } catch {
      // Keep the last known progress through transient request failures.
    } finally {
      this.inFlight = false;
    }
  }
}

export const buildProgressStore = new BuildProgressStore();
