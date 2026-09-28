import { NextResponse } from "next/server";
import { readSpriteCandidateSize } from "@/lib/content/spriteCandidates";
import { orientSprite, parseSpriteFront, parseSpriteSize } from "@/lib/content/spriteProcessing";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ entityId: string; requestId: string; candidateId: string }> }) {
  const size = parseSpriteSize(new URL(request.url).searchParams.get("size"));
  const frontValue = new URL(request.url).searchParams.get("front");
  const front = frontValue === null ? null : parseSpriteFront(frontValue);
  if (!size || (frontValue !== null && !front)) return NextResponse.json({ error: "Choose a valid size and front." }, { status: 400 });

  try {
    const { entityId, requestId, candidateId } = await params;
    const image = await readSpriteCandidateSize(entityId, requestId, candidateId, size);
    const preview = front ? await orientSprite(image, front) : image;
    return new NextResponse(Uint8Array.from(preview), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sprite candidate not found." }, { status: 404 });
  }
}
