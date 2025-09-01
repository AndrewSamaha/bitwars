import { redis } from "../connection";
import { Entity } from "../schema/entity";
import type { RedisJSON } from "redis";

const key = (id: string) => `entity:${id}`;

export async function upsertEntity(entity: Entity) {
  // Make 'detail' JSON-safe (strip functions/undefined/Date, etc.)
  const safeDetail = entity.detail === undefined
    ? undefined
    : (JSON.parse(JSON.stringify(entity.detail)) as RedisJSON);

  const toStore: RedisJSON = {
    id: entity.id,
    gameId: entity.gameId,
    ownerId: entity.ownerId,
    name: entity.name,
    pos: [entity.pos[0], entity.pos[1]],
    dir: entity.dir,
    speed: entity.speed,
    pos_str: `${entity.pos[0]},${entity.pos[1]}`,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    ...(safeDetail !== undefined ? { detail: safeDetail } : {}),
    ...(entity.detailVersion ? { detailVersion: entity.detailVersion } : {}),
  } as RedisJSON;

  await redis.json.set(key(entity.id), "$", toStore);
}
