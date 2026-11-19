import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { EntityTypeDef } from "@/features/content/contentManager";
import type { RouteEntity } from "@/features/collection-routing/planner";
const fixture = vi.hoisted(() => ({
  pushMessageLog: vi.fn(), entities: [] as RouteEntity[], definition: undefined as EntityTypeDef | undefined,
}));
vi.mock("@/features/hud/components/HUDContext", () => ({ useHUD: () => ({ actions: { pushMessageLog: fixture.pushMessageLog } }) }));
vi.mock("@/features/content/contentManager", () => ({ contentManager: {
  getEntityType: () => fixture.definition,
} }));
vi.mock("@/features/gamestate/world", () => ({ game: { world: {
  get entities() { return fixture.entities; }, with: () => fixture.entities,
} } }));
import LifecycleToasts from "@/features/hud/components/LifecycleToasts";
import { IntentQueueManager } from "@/features/intent-queue/intentQueueManager";
import { collectionRouting } from "@/features/collection-routing/collectionRouting";
import { CENTER_CAMERA_ON_ENTITY_EVENT } from "@/features/gamestate/events";
let root: ReactTestRenderer;
let queue: IntentQueueManager;
let events: EventTarget;
const send = vi.fn();
const baseDefinition = { fog_memory: "retain_last_known" as const, speed: 0, stop_radius: 0, mass: 1, health: 100 };
beforeEach(async () => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  events = new EventTarget();
  Object.assign(events, { requestAnimationFrame: () => 1, cancelAnimationFrame: vi.fn(), setTimeout: () => 1 });
  vi.stubGlobal("window", events);
  fixture.pushMessageLog.mockClear(); send.mockReset();
  fixture.entities = [{ id: 7, entity_type_id: "collector_heavy", pos: { x: 0, y: 0 }, resources: [{ resource_type: "energy", amount: 10 }] }];
  fixture.definition = { ...baseDefinition, collector: { collects: ["energy"] }, max_capacity: {} };
  queue = new IntentQueueManager("test:cargo-hud");
  queue.setSendCallback(send);
  await act(async () => { root = create(React.createElement(LifecycleToasts)); });
});
afterEach(async () => {
  collectionRouting.cancel(7);
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

const cargoCapacities: (Record<string, number> | undefined)[] = [undefined, {}, { energy: 10 }];
for (const type of ["collector_solar", "collector_solar_v2", "habitat", "planet_blue_inhabitated"]) {
  for (const capacity of cargoCapacities) {
    for (const receiver of ["absent", "full"]) {
      it.each([false, true])(`${type}, capacity=${JSON.stringify(capacity)}, receiver=${receiver}, nearest=%s sends bare Collect without cargo feedback`, async nearestCompatible => {
        fixture.entities[0]!.entity_type_id = type;
        fixture.definition = { ...baseDefinition, collector: { collects: ["energy"], transport_rate_per_second: 0 }, max_capacity: capacity };
        if (receiver === "full") fixture.entities.push({ id: 9, entity_type_id: "storage", pos: { x: 0, y: 0 }, resources: [{ resource_type: "energy", amount: 100 }] });
        // Exercise the actual routing bypass as well as queue submission and the mounted listener.
        queue.setCollectionRouter(collectionRouting);
        await act(async () => {
          queue.handleCollectCommand(7, { resourceTypeId: nearestCompatible ? undefined : "energy", nearestCompatible });
          await queue.whenSubmitted();
        });
        expect(fixture.pushMessageLog).not.toHaveBeenCalled();
        expect(send).toHaveBeenCalledOnce();
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: "Collect", entityId: 7, nearestCompatible, resourceTypeId: nearestCompatible ? undefined : "energy", travelPlan: undefined }));
      });
    }
  }
}

it.each([undefined, {} as EntityTypeDef])("does not assert incapacity for an unknown collector definition %j", async definition => {
  fixture.definition = definition;
  await act(async () => queue.handleCollectCommand(7, { resourceTypeId: "energy", nearestCompatible: false }));
  expect(fixture.pushMessageLog).not.toHaveBeenCalled();
});

it.each([undefined, 8])("retains the transport diagnostic with default/positive rate %s and an exact type link", async rate => {
  fixture.definition!.collector!.transport_rate_per_second = rate;
  await act(async () => queue.handleCollectCommand(7, { resourceTypeId: "energy", nearestCompatible: false }));
  const entry = fixture.pushMessageLog.mock.lastCall![0];
  expect(entry.message).toBe("collector heavy #7 has no capacity for energy and cannot collect it.");
  expect(entry.entityLinks).toEqual([{ start: 0, end: "collector heavy #7".length, entityId: "7" }]);
  const focused = vi.fn(); events.addEventListener(CENTER_CAMERA_ON_ENTITY_EVENT, focused);
  await act(async () => root.root.findAllByType("button").find(button => button.props.title === "Focus entity 7")!.props.onClick({ stopPropagation: vi.fn() }));
  expect(focused.mock.lastCall![0].detail).toBe("7");
});

it.each([false, true])("only reports full transport cargo delivery with a depot plan (%s)", async planned => {
  fixture.definition!.max_capacity = { energy: 10 };
  if (planned) queue.setCollectionRouter({ cancel: vi.fn(), reassign: vi.fn(), cargoChanged: vi.fn(), reset: vi.fn(), request: (_id, _assignment, submit) => submit({ sourceEntityId: 8, depotEntityId: 9, waypointIds: [], initialWaypointIds: [], initialToDepot: true }) });
  await act(async () => { queue.handleCollectCommand(7, { resourceTypeId: "energy", nearestCompatible: false }); await queue.whenSubmitted(); });
  expect(fixture.pushMessageLog).toHaveBeenCalledTimes(planned ? 1 : 0);
  if (planned) expect(fixture.pushMessageLog.mock.lastCall![0].kind).toBe("collection-delivering-cargo");
});

it.each(["collector_solar", "collector_solar_v2", "habitat", "planet_blue_inhabitated"])("%s suppresses delivery feedback even when a command carries a depot plan", async type => {
  fixture.entities[0]!.entity_type_id = type;
  fixture.definition = { ...baseDefinition, collector: { collects: ["energy"], transport_rate_per_second: 0 }, max_capacity: { energy: 10 } };
  queue.setCollectionRouter({ cancel: vi.fn(), reassign: vi.fn(), cargoChanged: vi.fn(), reset: vi.fn(), request: (_id, _assignment, submit) => submit({ sourceEntityId: 8, depotEntityId: 9, waypointIds: [], initialWaypointIds: [], initialToDepot: true }) });
  await act(async () => { queue.handleCollectCommand(7, { resourceTypeId: "energy", nearestCompatible: false }); await queue.whenSubmitted(); });
  expect(fixture.pushMessageLog).not.toHaveBeenCalled();
});
