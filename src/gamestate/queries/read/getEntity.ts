// store/upsertEntity.ts
import { createClient, type RedisJSON } from "redis";
import { Entity, EntitySchema } from "@/gamestate/schema/entity/entity";
import { EntityDocSchema } from "@/gamestate/schema/entity/entityDoc";
import { fromEntityDoc } from "@/gamestate/schema/entity/mappers";
import { redis } from "@/gamestate/connection"; // your connected node-redis client
import { entityKey } from "@/gamestate/schema/keys";

export async function getEntity(id: string): Promise<Entity | null> {
  const raw = await redis.json.get(entityKey(id), { path: '$' }); // node-redis returns the doc (or array) per path
  if (!raw) return null;

  // When using "$", RedisJSON may return an array with one element
  const docLike = Array.isArray(raw) ? raw[0] : raw;

  const doc = EntityDocSchema.parse(docLike);
  return fromEntityDoc(doc);
}
