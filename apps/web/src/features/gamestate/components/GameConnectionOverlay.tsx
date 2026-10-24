"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { gameConnection } from "../connection";

export default function GameConnectionOverlay() {
  const [mounted, setMounted] = useState(false);
  const state = useSyncExternalStore(gameConnection.subscribe, gameConnection.getSnapshot, () => "connecting");
  useEffect(() => {
    setMounted(true);
    const block = (event: Event) => {
      if (gameConnection.check()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const events = ["keydown", "keyup", "pointerdown", "pointerup", "click", "wheel", "contextmenu"];
    for (const name of events) window.addEventListener(name, block, { capture: true, passive: false });
    return () => { for (const name of events) window.removeEventListener(name, block, true); };
  }, []);
  if (!mounted || state === "live") return null;
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/60 backdrop-grayscale" role="dialog" aria-modal="true" aria-labelledby="connection-title">
      <div className="rounded-xl border border-gray-600 bg-gray-950/95 px-8 py-6 text-center text-white shadow-xl" role="status" aria-live="polite">
        <h2 id="connection-title" className="text-lg font-semibold">{state === "connecting" ? "Connecting to game…" : "Connection interrupted. Reconnecting…"}</h2>
        <p className="mt-2 text-sm text-gray-300">{state === "connecting" ? "Waiting for current game state." : "Your view is paused. Gameplay will resume when synchronized."}</p>
      </div>
    </div>,
    document.body,
  );
}
