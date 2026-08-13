// TooltipOverlay.tsx

import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { useHUD } from "./HUDContext";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import { contentManager } from "@/features/content/contentManager";

export function TooltipOverlay() {
  const { selectors: { hoveredEntity, app } } = useHUD();
  const { player } = usePlayer();
  const [pos, setPos] = useState<{x:number;y:number}|null>(null);
  const [liveCollectorState, setLiveCollectorState] = useState<Record<string, any> | null>(null);
  const [playerNamesById, setPlayerNamesById] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    const loadPlayerNames = async () => {
      const names: Record<string, string> = {};
      if (player?.id && player.name) names[player.id] = player.name;

      try {
        const res = await fetch("/api/players/getActive", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (res.ok) {
          const activePlayers = (await res.json()) as Array<{ id?: unknown; name?: unknown }>;
          if (Array.isArray(activePlayers)) {
            for (const activePlayer of activePlayers) {
              if (typeof activePlayer.id === "string" && typeof activePlayer.name === "string") {
                names[activePlayer.id] = activePlayer.name;
              }
            }
          }
        }
      } catch {
        // The current player name is still available if the active-player lookup fails.
      }

      if (mounted) setPlayerNamesById(names);
    };

    void loadPlayerNames();
    return () => {
      mounted = false;
    };
  }, [player?.id, player?.name]);

  useEffect(() => {
    if (!app) return;
    if (!hoveredEntity) {
        setPos(null);
        return;
    }
    if (hoveredEntity.pos === undefined) {
        setPos(null);
        return;
    }
    const container = (hoveredEntity as any).pixiContainer as PIXI.Container | undefined;
    if (!container) {
        setPos(null);
        return;
    }
    const localPoint = new PIXI.Point(0, -40);
    const globalPoint = container.toGlobal(localPoint);

    setPos({ x: globalPoint.x, y: globalPoint.y });

  }, [hoveredEntity, app]);

  useEffect(() => {
    const entityId = hoveredEntity ? String((hoveredEntity as any).id ?? "") : "";
    if (!entityId) {
      setLiveCollectorState(null);
      return;
    }
    let mounted = true;
    let timer: number | undefined;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/v2/collector-state?ids=${encodeURIComponent(entityId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { collector_state_by_entity?: Record<string, any> };
        if (!mounted) return;
        setLiveCollectorState((data.collector_state_by_entity ?? {})[entityId] ?? null);
      } catch {
        // keep hover UI resilient on transient fetch failures
      }
    };
    void refresh();
    timer = window.setInterval(() => {
      void refresh();
    }, 500);
    return () => {
      mounted = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [hoveredEntity ? String((hoveredEntity as any).id ?? "") : ""]);

  if (!hoveredEntity || !pos) {
    return null
  };
  const collectorState = (liveCollectorState ?? (hoveredEntity as any).collector_state) as
    | {
        activity?: string;
        resource_type?: string;
        carry_amount?: number;
        carry_capacity?: number;
        effective_rate_per_second?: number;
      }
    | undefined;
  const activity = String(collectorState?.activity ?? "idle");
  const resourceType = String(collectorState?.resource_type ?? "");
  const carryAmount = Number(collectorState?.carry_amount ?? 0);
  const carryCapacity = Number(collectorState?.carry_capacity ?? 0);
  const effectiveRate = Number(collectorState?.effective_rate_per_second ?? 0);
  const ownerPlayerId = String((hoveredEntity as any).owner_player_id ?? "");
  const ownerPlayerName = playerNamesById[ownerPlayerId];
  const entityTypeId = String((hoveredEntity as any).entity_type_id ?? "");
  const health = Number((hoveredEntity as any).health);
  const maxHealth = contentManager.getEntityType(entityTypeId)?.health;
  const healthFraction = typeof maxHealth === "number" && maxHealth > 0 ? health / maxHealth : null;

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x + 10,
        top: pos.y + 10,
        pointerEvents: "none",
        background: "rgba(12,12,16,0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: 8,
        borderRadius: 6,
        fontSize: 12
      }}
    >
      {ownerPlayerName && <div><b>owner:</b> {ownerPlayerName}</div>}
      <div><b>{entityTypeId || "—"}</b></div>
      <div><b>id:</b> {(hoveredEntity as any).id}</div>
      {Number.isFinite(health) && (
        <div>
          <b>health:</b> {health.toFixed(1)}
          {typeof maxHealth === "number" && maxHealth > 0
            ? ` / ${maxHealth.toFixed(1)} (${Math.round(Math.min(1, Math.max(0, healthFraction ?? 0)) * 100)}%)`
            : ""}
        </div>
      )}
      <div><b>pos:</b> {Math.round(hoveredEntity.pos?.x ?? 0)}, {Math.round(hoveredEntity.pos?.y ?? 0)}</div>
      <div><b>vel:</b> {Math.round(hoveredEntity.vel?.x ?? 0)}, {Math.round(hoveredEntity.vel?.y ?? 0)}</div>
      {collectorState && <div><b>collector:</b> {activity}{resourceType ? ` (${resourceType})` : ""}</div>}
      {collectorState && carryCapacity > 0 && (
        <div><b>carry:</b> {carryAmount.toFixed(1)} / {carryCapacity.toFixed(1)}</div>
      )}
      {collectorState && carryCapacity <= 0 && (
        <div><b>rate:</b> {effectiveRate.toFixed(1)}/s</div>
      )}
    </div>
  );
}
