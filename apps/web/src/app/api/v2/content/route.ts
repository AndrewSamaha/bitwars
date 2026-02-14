import { NextResponse } from "next/server";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";

/**
 * M4 Content Endpoint
 *
 * GET /api/v2/content
 *
 * Returns entity type definitions and content version hash so clients can
 * fetch the current content when their bundled copy is stale or missing.
 *
 * The entity definitions are stored on disk as YAML but served here as
 * canonical JSON (matching the format used for content hashing).
 *
 * Response shape:
 * {
 *   content_version: string,          // xxh3 hex hash
 *   entity_types: {                   // entity_type_id → definition
 *     "worker": { speed: 60, stop_radius: 0.75, mass: 1, health: 100 },
 *     ...
 *   },
 *   resource_types: {                 // M7: resource_type_id → { display_name, order }
 *     "gold": { display_name: "Gold", order: 0 },
 *     ...
 *   }
 * }
 *
 * The engine stores both entity_types and resource_types in Redis at
 * rts:match:{GAME_ID}:content_defs. If missing, returns empty objects.
 */
export async function GET() {
  try {
    const GAME_ID = getEnv("GAME_ID", DEFAULT_GAME_ID);

    const contentVersionKey = `rts:match:${GAME_ID}:content_version`;
    const contentDefsKey = `rts:match:${GAME_ID}:content_defs`;

    const [contentVersion, contentDefsJson]: [string | null, string | null] =
      await Promise.all([
        (redis as any).get(contentVersionKey),
        (redis as any).get(contentDefsKey),
      ]);

    const parsed = contentDefsJson ? JSON.parse(contentDefsJson) : {};
    const entityTypes = parsed.entity_types ?? {};
    const resourceTypes = parsed.resource_types ?? {};

    return NextResponse.json({
      content_version: contentVersion ?? "",
      entity_types: entityTypes,
      resource_types: resourceTypes,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
