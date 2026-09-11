import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseDocument } from "yaml";

export const runtime = "nodejs";
const contentPath = path.resolve(process.cwd(), "../../packages/content/entities.yaml");

function omitNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitNulls).filter((item) => item !== null);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null).map(([key, item]) => [key, omitNulls(item)]));
  return value;
}

export async function PUT(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params;
  const { definition } = await request.json();
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const entity = parseDocument(definition);
  const types: any = doc.get("entity_types", true);
  if (doc.errors.length || entity.errors.length || !types?.has(entityId)) return NextResponse.json({ error: "Invalid YAML" }, { status: 400 });
  types.set(entityId, omitNulls(entity.toJS()));
  await writeFile(contentPath, String(doc));
  return NextResponse.json({ ok: true });
}
