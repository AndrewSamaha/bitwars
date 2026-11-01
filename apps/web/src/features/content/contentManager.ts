import { v4 as uuid } from "uuid";

/** Live definitions and renderer acknowledgements share one revision lifecycle. */

// ── Types ──────────────────────────────────────────────────────────────────

export type EntityTypeDef = {
  /** Client behavior when an entity of this type leaves sensor coverage. */
  fog_memory: "retain_last_known" | "forget_when_hidden";
  speed: number;
  stop_radius: number;
  mass: number;
  health: number;
  combat_targetable?: boolean;
  hull_radius?: number;
  combat?: {
    acquisition_range: number;
    on_near_enemy_strategy?: "approach" | "flee" | "stay";
    attacks: Array<{
      id: string;
      type: "laser" | "dismantle";
      range?: number;
      damage: number;
      cooldown_ticks: number;
      priority?: number;
      contact_tolerance?: number;
    }>;
  };
  /** Client-only sprite presentation settings. */
  visual?: {
    scale?: number;
    /** Clockwise offset from the asset's native right-facing direction. */
    rotate_deg?: number;
  };
  /** Draw order within the game world; higher values render in front. */
  z_index?: number;
  /** Whether hover indicators and entity detail UI should be suppressed. */
  suppress_hover?: boolean;
  /** Resources required to produce one instance of this entity type. */
  build_cost?: Record<string, number>;
  /** Physical depot stock or carrier cargo capacity, per resource. */
  max_capacity?: Record<string, number>;
  /** Regrows spendable stock up to max_capacity; empty inventories do not regrow. */
  inventory_regeneration?: Record<string, {
    model: "hill";
    max_rate_per_second: number;
    half_saturation_fraction: number;
    exponent: number;
  }>;
  /** Enables local spending from this physical stockpile. */
  depot?: boolean;
  /** Local service radius; depot inventories never merge. */
  depot_range?: number;
  /** @deprecated Ignored by depot logistics. */
  resource_reserves?: Record<string, number>;
  /** @deprecated Ignored. Use depot and depot_range. */
  resource_sharing?: {
    /** @deprecated Ignored; use depot_range. */
    range: number;
    /** @deprecated Ignored; local producers credit their associated depot. */
    wireless_receives?: string[];
    /** @deprecated All policy fields are ignored; ship physical cargo between depots. */
    resources?: Record<string, {
      /** @deprecated Ignored. */
      priority: number;
      /** @deprecated Ignored. */
      overflow_priority?: number | null;
      /** @deprecated Ignored. */
      refill_below: number;
      /** @deprecated Ignored. */
      fill_to: number;
      /** @deprecated Ignored. */
      reserve: number;
    }>;
  };
  /** Per-resource upkeep charged to the owner, in units per minute. */
  maintenance_cost_per_minute?: Record<string, number>;
  repair?: {
    range: number;
    cost_per_min: Record<string, number>;
    efficiency: number;
  };
  /** Optional circular sensor available to any entity type. */
  sensor?: {
    cost_per_minute?: Record<string, number>;
    range: number;
  };
  /** Target-side detection range used to extend player sensor coverage. */
  visibility_range?: number;
  /** Content-defined production options offered by this entity type. */
  builds?: Array<{
    entity_type_id: string;
    duration_seconds?: number;
    /** @deprecated Duration fallback for legacy content only; costs are paid upfront. */
    spend_rates?: Record<string, number>;
  }>;
  /** Content-defined in-place transformations offered by this entity type. */
  upgrades?: Array<{
    entity_type_id: string;
    duration_seconds?: number;
    /** @deprecated Duration fallback for legacy content only; costs are paid upfront. */
    spend_rates?: Record<string, number>;
  }>;
  requires_technologies?: TechnologyRequirement;
  researches?: string[];
  collector?: {
    /** Units per second collected into inventory; zero disables transport collection. */
    transport_rate_per_second?: number;
    vfx?: "solar_proximity" | "mineral_transport";
    collects?: string[];
  };
  resource_node?: {
    resource_type: string;
    collection_mode: "transport" | "proximity";
    /** @deprecated Legacy fallback; configure resource_amounts in spawn.yaml. */
    amount?: number;
  };
  radiation_sources?: Array<{
    radiation_type: string;
    min_effective_distance_border_color?: string;
    min_effective_distance_fill_color?: string;
    full_damage_distance_border_color?: string;
    full_damage_distance_fill_color?: string;
    max_effective_distance_border_color?: string;
    max_effective_distance_fill_color?: string;
    min_effective_distance?: number;
    max_effective_distance?: number;
    full_damage_distance?: number;
    damage_per_second?: number;
  }>;
  radiation_shielding?: Record<
    string,
    {
      distance_offset?: number;
      damage_multiplier?: number;
    }
  >;
};

export type TechnologyRequirement = string | { all?: TechnologyRequirement[]; any?: TechnologyRequirement[] };
export type TechnologyDef = {
  display_name: string;
  granted_on_spawn?: boolean;
  requires?: TechnologyRequirement;
  research_cost?: Record<string, number>;
  research_rates?: Record<string, number>;
  effects?: Array<{ target: string; operation: "add" | "multiply" | "set" | "cap"; value: number }>;
};

/** M7: Resource type definition for HUD display (name, order). */
export type ResourceTypeDef = {
  display_name: string;
  order?: number;
};

export type EntityContentHashes = {
  definition_hash: string;
  asset_hash: string | null;
  files: Record<string, string>;
};

export type ContentData = {
  content_version: string;
  content_revision: string;
  entity_types: Record<string, EntityTypeDef>;
  resource_types?: Record<string, ResourceTypeDef>;
  technologies?: Record<string, TechnologyDef>;
  entities: Record<string, EntityContentHashes>;
  reload_id?: string;
  activated_tick?: number;
};

export type ContentSyncErrorDetail = {
  stage: string;
  code: string;
  message: string;
  entity_id?: string;
  url?: string;
  expected_hash?: string;
};

export class ContentSyncError extends Error {
  constructor(readonly detail: ContentSyncErrorDetail) {
    super(detail.message);
    this.name = "ContentSyncError";
  }
}

export type ContentSyncState = {
  advertised_revision: string;
  definitions_revision: string;
  asset_bundles: Record<string, string>;
  reload_id?: string;
  status: "synchronized" | "loading" | "failed";
  last_applied_at?: number;
  error?: ContentSyncErrorDetail;
};

type Renderer = (content: ContentData, isCurrent: () => boolean) => Promise<Record<string, string>>;
type Advertisement = { reload_id?: string; activated_tick?: number };
const STORAGE_KEY = "bitwars:content";
const HASH = /^[a-f0-9]{64}$/;

export function assertContentData(data: ContentData, expectedRevision = data.content_revision): void {
  if (!HASH.test(data.content_revision) || data.content_revision !== expectedRevision
    || data.content_version !== data.content_revision || !data.entity_types || !data.entities) {
    throw new ContentSyncError({ stage: "definitions", code: "revision_mismatch",
      message: `Expected content revision ${expectedRevision}, received ${data.content_revision ?? "(missing)"}`,
      expected_hash: expectedRevision });
  }
  for (const id of Object.keys(data.entity_types)) {
    const entry = data.entities[id];
    if (!entry || !HASH.test(entry.definition_hash) || (entry.asset_hash !== null && !HASH.test(entry.asset_hash))) {
      throw new ContentSyncError({ stage: "definitions", code: "invalid_entity_hashes",
        message: `Invalid content manifest entry for ${id}`, entity_id: id });
    }
  }
}

export class ContentManager {
  private data: ContentData | null = null;
  private listeners = new Set<() => void>();
  private syncListeners = new Set<() => void>();
  private renderers = new Set<Renderer>();
  private generation = 0;
  private advertisedTick = -1;
  private pending: { revision: string; promise: Promise<boolean> } | null = null;
  private clientId: string | undefined;
  private reportQueue: Promise<void> = Promise.resolve();
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private state: ContentSyncState = {
    advertised_revision: "", definitions_revision: "", asset_bundles: {}, status: "loading",
  };

  constructor() {
    this.restoreFromStorage();
  }

  getContent = (): ContentData | null => this.data;
  getContentVersion = (): string => this.data?.content_revision ?? "";
  getSyncState = (): ContentSyncState => this.state;
  getSyncGeneration = (): number => this.generation;

  beginWorld(): void {
    ++this.generation;
    this.advertisedTick = -1;
    this.pending = null;
    this.updateState({ advertised_revision: "", status: "loading", error: undefined });
  }

  startReporting(): () => void {
    if (!this.heartbeat && typeof window !== "undefined") {
      this.heartbeat = setInterval(() => this.report(), 30_000);
    }
    return () => {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    };
  }

  getEntityType(entityTypeId: string): EntityTypeDef | undefined {
    return this.data?.entity_types[entityTypeId];
  }

  getResourceType(resourceTypeId: string): ResourceTypeDef | undefined {
    return this.data?.resource_types?.[resourceTypeId];
  }

  /** Exact accepted revision fetch; obsolete requests may finish but cannot commit. */
  validateAndSync(revision: string, advertisement: Advertisement = {}): Promise<boolean> {
    if (!revision) return Promise.resolve(false);
    if (advertisement.activated_tick !== undefined && advertisement.activated_tick < this.advertisedTick) {
      return Promise.resolve(true);
    }
    if (advertisement.activated_tick !== undefined) this.advertisedTick = advertisement.activated_tick;
    if (this.state.advertised_revision === revision && advertisement.reload_id) {
      this.updateState({ reload_id: advertisement.reload_id });
    }
    if (this.data?.content_revision === revision && (advertisement.reload_id || advertisement.activated_tick !== undefined)) {
      this.data = { ...this.data, reload_id: advertisement.reload_id || this.data.reload_id,
        activated_tick: advertisement.activated_tick ?? this.data.activated_tick };
      this.persistToStorage();
    }
    if (this.pending?.revision === revision && this.state.advertised_revision === revision) return this.pending.promise;
    if (revision === this.state.advertised_revision && this.state.status === "synchronized") return Promise.resolve(true);
    const generation = ++this.generation;
    this.updateState({ advertised_revision: revision, reload_id: advertisement.reload_id || undefined,
      status: "loading", error: undefined });
    const promise = this.sync(revision, generation);
    this.pending = { revision, promise };
    void promise.finally(() => {
      if (this.pending?.promise === promise) this.pending = null;
    });
    return promise;
  }

  private async sync(revision: string, generation: number): Promise<boolean> {
    try {
      if (this.data?.content_revision !== revision) {
        const url = `/api/v2/content?revision=${encodeURIComponent(revision)}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new ContentSyncError({ stage: "definitions", code: "fetch_failed",
          message: `Content request failed: HTTP ${response.status}`, url, expected_hash: revision });
        const payload = await response.json() as ContentData;
        assertContentData(payload, revision);
        if (generation !== this.generation) return false;
        this.advertisedTick = Math.max(this.advertisedTick, payload.activated_tick ?? -1);
        this.data = { ...payload, reload_id: this.state.reload_id || payload.reload_id,
          activated_tick: this.advertisedTick >= 0 ? this.advertisedTick : undefined };
        this.persistToStorage();
        this.notify();
      }
      if (generation !== this.generation || !this.data) return false;
      this.updateState({ definitions_revision: revision, reload_id: this.state.reload_id || this.data.reload_id || undefined });
      await this.applyRenderers(this.data, generation);
      return generation === this.generation && this.state.status !== "failed";
    } catch (error) {
      if (generation === this.generation) this.reportRendererFailure(error);
      return false;
    }
  }

  /** Initial gate load; remains loading until the mounted renderer acknowledges. */
  loadBundle(data: ContentData): void {
    assertContentData(data);
    ++this.generation;
    this.advertisedTick = data.activated_tick ?? -1;
    this.data = data;
    this.persistToStorage();
    this.updateState({ advertised_revision: data.content_revision, definitions_revision: data.content_revision,
      reload_id: data.reload_id || undefined, status: "loading", error: undefined });
    this.notify();
    void this.applyRenderers(data, this.generation);
  }

  /** A renderer must stage off-screen and check isCurrent before its atomic swap. */
  registerRenderer(renderer: Renderer): () => void {
    this.renderers.add(renderer);
    if (this.data) {
      this.updateState({ status: "loading", error: undefined });
      void this.applyRenderers(this.data, this.generation, [renderer]);
    }
    return () => {
      this.renderers.delete(renderer);
      if (!this.renderers.size) this.updateState({ status: "loading" });
    };
  }

  private async applyRenderers(data: ContentData, generation: number, renderers = [...this.renderers]): Promise<void> {
    if (!renderers.length || data.content_revision !== this.state.advertised_revision) return;
    try {
      const applied = await Promise.all(renderers.map(renderer =>
        renderer(data, () => generation === this.generation && this.renderers.has(renderer)
          && data.content_revision === this.state.advertised_revision)));
      if (generation !== this.generation || data.content_revision !== this.state.advertised_revision
        || renderers.some(renderer => !this.renderers.has(renderer))) return;
      this.updateState({ status: "synchronized", asset_bundles: Object.assign({}, ...applied),
        last_applied_at: Date.now(), error: undefined });
    } catch (error) {
      if (generation === this.generation) this.reportRendererFailure(error);
    }
  }

  reportRendererFailure(error: unknown): void {
    const detail = error instanceof ContentSyncError ? error.detail : {
      stage: "renderer", code: "apply_failed", message: error instanceof Error ? error.message : String(error),
    };
    this.updateState({ status: "failed", error: detail });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  subscribeSyncState = (listener: () => void): (() => void) => {
    this.syncListeners.add(listener);
    return () => { this.syncListeners.delete(listener); };
  };

  private updateState(update: Partial<ContentSyncState>): void {
    this.state = { ...this.state, ...update };
    for (const listener of this.syncListeners) listener();
    this.report();
  }

  private report(): void {
    if (typeof window === "undefined") return;
    if (!this.clientId) {
      try {
        this.clientId = sessionStorage.getItem("bitwars:content-client") ?? uuid();
        sessionStorage.setItem("bitwars:content-client", this.clientId);
      } catch { this.clientId = uuid(); }
    }
    const report = { client_id: this.clientId, ...this.state };
    // Preserve lifecycle ordering at the diagnostics endpoint, even on slow links.
    this.reportQueue = this.reportQueue.then(async () => {
      const response = await fetch("/api/v2/content/report", { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(report), keepalive: true });
      if (!response.ok) throw new Error(`Content report failed: HTTP ${response.status}`);
    }).catch(error => { console.warn("[ContentManager] report failed", error); });
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private persistToStorage(): void {
    try {
      if (typeof localStorage !== "undefined" && this.data) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch { /* Storage is optional; the accepted revision remains authoritative. */ }
  }

  private restoreFromStorage(): void {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ContentData;
      assertContentData(parsed);
      this.data = parsed;
      this.state = { ...this.state, definitions_revision: parsed.content_revision };
    } catch { /* Ignore legacy or corrupt cached content. */ }
  }
}

// ── Module singleton ───────────────────────────────────────────────────────

export const contentManager = new ContentManager();
