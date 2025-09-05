import { redis } from "@/lib/db/connection";
import { PLAYER_PREFIX } from "@/features/users/schema/keys";

export async function heartbeatPlayer(playerId: string) {
  const key = `${PLAYER_PREFIX}${playerId}`;
  const now = Date.now().toString();
  await redis.sendCommand(['JSON.SET', key, '$.lastSeenMs', now]);
  await redis.sendCommand(['JSON.SET', key, '$.lastSeen', new Date().toISOString()]);
}
  