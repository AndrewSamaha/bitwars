import { type Delta } from "@bitwars/shared/gen/delta_pb";
import { type Snapshot } from "@bitwars/shared/gen/snapshot_pb";

// Helpers to convert protobuf-es messages into compact, client-friendly JSON
export const biToNumOrStr = (v: bigint): number | string => {
  const num = Number(v);
  return Number.isSafeInteger(num) ? num : v.toString();
};

// Entity has entity_type_id (proto field 2); TS codegen may use camelCase
export const mapDeltaToJson = (d: Delta) => ({
  type: "delta" as const,
  tick: biToNumOrStr(d.tick),
  removed_entity_ids: (d.removedEntityIds ?? []).map(biToNumOrStr),
  updates: (d.updates ?? []).map((u) => {
    const uAny = u as { ownerPlayerId?: string; entityTypeId?: string; health?: number };
    return {
      id: biToNumOrStr(u.id),
      ...(uAny.entityTypeId ? { entity_type_id: uAny.entityTypeId } : {}),
      ...(u.pos ? { pos: { x: u.pos.x, y: u.pos.y } } : {}),
      ...(u.vel ? { vel: { x: u.vel.x, y: u.vel.y } } : {}),
      ...(u.force ? { force: { x: u.force.x, y: u.force.y } } : {}),
      ...(uAny.ownerPlayerId !== undefined ? { owner_player_id: uAny.ownerPlayerId } : {}),
      ...(uAny.health !== undefined ? { health: uAny.health } : {}),
    };
  }),
  collector_state_updates: (d.collectorStateUpdates ?? []).map((state) => ({
    entity_id: biToNumOrStr(state.entityId),
    activity: state.activity,
    resource_type: state.resourceType,
    carry_amount: state.carryAmount,
    carry_capacity: state.carryCapacity,
    effective_rate_per_second: state.effectiveRatePerSecond,
  })),
  combat_effect_state_updates: (d.combatEffectStateUpdates ?? []).map((state) => ({
    entity_id: biToNumOrStr(state.entityId),
    activity: state.activity,
    target_id: biToNumOrStr(state.targetId),
    attack_id: state.attackId,
    updated_tick: biToNumOrStr(state.updatedTick),
  })),
});

export const mapSnapshotToJson = (s: Snapshot) => {
  const player_ledgers = (s.playerLedgers ?? []).map((pl) => ({
    player_id: pl.playerId ?? "",
    resources: (pl.resources ?? []).map((r) => ({
      resource_type: r.resourceType ?? "",
      amount: biToNumOrStr(r.amount),
    })),
  }));
  return {
    type: "snapshot" as const,
    tick: biToNumOrStr(s.tick),
    entities: (s.entities ?? []).map((e) => {
      const eAny = e as { entityTypeId?: string; ownerPlayerId?: string; health?: number };
      return {
        id: biToNumOrStr(e.id),
        ...(eAny.entityTypeId ? { entity_type_id: eAny.entityTypeId } : {}),
        ...(e.pos ? { pos: { x: e.pos.x, y: e.pos.y } } : {}),
        ...(e.vel ? { vel: { x: e.vel.x, y: e.vel.y } } : {}),
        ...(e.force ? { force: { x: e.force.x, y: e.force.y } } : {}),
        ...(eAny.ownerPlayerId !== undefined ? { owner_player_id: eAny.ownerPlayerId } : {}),
        ...(eAny.health !== undefined ? { health: eAny.health } : {}),
      };
    }),
    player_ledgers,
    collector_states: (s.collectorStates ?? []).map((state) => ({
      entity_id: biToNumOrStr(state.entityId),
      activity: state.activity,
      resource_type: state.resourceType,
      carry_amount: state.carryAmount,
      carry_capacity: state.carryCapacity,
      effective_rate_per_second: state.effectiveRatePerSecond,
    })),
    combat_effect_states: (s.combatEffectStates ?? []).map((state) => ({
      entity_id: biToNumOrStr(state.entityId),
      activity: state.activity,
      target_id: biToNumOrStr(state.targetId),
      attack_id: state.attackId,
      updated_tick: biToNumOrStr(state.updatedTick),
    })),
  };
};
