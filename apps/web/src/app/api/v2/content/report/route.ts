import { NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { parseContentClientReport, recordContentClientReport } from "@/lib/content/contentReloadStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  const playerId = auth?.playerId;
  if (typeof playerId !== "string") return NextResponse.json({ error: "Missing player context" }, { status: 401 });
  const text = await request.text();
  if (text.length > 65_536) return NextResponse.json({ error: "Client report is too large" }, { status: 413 });
  let report;
  try { report = parseContentClientReport(JSON.parse(text)); }
  catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid client report" }, { status: 400 });
  }
  try {
    await recordContentClientReport(report, playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to store client report" }, { status: 409 });
  }
}
