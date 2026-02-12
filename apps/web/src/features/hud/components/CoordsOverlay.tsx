"use client";

import { useEffect, useState } from "react";
import { useHUD } from "@/features/hud/components/HUDContext";

/**
 * M5.1: Shows world coordinates at the center of the screen.
 * Re-renders on app tick so coords stay in sync when the camera pans.
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
  const x = Math.round(centerWorld.x);
  const y = Math.round(centerWorld.y);

  return (
    <div
      className="pointer-events-none absolute bottom-4 left-4 rounded bg-black/70 px-2 py-1 font-mono text-xs text-white/90"
      aria-live="polite"
      aria-label={`World coordinates at center ${x}, ${y}`}
    >
      world {x}, {y}
    </div>
  );
}
