"use client";
import { Application, Assets, Container, Sprite } from "pixi.js";
import { useEffect, useRef } from "react";
import { game } from "@/features/gamestate/world";
import { isLiveSprite } from "../utils/guards";

export default function GameStage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initWorld = async () => {
        const app = new Application();
        await app.init({
            background: '#000000',
            resizeTo: window,
            antialias: true,
            resolution: devicePixelRatio
        });

        ref.current!.appendChild(app.canvas);

        // Pixi scene graph root for world
        const worldContainer = new Container();
        app.stage.addChild(worldContainer);
        const texture = await Assets.load('/assets/corvette/idle.png');
        // Render system: project ECS -> Pixi once per frame
        const render = () => {
          // 1) Attach sprites to entities that have position but no sprite yet (proto or legacy)
          for (const e of game.world.with("pos").without("sprite")) {
            const sprite = Sprite.from(texture);
            sprite.anchor.set(0.5);
            worldContainer.addChild(sprite);
            // Attach as component so future frames render it
            (e as any).sprite = sprite;
            // default scale if none present
            if ((e as any).scale === undefined) (e as any).scale = 1;
          }
          for (const e of game.world.with("x", "y").without("sprite")) {
            const sprite = Sprite.from(texture);
            sprite.anchor.set(0.5);
            worldContainer.addChild(sprite);
            (e as any).sprite = sprite;
            if ((e as any).scale === undefined) (e as any).scale = 1;
          }

          // 2) Cull dead sprites and project ECS positions to Pixi
          for (const e of game.world.with("sprite").where((ee: any) => ee.pos || (ee.x !== undefined && ee.y !== undefined))) {
            if (!isLiveSprite(e.sprite)) {
              // Ensure the ECS stops tracking dead sprites immediately
              game.world.removeComponent?.(e as any, "sprite") ?? game.world.remove(e as any);
              continue;
            }
            // Position: prefer proto pos, fallback to legacy x/y
            const px = (e as any).pos ? (e as any).pos.x : (e as any).x;
            const py = (e as any).pos ? (e as any).pos.y : (e as any).y;
            e.sprite.position.set(px, py);
            const scale = (e as any).scale ?? 1;
            e.sprite.scale.set(scale / 2);
          }
        };

        app.ticker.add((time) => {
            const now = performance.now();
            game.tick(now);
            render();
        });

        return () => {
          app.destroy(true, { children: true, texture: false });
        };
    }
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      cleanup = await initWorld();
      if (cancelled && cleanup) cleanup();
    })();
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  return <div ref={ref} className="w-full h-full" />;
}
