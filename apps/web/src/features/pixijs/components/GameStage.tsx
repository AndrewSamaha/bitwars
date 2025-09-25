"use client";
import { Application, Assets, Container, Sprite, Graphics } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { game } from "@/features/gamestate/world";
import LoadingAnimation from "@/components/LoadingAnimation";
import { TooltipOverlay } from "@/features/hud/components/TooltipOverlay";
import { useHUD } from "@/features/hud/components/HUDContext";
import { createHoverIndicator } from "@/features/hud/graphics/hoverIndicator";
import { SELECTED_COLOR, CLEAN_COLOR, BACKGROUND_APP_COLOR } from "@/features/hud/styles/style";

export default function GameStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<boolean>(game.ready);
  const { actions: { setHovered, setApp, setCamera }} = useHUD();

  useEffect(() => {
    // Observe readiness until the first snapshot is applied
    let poll = window.setInterval(() => {
      if (game.ready) {
        setReady(true);
        window.clearInterval(poll);
      }
    }, 100);

    const initWorld = async () => {
        const app = new Application();
        await app.init({
            background: BACKGROUND_APP_COLOR,
            resizeTo: window,
            antialias: true,
            resolution: devicePixelRatio
        });
        setApp(app);
        setCamera(app.stage);

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
          // 1) Attach containers (and inner sprite) to entities that have position but no container yet (proto only)
          for (const e of game.world.with("pos").without("pixiContainer")) {
            if (attached.has(e)) continue;
            const entityContainer = new Container();
            entityContainer.eventMode = 'static';
            // create primary sprite as child
            const sprite = Sprite.from(texture);
            sprite.anchor.set(0.5);
            entityContainer.addChild(sprite);
            worldContainer.addChild(entityContainer);
            // Attach container as component so future frames render it
            (e as any).pixiContainer = entityContainer;
            entityContainer
              .on("mouseover", () => {
                (e as any).hover = true;
              })
              .on("mouseout", () => {
                (e as any).hover = false;
                setHovered(null);
              });
            attached.add(e);
            // default scale if none present
            if ((e as any).scale === undefined) (e as any).scale = 1;
          }

          // 2) Project ECS positions/rotation to Pixi (proto only)
          for (const e of game.world.with("pixiContainer", "pos")) {
            const container = (e as any).pixiContainer as Container | undefined;
            if (!container || (container as any).destroyed) {
              // Remove container from scene graph and destroy it to prevent leaks
              try {
                if (container) container.parent?.removeChild(container);
                container?.destroy({ children: true });
              } catch {}
              // Ensure the ECS stops tracking dead sprites immediately
              game.world.removeComponent?.(e, "pixiContainer") ?? game.world.remove(e);
              attached.delete(e);
              continue;
            }
            // Position: proto pos (already advanced by world.tick)
            container.position.set(e.pos.x, e.pos.y);
            const scale = (e as any).scale ?? 1;
            container.scale.set(scale / 2);

            // Rotation: if we have proto velocity, rotate to face direction of travel
            const vel = e.vel as { x: number; y: number } | undefined;
            if (vel) {
              const { x: vx, y: vy } = vel;
              if (vx !== 0 || vy !== 0) {
                // atan2 returns radians; 0 rad means pointing along +X axis
                container.rotation = Math.atan2(vy, vx);
              }
            }

            // 3) Project ECS hover state to Pixi (proto only)
            // First child is primary sprite
            const primary = container.children.find((c) => c instanceof Sprite) as Sprite | undefined;
            if ((e as any).hover) {
              if (primary) (primary as any).tint = SELECTED_COLOR;
              // ensure a hover indicator exists as a child after sprite
              let hoverIndicator = container.children.find((c) => c.label === 'hoverIndicator') as Graphics | undefined;
              if (!hoverIndicator) {
                hoverIndicator = createHoverIndicator();
                container.addChild(hoverIndicator);
              }
              setHovered(e);
            } else {
              if (primary) (primary as any).tint = CLEAN_COLOR;
              // remove hover indicator if present
              const existing = container.children.find((c) => c.label === 'hoverIndicator');
              if (existing) existing.parent?.removeChild(existing);
            }
          }
        };

        app.ticker.add(() => {
            // Wait for first snapshot to be applied before rendering/ticking
            if (!game.ready) return;
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
      window.clearInterval(poll);
      // Reset local readiness; Bridge will toggle global ready on next mount
      setReady(false);
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      {/* Canvas mount point */}
      <div ref={ref} className="absolute inset-0" />
      {ready && <TooltipOverlay />}
      {/* Overlay loading indicator while world is not ready */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <LoadingAnimation />
        </div>
      )}
    </div>
  );
}
