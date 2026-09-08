import { NextRequest, NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { enqueueRaiderSpawn } from "@/lib/game-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RAIDERS_PER_REQUEST = 1_000;

export async function POST(request: NextRequest) {
  const { res } = await requireAuthOr401();
  if (res) return res;

  const body = await request.json().catch(() => null);
  const count = body?.count;
  if (!Number.isInteger(count) || count < 1 || count > MAX_RAIDERS_PER_REQUEST) {
    return NextResponse.json(
      { error: `count must be an integer between 1 and ${MAX_RAIDERS_PER_REQUEST}` },
      { status: 400 },
    );
  }

  await enqueueRaiderSpawn(count);
  return NextResponse.json({ queued: count });
}
