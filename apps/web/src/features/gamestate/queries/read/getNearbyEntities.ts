import { redis } from "../../../../lib/db/connection";
import { type Entity } from "../../schema/entity/entity";
import { EntityDocSchema } from "../../schema/entity/entityDoc";
import { fromEntityDoc } from "../../schema/entity/mappers";
import { ENTITY_INDEX } from "../../schema/keys";
import { Command } from "ioredis";

type NearbyEntity = { entity: Entity; distance: number };

export async function getNearbyEntities(
  centers: Array<[number, number]>,   // [[cx, cy], ...]
  radius: number,                     // in your world units
  limit = 200,
  extraFilter?: string                // e.g. '@gameId:{g123}'
): Promise<NearbyEntity[]> {
  if (!centers.length) return [];

  // 1) Build one big bounding box (MBR) around all centers, expanded by radius
  const xs = centers.map(c => c[0]);
  const ys = centers.map(c => c[1]);
  const minX = Math.min(...xs) - radius;
  const maxX = Math.max(...xs) + radius;
  const minY = Math.min(...ys) - radius;
  const maxY = Math.max(...ys) + radius;

  // 2) RediSearch query: numeric ranges on x/y (+ optional extra filter)
  const clauses = [
    `@x:[${minX} ${maxX}]`,
    `@y:[${minY} ${maxY}]`,
  ];
  if (extraFilter && extraFilter.trim().length) clauses.unshift(extraFilter.trim());
  const query = clauses.join(" ");
  console.log({query})
  // 3) Fetch only candidates inside the box; load JSON and x/y
  // Use a generous pre-limit so we don't miss candidates before we filter by radius.
  const preLimit = String(Math.max(limit * 10, 1000));
  const args = [
    ENTITY_INDEX, query,
    "LOAD", "3", "$", "@x", "@y",
    "LIMIT", "0", preLimit,
    "DIALECT", "4",
  ];

  const resp = await redis.sendCommand(new Command("FT.AGGREGATE", args));

  if (!Array.isArray(resp)) return [];
  const rows = (resp as any[]).slice(1);

  // 4) Parse, validate (storage schema), map to domain, compute min distance to any center
  const r2 = radius * radius;
  const results: NearbyEntity[] = [];

  for (const row of rows) {
    // normalize row -> field map
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
    const docLike = Array.isArray(raw) ? raw[0] : raw;

    // storage validation -> domain mapping
    const doc = EntityDocSchema.parse(docLike);
    const entity = fromEntityDoc(doc);

    const {x: ex, y: ey} = entity; // your domain uses pos: [x,y]

    // min distance to any provided center
    let minD2 = Infinity;
    for (const [cx, cy] of centers) {
      const dx = ex - cx;
      const dy = ey - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < minD2) minD2 = d2;
      if (minD2 <= r2) break; // early exit if already within radius
    }

    if (minD2 <= r2) {
      results.push({ entity, distance: Math.sqrt(minD2) });
    }
  }

  // 5) Sort by distance and enforce final limit
  results.sort((a, b) => a.distance - b.distance);
  return results.slice(0, limit);
}
