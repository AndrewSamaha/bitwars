import { afterAll, expect, it, vi } from "vitest";
import { BUILD_COMPLETED_EVENT, ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT } from "../src/features/gamestate/events";
import { subscribeToMinimapSoundPings } from "../src/features/pixijs/utils/minimapSoundPings";

const events = new EventTarget();
vi.stubGlobal("window", events);

afterAll(() => vi.unstubAllGlobals());

it("pings the firing origin, not the laser target", () => {
  const notify = vi.fn();
  const unsubscribe = subscribeToMinimapSoundPings(notify);
  events.dispatchEvent(new CustomEvent("bitwars:laser-shot", {
    detail: { origin: { x: -120, y: 70 }, target: { x: 500, y: 900 } },
  }));
  expect(notify.mock.calls).toEqual([[{ x: -120, y: 70 }]]);
  unsubscribe();
});

it("pings discovery, construction, explosions and attacks at the event entity", () => {
  const notify = vi.fn();
  const unsubscribe = subscribeToMinimapSoundPings(notify);
  for (const [index, eventName] of [ENTITY_DETECTED_EVENT, BUILD_COMPLETED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT].entries()) {
    events.dispatchEvent(new CustomEvent(eventName, { detail: { id: index + 1, pos: { x: index * 10, y: index === 0 ? 0 : -index } } }));
  }
  expect(notify.mock.calls).toEqual([
    [{ x: 0, y: 0 }, 1],
    [{ x: 10, y: -1 }, 2],
    [{ x: 20, y: -2 }, 3],
    [{ x: 30, y: -3 }, 4],
  ]);
  unsubscribe();
});

it("ignores events without a source and stops pinging after unmount", () => {
  const notify = vi.fn();
  const unsubscribe = subscribeToMinimapSoundPings(notify);
  events.dispatchEvent(new CustomEvent(ENTITY_EXPLODED_EVENT, { detail: { id: 1 } }));
  events.dispatchEvent(new CustomEvent("bitwars:laser-shot", { detail: { target: { x: 1, y: 2 } } }));
  unsubscribe();
  events.dispatchEvent(new CustomEvent(ENTITY_UNDER_ATTACK_EVENT, { detail: { id: 2, pos: { x: 3, y: 4 } } }));
  expect(notify).not.toHaveBeenCalled();
});
