import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";
import { requireAuthOr401 } from "@/features/users/utils/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: NextRequest) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  const owner = request.nextUrl.searchParams.get("owner") ?? auth?.playerId;
  if (typeof owner !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(owner)) {
    return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  }
  // Temporary unrestricted owner inspection matches su. Replace with debug
  // authorization when the game's authorization layer is introduced.
  const prefix = `rts:match:${getEnv("GAME_ID", "demo-001")}`;
  const settingKey = `${prefix}:script_debug_enabled:${owner}`;
  const snapshotKey = `${prefix}:script_debug:${owner}`;
  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }
    // Capture automatically stops after an hour unless renewed.
    await redis.set(settingKey, body.enabled ? "1" : "0", "EX", 3600);
    if (!body.enabled) await redis.del(snapshotKey);
    return NextResponse.json({ owner_id: owner, enabled: body.enabled });
  }
  const [setting, data] = await redis.mget(settingKey, snapshotKey);
  return NextResponse.json({
    owner_id: owner, enabled: setting === "1",
    snapshot: setting === "1" && data ? JSON.parse(data) : null,
  });
}

export const GET = handle;
export const POST = handle;
