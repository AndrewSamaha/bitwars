import { NextResponse } from "next/server";

import { requireAuthOr401 } from "@/features/users/utils/auth";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";

/** Returns build progress for requested entities owned by the authenticated player. */
export async function GET(request: Request) {
  try {
    const { auth, res } = await requireAuthOr401();
    if (res) return res;
    const playerId = auth?.playerId;
    if (!playerId)
      return NextResponse.json(
        { error: "missing player context" },
        { status: 401 },
      );

    const rawIds = new URL(request.url).searchParams.get("ids") ?? "";
    const ids = [
      ...new Set(
        rawIds
          .split(",")
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0),
      ),
    ].map(String);
    const build_state_by_entity: Record<
      string,
      { blueprint_id: string; progress: number }
    > = {};
    if (ids.length === 0) return NextResponse.json({ build_state_by_entity });

    const gameId = getEnv("GAME_ID", DEFAULT_GAME_ID);
    const entries = await redis.hmget(
      `rts:match:${gameId}:active_intents`,
      ...ids,
    );
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const json = entries[index];
      if (!id || !json) continue;
      try {
        const entry = JSON.parse(json);
        if (
          entry?.player_id !== playerId ||
          !["build", "upgrade", "research"].includes(entry?.intent_kind) ||
          Number(entry?.entity_id) !== Number(id) ||
          typeof entry?.blueprint_id !== "string"
        )
          continue;
        build_state_by_entity[id] = {
          blueprint_id: entry.blueprint_id,
          progress: Number(entry.progress ?? 0),
        };
      } catch {
        // Ignore malformed tracking entries.
      }
    }

    return NextResponse.json({ build_state_by_entity });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
