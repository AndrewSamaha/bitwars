import { type Delta } from "@bitwars/shared/gen/delta_pb";
import { type Entity } from "@bitwars/shared/gen/entity_pb";
import type { SentryOrderState, MoveOrderState } from "@bitwars/shared/gen/navigation_pb";
import { type Snapshot } from "@bitwars/shared/gen/snapshot_pb";

// Helpers to convert protobuf-es messages into compact, client-friendly JSON
export const biToNumOrStr = (v: bigint): number | string => {
  const num = Number(v);
  return Number.isSafeInteger(num) ? num : v.toString();
};

const mapUuid = (bytes: Uint8Array) => {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return bytes.length === 16 ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` : hex;
};

export const mapMoveOrderToJson = (order: MoveOrderState) => ({
  entity_id: biToNumOrStr(order.entityId), player_id: order.playerId,
  intent_id: mapUuid(order.intentId), client_cmd_id: mapUuid(order.clientCmdId),
  last_client_cmd_id: mapUuid(order.lastClientCmdId), started_tick: biToNumOrStr(order.startedTick),
  route: order.route ? {
    waypoints: order.route.waypoints.map((point) => ({ x: point.x, y: point.y })),
    next_waypoint_index: order.route.nextWaypointIndex,
    direction: order.route.direction, traversal: order.route.traversal,
  } : null,
});

export const mapSentryOrderToJson = (order: SentryOrderState) => ({
  intent_id: mapUuid(order.intentId), client_cmd_id: mapUuid(order.clientCmdId),
  last_client_cmd_id: mapUuid(order.lastClientCmdId), player_id: order.playerId,
  started_tick: biToNumOrStr(order.startedTick), anchor: order.anchor ? { x: order.anchor.x, y: order.anchor.y } : null,
  phase: ["unknown", "assembling", "patrolling", "engaged", "regrouping"][order.phase] ?? "unknown",
  slots: order.slots.map((slot) => ({ entity_id: biToNumOrStr(slot.entityId), offset: slot.offset ? { x: slot.offset.x, y: slot.offset.y } : null })),
  route: order.route ? { waypoints: order.route.waypoints.map((point) => ({ x: point.x, y: point.y })),
    next_waypoint_index: order.route.nextWaypointIndex, direction: order.route.direction, traversal: order.route.traversal } : null,
});

// Entity has entity_type_id (proto field 2); TS codegen may use camelCase
export const mapDeltaToJson = (d: Delta) => ({
  type: "delta" as const,
  tick: biToNumOrStr(d.tick),
  removed_entity_ids: (d.removedEntityIds ?? []).map(biToNumOrStr),
  sentry_order_updates: (d.sentryOrderUpdates ?? []).map(mapSentryOrderToJson),
  sentry_order_removals: (d.sentryOrderRemovals ?? []).map((order) => ({ player_id: order.playerId, client_cmd_id: mapUuid(order.clientCmdId) })),
  move_order_updates: (d.moveOrderUpdates ?? []).map(mapMoveOrderToJson),
  move_order_removals: (d.moveOrderRemovals ?? []).map((order) => ({
    entity_id: biToNumOrStr(order.entityId), player_id: order.playerId, client_cmd_id: mapUuid(order.clientCmdId),
  })),
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
      ...(u.damageType ? { damage_type: u.damageType } : {}),
      ...(u.resourceDeposit ? { resource_deposit: { amount: u.resourceDeposit.amount, remaining: u.resourceDeposit.remaining } } : {}),
      ...(u.resources ? { resources: u.resources.resources.map((r) => ({ resource_type: r.resourceType, amount: r.amount })) } : {}),
    };
  }),
  collector_state_updates: (d.collectorStateUpdates ?? []).map((state) => ({
    entity_id: biToNumOrStr(state.entityId),
    activity: state.activity,
    resource_type: state.resourceType,
    effective_rate_per_second: state.effectiveRatePerSecond,
    assigned_resource_type: state.assignedResourceType,
    assigned_nearest_compatible: state.assignedNearestCompatible,
    receiving_entity_id: state.receivingEntityId === undefined ? null : biToNumOrStr(state.receivingEntityId),
  })),
  combat_effect_state_updates: (d.combatEffectStateUpdates ?? []).map((state) => ({
    entity_id: biToNumOrStr(state.entityId),
    activity: state.activity,
    target_id: biToNumOrStr(state.targetId),
    attack_id: state.attackId,
    updated_tick: biToNumOrStr(state.updatedTick),
  })),
});

export const mapEntityToJson = (e: Entity) => {
  const eAny = e as { entityTypeId?: string; ownerPlayerId?: string; health?: number };
  return {
    id: biToNumOrStr(e.id),
    ...(eAny.entityTypeId ? { entity_type_id: eAny.entityTypeId } : {}),
    ...(e.pos ? { pos: { x: e.pos.x, y: e.pos.y } } : {}),
    ...(e.vel ? { vel: { x: e.vel.x, y: e.vel.y } } : {}),
    ...(e.force ? { force: { x: e.force.x, y: e.force.y } } : {}),
    ...(eAny.ownerPlayerId !== undefined ? { owner_player_id: eAny.ownerPlayerId } : {}),
    ...(eAny.health !== undefined ? { health: eAny.health } : {}),
    ...(e.resourceDeposit ? { resource_deposit: { amount: e.resourceDeposit.amount, remaining: e.resourceDeposit.remaining } } : {}),
    ...(e.resources ? { resources: e.resources.resources.map((r) => ({ resource_type: r.resourceType, amount: r.amount })) } : {}),
  };
};

export const mapSnapshotToJson = (s: Snapshot) => {
  const player_ledgers = (s.playerLedgers ?? []).map((pl) => ({
    player_id: pl.playerId ?? "",
    resources: (pl.resources ?? []).map((r) => ({
      resource_type: r.resourceType ?? "",
      amount: biToNumOrStr(r.amount),
      spend_total: r.spendTotal,
      gain_total: r.gainTotal,
    })),
  }));
  return {
    type: "snapshot" as const,
    tick: biToNumOrStr(s.tick),
    entities: (s.entities ?? []).map(mapEntityToJson),
    player_ledgers,
    sentry_orders: (s.sentryOrders ?? []).map(mapSentryOrderToJson),
    move_orders: (s.moveOrders ?? []).map(mapMoveOrderToJson),
    convoys: (s.convoys ?? []).map((order) => ({
      intent_id: Array.from(order.intentId, (byte) => byte.toString(16).padStart(2, "0")).join(""),
      player_id: order.playerId,
      phase: order.traveling ? "traveling" : "assembling",
      anchor: order.anchor ? { x: order.anchor.x, y: order.anchor.y } : null,
      destination: order.destination ? { x: order.destination.x, y: order.destination.y } : null,
      slots: order.slots.map((slot) => ({ entity_id: biToNumOrStr(slot.entityId),
        offset: slot.offset ? { x: slot.offset.x, y: slot.offset.y } : null })),
    })),
    collector_states: (s.collectorStates ?? []).map((state) => ({
      entity_id: biToNumOrStr(state.entityId),
      activity: state.activity,
      resource_type: state.resourceType,
      effective_rate_per_second: state.effectiveRatePerSecond,
      assigned_resource_type: state.assignedResourceType,
      assigned_nearest_compatible: state.assignedNearestCompatible,
      receiving_entity_id: state.receivingEntityId === undefined ? null : biToNumOrStr(state.receivingEntityId),
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
