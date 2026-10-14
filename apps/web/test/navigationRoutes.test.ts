import { expect, it } from "vitest";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { MoveOrderStateSchema, NavigationRouteSchema, RouteTraversal } from "@bitwars/shared/gen/navigation_pb";
import { Vec2Schema } from "@bitwars/shared/gen/vec2_pb";
import { mapSnapshotToJson } from "../src/lib/db/utils/protobuf";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";

it("decodes and projects a Move checkpoint's root identity and route cursor", () => {
  const order = create(MoveOrderStateSchema, {
    entityId: 42n, playerId: "me", intentId: new Uint8Array(16).fill(1),
    clientCmdId: new Uint8Array(16).fill(2), startedTick: 5n,
    route: create(NavigationRouteSchema, {
      waypoints: [create(Vec2Schema, { x: 10, y: 20 }), create(Vec2Schema, { x: 30, y: 40 })],
      nextWaypointIndex: 1, direction: 1, traversal: RouteTraversal.FINISH_AT_END,
    }),
  });
  const checkpoint = create(SnapshotSchema, { tick: 10n, moveOrders: [order] });
  const decoded = fromBinary(SnapshotSchema, toBinary(SnapshotSchema, checkpoint));
  const payload = mapSnapshotToJson(decoded);
  expect(payload.move_orders[0]).toMatchObject({ entity_id: 42, player_id: "me", started_tick: 5,
    intent_id: "01".repeat(16), client_cmd_id: "02".repeat(16),
    route: { waypoints: [{ x: 10, y: 20 }, { x: 30, y: 40 }], next_waypoint_index: 1, direction: 1 } });
});

it("filters other owners' Move route destinations from snapshots", () => {
  const filter = new VisibilityFilter("me", {});
  const payload = filter.filterSnapshot({ type: "snapshot", tick: 10, entities: [],
    move_orders: [{ player_id: "me" }, { player_id: "enemy" }] });
  expect(payload.move_orders).toEqual([{ player_id: "me" }]);
});
