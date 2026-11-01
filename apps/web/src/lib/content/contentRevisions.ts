import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument } from "yaml";
import { redis } from "@/lib/db/connection";

export const CONTENT_ASSET_FILES = ["idle.png", "gray.png", "primary.png", "invariants.png", "invariant-colors.png", "player-colors.json"] as const;
const ENTITY_ID = /^[a-z][a-z0-9_]*$/;
const HASH = /^[0-9a-f]{64}$/;
export const CONTENT_ROOT = path.resolve(process.cwd(), "../../packages/content");
export const CONTENT_REVISION_ROOT = path.join(CONTENT_ROOT, ".revisions");

export type EntityRevision = { definition_hash: string; asset_hash: string | null; files: Record<string, string> };
export type ContentManifest = {
  format_version: 1;
  definitions: { entity_types: Record<string, unknown>; resource_types: Record<string, unknown>; technologies: Record<string, unknown> };
  entities: Record<string, EntityRevision>;
};
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

/** The wire hash is over authored JSON, not YAML formatting or normalized engine defaults. */
export function canonicalContentJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalContentJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalContentJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  throw new Error("Content must contain only finite JSON values.");
}
export function contentSha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a mapping.`);
  return value as Record<string, unknown>;
}
function definitionsFromYaml(source: string): ContentManifest["definitions"] {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length) throw new Error(`Invalid entities.yaml: ${document.errors.map((error) => error.message).join("; ")}`);
  const authored = record(document.toJS({ maxAliasCount: 100 }), "Content");
  const definitions = {
    entity_types: record(authored.entity_types, "entity_types"),
    resource_types: record(authored.resource_types ?? {}, "resource_types"),
    technologies: record(authored.technologies ?? {}, "technologies"),
  };
  if (!Object.keys(definitions.entity_types).length) throw new Error("entity_types must not be empty.");
  for (const [section, values] of Object.entries(definitions)) {
    for (const [id, definition] of Object.entries(values)) {
      if (!ENTITY_ID.test(id)) throw new Error(`Invalid ${section} id: ${id}`);
      record(definition, `${section}.${id}`);
    }
  }
  canonicalContentJson(definitions);
  return definitions;
}

async function confinedRead(root: string, relative: string): Promise<Buffer | null> {
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error("Asset path escapes its root.");
  try {
    const [resolvedRoot, resolvedFile] = await Promise.all([realpath(root), realpath(filename)]);
    if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error(`Asset path escapes its root: ${relative}`);
    if (!(await lstat(resolvedFile)).isFile()) throw new Error(`Asset is not a regular file: ${relative}`);
    return await readFile(resolvedFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

type CapturedContent = { manifest: ContentManifest; bundles: Map<string, Record<string, Buffer>> };
async function capture(contentRoot: string, fallbackRoot?: string): Promise<CapturedContent> {
  const source = await confinedRead(contentRoot, "entities.yaml");
  if (!source) throw new Error("entities.yaml is missing.");
  const definitions = definitionsFromYaml(source.toString("utf8"));
  const entities: ContentManifest["entities"] = {};
  const bundles = new Map<string, Record<string, Buffer>>();
  for (const id of [...new Set([...Object.keys(definitions.entity_types), "corvette"])].sort()) {
    const files: Record<string, string> = {};
    const bytes: Record<string, Buffer> = {};
    const sourceRoot = path.join(contentRoot, "assets");
    // Historical corvette art lives in public/assets, outside the authored content package.
    const hasAuthoredIdle = await confinedRead(sourceRoot, `${id}/idle.png`);
    const root = id === "corvette" && !hasAuthoredIdle && fallbackRoot ? fallbackRoot : sourceRoot;
    for (const filename of CONTENT_ASSET_FILES) {
      const data = root === sourceRoot && filename === "idle.png" ? hasAuthoredIdle : await confinedRead(root, `${id}/${filename}`);
      if (!data) continue;
      if (filename === "player-colors.json") record(JSON.parse(data.toString("utf8")), `${id}/${filename}`);
      files[filename] = contentSha256(data);
      bytes[filename] = data;
    }
    if (!(id in definitions.entity_types) && !Object.keys(files).length) continue;
    entities[id] = {
      definition_hash: id in definitions.entity_types ? contentSha256(canonicalContentJson(definitions.entity_types[id])) : "",
      asset_hash: Object.keys(files).length ? contentSha256(canonicalContentJson(files)) : null,
      files,
    };
    bundles.set(id, bytes);
  }
  return { manifest: { format_version: 1, definitions, entities }, bundles };
}

async function assertStoredDirectory(directory: string, expected: Record<string, Buffer>) {
  for (const [filename, bytes] of Object.entries(expected)) {
    const stored = await confinedRead(directory, filename);
    if (!stored || !stored.equals(bytes)) throw new Error(`Immutable content conflict: ${directory}/${filename}`);
  }
}
async function publishDirectory(root: string, segments: string[], files: Record<string, Buffer>) {
  await mkdir(root, { recursive: true });
  const resolvedRoot = await realpath(root);
  const directory = path.join(resolvedRoot, ...segments);
  const parent = path.dirname(directory);
  await mkdir(parent, { recursive: true });
  if (!(await realpath(parent)).startsWith(`${resolvedRoot}${path.sep}`) && parent !== resolvedRoot) throw new Error("Revision path escapes its root.");
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Immutable content directory is not a regular directory.");
    await assertStoredDirectory(directory, files);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temporary = path.join(parent, `.staging-${randomUUID()}`);
  await mkdir(temporary);
  try {
    await Promise.all(Object.entries(files).map(([filename, bytes]) => writeFile(path.join(temporary, filename), bytes, { flag: "wx" })));
    try { await rename(temporary, directory); }
    catch (error) {
      if (!["EEXIST", "ENOTEMPTY"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      await assertStoredDirectory(directory, files);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

/** Capture twice before publishing any files: a concurrent external edit fails staging, never queues a torn candidate. */
export async function stageContentRevision(options: { contentRoot?: string; fallbackRoot?: string } = {}) {
  const contentRoot = options.contentRoot ?? CONTENT_ROOT;
  const fallbackRoot = options.fallbackRoot ?? (options.contentRoot ? undefined : path.resolve(process.cwd(), "public/assets"));
  const snapshot = await capture(contentRoot, fallbackRoot);
  const canonical = canonicalContentJson(snapshot.manifest);
  const confirmation = await capture(contentRoot, fallbackRoot);
  if (canonicalContentJson(confirmation.manifest) !== canonical) throw new Error("Content changed while staging. Publish again after the edit completes.");
  const revision = contentSha256(canonical);
  const root = path.join(contentRoot, ".revisions");
  for (const [id, bytes] of snapshot.bundles) {
    const hash = snapshot.manifest.entities[id]!.asset_hash;
    if (hash) await publishDirectory(root, ["bundles", id, hash], bytes);
  }
  await publishDirectory(root, [revision], { "manifest.json": Buffer.from(canonical) });
  return { candidate_revision: revision, manifest: snapshot.manifest };
}

export async function readImmutableContentAsset(entityId: string, assetHash: string, filename: string, revisionRoot = CONTENT_REVISION_ROOT) {
  if (!ENTITY_ID.test(entityId) || !HASH.test(assetHash) || !(CONTENT_ASSET_FILES as readonly string[]).includes(filename)) return null;
  return confinedRead(revisionRoot, path.join("bundles", entityId, assetHash, filename));
}

// One process-wide lane is shared by route bundles. Editor writes and snapshot publication must not interleave.
const lane = globalThis as typeof globalThis & { __contentMutationLane?: Promise<unknown> };
function serialized<T>(action: () => Promise<T>): Promise<T> {
  const result = (lane.__contentMutationLane ?? Promise.resolve()).catch(() => undefined).then(action);
  lane.__contentMutationLane = result.catch(() => undefined);
  return result;
}

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
  return serialized(() => requestUnlocked(options));
}
export function mutateContentAndReload<T>(mutation: () => Promise<T>, options: ReloadOptions = {}): Promise<{ value: T; content_reload: ReloadOperation }> {
  return serialized(async () => {
    const value = await mutation();
    return { value, content_reload: await requestUnlocked(options) };
  });
}

/** Keep whole-file editor reads, validation and writes in the same lane; rejected edits never publish. */
export function mutateContentResponse(mutation: () => Promise<Response>, options: ReloadOptions = {}): Promise<Response> {
  return serialized(async () => {
    const response = await mutation();
    if (!response.ok) return response;
    const fields = await response.json();
    const content_reload = await requestUnlocked(options);
    return new Response(JSON.stringify({ ...fields, content_reload }), { status: response.status, headers: response.headers });
  });
}
