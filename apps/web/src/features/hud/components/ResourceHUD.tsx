"use client";

import { useEffect, useState } from "react";
import { AudioToggle } from "@/features/audio/components/AudioToggle";
import {
  GAMESTATE_UPDATED_EVENT,
  type GameStateUpdatedDetail,
} from "@/features/gamestate/events";
import { game } from "@/features/gamestate/world";
import { useHUD } from "@/features/hud/components/HUDContext";

const HUD_BASE =
  "pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-2 font-sans text-sm";
const RESOURCE_KEYS = ["food", "minerals", "energy"] as const;

export function ResourceHUD() {
  const { selectors } = useHUD();
  const selectedId = selectors.firstSelectedId;
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (selectedId === null) return;
    let pendingRefresh: number | undefined;
    const onGameStateUpdated = (event: Event) => {
      const changedIds = (event as CustomEvent<GameStateUpdatedDetail>).detail?.entityIds;
      if (changedIds && !changedIds.includes(selectedId)) return;
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

  const entity = selectedId === null
    ? undefined
    : Array.from(game.world.with("id")).find((entry) => String(entry.id) === selectedId);
  const amounts = RESOURCE_KEYS.map((key) => {
    if (!entity || entity.remembered) return "—";
    const amount = entity.resources?.find((entry) => entry.resource_type === key)?.amount ?? 0;
    return String(Math.round(amount));
  });

  return (
    <div className={`${HUD_BASE} flex items-center gap-2`}>
      <AudioToggle />
      <output
        className="flex items-center gap-3"
        aria-label={`Resources: ${RESOURCE_KEYS.map((key, index) => `${key} ${amounts[index]}`).join(", ")}`}
      >
        {RESOURCE_KEYS.map((key, index) => (
          <span key={key} className="flex items-center gap-2 text-white/95">
            <span className="capitalize text-white/80">{key}</span>
            <span className="w-[5ch] shrink-0 text-right font-medium tabular-nums">{amounts[index]}</span>
          </span>
        ))}
      </output>
    </div>
  );
}
