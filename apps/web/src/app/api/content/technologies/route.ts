import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseDocument, stringify } from "yaml";
import { technologyRequirementErrors, unknownTechnologyFieldErrors } from "@/lib/content/schemaValidation";

export const runtime = "nodejs";
const contentPath = path.resolve(process.cwd(), "../../packages/content/entities.yaml");
const validId = (id: unknown) => typeof id === "string" && /^[a-z][a-z0-9_]*$/.test(id);

export async function GET() {
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const technologies = doc.toJS().technologies ?? {};
  return NextResponse.json({ technologies: Object.entries(technologies).map(([id, definition]: [string, any]) => ({
    id,
    requires: definition.requires,
    definition: stringify(definition).trim(),
  })) });
}

export async function POST(request: Request) {
  const { parentId, childId, definition } = await request.json();
  if (!validId(childId)) return NextResponse.json({ error: "Invalid technology id" }, { status: 400 });
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const child = parseDocument(definition);
  const technologies: any = doc.get("technologies", true);
  if (doc.errors.length || child.errors.length || !technologies?.has(parentId) || technologies.has(childId)) return NextResponse.json({ error: "Invalid YAML, parent, or duplicate technology" }, { status: 400 });
  const value = child.toJS();
  const errors = unknownTechnologyFieldErrors(value);
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  const requirementErrors = technologyRequirementErrors(value.requires, new Set([...Object.keys(doc.toJS().technologies ?? {}), childId]));
  if (requirementErrors.length) return NextResponse.json({ error: requirementErrors.join("; ") }, { status: 400 });
  technologies.set(childId, { ...value, requires: parentId });
  await writeFile(contentPath, String(doc));
  return NextResponse.json({ ok: true });
}
