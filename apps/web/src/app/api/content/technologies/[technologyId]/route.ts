import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { parseDocument, stringify } from "yaml";
import { technologyRequirementErrors, unknownTechnologyFieldErrors } from "@/lib/content/schemaValidation";

export const runtime = "nodejs";
const contentPath = path.resolve(process.cwd(), "../../packages/content/entities.yaml");
const validId = (id: unknown) => typeof id === "string" && /^[a-z][a-z0-9_]*$/.test(id);
const replaceId = (value: any, oldId: string, newId: string): any => Array.isArray(value)
  ? value.map((item) => replaceId(item, oldId, newId))
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceId(item, oldId, newId)]))
    : value === oldId ? newId : value;

export async function PUT(request: Request, { params }: { params: Promise<{ technologyId: string }> }) {
  const { technologyId } = await params;
  const { definition, newId = technologyId } = await request.json();
  if (!validId(newId)) return NextResponse.json({ error: "Invalid technology id" }, { status: 400 });
  const doc = parseDocument(await readFile(contentPath, "utf8"));
  const technology = parseDocument(definition);
  const technologies: any = doc.get("technologies", true);
  if (doc.errors.length || technology.errors.length || !technologies?.has(technologyId) || (newId !== technologyId && technologies.has(newId))) return NextResponse.json({ error: "Invalid YAML or duplicate technology id" }, { status: 400 });
  const errors = unknownTechnologyFieldErrors(technology.toJS());
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  const content = replaceId(doc.toJS(), technologyId, newId);
  content.technologies[newId] = replaceId(technology.toJS(), technologyId, newId);
  if (newId !== technologyId) delete content.technologies[technologyId];
  const knownIds = new Set(Object.keys(content.technologies));
  const requirementErrors = Object.values(content.technologies).flatMap((item: any) => technologyRequirementErrors(item.requires, knownIds));
  if (requirementErrors.length) return NextResponse.json({ error: requirementErrors.join("; ") }, { status: 400 });
  await writeFile(contentPath, stringify(content));
  return NextResponse.json({ ok: true, id: newId });
}
