import { redis } from "@/lib/db/connection";
import { PLAYER_INDEX, PLAYER_PREFIX } from "@/features/users/schema/keys";

export async function createPlayerIndex() {
    try {
      await redis.sendCommand(['FT.INFO', PLAYER_INDEX]);
      // index exists
    } catch {
      await redis.sendCommand([
        'FT.CREATE', PLAYER_INDEX,
        'ON', 'JSON',
        'PREFIX', '1', PLAYER_PREFIX,
        'SCHEMA',
        '$.gameId',         'AS','gameId',     'TAG',
        '$.normalizedName', 'AS','normalizedName', 'TEXT',
        '$.name',           'AS','name',       'TEXT',
        '$.color',          'AS','color',      'TAG',
        '$.createdAtMs',    'AS','createdAt',  'NUMERIC','SORTABLE',
        '$.lastSeenMs',     'AS','lastSeen',   'NUMERIC','SORTABLE'
      ]);
    }
  }