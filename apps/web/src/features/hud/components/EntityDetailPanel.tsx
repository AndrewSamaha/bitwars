"use client"

import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHUD } from "@/features/hud/components/HUDContext";
import { getEntityDetailLeftOffset } from "@/features/hud/layout/constants";
import { game } from "@/features/gamestate/world";

export default function EntityDetailPanel() {
  const { selectors } = useHUD();
  const { selectedEntities } = selectors;
  // Access Pixi application to subscribe to ticker
  const { app } = selectors as any;
  const [, forceRerender] = useState(0);

  // Re-render every Pixi frame so entity positions are fresh
  useEffect(() => {
    if (!app) return;
    const tick = () => forceRerender((n) => (n + 1) % 1000000);
    app.ticker.add(tick);
    return () => {
      app.ticker.remove(tick);
    };
  }, [app]);

  // Position the detail panel so it never overlaps the TerminalPanel
  // TerminalPanel uses w-96 (24rem) when open and w-12 (3rem) when closed, with left-4 (1rem) margin
  // Add a 1rem gutter between panels for visual separation
  const { isTerminalOpen } = selectors;
  const leftOffsetRem = getEntityDetailLeftOffset(isTerminalOpen);

  // Build a quick lookup of current positions by entity id (stringified)
  const idToPos = new Map<string, { x: number; y: number }>();
  try {
    for (const e of game.world.with("pos", "id")) {
      const id = String((e as any).id);
      const pos = (e as any).pos as { x: number; y: number } | undefined;
      if (id != null && pos) {
        idToPos.set(id, pos);
      }
    }
  } catch {}

  if (!selectedEntities?.length) return null;

  return (
    <div
      className={`fixed bottom-4 z-50 ${selectedEntities.length > 0 ? "h-20" : "h-2"}`}
      style={{ left: `${leftOffsetRem}rem`, right: "1rem" }}
    >
      <div className="w-full h-full bg-opacity-95 border border-border rounded-lg shadow-2xl flex flex-col">
        {selectedEntities.length > 0 ? (
          <div className="p-3">
            <ul className="text-xs space-y-1">
              {selectedEntities.map((id) => {
                const pos = idToPos.get(id);
                return (
                  <li key={id} className="flex items-center justify-between">
                    <span className="font-mono">id: {id}</span>
                    <span className="font-mono text-muted-foreground">
                      {pos ? `x: ${pos.x.toFixed(1)}, y: ${pos.y.toFixed(1)}` : "pos: —"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="p-3 text-xs">No entities selected</div>
        )}
      </div>
    </div>
  );
}
