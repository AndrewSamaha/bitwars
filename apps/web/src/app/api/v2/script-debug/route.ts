import { NextRequest, NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { getScriptDebugState, isScriptOwnerId, setScriptDebugEnabled } from "@/lib/game-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  const owner = request.nextUrl.searchParams.get("owner") ?? auth?.playerId;
  if (typeof owner !== "string" || !isScriptOwnerId(owner)) {
    return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  }
  // Temporary unrestricted owner inspection matches su. Replace with debug
  // authorization when the game's authorization layer is introduced.
  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }
    // Capture automatically stops after an hour unless renewed.
    await setScriptDebugEnabled(owner, body.enabled);
    return NextResponse.json({ owner_id: owner, enabled: body.enabled });
  }
  const state = await getScriptDebugState(owner);
  return NextResponse.json({
    owner_id: owner,
    ...state,
  });
}

export const GET = handle;
export const POST = handle;
