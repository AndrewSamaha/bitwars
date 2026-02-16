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

function encodeVarint(value: bigint): Uint8Array {
  let v = value;
  const out: number[] = [];
  while (v >= 0x80n) {
    out.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  out.push(Number(v));
  return Uint8Array.from(out);
}

function fieldTag(fieldNumber: number, wireType: number): Uint8Array {
  return encodeVarint(BigInt((fieldNumber << 3) | wireType));
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function encodeLengthDelimitedField(fieldNumber: number, payload: Uint8Array): Uint8Array {
  return concatBytes([
    fieldTag(fieldNumber, 2),
    encodeVarint(BigInt(payload.length)),
    payload,
  ]);
}

function encodeVarintField(fieldNumber: number, value: bigint): Uint8Array {
  return concatBytes([fieldTag(fieldNumber, 0), encodeVarint(value)]);
}

function encodeStringField(fieldNumber: number, value: string): Uint8Array {
  return encodeLengthDelimitedField(fieldNumber, new TextEncoder().encode(value));
}

function encodeCollectEnvelope(params: {
  clientCmdId: Uint8Array;
  playerId: string;
  clientSeq: bigint;
  protocolVersion: number;
  policy: IntentPolicy;
  entityId: bigint;
}): Uint8Array {
  const collectPayload = encodeVarintField(1, params.entityId); // CollectIntent.entity_id
  return concatBytes([
    encodeLengthDelimitedField(1, params.clientCmdId), // client_cmd_id
    encodeStringField(3, params.playerId), // player_id
    encodeVarintField(4, params.clientSeq), // client_seq
    encodeVarintField(5, 0n), // server_tick
    encodeVarintField(6, BigInt(params.protocolVersion)), // protocol_version
    encodeVarintField(7, BigInt(params.policy)), // policy
    encodeLengthDelimitedField(13, collectPayload), // payload.collect
  ]);
}

// POST /api/v1/intent
// Body (JSON):
    // {
    //   "type": "Move" | "Collect",
    //   "entity_id": 1,
    //   "target": { "x": 50.0, "y": 75.0 }, // Move only
    //   "client_cmd_id": "uuidv7-...",
    //   "client_seq": 1,
    //   "policy": "REPLACE_ACTIVE" | "APPEND" | "CLEAR_THEN_APPEND"   (optional, default REPLACE_ACTIVE)
    // }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const { auth, res } = await requireAuthOr401();
    if (res) return res;

    const playerId = auth?.playerId as string | undefined;
    if (!playerId) {
      return NextResponse.json({ error: "missing player context" }, { status: 401 });
    }

    const gameId = process.env.GAME_ID || "demo-001";
    const stream = `rts:match:${gameId}:intents`;

    const t = (body?.type ?? "").toString();
    if (t !== "Move" && t !== "Collect") {
      return NextResponse.json({ error: "unsupported type; expected Move or Collect" }, { status: 400 });
    }

    const entityIdVal = body?.entity_id;
    const target = body?.target ?? {};
    const clientCmdId = (body?.client_cmd_id ?? "").toString();
    const clientSeqVal = Number(body?.client_seq);

    if (entityIdVal === undefined) {
      return NextResponse.json({ error: "missing required field: entity_id" }, { status: 400 });
    }
    if (t === "Move" && (target?.x === undefined || target?.y === undefined)) {
      return NextResponse.json({ error: "missing required fields for Move: target.x, target.y" }, { status: 400 });
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

    const clientCmdArray = Array.from(parseUuid(clientCmdId));
    const clientCmdBytes = Uint8Array.from(clientCmdArray);
    if (clientCmdBytes.length !== 16) {
      return NextResponse.json({ error: "client_cmd_id must decode to 16 bytes" }, { status: 400 });
    }

    let bytes: Uint8Array;
    if (t === "Move") {
      const targetMsg = create(Vec2Schema, { x: Number(target.x), y: Number(target.y) });
      const move = create(MoveToLocationIntentSchema, {
        entityId,
        target: targetMsg,
      });
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
      bytes = toBinary(IntentEnvelopeSchema, envelope);
    } else {
      bytes = encodeCollectEnvelope({
        clientCmdId: clientCmdBytes,
        playerId,
        clientSeq: BigInt(clientSeqVal),
        protocolVersion: ENGINE_PROTOCOL_MAJOR,
        policy,
        entityId,
      });
    }

    const id = await (redis as any).xaddBuffer(stream, "MAXLEN", "~", 10000, "*", "data", Buffer.from(bytes));

    return NextResponse.json({ ok: true, id: id?.toString?.() ?? String(id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
