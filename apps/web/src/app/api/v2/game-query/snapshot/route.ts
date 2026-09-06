import { NextResponse } from "next/server";
import { assertGameQueryAccess, getCurrentSnapshot } from "@/lib/game-query";
import { mapSnapshotToJson } from "@/lib/db/utils/protobuf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  assertGameQueryAccess();
  const snapshot = await getCurrentSnapshot();
  if (!snapshot) return NextResponse.json({ error: "snapshot unavailable" }, { status: 404 });
  return NextResponse.json(mapSnapshotToJson(snapshot));
}
