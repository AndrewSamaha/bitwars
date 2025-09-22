// store/upsertEntity.ts
import { Entity, EntitySchema } from "@/features/gamestate/schema/entity/entity";
import { EntityDocSchema } from "@/features/gamestate/schema/entity/entityDoc";
import { fromEntityDoc } from "@/features/gamestate/schema/entity/mappers";
import { redis } from "@/lib/db/connection"; // ioredis client
import { entityKey } from "@/features/gamestate/schema/keys";
import { Command } from "ioredis";

export async function getEntity(id: string): Promise<Entity | null> {
  // Use RedisJSON via raw command; JSON.GET returns a JSON string or null
  const resp = await redis.sendCommand(new Command("JSON.GET", [entityKey(id), "$"]));
  if (!resp) return null;
  const parsed = JSON.parse(typeof resp === "string" ? resp : String(resp));
  const docLike = Array.isArray(parsed) ? parsed[0] : parsed;

  const doc = EntityDocSchema.parse(docLike);
  return fromEntityDoc(doc);
}
