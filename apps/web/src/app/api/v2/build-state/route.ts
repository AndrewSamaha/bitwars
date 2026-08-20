import { NextResponse } from "next/server";

import { requireAuthOr401 } from "@/features/users/utils/auth";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";

/** Returns active build progress for the authenticated player's requested entities. */
export async function GET(request: Request) {
  try {
    const { auth, res } = await requireAuthOr401();
    if (res) return res;
    const playerId = auth?.playerId;
    if (!playerId) return NextResponse.json({ error: "missing player context" }, { status: 401 });

    const rawIds = new URL(request.url).searchParams.get("ids") ?? "";
    const requestedIds = new Set(
      rawIds.split(",").map(Number).filter((id) => Number.isSafeInteger(id) && id > 0),
    );
    if (requestedIds.size === 0) return NextResponse.json({ build_state_by_entity: {} });

    const gameId = getEnv("GAME_ID", DEFAULT_GAME_ID);
    const key = `rts:match:${gameId}:active_intents`;
    const entries: Record<string, string> = await (redis as any).hgetall(key) ?? {};
    const build_state_by_entity: Record<string, { blueprint_id: string; progress: number }> = {};

    for (const json of Object.values(entries)) {
      try {
        const entry = JSON.parse(json);
        const entityId = Number(entry?.entity_id);
        if (
          entry?.player_id !== playerId ||
          entry?.intent_kind !== "build" ||
          !requestedIds.has(entityId) ||
          typeof entry?.blueprint_id !== "string"
        ) continue;
        build_state_by_entity[String(entityId)] = {
          blueprint_id: entry.blueprint_id,
          progress: Number(entry.progress ?? 0),
        };
      } catch {
        // Ignore malformed tracking entries.
      }
    }

    return NextResponse.json({ build_state_by_entity });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
