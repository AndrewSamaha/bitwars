import { NextResponse } from "next/server";
import { assertGameQueryAccess } from "@/lib/game-query";
import { getContentReloadStatus } from "@/lib/content/contentReloadStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  assertGameQueryAccess();
  return NextResponse.json(await getContentReloadStatus(), { headers: { "Cache-Control": "no-store" } });
}
