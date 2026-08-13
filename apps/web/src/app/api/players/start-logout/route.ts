import { NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { startPlayerLogout } from "@/features/users/server/session-state";

export async function POST() {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;

  const playerId = auth?.playerId;
  if (typeof playerId !== "string") {
    return NextResponse.json({ error: "missing player context" }, { status: 401 });
  }

  await startPlayerLogout(playerId);
  return NextResponse.json({ ok: true, state: "logging-out" });
}
