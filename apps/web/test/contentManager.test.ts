import { setImmediate as settle } from "node:timers/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentManager, ContentSyncError, type ContentData } from "../src/features/content/contentManager";
import { syncContentChangedEvent } from "../src/features/content/contentEvents";

const A = "a".repeat(64);
const B = "b".repeat(64);
const RELOAD_ID = "5b895de6-564e-4572-8bfc-7f3c9b3d647b";
function content(revision: string): ContentData {
  return { content_version: revision, content_revision: revision, reload_id: RELOAD_ID,
    entity_types: { ship: { fog_memory: "retain_last_known", speed: 1, mass: 1, health: 100, stop_radius: 0 } },
    entities: { ship: { definition_hash: revision, asset_hash: null, files: {} } } };
}
function deferred<T>() {
  // The repository's Node 20 runtime does not implement Promise.withResolvers.
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((accept) => { resolve = accept; });
  return { promise, resolve };
}
function response(data: ContentData) { return { ok: true, json: async () => data } as Response; }
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("exact revision synchronization", () => {
  it("deduplicates concurrent requests and waits for the renderer acknowledgement", async () => {
    const request = deferred<Response>();
    const applied = deferred<Record<string, string>>();
    const fetcher = vi.fn(() => request.promise);
    vi.stubGlobal("fetch", fetcher);
    const manager = new ContentManager();
    const unregister = manager.registerRenderer(() => applied.promise);
    const first = manager.validateAndSync(A);
    expect(manager.validateAndSync(A)).toBe(first);
    expect(fetcher).toHaveBeenCalledWith(`/api/v2/content?revision=${A}`, { cache: "no-store" });
    request.resolve(response(content(A)));
    await settle();
    expect(manager.getContentVersion()).toBe(A);
    expect(manager.getSyncState().status).toBe("loading");
    applied.resolve({ ship: A });
    expect(await first).toBe(true);
    expect(manager.getSyncState()).toMatchObject({ status: "synchronized", asset_bundles: { ship: A } });
    unregister();
  });

  it("cannot commit an older fetch after a newer advertisement", async () => {
    const old = deferred<Response>();
    const latest = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn((url: string) => url.includes(A) ? old.promise : latest.promise));
    const manager = new ContentManager();
    const render = vi.fn(async () => ({}));
    manager.registerRenderer(render);
    const first = manager.validateAndSync(A);
    const second = manager.validateAndSync(B);
    latest.resolve(response(content(B)));
    await second;
    old.resolve(response(content(A)));
    expect(await first).toBe(false);
    expect(manager.getContentVersion()).toBe(B);
    expect(render).toHaveBeenCalledTimes(1);
    expect(manager.getSyncState().advertised_revision).toBe(B);
  });

  it("invalidates in-flight rendering and ignores its late acknowledgement", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => response(content(url.includes(A) ? A : B))));
    const old = deferred<void>();
    const applied: string[] = [];
    const manager = new ContentManager();
    manager.registerRenderer(async (data, isCurrent) => {
      if (data.content_revision === A) await old.promise;
      if (isCurrent()) applied.push(data.content_revision);
      return { ship: data.content_revision };
    });
    const first = manager.validateAndSync(A);
    await settle();
    await manager.validateAndSync(B);
    old.resolve();
    await first;
    expect(applied).toEqual([B]);
    expect(manager.getSyncState()).toMatchObject({ status: "synchronized", asset_bundles: { ship: B } });
  });

  it("rejects an incorrect exact payload without replacing the last definitions", async () => {
    const manager = new ContentManager();
    manager.loadBundle(content(A));
    vi.stubGlobal("fetch", vi.fn(async () => response(content(A))));
    expect(await manager.validateAndSync(B)).toBe(false);
    expect(manager.getContentVersion()).toBe(A);
    expect(manager.getSyncState()).toMatchObject({ status: "failed", error: { code: "revision_mismatch", expected_hash: B } });
  });

  it("keeps old acknowledged bundle hashes on an exact asset failure and retries on reconnect", async () => {
    const manager = new ContentManager();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => response(content(url.includes(A) ? A : B))));
    let broken = true;
    manager.registerRenderer(async data => {
      if (data.content_revision === B && broken) throw new ContentSyncError({ stage: "assets", code: "asset_hash_mismatch",
        message: "corrupt ship mask", entity_id: "ship", url: `/assets/ship/${B}/primary.png`, expected_hash: B });
      return { ship: data.content_revision };
    });
    await manager.validateAndSync(A);
    expect(await manager.validateAndSync(B)).toBe(false);
    expect(manager.getSyncState()).toMatchObject({ status: "failed", definitions_revision: B, asset_bundles: { ship: A },
      error: { entity_id: "ship", expected_hash: B, url: `/assets/ship/${B}/primary.png` } });
    broken = false;
    expect(await manager.validateAndSync(B)).toBe(true);
    expect(manager.getSyncState()).toMatchObject({ status: "synchronized", asset_bundles: { ship: B } });
  });

  it("does not acknowledge cached old content while a newer exact request is pending", async () => {
    const manager = new ContentManager();
    manager.loadBundle(content(A));
    const request = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn(() => request.promise));
    const sync = manager.validateAndSync(B);
    const render = vi.fn(async () => ({}));
    manager.registerRenderer(render);
    await settle();
    expect(render).not.toHaveBeenCalled();
    expect(manager.getSyncState().status).toBe("loading");
    request.resolve(response(content(B)));
    await sync;
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("refreshes same-revision activation metadata without reloading acknowledged definitions or visuals", async () => {
    const manager = new ContentManager();
    const fetcher = vi.fn(async () => response(content(A)));
    vi.stubGlobal("fetch", fetcher);
    const render = vi.fn(async () => ({ ship: A }));
    manager.registerRenderer(render);
    await manager.validateAndSync(A);
    const startupReload = "aaf309a9-0983-4dc8-bd19-83b340a96447";
    await manager.validateAndSync(A, { reload_id: startupReload, activated_tick: 3 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(manager.getSyncState()).toMatchObject({ status: "synchronized", reload_id: startupReload });
    expect(manager.getContent()).toMatchObject({ reload_id: startupReload, activated_tick: 3 });
  });

  it("does not overwrite newer same-revision event metadata with an older in-flight exact payload", async () => {
    const manager = new ContentManager();
    const request = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn(() => request.promise));
    const sync = manager.validateAndSync(A);
    const startupReload = "aaf309a9-0983-4dc8-bd19-83b340a96447";
    const same = manager.validateAndSync(A, { reload_id: startupReload, activated_tick: 4 });
    expect(same).toBe(sync);
    request.resolve(response(content(A)));
    await sync;
    expect(manager.getSyncState().reload_id).toBe(startupReload);
    expect(manager.getContent()).toMatchObject({ reload_id: startupReload, activated_tick: 4 });
  });
});

it("consumes named content events, ignores older activation ticks, and resets tick ordering for a new world", async () => {
  const manager = new ContentManager();
  const fetcher = vi.fn(async (url: string) => response(content(url.includes(A) ? A : B)));
  vi.stubGlobal("fetch", fetcher);
  const event = (revision: string, tick: number) => JSON.stringify({ type: "content_changed", content_revision: revision,
    reload_id: RELOAD_ID, activated_tick: tick });
  expect(await syncContentChangedEvent(event(B, 20), manager)).toBe(true);
  expect(await syncContentChangedEvent(event(A, 19), manager)).toBe(true);
  expect(manager.getContentVersion()).toBe(B);
  expect(fetcher).toHaveBeenCalledTimes(1);
  manager.beginWorld();
  await syncContentChangedEvent(event(A, 0), manager);
  expect(manager.getContentVersion()).toBe(A);
  expect(await syncContentChangedEvent('{"content_revision":"invalid"}', manager)).toBe(false);
  expect(manager.getSyncState().error?.code).toBe("invalid_content_event");
});

it("reports loading before acknowledgement, omits empty reload IDs, and heartbeats a stable session UUID", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", {});
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value) });
  const reports: Array<Record<string, unknown>> = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
    reports.push(JSON.parse(String(options.body)));
    return { ok: true };
  }));
  const manager = new ContentManager();
  const stop = manager.startReporting();
  manager.loadBundle({ ...content(A), reload_id: "" });
  const ack = deferred<Record<string, string>>();
  const unregister = manager.registerRenderer(() => ack.promise);
  await vi.advanceTimersByTimeAsync(0);
  expect(reports.every(report => report.status === "loading")).toBe(true);
  expect(reports.every(report => !("reload_id" in report))).toBe(true);
  ack.resolve({ ship: A });
  await vi.advanceTimersByTimeAsync(0);
  expect(reports.at(-1)?.status).toBe("synchronized");
  const count = reports.length;
  await vi.advanceTimersByTimeAsync(30_000);
  expect(reports.length).toBe(count + 1);
  const clientId = reports[0].client_id;
  expect(clientId).toMatch(/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
  expect(reports.every(report => report.client_id === clientId)).toBe(true);
  stop();
  unregister();
  await vi.advanceTimersByTimeAsync(0);
});
