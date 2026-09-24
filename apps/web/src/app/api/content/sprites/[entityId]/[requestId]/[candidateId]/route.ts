import { NextResponse } from "next/server";
import { readSpriteCandidate } from "@/lib/content/spriteCandidates";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ entityId: string; requestId: string; candidateId: string }> }) {
  try {
    const { entityId, requestId, candidateId } = await params;
    const image = await readSpriteCandidate(entityId, requestId, candidateId);
    return new NextResponse(Uint8Array.from(image), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sprite candidate not found." }, { status: 404 });
  }
}
