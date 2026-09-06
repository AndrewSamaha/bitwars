import { NextResponse } from "next/server";
import { assertGameQueryAccess, getEntity, getGameId } from "@/lib/game-query";
import { mapEntityToJson } from "@/lib/db/utils/protobuf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  assertGameQueryAccess();
  const { entityId } = await params;
  if (!/^\d+$/.test(entityId)) return NextResponse.json({ error: "invalid entity id" }, { status: 400 });
  const entity = await getEntity(getGameId(), BigInt(entityId));
  if (!entity) return NextResponse.json({ error: "entity not found" }, { status: 404 });
  return NextResponse.json({ entity: mapEntityToJson(entity) });
}
