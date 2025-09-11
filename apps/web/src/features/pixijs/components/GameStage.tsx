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
        worldContainer.position.set(800, 500);
        worldContainer.scale.set(.5);
        app.stage.addChild(worldContainer);
        const texture = await Assets.load('/assets/corvette/idle.png');
        // Track which entities we've attached sprites to, to avoid re-attaching due to query/index lag
        const attached = new WeakSet<any>();

        // Render system: project ECS -> Pixi once per frame (movement handled in world.tick)
        const render = () => {
          // 1) Attach sprites to entities that have position but no sprite yet (proto only)
          for (const e of game.world.with("pos").without("sprite")) {
            if (attached.has(e)) continue;
            const sprite = Sprite.from(texture);
            sprite.anchor.set(0.5);
            worldContainer.addChild(sprite);
            // Attach as component so future frames render it
            (e as any).sprite = sprite;
            attached.add(e);
            // default scale if none present
            if (e.scale === undefined) e.scale = 1;
          }

          // 2) Project ECS positions/rotation to Pixi (proto only)
          for (const e of game.world.with("sprite", "pos")) {
            if (!isLiveSprite(e.sprite)) {
              // Remove sprite from scene graph and destroy it to prevent leaks
              try {
                const spr = (e as any).sprite as Sprite | undefined;
                if (spr) {
                  spr.parent?.removeChild(spr);
                  spr.destroy();
                }
              } catch {}
              // Ensure the ECS stops tracking dead sprites immediately
              game.world.removeComponent?.(e, "sprite") ?? game.world.remove(e);
              attached.delete(e);
              continue;
            }
            // Position: proto pos (already advanced by world.tick)
            e.sprite.position.set(e.pos.x, e.pos.y);
            const scale = e.scale ?? 1;
            e.sprite.scale.set(scale / 2);

            // Rotation: if we have proto velocity, rotate to face direction of travel
            const vel = e.vel as { x: number; y: number } | undefined;
            if (vel) {
              const { x: vx, y: vy } = vel;
              if (vx !== 0 || vy !== 0) {
                // atan2 returns radians; 0 rad means pointing along +X axis
                e.sprite.rotation = Math.atan2(vy, vx);
              }
            }
          }
        };

        app.ticker.add(() => {
            // Advance ECS systems (including movement)
            game.tick(performance.now());
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
