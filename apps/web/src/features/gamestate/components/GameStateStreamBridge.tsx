"use client";

import React, { useEffect, useRef } from "react";
import { useLogger } from "@/lib/axiom/client";
import { game, type Entity } from "../world";

// Types that match the SSE payload emitted by /api/v2/gamestate/stream
type Pos = { x: number; y: number };

type SnapshotPayload = {
  type: "snapshot";
  tick: number | string;
  entities: Array<{
    id: number | string;
    pos?: Pos;
    vel?: Pos;
    force?: Pos;
  }>;
};

type DeltaPayload = {
  type: "delta";
  tick: number | string;
  updates: Array<{
    id: number | string;
    pos?: Pos;
    vel?: Pos;
    force?: Pos;
  }>;
};

// Bridges the SSE stream to the miniplex world by handling snapshot and delta events.
// - On snapshot: clears previously-streamed entities and repopulates them
// - On delta: upserts entities by id and patches provided components
export default function GameStateStreamBridge() {
  const log = useLogger();
  // Track entities we added so we can update/remove them precisely
  const byIdRef = useRef<Map<string, Entity>>(new Map());
  const streamIdRef = useRef<string>(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const firstDeltaLoggedRef = useRef<number>(0);
  const mountedAtRef = useRef<number>(Date.now());
  log.info("GameStateStreamBridge:init", { streamId: streamIdRef.current });

  useEffect(() => {
    const byId = byIdRef.current;
    const world = game.world;

    // No server boot delay needed now that we gate rendering until snapshot is applied
    const streamUrl = `/api/v2/gamestate/stream?sid=${encodeURIComponent(streamIdRef.current)}`;
    const es = new EventSource(streamUrl);
    log.info("GameStateStreamBridge:es:create", { streamId: streamIdRef.current, url: streamUrl });

    const normalizeId = (id: number | string) => String(id);

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
          ...(s.pos ? { pos: { x: s.pos.x, y: s.pos.y } } : {}),
          ...(s.vel ? { vel: { x: s.vel.x, y: s.vel.y } } : {}),
          // force exists but is currently unused by systems
        };
        world.add(ent);
        byId.set(normalizeId(s.id), ent);
      }
      log.info("GameStateStreamBridge:snapshot:applied", { streamId: streamIdRef.current, count: payload.entities.length });
      // Signal that the world is ready for ticking/rendering
      if (!game.ready) {
        game.ready = true;
        log.info("GameStateStreamBridge:world:ready", { streamId: streamIdRef.current });
      }
    };

    const applyDelta = (payload: DeltaPayload) => {
      let existingEntities = 0;
      let newEntities = 0;
      for (const u of payload.updates) {
        const key = normalizeId(u.id);
        const existing = byId.get(key);
        if (existing) {
          if (u.pos) {
            if (!existing.pos) existing.pos = { x: u.pos.x, y: u.pos.y };
            else { existing.pos.x = u.pos.x; existing.pos.y = u.pos.y; }
          }
          if (u.vel) {
            if (!existing.vel) existing.vel = { x: u.vel.x, y: u.vel.y };
            else { existing.vel.x = u.vel.x; existing.vel.y = u.vel.y; }
          }
          existingEntities++;
          // force currently ignored; add when systems need it
        } else {
          // Upsert: create a new entity if it doesn't exist yet
          const ent: Entity = {
            id: u.id,
            ...(u.pos ? { pos: { x: u.pos.x, y: u.pos.y } } : {}),
            ...(u.vel ? { vel: { x: u.vel.x, y: u.vel.y } } : {}),
          };
          newEntities++;
          world.add(ent);
          byId.set(key, ent);
        }
      }
      log.debug("GameStateStreamBridge:delta:applied", { streamId: streamIdRef.current, existingEntities, newEntities });
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
    const onOpen = () => {
      log.info("GameStateStreamBridge:es:open", { streamId: streamIdRef.current, msSinceMount: Date.now() - mountedAtRef.current });
    };
    const onError = (evt: Event) => {
      // EventSource suppresses details; log readyState to detect disconnects.
      // @ts-ignore
      const rs: number | undefined = es?.readyState;
      log.warn("GameStateStreamBridge:es:error", { streamId: streamIdRef.current, readyState: rs });
    };

    es.addEventListener("snapshot", onSnapshot as EventListener);
    es.addEventListener("delta", onDelta as EventListener);
    es.addEventListener("open", onOpen as EventListener);
    es.addEventListener("error", onError as EventListener);

    return () => {
      log.info("GameStateStreamBridge:cleanup", { streamId: streamIdRef.current });
      es.removeEventListener("snapshot", onSnapshot as EventListener);
      es.removeEventListener("delta", onDelta as EventListener);
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
