import { redis } from "../../../lib/db/connection";
import type { RedisJSON } from "redis";

const entityKey = (id: string) => `entity:${id}`;
const geoKey    = (gameId: string) => `geo:game:${gameId}`;

/** Update just the position (and updatedAt) using the storage (EntityDoc) shape */
export async function updateEntityPosition(
  id: string,
  gameId: string,
  x: number,
  y: number,
  updatedAt = new Date()
) {
  const k = entityKey(id);
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
  tx.json.set(k, "$.x", x as unknown as RedisJSON);
  tx.json.set(k, "$.y", y as unknown as RedisJSON);
  tx.json.set(k, "$.updatedAt", iso);

  const res = await tx.exec();
  if (res === null) {
    // Transaction aborted (rare), surface a helpful error
    throw new Error("Failed to update entity position (transaction aborted).");
  }
}
