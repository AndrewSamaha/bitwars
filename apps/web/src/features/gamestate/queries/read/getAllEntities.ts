import { redis } from "@/lib/db/connection";
import { type Entity, EntitySchema } from "@/features/gamestate/schema/entity/entity";
import { EntityDocSchema } from "@/features/gamestate/schema/entity/entityDoc";
import { ENTITY_INDEX } from "@/features/gamestate/schema/keys";
import { fromEntityDoc } from "@/features/gamestate/schema/entity/mappers";
import { Command } from "ioredis";

// Return all keys + values (entities) on the entity index.
// Uses FT.SEARCH to enumerate JSON docs and returns their Redis keys with parsed Entity values.
export async function getAllEntitiesFromIndex(
    limit = 1000,
    offset = 0
  ): Promise<Array<{ key: string; entity: Entity }>> {
    const args = [
      ENTITY_INDEX,
      "*",
      "RETURN", "1", "$",
      "LIMIT", String(offset), String(limit)
    ];
    const resp = await redis.sendCommand(new Command("FT.SEARCH", args));
  
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
        console.log('skipping this one: no fields')
        console.log({key, fields})
        continue;
      }
  
      const rawJson = map["$"];
      if (!rawJson) {
        console.log('skipping this one: no raw json')
        console.log({key, fields})
        continue;
      };
  
      const raw = JSON.parse(typeof rawJson === "string" ? rawJson : String(rawJson));
      const doc = EntityDocSchema.parse(raw);
      const entity = fromEntityDoc(doc);
      out.push({ key, entity });
    }
  
    return out;
  }
  