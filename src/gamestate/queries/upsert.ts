// store/upsertEntity.ts
import { type RedisJSON } from "redis";
import { Entity, EntitySchema } from "@/gamestate/schema/entity/entity";
import { EntityDocSchema } from "@/gamestate/schema/entity/entityDoc";
import { toEntityDoc } from "@/gamestate/schema/entity/mappers";
import { redis } from "@/gamestate/connection"; // your connected node-redis client
import { entityKey } from "@/gamestate/schema/keys";

export async function upsertEntity(entity: Entity) {
  // Validate domain object (optional but nice)
  const valid = EntitySchema.parse(entity);

  // Project to storage shape
  const doc = toEntityDoc(valid);

  // Validate storage shape (catches non-JSON-safe or missing fields)
  const storage = EntityDocSchema.parse(doc);

  // ✅ Cast at the boundary (TS only, runtime is JSON.SET)
  await redis.json.set(entityKey(valid.id), "$", storage as unknown as RedisJSON);
}
