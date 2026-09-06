import type { Entity } from "@bitwars/shared/gen/entity_pb";
import type { Snapshot } from "@bitwars/shared/gen/snapshot_pb";
import { redis } from "@/lib/db/connection";
import { decodeSnapshotBinary } from "@/lib/db/utils/binary-encoding";
import { xRangeWithBuffers } from "@/lib/db/utils/redis-streams";
import { getEnv } from "@/lib/utils";

const DEFAULT_GAME_ID = "demo-001";
const MAX_GAMEPLAY_EVENTS = 100;

type StoredGameplayEvent = {
  event_type: string;
  server_tick: number;
  occurred_at_ms: number;
  victim: { entity_id: number; entity_type_id: string; owner_player_id: string };
  attacker?: { entity_id: number; entity_type_id: string; owner_player_id: string };
  cause: string;
  position: { x: number; y: number };
  recipients: string[];
};

export type GameplayEvent = Omit<StoredGameplayEvent, "recipients"> & { event_id: string };

export function getGameId(): string {
  return getEnv("GAME_ID", DEFAULT_GAME_ID);
}

export function gameQueryKeys(gameId = getGameId()) {
  const match = `rts:match:${gameId}`;
  return {
    gameplayEvents: `${match}:gameplay_events`,
    snapshot: `snapshot:${gameId}`,
    scriptDebug: (ownerId: string) => `${match}:script_debug:${ownerId}`,
    scriptDebugEnabled: (ownerId: string) => `${match}:script_debug_enabled:${ownerId}`,
  };
}

export function isGameplayEventCursor(cursor: string): boolean {
  return /^\d+-\d+$/.test(cursor);
}

export function isScriptOwnerId(ownerId: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(ownerId);
}

/** Latest authoritative state, for server-side tools rather than the live UI stream. */
export async function getCurrentSnapshot(gameId = getGameId()): Promise<Snapshot | null> {
  const data = await (redis as any).getBuffer?.(gameQueryKeys(gameId).snapshot) as Buffer | null | undefined;
  return data ? decodeSnapshotBinary(data) : null;
}

export async function getEntity(gameId: string, entityId: bigint): Promise<Entity | null> {
  return (await getCurrentSnapshot(gameId))?.entities.find((entity) => entity.id === entityId) ?? null;
}

export async function listOwners(gameId = getGameId()): Promise<string[]> {
  const snapshot = await getCurrentSnapshot(gameId);
  return [...new Set(snapshot?.entities.map((entity) => entity.ownerPlayerId).filter(Boolean) ?? [])].sort();
}

export async function getGameplayEvents(
  playerId: string,
  after: string,
  gameId = getGameId(),
): Promise<{ events: GameplayEvent[]; nextCursor: string; hasMore: boolean }> {
  const entries = await xRangeWithBuffers(gameQueryKeys(gameId).gameplayEvents, `(${after}`, "+", MAX_GAMEPLAY_EVENTS);
  const events: GameplayEvent[] = [];
  for (const entry of entries) {
    if (!entry.data) continue;
    try {
      const event = JSON.parse(entry.data.toString("utf8")) as StoredGameplayEvent;
      if (!Array.isArray(event.recipients) || !event.recipients.includes(playerId)) continue;
      const { recipients: _recipients, ...visibleEvent } = event;
      events.push({ event_id: entry.id, ...visibleEvent });
    } catch {
      // Ignore malformed history records rather than breaking reconnect.
    }
  }
  return {
    events,
    nextCursor: entries.at(-1)?.id ?? after,
    hasMore: entries.length === MAX_GAMEPLAY_EVENTS,
  };
}

export async function getScriptDebugState(ownerId: string, gameId = getGameId()) {
  const keys = gameQueryKeys(gameId);
  const [setting, data] = await redis.mget(keys.scriptDebugEnabled(ownerId), keys.scriptDebug(ownerId));
  let snapshot: unknown = null;
  if (data) {
    try {
      snapshot = JSON.parse(data);
    } catch {
      // A malformed debug record should not make the terminal unusable.
    }
  }
  return { enabled: setting === "1", snapshot };
}

export async function setScriptDebugEnabled(ownerId: string, enabled: boolean, gameId = getGameId()) {
  await redis.set(gameQueryKeys(gameId).scriptDebugEnabled(ownerId), enabled ? "1" : "0", "EX", 3600);
}
