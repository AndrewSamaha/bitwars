"use client";
import { Application, Assets, Container, Sprite } from "pixi.js";
import { useEffect, useRef } from "react";
import { game } from "@/features/gamestate/world";

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
            for (const e of game.world.with("sprite", "x", "y", "scale")) {
                e.sprite.position.set(e.x!, e.y!);
                e.sprite.scale.set(e.scale! / 2);
            }
        };

        app.ticker.add((time) => {
            const now = performance.now();
            game.tick(now);
            render();
        });

        // Example: spawn a few
        for (let i = 0; i < 2000; i++) {
            const sprite = Sprite.from(texture);
            sprite.anchor.set(0.5);
            worldContainer.addChild(sprite);
            const scale = i / 2000;
            
            game.world.add({ x: Math.random()*2000, y: Math.random()*2000, vx: 10*scale, vy: 0, sprite, scale: scale });
        }

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
