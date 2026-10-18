import { afterEach, expect, it, vi } from "vitest";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { IntentQueueManager, type EscortOrderPayload, type SendIntentParams } from "../src/features/intent-queue/intentQueueManager";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";
import { mapSnapshotToJson, mapDeltaToJson } from "../src/lib/db/utils/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import { EscortOrderStateSchema, EscortSlotSchema, EscortOrderRemovalSchema } from "@bitwars/shared/gen/navigation_pb";

const order: EscortOrderPayload = { intent_id: "intent", client_cmd_id: "root", player_id: "me", started_tick: 3,
  target_entity_id: 10, slots: [1,2].map(entity_id => ({ entity_id, offset: { x: 20, y: entity_id * 20 }, slot_index: entity_id-1, status: "in_formation" })) };
afterEach(() => vi.unstubAllGlobals());

it("submits one Escort for the guards and leaves the worker's action intact", async () => {
  const queue = new IntentQueueManager("escort:submit");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  queue.handleCollectCommand(10, { resourceTypeId: "food", nearestCompatible: false });
  const worker = queue.getEntityState(10).active;
  queue.handleEscortCommand([2,1],10);
  await queue.whenSubmitted();
  expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "Escort", entityIds: [1,2], targetEntityId: 10, policy: "REPLACE_ACTIVE" }));
  expect(queue.getEntityState(10).active).toBe(worker);
  expect(queue.getEntityState(1).active?.escortTargetId).toBe(10);
  expect(queue.getEntityState(1).active?.clientCmdId).toBe(queue.getEntityState(2).active?.clientCmdId);
});

it("keeps membership through combat and automatic return; individual cancellation affects only one guard", () => {
  const queue = new IntentQueueManager("escort:combat");
  queue.applyEscortOrders([order]);
  for (const status of ["engaging", "returning", "in_formation"]) {
    queue.applyEscortOrders([{ ...order, slots: order.slots.map(slot => ({ ...slot, status })) }]);
    expect(queue.getEntityState(1).active?.clientCmdId).toBe("root");
    expect(queue.getEntityState(1).active?.escort?.slots[0]?.status).toBe(status);
  }
  queue.onLifecycleEvent({ entityId:1,clientCmdId:"root",intentId:"intent",playerId:"me",serverTick:"4",state:6,reason:2 });
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(2).active?.kind).toBe("escort");
  queue.applyEscortOrders([{ ...order, slots: order.slots.slice(1) }]);
  expect(queue.getEntityState(1).active).toBeNull();
});

it("protects a newer individual Move from stale escort updates/removals", () => {
  const queue = new IntentQueueManager("escort:stale");
  queue.setSendCallback(async () => {});
  queue.applyEscortOrders([order]);
  queue.handleMoveCommand(1,{x:100,y:100},{shift:false,ctrl:false});
  queue.applyEscortOrders([order]);
  queue.applyEscortOrders([],[{ client_cmd_id:"root",player_id:"me" }]);
  expect(queue.getEntityState(1).active?.kind).toBe("move");
  expect(queue.getEntityState(2).active).toBeNull();
});

it("rejecting a batch clears optimistic guards without affecting the leader", () => {
  const queue = new IntentQueueManager("escort:reject");
  queue.setSendCallback(async () => {});
  queue.handleEscortCommand([1,2],10);
  const clientCmdId = queue.getEntityState(1).active!.clientCmdId;
  queue.onLifecycleEvent({clientCmdId,intentId:"bad",playerId:"me",serverTick:"4",state:7,reason:5});
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(2).active).toBeNull();
});

it("reconnect restores the leader reference, slots and statuses without replaying commands", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ last_processed_client_seq: 5,
    active_intents: order.slots.map(slot => ({entity_id:slot.entity_id,client_cmd_id:"root",intent_id:"intent",started_tick:3,intent_kind:"escort"})),
    escort_orders:[order] }))));
  const queue = new IntentQueueManager("escort:reconnect");
  const send = vi.fn(); queue.setSendCallback(send);
  await queue.reconcileWithServer();
  expect(queue.getEntityState(2).active?.escort).toEqual(order);
  expect(queue.getEntityState(2).active?.escortTargetId).toBe(10);
  expect(send).not.toHaveBeenCalled();
  queue.applyEscortOrders([],[],true);
  expect(queue.getEntityState(2).active).toBeNull();
});

it("projects protobuf checkpoints and privately filters updates and motionless removals", () => {
  const checkpoint = create(SnapshotSchema, { tick: 10n, escortOrders:[create(EscortOrderStateSchema, {
    playerId:"me", targetEntityId:10n, clientCmdId:new Uint8Array(16).fill(2),
    slots:[create(EscortSlotSchema,{ entityId:1n,slotIndex:0,status:"engaging",offset:{x:20,y:20} })],
  })] });
  const payload = mapSnapshotToJson(fromBinary(SnapshotSchema,toBinary(SnapshotSchema,checkpoint)));
  expect(payload.escort_orders[0]).toMatchObject({target_entity_id:10,slots:[{entity_id:1,status:"engaging",offset:{x:20,y:20}}]});
  const filter = new VisibilityFilter("me",{});
  expect(filter.filterSnapshot({type:"snapshot",tick:10,entities:[],escort_orders:[...payload.escort_orders,{player_id:"enemy"}]}).escort_orders).toHaveLength(1);
  const delta = mapDeltaToJson(create(DeltaSchema,{tick:11n,escortOrderRemovals:[
    create(EscortOrderRemovalSchema,{playerId:"me",clientCmdId:new Uint8Array(16).fill(2)}),
    create(EscortOrderRemovalSchema,{playerId:"enemy",clientCmdId:new Uint8Array(16).fill(3)}),
  ]}));
  const filtered = filter.filterDelta({ ...delta, type:"delta" });
  expect(filtered?.escort_order_removals).toHaveLength(1);
  expect(filtered?.escort_order_removals?.[0]?.player_id).toBe("me");
});
