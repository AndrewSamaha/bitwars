import { NextResponse } from "next/server";
import { publishMaskCandidate } from "@/lib/content/maskCandidates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { path, requestId, primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold } = await request.json();
    await publishMaskCandidate(path, requestId, primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save sprite and player colors." }, { status: 400 });
  }
}
