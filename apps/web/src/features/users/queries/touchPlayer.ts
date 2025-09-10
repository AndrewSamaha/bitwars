import { redis } from "@/lib/db/connection";
import { PLAYER_PREFIX } from "@/features/users/schema/keys";
import { Command } from "ioredis";

export async function heartbeatPlayer(playerId: string) {
  const key = `${PLAYER_PREFIX}${playerId}`;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  // Set numeric ms (as JSON number) and ISO string (as JSON string)
  await redis.sendCommand(new Command('JSON.SET', [key, '$.lastSeenMs', String(nowMs)]));
  await redis.sendCommand(new Command('JSON.SET', [key, '$.lastSeen', JSON.stringify(nowIso)]));
}