import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { fromBinary } from "@bufbuild/protobuf";
import { IntentEnvelopeSchema } from "@bitwars/shared/gen/intent_pb";
import { IntentQueueManager } from "../src/features/intent-queue/intentQueueManager";

const redis = vi.hoisted(() => ({ get: vi.fn(async () => null), xaddBuffer: vi.fn(async (..._args: unknown[]) => "1-0") }));
vi.mock("@/lib/db/connection", () => ({ redis }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: vi.fn(async () => ({ auth: { playerId: "me" }, res: null })) }));
vi.mock("@/features/users/server/session-state", () => ({ getPlayerSessionState: vi.fn(async () => "active") }));
import { POST } from "../src/app/api/v1/intent/route";

afterEach(() => vi.clearAllMocks());
const body = { type: "SelfDestruct", entity_id: 1,
  client_cmd_id: "019237a0-0000-7000-8000-000000000001", client_seq: 1 };
const post = (payload: unknown) => POST(new NextRequest("http://localhost/api/v1/intent", { method: "POST", body: JSON.stringify(payload) }));

it("encodes self-destruct with the authenticated player identity", async () => {
  expect((await post({ ...body, player_id: "someone-else" })).status).toBe(200);
  const envelope = fromBinary(IntentEnvelopeSchema, redis.xaddBuffer.mock.calls[0]![6] as Uint8Array);
  expect(envelope.playerId).toBe("me");
  expect(envelope.payload).toMatchObject({ case: "selfDestruct", value: { entityId: 1n } });
});

it.each([0, -1, 1.5, "1", null, Number.MAX_SAFE_INTEGER + 1])("rejects invalid self-destruct ID %j", async entity_id => {
  expect((await post({ ...body, entity_id })).status).toBe(400);
  expect(redis.xaddBuffer).not.toHaveBeenCalled();
});

it("submits self-destruct immediately after prior submissions and discards queued follow-up work", async () => {
  const queue = new IntentQueueManager("test:self-destruct");
  const send = vi.fn().mockResolvedValue(undefined);
  queue.setSendCallback(send);
  queue.handleResupplyCommand(1, 2, { energy: 50 });
  queue.handleBuildCommand(1, "waypoint", true);
  const active = queue.getEntityState(1).active!;
  queue.handleSelfDestructCommand(1);
  await queue.whenSubmitted();
  expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Resupply", "SelfDestruct"]);
  expect(send.mock.calls.map(([command]) => command.clientSeq)).toEqual([1, 2]);
  queue.onLifecycleEvent({ clientCmdId: active.clientCmdId, state: 6, entityId: 1,
    intentId: "test", playerId: "me", serverTick: "10", reason: 2 });
  await queue.whenSubmitted();
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(1).queuedOrders).toEqual([]);
  expect(send).toHaveBeenCalledTimes(2);
});
