"use client";

import { useEffect, useState } from "react";
import { useHUD } from "@/features/hud/components/HUDContext";

const DEBUG_SHOW_FPS = process.env.NEXT_PUBLIC_DEBUG_SHOW_FPS === "1";
const FPS_UPDATE_INTERVAL_MS = 250;

/** Lightweight, opt-in view of Pixi's rolling render frame rate. */
export function FpsOverlay() {
  const { selectors } = useHUD();
  const { app } = selectors;
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!app || !DEBUG_SHOW_FPS) return;
    let lastUpdate = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastUpdate < FPS_UPDATE_INTERVAL_MS) return;
      lastUpdate = now;
      const nextFps = Math.round(app.ticker.FPS);
      setFps((currentFps) => (currentFps === nextFps ? currentFps : nextFps));
    };
    app.ticker.add(tick);
    return () => {
      app.ticker.remove(tick);
    };
  }, [app]);

  if (!app || !DEBUG_SHOW_FPS) return null;

  return (
    <div
      className="rounded bg-black/70 px-2 py-1 font-mono text-xs text-green-300"
      aria-live="polite"
      aria-label={`${fps} frames per second`}
    >
      {fps} FPS
    </div>
  );
}
