import { expect, it } from "vitest";
import { MinimapMemory, type EntityObservation } from "../src/features/gamestate/minimapMemory";

const sighting = (id: number | string, owner = "universe", tick: number | string = 42): EntityObservation => ({
  id, entity_type_id: "ship", owner_player_id: owner, pos: { x: 10, y: 20 }, last_seen_tick: tick,
});

it("hydrates non-owned observations and preserves server ticks without local movement prediction", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  const observations = ["universe", "raiders", "other", "me"].map((owner, index) => sighting(index, owner, "9007199254740993"));
  memory.replace(observations);
  observations[0]!.pos.x = 999;
  expect([...memory.entries()].map(entity => [entity.id, entity.pos.x, entity.remembered.last_seen_tick]))
    .toEqual([[0, 10, "9007199254740993"], [1, 10, "9007199254740993"], [2, 10, "9007199254740993"]]);
});

it("replaces complete reconnect knowledge instead of retaining stale browser discoveries", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  memory.replace([sighting(1), sighting(2)]);
  memory.setContext("me", "world-1");
  memory.replace([sighting(2)]);
  expect([...memory.entries()].map(entity => entity.id)).toEqual([2]);
  memory.replace([]);
  expect([...memory.entries()]).toEqual([]);
});

it("applies complete authoritative upserts and removes observations now owned by the player", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  memory.upsert(sighting(1, "raiders"));
  memory.upsert({ ...sighting("1", "other", 43), pos: { x: 30, y: 40 }, entity_type_id: "station" });
  expect([...memory.entries()]).toEqual([{
    id: "1", entity_type_id: "station", owner_player_id: "other", pos: { x: 30, y: 40 }, remembered: { last_seen_tick: 43 },
  }]);
  memory.upsert(sighting(1, "me"));
  expect([...memory.entries()]).toEqual([]);
});

it("forgets server-invalidated knowledge and clears it when the player or run changes", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  memory.upsert(sighting(1));
  memory.forget("1");
  expect([...memory.entries()]).toEqual([]);
  memory.upsert(sighting(1));
  memory.setContext("other", "world-1");
  expect([...memory.entries()]).toEqual([]);
  memory.upsert(sighting(1));
  memory.setContext("other", "world-2");
  expect([...memory.entries()]).toEqual([]);
});
