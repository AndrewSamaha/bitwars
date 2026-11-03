import { NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { requestContentReload } from "@/lib/content/contentRevisions";
import { getContentReloadStatus } from "@/lib/content/contentReloadStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { res } = await requireAuthOr401();
  if (res) return res;
  return NextResponse.json(await getContentReloadStatus(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  const playerId = auth?.playerId;
  if (typeof playerId !== "string") return NextResponse.json({ error: "Missing player context" }, { status: 401 });
  const text = await request.text();
  if (text.length > 1024) return NextResponse.json({ error: "Publish request is too large" }, { status: 413 });
  let body;
  try {
    body = text ? JSON.parse(text) : {};
    if (!body || typeof body !== "object" || Array.isArray(body)
      || (body.base_revision !== undefined && (typeof body.base_revision !== "string" || !/^[a-f0-9]{64}$/.test(body.base_revision)))) {
      throw new Error("Invalid base_revision");
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid publish request" }, { status: 400 });
  }
  try {
    const operation = await requestContentReload({ base_revision: body.base_revision, requested_by: playerId });
    return NextResponse.json({ content_reload: operation }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to stage content revision" }, { status: 400 });
  }
}
