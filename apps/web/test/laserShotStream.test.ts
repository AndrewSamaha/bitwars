import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LASER_SHOT_EVENT } from "@/features/gamestate/events";

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

vi.mock("@/features/collection-routing/moveRouting", () => ({ moveRouting: { start: () => () => {} } }));

import GameStateStreamBridge from "../src/features/gamestate/components/GameStateStreamBridge";
import { game } from "../src/features/gamestate/world";


class Stream extends EventTarget {
  static current: Stream;
  static CLOSED = 2;
  readyState = 1;
  constructor(_url: string) { super(); Stream.current = this; }
  close() { this.readyState = Stream.CLOSED; }
  emit(type: string, payload: object) { this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(payload) })); }
}

let cleanups: Array<() => void> = [];
beforeEach(() => {
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("EventSource", Stream);
  game.runId = "";
  GameStateStreamBridge();
  for (const effect of hooks.effects.splice(0)) {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  }
});
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  vi.unstubAllGlobals();
});
it("forwards shooter and target IDs from the actual stream listener without numeric conversion", () => {
  const received = vi.fn();
  window.addEventListener(LASER_SHOT_EVENT, event => received((event as CustomEvent).detail));
  Stream.current.emit("laser-shot", {
    type: "laser_shot", attacker_id: "18446744073709551615", target_id: "9007199254740993",
    origin: { x: 1, y: 2 }, target: { x: 3, y: 4 },
  });
  expect(received).toHaveBeenCalledOnce();
  expect(received).toHaveBeenCalledWith({
    attackerId: "18446744073709551615", targetId: "9007199254740993",
    origin: { x: 1, y: 2 }, target: { x: 3, y: 4 },
  });
});
