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
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });
const body = { type: "Resupply", entity_id: 1, depot_id: 2, target_amounts: { energy: 50, minerals: 40 },
  client_cmd_id: "019237a0-0000-7000-8000-000000000001", client_seq: 1 };
const post = (payload: unknown) => POST(new NextRequest("http://localhost/api/v1/intent", { method: "POST", body: JSON.stringify(payload) }));

it("encodes authenticated resupply with absolute resource targets", async () => {
  expect((await post(body)).status).toBe(200);
  const envelope = fromBinary(IntentEnvelopeSchema, mockedRedis.xaddBuffer.mock.calls[0]![6] as Uint8Array);
  expect(envelope.playerId).toBe("me");
  expect(envelope.payload).toMatchObject({ case: "resupply", value: { entityId: 1n, depotId: 2n, targetAmounts: { energy: 50, minerals: 40 } } });
});

it.each([{ depot_id: 0 }, { depot_id: "2" }, { entity_id: 0 }, { target_amounts: {} },
  { target_amounts: [] }, { target_amounts: { energy: -1 } }, { target_amounts: { energy: null } },
  { target_amounts: { energy: "50" } }, { target_amounts: { energy: 0 } }])("rejects malformed resupply %j", async change => {
  expect((await post({ ...body, ...change })).status).toBe(400);
  expect(mockedRedis.xaddBuffer).not.toHaveBeenCalled();
});

const terminal = (queue: IntentQueueManager, clientCmdId: string, state = 5) => queue.onLifecycleEvent({
  clientCmdId, state, entityId: 1, intentId: "test", playerId: "me", serverTick: "10", reason: 1,
});

it("runs Resupply → Move → Build in order and sends each command once", async () => {
  const queue = new IntentQueueManager("test:resupply");
  const send = vi.fn().mockResolvedValue(undefined);
  queue.setSendCallback(send);
  queue.handleResupplyCommand(1, 2, { energy: 50, minerals: 50 });
  queue.handleMoveCommand(1, { x: 50000, y: 0 }, { shift: true, ctrl: false });
  queue.handleBuildCommand(1, "waypoint", true);
  await queue.whenSubmitted();
  expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Resupply"]);
  const resupply = queue.getEntityState(1).active!;
  terminal(queue, resupply.clientCmdId);
  await queue.whenSubmitted();
  expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Resupply", "Move"]);
  terminal(queue, resupply.clientCmdId); // duplicate completion must not advance again
  const move = queue.getEntityState(1).active!;
  // Route removal may arrive before its completion event.
  queue.applyMoveOrders([], [{ entity_id: 1, player_id: "me", client_cmd_id: move.clientCmdId }]);
  terminal(queue, move.clientCmdId);
  await queue.whenSubmitted();
  expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Resupply", "Move", "Build"]);
  expect(send.mock.calls.map(([command]) => command.clientSeq)).toEqual([1, 2, 3]);
  expect(send.mock.calls[2][0]).toMatchObject({ blueprintId: "waypoint", policy: "REPLACE_ACTIVE" });
  terminal(queue, queue.getEntityState(1).active!.clientCmdId);
  expect(queue.getEntityState(1).active).toBeNull();
  expect(queue.getEntityState(1).queuedOrders).toEqual([]);
});

it("cancels follow-up work if the resupply endpoint is lost", async () => {
  const queue = new IntentQueueManager("test:resupply-lost");
  const send = vi.fn().mockResolvedValue(undefined);
  queue.setSendCallback(send);
  queue.handleResupplyCommand(1, 2, { energy: 50 });
  queue.handleMoveCommand(1, { x: 50000, y: 0 }, { shift: true, ctrl: false });
  terminal(queue, queue.getEntityState(1).active!.clientCmdId, 6);
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(1);
  expect(queue.getEntityState(1).queuedOrders).toEqual([]);
});

it("replacement clears the expedition and Ctrl-queue replaces only its follow-up orders", async () => {
  const queue = new IntentQueueManager("test:resupply-replace");
  const send = vi.fn().mockResolvedValue(undefined);
  queue.setSendCallback(send);
  queue.handleResupplyCommand(1, 2, { energy: 50 });
  queue.handleBuildCommand(1, "waypoint", true);
  queue.handleMoveCommand(1, { x: 50, y: 0 }, { shift: false, ctrl: true });
  expect(queue.getEntityState(1).queuedOrders).toEqual([{ kind: "Move", target: { x: 50, y: 0 } }]);
  queue.handleMoveCommand(1, { x: 100, y: 0 }, { shift: false, ctrl: false });
  await queue.whenSubmitted();
  expect(queue.getEntityState(1).queuedOrders).toEqual([]);
  expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Resupply", "Move"]);
});

it("restores locally queued follow-up work without resending active resupply", async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value) });
  const queue = new IntentQueueManager("test:resupply-restore");
  queue.setSendCallback(vi.fn().mockResolvedValue(undefined));
  queue.handleResupplyCommand(1, 2, { energy: 50 });
  queue.handleBuildCommand(1, "waypoint", true);
  await queue.whenSubmitted();
  const restored = new IntentQueueManager("test:resupply-restore");
  const send = vi.fn().mockResolvedValue(undefined);
  restored.setSendCallback(send);
  expect(restored.getEntityState(1).active?.kind).toBe("resupply");
  terminal(restored, restored.getEntityState(1).active!.clientCmdId);
  await restored.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0].kind).toBe("Build");
});

it("reconnect resumes a completed resupply plan and discards plans replaced in another session", async () => {
  for (const replaced of [false, true]) {
    const queue = new IntentQueueManager(`test:resupply-reconcile-${replaced}`);
    const send = vi.fn().mockResolvedValue(undefined);
    queue.setSendCallback(send);
    queue.handleResupplyCommand(1, 2, { energy: 50 });
    const root = queue.getEntityState(1).active!.clientCmdId;
    queue.handleBuildCommand(1, "waypoint", true);
    terminal(queue, root, 2); // accepted, so reconciliation can inspect server state
    await queue.whenSubmitted();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      last_processed_client_seq: 1,
      active_intents: replaced ? [{ entity_id: 1, client_cmd_id: "other-session-command", intent_kind: "collect", started_tick: 10 }] : [],
    }))));
    await queue.reconcileWithServer();
    await queue.whenSubmitted();
    if (replaced) {
      expect(send).toHaveBeenCalledTimes(1);
      expect(queue.getEntityState(1).queuedOrders).toEqual([]);
    } else {
      expect(send.mock.calls.map(([command]) => command.kind)).toEqual(["Resupply", "Build"]);
    }
  }
});

it("does not send follow-up work after resupply submission fails", async () => {
  const queue = new IntentQueueManager("test:resupply-submit-failure");
  const send = vi.fn().mockRejectedValue(new Error("disconnected"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ active_intents: [] }))));
  queue.setSendCallback(send);
  queue.handleResupplyCommand(1, 2, { energy: 50 });
  queue.handleBuildCommand(1, "waypoint", true);
  await queue.whenSubmitted();
  expect(queue.getEntityState(1).queuedOrders).toEqual([]);
  expect(send).toHaveBeenCalledTimes(1);
});
