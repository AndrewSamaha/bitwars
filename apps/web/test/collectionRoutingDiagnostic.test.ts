import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { create, toBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { POST } from "@/app/api/v2/collection-routing/diagnostics/route";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getBuffer: vi.fn(), get: vi.fn(), hmget: vi.fn(), set: vi.fn(), xadd: vi.fn() }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: mocks.auth }));
vi.mock("@/lib/db/connection", () => ({ redis: mocks }));

const request = (body: object) => new NextRequest("http://localhost/api/v2/collection-routing/diagnostics", {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
});
const diagnostic = { entity_id: 1, reason_code: "no_safe_initial_route", run_id: "world-1",
  resource_type_id: "minerals", source_entity_id: 3, depot_entity_id: 2, message: "No safe initial approach" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ auth: { playerId: "me" }, res: null });
  mocks.get.mockResolvedValue(JSON.stringify({ run_id: "world-1" }));
  mocks.hmget.mockResolvedValue(["world-1", "42"]);
  mocks.getBuffer.mockResolvedValue(Buffer.from(toBinary(SnapshotSchema, create(SnapshotSchema, {
    tick: 42n,
    discoveredEntitiesJson: JSON.stringify({ me: [3] }),
    entities: [{ id: 1n, ownerPlayerId: "me" }, { id: 2n, ownerPlayerId: "me" }, { id: 3n, ownerPlayerId: "neutral" }],
    playerKnowledge: [],
  }))));
  mocks.set.mockResolvedValue("OK");
  mocks.xadd.mockResolvedValue("123-0");
});

it("requires the authenticated owner, not a supplied player ID", async () => {
  mocks.auth.mockResolvedValue({ auth: { playerId: "other" }, res: null });
  expect((await POST(request({ ...diagnostic, player_id: "me" }))).status).toBe(403);
  expect(mocks.set).not.toHaveBeenCalled();
  expect(mocks.xadd).not.toHaveBeenCalled();
});

it("rejects a stale run or undiscovered source before inserting history", async () => {
  expect((await POST(request({ ...diagnostic, run_id: "old-world" }))).status).toBe(409);
  expect((await POST(request({ ...diagnostic, source_entity_id: 77 }))).status).toBe(403);
  expect(mocks.xadd).not.toHaveBeenCalled();
});

it("writes one bounded client-labelled player-scoped event and deduplicates noisy repeats", async () => {
  const response = await POST(request(diagnostic));
  expect(await response.json()).toEqual({ ok: true, recorded: true, event_id: "123-0" });
  expect(mocks.set).toHaveBeenCalledWith(expect.stringContaining(":collection_routing_blocked:me:1"), "1", "EX", 2, "NX");
  expect(mocks.xadd).toHaveBeenCalledWith("rts:match:demo-001:gameplay_events", "MAXLEN", "~", 100000, "*", "data", expect.any(String));
  const event = JSON.parse(mocks.xadd.mock.calls[0]![6]);
  expect(event).toMatchObject({ event_type: "collection_routing_blocked", reporter: "client", entity_id: 1,
    reason_code: "no_safe_initial_route", resource_type_id: "minerals", source_entity_id: 3, depot_entity_id: 2,
    message: "No safe initial approach", server_tick: 42, run_id: "world-1", recipients: ["me"] });
  expect(event.occurred_at_ms).toEqual(expect.any(Number));
  mocks.set.mockResolvedValueOnce(null);
  expect(await (await POST(request(diagnostic))).json()).toEqual({ ok: true, recorded: false });
  expect(mocks.xadd).toHaveBeenCalledTimes(1);
});
