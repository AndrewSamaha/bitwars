import { expect, it } from "vitest";
import { MinimapMemory } from "../src/features/gamestate/minimapMemory";

it("retains last reported positions for universe, raider, and other-player sightings", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  for (const [index, owner] of ["universe", "raiders", "other", "me"].entries()) {
    const pos = { x: index * 10, y: 20 };
    memory.observe({ id: index, pos, owner_player_id: owner, entity_type_id: "ship" });
    pos.x = 999; // Local movement prediction must not move a remembered sighting.
  }
  expect([...memory.entries()].map(entity => [entity.id, entity.pos.x])).toEqual([[0, 0], [1, 10], [2, 20]]);
  // A reconnect snapshot only contains currently visible entities.
  memory.setContext("me", "world-1");
  memory.observe({ id: 9, pos: { x: 0, y: 0 }, owner_player_id: "me" });
  memory.observe({ id: 9, pos: { x: 10, y: 0 } });
  expect([...memory.entries()]).toHaveLength(3);
});

it("merges sparse observations and replaces the position on reacquisition", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  memory.observe({ id: 1, pos: { x: 10, y: 20 }, owner_player_id: "raiders", entity_type_id: "ship" });
  memory.observe({ id: "1", pos: { x: 30, y: 40 } });
  expect([...memory.entries()]).toMatchObject([{ entity_type_id: "ship", owner_player_id: "raiders", pos: { x: 30, y: 40 } }]);
  memory.observe({ id: 1, owner_player_id: "me" });
  expect([...memory.entries()]).toEqual([]);
});

it("forgets reported destructions and clears discoveries when player or world changes", () => {
  const memory = new MinimapMemory();
  memory.setContext("me", "world-1");
  const sighting = { id: 1, pos: { x: 10, y: 20 }, owner_player_id: "universe" };
  memory.observe(sighting);
  memory.forget("1");
  expect([...memory.entries()]).toEqual([]);
  memory.observe(sighting);
  memory.setContext("other", "world-1");
  expect([...memory.entries()]).toEqual([]);
  memory.observe(sighting);
  memory.setContext("other", "world-2");
  expect([...memory.entries()]).toEqual([]);
});
