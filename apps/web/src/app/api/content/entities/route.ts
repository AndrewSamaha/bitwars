import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseDocument, stringify } from "yaml";

export const runtime = "nodejs";
const contentPath = path.resolve(process.cwd(), "../../packages/content/entities.yaml");

function omitNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitNulls).filter((item) => item !== null);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null).map(([key, item]) => [key, omitNulls(item)]));
  return value;
}

export async function GET() {
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const entityTypes = doc.toJS().entity_types ?? {};
  return NextResponse.json({ entities: Object.entries(entityTypes).map(([id, definition]: [string, any]) => ({
    id,
    builds: definition.builds?.map((build: { entity_type_id: string }) => build.entity_type_id) ?? [],
    upgrades: definition.upgrades?.map((upgrade: { entity_type_id: string }) => upgrade.entity_type_id) ?? [],
    definition: stringify(definition).trim(),
  })) });
}

export async function POST(request: Request) {
  const { parentId, childId, definition } = await request.json();
  if (!/^[a-z][a-z0-9_]*$/.test(childId)) return NextResponse.json({ error: "Invalid entity id" }, { status: 400 });
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const child = parseDocument(definition);
  if (doc.errors.length || child.errors.length) return NextResponse.json({ error: "Invalid YAML" }, { status: 400 });
  const types: any = doc.get("entity_types", true);
  if (!types?.has(parentId) || types.has(childId)) return NextResponse.json({ error: "Invalid parent or duplicate child" }, { status: 400 });
  const parent: any = types.get(parentId, true);
  const builds: any = parent.get("builds", true);
  if (builds) builds.add({ entity_type_id: childId }); else parent.set("builds", [{ entity_type_id: childId }]);
  types.set(childId, omitNulls(child.toJS()));
  await writeFile(contentPath, String(doc));
  return NextResponse.json({ ok: true });
}
