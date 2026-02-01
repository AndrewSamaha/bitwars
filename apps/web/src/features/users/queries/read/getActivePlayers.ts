import { redis } from "@/lib/db/connection";
import { PLAYER_INDEX } from "@/features/users/schema/keys";
import { playerDocToPlayer } from "@/features/users/schema/player/mappers";
import type { Player } from "@/features/users/schema/player/player";
import { Command } from "ioredis";

export async function getActivePlayers(windowMs = 600_000): Promise<Player[]> {
    const gameId = process.env.GAME_ID;
    if (!gameId) throw new Error("GAME_ID not set");
  
    const min = (Date.now() - windowMs).toString();
    const q = `@gameId:{${gameId}} @lastSeen:[${min} +inf]`;
  
    const res = await redis.sendCommand(
      new Command('FT.SEARCH', [
        PLAYER_INDEX,
        q,
        'RETURN', '1', '$',
        'LIMIT', '0', '200',
        'DIALECT', '2',
      ])
    );

    if (res === null) {
        return [];
    }
    if (!Array.isArray(res)) {
        throw new Error("Unexpected response format");
    }

    // RediSearch response shape (dialect 4):
    // [ total, docId1, [ '$', jsonOrBuffer, ... ], docId2, [ '$', jsonOrBuffer, ... ], ... ]
    const total = res[0] as number; // not used, but validates shape
    const docs: any[] = [];
    for (let i = 1; i + 1 < res.length; i += 2) {
      const fields = res[i + 1] as any;
      if (!Array.isArray(fields)) continue;
      // Find the path token '$' which contains the full JSON document
      let idx = -1;
      for (let j = 0; j < fields.length; j++) {
        const k = fields[j];
        if (k === '$' || (typeof k === 'object' && k && typeof (k as Buffer).toString === 'function' && (k as Buffer).toString() === '$')) {
          idx = j;
          break;
        }
      }
      if (idx < 0) continue;
      const raw = fields[idx + 1];
      const str = typeof raw === 'string' ? raw : (Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw ?? ''));
      if (!str || str === '$') continue; // guard against malformed entries
      try {
        const parsed = JSON.parse(str);
        const doc = Array.isArray(parsed) ? parsed[0] : parsed;
        if (doc) docs.push(doc);
      } catch (e) {
        // Log and skip bad entries instead of throwing the whole request
        console.warn('[getActivePlayers] Failed to parse JSON document from RediSearch', e);
        continue;
      }
    }
    const activePlayers = docs.map((doc) => playerDocToPlayer(doc));
    return activePlayers;
  }
  