import { afterEach, expect, it, vi } from "vitest";
import { IntentQueueManager } from "../src/features/intent-queue/intentQueueManager";

afterEach(() => vi.unstubAllGlobals());

it("applies the first reconnect response after the matching snapshot initializes the world", async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    ),
  );
  const queue = new IntentQueueManager("test:first-connect");
  const reconnect = queue.reconcileWithServer();

  // A fresh browser receives the snapshot before its reconnect request finishes.
  queue.resetForWorld("run-a");
  resolveRequest?.(
    new Response(
      JSON.stringify({
        run_id: "run-a",
        last_processed_client_seq: 211,
        active_intents: [],
      }),
    ),
  );
  expect(await reconnect).not.toBeNull();

  const send = vi.fn();
  queue.setSendCallback(send);
  queue.handleMoveCommand(710, { x: 1, y: 2 }, { shift: false, ctrl: false });
  await queue.whenSubmitted();
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({ clientSeq: 212 }),
  );
});

it("discards a reconnect response when the snapshot switched to another world", async () => {
  let resolveRequest: ((response: Response) => void) | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    ),
  );
  const queue = new IntentQueueManager("test:world-change");
  const reconnect = queue.reconcileWithServer();
  queue.resetForWorld("run-b");
  resolveRequest?.(
    new Response(
      JSON.stringify({
        run_id: "run-a",
        last_processed_client_seq: 211,
        active_intents: [],
      }),
    ),
  );
  expect(await reconnect).toBeNull();
});
