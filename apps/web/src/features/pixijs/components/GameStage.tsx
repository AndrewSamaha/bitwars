"use client";
import { Application, Assets, Container, Sprite, Graphics, type Texture } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { PRELOAD_ENTITY_TYPES } from "@bitwars/content";
import { game } from "@/features/gamestate/world";
import LoadingAnimation from "@/components/LoadingAnimation";
import { TooltipOverlay } from "@/features/hud/components/TooltipOverlay";
import { CoordsOverlay } from "@/features/hud/components/CoordsOverlay";
import { useHUD } from "@/features/hud/components/HUDContext";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import { createHoverIndicator } from "@/features/hud/graphics/hoverIndicator";
import { SELECTED_COLOR, CLEAN_COLOR, BACKGROUND_APP_COLOR } from "@/features/hud/styles/style";
import { intentQueue, type SendIntentParams } from "@/features/intent-queue/intentQueueManager";
import {
  CELL_SIZE,
  SEED,
  SAMPLE_SPACING,
  EDGE_THRESHOLD_SQ,
  BORDER_COLOR,
  getVoronoiDistancesAt,
  getViewportWorldAABB,
} from "@/features/pixijs/utils/proceduralBackground";

/** World units per second when panning with WASD / arrows */
const PAN_SPEED = 400;

/** M6: Tint for entities not owned by the current player */
const NON_OWNED_TINT = 0x66_66_66;
/** M6: Minimap dot colors by ownership */
const MINIMAP_MY_COLOR = 0x44_aa_ff;
const MINIMAP_OTHER_COLOR = 0xee_66_44;
const MINIMAP_NEUTRAL_COLOR = 0x88_88_88;

const PAN_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

function isFocusInEditable(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

export default function GameStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<boolean>(game.ready);
  const { player } = usePlayer();
  const { actions: { setHovered, setApp, setCamera, setSelection, setSelectedAction }, selectors } = useHUD();
  // Keep latest selectors in a ref so event handlers see current selection/action
  const latestSelectorsRef = useRef(selectors);
  useEffect(() => { latestSelectorsRef.current = selectors; }, [selectors]);
  // M6: Current player id for ownership gating and visuals (ref so initWorld closure sees latest)
  const myPlayerIdRef = useRef<string | null>(null);
  myPlayerIdRef.current = player?.id ?? null;
  // M5.1: Pan keys currently held (KeyW, KeyA, ...); ticker reads this and applies pan
  const panKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Observe readiness until the first snapshot is applied
    let poll = window.setInterval(() => {
      if (game.ready) {
        setReady(true);
        window.clearInterval(poll);
      }
    }, 100);

    // M1: Wire the queue manager's send callback to POST /api/v1/intent
    intentQueue.setSendCallback(async (params: SendIntentParams) => {
      await fetch('/api/v1/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Move',
          entity_id: params.entityId,
          target: params.target,
          client_cmd_id: params.clientCmdId,
          client_seq: params.clientSeq,
          policy: params.policy,
        }),
      });
    });

    const initWorld = async () => {
        const app = new Application();
        await app.init({
            background: BACKGROUND_APP_COLOR,
            resizeTo: window,
            antialias: true,
            resolution: devicePixelRatio
        });
        setApp(app);
        ref.current!.appendChild(app.canvas);

        // Pixi scene graph root for world (M5.1: this is the camera — we pan by updating its position)
        const worldContainer = new Container();
        worldContainer.position.set(800, 500);
        worldContainer.scale.set(.5);
        app.stage.addChild(worldContainer);
        setCamera(worldContainer);

        // M5.2: Voronoi border overlay in screen space (sample grid → edge test → draw dots)
        const voronoiBorderGraphics = new Graphics();
        (voronoiBorderGraphics as any).label = "voronoiBorders";
        voronoiBorderGraphics.eventMode = "none";
        app.stage.addChild(voronoiBorderGraphics);

        let lastVoronoiUpdate = -1000;
        let lastCamX = worldContainer.position.x;
        let lastCamY = worldContainer.position.y;
        const VORONOI_UPDATE_INTERVAL_MS = 100;
        const VORONOI_CAMERA_MOVE_THRESHOLD = 25;
        const BORDER_DOT_SIZE = 2;

        function updateVoronoiBorders() {
          voronoiBorderGraphics.clear();
          const w = app.screen.width;
          const h = app.screen.height;
          for (let sy = 0; sy <= h; sy += SAMPLE_SPACING) {
            for (let sx = 0; sx <= w; sx += SAMPLE_SPACING) {
              const pWorld = worldContainer.toLocal({ x: sx, y: sy });
              const { d1Sq, d2Sq } = getVoronoiDistancesAt(pWorld.x, pWorld.y, CELL_SIZE, SEED);
              const edge = d2Sq - d1Sq;
              if (edge < EDGE_THRESHOLD_SQ) {
                voronoiBorderGraphics
                  .rect(sx, sy, BORDER_DOT_SIZE, BORDER_DOT_SIZE)
                  .fill({ color: BORDER_COLOR });
              }
            }
          }
        }

        // M5.3: Minimap (centered on camera, unit dots, viewport rect) — screen space, bottom-right
        // 200 px → 20_000 world units ⇒ 1 minimap pixel = 100 world units
        const MINIMAP_HALF_EXTENT = 10_000;
        const MINIMAP_SIZE_PX = 200;
        const MINIMAP_MARGIN = 10;
        const MINIMAP_UNIT_DOT_RADIUS = 2;
        const minimapGraphics = new Graphics();
        (minimapGraphics as any).label = "minimap";
        minimapGraphics.eventMode = "none";
        const minimapContainer = new Container();
        (minimapContainer as any).label = "minimapContainer";
        minimapContainer.addChild(minimapGraphics);
        app.stage.addChild(minimapContainer);

        function worldToMinimapPx(
          wx: number,
          wy: number,
          centerX: number,
          centerY: number,
        ): { px: number; py: number } {
          const range = MINIMAP_HALF_EXTENT * 2;
          const px = ((wx - centerX + MINIMAP_HALF_EXTENT) / range) * MINIMAP_SIZE_PX;
          const py = ((wy - centerY + MINIMAP_HALF_EXTENT) / range) * MINIMAP_SIZE_PX;
          return { px, py };
        }

        function updateMinimap() {
          const centerWorld = worldContainer.toLocal({
            x: app.screen.width / 2,
            y: app.screen.height / 2,
          });
          minimapContainer.position.set(
            app.screen.width - MINIMAP_SIZE_PX - MINIMAP_MARGIN,
            app.screen.height - MINIMAP_SIZE_PX - MINIMAP_MARGIN,
          );
          minimapGraphics.clear();
          // Background
          minimapGraphics.rect(0, 0, MINIMAP_SIZE_PX, MINIMAP_SIZE_PX).fill({ color: 0x0a_0c_10, alpha: 0.9 });
          minimapGraphics.rect(0, 0, MINIMAP_SIZE_PX, MINIMAP_SIZE_PX).stroke({ width: 1, color: 0x3a_3e_4a });
          // Viewport rect (visible world AABB)
          const viewportAabb = getViewportWorldAABB(worldContainer, app.screen.width, app.screen.height, 0);
          const vmin = worldToMinimapPx(viewportAabb.minX, viewportAabb.minY, centerWorld.x, centerWorld.y);
          const vmax = worldToMinimapPx(viewportAabb.maxX, viewportAabb.maxY, centerWorld.x, centerWorld.y);
          const vx = Math.max(0, Math.min(vmin.px, MINIMAP_SIZE_PX - 1));
          const vy = Math.max(0, Math.min(vmin.py, MINIMAP_SIZE_PX - 1));
          const vw = Math.max(1, Math.min(vmax.px - vmin.px, MINIMAP_SIZE_PX - vx));
          const vh = Math.max(1, Math.min(vmax.py - vmin.py, MINIMAP_SIZE_PX - vy));
          minimapGraphics.rect(vx, vy, vw, vh).stroke({ width: 1.5, color: 0x6a_aa_ff, alpha: 0.9 });
          // Unit dots (M6: color by ownership — my / other / neutral)
          const myId = myPlayerIdRef.current;
          for (const e of game.world.with("pos", "id")) {
            const pos = (e as { pos: { x: number; y: number } }).pos;
            const ownerId = (e as { owner_player_id?: string }).owner_player_id;
            let color = MINIMAP_NEUTRAL_COLOR;
            if (ownerId !== undefined && ownerId !== "" && ownerId !== "neutral") {
              color = myId != null && ownerId === myId ? MINIMAP_MY_COLOR : MINIMAP_OTHER_COLOR;
            }
            const { px, py } = worldToMinimapPx(pos.x, pos.y, centerWorld.x, centerWorld.y);
            if (px >= 0 && px <= MINIMAP_SIZE_PX && py >= 0 && py <= MINIMAP_SIZE_PX) {
              minimapGraphics.circle(px, py, MINIMAP_UNIT_DOT_RADIUS).fill({ color });
            }
          }
        }

        // Ground capture for clicks (very large transparent rect)
        const ground = new Graphics();
        (ground as any).label = 'ground';
        ground.rect(-4000, -4000, 8000, 8000).fill(0x000000, 0);
        ground.eventMode = 'static';
        worldContainer.addChild(ground);

        // M1: Container for waypoint indicator graphics (drawn each frame)
        const waypointContainer = new Container();
        (waypointContainer as any).label = 'waypoints';
        worldContainer.addChild(waypointContainer);

        // Keyboard: M to set Move, Escape to clear; WASD/arrows to pan (M5.1)
        const onKeyDown = (ev: KeyboardEvent) => {
          const sel = latestSelectorsRef.current;
          if (ev.key === 'm' || ev.key === 'M') {
            if (sel.hasSelection) setSelectedAction('Move');
          } else if (ev.key === 'Escape') {
            setSelectedAction(null);
          } else if (PAN_KEYS.has(ev.code)) {
            if (!isFocusInEditable()) {
              panKeysRef.current.add(ev.code);
              ev.preventDefault();
            }
          }
        };
        const onKeyUp = (ev: KeyboardEvent) => {
          if (PAN_KEYS.has(ev.code)) {
            panKeysRef.current.delete(ev.code);
          }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // M4: Texture cache by entity_type_id. Path: /assets/${entity_type_id}/idle.png
        // Preload all entity types from content pack (build-time list from entities.yaml)
        const DEFAULT_ENTITY_TYPE = 'corvette';
        const typesToPreload = [
          ...new Set([DEFAULT_ENTITY_TYPE, ...PRELOAD_ENTITY_TYPES]),
        ];
        const textureCache = new Map<string, Texture>();
        await Promise.all(
          typesToPreload.map(async (id) => {
            console.log({ preloadTextureId: id })
            const tex = await Assets.load(`/assets/${id}/idle.png`);
            textureCache.set(id, tex);
          })
        );

        function getTextureForEntityType(entityTypeId: string | undefined): Texture {
          const typeId = entityTypeId?.trim() || DEFAULT_ENTITY_TYPE;
          return textureCache.get(typeId) ?? textureCache.get(DEFAULT_ENTITY_TYPE)!;
        }

        // Track which entities we've attached sprites to, to avoid re-attaching due to query/index lag
        const attached = new WeakSet<any>();

        // Render system: project ECS -> Pixi once per frame (movement handled in world.tick)
        const render = () => {
          // 1) Attach containers (and inner sprite) to entities that have position but no container yet (proto only)
          for (const e of game.world.with("pos").without("pixiContainer")) {
            if (attached.has(e)) continue;
            const entityContainer = new Container();
            entityContainer.eventMode = 'static';
            const typeId = (e as { entity_type_id?: string }).entity_type_id;
            const texture = getTextureForEntityType(typeId);
            const sprite = Sprite.from(texture);
            sprite.anchor.set(0.5);
            entityContainer.addChild(sprite);
            worldContainer.addChild(entityContainer);
            // Attach container as component so future frames render it
            (e as any).pixiContainer = entityContainer;
            entityContainer
              .on("mouseover", () => {
                (e as any).hover = true;
                setHovered(e);
              })
              .on("mouseout", () => {
                (e as any).hover = false;
                setHovered(null);
              })
              .on('pointerdown', (ev: any) => {
                // M6: Only select entities owned by the current player
                const myId = myPlayerIdRef.current;
                const ownerId = (e as any).owner_player_id;
                const isOwned = myId != null && ownerId !== undefined && ownerId === myId;
                if (!isOwned) return;
                const id = (e as any).id;
                if (id !== undefined && id !== null) {
                  setSelection([String(id)]);
                }
                ev.stopPropagation(); // don't trigger ground handler
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

            // 3) Project ECS hover state + M6 ownership tint to Pixi (proto only)
            // First child is primary sprite
            const primary = container.children.find((c) => c instanceof Sprite) as Sprite | undefined;
            const myId = myPlayerIdRef.current;
            const ownerId = (e as any).owner_player_id;
            const isOwned = myId != null && ownerId !== undefined && ownerId === myId;
            const baseTint = isOwned ? CLEAN_COLOR : NON_OWNED_TINT;
            if ((e as any).hover) {
              if (primary) (primary as any).tint = isOwned ? SELECTED_COLOR : NON_OWNED_TINT;
              // ensure a hover indicator exists as a child after sprite (only for owned so we don't highlight enemy)
              let hoverIndicator = container.children.find((c) => c.label === 'hoverIndicator') as Graphics | undefined;
              if (isOwned && !hoverIndicator) {
                hoverIndicator = createHoverIndicator();
                container.addChild(hoverIndicator);
              }
              setHovered(e);
            } else {
              if (primary) (primary as any).tint = baseTint;
              // remove hover indicator if present
              const existing = container.children.find((c) => c.label === 'hoverIndicator');
              if (existing) existing.parent?.removeChild(existing);
            }
          }

          // 4) M1: Render waypoint indicators for entities with queued intents
          waypointContainer.removeChildren();
          for (const entityId of intentQueue.getActiveEntityIds()) {
            const waypoints = intentQueue.getWaypoints(entityId);
            let prevX: number | undefined;
            let prevY: number | undefined;

            // Try to find entity current position as first line anchor
            for (const e of game.world.with("pos", "id")) {
              if (Number((e as any).id) === entityId) {
                prevX = e.pos.x;
                prevY = e.pos.y;
                break;
              }
            }

            for (let i = 0; i < waypoints.length; i++) {
              const wp = waypoints[i]!;
              const g = new Graphics();

              // Draw connecting line from previous point
              if (prevX !== undefined && prevY !== undefined) {
                g.moveTo(prevX, prevY);
                g.lineTo(wp.x, wp.y);
                g.stroke({ width: 1, color: wp.active ? 0x44ff44 : 0x888888, alpha: 0.5 });
              }

              // Draw waypoint marker (diamond for active, circle for queued)
              if (wp.active) {
                g.moveTo(wp.x, wp.y - 8);
                g.lineTo(wp.x + 8, wp.y);
                g.lineTo(wp.x, wp.y + 8);
                g.lineTo(wp.x - 8, wp.y);
                g.closePath();
                g.stroke({ width: 2, color: 0x44ff44 });
              } else {
                g.circle(wp.x, wp.y, 6);
                g.stroke({ width: 1.5, color: 0x888888 });
                // Queue index label (1-based, skipping active)
                // Simple numeric indicator not easily done with Graphics alone;
                // the IntentQueuePanel shows the numbered list instead.
              }

              waypointContainer.addChild(g);
              prevX = wp.x;
              prevY = wp.y;
            }
          }
        };

        // Ground click — M1: delegates to IntentQueueManager with modifier keys
        ground.on('pointerdown', async (ev: any) => {
          try {
            const sel = latestSelectorsRef.current;
            // If not in Move mode, treat ground click as deselect
            if (sel.selectedAction !== 'Move') {
              if (sel.hasSelection) setSelection([]);
              return;
            }
            if (!sel.hasSelection) return;
            const first = sel.firstSelectedId;
            if (!first) return;
            // Compute world position from global
            const global = ev.global;
            const local = worldContainer.toLocal(global);

            const entityIdNum = Number(first);
            if (!Number.isFinite(entityIdNum)) return;

            // Read modifier keys from the original DOM event
            const origEvent = ev.nativeEvent ?? ev.originalEvent ?? ev;
            const shift = !!origEvent?.shiftKey;
            const ctrl = !!origEvent?.ctrlKey || !!origEvent?.metaKey;

            // M1: Delegate to queue manager (handles policy, queueing, and sending)
            intentQueue.handleMoveCommand(
              entityIdNum,
              { x: Number(local.x), y: Number(local.y) },
              { shift, ctrl },
            );

            // Only clear action mode on plain click (REPLACE_ACTIVE).
            // Shift/Ctrl clicks keep Move mode active for chaining waypoints.
            if (!shift && !ctrl) {
              setSelectedAction(null);
            }
          } catch (e) {
            // best-effort; do not throw in render loop
            console.error('move intent failed', e);
          }
        });

        app.ticker.add((ticker) => {
            // Wait for first snapshot to be applied before rendering/ticking
            if (!game.ready) return;
            // M5.1: Apply camera pan from WASD/arrows (delta-time so speed is frame-rate independent)
            const keys = panKeysRef.current;
            if (keys.size > 0) {
              let dx = 0;
              let dy = 0;
              if (keys.has("KeyA") || keys.has("ArrowLeft")) dx += 1;
              if (keys.has("KeyD") || keys.has("ArrowRight")) dx -= 1;
              if (keys.has("KeyW") || keys.has("ArrowUp")) dy += 1;
              if (keys.has("KeyS") || keys.has("ArrowDown")) dy -= 1;
              if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                const norm = len > 0 ? 1 / len : 1;
                const dt = ticker.deltaMS / 1000;
                worldContainer.position.x += (dx * norm * PAN_SPEED * dt);
                worldContainer.position.y += (dy * norm * PAN_SPEED * dt);
              }
            }
            // M5.2: Update Voronoi border overlay when throttled (interval or camera moved)
            const now = performance.now();
            const camX = worldContainer.position.x;
            const camY = worldContainer.position.y;
            if (
              now - lastVoronoiUpdate > VORONOI_UPDATE_INTERVAL_MS ||
              Math.abs(camX - lastCamX) > VORONOI_CAMERA_MOVE_THRESHOLD ||
              Math.abs(camY - lastCamY) > VORONOI_CAMERA_MOVE_THRESHOLD
            ) {
              updateVoronoiBorders();
              lastVoronoiUpdate = now;
              lastCamX = camX;
              lastCamY = camY;
            }

            // M5.3: Minimap (viewport rect + unit dots)
            updateMinimap();

            // Advance ECS systems (including movement)
            game.tick(performance.now());
            render();
        });

        return () => {
          app.destroy(true, { children: true, texture: false });
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
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
      {ready && <CoordsOverlay />}
      {/* Overlay loading indicator while world is not ready */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <LoadingAnimation />
        </div>
      )}
    </div>
  );
}
