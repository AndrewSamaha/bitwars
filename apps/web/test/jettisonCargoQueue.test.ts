import { expect, it, vi } from "vitest";
import { IntentQueueManager } from "../src/features/intent-queue/intentQueueManager";

it("jettisons without replacing collection or releasing its queued follow-up on completion", async () => {
  const queue = new IntentQueueManager("test:jettison-cargo");
  const send = vi.fn().mockResolvedValue(undefined);
  queue.setSendCallback(send);
  queue.handleCollectCommand(898, { resourceTypeId: "food", nearestCompatible: false });
  queue.handleBuildCommand(898, "waypoint", true);
  const before = structuredClone(queue.getEntityState(898));
  queue.handleJettisonCargoCommand(898);
  await queue.whenSubmitted();
  const command = send.mock.calls.find(([command]) => command.kind === "JettisonCargo")![0];
  queue.onLifecycleEvent({ clientCmdId: command.clientCmdId, state: 2, entityId: 898,
    intentId: "019237a0-0000-7000-8000-000000000002", playerId: "me", serverTick: "10", reason: 0 });
  expect(queue.getEntityState(898)).toEqual(before);
  queue.onLifecycleEvent({ clientCmdId: command.clientCmdId, state: 5, entityId: 898,
    intentId: "019237a0-0000-7000-8000-000000000002", playerId: "me", serverTick: "10", reason: 0 });
  await queue.whenSubmitted();
  expect(queue.getEntityState(898)).toEqual(before);
  expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Collect", "JettisonCargo"]);
});
