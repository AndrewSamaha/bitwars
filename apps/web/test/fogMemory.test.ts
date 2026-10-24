import { gameConnection } from "../src/features/gamestate/connection";
import { afterEach, describe, expect, it } from "vitest";
import { type Entity, game } from "../src/features/gamestate/world";

const added: Entity[] = [];

afterEach(() => {
  gameConnection.disconnect();
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

    gameConnection.receivedSnapshot();
    gameConnection.reconciledIntents();
    gameConnection.health(true, 1_000);
    game.last = 1_000;
    game.tick(2_000);

    expect(live.pos.x).toBe(10);
    expect(remembered.pos.x).toBe(0);

    // A silent stall cannot keep extrapolating the last velocity forever.
    game.tick(4_000);
    game.tick(60_000);
    expect(live.pos.x).toBe(10);

    // Frames spent disconnected advance the clock without advancing ships.
    gameConnection.health(true, 60_000);
    game.tick(60_100);
    expect(live.pos.x).toBeCloseTo(11);
  });
});
