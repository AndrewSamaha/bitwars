import { redis } from "@/lib/db/connection";

export type CollectorStatePayload = {
  activity: string;
  resource_type: string;
  carry_amount: number;
  carry_capacity: number;
  effective_rate_per_second: number;
  updated_tick?: number;
};

export async function readCollectorStatesByEntityIds(
  gameId: string,
  entityIds: Array<number | string>,
): Promise<Map<string, CollectorStatePayload>> {
  const out = new Map<string, CollectorStatePayload>();
  const ids = entityIds.map((id) => String(id)).filter((v, i, arr) => v.length > 0 && arr.indexOf(v) === i);
  if (ids.length === 0) return out;

  const key = `rts:match:${gameId}:collector_state`;
  const raw = await (redis as any).hmget(key, ...ids);
  if (!Array.isArray(raw)) return out;

  for (let i = 0; i < ids.length; i++) {
    const json = raw[i];
    if (typeof json !== "string" || json.length === 0) continue;
    try {
      const parsed = JSON.parse(json) as Partial<CollectorStatePayload>;
      const normalized: CollectorStatePayload = {
        activity: String(parsed.activity ?? "idle"),
        resource_type: String(parsed.resource_type ?? ""),
        carry_amount: Number(parsed.carry_amount ?? 0),
        carry_capacity: Number(parsed.carry_capacity ?? 0),
        effective_rate_per_second: Number(parsed.effective_rate_per_second ?? 0),
        ...(parsed.updated_tick !== undefined ? { updated_tick: Number(parsed.updated_tick) } : {}),
      };
      out.set(ids[i]!, normalized);
    } catch {
      // Ignore malformed per-entity rows.
    }
  }

  return out;
}
