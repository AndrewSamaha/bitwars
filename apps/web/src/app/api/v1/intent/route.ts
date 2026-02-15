import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db/connection";
import { IntentEnvelopeSchema, IntentPolicy, MoveToLocationIntentSchema } from "@bitwars/shared/gen/intent_pb";
import { Vec2Schema } from "@bitwars/shared/gen/vec2_pb";
import { toBinary, create } from "@bufbuild/protobuf";
import { parse as parseUuid, validate as validateUuid, version as uuidVersion } from "uuid";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { ENGINE_PROTOCOL_MAJOR } from "@/lib/constants";

// Map string policy names to proto enum values
const POLICY_MAP: Record<string, IntentPolicy> = {
  REPLACE_ACTIVE: IntentPolicy.REPLACE_ACTIVE,
  APPEND: IntentPolicy.APPEND,
  CLEAR_THEN_APPEND: IntentPolicy.CLEAR_THEN_APPEND,
};

// POST /api/v1/intent
// Body (JSON):
// {
//   "type": "Move",
//   "entity_id": 1,
//   "target": { "x": 50.0, "y": 75.0 },
//   "client_cmd_id": "uuidv7-...",
//   "client_seq": 1,
//   "policy": "REPLACE_ACTIVE" | "APPEND" | "CLEAR_THEN_APPEND"   (optional, default REPLACE_ACTIVE)
// }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const { auth, res } = await requireAuthOr401();
    if (res) return res;

    const playerId = auth?.playerId;
    if (!playerId) {
      return NextResponse.json({ error: "missing player context" }, { status: 401 });
    }

    const gameId = process.env.GAME_ID || "demo-001";
    const stream = `rts:match:${gameId}:intents`;

    const t = (body?.type ?? "").toString();
    if (t !== "Move") {
      return NextResponse.json({ error: "unsupported type; only Move is supported in v1" }, { status: 400 });
    }

    const entityIdVal = body?.entity_id;
    const target = body?.target ?? {};
    const clientCmdId = (body?.client_cmd_id ?? "").toString();
    const clientSeqVal = Number(body?.client_seq);

    if (entityIdVal === undefined || target?.x === undefined || target?.y === undefined) {
      return NextResponse.json({ error: "missing required fields: entity_id, target.x, target.y" }, { status: 400 });
    }

    if (!validateUuid(clientCmdId) || uuidVersion(clientCmdId) !== 7) {
      return NextResponse.json({ error: "client_cmd_id must be a UUIDv7 string" }, { status: 400 });
    }

    if (!Number.isInteger(clientSeqVal) || clientSeqVal <= 0) {
      return NextResponse.json({ error: "client_seq must be a positive integer" }, { status: 400 });
    }

    // M1: Parse policy from body (default to REPLACE_ACTIVE)
    const policyStr = (body?.policy ?? "REPLACE_ACTIVE").toString().toUpperCase();
    const policy = POLICY_MAP[policyStr] ?? IntentPolicy.REPLACE_ACTIVE;

    const entityId = BigInt(entityIdVal);
    const targetMsg = create(Vec2Schema, { x: Number(target.x), y: Number(target.y) });
    const move = create(MoveToLocationIntentSchema, {
      entityId,
      target: targetMsg,
    });

    const clientCmdArray = Array.from(parseUuid(clientCmdId));
    const clientCmdBytes = Uint8Array.from(clientCmdArray);
    if (clientCmdBytes.length !== 16) {
      return NextResponse.json({ error: "client_cmd_id must decode to 16 bytes" }, { status: 400 });
    }

    const envelope = create(IntentEnvelopeSchema, {
      clientCmdId: clientCmdBytes,
      intentId: new Uint8Array(),
      playerId,
      clientSeq: BigInt(clientSeqVal),
      serverTick: 0n,
      protocolVersion: ENGINE_PROTOCOL_MAJOR,
      policy,
      payload: { case: "move", value: move },
    });

    const bytes = toBinary(IntentEnvelopeSchema, envelope);

    const id = await (redis as any).xaddBuffer(stream, "MAXLEN", "~", 10000, "*", "data", Buffer.from(bytes));

    return NextResponse.json({ ok: true, id: id?.toString?.() ?? String(id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
