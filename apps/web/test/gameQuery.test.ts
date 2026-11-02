import { afterEach, expect, it, vi } from "vitest";
import { create, toBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { GET as getSnapshot } from "@/app/api/v2/game-query/snapshot/route";

const mockedRedis = vi.hoisted(() => ({ mget: vi.fn(), set: vi.fn(), getBuffer: vi.fn() }));
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

it("includes all players' persisted knowledge only in the operator snapshot response", async () => {
  process.env.GAME_QUERY_REQUIRE_AUTH = "false";
  const large = 9_007_199_254_740_993n;
  mockedRedis.getBuffer.mockResolvedValue(Buffer.from(toBinary(SnapshotSchema, create(SnapshotSchema, {
    tick: 20n,
    playerKnowledge: [
      { playerId: "one", observations: [{ entityId: 2n, entityTypeId: "raider", ownerPlayerId: "enemy",
        pos: { x: 10, y: 20 }, lastSeenTick: 7n }] },
      { playerId: "two", observations: [{ entityId: large, entityTypeId: "minerals", ownerPlayerId: "universe",
        pos: { x: 30, y: 40 }, lastSeenTick: large }] },
    ],
  }))));
  const response = await getSnapshot();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.remembered_entities).toEqual([]);
  expect(body.player_knowledge).toEqual([
    { player_id: "one", observations: [{ entity_id: 2, entity_type_id: "raider", owner_player_id: "enemy",
      pos: { x: 10, y: 20 }, last_seen_tick: 7 }] },
    { player_id: "two", observations: [{ entity_id: large.toString(), entity_type_id: "minerals", owner_player_id: "universe",
      pos: { x: 30, y: 40 }, last_seen_tick: large.toString() }] },
  ]);
});
