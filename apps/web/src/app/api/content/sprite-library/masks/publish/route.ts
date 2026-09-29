import { NextResponse } from "next/server";
import { publishMaskCandidate } from "@/lib/content/maskCandidates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { path, requestId } = await request.json();
    await publishMaskCandidate(path, requestId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save player masks." }, { status: 400 });
  }
}
