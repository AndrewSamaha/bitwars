export type BuildState = { blueprint_id: string; progress: number };
export type BuildStateById = Record<string, BuildState>;

const POLL_INTERVAL_MS = 500;

async function fetchBuildStates(ids: string[]): Promise<BuildStateById> {
  const response = await fetch(
    `/api/v3/build-state?ids=${encodeURIComponent(ids.join(","))}`,
    {
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Build state request failed: ${response.status}`);
  const data = (await response.json()) as {
    build_state_by_entity?: BuildStateById;
  };
  return data.build_state_by_entity ?? {};
}

function sameStates(left: BuildStateById, right: BuildStateById): boolean {
  const leftIds = Object.keys(left);
  return (
    leftIds.length === Object.keys(right).length &&
    leftIds.every(
      (id) =>
        left[id]?.blueprint_id === right[id]?.blueprint_id &&
        left[id]?.progress === right[id]?.progress,
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

  constructor(
    private readonly load: (
      ids: string[],
    ) => Promise<BuildStateById> = fetchBuildStates,
  ) {}

  getSnapshot = (): BuildStateById => this.snapshot;
  getProgress = (id: string): number | undefined => this.snapshot[id]?.progress;
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
    const retained = Object.fromEntries(
      Object.entries(this.snapshot).filter(([id]) => ids.includes(id)),
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
    if (this.inFlight || this.ids.length === 0) return;
    const ids = this.ids;
    const revision = this.idsRevision;
    this.inFlight = true;
    try {
      const states = await this.load(ids);
      if (revision === this.idsRevision) this.publish(states);
    } catch {
      // Keep the last known progress through transient request failures.
    } finally {
      this.inFlight = false;
    }
  }
}

export const buildProgressStore = new BuildProgressStore();
