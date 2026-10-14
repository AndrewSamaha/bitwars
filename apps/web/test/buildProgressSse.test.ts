import { expect, it, vi } from "vitest";
import { emitBuildProgressBatch } from "../src/lib/db/utils/delta";
import type { SseChannel } from "../src/lib/db/utils/sse-channel";

function emittedBatch(frame: string): Record<string, unknown> {
  const data = frame.split("\n").find(line => line.startsWith("data: "));
  if (!data) throw new Error("missing SSE data");
  return JSON.parse(data.slice(6));
}

it("sends each player only their own build states", async () => {
  const write = vi.fn(async (_frame: string) => {});
  const channel = { write } as unknown as SseChannel;
  const batch = {
    type: "build-progress", run_id: "run-1", server_tick: 42, server_time_ms: 1000,
    recipients: ["player-1", "player-2"],
    states: [
      { entity_id: 710, owner_player_id: "player-1", blueprint_id: "ship", progress: 0.3 },
      { entity_id: 711, owner_player_id: "player-2", blueprint_id: "station", progress: 0.6 },
    ],
  };

  expect(await emitBuildProgressBatch(channel, "1-0", batch, "player-3")).toBe(0);
  expect(write).not.toHaveBeenCalled();
  const bytes = await emitBuildProgressBatch(channel, "1-0", batch, "player-1");
  expect(bytes).toBeGreaterThan(0);
  expect(write).toHaveBeenCalledTimes(1);
  expect(emittedBatch(write.mock.calls[0]![0])).toMatchObject({
    run_id: "run-1", server_tick: 42,
    build_state_by_entity: { "710": { blueprint_id: "ship", progress: 0.3 } },
  });
  expect((emittedBatch(write.mock.calls[0]![0]).build_state_by_entity as Record<string, unknown>)["711"]).toBeUndefined();
});

it("forces a full owner-scoped progress snapshot for a reconnect", async () => {
  const write = vi.fn(async (_frame: string) => {});
  const channel = { write } as unknown as SseChannel;
  const batch = {
    type: "build-progress", run_id: "run-1", server_tick: 50, server_time_ms: 2000,
    recipients: ["player-2"],
    states: [{ entity_id: 711, owner_player_id: "player-2", blueprint_id: "ship", progress: 0.5 }],
  };

  await emitBuildProgressBatch(channel, undefined, batch, "player-1", true);
  expect(write).toHaveBeenCalledTimes(1);
  expect(emittedBatch(write.mock.calls[0]![0])).toMatchObject({
    run_id: "run-1", server_tick: 50, build_state_by_entity: {},
  });
});
