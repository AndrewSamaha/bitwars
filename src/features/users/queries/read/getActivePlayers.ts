import { redis } from "@/lib/db/connection";
import { PLAYER_INDEX } from "@/features/users/schema/keys";

export async function getActivePlayers(windowMs = 60_000) {
  const gameId = process.env.GAME_ID;
  if (!gameId) throw new Error("GAME_ID not set");
  const min = (Date.now() - windowMs).toString();
  const q = `@gameId:{${gameId}} @lastSeen:[${min} +inf]`;
  // return a few fields to keep payload small
  return redis.sendCommand([
    'FT.SEARCH', PLAYER_INDEX, q,
    'RETURN', '6', '$.id', '$.name', '$.normalizedName', '$.color', '$.lastSeenMs', '$.detailVersion', '$.detail',
    'LIMIT', '0', '200'
  ]);
}
  