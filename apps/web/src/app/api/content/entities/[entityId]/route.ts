import { access, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseDocument, stringify } from "yaml";

export const runtime = "nodejs";
const contentPath = path.resolve(process.cwd(), "../../packages/content/entities.yaml");
const spawnPath = path.resolve(process.cwd(), "../../services/rts-engine/config/spawn.yaml");

function omitNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitNulls).filter((item) => item !== null);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null).map(([key, item]) => [key, omitNulls(item)]));
  return value;
}

async function exists(path: string) {
  return access(path).then(() => true).catch(() => false);
}

export async function PUT(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params;
  const { definition, newId = entityId } = await request.json();
  if (!/^[a-z][a-z0-9_]*$/.test(newId)) return NextResponse.json({ error: "Invalid entity id" }, { status: 400 });
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const entity = parseDocument(definition);
  const types: any = doc.get("entity_types", true);
  if (doc.errors.length || entity.errors.length || !types?.has(entityId) || (newId !== entityId && types.has(newId))) return NextResponse.json({ error: "Invalid YAML or duplicate id" }, { status: 400 });
  const replace = (value: any): any => Array.isArray(value) ? value.map(replace) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item)])) : value === entityId ? newId : value;
  const content = replace(doc.toJS());
  content.entity_types[newId] = omitNulls(entity.toJS());
  if (newId !== entityId) delete content.entity_types[entityId];
  const spawn = parseDocument(await readFile(spawnPath, "utf8"));
  if (newId !== entityId) {
    const assetPaths = ["../../packages/content/assets", "public/assets"].map((root) => ({
      from: path.resolve(process.cwd(), root, entityId),
      to: path.resolve(process.cwd(), root, newId),
    }));
    for (const { from, to } of assetPaths) {
      if (await exists(from) && await exists(to)) return NextResponse.json({ error: "Target asset path already exists" }, { status: 409 });
    }
    for (const { from, to } of assetPaths) {
      if (await exists(from)) {
        await rename(from, to);
      }
    }
  }
  await Promise.all([writeFile(contentPath, stringify(content)), writeFile(spawnPath, stringify(replace(spawn.toJS())))]);
  return NextResponse.json({ ok: true, id: newId });
}
