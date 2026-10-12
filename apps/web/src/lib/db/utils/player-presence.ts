import { randomUUID } from "node:crypto";
import { redis } from "@/lib/db/connection";

const REFRESH_MS = 10_000;
const LEASE_MS = 30_000;

/** Track SSE connections, while counting multiple connections from one player only once. */
export async function trackPlayerConnection(gameId: string, playerId: string): Promise<() => Promise<void>> {
  const key = `rts:match:${gameId}:connected_player_leases`;
  const member = `${playerId}:${randomUUID()}`;
  let stopped = false;
  let pending = Promise.resolve();
  const refresh = () => {
    pending = pending.catch(() => undefined).then(async () => {
      if (!stopped) await redis.zadd(key, Date.now() + LEASE_MS, member);
    });
    return pending;
  };
  await refresh();
  const timer = setInterval(() => {
    void refresh().catch(error => console.warn("player presence refresh failed", error));
  }, REFRESH_MS);
  return async () => {
    stopped = true;
    clearInterval(timer);
    await pending.catch(() => undefined);
    await redis.zrem(key, member);
  };
}
