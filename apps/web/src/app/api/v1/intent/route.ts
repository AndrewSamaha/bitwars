import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db/connection";
import { IntentSchema, MoveToLocationIntentSchema } from "@bitwars/shared/gen/intent_pb";
import { Vec2Schema } from "@bitwars/shared/gen/vec2_pb";
import { toBinary, create } from "@bufbuild/protobuf";

// POST /api/v1/intent
// Body (JSON):
// {
//   "type": "Move",
//   "entity_id": 1,
//   "target": { "x": 50.0, "y": 75.0 },
//   "client_cmd_id": "uuid-...",
//   "player_id": "p1"
// }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const gameId = process.env.GAME_ID || "demo-001";
    const stream = `intents:${gameId}`;

    const t = (body?.type ?? "").toString();
    if (t !== "Move") {
      return NextResponse.json({ error: "unsupported type; only Move is supported in v1" }, { status: 400 });
    }

    const entityIdVal = body?.entity_id;
    const target = body?.target ?? {};
    const clientCmdId = (body?.client_cmd_id ?? "").toString();
    const playerId = (body?.player_id ?? "").toString();

    if (entityIdVal === undefined || target?.x === undefined || target?.y === undefined) {
      return NextResponse.json({ error: "missing required fields: entity_id, target.x, target.y" }, { status: 400 });
    }

    const entityId = BigInt(entityIdVal);
    const targetMsg = create(Vec2Schema, { x: Number(target.x), y: Number(target.y) });
    const move = create(MoveToLocationIntentSchema, {
      entityId,
      target: targetMsg,
      clientCmdId,
      playerId,
    });

    const intent = create(IntentSchema, { kind: { case: "move", value: move } });
    const bytes = toBinary(IntentSchema, intent);

    const id = await (redis as any).xaddBuffer(stream, "MAXLEN", "~", 10000, "*", "data", Buffer.from(bytes));

    return NextResponse.json({ ok: true, id: id?.toString?.() ?? String(id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
