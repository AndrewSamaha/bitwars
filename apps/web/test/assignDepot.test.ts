import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { fromBinary } from "@bufbuild/protobuf";
import { IntentEnvelopeSchema } from "@bitwars/shared/gen/intent_pb";
import { IntentQueueManager } from "../src/features/intent-queue/intentQueueManager";
const mockedRedis = vi.hoisted(() => ({ get: vi.fn(async () => null), xaddBuffer: vi.fn(async (..._args: unknown[]) => "1-0") }));
vi.mock("@/lib/db/connection", () => ({ redis: mockedRedis }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: vi.fn(async () => ({ auth: { playerId: "me" }, res: null })) }));
vi.mock("@/features/users/server/session-state", () => ({ getPlayerSessionState: vi.fn(async () => "active") }));
import { POST } from "../src/app/api/v1/intent/route";
afterEach(() => vi.clearAllMocks());
const body = { type: "Assign", entity_id: 1, target_id: 2,
  client_cmd_id: "019237a0-0000-7000-8000-000000000001", client_seq: 1 };
const post = (payload: unknown) => POST(new NextRequest("http://localhost/api/v1/intent", { method: "POST", body: JSON.stringify(payload) }));

it.each([2, 0])("encodes an assignment or automatic selection (%s)", async target_id => {
  expect((await post({ ...body, target_id })).status).toBe(200);
  const envelope = fromBinary(IntentEnvelopeSchema, mockedRedis.xaddBuffer.mock.calls[0]![6] as Uint8Array);
  expect(envelope.playerId).toBe("me");
  expect(envelope.payload).toMatchObject({ case: "assignDepot", value: { entityId: 1n, targetId: BigInt(target_id) } });
});
it.each([{ target_id: -1 }, { target_id: 1.5 }, { target_id: "2" }, { target_id: null }, { entity_id: 0 }])("rejects malformed assignments %j", async change => {
  expect((await post({ ...body, ...change })).status).toBe(400);
  expect(mockedRedis.xaddBuffer).not.toHaveBeenCalled();
});
it("assignment lifecycle preserves active collection and subsequent collection commands", async () => {
  const queue = new IntentQueueManager("test:assign");
  const send = vi.fn().mockResolvedValue(undefined);
  queue.setSendCallback(send);
  queue.handleCollectCommand(1, { resourceTypeId: "minerals", nearestCompatible: false });
  await queue.whenSubmitted();
  const before = { ...queue.getEntityState(1).active! };
  queue.handleAssignCommand(1, 2);
  await queue.whenSubmitted();
  const assignment = send.mock.calls[1][0];
  expect(assignment).toMatchObject({ kind: "Assign", entityId: 1, targetId: 2 });
  for (const state of [2, 5]) queue.onLifecycleEvent({ clientCmdId: assignment.clientCmdId, intentId: "assignment", playerId: "me", serverTick: "10", state, reason: 1 });
  expect(queue.getEntityState(1).active).toEqual(before);
});
