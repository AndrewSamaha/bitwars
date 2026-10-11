import { afterEach, expect, it, vi } from "vitest";

const mockedRedis = vi.hoisted(() => ({ hmget: vi.fn() }));
vi.mock("@/lib/db/connection", () => ({ redis: mockedRedis }));
vi.mock("@/features/users/utils/auth", () => ({
  requireAuthOr401: vi.fn(async () => ({
    auth: { playerId: "me" },
    res: null,
  })),
}));

import { GET } from "@/app/api/v3/build-state/route";

afterEach(() => vi.clearAllMocks());

it("reads only requested IDs and filters other players' progress", async () => {
  mockedRedis.hmget.mockResolvedValue([
    JSON.stringify({
      entity_id: 710,
      player_id: "me",
      intent_kind: "build",
      blueprint_id: "ship",
      progress: 0.5,
    }),
    JSON.stringify({
      entity_id: 711,
      player_id: "other",
      intent_kind: "build",
      blueprint_id: "base",
      progress: 0.9,
    }),
  ]);
  const response = await GET(
    new Request("http://localhost/api/v3/build-state?ids=710,711,710"),
  );
  expect(response.status).toBe(200);
  expect(mockedRedis.hmget).toHaveBeenCalledWith(
    expect.stringMatching(/:active_intents$/),
    "710",
    "711",
  );
  expect(await response.json()).toEqual({
    build_state_by_entity: { "710": { blueprint_id: "ship", progress: 0.5 } },
  });
});
