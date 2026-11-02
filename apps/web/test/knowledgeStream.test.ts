import { beforeEach, describe, expect, it, vi } from "vitest";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema, type Delta } from "@bitwars/shared/gen/delta_pb";
import { EventsStreamRecordSchema } from "@bitwars/shared/gen/intent_pb";
import { bootstrapAndCatchUp } from "../src/lib/db/utils/bootstrap";
import { emitEventFromBuffer } from "../src/lib/db/utils/delta";
import { mapDeltaToJson, mapSnapshotToJson } from "../src/lib/db/utils/protobuf";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";
import type { SseChannel } from "../src/lib/db/utils/sse-channel";

const mocks = vi.hoisted(() => ({ exec: vi.fn(), get: vi.fn(), range: vi.fn() }));
vi.mock("../src/lib/db/connection", () => ({
  redis: {
    get: mocks.get,
    multi: () => ({
      hgetall() { return this; },
      getBuffer() { return this; },
      exec: mocks.exec,
    }),
  },
}));
vi.mock("../src/lib/db/utils/redis-streams", () => ({ xRangeWithBuffers: mocks.range }));
vi.mock("../src/lib/axiom/server", () => ({ logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const observation = (entityId: bigint, x = 50) => ({
  entityId, entityTypeId: "raider", ownerPlayerId: "enemy", pos: { x, y: 0 }, lastSeenTick: 7n,
});
const remembered = {
  id: "2", entity_type_id: "raider", owner_player_id: "enemy", pos: { x: 50, y: 0 }, last_seen_tick: 7,
};
const checkpoint = () => create(SnapshotSchema, {
  tick: 10n,
  entities: [
    { id: 1n, entityTypeId: "worker", ownerPlayerId: "me", pos: { x: 0, y: 0 } },
    { id: 2n, entityTypeId: "raider", ownerPlayerId: "enemy", pos: { x: 500, y: 0 }, health: 90,
      resources: { resources: [{ resourceType: "food", amount: 999 }] } },
  ],
  playerKnowledge: [
    { playerId: "other", observations: [observation(999n)] },
    { playerId: "me", observations: [observation(2n), observation(1n, 0)] },
  ],
});
const filter = () => new VisibilityFilter("me", { worker: { sensor: { range: 100 } } });
const streamRecord = (delta: Delta) => Buffer.from(toBinary(
  EventsStreamRecordSchema,
  create(EventsStreamRecordSchema, { record: { case: "delta", value: delta } }),
));
function channel() {
  const write = vi.fn(async (_frame: string) => {});
  return { write, value: { write } as unknown as SseChannel };
}
function payload(frame: string) {
  const data = frame.split("\n").find((line) => line.startsWith("data: "));
  if (!data) throw new Error("missing SSE data");
  return JSON.parse(data.slice(6));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exec.mockResolvedValue([[null, { boundary_stream_id: "10-0", run_id: "run-1" }],
    [null, Buffer.from(toBinary(SnapshotSchema, checkpoint()))]]);
  mocks.get.mockResolvedValue(JSON.stringify({ run_id: "run-1", paused: false }));
  mocks.range.mockResolvedValue([]);
});

describe("player observation stream contract", () => {
  it("maps only the selected player's last-seen values, including currently visible sightings", () => {
    const decoded = fromBinary(SnapshotSchema, toBinary(SnapshotSchema, checkpoint()));
    const visible = filter().filterSnapshot(mapSnapshotToJson(decoded, "me"));
    expect(visible.entities.map((entity) => entity.id)).toEqual([1]);
    expect(visible.remembered_entities).toEqual([remembered, { ...remembered, id: "1", pos: { x: 0, y: 0 } }]);
    expect(visible).not.toHaveProperty("playerKnowledge");
    expect(visible).not.toHaveProperty("player_knowledge");
    expect(JSON.stringify(visible)).not.toContain("999");
    expect(mapSnapshotToJson(decoded).remembered_entities).toEqual([]);
    expect(mapSnapshotToJson(decoded, "missing").remembered_entities).toEqual([]);
    expect(mapSnapshotToJson(decoded, "other").remembered_entities.map((entity) => entity.id)).toEqual(["999"]);
  });

  it("preserves uint64 identifiers and ticks without exposing protobuf player arrays", () => {
    const large = 9_007_199_254_740_993n;
    const delta = create(DeltaSchema, { tick: 11n, playerKnowledgeUpdates: [
      { playerId: "other", upserts: [observation(999n)], removedEntityIds: [888n] },
      { playerId: "me", upserts: [{ ...observation(large), lastSeenTick: large }], removedEntityIds: [large] },
    ] });
    const mapped = mapDeltaToJson(fromBinary(DeltaSchema, toBinary(DeltaSchema, delta)), "me");
    expect(mapped.remembered_entity_updates).toEqual([{ ...remembered, id: large.toString(), last_seen_tick: large.toString() }]);
    expect(mapped.forgotten_entity_ids).toEqual([large.toString()]);
    expect(mapped).not.toHaveProperty("playerKnowledgeUpdates");
    expect(mapped).not.toHaveProperty("player_knowledge_updates");
    expect(mapDeltaToJson(delta).remembered_entity_updates).toEqual([]);
    expect(mapDeltaToJson(delta).forgotten_entity_ids).toEqual([]);
  });

  it("omits positionless and non-finite observations instead of inventing positions", () => {
    const observations = [
      observation(2n),
      { ...observation(3n), pos: undefined },
      observation(4n, Number.NaN),
      { ...observation(5n), pos: { x: 0, y: Number.POSITIVE_INFINITY } },
    ];
    const snapshot = create(SnapshotSchema, { playerKnowledge: [{ playerId: "me", observations }] });
    expect(mapSnapshotToJson(snapshot, "me").remembered_entities).toEqual([remembered]);
    const delta = create(DeltaSchema, { playerKnowledgeUpdates: [{ playerId: "me", upserts: observations }] });
    expect(mapDeltaToJson(delta, "me").remembered_entity_updates).toEqual([remembered]);
  });

  it("bootstraps the same authoritative knowledge on every fresh connection", async () => {
    for (let connection = 0; connection < 2; connection++) {
      const output = channel();
      expect(await bootstrapAndCatchUp("game", output.value, () => false, vi.fn(), filter())).toBe("10-0");
      expect(output.write).toHaveBeenCalledTimes(1);
      expect(payload(output.write.mock.calls[0]![0])).toMatchObject({
        run_id: "run-1", entities: [{ id: 1 }], remembered_entities: [remembered, { id: "1" }],
      });
    }
  });

  it("catches up memory-only invalidations after the checkpoint cursor", async () => {
    mocks.range.mockResolvedValueOnce([{ id: "11-0", data: streamRecord(create(DeltaSchema, {
      tick: 11n, playerKnowledgeUpdates: [{ playerId: "me", removedEntityIds: [2n] }],
    })) }]);
    const output = channel();
    expect(await bootstrapAndCatchUp("game", output.value, () => false, vi.fn(), filter())).toBe("11-0");
    expect(output.write).toHaveBeenCalledTimes(2);
    expect(payload(output.write.mock.calls[1]![0])).toMatchObject({
      type: "delta", updates: [], removed_entity_ids: [], forgotten_entity_ids: [2],
    });
    expect(mocks.range).toHaveBeenCalledWith("rts:match:game:events", "(10-0", "+", 512);
  });

  it("emits own memory updates but not another player's or hidden live state", async () => {
    const visibility = filter();
    visibility.filterSnapshot(mapSnapshotToJson(checkpoint(), "me"));
    const output = channel();
    const error = vi.fn();
    await emitEventFromBuffer(output.value, "11-0", streamRecord(create(DeltaSchema, {
      tick: 11n, updates: [{ id: 2n, pos: { x: 600, y: 0 }, health: 10 }],
      playerKnowledgeUpdates: [{ playerId: "other", upserts: [observation(999n)], removedEntityIds: [888n] }],
    })), error, visibility);
    expect(output.write).not.toHaveBeenCalled();
    await emitEventFromBuffer(output.value, "12-0", streamRecord(create(DeltaSchema, {
      tick: 12n, playerKnowledgeUpdates: [{ playerId: "me", upserts: [observation(2n)] }],
    })), error, visibility);
    expect(payload(output.write.mock.calls[0]![0])).toMatchObject({
      updates: [], remembered_entity_updates: [remembered], forgotten_entity_ids: [],
    });
    await emitEventFromBuffer(output.value, "13-0", streamRecord(create(DeltaSchema, {
      tick: 13n, removedEntityIds: [2n],
    })), error, visibility);
    expect(output.write).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  it("does not rescan entities for memory-only deltas and still adopts accepted content", () => {
    let sensorReads = 0;
    const visibility = new VisibilityFilter("me", { worker: { sensor: { get range() { sensorReads++; return 100; } } } });
    visibility.filterSnapshot(mapSnapshotToJson(checkpoint(), "me"));
    sensorReads = 0;
    expect(visibility.filterDelta({ type: "delta", tick: 11, updates: [], forgotten_entity_ids: [2] })?.forgotten_entity_ids).toEqual([2]);
    expect(sensorReads).toBe(0);
    visibility.updateContent({ worker: { sensor: { range: 1000 } } }, {});
    const delta = visibility.filterDelta({ type: "delta", tick: 12, updates: [], remembered_entity_updates: [remembered] });
    expect(delta?.updates[0]).toMatchObject({ id: 2, pos: { x: 500, y: 0 }, health: 90 });
    expect(delta?.updates[0]).not.toHaveProperty("resources");
    expect(delta?.remembered_entity_updates).toEqual([remembered]);
  });

  it("waits for a new-run checkpoint rather than replaying the old run's memory", async () => {
    mocks.get.mockResolvedValue(JSON.stringify({ run_id: "run-2" }));
    const output = channel();
    expect(await bootstrapAndCatchUp("game", output.value, () => false, vi.fn(), filter())).toBeUndefined();
    expect(output.write).not.toHaveBeenCalled();
    expect(mocks.range).not.toHaveBeenCalled();
  });
});
