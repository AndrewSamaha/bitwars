import { redis } from "@/lib/db/connection";
import { playerKey } from "@/features/users/schema/keys";
import { playerDocToPlayer } from "@/features/users/schema/player/mappers";
import type { Player } from "@/features/users/schema/player/player";

export async function getPlayerById(id: string): Promise<Player | null> {
  if (!id) return null;
  const key = playerKey(id);
  const doc = (await redis.json.get(key)) as any | null;
  if (!doc) return null;
  return playerDocToPlayer(doc);
}
  