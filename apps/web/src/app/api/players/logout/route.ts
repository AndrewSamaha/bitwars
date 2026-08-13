import { NextResponse } from "next/server";
import { getOptionalAuth } from "@/features/users/utils/auth";
import { finishPlayerLogout } from "@/features/users/server/session-state";

export async function POST() {
  const auth = await getOptionalAuth();
  if (auth) {
    try {
      await finishPlayerLogout(auth.playerId);
    } catch {
      // Cookie removal remains authoritative if Redis is temporarily unavailable.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: "player_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
