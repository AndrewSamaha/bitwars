"use client";

import { useEffect, useState } from "react";
import { AudioToggle } from "@/features/audio/components/AudioToggle";
import { GAMESTATE_UPDATED_EVENT } from "@/features/gamestate/events";
import { contentManager } from "@/features/content/contentManager";
import { game } from "@/features/gamestate/world";
import { actionResourceSource, isHubDepot, resourceDisplayKeys, spendableResourceAmount } from "@/features/hud/actionResources";
import { useHUD } from "@/features/hud/components/HUDContext";
const HUD_BASE =
  "pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-2 font-sans text-sm";


export function ResourceHUD() {
  const { selectors } = useHUD();
  const selectedId = selectors.firstSelectedId;
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (selectedId === null) return;
    let pendingRefresh: number | undefined;
    const onGameStateUpdated = () => {
      if (pendingRefresh !== undefined) return;
      pendingRefresh = window.setTimeout(() => {
        pendingRefresh = undefined;
        forceRerender((value) => value + 1);
      }, 100);
    };
    window.addEventListener(GAMESTATE_UPDATED_EVENT, onGameStateUpdated);
    return () => {
      window.removeEventListener(GAMESTATE_UPDATED_EVENT, onGameStateUpdated);
      if (pendingRefresh !== undefined) window.clearTimeout(pendingRefresh);
    };
  }, [selectedId]);

  const entities = selectedId === null ? [] : Array.from(game.world.with("id"));
  const entity = selectedId === null ? undefined : entities.find(entry => String(entry.id) === selectedId);
  const content = contentManager.getContent();
  const entityTypes = content?.entity_types ?? {};
  const source = selectedId === null ? undefined : actionResourceSource(selectedId, entities, entityTypes);
  const stock = source ?? entity;
  const resourceKeys = resourceDisplayKeys(stock, entities, entityTypes, content?.resource_types ?? {});
  const visible = !!entity && !entity.remembered && (entity.health === undefined || entity.health > 0);
  const amounts = resourceKeys.map(key => visible
    ? String(Math.round(stock?.resources?.find(entry => entry.resource_type === key)?.amount ?? 0))
    : "—");
  const hasHub = !!source && isHubDepot(entityTypes[source.entity_type_id ?? ""]);
  const spendable = hasHub
    ? resourceKeys.map(key => String(Math.round(spendableResourceAmount(source, key, entities, entityTypes))))
    : undefined;

  return (
    <div className={`${HUD_BASE} flex items-center gap-2`}>
      <AudioToggle />
      <span className="text-white/60">{source && source !== entity ? `Depot ${source.id} stock` : "Stock / cargo"}</span>
      <output
        className="flex items-center gap-3"
        aria-label={`Resources: ${resourceKeys.map((key, index) => `${key} ${amounts[index]}`).join(", ")}`}
      >
        {resourceKeys.map((key, index) => (
          <span key={key} className="flex items-center gap-2 text-white/95">
            <span className="capitalize text-white/80">{key}</span>
            <span className="w-[5ch] shrink-0 text-right font-medium tabular-nums">{amounts[index]}</span>
          </span>
        ))}
      </output>
      {spendable && (
        <span className="text-white/80" aria-label={`Spendable: ${resourceKeys.map((key, index) => `${key} ${spendable[index]}`).join(", ")}`}>
          Spendable: {resourceKeys.map((key, index) => `${key} ${spendable[index]}`).join(", ")}
        </span>
      )}
    </div>
  );
}
