import { NextResponse } from "next/server";
import { assertGameQueryAccess, listOwners } from "@/lib/game-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  assertGameQueryAccess();
  return NextResponse.json({ owners: await listOwners() });
}
