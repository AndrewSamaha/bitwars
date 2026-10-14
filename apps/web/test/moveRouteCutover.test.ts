import { afterEach, expect, it, vi } from "vitest";
import { IntentQueueManager, type MoveOrderPayload, type SendIntentParams } from "../src/features/intent-queue/intentQueueManager";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";

afterEach(() => vi.unstubAllGlobals());
const event = (clientCmdId: string, state: number, routeEdit = false) => ({
  clientCmdId, state, routeEdit, intentId: "order", playerId: "me", serverTick: "5", reason: 1,
});
const order = (clientCmdId: string, points = [10], index = 0, last = clientCmdId): MoveOrderPayload => ({
  entity_id: 1, player_id: "me", intent_id: "order", client_cmd_id: clientCmdId,
  last_client_cmd_id: last, started_tick: 5,
  route: { waypoints: points.map((x) => ({ x, y: 0 })), next_waypoint_index: index },
});
async function setup() {
  const queue = new IntentQueueManager("test:server-routes");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  queue.handleMoveCommand(1, { x: 10, y: 0 }, { shift: false, ctrl: false });
  await queue.whenSubmitted();
  const root = queue.getEntityState(1).active!.clientCmdId;
  queue.onLifecycleEvent(event(root, 2));
  queue.applyMoveOrders([order(root)]);
  return { queue, send, root };
}

it("submits Shift edits immediately and retains the root through edit completion", async () => {
  const { queue, send, root } = await setup();
  queue.handleMoveCommand(1, { x: 20, y: 0 }, { shift: true, ctrl: false });
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(2);
  const edit = send.mock.calls[1]![0];
  expect(edit.policy).toBe("APPEND");
  queue.onLifecycleEvent(event(edit.clientCmdId, 2, true));
  queue.onLifecycleEvent(event(edit.clientCmdId, 5, true));
  expect(queue.getEntityState(1).active!.clientCmdId).toBe(root);
  expect(queue.getWaypoints(1).map((point) => point.x)).toEqual([10, 20]);
  queue.applyMoveOrders([order(root, [10, 20], 0, edit.clientCmdId)]);
  expect(queue.getEntityState(1).pendingMoves).toHaveLength(0);
  expect(queue.getWaypoints(1).map((point) => point.pending)).toEqual([false, false]);
  queue.onLifecycleEvent(event(root, 5));
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(2);
});

it("previews Ctrl edits by keeping the current leg and clearing later destinations", async () => {
  const { queue, root } = await setup();
  queue.applyMoveOrders([order(root, [10, 20, 30])]);
  queue.handleMoveCommand(1, { x: 40, y: 0 }, { shift: false, ctrl: true });
  expect(queue.getWaypoints(1).map((point) => point.x)).toEqual([10, 40]);
  await queue.whenSubmitted();
});

it("rejecting an edit preserves the root and removes only that preview", async () => {
  const { queue, send, root } = await setup();
  queue.handleMoveCommand(1, { x: 20, y: 0 }, { shift: true, ctrl: false });
  await queue.whenSubmitted();
  queue.onLifecycleEvent(event(send.mock.calls[1]![0].clientCmdId, 7, true));
  expect(queue.getEntityState(1).active!.clientCmdId).toBe(root);
  expect(queue.getWaypoints(1).map((point) => point.x)).toEqual([10]);
});

it("a Shift command accepted while idle becomes a new root", async () => {
  const queue = new IntentQueueManager("test:idle-append");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  queue.handleMoveCommand(1, { x: 10, y: 0 }, { shift: true, ctrl: false });
  await queue.whenSubmitted();
  const command = send.mock.calls[0]![0];
  queue.onLifecycleEvent(event(command.clientCmdId, 2));
  expect(queue.getEntityState(1).active!.clientCmdId).toBe(command.clientCmdId);
});

it("serializes rapid submissions across Move and other command kinds", async () => {
  const queue = new IntentQueueManager("test:ordered");
  let release: (() => void) | undefined;
  const send = vi.fn(async (_params: SendIntentParams) => {
    if (send.mock.calls.length === 1) await new Promise<void>((resolve) => { release = resolve; });
  });
  queue.setSendCallback(send);
  queue.handleMoveCommand(1, { x: 10, y: 0 }, { shift: false, ctrl: false });
  queue.handleMoveCommand(1, { x: 20, y: 0 }, { shift: true, ctrl: false });
  queue.handleRepairCommand(1, 2);
  await Promise.resolve();
  expect(send).toHaveBeenCalledTimes(1);
  release!();
  await queue.whenSubmitted();
  expect(send.mock.calls.map(([params]) => params.clientSeq)).toEqual([1, 2, 3]);
});

it("a failed HTTP submission does not block subsequent commands", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ last_processed_client_seq: 0, active_intents: [] }))));
  const queue = new IntentQueueManager("test:failure");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  send.mockRejectedValueOnce(new Error("connection failed"));
  queue.setSendCallback(send);
  queue.handleMoveCommand(1, { x: 10, y: 0 }, { shift: false, ctrl: false });
  queue.handleMoveCommand(1, { x: 20, y: 0 }, { shift: true, ctrl: false });
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(2);
});

it("skips queued commands when the world changes", async () => {
  const queue = new IntentQueueManager("test:world-submissions");
  let release: (() => void) | undefined;
  const send = vi.fn(async (_params: SendIntentParams) => new Promise<void>((resolve) => { release = resolve; }));
  queue.setSendCallback(send);
  queue.handleMoveCommand(1, { x: 10, y: 0 }, { shift: false, ctrl: false });
  queue.handleMoveCommand(1, { x: 20, y: 0 }, { shift: true, ctrl: false });
  await Promise.resolve();
  queue.resetForWorld("new-world");
  release!();
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledTimes(1);
});

it("stale route updates/removals cannot clear a newer optimistic replacement", async () => {
  const { queue, root } = await setup();
  queue.handleMoveCommand(1, { x: 30, y: 0 }, { shift: false, ctrl: false });
  const replacement = queue.getEntityState(1).active!.clientCmdId;
  queue.applyMoveOrders([order(root)], [{ entity_id: 1, player_id: "me", client_cmd_id: root }]);
  expect(queue.getEntityState(1).active!.clientCmdId).toBe(replacement);
  expect(queue.getWaypoints(1).map((point) => point.x)).toEqual([30]);
  await queue.whenSubmitted();
});

it("rehydrates remaining server destinations on reconnect without submitting moves", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    last_processed_client_seq: 8, active_intents: [{ entity_id: 1, intent_id: "order", client_cmd_id: "root",
      intent_kind: "move", started_tick: 5, move_target: { x: 20, y: 0 },
      move_route: { waypoints: [{ x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }], next_waypoint_index: 1 } }],
  }))));
  const queue = new IntentQueueManager("test:route-reconnect");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  await queue.reconcileWithServer();
  expect(queue.getWaypoints(1).map((point) => point.x)).toEqual([20, 30]);
  queue.onLifecycleEvent(event("root", 5));
  await queue.whenSubmitted();
  expect(send).not.toHaveBeenCalled();
});

it("migrates old browser queues without replay and preserves the sequence counter", async () => {
  const values = new Map<string, string>([["legacy", JSON.stringify({ clientSeq: 41, entities: {
    "1": { active: null, queue: [{ clientCmdId: "unsent", target: { x: 90, y: 0 } }] },
  } })]]);
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key),
    setItem: (key: string, value: string) => values.set(key, value) });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ last_processed_client_seq: 41, active_intents: [] }))));
  const queue = new IntentQueueManager("legacy");
  const send = vi.fn(async (_params: SendIntentParams) => {});
  queue.setSendCallback(send);
  expect(queue.getMigrationNotice()).toContain("cleared");
  expect(queue.getClientSeq()).toBe(41);
  await queue.reconcileWithServer();
  await queue.whenSubmitted();
  expect(send).not.toHaveBeenCalled();
  expect(JSON.parse(values.get("legacy")!).schemaVersion).toBe(2);
  queue.dismissMigrationNotice();
  expect(new IntentQueueManager("legacy").getMigrationNotice()).toBeNull();
});

it("delivers owner-only route changes even without visible entity updates", () => {
  const filter = new VisibilityFilter("me", {});
  filter.filterSnapshot({ type: "snapshot", tick: 1, entities: [] });
  const update = filter.filterDelta({ type: "delta", tick: 2, updates: [],
    move_order_updates: [{ player_id: "me" }, { player_id: "enemy" }] });
  expect(update?.move_order_updates).toEqual([{ player_id: "me" }]);
  const removal = filter.filterDelta({ type: "delta", tick: 3, updates: [],
    move_order_removals: [{ player_id: "me" }, { player_id: "enemy" }] });
  expect(removal?.move_order_removals).toEqual([{ player_id: "me" }]);
  expect(filter.filterDelta({ type: "delta", tick: 4, updates: [],
    move_order_removals: [{ player_id: "enemy" }] })).toBeUndefined();
});

it("route removal cleans up accepted edit previews when completion was missed", async () => {
  const { queue, send, root } = await setup();
  queue.handleMoveCommand(1, { x: 20, y: 0 }, { shift: true, ctrl: false });
  await queue.whenSubmitted();
  queue.onLifecycleEvent(event(send.mock.calls[1]![0].clientCmdId, 5, true));
  queue.applyMoveOrders([], [{ entity_id: 1, player_id: "me", client_cmd_id: root }]);
  expect(queue.getWaypoints(1)).toEqual([]);
  expect(queue.getEntityState(1).active).toBeNull();
});

it("a delayed reconnect response cannot overwrite a newer streamed route cursor", async () => {
  const { queue, root } = await setup();
  let resolve: ((response: Response) => void) | undefined;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
  const reconnect = queue.reconcileWithServer(false);
  queue.applyMoveOrders([order(root, [10, 20], 1)]);
  resolve!(new Response(JSON.stringify({ last_processed_client_seq: 1, active_intents: [{
    entity_id: 1, client_cmd_id: root, intent_id: "order", intent_kind: "move", started_tick: 5,
    move_route: { waypoints: [{ x: 10, y: 0 }, { x: 20, y: 0 }], next_waypoint_index: 0 },
  }] })));
  expect(await reconnect).toBeNull();
  expect(queue.getWaypoints(1).map((point) => point.x)).toEqual([20]);
});
