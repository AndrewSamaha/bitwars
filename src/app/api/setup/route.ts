import { NextResponse } from 'next/server';

import { redis } from '@/gamestate/connection';
import { ENTITY_INDEX, ENTITY_PREFIX } from '@/gamestate/schema/keys';

export const runtime = 'nodejs';

export async function createEntityIndex() {
  await redis.sendCommand(['FLUSHDB']);
  return redis.sendCommand([
    "FT.CREATE", ENTITY_INDEX,
    "ON", "JSON",
    "PREFIX", "1", ENTITY_PREFIX,
    "SCHEMA",
    "$.gameId",   "AS", "gameId", "TAG",
    "$.x",        "AS", "x",      "NUMERIC",
    "$.y",        "AS", "y",      "NUMERIC"
  ]);
}

export async function POST() {
  try {
    const result  = await createEntityIndex()
    return NextResponse.json({ result }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    if (!msg.includes("Index already exists")) throw err;
    return NextResponse.json({ msg }, { status: 500 });
  }
}
  