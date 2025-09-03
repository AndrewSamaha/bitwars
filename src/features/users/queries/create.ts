import { Player } from "@/features/users/schema/player/player";
import { redis } from "@/lib/db/connection";
import { playerKey } from "@/features/users/schema/keys";
import { playerToPlayerDoc } from "@/features/users/schema/player/mappers";
import type { RedisJSON } from "redis";

export async function createPlayer(player: Player) {
  const key = playerKey(player.id);
  const playerDoc = playerToPlayerDoc(player);
  await redis.json.set(key, '$', playerDoc as unknown as RedisJSON);
  return playerDoc;
}
