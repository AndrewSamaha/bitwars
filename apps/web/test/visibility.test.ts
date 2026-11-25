import { describe, expect, it } from "vitest";
import { VisibilityFilter } from "../src/lib/db/utils/visibility";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { mapDeltaToJson, mapSnapshotToJson } from "../src/lib/db/utils/protobuf";

describe("VisibilityFilter", () => {
  it("handles a large neutral field without rebuilding sensors for every entity", () => {
    // Count metadata reads instead of elapsed time so this check is independent of machine speed.
    let sensorReads = 0;
    const filter = new VisibilityFilter("me", {
      worker: { sensor: { get range() { sensorReads++; return 400; } } },
      minerals: { visibility_range: 1000 },
    });
    const entities = Array.from({ length: 1000 }, (_, id) => ({
      id, entity_type_id: id < 5 ? "worker" : "minerals",
      owner_player_id: id < 5 ? "me" : "universe", pos: { x: id * 3, y: 0 },
    }));
    filter.filterSnapshot({ type: "snapshot", tick: 0, entities });
    for (let tick = 1; tick <= 60; tick++) {
      filter.filterDelta({ type: "delta", tick, updates: [{ id: 0, pos: { x: tick * 10, y: 0 } }] });
    }
    expect(sensorReads).toBeLessThan(2000);
  });

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

  it("continues a visible shot after a hidden hull intercepts it, including across a snapshot", () => {
    const sensor = { id: 1n, entityTypeId: "fighter", ownerPlayerId: "me", pos: { x: 0, y: 0 } };
    const hull = { id: 2n, entityTypeId: "factory", ownerPlayerId: "other", pos: { x: 1100, y: 0 }, health: 100 };
    const projectileId = 1n << 63n;
    const shot = { id: projectileId, entityTypeId: "kinetic_projectile", pos: { x: 880, y: 0 }, vel: { x: 1600, y: 0 }, health: 1 };
    const laterShot = { ...shot, id: projectileId + 1n, pos: { x: 320, y: 0 } };
    const types = { fighter: { sensor: { range: 1000 } }, factory: { sensor: { range: 1000 } } };
    const before = create(SnapshotSchema, { tick: 11n, entities: [sensor, hull, shot, laterShot] });
    const observer = new VisibilityFilter("me", types);
    const witness = new VisibilityFilter("other", types);
    const uninterrupted = new VisibilityFilter("me", types);
    expect(observer.filterSnapshot(mapSnapshotToJson(before, "me")).entities.map((entity) => entity.id))
      .toEqual([1, projectileId.toString(), laterShot.id.toString()]);
    witness.filterSnapshot(mapSnapshotToJson(before, "other"));
    uninterrupted.filterSnapshot(mapSnapshotToJson(before, "me"));

    const trail = {
      projectileId, position: { x: 960, y: 0 }, velocity: shot.vel, remainingDistance: 440,
      impactWitnesses: ["other"], health: shot.health,
    };
    const laterUpdate = { id: laterShot.id, pos: { x: 400, y: 0 } };
    const hit = create(DeltaSchema, {
      tick: 12n, removedEntityIds: [projectileId], updates: [{ id: hull.id, health: 88 }, laterUpdate],
      projectileTrailFrame: { trails: [trail] },
    });
    const decoded = fromBinary(DeltaSchema, toBinary(DeltaSchema, hit));
    const miss = create(DeltaSchema, { tick: 12n, updates: [{ id: projectileId, pos: trail.position }, laterUpdate] });
    expect(observer.filterDelta(mapDeltaToJson(decoded, "me")))
      .toEqual(uninterrupted.filterDelta(mapDeltaToJson(miss, "me")));
    expect(witness.filterDelta(mapDeltaToJson(decoded, "other"))?.hidden_entity_ids).toEqual([projectileId.toString()]);

    const checkpoint = create(SnapshotSchema, {
      tick: 12n, entities: [sensor, hull, { ...laterShot, ...laterUpdate }], projectileTrails: [trail],
    });
    const reconnect = new VisibilityFilter("me", types);
    const visible = reconnect.filterSnapshot(mapSnapshotToJson(fromBinary(SnapshotSchema, toBinary(SnapshotSchema, checkpoint)), "me"));
    expect(visible.entities.slice(1).map((entity) => entity.pos?.x)).toEqual([960, 400]);
    expect(visible).not.toHaveProperty("projectile_trails");

    const leaving = create(DeltaSchema, {
      tick: 13n, projectileTrailFrame: { trails: [{ ...trail, position: { x: 1040, y: 0 } }] },
    });
    for (const connection of [observer, reconnect]) {
      expect(connection.filterDelta(mapDeltaToJson(leaving, "me"))?.hidden_entity_ids).toEqual([projectileId.toString()]);
    }
  });

  it("projects unwitnessed kinetic deaths as fog loss while preserving ordinary removals", () => {
    const observer = new VisibilityFilter("me", { fighter: { sensor: { range: 1000 } } });
    observer.filterSnapshot({
      type: "snapshot", tick: 11, entities: [
        { id: 1, entity_type_id: "fighter", owner_player_id: "me", pos: { x: 0, y: 0 } },
        { id: 2, owner_player_id: "other", pos: { x: 990, y: 0 } },
        { id: 3, owner_player_id: "other", pos: { x: 800, y: 0 } },
      ],
    });
    const delta = create(DeltaSchema, {
      tick: 12n, removedEntityIds: [2n, 3n], kineticDestructions: [{ entityId: 2n, witnesses: ["other"] }],
    });
    const projected = observer.filterDelta(mapDeltaToJson(delta, "me"));
    expect(projected?.hidden_entity_ids).toEqual([2]);
    expect(projected?.removed_entity_ids).toEqual([3]);
    expect(projected).not.toHaveProperty("unwitnessed_kinetic_deaths");
  });

  it("applies hot-reloaded sensor ranges without losing the connection's cached world", () => {
    const filter = new VisibilityFilter("me", { habitat: { sensor: { range: 100 } } });
    const enemy = { id: 2, entity_type_id: "raider", owner_player_id: "other", pos: { x: 500, y: 0 } };
    const initial = filter.filterSnapshot({ type: "snapshot", tick: 1, entities: [
      { id: 1, entity_type_id: "habitat", owner_player_id: "me", pos: { x: 0, y: 0 } }, enemy,
    ] });
    expect(initial.entities.map((entity) => entity.id)).toEqual([1]);
    filter.updateContent({ habitat: { sensor: { range: 1000 } } }, {});
    expect(filter.filterDelta({ type: "delta", tick: 2, updates: [] })?.updates).toEqual([enemy]);
    filter.updateContent({ habitat: { sensor: { range: 100 } } }, {});
    const hidden = filter.filterDelta({ type: "delta", tick: 3, updates: [] });
    expect(hidden?.hidden_entity_ids).toEqual([2]);
    expect(hidden?.removed_entity_ids).toEqual([]);
  });
});
