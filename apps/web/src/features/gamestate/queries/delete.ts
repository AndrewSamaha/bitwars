import { redis } from "../../../lib/db/connection";
import { entityKey, geoKey } from "../schema/keys";

/** Remove an entity from storage + geoset */
export async function deleteEntity(id: string, gameId: string) {
  await redis.del(entityKey(id));
  await redis.zRem(geoKey(gameId), id); // GEOSET is a sorted set under the hood
}