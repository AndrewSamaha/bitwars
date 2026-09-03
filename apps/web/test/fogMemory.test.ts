import { afterEach, describe, expect, it } from "vitest";
import { type Entity, game } from "../src/features/gamestate/world";

const added: Entity[] = [];

afterEach(() => {
  for (const entity of added.splice(0)) game.world.remove(entity);
});

describe("fog memory", () => {
  it("freezes remembered entities while live entities keep moving", () => {
    const live = game.world.add({ pos: { x: 0, y: 0 }, vel: { x: 10, y: 0 } });
    const remembered = game.world.add({
      pos: { x: 0, y: 0 },
      vel: { x: 10, y: 0 },
      remembered: { last_seen_at: 1 },
    });
    added.push(live, remembered);

    game.last = 1_000;
    game.tick(2_000);

    expect(live.pos.x).toBe(10);
    expect(remembered.pos.x).toBe(0);
  });
});
