/**
 * Client-Side Content Manager (M4)
 *
 * Manages entity type definitions on the client.  The content lifecycle:
 *
 * 1. **Build-time bundle** — At build time, `entities.json` is generated from
 *    `packages/content/entities.yaml` and imported statically.  This gives
 *    zero-latency access on first load.
 *
 * 2. **Connect-time validation** — On every SSE open (initial + reconnect),
 *    the reconnect handshake returns `content_version` (xxh3 hex hash).
 *    If it matches our local hash, we're good.  If not, we fetch fresh
 *    definitions from `GET /api/v2/content`.
 *
 * 3. **localStorage cache** — After fetching, we persist to localStorage so
 *    subsequent page loads use the cached copy (validated again on connect).
 *
 * The content manager is a singleton, like `intentQueue` and `game`.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type EntityTypeDef = {
  speed: number;
  stop_radius: number;
  mass: number;
  health: number;
};

/** M7: Resource type definition for HUD display (name, order). */
export type ResourceTypeDef = {
  display_name: string;
  order?: number;
};

export type ContentData = {
  content_version: string;
  entity_types: Record<string, EntityTypeDef>;
  /** M7: Resource type definitions (id → display_name, order). */
  resource_types?: Record<string, ResourceTypeDef>;
};

// ── Storage key ────────────────────────────────────────────────────────────

const STORAGE_KEY = "bitwars:content";

// ── Manager ────────────────────────────────────────────────────────────────

class ContentManager {
  private data: ContentData | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    // Try to restore from localStorage on init
    this.restoreFromStorage();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /** Get the currently loaded content data, or null if none. */
  getContent(): ContentData | null {
    return this.data;
  }

  /** Get the content version hash, or empty string if not loaded. */
  getContentVersion(): string {
    return this.data?.content_version ?? "";
  }

  /** Look up an entity type definition by id. */
  getEntityType(entityTypeId: string): EntityTypeDef | undefined {
    return this.data?.entity_types[entityTypeId];
  }

  /** M7: Look up a resource type definition by id. */
  getResourceType(resourceTypeId: string): ResourceTypeDef | undefined {
    return this.data?.resource_types?.[resourceTypeId];
  }

  /**
   * Validate local content against the server's content_version.
   * If mismatched, fetch fresh content from the server.
   *
   * Call this on every SSE open event with the content_version from
   * the reconnect handshake.
   *
   * Returns true if content is now valid, false if fetch failed.
   */
  async validateAndSync(serverContentVersion: string): Promise<boolean> {
    if (!serverContentVersion) {
      // Server has no content pack — clear local data
      this.data = null;
      this.clearStorage();
      this.notify();
      return true;
    }

    if (this.data?.content_version === serverContentVersion) {
      // Already in sync
      return true;
    }

    // Version mismatch — fetch from server
    console.log(
      `[ContentManager] version mismatch: local=${this.data?.content_version ?? "(none)"} server=${serverContentVersion}; fetching...`,
    );

    try {
      const resp = await fetch("/api/v2/content");
      if (!resp.ok) {
        console.warn("[ContentManager] fetch failed:", resp.status);
        return false;
      }

      const payload: ContentData = await resp.json();
      this.data = payload;
      this.persistToStorage();
      this.notify();

      console.log(
        `[ContentManager] synced: version=${payload.content_version}, types=${Object.keys(payload.entity_types).length}`,
      );
      return true;
    } catch (err) {
      console.warn("[ContentManager] fetch error:", err);
      return false;
    }
  }

  /**
   * Load content data directly (e.g. from a build-time bundle).
   * Skips the fetch; useful for static imports.
   */
  loadBundle(data: ContentData) {
    this.data = data;
    this.persistToStorage();
    this.notify();
  }

  /** Subscribe to content changes. Returns unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        /* ignore */
      }
    }
  }

  private persistToStorage() {
    try {
      if (typeof localStorage === "undefined") return;
      if (this.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch {
      /* SSR guard / quota exceeded */
    }
  }

  private restoreFromStorage() {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ContentData;
      if (parsed?.content_version && parsed?.entity_types) {
        this.data = { ...parsed, resource_types: parsed.resource_types ?? {} };
      }
    } catch {
      /* ignore corrupted data */
    }
  }

  private clearStorage() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* SSR guard */
    }
  }
}

// ── Module singleton ───────────────────────────────────────────────────────

export const contentManager = new ContentManager();
