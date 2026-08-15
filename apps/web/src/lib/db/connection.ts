import Redis from "ioredis";

const url = process.env.GAMESTATE_REDIS_URL || "redis://127.0.0.1:6379";
// API routes must fail fast when the game-state Redis endpoint is unavailable.
// In particular, /api/players/me is part of the page bootstrap path; allowing
// commands to sit in ioredis's retry queue for a minute makes the whole UI look
// unresponsive and lets client polling requests pile up.
export const redis = new Redis(url, {
  connectTimeout: 2_000,
  commandTimeout: 2_000,
  maxRetriesPerRequest: 1,
});

/**
 * SSE XREAD intentionally blocks for 15 seconds, so it cannot share the
 * fail-fast API client above. Its command timeout remains above that block
 * period while ordinary API reads continue to fail quickly.
 */
export const streamRedis = new Redis(url, {
  connectTimeout: 2_000,
  commandTimeout: 20_000,
  maxRetriesPerRequest: 1,
});
