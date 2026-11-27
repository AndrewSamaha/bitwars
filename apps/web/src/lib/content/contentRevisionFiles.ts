// Immutable filesystem capture and asset reads; no live publisher dependencies.
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseDocument } from "yaml";

export const CONTENT_ASSET_FILES = ["idle.png", "gray.png", "primary.png", "invariants.png", "invariant-colors.png", "player-colors.json"] as const;
const ENTITY_ID = /^[a-z][a-z0-9_]*$/;
const HASH = /^[0-9a-f]{64}$/;
export const CONTENT_ROOT = path.resolve(process.cwd(), "../../packages/content");
export const CONTENT_REVISION_ROOT = path.join(CONTENT_ROOT, ".revisions");

export type EntityRevision = { definition_hash: string; asset_hash: string | null; files: Record<string, string> };
export type ContentManifest = {
  format_version: 2;
  definitions: { entity_types: Record<string, unknown>; resource_types: Record<string, unknown>; technologies: Record<string, unknown> };
  entities: Record<string, EntityRevision>;
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

async function confinedRead(root: string, relative: string, limit?: number): Promise<Buffer | null> {
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error("Asset path escapes its root.");
  try {
    const [resolvedRoot, resolvedFile] = await Promise.all([realpath(root), realpath(filename)]);
    if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error(`Asset path escapes its root: ${relative}`);
    if (!(await lstat(resolvedFile)).isFile()) throw new Error(`Asset is not a regular file: ${relative}`);
    if (limit === undefined) return await readFile(resolvedFile);
    const file = await open(resolvedFile, "r");
    try {
      const size = (await file.stat()).size;
      if (size > limit) throw new Error(`Revision byte limit exceeded at ${relative}.`);
      const bytes = Buffer.allocUnsafe(size);
      let offset = 0;
      while (offset < size) {
        const { bytesRead } = await file.read(bytes, offset, size - offset, offset);
        if (bytesRead === 0) throw new Error(`Revision file changed while reading ${relative}.`);
        offset += bytesRead;
      }
      if ((await file.stat()).size !== size) throw new Error(`Revision file changed while reading ${relative}.`);
      return bytes;
    } finally { await file.close(); }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

type CapturedContent = { manifest: ContentManifest; bundles: Map<string, Record<string, Buffer>> };
type CaptureLimits = { manifestBytes: number; assetBytes: number; totalAssetBytes: number };
async function capture(contentRoot: string, fallbackRoot?: string, limits?: CaptureLimits): Promise<CapturedContent> {
  const source = await confinedRead(contentRoot, "entities.yaml", limits?.manifestBytes);
  if (!source) throw new Error("entities.yaml is missing.");
  const definitions = definitionsFromYaml(source.toString("utf8"));
  const entities: ContentManifest["entities"] = {};
  const bundles = new Map<string, Record<string, Buffer>>();
  let remaining = limits?.totalAssetBytes ?? Infinity;
  for (const id of [...new Set([...Object.keys(definitions.entity_types), "corvette"])].sort()) {
    const files: Record<string, string> = {};
    const bytes: Record<string, Buffer> = {};
    const sourceRoot = path.join(contentRoot, "assets");
    // Historical corvette art lives in public/assets, outside the authored content package.
    const limit = () => limits && Math.min(limits.assetBytes, remaining);
    const hasAuthoredIdle = await confinedRead(sourceRoot, `${id}/idle.png`, limit());
    const root = id === "corvette" && !hasAuthoredIdle && fallbackRoot ? fallbackRoot : sourceRoot;
    for (const filename of CONTENT_ASSET_FILES) {
      const data = root === sourceRoot && filename === "idle.png" ? hasAuthoredIdle : await confinedRead(root, `${id}/${filename}`, limit());
      if (!data) continue;
      remaining -= data.byteLength;
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
  return { manifest: { format_version: 2, definitions, entities }, bundles };
}

async function assertStoredDirectory(directory: string, expected: Record<string, Buffer>) {
  for (const [filename, bytes] of Object.entries(expected)) {
    const stored = await confinedRead(directory, filename, bytes.length).catch((cause: unknown) => {
      throw new Error(`Immutable content conflict: ${directory}/${filename}`, { cause });
    });
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
export async function stageContentRevision(options: { contentRoot?: string; fallbackRoot?: string; revisionRoot?: string; limits?: CaptureLimits } = {}) {
  const contentRoot = options.contentRoot ?? CONTENT_ROOT;
  const fallbackRoot = options.fallbackRoot ?? (options.contentRoot ? undefined : path.resolve(process.cwd(), "public/assets"));
  const snapshot = await capture(contentRoot, fallbackRoot, options.limits);
  const canonical = canonicalContentJson(snapshot.manifest);
  if (options.limits && Buffer.byteLength(canonical) > options.limits.manifestBytes) throw new Error("Retained manifest exceeds the revision byte limit.");
  const confirmation = await capture(contentRoot, fallbackRoot, options.limits);
  if (canonicalContentJson(confirmation.manifest) !== canonical) throw new Error("Content changed while staging. Publish again after the edit completes.");
  const revision = contentSha256(canonical);
  const root = options.revisionRoot ?? path.join(contentRoot, ".revisions");
  for (const [id, bytes] of snapshot.bundles) {
    const hash = snapshot.manifest.entities[id]!.asset_hash;
    if (hash) await publishDirectory(root, ["bundles", id, hash], bytes);
  }
  await publishDirectory(root, [revision], { "manifest.json": Buffer.from(canonical) });
  return { candidate_revision: revision, manifest: snapshot.manifest };
}

export async function readImmutableContentAsset(entityId: string, assetHash: string, filename: string, revisionRoot = CONTENT_REVISION_ROOT, limit?: number) {
  if (!ENTITY_ID.test(entityId) || !HASH.test(assetHash) || !(CONTENT_ASSET_FILES as readonly string[]).includes(filename)) return null;
  return confinedRead(revisionRoot, path.join("bundles", entityId, assetHash, filename), limit);
}

/** Only serve an asset named by this exact retained manifest and matching its stored hash. */
export async function readRevisionSprite(root: string, revision: string, entityId: string, limits: CaptureLimits) {
  if (!HASH.test(revision) || !ENTITY_ID.test(entityId)) return null;
  const stored = await confinedRead(root, path.join(revision, "manifest.json"), limits.manifestBytes);
  if (!stored) return null;
  const manifest = JSON.parse(stored.toString("utf8")) as ContentManifest;
  if (contentSha256(canonicalContentJson(manifest)) !== revision || !Object.hasOwn(manifest.entities, entityId)) return null;
  const entry = manifest.entities[entityId];
  const expected = entry?.files["idle.png"];
  if (!expected || !entry.asset_hash) return null;
  const sprite = await readImmutableContentAsset(entityId, entry.asset_hash, "idle.png", root, limits.assetBytes);
  return sprite && contentSha256(sprite) === expected ? sprite : null;
}

