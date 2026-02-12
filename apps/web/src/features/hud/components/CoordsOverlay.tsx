"use client";

import { useEffect, useState } from "react";
import { useHUD } from "@/features/hud/components/HUDContext";
import { CELL_SIZE } from "@/features/pixijs/utils/proceduralBackground";

/**
 * M5.1: Shows grid (cell) coordinates at the center of the screen.
 * Same cell size as the procedural Voronoi background.
 */
export function CoordsOverlay() {
  const { selectors } = useHUD();
  const { app, camera } = selectors;
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!app) return;
    const tick = () => forceUpdate((n) => (n + 1) % 1_000_000);
    app.ticker.add(tick);
    return () => app.ticker.remove(tick);
  }, [app]);

  if (!app || !camera) return null;

  const centerX = app.screen.width / 2;
  const centerY = app.screen.height / 2;
  const centerWorld = camera.toLocal({ x: centerX, y: centerY });
  const cx = Math.floor(centerWorld.x / CELL_SIZE);
  const cy = Math.floor(centerWorld.y / CELL_SIZE);

  return (
    <div
      className="pointer-events-none absolute bottom-4 left-4 rounded bg-black/70 px-2 py-1 font-mono text-xs text-white/90"
      aria-live="polite"
      aria-label={`Grid coordinates at center ${cx}, ${cy}`}
    >
      grid {cx}, {cy}
    </div>
  );
}
