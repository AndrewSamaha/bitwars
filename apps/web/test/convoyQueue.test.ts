import { expect, it, vi, afterEach } from "vitest";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";
import { IntentQueueManager, type SendIntentParams } from "../src/features/intent-queue/intentQueueManager";

afterEach(() => vi.unstubAllGlobals());

it("sends one convoy command and scopes member lifecycle events", async () => {
  const queue = new IntentQueueManager("test:convoy");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  queue.handleConvoyCommand([2, 1], { x: 50, y: 60 });
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(1);
  const command = send.mock.calls[0]![0];
  if (command.kind !== "Convoy") throw new Error("Expected Convoy");
  expect(command.kind).toBe("Convoy");
  expect(command.entityIds).toEqual([2, 1]);
  const event = { clientCmdId: command.clientCmdId, intentId: "order", playerId: "me",
    serverTick: "10", reason: 1 };
  queue.onLifecycleEvent({ ...event, entityId: 1, state: 2 });
  expect(queue.getEntityState(1).active?.intentId).toBe("order");
  expect(queue.getEntityState(2).active?.intentId).toBeUndefined();
  queue.onLifecycleEvent({ ...event, entityId: 1, state: 6 });
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(2).active?.kind).toBe("convoy");
  queue.onLifecycleEvent({ ...event, entityId: 2, state: 5 });
  expect(queue.getEntityState(2).active).toBeNull();
});

it("rejecting a whole convoy clears all optimistic members", () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    last_processed_client_seq: 1, active_intents: [],
  }))));
  const queue = new IntentQueueManager("test:convoy-reject");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  queue.handleConvoyCommand([1, 2], { x: 50, y: 60 });
  queue.onLifecycleEvent({ clientCmdId: queue.getEntityState(1).active!.clientCmdId,
    intentId: "order", playerId: "me", serverTick: "10", state: 7, reason: 5 });
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(2).active).toBeNull();
});

it("reconnect restores every member sharing the same command ID", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    last_processed_client_seq: 5, active_intents: [1, 2].map((entity_id) => ({
      entity_id, client_cmd_id: "shared", intent_id: "order", started_tick: 4,
      intent_kind: "convoy", move_target: { x: 50, y: 60 },
    })),
  }))));
  const queue = new IntentQueueManager("test:convoy-reconnect");
  await queue.reconcileWithServer();
  queue.onLifecycleEvent({ entityId: 1, clientCmdId: "shared", intentId: "order",
    playerId: "me", serverTick: "10", state: 6, reason: 2 });
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(2).active?.kind).toBe("convoy");
});

it("only exposes convoy snapshot summaries to their owner", () => {
  const filter = new VisibilityFilter("me", {});
  const result = filter.filterSnapshot({ type: "snapshot", tick: 1, entities: [],
    convoys: [{ player_id: "me" }, { player_id: "enemy" }] });
  expect(result.convoys).toEqual([{ player_id: "me" }]);
});
