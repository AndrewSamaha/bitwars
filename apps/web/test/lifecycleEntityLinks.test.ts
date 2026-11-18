import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ pushMessageLog: vi.fn() }));
vi.mock("@/features/hud/components/HUDContext", () => ({ useHUD: () => ({ actions: fixture }) }));
vi.mock("@/features/intent-queue/intentQueueManager", () => ({ intentQueue: {
  getMigrationNotice: () => null, subscribe: () => () => {},
} }));
vi.mock("@/features/content/contentManager", () => ({ contentManager: {
  getEntityType: () => ({ collector: { collects: ["minerals"] }, max_capacity: { minerals: 10 } }),
} }));
vi.mock("@/features/gamestate/world", () => ({ game: { world: { entities: [
  { id: 7, resources: [{ resource_type: "minerals", amount: 10 }] },
] } } }));
import LifecycleToasts from "@/features/hud/components/LifecycleToasts";
import {
  dispatchCollectionDestinationChanged, COLLECT_COMMAND_EVENT, CENTER_CAMERA_ON_ENTITY_EVENT,
} from "@/features/gamestate/events";
let root: ReactTestRenderer;
let events: EventTarget;
beforeEach(async () => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  events = new EventTarget();
  Object.assign(events, { requestAnimationFrame: () => 1, cancelAnimationFrame: vi.fn(), setTimeout: () => 1 });
  vi.stubGlobal("window", events);
  fixture.pushMessageLog.mockClear();
  await act(async () => { root = create(React.createElement(LifecycleToasts)); });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
it("publishes and renders all reroute links in the actual toast without nested buttons", async () => {
  await act(async () => dispatchCollectionDestinationChanged({ entityId: 7, fromDepotId: 8, toDepotId: 9 }));
  expect(fixture.pushMessageLog.mock.lastCall![0].entityLinks.map((link: { entityId: string }) => link.entityId)).toEqual(["7", "8", "9"]);
  const selected: string[] = [];
  events.addEventListener(CENTER_CAMERA_ON_ENTITY_EVENT, event => selected.push((event as CustomEvent<string>).detail));
  const buttons = root.root.findAllByType("button").filter(button => button.props.title);
  for (const button of buttons) {
    expect(button.findAllByType("button").filter(child => child !== button)).toHaveLength(0);
    await act(async () => button.props.onClick({ stopPropagation: vi.fn() }));
  }
  expect(selected).toEqual(["7", "8", "9"]);
});
it("keeps cargo destination IDs even when the depot is missing from the visible world", async () => {
  await act(async () => events.dispatchEvent(new CustomEvent(COLLECT_COMMAND_EVENT, { detail: {
    entityId: 7, resourceTypeId: "minerals", nearestCompatible: false, depotEntityId: 9,
  } })));
  const entry = fixture.pushMessageLog.mock.lastCall![0];
  expect(entry.message).toContain("depot #9");
  expect(entry.entityLinks.map((link: { entityId: string }) => link.entityId)).toEqual(["7", "9"]);
  const selected: string[] = [];
  events.addEventListener(CENTER_CAMERA_ON_ENTITY_EVENT, event => selected.push((event as CustomEvent<string>).detail));
  await act(async () => root.root.findAllByType("button").find(button => button.props.title === "Focus entity 9")!.props.onClick({ stopPropagation: vi.fn() }));
  expect(selected).toEqual(["9"]);
});
