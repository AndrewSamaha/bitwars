import { redis } from "../connection";
import type { RedisJSON } from "redis";

const entityKey = (id: string) => `entity:${id}`;
const geoKey    = (gameId: string) => `geo:game:${gameId}`;

/** Update just the position (and updatedAt) using the storage (EntityDoc) shape */
export async function updateEntityPosition(
  id: string,
  gameId: string,
  pos: [number, number],            // [lon, lat]
  updatedAt = new Date()
) {
  const k = entityKey(id);
  const [lon, lat] = pos;
  const iso = updatedAt.toISOString();

  // Optional: ensure the doc exists (so we don't accidentally create a new one)
  const exists = await redis.exists(k);
  if (!exists) throw new Error(`Entity ${id} not found`);

  // Atomically update RedisJSON fields (+ geoset if you use it)
  const tx = redis.multi();

  // Storage/EntityDoc fields:
  // - $.pos      -> numeric tuple
  // - $.pos_str  -> "lon,lat" for RediSearch GEO
  // - $.updatedAt-> ISO string
  tx.json.set(k, "$.pos", pos as unknown as RedisJSON);
  tx.json.set(k, "$.pos_str", `${lon},${lat}`);
  tx.json.set(k, "$.updatedAt", iso);

  // If you keep a per-game GEOSET for proximity lookups, update it too:
  tx.geoAdd(geoKey(gameId), [{ longitude: lon, latitude: lat, member: id }]);

  const res = await tx.exec();
  if (res === null) {
    // Transaction aborted (rare), surface a helpful error
    throw new Error("Failed to update entity position (transaction aborted).");
  }
}
