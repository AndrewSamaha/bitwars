import { NextResponse } from "next/server";

import { requireAuthOr401 } from "@/features/users/utils/auth";
import { logger } from "@/lib/axiom/server";
import { redis } from "@/lib/db/connection";
import { getEnv } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";

/** Returns build progress for requested entities owned by the authenticated player. */
export async function GET(request: Request) {
  const routeStarted = performance.now();
  const gameId = getEnv("GAME_ID", DEFAULT_GAME_ID);
  let requestedEntityCount = 0;
  try {
    const { auth, res } = await requireAuthOr401();
    if (res) {
      logger.info("build_state_request", {
        event_type: "build_state_request",
        game_id: gameId,
        status: res.status,
        requested_entity_count: 0,
        route_ms: performance.now() - routeStarted,
      });
      return res;
    }
    const playerId = auth?.playerId;
    if (!playerId) {
      logger.info("build_state_request", {
        event_type: "build_state_request",
        game_id: gameId,
        status: 401,
        requested_entity_count: 0,
        route_ms: performance.now() - routeStarted,
      });
      return NextResponse.json(
        { error: "missing player context" },
        { status: 401 },
      );
    }

    const rawIds = new URL(request.url).searchParams.get("ids") ?? "";
    const ids = [
      ...new Set(
        rawIds
          .split(",")
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0),
      ),
    ].map(String);
    requestedEntityCount = ids.length;
    const build_state_by_entity: Record<
      string,
      {
        blueprint_id: string;
        progress: number;
        progress_updated_at_unix_ms?: number;
      }
    > = {};
    if (ids.length === 0) {
      const payload = {
        build_state_by_entity,
        server_time_ms: Date.now(),
      };
      logger.info("build_state_request", {
        event_type: "build_state_request",
        game_id: gameId,
        status: 200,
        requested_entity_count: 0,
        returned_state_count: 0,
        response_bytes: Buffer.byteLength(JSON.stringify(payload)),
        route_ms: performance.now() - routeStarted,
      });
      return NextResponse.json(payload);
    }

    const redisStarted = performance.now();
    const entries = await redis.hmget(
      `rts:match:${gameId}:active_intents`,
      ...ids,
    );
    const redisMs = performance.now() - redisStarted;
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const json = entries[index];
      if (!id || !json) continue;
      try {
        const entry = JSON.parse(json);
        if (
          entry?.player_id !== playerId ||
          !["build", "upgrade", "research"].includes(entry?.intent_kind) ||
          Number(entry?.entity_id) !== Number(id) ||
          typeof entry?.blueprint_id !== "string"
        )
          continue;
        build_state_by_entity[id] = {
          blueprint_id: entry.blueprint_id,
          progress: Number(entry.progress ?? 0),
          ...(Number.isSafeInteger(entry.progress_updated_at_unix_ms)
            ? { progress_updated_at_unix_ms: entry.progress_updated_at_unix_ms }
            : {}),
        };
      } catch {
        // Ignore malformed tracking entries.
      }
    }

    const payload = { build_state_by_entity, server_time_ms: Date.now() };
    const routeMs = performance.now() - routeStarted;
    logger.info("build_state_request", {
      event_type: "build_state_request",
      game_id: gameId,
      status: 200,
      requested_entity_count: ids.length,
      returned_state_count: Object.keys(build_state_by_entity).length,
      response_bytes: Buffer.byteLength(JSON.stringify(payload)),
      redis_ms: redisMs,
      route_ms: routeMs,
    });
    return NextResponse.json(
      payload,
      {
        headers: {
          "Server-Timing": `redis;dur=${redisMs.toFixed(2)}, route;dur=${routeMs.toFixed(2)}`,
        },
      },
    );
  } catch (error) {
    logger.error("build_state_request", {
      event_type: "build_state_request",
      game_id: gameId,
      status: 500,
      requested_entity_count: requestedEntityCount,
      route_ms: performance.now() - routeStarted,
      error_type: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
