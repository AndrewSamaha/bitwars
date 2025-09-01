import { redis } from "../connection";
import { entityKey, geoKey } from "../schema/keys";

/** Update just the position (and updatedAt) */
export async function updateEntityPosition(
  id: string,
  gameId: string,
  pos: [number, number],
  updatedAt = new Date()
) {
  const raw = await redis.get(entityKey(id));
  if (!raw) throw new Error(`Entity ${id} not found`);
  const obj = JSON.parse(raw);
  obj.pos = pos;
  obj.updatedAt = updatedAt.toISOString();
  await redis.set(entityKey(id), JSON.stringify(obj));
  const [lon, lat] = pos;
  await redis.geoadd(geoKey(gameId), lon, lat, id);
}