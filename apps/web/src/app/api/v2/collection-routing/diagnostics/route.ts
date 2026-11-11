import { NextRequest, NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { redis } from "@/lib/db/connection";
import { gameQueryKeys, getCurrentSnapshot, getGameId } from "@/lib/game-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2048;
const CODES: Record<string, true> = {
  worker_unavailable: true, not_collector: true, no_capacity: true, source_unavailable: true,
  assigned_depot_unavailable: true, depot_unavailable: true, no_safe_recurring_route: true,
  no_safe_initial_route: true, planner_failed: true, planner_worker_failed: true, planner_worker_start_failed: true,
};
const validId = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;

async function boundedJson(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error("body too large");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Client-observed pre-submit refusals, not authoritative intent rejections. */
export async function POST(request: NextRequest) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  const playerId = auth?.playerId as string | undefined;
  if (!playerId) return NextResponse.json({ error: "missing player context" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const value = await boundedJson(request);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid body");
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid or oversized diagnostic" }, { status: 400 });
  }
  const { entity_id: entityId, reason_code: reasonCode, resource_type_id: resourceTypeId,
    source_entity_id: sourceId, depot_entity_id: depotId, message, run_id: runId } = body;
  if (!validId(entityId) || typeof reasonCode !== "string" || !Object.hasOwn(CODES, reasonCode)
    || (resourceTypeId !== undefined && (typeof resourceTypeId !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(resourceTypeId)))
    || (sourceId !== undefined && !validId(sourceId)) || (depotId !== undefined && !validId(depotId))
    || (message !== undefined && (typeof message !== "string" || message.length > 256))
    || (runId !== undefined && (typeof runId !== "string" || runId.length > 128))) {
    return NextResponse.json({ error: "invalid routing diagnostic" }, { status: 400 });
  }

  const gameId = getGameId();
  const [snapshot, runtimeValue, [snapshotRun, snapshotTick]] = await Promise.all([
    getCurrentSnapshot(gameId), redis.get(`rts:match:${gameId}:runtime`),
    redis.hmget(`snapshot_meta:${gameId}`, "run_id", "tick"),
  ]);
  if (!snapshot) return NextResponse.json({ error: "snapshot unavailable" }, { status: 503 });
  const actor = snapshot.entities.find(entity => entity.id === BigInt(entityId));
  if (!actor || actor.ownerPlayerId !== playerId) return NextResponse.json({ error: "actor not owned" }, { status: 403 });
  // Discovery is the authoritative collection-source set; knowledge entries
  // may be absent in checkpoints predating last-known observations.
  let discovered: unknown;
  try { discovered = JSON.parse(snapshot.discoveredEntitiesJson || "{}"); }
  catch { discovered = {}; }
  const discoveredIds = discovered && typeof discovered === "object" && !Array.isArray(discovered)
    ? (discovered as Record<string, unknown>)[playerId] : undefined;
  if (sourceId !== undefined && !(Array.isArray(discoveredIds) && discoveredIds.includes(sourceId))
    && !snapshot.entities.some(entity => entity.id === BigInt(sourceId) && entity.ownerPlayerId === playerId)) {
    return NextResponse.json({ error: "source not discovered" }, { status: 403 });
  }
  if (depotId !== undefined
    && !snapshot.entities.some(entity => entity.id === BigInt(depotId) && entity.ownerPlayerId === playerId)) {
    return NextResponse.json({ error: "depot not owned" }, { status: 403 });
  }

  let currentRun: string | undefined;
  try {
    const parsed: unknown = runtimeValue ? JSON.parse(runtimeValue) : null;
    if (parsed && typeof parsed === "object" && "run_id" in parsed && typeof parsed.run_id === "string") currentRun = parsed.run_id;
  } catch {
    return NextResponse.json({ error: "runtime unavailable" }, { status: 503 });
  }
  if (!currentRun || runId !== currentRun) return NextResponse.json({ error: "world changed; wait for the new snapshot" }, { status: 409 });
  if (snapshotRun !== currentRun || snapshotTick !== snapshot.tick.toString()) {
    return NextResponse.json({ error: "snapshot changed; wait for the new snapshot" }, { status: 409 });
  }
  // A per-actor server guard bounds deliberately noisy clients; browser-side dedupe is by blocked transition.
  const throttleKey = `rts:match:${gameId}:collection_routing_blocked:${playerId}:${entityId}`;
  const accepted = await redis.set(throttleKey, "1", "EX", 2, "NX");
  if (!accepted) return NextResponse.json({ ok: true, recorded: false });
  const event = {
    event_type: "collection_routing_blocked", reporter: "client", entity_id: entityId,
    reason_code: reasonCode, ...(resourceTypeId ? { resource_type_id: resourceTypeId } : {}),
    ...(sourceId ? { source_entity_id: sourceId } : {}), ...(depotId ? { depot_entity_id: depotId } : {}),
    ...(message ? { message } : {}), ...(currentRun ? { run_id: currentRun } : {}),
    server_tick: Number(snapshot.tick), occurred_at_ms: Date.now(), recipients: [playerId],
  };
  const eventId = await redis.xadd(gameQueryKeys(gameId).gameplayEvents, "MAXLEN", "~", 100000, "*", "data", JSON.stringify(event));
  return NextResponse.json({ ok: true, recorded: true, event_id: eventId });
}
