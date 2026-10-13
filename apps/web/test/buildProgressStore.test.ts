import { afterEach, expect, it, vi } from "vitest";
import { BuildProgressStore } from "../src/features/build-state/buildProgressStore";

afterEach(() => {
  vi.useRealTimers();
});

it("polls the union of renderer and panel IDs once per interval", async () => {
  vi.useFakeTimers();
  const load = vi.fn(async (ids: string[]) =>
    Object.fromEntries(
      ids.map((id) => [id, { blueprint_id: "ship", progress: 0.25 }]),
    ),
  );
  const store = new BuildProgressStore(load);
  const renderer = Symbol("renderer");
  const panel = Symbol("panel");

  store.setIds(renderer, ["710", "711"]);
  store.setIds(panel, ["710"]);
  await vi.advanceTimersByTimeAsync(1_500);
  expect(load).toHaveBeenCalledTimes(1);
  expect(load).toHaveBeenLastCalledWith(["710", "711"]);
  expect(store.getProgress("710")).toBe(0.25);

  await vi.advanceTimersByTimeAsync(500);
  expect(load).toHaveBeenCalledTimes(2);
  store.removeSource(panel);
  await vi.advanceTimersByTimeAsync(500);
  expect(load).toHaveBeenCalledTimes(3);

  store.removeSource(renderer);
  expect(store.getSnapshot()).toEqual({});
  await vi.advanceTimersByTimeAsync(1_000);
  expect(load).toHaveBeenCalledTimes(3);
});

it("discards a response for IDs that changed while the request was in flight", async () => {
  vi.useFakeTimers();
  let complete:
    | ((
        value: Record<string, { blueprint_id: string; progress: number }>,
      ) => void)
    | undefined;
  const load = vi.fn(
    () =>
      new Promise<Record<string, { blueprint_id: string; progress: number }>>(
        (resolve) => {
          complete = resolve;
        },
      ),
  );
  const store = new BuildProgressStore(load);
  const source = Symbol("renderer");
  store.setIds(source, ["710"]);
  await vi.advanceTimersByTimeAsync(1_500);
  store.setIds(source, ["711"]);
  complete?.({ "710": { blueprint_id: "ship", progress: 0.5 } });
  await Promise.resolve();
  expect(store.getSnapshot()).toEqual({});
  store.removeSource(source);
});

it("replaces watched progress from full SSE batches and ignores older ticks", () => {
  const load = vi.fn(async () => ({}));
  const store = new BuildProgressStore(load);
  const source = Symbol("renderer");
  store.setIds(source, ["710"]);
  store.streamConnected();

  store.applyStreamBatch({ run_id: "run-1", server_tick: 10, build_state_by_entity: {
    "710": { blueprint_id: "ship", progress: 0.4 },
    "711": { blueprint_id: "ship", progress: 0.7 },
  } }, 100);
  expect(store.getSnapshot()).toEqual({ "710": { blueprint_id: "ship", progress: 0.4 } });

  store.applyStreamBatch({ run_id: "run-1", server_tick: 9, build_state_by_entity: {} }, 50);
  expect(store.getProgress("710")).toBe(0.4);
  store.applyStreamBatch({ run_id: "run-1", server_tick: 11, build_state_by_entity: {} }, 50);
  expect(store.getSnapshot()).toEqual({});

  store.applyStreamBatch({ run_id: "run-2", server_tick: 1, build_state_by_entity: {
    "710": { blueprint_id: "station", progress: 0.2 },
  } }, 80);
  expect(store.getProgress("710")).toBe(0.2);
  store.resetStream();
  expect(store.getSnapshot()).toEqual({});
  store.removeSource(source);
});

it("uses the API only after the later of a fresh watch or SSE batch becomes stale", async () => {
  vi.useFakeTimers();
  const load = vi.fn(async () => ({ "710": { blueprint_id: "ship", progress: 0.5 } }));
  const store = new BuildProgressStore(load);
  const source = Symbol("renderer");
  store.streamConnected();
  store.setIds(source, ["710"]);

  await vi.advanceTimersByTimeAsync(1_000);
  expect(load).not.toHaveBeenCalled();
  store.applyStreamBatch({ run_id: "run-1", server_tick: 10, build_state_by_entity: {
    "710": { blueprint_id: "ship", progress: 0.2 },
  } }, 80);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(load).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(500);
  expect(load).toHaveBeenCalledTimes(1);
  expect(store.getProgress("710")).toBe(0.5);

  store.setIds(source, ["710", "711"]);
  await vi.advanceTimersByTimeAsync(1_000);
  expect(load).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(500);
  expect(load).toHaveBeenCalledTimes(2);
  expect(load).toHaveBeenLastCalledWith(["710", "711"]);
  store.removeSource(source);
});

it("does not let an in-flight fallback overwrite a newer SSE batch", async () => {
  vi.useFakeTimers();
  let finish: ((value: { "710": { blueprint_id: string; progress: number } }) => void) | undefined;
  const load = vi.fn(() => new Promise<{ "710": { blueprint_id: string; progress: number } }>(resolve => { finish = resolve; }));
  const store = new BuildProgressStore(load);
  const source = Symbol("renderer");
  store.setIds(source, ["710"]);
  await vi.advanceTimersByTimeAsync(1_500);
  expect(load).toHaveBeenCalledTimes(1);

  store.applyStreamBatch({ run_id: "run-1", server_tick: 20, build_state_by_entity: {
    "710": { blueprint_id: "ship", progress: 0.8 },
  } }, 80);
  finish?.({ "710": { blueprint_id: "ship", progress: 0.3 } });
  await Promise.resolve();
  expect(store.getProgress("710")).toBe(0.8);
  store.removeSource(source);
});
