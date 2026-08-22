"use client";

import React, { useEffect, useRef } from "react";
import { useLogger } from "@/lib/axiom/client";
import { game, RADIATION_DAMAGE_VISUAL_LINGER_MS, type Entity } from "../world";
import { intentQueue } from "@/features/intent-queue/intentQueueManager";
import { contentManager } from "@/features/content/contentManager";
import { useHUD } from "@/features/hud/components/HUDContext";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import { dispatchGameStateUpdated } from "@/features/gamestate/events";

// Types that match the SSE payload emitted by /api/v2/gamestate/stream
type Pos = { x: number; y: number };
type CollectorStatePayload = {
  activity: string;
  resource_type: string;
  carry_amount: number;
  carry_capacity: number;
  effective_rate_per_second: number;
  updated_tick?: number;
};

type ResourceEntryPayload = { resource_type: string; amount: number };
type PlayerLedgerPayload = { player_id: string; resources: ResourceEntryPayload[] };

type SnapshotPayload = {
  type: "snapshot";
  tick: number | string;
  entities: Array<{
    id: number | string;
    entity_type_id?: string;
    owner_player_id?: string;
    health?: number;
    pos?: Pos;
    vel?: Pos;
    force?: Pos;
    collector_state?: CollectorStatePayload;
  }>;
  player_ledgers?: PlayerLedgerPayload[];
};

type DeltaPayload = {
  type: "delta";
  tick: number | string;
  removed_entity_ids?: Array<number | string>;
  updates: Array<{
    id: number | string;
    entity_type_id?: string;
    owner_player_id?: string;
    health?: number;
    pos?: Pos;
    vel?: Pos;
    force?: Pos;
    collector_state?: CollectorStatePayload;
  }>;
};

type ActiveIntentOverlay = {
  intent_kind: "move" | "attack" | "build" | "collect" | string;
  intent_id?: string;
  started_tick?: number;
  move_target?: Pos;
};

const LIFECYCLE_STATE_ACCEPTED = 2;
const LIFECYCLE_STATE_IN_PROGRESS = 3;
const LIFECYCLE_STATE_FINISHED = 5;
const LIFECYCLE_STATE_CANCELED = 6;
const LIFECYCLE_STATE_REJECTED = 7;
const DEBUG_LOG_GAMESTATE_ENTITIES =
  process.env.NEXT_PUBLIC_DEBUG_LOG_GAMESTATE_ENTITIES === "1";

/**
 * The stream does not identify a damage source. Classify a health decrease as
 * radiation only when the target is within a configured source's outer range.
 */
function isWithinRadiationRange(target: Entity): boolean {
  const targetPos = target.pos;
  if (!targetPos) return false;
  for (const source of game.world.with("pos", "id")) {
    if (String(source.id) === String(target.id)) continue;
    const sources = contentManager.getEntityType(source.entity_type_id?.trim() ?? "")?.radiation_sources ?? [];
    const dx = source.pos.x - targetPos.x;
    const dy = source.pos.y - targetPos.y;
    const distanceSq = dx * dx + dy * dy;
    if (sources.some(({ max_effective_distance = 0 }) => max_effective_distance > 0 && distanceSq <= max_effective_distance ** 2)) return true;
  }
  return false;
}

// Bridges the SSE stream to the miniplex world by handling snapshot and delta events.
// - On snapshot: clears previously-streamed entities and repopulates them
// - On delta: upserts entities by id and patches provided components
export default function GameStateStreamBridge() {
  const log = useLogger();
  const hud = useHUD();
  const { player } = usePlayer();
  const RESOURCE_LEDGER_POLL_MS = 2000;
  const COLLECTOR_STATE_POLL_MS = 500;
  // Track entities we added so we can update/remove them precisely
  const byIdRef = useRef<Map<string, Entity>>(new Map());
  const streamIdRef = useRef<string>(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const firstDeltaLoggedRef = useRef<number>(0);
  const mountedAtRef = useRef<number>(Date.now());
  /** M7: Current player id — from /me (player.id) first, fallback to reconnect handshake. */
  const currentPlayerIdRef = useRef<string | null>(null);
  /** M8b: authoritative active intent overlays keyed by entity id. */
  const activeIntentByEntityRef = useRef<Map<string, ActiveIntentOverlay>>(new Map());
  log.info("GameStateStreamBridge:init", { streamId: streamIdRef.current });

  // M7: Single source for "my" player id and resources from /me — set ref and apply resource_ledger to HUD when player loads.
  useEffect(() => {
    currentPlayerIdRef.current = player?.id ?? null;
    if (player?.resource_ledger && Object.keys(player.resource_ledger).length > 0) {
      console.log("[GameStateStreamBridge] setResources from /me", player.resource_ledger);
      hud.actions.setResources(player.resource_ledger);
    }
  }, [player?.id, player?.resource_ledger, hud.actions]);

  // M8: Live deltas do not include player_ledgers, so poll /me for authoritative
  // resource totals and keep the HUD in sync during active collection.
  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;
    let requestInFlight = false;

    const syncResourcesFromMe = async () => {
      // Never start a second /me request while Redis is slow or unavailable.
      // setInterval otherwise produces an unbounded queue of identical calls.
      if (!currentPlayerIdRef.current || requestInFlight) return;
      requestInFlight = true;
      try {
        const res = await fetch("/api/players/me", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { resource_ledger?: Record<string, number> };
        const ledger = data?.resource_ledger;
        if (!mounted || !ledger || Object.keys(ledger).length === 0) return;
        hud.actions.setResources(ledger);
      } catch {
        // keep stream/render path resilient on transient /me failures
      } finally {
        requestInFlight = false;
      }
    };

    timer = window.setInterval(() => {
      void syncResourcesFromMe();
    }, RESOURCE_LEDGER_POLL_MS);
    void syncResourcesFromMe();

    return () => {
      mounted = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [hud.actions, RESOURCE_LEDGER_POLL_MS]);

  // Collector activity is persisted separately in Redis/UI state and is currently
  // only injected during bootstrap snapshots. Poll it so in-world FX can react live.
  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;
    let requestInFlight = false;

    const syncCollectorState = async () => {
      if (requestInFlight) return;
      const ids = Array.from(byIdRef.current.values())
        .map((ent) => String(ent.id ?? ""))
        .filter((id, index, arr) => id.length > 0 && arr.indexOf(id) === index);

      if (ids.length === 0) return;
      requestInFlight = true;

      try {
        const res = await fetch(`/api/v2/collector-state?ids=${encodeURIComponent(ids.join(","))}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          collector_state_by_entity?: Record<string, CollectorStatePayload>;
        };
        if (!mounted) return;

        const nextStates = data.collector_state_by_entity ?? {};
        const changedIds: string[] = [];
        for (const id of ids) {
          const ent = byIdRef.current.get(id);
          if (!ent) continue;
          const nextState = nextStates[id];
          const currentState = ent.collector_state;
          if (nextState) {
            const changed = !currentState ||
              currentState.activity !== nextState.activity ||
              currentState.resource_type !== nextState.resource_type ||
              currentState.carry_amount !== nextState.carry_amount ||
              currentState.carry_capacity !== nextState.carry_capacity ||
              currentState.effective_rate_per_second !== nextState.effective_rate_per_second ||
              currentState.updated_tick !== nextState.updated_tick;
            if (changed) {
              ent.collector_state = { ...nextState };
              changedIds.push(id);
            }
          } else if (currentState) {
            delete ent.collector_state;
            changedIds.push(id);
          }
        }
        if (changedIds.length > 0) {
          dispatchGameStateUpdated(changedIds);
        }
      } catch {
        // Keep rendering resilient on transient polling failures.
      } finally {
        requestInFlight = false;
      }
    };

    timer = window.setInterval(() => {
      void syncCollectorState();
    }, COLLECTOR_STATE_POLL_MS);
    void syncCollectorState();

    return () => {
      mounted = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [COLLECTOR_STATE_POLL_MS]);

  useEffect(() => {
    const byId = byIdRef.current;
    const world = game.world;

    // No server boot delay needed now that we gate rendering until snapshot is applied
    const streamUrl = `/api/v2/gamestate/stream?sid=${encodeURIComponent(streamIdRef.current)}`;
    const es = new EventSource(streamUrl);
    log.info("GameStateStreamBridge:es:create", { streamId: streamIdRef.current, url: streamUrl });

    const normalizeId = (id: number | string) => String(id);

    const applyIntentOverlayToEntity = (ent: Entity, overlay: ActiveIntentOverlay | undefined) => {
      if (!overlay) {
        delete (ent as any).active_intent_kind;
        delete (ent as any).active_intent_id;
        delete (ent as any).active_intent_started_tick;
        delete (ent as any).active_intent_move_target;
        return;
      }
      (ent as any).active_intent_kind = overlay.intent_kind;
      (ent as any).active_intent_id = overlay.intent_id;
      (ent as any).active_intent_started_tick = overlay.started_tick;
      if (overlay.move_target) {
        (ent as any).active_intent_move_target = {
          x: overlay.move_target.x,
          y: overlay.move_target.y,
        };
      } else {
        delete (ent as any).active_intent_move_target;
      }
    };

    const refreshIntentOverlays = () => {
      for (const [id, ent] of byId.entries()) {
        applyIntentOverlayToEntity(ent, activeIntentByEntityRef.current.get(id));
      }
    };

    const logEntitiesAndOwnership = (label: string) => {
      const myPlayerId = currentPlayerIdRef.current;
      const entities = Array.from(byId.entries()).map(([id, e]) => ({
        id,
        owner_player_id: (e as { owner_player_id?: string }).owner_player_id,
      }));
      console.log(`[GameState] ${label}`, { myPlayerId, entityCount: entities.length, entities });
    };

    const applySnapshot = (payload: SnapshotPayload) => {
      // Remove old streamed entities (and destroy any attached sprites)
      for (const [, ent] of byId) {
        try {
          // @ts-ignore - sprite is optional
          ent.sprite?.destroy?.();
        } catch {}
        world.remove(ent);
      }
      byId.clear();

      // Add new ones
      for (const s of payload.entities) {
        const ent: Entity = {
          id: s.id,
          ...(s.entity_type_id ? { entity_type_id: s.entity_type_id } : {}),
          ...(s.owner_player_id !== undefined ? { owner_player_id: s.owner_player_id } : {}),
          ...(s.health !== undefined ? { health: s.health } : {}),
          ...(s.pos ? { pos: { x: s.pos.x, y: s.pos.y } } : {}),
          ...(s.vel ? { vel: { x: s.vel.x, y: s.vel.y } } : {}),
          ...(s.collector_state ? { collector_state: { ...s.collector_state } } : {}),
          // force exists but is currently unused by systems
        };
        world.add(ent);
        byId.set(normalizeId(s.id), ent);
      }
      refreshIntentOverlays();
      // M7: Apply server resource state for current player to HUD
      const playerId = currentPlayerIdRef.current;
      const ledgers = payload.player_ledgers ?? [];
      if (playerId && ledgers.length > 0) {
        const myLedger = ledgers.find((pl) => pl.player_id === playerId);
        if (myLedger?.resources?.length) {
          const patch: Record<string, number> = {};
          for (const r of myLedger.resources) {
            if (r.resource_type && typeof r.amount === "number") patch[r.resource_type] = r.amount;
            else if (r.resource_type && typeof r.amount === "string") patch[r.resource_type] = Number(r.amount) || 0;
          }
          if (Object.keys(patch).length > 0) {
            console.log("[GameStateStreamBridge] setResources from snapshot", patch);
            hud.actions.setResources(patch);
          }
        }
      }
      log.info("GameStateStreamBridge:snapshot:applied", { streamId: streamIdRef.current, count: payload.entities.length });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bitwars:snapshot-applied"));
        dispatchGameStateUpdated(payload.entities.map((entity) => normalizeId(entity.id)));
      }
      // Signal that the world is ready for ticking/rendering
      if (!game.ready) {
        game.ready = true;
        log.info("GameStateStreamBridge:world:ready", { streamId: streamIdRef.current });
      }
      if (DEBUG_LOG_GAMESTATE_ENTITIES) logEntitiesAndOwnership("after snapshot");
    };

    const applyDelta = (payload: DeltaPayload) => {
      let existingEntities = 0;
      let newEntities = 0;
      for (const id of payload.removed_entity_ids ?? []) {
        const key = normalizeId(id);
        const existing = byId.get(key);
        if (!existing) continue;
        try {
          // @ts-ignore - sprite is optional
          existing.sprite?.destroy?.();
        } catch {}
        world.remove(existing);
        byId.delete(key);
        activeIntentByEntityRef.current.delete(key);
      }
      for (const u of payload.updates) {
        const key = normalizeId(u.id);
        const existing = byId.get(key);
        if (existing) {
          if (u.entity_type_id !== undefined) existing.entity_type_id = u.entity_type_id;
          if (u.pos) {
            if (!existing.pos) existing.pos = { x: u.pos.x, y: u.pos.y };
            else { existing.pos.x = u.pos.x; existing.pos.y = u.pos.y; }
          }
          if (u.vel) {
            if (!existing.vel) existing.vel = { x: u.vel.x, y: u.vel.y };
            else { existing.vel.x = u.vel.x; existing.vel.y = u.vel.y; }
          }
          if (u.owner_player_id !== undefined) existing.owner_player_id = u.owner_player_id;
          if (u.collector_state !== undefined) existing.collector_state = { ...u.collector_state };
          if (u.health !== undefined) {
            // Health decreases arrive every engine tick. Refresh liveness, but
            // only start a new particle timeline after the prior plume expires.
            if (existing.health !== undefined && u.health < existing.health && isWithinRadiationRange(existing)) {
              const nowMs = performance.now();
              if (existing.radiation_damage_last_at === undefined || nowMs - existing.radiation_damage_last_at >= RADIATION_DAMAGE_VISUAL_LINGER_MS) {
                existing.radiation_shed_started_at = nowMs;
              }
              existing.radiation_damage_last_at = nowMs;
            }
            existing.health = u.health;
          }
          applyIntentOverlayToEntity(existing, activeIntentByEntityRef.current.get(key));
          existingEntities++;
          // force currently ignored; add when systems need it
        } else {
          // Upsert: create a new entity if it doesn't exist yet
          const ent: Entity = {
            id: u.id,
            ...(u.entity_type_id ? { entity_type_id: u.entity_type_id } : {}),
            ...(u.owner_player_id !== undefined ? { owner_player_id: u.owner_player_id } : {}),
            ...(u.health !== undefined ? { health: u.health } : {}),
            ...(u.pos ? { pos: { x: u.pos.x, y: u.pos.y } } : {}),
            ...(u.vel ? { vel: { x: u.vel.x, y: u.vel.y } } : {}),
            ...(u.collector_state ? { collector_state: { ...u.collector_state } } : {}),
          };
          newEntities++;
          world.add(ent);
          byId.set(key, ent);
          applyIntentOverlayToEntity(ent, activeIntentByEntityRef.current.get(key));
        }
      }
      log.debug("GameStateStreamBridge:delta:applied", { streamId: streamIdRef.current, existingEntities, newEntities });
      if (DEBUG_LOG_GAMESTATE_ENTITIES && payload.updates.length > 0) {
        logEntitiesAndOwnership("after delta");
      }
      if (typeof window !== "undefined") {
        dispatchGameStateUpdated([
          ...(payload.removed_entity_ids ?? []).map(normalizeId),
          ...payload.updates.map((update) => normalizeId(update.id)),
        ]);
      }
    };

    const onSnapshot = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as SnapshotPayload;
        if (payload && payload.type === "snapshot") {
          log.info("GameStateStreamBridge:snapshot", { streamId: streamIdRef.current, tick: payload.tick, count: payload.entities.length });
          applySnapshot(payload);
        }
      } catch (err) {
        console.error("[GameStateStreamBridge] snapshot parse error", err);
        log.error("GameStateStreamBridge:snapshot:parse-error", { streamId: streamIdRef.current, error: (err as any)?.message || String(err) });
      }
    };
    const onDelta = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as DeltaPayload;
        if (payload && payload.type === "delta") {
          applyDelta(payload);
        }
      } catch (err) {
        console.error("[GameStateStreamBridge] delta parse error", err);
        log.error("GameStateStreamBridge:delta:parse-error", { streamId: streamIdRef.current, error: (err as any)?.message || String(err) });
      }
    };
    const onLaserShot = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as {
          type?: string;
          origin?: Pos;
          target?: Pos;
        };
        if (payload.type !== "laser_shot" || !payload.origin || !payload.target) return;
        window.dispatchEvent(new CustomEvent("bitwars:laser-shot", {
          detail: { origin: payload.origin, target: payload.target },
        }));
      } catch (err) {
        console.error("[GameStateStreamBridge] laser-shot parse error", err);
      }
    };

    // M1: Listen for lifecycle events to drive intent queue draining.
    const onLifecycle = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload && payload.type === "lifecycle") {
          const clientCmdId = payload.clientCmdId ?? "";
          const state =
            typeof payload.state === "number" ? payload.state : Number(payload.state);
          const serverTick =
            typeof payload.serverTick === "number"
              ? payload.serverTick
              : Number(payload.serverTick ?? 0);
          const intentId = payload.intentId ?? "";

          intentQueue.onLifecycleEvent({
            clientCmdId,
            intentId,
            playerId: payload.playerId ?? "",
            serverTick: payload.serverTick ?? "0",
            state,
            reason: typeof payload.reason === "number" ? payload.reason : Number(payload.reason),
          });

          const entityIdFromCmd = intentQueue.getEntityIdForClientCmd(clientCmdId);
          const entityKey =
            entityIdFromCmd != null ? String(entityIdFromCmd) : null;

          if (entityKey) {
            if (
              state === LIFECYCLE_STATE_ACCEPTED ||
              state === LIFECYCLE_STATE_IN_PROGRESS
            ) {
              const existing = activeIntentByEntityRef.current.get(entityKey);
              const kindFromCmd = intentQueue.getKindForClientCmd(clientCmdId);
              const kind = kindFromCmd ?? existing?.intent_kind ?? "move";
              const moveTarget =
                kind === "move"
                  ? (() => {
                      if (entityIdFromCmd != null) {
                        const st = intentQueue.getEntityState(entityIdFromCmd);
                        const active = st.active;
                        if (active && active.clientCmdId === clientCmdId) return active.target;
                      }
                      return (
                        byId.get(entityKey)?.active_intent_move_target ??
                        existing?.move_target
                      );
                    })()
                  : undefined;
              activeIntentByEntityRef.current.set(entityKey, {
                intent_kind: kind,
                intent_id: intentId || existing?.intent_id,
                started_tick:
                  Number.isFinite(serverTick) && serverTick > 0
                    ? serverTick
                    : existing?.started_tick,
                move_target: moveTarget,
              });
            } else if (
              state === LIFECYCLE_STATE_FINISHED ||
              state === LIFECYCLE_STATE_CANCELED ||
              state === LIFECYCLE_STATE_REJECTED
            ) {
              activeIntentByEntityRef.current.delete(entityKey);
            }
            refreshIntentOverlays();
            dispatchGameStateUpdated([entityKey]);
          }
        }
      } catch (err) {
        console.error("[GameStateStreamBridge] lifecycle parse error", err);
      }
    };

    // Track whether we've connected before (to distinguish initial vs reconnect)
    let hasConnectedBefore = false;

    const onOpen = () => {
      const msSinceMount = Date.now() - mountedAtRef.current;
      log.info("GameStateStreamBridge:es:open", { streamId: streamIdRef.current, msSinceMount, isReconnect: hasConnectedBefore });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bitwars:stream-open"));
      }

      // M2: On every open (initial + reconnect), reconcile the intent queue
      // with the server's tracking state so we don't duplicate or skip intents.
      intentQueue.reconcileWithServer().then(async (handshake) => {
        if (handshake) {
          if (handshake.player_id) currentPlayerIdRef.current = handshake.player_id; // fallback if player not yet from /me
          log.info("GameStateStreamBridge:reconnect:ok", {
            streamId: streamIdRef.current,
            serverTick: handshake.server_tick,
            protocolVersion: handshake.protocol_version,
            contentVersion: handshake.content_version ?? "",
            lastSeq: handshake.last_processed_client_seq,
            activeIntents: handshake.active_intents.length,
            isReconnect: hasConnectedBefore,
          });

          // M8b: hydrate active intent overlays from server-tracked reconnect data.
          const nextIntentMap = new Map<string, ActiveIntentOverlay>();
          for (const ai of handshake.active_intents ?? []) {
            const entityKey = String(ai.entity_id);
            nextIntentMap.set(entityKey, {
              intent_kind: (ai.intent_kind ?? "").toLowerCase() || "move",
              intent_id: ai.intent_id,
              started_tick: Number(ai.started_tick ?? 0),
              move_target:
                ai.move_target &&
                Number.isFinite(Number(ai.move_target.x)) &&
                Number.isFinite(Number(ai.move_target.y))
                  ? { x: Number(ai.move_target.x), y: Number(ai.move_target.y) }
                  : undefined,
            });
          }
          activeIntentByEntityRef.current = nextIntentMap;
          refreshIntentOverlays();
          dispatchGameStateUpdated(Array.from(byId.keys()));

          // M4: Validate content version and fetch if stale
          const serverContentVersion = handshake.content_version ?? "";
          if (serverContentVersion) {
            const ok = await contentManager.validateAndSync(serverContentVersion);
            if (ok) {
              log.info("GameStateStreamBridge:content:synced", {
                streamId: streamIdRef.current,
                contentVersion: contentManager.getContentVersion(),
              });
            } else {
              log.warn("GameStateStreamBridge:content:sync-failed", { streamId: streamIdRef.current });
            }
          }
        } else {
          log.warn("GameStateStreamBridge:reconnect:failed", { streamId: streamIdRef.current, isReconnect: hasConnectedBefore });
        }
      }).catch((err) => {
        log.warn("GameStateStreamBridge:reconnect:error", { streamId: streamIdRef.current, error: (err as any)?.message || String(err) });
      });

      hasConnectedBefore = true;
    };
    const onError = (evt: Event) => {
      // EventSource suppresses details; log readyState to detect disconnects.
      // @ts-ignore
      const rs: number | undefined = es?.readyState;
      log.warn("GameStateStreamBridge:es:error", { streamId: streamIdRef.current, readyState: rs });
    };

    es.addEventListener("snapshot", onSnapshot as EventListener);
    es.addEventListener("delta", onDelta as EventListener);
    es.addEventListener("laser-shot", onLaserShot as EventListener);
    es.addEventListener("lifecycle", onLifecycle as EventListener);
    es.addEventListener("open", onOpen as EventListener);
    es.addEventListener("error", onError as EventListener);

    return () => {
      log.info("GameStateStreamBridge:cleanup", { streamId: streamIdRef.current });
      es.removeEventListener("snapshot", onSnapshot as EventListener);
      es.removeEventListener("delta", onDelta as EventListener);
      es.removeEventListener("laser-shot", onLaserShot as EventListener);
      es.removeEventListener("lifecycle", onLifecycle as EventListener);
      es.removeEventListener("open", onOpen as EventListener);
      es.removeEventListener("error", onError as EventListener);
      es.close();

      // Clean up streamed entities we created (and destroy sprites)
      for (const [, ent] of byId) {
        try {
          // @ts-ignore - sprite is optional
          ent.sprite?.destroy?.();
        } catch {}
        world.remove(ent);
      }
      byId.clear();
      // Reset readiness so a subsequent mount waits for the next snapshot
      if (game.ready) {
        game.ready = false;
        log.info("GameStateStreamBridge:world:not-ready", { streamId: streamIdRef.current });
      }
    };
  }, []);

  // This component does not render anything; it just wires data into the ECS.
  return null;
}
