import { NextResponse } from "next/server";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { ENGINE_PROTOCOL_MAJOR } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";

/**
 * M2 Reconnect Handshake Endpoint
 *
 * GET /api/v2/reconnect
 *
 * Returns the server-side tracking state for the authenticated player so the
 * client can reconcile its local intent queue after a reconnect without
 * duplicating or skipping intents.
 *
 * Response shape:
 * {
 *   server_tick:                number,   // tick from the latest snapshot metadata
 *   protocol_version:          number,   // engine protocol major
 *   content_version:           string,   // M4: xxh3 hex hash of content pack ("" if none)
 *   player_id:                 string,   // M7: current player id (for resource ledger display)
 *   last_processed_client_seq: number,   // last client_seq the server applied for this player
 *   active_intents: [                    // per-entity active intents belonging to this player
 *     {
 *       entity_id:      number,
 *       intent_id:      string,          // dashed UUID
 *       client_cmd_id:  string,          // dashed UUID
 *       player_id:      string,
 *       started_tick:   number,
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET() {
  try {
    const { auth, res } = await requireAuthOr401();
    if (res) return res;

    const playerId = auth?.playerId;
    if (!playerId) {
      return NextResponse.json({ error: "missing player context" }, { status: 401 });
    }

    const GAME_ID = getEnv("GAME_ID", DEFAULT_GAME_ID);

    // Read server_tick from the latest snapshot metadata
    const snapshotMetaKey = `snapshot_meta:${GAME_ID}`;
    const meta: Record<string, string> = await (redis as any).hgetall(snapshotMetaKey) ?? {};
    const serverTick = Number(meta?.tick ?? 0);

    // M4: Read content_version
    const contentVersionKey = `rts:match:${GAME_ID}:content_version`;
    const contentVersion: string = (await (redis as any).get(contentVersionKey)) ?? "";

    // Read last_processed_client_seq for this player
    const playerSeqKey = `rts:match:${GAME_ID}:player_seq`;
    const seqVal: string | null = await (redis as any).hget(playerSeqKey, playerId);
    const lastProcessedClientSeq = seqVal ? Number(seqVal) : 0;

    // Read per-entity active intents, filter to this player
    const activeIntentsKey = `rts:match:${GAME_ID}:active_intents`;
    const allFields: Record<string, string> = await (redis as any).hgetall(activeIntentsKey) ?? {};

    const activeIntents: Array<{
      entity_id: number;
      intent_id: string;
      client_cmd_id: string;
      player_id: string;
      started_tick: number;
    }> = [];

    for (const [, json] of Object.entries(allFields)) {
      try {
        const entry = JSON.parse(json);
        if (entry?.player_id === playerId) {
          activeIntents.push({
            entity_id: Number(entry.entity_id),
            intent_id: String(entry.intent_id ?? ""),
            client_cmd_id: String(entry.client_cmd_id ?? ""),
            player_id: String(entry.player_id ?? ""),
            started_tick: Number(entry.started_tick ?? 0),
          });
        }
      } catch {
        // Skip malformed entries
      }
    }

    return NextResponse.json({
      server_tick: serverTick,
      protocol_version: ENGINE_PROTOCOL_MAJOR,
      content_version: contentVersion,
      player_id: playerId,
      last_processed_client_seq: lastProcessedClientSeq,
      active_intents: activeIntents,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
