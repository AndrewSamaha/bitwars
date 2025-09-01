import { NextResponse, NextRequest } from "next/server";
import { getNearbyEntities } from "@/gamestate/queries/read/getNearbyEntities";
import { getAllEntitiesFromIndex } from "@/gamestate/queries/read/getAllEntities";


// debugIndex.ts
import { redis } from "@/gamestate/connection";
import { ENTITY_INDEX } from "@/gamestate/schema/keys";

async function scanKeys(pattern: string): Promise<string[]> {
  let cursor = "0";
  const out: string[] = [];
  do {
    const { cursor: next, keys } = await redis.scan(cursor, { MATCH: pattern, COUNT: 1000 });
    cursor = next;
    if (Array.isArray(keys)) out.push(...keys);
  } while (cursor !== "0");
  return out;
}

export async function debugEntityIndex(prefix = "entity:*") {
  // 1) All candidate keys by prefix
  const allKeys = await scanKeys(prefix);

  // 2) All keys that the index sees (no content for speed)
  const searchResp = await redis.sendCommand([
    "FT.SEARCH", ENTITY_INDEX, "*", "NOCONTENT", "LIMIT", "0", "10000"
  ]) as any[];

  const total = Number(searchResp?.[0] ?? 0);
  const indexedKeys = new Set<string>();
  for (let i = 1; i < searchResp.length; i++) {
    // In RESP2, items are [docKey, fields]; with NOCONTENT you just get docKey entries
    const v = searchResp[i];
    if (typeof v === "string") indexedKeys.add(v);
  }

  // 3) Diff: keys that exist but aren’t in the index
  const missing = allKeys.filter(k => !indexedKeys.has(k));

  console.log("== DEBUG ==");
  console.log("All candidate keys:", allKeys.length);
  console.log("Indexed (reported by FT.SEARCH):", total);
  console.log("Distinct indexed keys parsed:", indexedKeys.size);
  console.log("Missing keys:", missing);

  // 4) Inspect each missing key to see why
  for (const k of missing) {
    const type = await redis.type(k);                     // "string" | "json" | "zset" | ...
    let isJsonDoc = false;
    try {
      // Will throw or return null if it isn't a JSON doc at "$"
      const jtype = await redis.json.type(k, { path: "$"});
      isJsonDoc = !!jtype;
    } catch {}
    console.log(`-- ${k}`);
    console.log(`   TYPE: ${type}  JSON?: ${isJsonDoc ? "yes" : "no"}`);

    if (isJsonDoc) {
      // Pull just a small sample
      const doc = await redis.json.get(k, { path: "$"});
      console.dir(Array.isArray(doc) ? doc[0] : doc, { depth: 1 });
    } else {
      // If it’s a legacy string doc, preview
      const val = await redis.get(k);
      if (val) console.log(`   (string preview) ${val.slice(0, 120)}…`);
    }
  }
}

const globalSearch = async () => {
  // Should show attributes x and y with their JSONPaths
console.log(await redis.sendCommand(["FT.INFO", ENTITY_INDEX]));

// Should return your keys (no content) if x/y exist and are numbers
console.dir(await redis.sendCommand([
  "FT.SEARCH", ENTITY_INDEX, "@x:[-inf +inf] @y:[-inf +inf]", "NOCONTENT", "DIALECT", "4"
]), { depth: null });
}

export async function GET(request: NextRequest) {
  // If x or y is missing, return all entities
  await globalSearch()
  // Fetch nearby

  return NextResponse.json({ msg: "ok" }, { status: 200 });
}
