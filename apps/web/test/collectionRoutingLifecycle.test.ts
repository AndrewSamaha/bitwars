import { afterEach, beforeEach, expect, it, vi, type Mock } from "vitest";
import type { RouteEntity, TravelPlan } from "../src/features/collection-routing/planner";

const env = vi.hoisted(() => {
  const base = { fog_memory: "retain_last_known", speed: 0, stop_radius: 0, mass: 1, health: 100 };
  return {
    entities: [] as RouteEntity[], memory: [] as RouteEntity[],
    states: new Map<number, { active: { kind: string; clientCmdId: string } | null; collectionRoutingHold?: unknown }>(),
    state: "live", connectionListeners: new Set<() => void>(),
    definitions: {
      worker: { ...base, collector: { collects: ["minerals"], transport_rate_per_second: 8 }, max_capacity: { minerals: 10 } },
      minerals: { ...base, resource_node: { resource_type: "minerals", collection_mode: "transport" } },
      habitat: { ...base, depot: true, max_capacity: { minerals: 100 } },
      star: { ...base, radiation_sources: [{ radiation_type: "heat", damage_per_second: 10, max_effective_distance: 1200 }] },
    },
    game: { ready: true, runId: "world-1" },
    submit: vi.fn(), hold: vi.fn(), move: vi.fn(),
    workers: [] as Array<{ onmessage?: (event: { data: unknown }) => void; onerror?: () => void; postMessage: Mock; terminate: Mock }>,
  };
});
vi.mock("../src/features/content/contentManager", () => ({ contentManager: {
  getContent: () => ({ entity_types: env.definitions }), getContentVersion: () => "v1",
  getEntityType: (id: keyof typeof env.definitions) => env.definitions[id], subscribe: () => () => {},
} }));
vi.mock("../src/features/gamestate/connection", () => ({ gameConnection: {
  getSnapshot: () => env.state,
  subscribe: (listener: () => void) => { env.connectionListeners.add(listener); return () => env.connectionListeners.delete(listener); },
} }));
vi.mock("../src/features/gamestate/world", () => ({ game: { get ready() { return env.game.ready; }, get runId() { return env.game.runId; },
  world: { with: () => env.entities },
} }));
vi.mock("../src/features/gamestate/minimapMemory", () => ({ minimapMemory: { entries: () => env.memory.values() } }));
vi.mock("../src/features/intent-queue/intentQueueManager", () => ({ intentQueue: {
  setCollectionRouter: vi.fn(), getAllEntityStates: () => env.states,
  getEntityState: (id: number) => { if (!env.states.has(id)) env.states.set(id, { active: null }); return env.states.get(id)!; },
  submitPlannedCollection: env.submit, setCollectionRoutingHold: env.hold, handleMoveCommand: env.move,
} }));

let cleanup: (() => void) | undefined;
const plan: TravelPlan = { sourceEntityId: 3, depotEntityId: 2, waypointIds: [], initialWaypointIds: [], initialToDepot: false };
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.clearAllMocks();
  env.game.runId = "world-1"; env.game.ready = true; env.state = "live";
  env.connectionListeners.clear(); env.states.clear(); env.memory = []; env.workers = [];
  env.entities = [
    { id: 1, entity_type_id: "worker", owner_player_id: "me", pos: { x: -2000, y: 0 } },
    { id: 2, entity_type_id: "habitat", owner_player_id: "me", pos: { x: -2000, y: 0 } },
    { id: 3, entity_type_id: "minerals", pos: { x: 2000, y: 0 } },
  ];
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
  const target = new EventTarget();
  vi.stubGlobal("window", { addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target), setTimeout });
  vi.stubGlobal("Worker", class {
    onmessage?: (event: { data: unknown }) => void;
    onerror?: () => void;
    postMessage = vi.fn(); terminate = vi.fn();
    constructor() { env.workers.push(this); }
  });
  env.move.mockImplementation((id: number) => env.states.set(id, { active: { kind: "move", clientCmdId: "hold-command" } }));
});
afterEach(() => { cleanup?.(); cleanup = undefined; vi.useRealTimers(); vi.unstubAllGlobals(); });

// Dynamic imports deliberately recreate the browser-lifetime singleton after resetModules.
it("does not submit a stale result after a newer command, disconnect, or world reset", async () => {
  const { collectionRouting } = await import("../src/features/collection-routing/collectionRouting");
  cleanup = collectionRouting.start("me");
  const send = vi.fn();
  collectionRouting.request(1, { resourceTypeId: "minerals", nearestCompatible: false }, send);
  const first = env.workers[0]!;
  const id = first.postMessage.mock.calls[0]![0].id;
  collectionRouting.cancel(1);
  first.onmessage!({ data: { id, result: { kind: "planned", travelPlan: plan } } });
  expect(send).not.toHaveBeenCalled();
  collectionRouting.request(1, { resourceTypeId: "minerals", nearestCompatible: false }, send);
  const secondId = first.postMessage.mock.calls.at(-1)![0].id;
  env.state = "reconnecting"; for (const listener of env.connectionListeners) listener();
  first.onmessage!({ data: { id: secondId, result: { kind: "planned", travelPlan: plan } } });
  expect(first.terminate).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
  env.state = "live"; for (const listener of env.connectionListeners) listener();
  collectionRouting.request(1, { resourceTypeId: "minerals", nearestCompatible: false }, send);
  const second = env.workers.at(-1)!;
  env.game.runId = "world-2";
  second.onmessage!({ data: { id: second.postMessage.mock.calls[0]![0].id, result: { kind: "planned", travelPlan: plan } } });
  expect(send).not.toHaveBeenCalled();
});

it("holds accepted routes once when a new hazard leaves no safe local waypoint route", async () => {
  const { collectionRouting } = await import("../src/features/collection-routing/collectionRouting");
  cleanup = collectionRouting.start("me");
  const send = vi.fn();
  collectionRouting.request(1, { resourceTypeId: "minerals", nearestCompatible: false }, send);
  const worker = env.workers[0]!;
  worker.onmessage!({ data: { id: worker.postMessage.mock.calls[0]![0].id, result: { kind: "planned", travelPlan: plan } } });
  env.states.set(1, { active: { kind: "collect", clientCmdId: "collect-command" } });
  env.memory.push({ id: 6, entity_type_id: "star", pos: { x: 0, y: 0 }, remembered: true });
  env.entities.push({ id: 4, entity_type_id: "waypoint", owner_player_id: "me", pos: { x: 0, y: 1500 } });
  window.dispatchEvent(new Event("bitwars:gamestate-updated"));
  vi.advanceTimersByTime(200);
  const nextId = worker.postMessage.mock.calls.at(-1)![0].id;
  worker.onmessage!({ data: { id: nextId, result: { kind: "blocked", reason: "No safe path" } } });
  expect(send).toHaveBeenCalledOnce(); expect(env.move).toHaveBeenCalledOnce();
  expect(env.hold).toHaveBeenCalledWith(1, expect.objectContaining({ playerId: "me", holdClientCmdId: "hold-command", plan }));
  expect(collectionRouting.getStatus(1)).toContain("No safe path");
  window.dispatchEvent(new Event("bitwars:gamestate-updated")); vi.advanceTimersByTime(200);
  expect(env.move).toHaveBeenCalledOnce(); expect(worker.postMessage).toHaveBeenCalledTimes(2);
});

it("restores owner-scoped blocked collection only when no newer active command superseded its hold", async () => {
  const { collectionRouting } = await import("../src/features/collection-routing/collectionRouting");
  env.states.set(1, { active: null, collectionRoutingHold: {
    playerId: "me", assignment: { resourceTypeId: "minerals", nearestCompatible: false }, plan, holdClientCmdId: "hold-command",
  } });
  cleanup = collectionRouting.start("me");
  collectionRouting.adopt([], "me", "world-1");
  vi.advanceTimersByTime(200);
  const worker = env.workers[0]!;
  worker.onmessage!({ data: { id: worker.postMessage.mock.calls[0]![0].id, result: { kind: "planned", travelPlan: plan } } });
  expect(env.submit).toHaveBeenCalledWith(1, { resourceTypeId: "minerals", nearestCompatible: false }, plan);
  collectionRouting.reset(); env.submit.mockClear();
  collectionRouting.adopt([{ entity_id: 1, intent_kind: "move", client_cmd_id: "newer-command" }], "me", "world-1");
  expect(env.hold).toHaveBeenCalledWith(1, undefined);
  expect(env.submit).not.toHaveBeenCalled();
});
