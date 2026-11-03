import { z } from "zod";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";

const CLIENT_TTL_MS = 120_000;
const MAX_CLIENTS = 256;
const HASH = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const ENTITY = /^[a-z][a-z0-9_]*$/;
const revision = z.string().regex(HASH);
const optionalRevision = z.union([revision, z.literal("")]);
const errorText = z.string().max(2048);
const clientReportSchema = z.object({
  client_id: z.string().regex(UUID),
  advertised_revision: optionalRevision,
  definitions_revision: optionalRevision,
  asset_bundles: z.record(z.string().regex(ENTITY), revision.nullable()).refine((bundles) => Object.keys(bundles).length <= 1024),
  reload_id: z.string().regex(UUID).nullish().transform((id) => id ?? null),
  status: z.enum(["synchronized", "loading", "failed"]),
  last_applied_at: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  error: z.object({
    stage: errorText.min(1), code: errorText.min(1), message: errorText.min(1),
    entity_id: errorText.optional(), url: errorText.optional(), expected_hash: errorText.optional(),
  }).optional(),
}).refine((report) => report.status !== "synchronized" || report.advertised_revision === report.definitions_revision,
  { message: "Synchronized report has mismatched definition revision" });
export type ContentClientReport = z.infer<typeof clientReportSchema>;
const storedClientSchema = clientReportSchema.and(z.object({ player_id: z.string(), received_at: z.number() }));
const acceptedContentSchema = z.object({
  content_revision: revision,
  content_version: revision,
  reload_id: z.string().regex(UUID),
  activated_tick: z.number(),
  entity_types: z.record(z.string(), z.object({
    sensor: z.object({ range: z.number().optional() }).passthrough().nullish(),
    visibility_range: z.number().nullish(),
  }).passthrough()),
  resource_types: z.record(z.string(), z.unknown()),
  technologies: z.record(z.string(), z.object({ effects: z.array(z.object({
    target: z.string(), operation: z.enum(["add", "multiply", "set", "cap"]), value: z.number(),
  }).passthrough()).optional() }).passthrough()),
  entities: z.record(z.string(), z.object({
    definition_hash: z.string(), asset_hash: revision.nullable(), files: z.record(z.string(), revision),
  })),
}).passthrough();
const operationSchema = z.object({
  reload_id: z.string().regex(UUID), base_revision: optionalRevision, candidate_revision: optionalRevision,
  requested_by: z.string(), requested_at: z.number(), status: z.string(),
  transitions: z.array(z.object({ status: z.string(), at: z.number() })),
  activated_tick: z.number().optional(),
  error: z.object({ stage: z.string(), code: z.string(), message: z.string(), path: z.string().optional() }).optional(),
}).passthrough();

export function contentReloadPrefix() {
  return `rts:match:${getEnv("GAME_ID", "demo-001")}:content_reload`;
}

export async function readAcceptedContent(requestedRevision?: string) {
  if (requestedRevision !== undefined) revision.parse(requestedRevision);
  const raw = await redis.get(`${contentReloadPrefix()}:${requestedRevision ? `revision:${requestedRevision}` : "active"}`);
  return raw ? acceptedContentSchema.parse(JSON.parse(raw)) : null;
}

export async function getContentReloadStatus() {
  const prefix = contentReloadPrefix();
  const [active, ids, reports, clientEvents] = await Promise.all([
    readAcceptedContent(), redis.lrange(`${prefix}:history`, 0, 99), redis.hgetall(`${prefix}:clients`),
    redis.lrange(`${prefix}:client_events`, 0, 99),
  ]);
  const operations = ids.length ? (await redis.hmget(`${prefix}:operations`, ...ids))
    .filter((value): value is string => value !== null).map((value) => operationSchema.parse(JSON.parse(value))) : [];
  const now = Date.now();
  const clients = Object.values(reports).map((value) => storedClientSchema.parse(JSON.parse(value)))
    .filter((report) => now - report.received_at <= CLIENT_TTL_MS).sort((a, b) => b.received_at - a.received_at);
  return {
    active: active ? {
      content_revision: active.content_revision, reload_id: active.reload_id,
      activated_tick: active.activated_tick,
    } : null,
    operations,
    clients,
    client_events: clientEvents.map((value) => storedClientSchema.parse(JSON.parse(value))),
  };
}

export function parseContentClientReport(value: unknown): ContentClientReport {
  return clientReportSchema.parse(value);
}

export async function recordContentClientReport(report: ContentClientReport, playerId: string) {
  const key = `${contentReloadPrefix()}:clients`;
  const now = Date.now();
  const result = await redis.eval(`
    local entries = redis.call('HGETALL', KEYS[1])
    for i = 1, #entries, 2 do
      local previous = cjson.decode(entries[i + 1])
      if tonumber(ARGV[1]) - previous.received_at > tonumber(ARGV[2]) then
        redis.call('HDEL', KEYS[1], entries[i])
      end
    end
    local previous = redis.call('HGET', KEYS[1], ARGV[3])
    if previous and cjson.decode(previous).player_id ~= ARGV[4] then return 'owner_conflict' end
    if not previous and redis.call('HLEN', KEYS[1]) >= tonumber(ARGV[5]) then return 'client_limit' end
    local current = cjson.decode(ARGV[6])
    local prior = previous and cjson.decode(previous) or nil
    local before_error = prior and prior.error or {}
    local after_error = current.error or {}
    if not prior or prior.status ~= current.status
      or prior.advertised_revision ~= current.advertised_revision
      or prior.definitions_revision ~= current.definitions_revision
      or prior.reload_id ~= current.reload_id
      or before_error.code ~= after_error.code or before_error.message ~= after_error.message
      or before_error.url ~= after_error.url or before_error.expected_hash ~= after_error.expected_hash then
      redis.call('LPUSH', KEYS[2], ARGV[6])
      redis.call('LTRIM', KEYS[2], 0, 99)
    end
    redis.call('HSET', KEYS[1], ARGV[3], ARGV[6])
    return 'ok'
  `, 2, key, `${contentReloadPrefix()}:client_events`, now, CLIENT_TTL_MS, report.client_id, playerId, MAX_CLIENTS,
    JSON.stringify({ ...report, player_id: playerId, received_at: now }));
  if (result === "owner_conflict") throw new Error("Client report belongs to a different player");
  if (result === "client_limit") throw new Error("Too many active content clients");
}
