import { NextRequest, NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { getGameplayEvents, isGameplayEventCursor } from "@/lib/game-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CURSOR = "0-0";

/**
 * Returns durable gameplay history for the authenticated player after a Redis
 * Stream cursor. Clients should persist `next_cursor` and use it after a
 * reconnect instead of attempting a state replay.
 */
export async function GET(request: NextRequest) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  const playerId = auth?.playerId as string | undefined;
  if (!playerId) return NextResponse.json({ error: "missing player context" }, { status: 401 });

  const after = request.nextUrl.searchParams.get("after") ?? DEFAULT_CURSOR;
  if (!isGameplayEventCursor(after)) return NextResponse.json({ error: "invalid event cursor" }, { status: 400 });
  const result = await getGameplayEvents(playerId, after);

  return NextResponse.json({
    events: result.events,
    next_cursor: result.nextCursor,
    has_more: result.hasMore,
  });
}
