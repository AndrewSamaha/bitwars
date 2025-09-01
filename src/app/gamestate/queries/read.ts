import { redis } from "../connection";
import { type Entity, EntitySchema } from "../schema/entity";
import { ENTITY_INDEX } from "../schema/keys";

// lib/entities/nearby.ts
type NearbyEntity = { entity: Entity; distance: number };

export async function getNearbyEntities(
  center: [number, number],
  radius: number,
  limit = 200,
  extraFilter?: string
): Promise<NearbyEntity[]> {
  const [lon, lat] = center;
  const geoClause = `@pos:[${lon} ${lat} ${radius} m]`;
  console.log({geoClause})
  const query = extraFilter ? `${extraFilter} ${geoClause}` : geoClause;

  const resp = await redis.sendCommand([
    "FT.AGGREGATE", ENTITY_INDEX, query,
    // Make both the full JSON ($) and the GEO alias (@pos) available to the pipeline
    "LOAD", "2", "$", "@pos",
    // Now you can safely reference @pos here
    "APPLY", `geodistance(@pos, ${lon}, ${lat})`, "AS", "dist",
    "SORTBY", "2", "@dist", "ASC",
    "LIMIT", "0", String(limit),
    "DIALECT", "4",
  ]);

  const root = resp as unknown;
  if (!Array.isArray(root)) return [];

  const rows = root.slice(1) as any[];
  const results: NearbyEntity[] = [];
  console.dir(rows, { depth: null })
  for (const row of rows) {
    let map: Record<string, any> = {};
    if (Array.isArray(row)) for (let i = 0; i < row.length; i += 2) map[String(row[i])] = row[i + 1];
    else if (row instanceof Map) for (const [k, v] of row as Map<any, any>) map[String(k)] = v;
    else if (row && typeof row === "object") map = row as Record<string, any>;
    else continue;

    const rawJson = map["$"];
    if (!rawJson) continue;

    const raw = JSON.parse(typeof rawJson === "string" ? rawJson : String(rawJson));
    raw.createdAt &&= new Date(raw.createdAt);
    raw.updatedAt &&= new Date(raw.updatedAt);

    const entity = EntitySchema.parse(raw);
    results.push({ entity, distance: Number(map["dist"] ?? "0") });
  }

  return results;
}


// Return all keys + values (entities) on the entity index.
// Uses FT.SEARCH to enumerate JSON docs and returns their Redis keys with parsed Entity values.
export async function getAllEntitiesFromIndex(
  limit = 1000,
  offset = 0
): Promise<Array<{ key: string; entity: Entity }>> {
  const resp = await redis.sendCommand([
    "FT.SEARCH",
    ENTITY_INDEX,
    "*",
    "RETURN", "1", "$",
    "LIMIT", String(offset), String(limit)
  ]);

  const root = resp as unknown;
  if (!Array.isArray(root)) return [];

  const out: Array<{ key: string; entity: Entity }> = [];
  // Shape: [total, docId1, fields1, docId2, fields2, ...]
  for (let i = 1; i < root.length; i += 2) {
    const key = String(root[i]);
    const fields = root[i + 1];

    let map: Record<string, any> = {};
    if (Array.isArray(fields)) {
      for (let j = 0; j < fields.length; j += 2) {
        map[String(fields[j])] = fields[j + 1];
      }
    } else if (fields instanceof Map) {
      for (const [k, v] of fields as Map<any, any>) {
        map[String(k)] = v;
      }
    } else if (fields && typeof fields === "object") {
      map = fields as Record<string, any>;
    } else {
      continue;
    }

    const rawJson = map["$"];
    if (!rawJson) continue;

    const raw = JSON.parse(typeof rawJson === "string" ? rawJson : String(rawJson));
    raw.createdAt &&= new Date(raw.createdAt);
    raw.updatedAt &&= new Date(raw.updatedAt);

    const entity = EntitySchema.parse(raw);
    out.push({ key, entity });
  }

  return out;
}
