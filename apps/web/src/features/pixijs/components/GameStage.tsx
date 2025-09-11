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

        // Render system: project ECS -> Pixi once per frame
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
            if ((e as any).scale === undefined) (e as any).scale = 1;
          }

          // 2) Cull dead sprites and project ECS positions/rotation to Pixi (proto only)
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
              game.world.removeComponent?.(e as any, "sprite") ?? game.world.remove(e as any);
              attached.delete(e);
              continue;
            }
            // Position: proto pos
            e.sprite.position.set((e as any).pos.x, (e as any).pos.y);
            const scale = (e as any).scale ?? 1;
            e.sprite.scale.set(scale / 2);

            // Rotation: if we have a velocity vector, rotate to face direction of travel
            const hasProtoVel = (e as any).vel && typeof (e as any).vel.x === 'number' && typeof (e as any).vel.y === 'number';
            const vx = hasProtoVel ? (e as any).vel.x : undefined;
            const vy = hasProtoVel ? (e as any).vel.y : undefined;
            if (typeof vx === 'number' && typeof vy === 'number' && (vx !== 0 || vy !== 0)) {
              // atan2 returns radians; 0 rad means pointing along +X axis
              e.sprite.rotation = Math.atan2(vy, vx);
            }
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
