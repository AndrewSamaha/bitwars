import { randomUUID } from "node:crypto";
import { stageContentRevision } from "./contentRevisionFiles";
import { serializeContentMutation } from "./contentMutationLane";
import { redis } from "@/lib/db/connection";

const HASH = /^[0-9a-f]{64}$/;

export type ReloadOptions = { base_revision?: string; requested_by?: string };
export type ReloadOperation = {
  reload_id: string;
  base_revision: string;
  candidate_revision: string;
  requested_by: string;
  requested_at: number;
  status: "staged" | "validating" | "ready" | "activating" | "active" | "rejected" | "failed" | "no_change";
  transitions: { status: ReloadOperation["status"]; at: number }[];
  activated_tick?: number;
  error?: { stage: string; code: string; message: string; path?: string };
};

async function requestUnlocked(options: ReloadOptions = {}): Promise<ReloadOperation> {
  const prefix = `rts:match:${process.env.GAME_ID || "demo-001"}:content_reload`;
  const activeJson = await redis.get(`${prefix}:active`);
  const active = activeJson ? JSON.parse(activeJson) : null;
  const operation: ReloadOperation = {
    reload_id: randomUUID(), base_revision: options.base_revision ?? active?.content_revision ?? "",
    candidate_revision: "", requested_by: options.requested_by ?? "content-editor", requested_at: Date.now(),
    status: "staged", transitions: [],
  };
  try {
    if (operation.base_revision && !HASH.test(operation.base_revision)) throw new Error("base_revision must be a SHA256 revision.");
    operation.candidate_revision = (await stageContentRevision()).candidate_revision;
    operation.transitions.push({ status: "staged", at: Date.now() });
  } catch (error) {
    operation.status = "failed";
    operation.error = { stage: "staging", code: "staging_failed", message: error instanceof Error ? error.message : String(error) };
    operation.transitions.push({ status: "failed", at: Date.now() });
  }
  // Recording and enqueueing are atomic. Pending queue entries are never silently discarded.
  const result = await redis.eval(`
    local op = cjson.decode(ARGV[2])
    if op.status == 'staged' and redis.call('LLEN', KEYS[3]) >= 100 then
      op.status = 'failed'
      op.error = {stage='queue', code='queue_full', message='Content reload queue is full.'}
      table.insert(op.transitions, {status='failed', at=tonumber(ARGV[3])})
    end
    local encoded = cjson.encode(op)
    redis.call('HSET', KEYS[1], ARGV[1], encoded)
    redis.call('LPUSH', KEYS[2], ARGV[1])
    local retained = {}
    for _, id in ipairs(redis.call('LRANGE', KEYS[2], 0, 99)) do retained[id] = true end
    for _, id in ipairs(redis.call('HKEYS', KEYS[1])) do
      if not retained[id] then
        local status = cjson.decode(redis.call('HGET', KEYS[1], id)).status
        if status ~= 'staged' and status ~= 'validating' and status ~= 'ready' and status ~= 'activating' then
          redis.call('HDEL', KEYS[1], id)
        end
      end
    end
    redis.call('LTRIM', KEYS[2], 0, 99)
    if op.status == 'staged' then
      redis.call('RPUSH', KEYS[3], cjson.encode({reload_id=op.reload_id, base_revision=op.base_revision,
        candidate_revision=op.candidate_revision, requested_by=op.requested_by, requested_at=op.requested_at}))
    end
    return encoded
  `, 3, `${prefix}:operations`, `${prefix}:history`, `${prefix}:queue`, operation.reload_id, JSON.stringify(operation), Date.now());
  return JSON.parse(String(result)) as ReloadOperation;
}

export function requestContentReload(options: ReloadOptions = {}): Promise<ReloadOperation> {
  return serializeContentMutation(() => requestUnlocked(options));
}
export function mutateContentAndReload<T>(mutation: () => Promise<T>, options: ReloadOptions = {}): Promise<{ value: T; content_reload: ReloadOperation }> {
  return serializeContentMutation(async () => {
    const value = await mutation();
    return { value, content_reload: await requestUnlocked(options) };
  });
}

/** Keep whole-file editor reads, validation and writes in the same lane; rejected edits never publish. */
export function mutateContentResponse(mutation: () => Promise<Response>, options: ReloadOptions = {}): Promise<Response> {
  return serializeContentMutation(async () => {
    const response = await mutation();
    if (!response.ok) return response;
    const fields = await response.json();
    const content_reload = await requestUnlocked(options);
    return new Response(JSON.stringify({ ...fields, content_reload }), { status: response.status, headers: response.headers });
  });
}
