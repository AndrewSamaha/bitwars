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
  await vi.advanceTimersByTimeAsync(0);
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
  await vi.advanceTimersByTimeAsync(0);
  store.setIds(source, ["711"]);
  complete?.({ "710": { blueprint_id: "ship", progress: 0.5 } });
  await Promise.resolve();
  expect(store.getSnapshot()).toEqual({});
  store.removeSource(source);
});
