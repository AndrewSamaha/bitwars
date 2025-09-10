import { Player } from "@/features/users/schema/player/player";
import { redis } from "@/lib/db/connection";
import { playerKey } from "@/features/users/schema/keys";
import { playerToPlayerDoc } from "@/features/users/schema/player/mappers";
import { Command } from "ioredis";

export async function createPlayer(player: Player) {
  const key = playerKey(player.id);
  const playerDoc = playerToPlayerDoc(player);
  // ioredis: use RedisJSON via raw command
  await redis.sendCommand(
    new Command('JSON.SET', [key, '$', JSON.stringify(playerDoc)])
  );
  return playerDoc;
}
