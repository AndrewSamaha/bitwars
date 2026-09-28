import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readSpriteCandidateSize } from "@/lib/content/spriteCandidates";
import { orientSprite, parseSpriteFront, parseSpriteSize } from "@/lib/content/spriteProcessing";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ entityId: string; requestId: string; candidateId: string }> }) {
  try {
    const body = await request.json();
    const size = parseSpriteSize(body?.size);
    const front = parseSpriteFront(body?.front);
    if (!size || !front) return NextResponse.json({ error: "Choose an output resolution and front." }, { status: 400 });
    const { entityId, requestId, candidateId } = await params;
    const image = await orientSprite(await readSpriteCandidateSize(entityId, requestId, candidateId, size), front);
    const roots = ["../../packages/content/assets", "public/assets"].map((root) => path.resolve(process.cwd(), root, entityId));
    await Promise.all(roots.map(async (root) => {
      await mkdir(root, { recursive: true });
      await writeFile(path.join(root, "idle.png"), image);
    }));
    return NextResponse.json({ ok: true, size, front });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish sprite candidate." }, { status: 400 });
  }
}
