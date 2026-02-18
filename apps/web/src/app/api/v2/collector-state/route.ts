import { NextResponse } from "next/server";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";
import { requireAuthOr401 } from "@/features/users/utils/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";

export async function GET(req: Request) {
  try {
    const { res } = await requireAuthOr401();
    if (res) return res;

    const GAME_ID = getEnv("GAME_ID", DEFAULT_GAME_ID);
    const url = new URL(req.url);
    const rawIds = (url.searchParams.get("ids") ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    const ids = Array.from(new Set(rawIds));
    if (ids.length === 0) {
      return NextResponse.json({ collector_state_by_entity: {} });
    }

    const key = `rts:match:${GAME_ID}:collector_state`;
    const values = await (redis as any).hmget(key, ...ids);
    const out: Record<string, unknown> = {};
    if (Array.isArray(values)) {
      for (let i = 0; i < ids.length; i++) {
        const json = values[i];
        if (typeof json !== "string" || json.length === 0) continue;
        try {
          out[ids[i]!] = JSON.parse(json);
        } catch {
          // ignore malformed rows
        }
      }
    }
    return NextResponse.json({ collector_state_by_entity: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
