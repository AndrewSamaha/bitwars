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
  log.info("instantiating GameStateBridge", { byIdRef: byIdRef.current } );

  useEffect(() => {
    const byId = byIdRef.current;
    const world = game.world;

    const es = new EventSource("/api/v2/gamestate/stream");

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
      let concerningEntities = 0;
      for (const s of payload.entities) {
        let warnings: string[] = [];
        log.info("snapshot entity", { s });
        if (!s.pos) warnings.push("snapshot entity missing pos");
        if (!s.vel) warnings.push("snapshot entity missing vel");
        if (warnings.length > 0) {
          concerningEntities++;
          log.warn("snapshot entity missing components", { s, warnings });
        }
        else log.info("snapshot entity looks great", {s});

        const ent: Entity = {
          id: s.id,
          ...(s.pos ? { pos: { x: s.pos.x, y: s.pos.y } } : {}),
          ...(s.vel ? { vel: { x: s.vel.x, y: s.vel.y } } : {}),
          // force exists but is currently unused by systems
        };
        world.add(ent);
        byId.set(normalizeId(s.id), ent);
      }
      
      log.info("snapshot applied", { byIdRef: byIdRef.current, concerningEntities } );
    };

    const applyDelta = (payload: DeltaPayload) => {
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
          // force currently ignored; add when systems need it
        } else {
          // Upsert: create a new entity if it doesn't exist yet
          const ent: Entity = {
            id: u.id,
            ...(u.pos ? { pos: { x: u.pos.x, y: u.pos.y } } : {}),
            ...(u.vel ? { vel: { x: u.vel.x, y: u.vel.y } } : {}),
          };
          world.add(ent);
          byId.set(key, ent);
        }
      }
    };

    const onSnapshot = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as SnapshotPayload;
        if (payload && payload.type === "snapshot") {
          applySnapshot(payload);
        }
      } catch (err) {
        console.error("[GameStateStreamBridge] snapshot parse error", err);
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
      }
    };

    es.addEventListener("snapshot", onSnapshot as EventListener);
    es.addEventListener("delta", onDelta as EventListener);

    return () => {
      es.removeEventListener("snapshot", onSnapshot as EventListener);
      es.removeEventListener("delta", onDelta as EventListener);
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
    };
  }, []);

  // This component does not render anything; it just wires data into the ECS.
  return null;
}
