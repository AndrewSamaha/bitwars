// TooltipOverlay.tsx

import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { useHUD } from "./HUDContext";

export function TooltipOverlay() {
  const { selectors: { hoveredEntity, app, camera } } = useHUD();
  const [pos, setPos] = useState<{x:number;y:number}|null>(null);

  useEffect(() => {
    if (!camera) return;
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
    const resolution = (app.renderer as any)?.resolution ?? 1;
    const cssX = globalPoint.x / resolution;
    const cssY = globalPoint.y / resolution;

    setPos({ x: cssX, y: cssY });

  }, [hoveredEntity, hoveredEntity?.id, app, camera]);

  if (!hoveredEntity || !pos) {
    return null
  };

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
      <div>Ship ID: {(hoveredEntity as any).id}</div>
      <div><b>pos:</b> {Math.round(hoveredEntity.pos?.x ?? 0)}, {Math.round(hoveredEntity.pos?.y ?? 0)}</div>
      <div><b>vel:</b> {Math.round(hoveredEntity.vel?.x ?? 0)}, {Math.round(hoveredEntity.vel?.y ?? 0)}</div>
    </div>
  );
}
