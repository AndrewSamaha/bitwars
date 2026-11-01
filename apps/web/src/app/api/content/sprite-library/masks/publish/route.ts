import { NextResponse } from "next/server";
import { publishMaskCandidate } from "@/lib/content/maskCandidates";
import { requireAuthOr401 } from "@/features/users/utils/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  if (typeof auth?.playerId !== "string" || !auth.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requested_by = auth.playerId;
  try {
    const { path, requestId, primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold, base_revision } = await request.json();
    const content_reload = await publishMaskCandidate(path, requestId, primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold, { base_revision, requested_by });
    return NextResponse.json({ ok: true, content_reload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save sprite and player colors." }, { status: 400 });
  }
}
