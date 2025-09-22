// store/upsertEntity.ts
import { Entity, EntitySchema } from "@/features/gamestate/schema/entity/entity";
import { EntityDocSchema } from "@/features/gamestate/schema/entity/entityDoc";
import { toEntityDoc } from "@/features/gamestate/schema/entity/mappers";
import { redis } from "@/lib/db/connection"; // ioredis client
import { entityKey } from "@/features/gamestate/schema/keys";
import { Command } from "ioredis";

export async function upsertEntity(entity: Entity) {
  // Validate domain object (optional but nice)
  const valid = EntitySchema.parse(entity);

  // Project to storage shape
  const doc = toEntityDoc(valid);

  // Validate storage shape (catches non-JSON-safe or missing fields)
  const storage = EntityDocSchema.parse(doc);

  // Use RedisJSON via raw command with ioredis
  const payload = JSON.stringify(storage);
  await redis.sendCommand(new Command("JSON.SET", [entityKey(valid.id), "$", payload]));
}
