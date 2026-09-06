import { NextRequest, NextResponse } from "next/server";
import { assertGameQueryAccess, getScriptDebugState, isScriptOwnerId, setScriptDebugEnabled } from "@/lib/game-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  assertGameQueryAccess();
  const owner = request.nextUrl.searchParams.get("owner");
  if (!owner || !isScriptOwnerId(owner)) return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  return NextResponse.json({ owner_id: owner, ...(await getScriptDebugState(owner)) });
}

export async function POST(request: NextRequest) {
  assertGameQueryAccess();
  const owner = request.nextUrl.searchParams.get("owner");
  const body = await request.json().catch(() => null);
  if (!owner || !isScriptOwnerId(owner)) return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  await setScriptDebugEnabled(owner, body.enabled);
  return NextResponse.json({ owner_id: owner, enabled: body.enabled });
}
