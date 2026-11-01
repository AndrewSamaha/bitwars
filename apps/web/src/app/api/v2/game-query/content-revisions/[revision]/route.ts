import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { assertGameQueryAccess } from "@/lib/game-query";
import { readAcceptedContent } from "@/lib/content/contentReloadStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ revision: string }> }) {
  assertGameQueryAccess();
  const { revision } = await params;
  if (!/^[a-f0-9]{64}$/.test(revision)) return NextResponse.json({ error: "Invalid content revision" }, { status: 400 });
  const accepted = await readAcceptedContent(revision);
  if (!accepted) return NextResponse.json({ error: "Revision has not been accepted" }, { status: 404 });
  const root = path.resolve(process.cwd(), "../../packages/content/.revisions");
  try {
    const manifest = JSON.parse(await readFile(path.join(root, revision, "manifest.json"), "utf8"));
    return NextResponse.json({ content_revision: revision, manifest }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Revision manifest is unavailable" }, { status: 500 });
  }
}
