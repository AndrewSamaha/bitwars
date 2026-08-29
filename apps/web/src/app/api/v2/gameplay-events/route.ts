import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/utils";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { xRangeWithBuffers } from "@/lib/db/utils/redis-streams";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";
const DEFAULT_CURSOR = "0-0";
const MAX_EVENTS_PER_REQUEST = 100;

type GameplayEvent = {
  event_type: string;
  server_tick: number;
  occurred_at_ms: number;
  victim: { entity_id: number; entity_type_id: string; owner_player_id: string };
  attacker?: { entity_id: number; entity_type_id: string; owner_player_id: string };
  cause: string;
  position: { x: number; y: number };
  recipients: string[];
};

function validCursor(cursor: string): boolean {
  return /^\d+-\d+$/.test(cursor);
}

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
  if (!validCursor(after)) return NextResponse.json({ error: "invalid event cursor" }, { status: 400 });

  const gameId = getEnv("GAME_ID", DEFAULT_GAME_ID);
  const key = `rts:match:${gameId}:gameplay_events`;
  const entries = await xRangeWithBuffers(key, `(${after}`, "+", MAX_EVENTS_PER_REQUEST);
  const events: Array<Omit<GameplayEvent, "recipients"> & { event_id: string }> = [];
  for (const entry of entries) {
    if (!entry.data) continue;
    try {
      const event = JSON.parse(entry.data.toString("utf8")) as GameplayEvent;
      if (!Array.isArray(event.recipients) || !event.recipients.includes(playerId)) continue;
      const { recipients: _recipients, ...visibleEvent } = event;
      events.push({ event_id: entry.id, ...visibleEvent });
    } catch {
      // Ignore malformed history records rather than breaking reconnect.
    }
  }

  return NextResponse.json({
    events,
    next_cursor: entries.at(-1)?.id ?? after,
    has_more: entries.length === MAX_EVENTS_PER_REQUEST,
  });
}
