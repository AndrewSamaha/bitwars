import { afterEach, beforeEach, expect, it, vi, type Mock } from "vitest";
import { MovePlanner, type MovePlanRequest, type MovePlanResult, type RouteEntity } from "../src/features/collection-routing/planner";
import type { SendIntentParams } from "../src/features/intent-queue/intentQueueManager";

const env = vi.hoisted(() => ({
  entities: [] as RouteEntity[], memory: [] as RouteEntity[],
  workers: [] as Array<{ onmessage?: (event: { data: { id: number; result: MovePlanResult } }) => void;
    onerror?: (event?: ErrorEvent) => void; postMessage: Mock; terminate: Mock }>,
  definitions: {
    ship: { fog_memory: "retain_last_known", speed: 100, stop_radius: 0, mass: 1, health: 100 },
    star: { fog_memory: "retain_last_known", speed: 0, stop_radius: 0, mass: 1, health: 100,
      radiation_sources: [{ radiation_type: "heat", damage_per_second: 10, max_effective_distance: 1200 }] },
    waypoint: { fog_memory: "retain_last_known", speed: 0, stop_radius: 0, mass: 1, health: 100 },
  },
  state: "live", ready: true,
}));
vi.mock("../src/features/content/contentManager", () => ({ contentManager: { getContent: () => ({ entity_types: env.definitions }) } }));
vi.mock("../src/features/gamestate/connection", () => ({ gameConnection: { getSnapshot: () => env.state } }));
vi.mock("../src/features/gamestate/minimapMemory", () => ({ minimapMemory: { entries: () => env.memory.values() } }));
vi.mock("../src/features/gamestate/world", () => ({ game: {
  get ready() { return env.ready; }, world: { with: () => env.entities },
} }));

let stop: (() => void) | undefined;
beforeEach(() => {
  vi.resetModules(); env.workers = []; env.memory = []; env.state = "live"; env.ready = true;
  env.entities = [
    { id: 1, entity_type_id: "ship", owner_player_id: "me", pos: { x: -2000, y: 0 } },
    { id: 4, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: -1000, y: 1400 } },
    { id: 5, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 1000, y: 1400 } },
  ];
  env.memory.push({ id: 6, entity_type_id: "star", pos: { x: 0, y: 0 }, remembered: true });
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value) });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal("Worker", class {
    onmessage?: (event: { data: { id: number; result: MovePlanResult } }) => void;
    onerror?: (event?: ErrorEvent) => void;
    postMessage = vi.fn(); terminate = vi.fn();
    constructor() { env.workers.push(this); }
  });
});
afterEach(() => { stop?.(); stop = undefined; vi.unstubAllGlobals(); });

// Re-import the browser-lifetime singletons after installing the test world and Worker.
async function setup() {
  const { intentQueue } = await import("../src/features/intent-queue/intentQueueManager");
  const { moveRouting } = await import("../src/features/collection-routing/moveRouting");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  intentQueue.setSendCallback(send);
  stop = moveRouting.start("me");
  return { intentQueue, moveRouting, send };
}

it("submits a planned user Move as one command with intermediate world coordinates and previews its legs", async () => {
  const { intentQueue, send } = await setup();
  intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
  await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
  const worker = env.workers[0]!;
  const { id, kind, request } = worker.postMessage.mock.calls[0]![0] as { id: number; kind: string; request: MovePlanRequest };
  expect(kind).toBe("move");
  worker.onmessage!({ data: { id, result: new MovePlanner().plan(request) } });
  await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
  await intentQueue.whenSubmitted();
  expect(send.mock.calls[0]![0]).toMatchObject({ kind: "Move", target: { x: 2000, y: 0 },
    via: [{ x: -1000, y: 1400 }, { x: 1000, y: 1400 }], policy: "REPLACE_ACTIVE" });
  expect(intentQueue.getWaypoints(1).map(point => point.x)).toEqual([-1000, 1000, 2000]);
});

it("plans Shift from the route end and Ctrl from the currently active leg", async () => {
  const { intentQueue, send } = await setup();
  intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
  await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
  const worker = env.workers[0]!;
  const first = worker.postMessage.mock.calls[0]![0];
  worker.onmessage!({ data: { id: first.id, result: new MovePlanner().plan(first.request) } });
  await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
  const root = intentQueue.getEntityState(1).active!.clientCmdId;
  intentQueue.applyMoveOrders([{ entity_id: 1, player_id: "me", intent_id: "route", client_cmd_id: root,
    started_tick: 1, route: { waypoints: [{ x: -1000, y: 1400 }, { x: 1000, y: 1400 }, { x: 2000, y: 0 }], next_waypoint_index: 0 } }]);
  intentQueue.handleMoveCommand(1, { x: 4000, y: 0 }, { shift: true, ctrl: false });
  await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(2));
  expect(worker.postMessage.mock.calls[1]![0].request.start).toEqual({ x: 2000, y: 0 });
  worker.onmessage!({ data: { id: worker.postMessage.mock.calls[1]![0].id, result: { kind: "planned", via: [] } } });
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  intentQueue.handleMoveCommand(1, { x: -2000, y: 1400 }, { shift: false, ctrl: true });
  await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(3));
  expect(worker.postMessage.mock.calls[2]![0].request.start).toEqual({ x: -1000, y: 1400 });
  worker.onmessage!({ data: { id: worker.postMessage.mock.calls[2]![0].id, result: { kind: "planned", via: [] } } });
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(3));
  expect(send.mock.calls.map(([params]) => params.policy)).toEqual(["REPLACE_ACTIVE", "APPEND", "CLEAR_THEN_APPEND"]);
});

it("discards a stale planned Move when a newer replacement arrives", async () => {
  const { intentQueue, send } = await setup();
  intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
  await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
  const worker = env.workers[0]!;
  intentQueue.handleMoveCommand(1, { x: -3000, y: 0 }, { shift: false, ctrl: false });
  const old = worker.postMessage.mock.calls[0]![0];
  worker.onmessage!({ data: { id: old.id, result: new MovePlanner().plan(old.request) } });
  await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(2));
  const latest = worker.postMessage.mock.calls[1]![0];
  worker.onmessage!({ data: { id: latest.id, result: new MovePlanner().plan(latest.request) } });
  await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
  expect(send.mock.calls[0]![0]).toMatchObject({ target: { x: -3000, y: 0 }, via: [] });
});

it("does not send an unsafe Move when the local waypoint network has no valid detour", async () => {
  const { intentQueue, send } = await setup();
  env.entities.pop();
  vi.stubGlobal("CustomEvent", class {
    constructor(public type: string, public options: { detail: string }) {}
  });
  intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
  await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
  const worker = env.workers[0]!;
  const { id, request } = worker.postMessage.mock.calls[0]![0];
  worker.onmessage!({ data: { id, result: new MovePlanner().plan(request) } });
  await vi.waitFor(() => expect(window.dispatchEvent).toHaveBeenCalledOnce());
  expect(send).not.toHaveBeenCalled();
  expect(intentQueue.getEntityState(1).active).toBeNull();
});

it("cancels a pending Move plan when another user action replaces it", async () => {
  const { intentQueue, send } = await setup();
  intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
  await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
  const worker = env.workers[0]!;
  intentQueue.handleBuildCommand(1, "waypoint");
  const { id, request } = worker.postMessage.mock.calls[0]![0];
  worker.onmessage!({ data: { id, result: new MovePlanner().plan(request) } });
  await intentQueue.whenSubmitted();
  expect(send.mock.calls.map(([params]) => params.kind)).toEqual(["Build"]);
});

it("cancels a pending Move immediately when a collection request starts planning", async () => {
  const { intentQueue, send } = await setup();
  intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
  await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
  const worker = env.workers[0]!;
  vi.stubGlobal("CustomEvent", class {
    constructor(public type: string, public options: { detail: unknown }) {}
  });
  const collect = vi.fn();
  intentQueue.setCollectionRouter({ request: collect, cancel: vi.fn(), reassign: vi.fn(),
    cargoChanged: vi.fn(), reset: vi.fn() });
  intentQueue.handleCollectCommand(1, { resourceTypeId: "minerals", nearestCompatible: false });
  const { id, request } = worker.postMessage.mock.calls[0]![0];
  worker.onmessage!({ data: { id, result: new MovePlanner().plan(request) } });
  await Promise.resolve();
  expect(collect).toHaveBeenCalledOnce();
  expect(send).not.toHaveBeenCalled();
});

it("uses the same planner after the Worker fails, for direct Moves and waypoint detours", async () => {
  const { intentQueue, send } = await setup();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    intentQueue.handleMoveCommand(1, { x: -1900, y: 0 }, { shift: false, ctrl: false });
    await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledOnce());
    const worker = env.workers[0]!;
    worker.onerror!();
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    expect(send.mock.calls[0]![0]).toMatchObject({ kind: "Move", target: { x: -1900, y: 0 }, via: [] });
    intentQueue.handleMoveCommand(1, { x: 2000, y: 0 }, { shift: false, ctrl: false });
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1]![0]).toMatchObject({ kind: "Move", via: [
      { x: -1000, y: 1400 }, { x: 1000, y: 1400 },
    ] });
    expect(env.workers).toHaveLength(1);
  } finally {
    error.mockRestore();
  }
});

it("recovers every in-flight entity when the shared Move Worker crashes", async () => {
  env.entities.push({ id: 2, entity_type_id: "ship", owner_player_id: "me", pos: { x: -2000, y: 0 } });
  const { intentQueue, send } = await setup();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    for (const id of [1, 2]) intentQueue.handleMoveCommand(id, { x: -1900, y: 0 }, { shift: false, ctrl: false });
    await vi.waitFor(() => expect(env.workers[0]?.postMessage).toHaveBeenCalledTimes(2));
    env.workers[0]!.onerror!();
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls.map(([params]) => "entityId" in params ? params.entityId : undefined)).toEqual([1, 2]);
    expect(send.mock.calls.map(([params]) => params.kind === "Move" ? params.via : undefined)).toEqual([[], []]);
  } finally {
    error.mockRestore();
  }
});
