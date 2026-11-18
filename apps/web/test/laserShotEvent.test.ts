import { afterEach, expect, it, vi } from "vitest";
import { dispatchLaserShot, LASER_SHOT_EVENT, laserEntityId } from "@/features/gamestate/events";

afterEach(() => vi.unstubAllGlobals());
it("preserves string shooter/target IDs from the laser_shot SSE payload", () => {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  const received = vi.fn();
  events.addEventListener(LASER_SHOT_EVENT, event => received((event as CustomEvent).detail));
  const sse = new MessageEvent("laser-shot", { data: JSON.stringify({
    type: "laser_shot", attacker_id: "18446744073709551615", target_id: "9007199254740993",
    origin: { x: 1, y: 2 }, target: { x: 3, y: 4 },
  }) });
  dispatchLaserShot(JSON.parse(sse.data));
  expect(received).toHaveBeenCalledOnce();
  expect(received).toHaveBeenCalledWith({
    attackerId: "18446744073709551615", targetId: "9007199254740993",
    origin: { x: 1, y: 2 }, target: { x: 3, y: 4 },
  });
});
it("retains legacy coordinates and ignores invalid event types or absent endpoints", () => {
  const events = new EventTarget();
  vi.stubGlobal("window", events);
  const received = vi.fn();
  events.addEventListener(LASER_SHOT_EVENT, event => received((event as CustomEvent).detail));
  const payload = { type: "laser_shot", origin: { x: 1, y: 2 }, target: { x: 3, y: 4 } };
  dispatchLaserShot(payload);
  dispatchLaserShot({ ...payload, type: "other" });
  dispatchLaserShot({ ...payload, target: undefined });
  expect(received).toHaveBeenCalledOnce();
  expect(received).toHaveBeenCalledWith({ origin: payload.origin, target: payload.target, attackerId: undefined, targetId: undefined });
});
it.each([undefined, null, "", "0", "-1", "1.5", "NaN", "18446744073709551616", "123456789012345678901234", 9007199254740992])("rejects invalid/sentinel ID %j without unsafe numeric conversion", id => {
  expect(laserEntityId(id)).toBeUndefined();
});
