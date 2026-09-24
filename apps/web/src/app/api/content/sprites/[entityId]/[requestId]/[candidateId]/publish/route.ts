import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readSpriteCandidate } from "@/lib/content/spriteCandidates";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ entityId: string; requestId: string; candidateId: string }> }) {
  try {
    const { entityId, requestId, candidateId } = await params;
    const image = await readSpriteCandidate(entityId, requestId, candidateId);
    const roots = ["../../packages/content/assets", "public/assets"].map((root) => path.resolve(process.cwd(), root, entityId));
    await Promise.all(roots.map(async (root) => {
      await mkdir(root, { recursive: true });
      await writeFile(path.join(root, "idle.png"), image);
    }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish sprite candidate." }, { status: 400 });
  }
}
