import { describe, expect, it } from "vitest";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";

describe("VisibilityFilter", () => {
  it("hides distant enemies and emits their full state when they enter sensor range", () => {
    const filter = new VisibilityFilter("me", {
      habitat: { sensor: { range: 4_000 } },
    });
    const snapshot = filter.filterSnapshot({
      type: "snapshot",
      tick: 1,
      entities: [
        { id: 1, entity_type_id: "habitat", owner_player_id: "me", pos: { x: 0, y: 0 } },
        { id: 2, entity_type_id: "raider", owner_player_id: "other", pos: { x: 5_000, y: 0 }, health: 100 },
      ],
    });
    expect(snapshot.entities.map((entity) => entity.id)).toEqual([1]);

    const delta = filter.filterDelta({
      type: "delta",
      tick: 2,
      updates: [{ id: 2, pos: { x: 3_000, y: 0 } }],
    });
    expect(delta?.updates).toEqual([
      { id: 2, entity_type_id: "raider", owner_player_id: "other", pos: { x: 3_000, y: 0 }, health: 100 },
    ]);
  });

  it("reports sensor-range loss as hidden rather than an authoritative removal", () => {
    const filter = new VisibilityFilter("me", {
      habitat: { sensor: { range: 4_000 } },
    });
    filter.filterSnapshot({
      type: "snapshot",
      tick: 1,
      entities: [
        { id: 1, entity_type_id: "habitat", owner_player_id: "me", pos: { x: 0, y: 0 } },
        { id: 2, entity_type_id: "raider", owner_player_id: "other", pos: { x: 3_000, y: 0 } },
      ],
    });

    const delta = filter.filterDelta({
      type: "delta",
      tick: 2,
      updates: [{ id: 2, pos: { x: 5_000, y: 0 } }],
    });

    expect(delta?.hidden_entity_ids).toEqual([2]);
    expect(delta?.removed_entity_ids).toEqual([]);
  });
});
