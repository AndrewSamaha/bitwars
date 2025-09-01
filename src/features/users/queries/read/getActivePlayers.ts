import { redis } from "@/lib/db/connection";
import { PLAYER_INDEX } from "@/features/users/schema/keys";

export async function getActivePlayers(windowMs = 600_000) {
    const gameId = process.env.GAME_ID;
    if (!gameId) throw new Error("GAME_ID not set");
  
    const min = (Date.now() - windowMs).toString();
    const q = `@gameId:{${gameId}} @lastSeen:[${min} +inf]`;
  
    const res = await redis.sendCommand([
        'FT.SEARCH', PLAYER_INDEX, "*",
        'RETURN', '1', '$',
        'LIMIT', '0', '200',
        'DIALECT', '4'
      ]);

    if (res === null) {
        return { total: 0, docs: [] };
    }
    if (!Array.isArray(res)) {
        throw new Error("Unexpected response format");
    }

    const total = res[0] as number;
    const docs: any[] = [];
    for (let i = 1; i < res.length; i += 2) {
      const fields = res[i + 1] as string[];
      const idx = fields.indexOf('$');
      const doc = JSON.parse(fields[idx + 1] as string)[0];
      if (idx >= 0) docs.push(doc);
    }
    return { total: docs.length, docs };
  }
  