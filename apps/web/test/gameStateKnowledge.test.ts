import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { EntityObservation } from "../src/features/gamestate/minimapMemory";

const hooks = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)> }));
const session = vi.hoisted(() => ({ effectivePlayerId: "me", actingAsId: null }));
vi.mock("react", () => ({
  default: {},
  useEffect: (effect: () => void | (() => void)) => { hooks.effects.push(effect); },
  useRef: (current: unknown) => ({ current }),
  useState: () => [0, vi.fn()],
}));
vi.mock("@/lib/axiom/client", () => ({ useLogger: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }) }));
vi.mock("@/features/users/components/identity/SessionContext", () => ({ useSession: () => session }));
vi.mock("@/features/hud/components/HUDContext", () => ({ useHUD: () => ({ actions: {
  clearSelection: vi.fn(), setSelectedAction: vi.fn(), setHovered: vi.fn(), setTooltip: vi.fn(),
} }) }));
vi.mock("@/features/content/contentManager", () => ({ contentManager: {
  startReporting: () => () => {}, beginWorld: vi.fn(),
  getEntityType: (id: string) => ({ fog_memory: id === "station" ? "retain_last_known" : "forget_when_hidden" }),
} }));
vi.mock("@/features/content/contentEvents", () => ({ syncContentChangedEvent: vi.fn() }));
vi.mock("@/features/collection-routing/collectionRouting", () => ({ collectionRouting: { start: () => () => {} } }));
vi.mock("@/features/build-state/buildProgressStore", () => ({ buildProgressStore: { resetStream: vi.fn() } }));
vi.mock("@/features/intent-queue/intentQueueManager", () => ({ intentQueue: {
  applyMoveOrders: vi.fn(), applySentryOrders: vi.fn(), applyEscortOrders: vi.fn(), resetForWorld: vi.fn(),
  getEntityState: () => ({}),
} }));

import GameStateStreamBridge from "../src/features/gamestate/components/GameStateStreamBridge";
import { game } from "../src/features/gamestate/world";
import { minimapMemory } from "../src/features/gamestate/minimapMemory";

class Stream extends EventTarget {
  static current: Stream;
  static CLOSED = 2;
  readyState = 1;
  constructor(_url: string) { super(); Stream.current = this; }
  close() { this.readyState = Stream.CLOSED; }
  emit(type: string, payload: object) { this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(payload) })); }
}
const observation = (id: number, type = "station", x = 10): EntityObservation => ({
  id, entity_type_id: type, owner_player_id: "other", pos: { x, y: 20 }, last_seen_tick: "12345678901234567890",
});
const entity = (id: number) => [...game.world.with("id")].find(value => String(value.id) === String(id));
const snapshot = (observations: EntityObservation[], entities: object[] = [], run = "run-1") => {
  Stream.current.emit("snapshot", { type: "snapshot", tick: 100, run_id: run, entities, remembered_entities: observations });
};
const delta = (fields: object) => Stream.current.emit("delta", { type: "delta", tick: 101, updates: [], ...fields });
let cleanups: Array<() => void> = [];
const mount = () => {
  GameStateStreamBridge();
  for (const effect of hooks.effects.splice(0)) {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  }
};
beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("EventSource", Stream);
  game.runId = "";
  session.effectivePlayerId = "me";
  mount();
});
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  minimapMemory.clear();
  vi.unstubAllGlobals();
});

it("restores persisted observations after refresh with independent world and minimap policies", () => {
  snapshot([observation(1), observation(2, "ship")]);
  expect(entity(1)).toEqual({
    id: 1, entity_type_id: "station", owner_player_id: "other", pos: { x: 10, y: 20 },
    remembered: { last_seen_tick: "12345678901234567890" },
  });
  expect(entity(2)).toBeUndefined();
  expect([...minimapMemory.entries()].map(value => value.id)).toEqual([1, 2]);
  for (const cleanup of cleanups.splice(0)) cleanup();
  mount();
  snapshot([observation(1), observation(2, "ship")]);
  expect(entity(1)?.remembered).toEqual({ last_seen_tick: "12345678901234567890" });
  expect([...minimapMemory.entries()]).toHaveLength(2);
});

it("uses server last-seen coordinates on hiding and never invents knowledge from hidden IDs", () => {
  snapshot([observation(1)], [
    { ...observation(1), pos: { x: 999, y: 999 }, vel: { x: 100, y: 0 }, health: 40 },
    { ...observation(2), vel: { x: 100, y: 0 } },
  ]);
  delta({ hidden_entity_ids: [1, 2] });
  expect(entity(1)).toEqual({
    id: 1, entity_type_id: "station", owner_player_id: "other", pos: { x: 10, y: 20 },
    remembered: { last_seen_tick: "12345678901234567890" },
  });
  expect(entity(1)).not.toHaveProperty("vel");
  expect(entity(1)).not.toHaveProperty("health");
  expect(entity(2)).toBeUndefined();
  expect(minimapMemory.get(2)).toBeUndefined();
});

it("gives visible entities precedence and clears remembered status on reacquisition", () => {
  snapshot([observation(1)], [{ ...observation(1), pos: { x: 50, y: 60 } }]);
  expect(entity(1)?.remembered).toBeUndefined();
  expect(entity(1)?.pos).toEqual({ x: 50, y: 60 });
  delta({ hidden_entity_ids: [1] });
  expect(entity(1)?.remembered).toBeDefined();
  delta({ updates: [{ ...observation(1), pos: { x: 70, y: 80 } }], remembered_entity_updates: [observation(1, "station", 55)] });
  expect(entity(1)?.remembered).toBeUndefined();
  expect(entity(1)?.pos).toEqual({ x: 70, y: 80 });
  delta({ forgotten_entity_ids: [1] });
  expect(entity(1)?.pos).toEqual({ x: 70, y: 80 });
  expect(minimapMemory.get(1)).toBeUndefined();
});

it("forgets world and minimap observations, including delta-only observations", () => {
  snapshot([]);
  delta({ remembered_entity_updates: [observation(1), observation(2, "ship")] });
  expect(entity(1)?.remembered).toBeDefined();
  expect([...minimapMemory.entries()]).toHaveLength(2);
  delta({ forgotten_entity_ids: ["1", 2] });
  expect(entity(1)).toBeUndefined();
  expect([...minimapMemory.entries()]).toEqual([]);
});

it("replaces complete snapshots and clears all knowledge on run or player changes", () => {
  snapshot([observation(1), observation(2, "ship")]);
  snapshot([]);
  expect(entity(1)).toBeUndefined();
  expect([...minimapMemory.entries()]).toEqual([]);
  snapshot([observation(1)]);
  snapshot([], [], "run-2");
  expect(entity(1)).toBeUndefined();
  expect([...minimapMemory.entries()]).toEqual([]);
  snapshot([observation(1)], [], "run-2");
  for (const cleanup of cleanups.splice(0)) cleanup();
  session.effectivePlayerId = "other-player";
  mount();
  expect(entity(1)).toBeUndefined();
  expect([...minimapMemory.entries()]).toEqual([]);
});
