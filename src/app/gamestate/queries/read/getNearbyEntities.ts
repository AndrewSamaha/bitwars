import { redis } from "../../connection";
import { type Entity, EntitySchema } from "../../schema/entity/entity";
import { EntityDocSchema } from "../../schema/entity/entityDoc";
import { fromEntityDoc } from "../../schema/entity/mappers";
import { ENTITY_INDEX } from "../../schema/keys";

type NearbyEntity = { entity: Entity; distance: number };

export async function getNearbyEntities(
  center: [number, number],
  radius: number,
  limit = 200,
  extraFilter?: string,
  unit: "m" | "km" | "ft" | "mi" = "km"
): Promise<NearbyEntity[]> {
  const [lon, lat] = center;
  const geoClause = `@pos:[${lon} ${lat} ${radius} ${unit}]`;
  const query = extraFilter ? `${extraFilter} ${geoClause}` : geoClause;

  const resp = await redis.sendCommand([
    "FT.AGGREGATE", ENTITY_INDEX, query,
    // make JSON doc and GEO alias available in the pipeline
    "LOAD", "2", "$", "@pos",
    // compute distance
    "APPLY", `geodistance(@pos, ${lon}, ${lat})`, "AS", "dist",
    "SORTBY", "2", "@dist", "ASC",
    "LIMIT", "0", String(limit),
    "DIALECT", "4",
  ]);

  if (!Array.isArray(resp)) return [];
  const rows = (resp as any[]); //.slice(1);
  const results: NearbyEntity[] = [];
  console.dir(rows, { depth: null });
  console.log({numRows: rows.length})
  for (const row of rows) {
    // normalize row -> map
    let map: Record<string, any> = {};
    if (Array.isArray(row)) {
      for (let i = 0; i < row.length; i += 2) map[String(row[i])] = row[i + 1];
    } else if (row instanceof Map) {
      for (const [k, v] of row as Map<any, any>) map[String(k)] = v;
    } else if (row && typeof row === "object") {
      map = row as Record<string, any>;
    } else continue;

    const rawJson = map["$"];
    if (!rawJson) continue;

    const raw = JSON.parse(typeof rawJson === "string" ? rawJson : String(rawJson));
    const rawObj = Array.isArray(raw) ? raw[0] : raw;

    // 1) validate storage shape
    const doc = EntityDocSchema.parse(rawObj);
    // 2) map to domain
    const entity = fromEntityDoc(doc);
    // 3) optional domain validation (nice in dev; you can remove in prod if desired)
    // EntitySchema.parse(entity);

    results.push({ entity, distance: Number(map["dist"] ?? "0") });
  }

  return results;
}
