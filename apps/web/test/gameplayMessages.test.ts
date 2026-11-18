import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { messageEntityLinks } from "@/features/hud/messageLog";
import { BUILD_COMPLETED_EVENT, ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT } from "@/features/gamestate/events";
const fixture = vi.hoisted(() => ({ pushMessageLog: vi.fn(), player: "p1" as string | null }));
vi.mock("@/features/hud/components/HUDContext", () => ({ useHUD: () => ({ actions: fixture }) }));
vi.mock("@/features/users/components/identity/SessionContext", () => ({ useSession: () => ({ effectivePlayerId: fixture.player }) }));
// Any accidental dependency on audio fails, including muted/unregistered/unavailable playback.
vi.mock("@/features/audio/audioManager", () => { throw new Error("Audio unavailable"); });
import GameplayMessageBridge from "@/features/hud/components/GameplayMessageBridge";
let root: ReactTestRenderer;
let events: EventTarget;
const emit = (name: string, detail: unknown) => events.dispatchEvent(new CustomEvent(name, { detail }));
const entity = { id: 7, entity_type_id: "planet_blue" };
const shot = { origin: { x: 1.4, y: 2 }, target: { x: 30, y: 40 } };
beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  events = new EventTarget();
  vi.stubGlobal("window", events);
  fixture.player = "p1";
  fixture.pushMessageLog.mockClear();
  await act(async () => { root = create(React.createElement(GameplayMessageBridge)); });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("logs every semantic sound trigger with audio unavailable and exact entity links", () => {
  for (const name of [ENTITY_UNDER_ATTACK_EVENT, ENTITY_DETECTED_EVENT, BUILD_COMPLETED_EVENT, ENTITY_EXPLODED_EVENT]) emit(name, entity);
  emit("bitwars:laser-shot", shot);
  const entries = fixture.pushMessageLog.mock.calls.map(([entry]) => entry);
  expect(entries.map(entry => entry.kind)).toEqual(["entity-under-attack", "entity-detected", "build-completed", "entity-exploded", "laser-fired"]);
  expect(entries.map(entry => entry.title)).toEqual(["Under attack", "Entity detected", "Build completed", "Entity destroyed", "Laser fire"]);
  for (const entry of entries.slice(0, 4)) {
    expect(messageEntityLinks(entry).map(link => [entry.message.slice(link.start, link.end), link.entityId])).toEqual([["planet blue #7", "7"]]);
    expect(entry.timestamp).toEqual(expect.any(Number));
  }
  expect(entries[1].message).toBe("planet blue #7 entered sensor coverage.");
  expect(entries[4].message).toBe("1 laser shot; from (1, 2) to (30, 40).");
});
it("counts rapid detection and fire separately while preserving unrelated critical alerts", () => {
  for (let id = 0; id < 100; id++) {
    emit(ENTITY_DETECTED_EVENT, { ...entity, id });
    emit("bitwars:laser-shot", shot);
  }
  for (const id of [8, 9]) emit(ENTITY_UNDER_ATTACK_EVENT, { ...entity, id });
  emit(BUILD_COMPLETED_EVENT, entity);
  emit(ENTITY_EXPLODED_EVENT, entity);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(6);
  vi.advanceTimersByTime(2_000);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(8);
  expect(fixture.pushMessageLog.mock.calls[6][0].message).toBe("99 detections; latest: planet blue #99 entered sensor coverage.");
  expect(fixture.pushMessageLog.mock.calls[7][0].message).toContain("99 laser shots; latest from");
  vi.advanceTimersByTime(10_000);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(8);
});
it("cleans subscriptions and pending batches on player changes, logout and remount", async () => {
  emit(ENTITY_DETECTED_EVENT, entity);
  emit(ENTITY_DETECTED_EVENT, entity);
  fixture.player = "p2";
  await act(async () => root.update(React.createElement(GameplayMessageBridge)));
  vi.advanceTimersByTime(5_000);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(1);
  emit(ENTITY_DETECTED_EVENT, entity);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(2);
  fixture.player = null;
  await act(async () => root.update(React.createElement(GameplayMessageBridge)));
  emit(ENTITY_UNDER_ATTACK_EVENT, entity);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(2);
  await act(async () => root.unmount());
  fixture.player = "p1";
  await act(async () => { root = create(React.createElement(GameplayMessageBridge)); });
  emit(ENTITY_UNDER_ATTACK_EVENT, entity);
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(3);
});
it("handles missing entity IDs without fabricating links", () => {
  emit(ENTITY_EXPLODED_EVENT, { entity_type_id: "worker" });
  const entry = fixture.pushMessageLog.mock.lastCall![0];
  expect(entry.message).toBe("worker was destroyed.");
  expect(messageEntityLinks(entry)).toEqual([]);
});
