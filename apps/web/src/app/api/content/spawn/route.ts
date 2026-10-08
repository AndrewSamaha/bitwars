import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { parseSpawnConfig } from "@/lib/content/spawnConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const spawnPath = path.resolve(process.cwd(), "../../services/rts-engine/config/spawn.yaml");

export async function GET() {
  const { res } = await requireAuthOr401();
  if (res) return res;
  try {
    return NextResponse.json({ yaml: await readFile(spawnPath, "utf8") });
  } catch {
    return NextResponse.json({ error: "Unable to read spawn configuration" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { res } = await requireAuthOr401();
  if (res) return res;
  let yaml: string;
  try {
    const body = await request.json();
    parseSpawnConfig(body.yaml);
    yaml = body.yaml;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid spawn configuration" }, { status: 400 });
  }
  try {
    await writeFile(spawnPath, yaml);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save spawn configuration" }, { status: 500 });
  }
}
