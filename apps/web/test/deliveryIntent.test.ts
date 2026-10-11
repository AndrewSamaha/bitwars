import { expect, it, vi } from "vitest";
import { intentQueue } from "@/features/intent-queue/intentQueueManager";

it("replaces collection with a delivery and clears it when the server finishes", () => {
  const send = vi.fn().mockResolvedValue(undefined);
  intentQueue.setSendCallback(send);
  const entityId = 123456;
  intentQueue.handleCollectCommand(entityId, { resourceTypeId: "minerals", nearestCompatible: false });
  intentQueue.handleDeliverCommand(entityId, 654321, ["minerals", "energy"]);
  expect(send).toHaveBeenLastCalledWith(expect.objectContaining({
    kind: "Deliver", entityId, targetId: 654321,
    resourceTypeIds: ["minerals", "energy"], policy: "REPLACE_ACTIVE",
  }));
  const active = intentQueue.getEntityState(entityId).active!;
  expect(active.kind).toBe("deliver");
  intentQueue.onLifecycleEvent({ clientCmdId: active.clientCmdId, intentId: "delivery",
    playerId: "player", serverTick: "10", state: 5, reason: 1 });
  expect(intentQueue.getEntityState(entityId).active).toBeNull();
});
