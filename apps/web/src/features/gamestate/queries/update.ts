import { redis } from "../../../lib/db/connection";

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

  // Atomically update RedisJSON fields using RedisJSON module via raw commands
  // JSON.SET expects a JSON scalar for numbers (unquoted) and quoted string for ISO timestamp
  const res = await redis
    .multi([
      ["JSON.SET", k, "$.x", String(x)],
      ["JSON.SET", k, "$.y", String(y)],
      ["JSON.SET", k, "$.updatedAt", JSON.stringify(iso)],
    ])
    .exec();
  if (res === null) {
    // Transaction aborted (rare), surface a helpful error
    throw new Error("Failed to update entity position (transaction aborted).");
  }
}

