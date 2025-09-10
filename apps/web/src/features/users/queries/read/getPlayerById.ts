import { redis } from "@/lib/db/connection";
import { playerKey } from "@/features/users/schema/keys";
import { playerDocToPlayer } from "@/features/users/schema/player/mappers";
import type { Player } from "@/features/users/schema/player/player";
import { Command } from "ioredis";

export async function getPlayerById(id: string): Promise<Player | null> {
  if (!id) return null;
  const key = playerKey(id);
  // ioredis: fetch JSON value via RedisJSON module
  const res = await redis.sendCommand(new Command("JSON.GET", [key]));
  if (!res) return null;
  const doc = JSON.parse(res as string);
  return playerDocToPlayer(doc);
}
  