import type { Entity } from "./world";

/** Emitted after the client ECS has incorporated an authoritative state update. */
export const GAMESTATE_UPDATED_EVENT = "bitwars:gamestate-updated";
export const ENTITY_EXPLODED_EVENT = "bitwars:entity-exploded";
export const ENTITY_DETECTED_EVENT = "bitwars:entity-detected";
export const BUILD_COMPLETED_EVENT = "bitwars:build-completed";
export const MINIMUM_DISTANCE_VIOLATION_EVENT = "bitwars:minimum-distance-violation";
export const COLLECTION_WAITING_EVENT = "bitwars:collection-waiting";
export const CENTER_CAMERA_ON_ENTITY_EVENT = "bitwars:center-camera-on-entity";

export type GameStateUpdatedDetail = { entityIds?: string[] };
export type MinimumDistanceViolationDetail = {
  collectorEntityId: string;
  blockingEntityId: string;
  requiredDistance: number;
  actualDistance: number;
};
export type CollectionWaitingDetail = { collectorEntityId: string };

export function shouldNotifyCollectionWaiting(
  previousActivity: string | undefined,
  nextActivity: string,
  entityTypeId: string | undefined,
  ownerPlayerId: string | undefined,
  currentPlayerId: string | null,
) {
  return previousActivity !== "waiting_for_turn"
    && nextActivity === "waiting_for_turn"
    && (entityTypeId === "collector_solar" || entityTypeId === "collector_solar_v2")
    && Boolean(currentPlayerId)
    && ownerPlayerId === currentPlayerId;
}

export function dispatchGameStateUpdated(entityIds?: string[]) {
  window.dispatchEvent(
    new CustomEvent<GameStateUpdatedDetail>(GAMESTATE_UPDATED_EVENT, {
      detail: entityIds ? { entityIds } : undefined,
    }),
  );
}

/** Emitted when an authoritative removal should be presented as an entity explosion. */
export function dispatchEntityExploded(entity: Entity) {
  window.dispatchEvent(new CustomEvent<Entity>(ENTITY_EXPLODED_EVENT, { detail: entity }));
}

/** Emitted when a non-owned entity enters this client's sensor coverage. */
export function dispatchEntityDetected(entity: Entity) {
  if (!entity.pos) return;
  window.dispatchEvent(new CustomEvent<Entity>(ENTITY_DETECTED_EVENT, { detail: entity }));
}

/** Emitted when this client's build intent has completed. */
export function dispatchBuildCompleted(entity: Entity) {
  if (!entity.pos) return;
  window.dispatchEvent(new CustomEvent<Entity>(BUILD_COMPLETED_EVENT, { detail: entity }));
}

export function dispatchMinimumDistanceViolation(detail: MinimumDistanceViolationDetail) {
  window.dispatchEvent(new CustomEvent<MinimumDistanceViolationDetail>(MINIMUM_DISTANCE_VIOLATION_EVENT, { detail }));
}

export function dispatchCollectionWaiting(detail: CollectionWaitingDetail) {
  window.dispatchEvent(new CustomEvent<CollectionWaitingDetail>(COLLECTION_WAITING_EVENT, { detail }));
}

export function dispatchCenterCameraOnEntity(entityId: string) {
  window.dispatchEvent(new CustomEvent<string>(CENTER_CAMERA_ON_ENTITY_EVENT, { detail: entityId }));
}
