import { afterEach, expect, it, vi } from "vitest";

const mockedRedis = vi.hoisted(() => ({ mget: vi.fn(), set: vi.fn() }));
vi.mock("@/lib/db/connection", () => ({ redis: mockedRedis }));
vi.mock("@/lib/db/utils/redis-streams", () => ({ xRangeWithBuffers: vi.fn() }));

import { assertGameQueryAccess, gameQueryKeys, getScriptDebugState, isGameplayEventCursor, isScriptOwnerId, setScriptDebugEnabled } from "@/lib/game-query";

afterEach(() => vi.clearAllMocks());

it("uses one game namespace and accepts only safe query identifiers", () => {
  const keys = gameQueryKeys("match-7");
  expect(keys.gameplayEvents).toBe("rts:match:match-7:gameplay_events");
  expect(keys.scriptDebug("raiders")).toBe("rts:match:match-7:script_debug:raiders");
  expect(isGameplayEventCursor("123-4")).toBe(true);
  expect(isGameplayEventCursor("123")).toBe(false);
  expect(isScriptOwnerId("raiders_2")).toBe(true);
  expect(isScriptOwnerId("raiders:2")).toBe(false);
});

it("keeps the most recent Lua snapshot readable after capture is disabled", async () => {
  mockedRedis.mget.mockResolvedValue(["0", '{"tick":42}']);
  expect(await getScriptDebugState("raiders", "match-7")).toEqual({ enabled: false, snapshot: { tick: 42 } });

  await setScriptDebugEnabled("raiders", false, "match-7");
  expect(mockedRedis.set).toHaveBeenCalledWith(
    "rts:match:match-7:script_debug_enabled:raiders", "0", "EX", 3600,
  );
});

it("blocks external queries when the M2M-auth gate is enabled", () => {
  process.env.GAME_QUERY_REQUIRE_AUTH = "true";
  expect(assertGameQueryAccess).toThrow("M2M authentication is required");
  process.env.GAME_QUERY_REQUIRE_AUTH = "false";
});
