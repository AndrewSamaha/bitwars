import { describe, expect, it } from "vitest";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";

describe("VisibilityFilter", () => {
  it("shows deposit stock only inside actual sensor coverage and refreshes it as sensors move", () => {
    const filter = new VisibilityFilter("me", {
      worker: { sensor: { range: 100 } },
      minerals: { visibility_range: 1000 },
    });
    const deposit = { amount: 1000, remaining: 500 };
    const snapshot = filter.filterSnapshot({ type: "snapshot", tick: 1, entities: [
      { id: 1, entity_type_id: "worker", owner_player_id: "me", pos: { x: 0, y: 0 } },
      { id: 2, entity_type_id: "minerals", owner_player_id: "universe", pos: { x: 500, y: 0 }, resource_deposit: deposit },
    ] });
    expect(snapshot.entities[1].resource_deposit).toBeNull();
    const entering = filter.filterDelta({ type: "delta", tick: 2, updates: [{ id: 1, pos: { x: 400, y: 0 } }] });
    expect(entering?.updates.find((entity) => entity.id === 2)?.resource_deposit).toEqual(deposit);
    const depleted = filter.filterDelta({ type: "delta", tick: 3, updates: [{ id: 2, resource_deposit: { amount: 1000, remaining: 0 } }] });
    expect(depleted?.updates[0].resource_deposit?.remaining).toBe(0);
    const leaving = filter.filterDelta({ type: "delta", tick: 4, updates: [{ id: 1, pos: { x: 0, y: 0 } }] });
    expect(leaving?.updates.find((entity) => entity.id === 2)?.resource_deposit).toBeNull();
    const outside = filter.filterDelta({ type: "delta", tick: 5, updates: [{ id: 2, resource_deposit: { amount: 1000, remaining: 10 } }] });
    expect(outside?.updates[0].resource_deposit).toBeNull();
  });

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
