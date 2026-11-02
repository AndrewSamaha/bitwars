import { NextResponse } from "next/server";
import { assertGameQueryAccess, getCurrentSnapshot } from "@/lib/game-query";
import { biToNumOrStr, mapSnapshotToJson } from "@/lib/db/utils/protobuf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  assertGameQueryAccess();
  const snapshot = await getCurrentSnapshot();
  if (!snapshot) return NextResponse.json({ error: "snapshot unavailable" }, { status: 404 });
  return NextResponse.json({
    ...mapSnapshotToJson(snapshot),
    generation_state_json: snapshot.generationStateJson,
    discovered_entities_json: snapshot.discoveredEntitiesJson,
    player_knowledge: snapshot.playerKnowledge.map((knowledge) => ({
      player_id: knowledge.playerId,
      observations: knowledge.observations.map((observation) => ({
        entity_id: biToNumOrStr(observation.entityId),
        entity_type_id: observation.entityTypeId,
        owner_player_id: observation.ownerPlayerId,
        pos: observation.pos ? { x: observation.pos.x, y: observation.pos.y } : null,
        last_seen_tick: biToNumOrStr(observation.lastSeenTick),
      })),
    })),
  });
}
