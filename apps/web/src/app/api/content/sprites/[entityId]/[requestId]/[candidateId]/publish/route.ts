import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readSpriteCandidateSize } from "@/lib/content/spriteCandidates";
import { orientSprite, parseSpriteFront, parseSpriteSize } from "@/lib/content/spriteProcessing";
import { mutateContentAndReload } from "@/lib/content/contentRevisions";
import { requireAuthOr401 } from "@/features/users/utils/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ entityId: string; requestId: string; candidateId: string }> }) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  if (typeof auth?.playerId !== "string" || !auth.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requested_by = auth.playerId;
  try {
    const body = await request.json();
    const size = parseSpriteSize(body?.size);
    const front = parseSpriteFront(body?.front);
    if (!size || !front) return NextResponse.json({ error: "Choose an output resolution and front." }, { status: 400 });
    const { entityId, requestId, candidateId } = await params;
    const image = await orientSprite(await readSpriteCandidateSize(entityId, requestId, candidateId, size), front);
    const roots = ["../../packages/content/assets", "public/assets"].map((root) => path.resolve(process.cwd(), root, entityId));
    const { content_reload } = await mutateContentAndReload(async () => {
      await Promise.all(roots.map(async (root) => {
        await mkdir(root, { recursive: true });
        await writeFile(path.join(root, "idle.png"), image);
      }));
    }, { base_revision: body.base_revision, requested_by });
    return NextResponse.json({ ok: true, size, front, content_reload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to publish sprite candidate." }, { status: 400 });
  }
}
