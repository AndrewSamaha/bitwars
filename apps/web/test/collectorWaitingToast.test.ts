import { expect, it } from "vitest";
import { shouldNotifyCollectionWaiting } from "@/features/gamestate/events";

it("alerts once when an owned solar collector enters the waiting activity", () => {
  expect(shouldNotifyCollectionWaiting("moving_to_source", "waiting_for_turn", "collector_solar", "player-1", "player-1")).toBe(true);
  expect(shouldNotifyCollectionWaiting("proximity_collecting", "waiting_for_turn", "collector_solar_v2", "player-1", "player-1")).toBe(true);
  expect(shouldNotifyCollectionWaiting("waiting_for_turn", "waiting_for_turn", "collector_solar", "player-1", "player-1")).toBe(false);
  expect(shouldNotifyCollectionWaiting(undefined, "waiting_for_turn", "collector_solar", "player-1", "player-1")).toBe(true);
  expect(shouldNotifyCollectionWaiting("moving_to_source", "waiting_for_turn", "collector_solar", "player-2", "player-1")).toBe(false);
  expect(shouldNotifyCollectionWaiting("moving_to_source", "waiting_for_turn", "worker", "player-1", "player-1")).toBe(false);
});
