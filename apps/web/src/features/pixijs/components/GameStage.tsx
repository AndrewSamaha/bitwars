"use client";
import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { game, type Entity } from "@/features/gamestate/world";
import LoadingAnimation from "@/components/LoadingAnimation";
import { TooltipOverlay } from "@/features/hud/components/TooltipOverlay";
import { CoordsOverlay } from "@/features/hud/components/CoordsOverlay";
import { FpsOverlay } from "@/features/hud/components/FpsOverlay";
import { useHUD } from "@/features/hud/components/HUDContext";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import { createHoverIndicator, drawBuildArc, drawHealthArc } from "@/features/hud/graphics/hoverIndicator";
import { SELECTED_COLOR, CLEAN_COLOR, BACKGROUND_APP_COLOR } from "@/features/hud/styles/style";
import { intentQueue, type SendIntentParams } from "@/features/intent-queue/intentQueueManager";
import { reconcileEntityRenderEffects, reconcileWorldParticleFlowEffects } from "@/features/pixijs/effects/renderEffects";
import { createDespawnExplosionSystem } from "@/features/pixijs/effects/despawnExplosion";
import { audio, SoundEffect } from "@/features/audio/audioManager";
import { contentManager } from "@/features/content/contentManager";
import { ENTITY_DESPAWN_EVENT } from "@/features/gamestate/events";
import {
  createGameEntityVisual,
  createGameWorldContainer,
  getGameEntityTexture,
  loadGameEntityTextures,
  updateGameEntityVisual,
  type EntityVisual,
} from "@/features/pixijs/renderer/entityVisuals";
import { drawRadiationRanges } from "@/features/pixijs/renderer/radiationRanges";
import { getOwnedSensorSources } from "@/features/pixijs/renderer/visibilityFog";
import { spreadMoveTargets } from "@/features/pixijs/utils/moveTargets";
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
/** Camera scale bounds for mouse-wheel and trackpad zoom. */
const MIN_ZOOM = 0.010;
const MAX_ZOOM = 2;
const ZOOM_SENSITIVITY = 0.0015;

/** M6: Tint for entities not owned by the current player */
const NON_OWNED_TINT = 0x66_66_66;
/** M6: Minimap dot colors by ownership */
const MINIMAP_MY_COLOR = 0x44_aa_ff;
const MINIMAP_HOSTILE_COLOR = 0xef_44_44;
const MINIMAP_NEUTRAL_COLOR = 0x88_88_88;
const MINIMAP_STAR_YELLOW_COLOR = 0xff_dd_22;
const BUILD_PROGRESS_POLL_MS = 500;
const FOG_COLOR = 0x67_6b_73;
const FOG_ALPHA = 0.20;

const PAN_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);
const DEBUG_MOVE_INPUT = process.env.NEXT_PUBLIC_DEBUG_MOVE_INPUT === "1";

function isFocusInEditable(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

export default function GameStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<boolean>(game.ready);
  const [moveDebug, setMoveDebug] = useState<string>("idle");
  const { player } = usePlayer();
  const {
    actions: { setHovered, setApp, setCamera, setSelection, addSelection, removeSelection, setSelectedAction, setTerminalOpen },
    selectors,
    refs: { inputRef },
  } = useHUD();
  // Keep latest selectors in a ref so event handlers see current selection/action
  const latestSelectorsRef = useRef(selectors);
  useEffect(() => { latestSelectorsRef.current = selectors; }, [selectors]);
  // M6: Current player id for ownership gating and visuals (ref so initWorld closure sees latest)
  const myPlayerIdRef = useRef<string | null>(null);
  myPlayerIdRef.current = player?.id ?? null;
  const recenterRequestedRef = useRef<boolean>(true);
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

    // M1/M8: Wire the queue manager's send callback to POST /api/v1/intent
    intentQueue.setSendCallback(async (params: SendIntentParams) => {
      const payload =
        params.kind === "Move"
          ? {
              type: "Move",
              entity_id: params.entityId,
              target: params.target,
              client_cmd_id: params.clientCmdId,
              client_seq: params.clientSeq,
              policy: params.policy,
            }
          : params.kind === "Collect" ? {
              type: "Collect",
              entity_id: params.entityId,
              client_cmd_id: params.clientCmdId,
              client_seq: params.clientSeq,
              policy: params.policy,
            } : {
              type: "Build",
              entity_id: params.entityId,
              blueprint_id: params.blueprintId,
              client_cmd_id: params.clientCmdId,
              client_seq: params.clientSeq,
              policy: params.policy,
            };

      await fetch('/api/v1/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });

    const initWorld = async () => {
        const updateMoveDebug = (message: string, payload?: Record<string, unknown>) => {
          if (!DEBUG_MOVE_INPUT) return;
          const suffix = payload ? ` ${JSON.stringify(payload)}` : "";
          setMoveDebug(`${message}${suffix}`);
        };
        const app = new Application();
        await app.init({
            background: BACKGROUND_APP_COLOR,
            resizeTo: window,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        setApp(app);
        ref.current!.appendChild(app.canvas);

        // Pixi scene graph root for world (M5.1: this is the camera — we pan by updating its position)
        const worldContainer = createGameWorldContainer();
        worldContainer.sortableChildren = true;
        worldContainer.position.set(800, 500);
        app.stage.addChild(worldContainer);
        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        setCamera(worldContainer);

        // World-space radiation ranges stay beneath entities while following
        // the same camera transform as the rest of the game world.
        const radiationRangeGraphics = new Graphics();
        radiationRangeGraphics.label = "radiationRanges";
        radiationRangeGraphics.eventMode = "none";
        radiationRangeGraphics.zIndex = -1_000_000;
        worldContainer.addChild(radiationRangeGraphics);

        // Laser shots are transient presentation of an authoritative server
        // event. They live in world space, so camera pan/zoom affects them in
        // exactly the same way as ships.
        const laserContainer = new Container();
        laserContainer.label = "laserEffects";
        laserContainer.eventMode = "none";
        laserContainer.zIndex = 1_000_000;
        worldContainer.addChild(laserContainer);
        const particleFlowContainer = new Container();
        particleFlowContainer.label = "particleFlowEffects";
        particleFlowContainer.eventMode = "none";
        particleFlowContainer.zIndex = 1_000_001;
        worldContainer.addChild(particleFlowContainer);
        const lasers: Array<{
          graphics: Graphics;
          origin: { x: number; y: number };
          target: { x: number; y: number };
          startedAt: number;
        }> = [];
        const LASER_TRAVEL_MS = 130;
        const LASER_TRAIL_FRACTION = 0.28;
        const onLaserShot = (event: Event) => {
          const detail = (event as CustomEvent<{ origin?: { x: number; y: number }; target?: { x: number; y: number } }>).detail;
          if (!detail?.origin || !detail.target) return;
          const graphics = new Graphics();
          graphics.eventMode = "none";
          laserContainer.addChild(graphics);
          lasers.push({
            graphics,
            origin: detail.origin,
            target: detail.target,
            startedAt: performance.now(),
          });
        };
        window.addEventListener("bitwars:laser-shot", onLaserShot);
        const renderLasers = (nowMs: number) => {
          for (let index = lasers.length - 1; index >= 0; index -= 1) {
            const laser = lasers[index];
            const progress = (nowMs - laser.startedAt) / LASER_TRAVEL_MS;
            if (progress >= 1) {
              laser.graphics.destroy();
              lasers.splice(index, 1);
              continue;
            }
            const tail = Math.max(0, progress - LASER_TRAIL_FRACTION);
            const dx = laser.target.x - laser.origin.x;
            const dy = laser.target.y - laser.origin.y;
            laser.graphics
              .clear()
              .moveTo(laser.origin.x + dx * tail, laser.origin.y + dy * tail)
              .lineTo(laser.origin.x + dx * progress, laser.origin.y + dy * progress)
              .stroke({ color: 0xff_3b_81, width: 10, alpha: 1 - progress * 0.35 });
          }
        };

        const despawnExplosions = createDespawnExplosionSystem(worldContainer);
        audio.registerSoundEffect(SoundEffect.EntityExplosion);
        const onEntityDespawn = (event: Event) => {
          const entity = (event as CustomEvent<Entity>).detail;
          if (!entity) return;
          despawnExplosions.explode(entity);
          audio.playSfx(SoundEffect.EntityExplosion);
        };
        window.addEventListener(ENTITY_DESPAWN_EVENT, onEntityDespawn);

        const renderRadiationRanges = () => {
          radiationRangeGraphics.clear();
          for (const entity of game.world.with("pos", "entity_type_id")) {
            const sources = contentManager.getEntityType(entity.entity_type_id ?? "")?.radiation_sources;
            drawRadiationRanges(radiationRangeGraphics, sources, entity.pos.x, entity.pos.y);
          }
        };

        const requestRecenter = () => {
          recenterRequestedRef.current = true;
        };
        window.addEventListener("bitwars:stream-open", requestRecenter as EventListener);
        window.addEventListener("bitwars:snapshot-applied", requestRecenter as EventListener);

        const centerCameraOnOwnedEntities = (): boolean => {
          const myId = myPlayerIdRef.current;
          if (!myId) return false;
          let sumX = 0;
          let sumY = 0;
          let count = 0;
          for (const e of game.world.with("pos", "id")) {
            const ownerId = (e as any).owner_player_id as string | undefined;
            if (ownerId !== myId) continue;
            const pos = (e as any).pos as { x: number; y: number } | undefined;
            if (!pos) continue;
            sumX += pos.x;
            sumY += pos.y;
            count++;
          }
          if (count === 0) return false;
          const centerX = sumX / count;
          const centerY = sumY / count;
          worldContainer.position.set(
            app.screen.width / 2 - centerX * worldContainer.scale.x,
            app.screen.height / 2 - centerY * worldContainer.scale.y,
          );
          return true;
        };

        // M5.2: Voronoi border overlay in screen space (sample grid → edge test → draw dots)
        const voronoiBorderGraphics = new Graphics();
        (voronoiBorderGraphics as any).label = "voronoiBorders";
        voronoiBorderGraphics.eventMode = "none";
        app.stage.addChild(voronoiBorderGraphics);

        // Screen-space fog keeps the camera transform out of the draw path.
        const fogGraphics = new Graphics();
        fogGraphics.label = "visibilityFog";
        fogGraphics.eventMode = "none";
        app.stage.addChild(fogGraphics);

        let lastVoronoiUpdate = -1000;
        let lastCamX = worldContainer.position.x;
        let lastCamY = worldContainer.position.y;
        let lastCamScale = worldContainer.scale.x;
        const VORONOI_UPDATE_INTERVAL_MS = 100;
        const VORONOI_CAMERA_MOVE_THRESHOLD = 25;
        const VORONOI_ZOOM_REDRAW_THRESHOLD = 0.05;
        const VORONOI_OVERSCAN_PX = VORONOI_CAMERA_MOVE_THRESHOLD + SAMPLE_SPACING;
        const BORDER_DOT_SIZE = 2;

        function updateVoronoiBorders() {
          // This redraw samples in the current screen coordinate system. Reset
          // the inexpensive frame-by-frame camera transform before replacing it.
          voronoiBorderGraphics.position.set(0, 0);
          voronoiBorderGraphics.scale.set(1);
          voronoiBorderGraphics.clear();
          const w = app.screen.width;
          const h = app.screen.height;
          for (let sy = -VORONOI_OVERSCAN_PX; sy <= h + VORONOI_OVERSCAN_PX; sy += SAMPLE_SPACING) {
            for (let sx = -VORONOI_OVERSCAN_PX; sx <= w + VORONOI_OVERSCAN_PX; sx += SAMPLE_SPACING) {
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
          lastCamX = worldContainer.position.x;
          lastCamY = worldContainer.position.y;
          lastCamScale = worldContainer.scale.x;
        }

        function syncVoronoiCameraTransform() {
          // Move and scale the cached graphics with the camera every frame.
          // This is much cheaper than re-sampling the Voronoi grid, while the
          // periodic redraw below keeps the cached result accurate.
          const scaleRatio = worldContainer.scale.x / lastCamScale;
          voronoiBorderGraphics.scale.set(scaleRatio);
          voronoiBorderGraphics.position.set(
            worldContainer.position.x - lastCamX * scaleRatio,
            worldContainer.position.y - lastCamY * scaleRatio,
          );
        }

        // M5.3: Minimap (centered on camera, unit dots, viewport rect) — screen space, top-right.
        // Keep its view wider than the camera's while allowing both to zoom
        // out together. The minimum prevents an overly tight minimap at high
        // camera zoom.
        const MINIMAP_VIEWPORT_MULTIPLIER = 2.5;
        const MINIMAP_MIN_HALF_EXTENT = 2_000;
        const MINIMAP_SIZE_PX = 200;
        const MINIMAP_MARGIN = 10;
        const MINIMAP_UNIT_DOT_RADIUS = 2;
        const minimapGraphics = new Graphics();
        (minimapGraphics as any).label = "minimap";
        minimapGraphics.eventMode = "none";
        const minimapContainer = new Container();
        (minimapContainer as any).label = "minimapContainer";
        minimapContainer.addChild(minimapGraphics);
        const minimapFogGraphics = new Graphics();
        minimapFogGraphics.label = "minimapVisibilityFog";
        minimapFogGraphics.eventMode = "none";
        const minimapFogMask = new Graphics().rect(0, 0, MINIMAP_SIZE_PX, MINIMAP_SIZE_PX).fill(0xffffff);
        minimapFogGraphics.mask = minimapFogMask;
        minimapContainer.addChild(minimapFogGraphics, minimapFogMask);
        const minimapViewportGraphics = new Graphics();
        minimapViewportGraphics.eventMode = "none";
        minimapContainer.addChild(minimapViewportGraphics);
        app.stage.addChild(minimapContainer);

        const selectionBoxGraphics = new Graphics();
        selectionBoxGraphics.label = "selectionBox";
        selectionBoxGraphics.eventMode = "none";
        app.stage.addChild(selectionBoxGraphics);

        function worldToMinimapPx(
          wx: number,
          wy: number,
          centerX: number,
          centerY: number,
          halfExtent: number,
        ): { px: number; py: number } {
          const range = halfExtent * 2;
          const px = ((wx - centerX + halfExtent) / range) * MINIMAP_SIZE_PX;
          const py = ((wy - centerY + halfExtent) / range) * MINIMAP_SIZE_PX;
          return { px, py };
        }

        function minimapHalfExtent() {
          const cameraScale = Math.max(worldContainer.scale.x, Number.EPSILON);
          const viewportLongestSide = Math.max(app.screen.width, app.screen.height) / cameraScale;
          return Math.max(
            MINIMAP_MIN_HALF_EXTENT,
            viewportLongestSide * MINIMAP_VIEWPORT_MULTIPLIER / 2,
          );
        }

        const sensorSources = () => {
          return getOwnedSensorSources(
            game.world.with("pos", "entity_type_id"),
            myPlayerIdRef.current,
            (typeId) => contentManager.getEntityType(typeId)?.sensor?.range,
          );
        };

        const drawFog = (
          graphics: Graphics,
          width: number,
          height: number,
          sources: Array<{ x: number; y: number; range: number }>,
        ) => {
          const padding = Math.max(0, ...sources.map((source) => source.range));
          graphics.clear().rect(-padding, -padding, width + padding * 2, height + padding * 2).fill({ color: FOG_COLOR, alpha: FOG_ALPHA });
          for (const source of sources) graphics.circle(source.x, source.y, source.range).cut();
        };

        function updateVisibilityFog() {
          const sources = sensorSources();
          drawFog(
            fogGraphics,
            app.screen.width,
            app.screen.height,
            sources.map((source) => {
              const screen = worldContainer.toGlobal(source);
              return { x: screen.x, y: screen.y, range: source.range * worldContainer.scale.x };
            }),
          );
        }

        function updateMinimap() {
          const centerWorld = worldContainer.toLocal({
            x: app.screen.width / 2,
            y: app.screen.height / 2,
          });
          minimapContainer.position.set(
            app.screen.width - MINIMAP_SIZE_PX - MINIMAP_MARGIN,
            MINIMAP_MARGIN,
          );
          minimapGraphics.clear();
          minimapViewportGraphics.clear();
          const halfExtent = minimapHalfExtent();
          // Background
          minimapGraphics.rect(0, 0, MINIMAP_SIZE_PX, MINIMAP_SIZE_PX).fill({ color: 0x0a_0c_10, alpha: 0.9 });
          minimapGraphics.rect(0, 0, MINIMAP_SIZE_PX, MINIMAP_SIZE_PX).stroke({ width: 1, color: 0x3a_3e_4a });
          // Viewport rect (visible world AABB)
          const viewportAabb = getViewportWorldAABB(worldContainer, app.screen.width, app.screen.height, 0);
          const vmin = worldToMinimapPx(viewportAabb.minX, viewportAabb.minY, centerWorld.x, centerWorld.y, halfExtent);
          const vmax = worldToMinimapPx(viewportAabb.maxX, viewportAabb.maxY, centerWorld.x, centerWorld.y, halfExtent);
          const vx = Math.max(0, Math.min(vmin.px, MINIMAP_SIZE_PX - 1));
          const vy = Math.max(0, Math.min(vmin.py, MINIMAP_SIZE_PX - 1));
          const vw = Math.max(1, Math.min(vmax.px - vmin.px, MINIMAP_SIZE_PX - vx));
          const vh = Math.max(1, Math.min(vmax.py - vmin.py, MINIMAP_SIZE_PX - vy));
          // Unit dots: own units are blue; all non-owned combat targets are
          // red, while planets and other non-targetable entities stay gray.
          const myId = myPlayerIdRef.current;
          for (const e of game.world.with("pos", "id")) {
            const pos = (e as { pos: { x: number; y: number } }).pos;
            const ownerId = (e as { owner_player_id?: string }).owner_player_id;
            const isOwned = myId != null && ownerId === myId;
            const entityTypeId = e.entity_type_id?.trim() ?? "";
            const isCombatTarget = contentManager.getEntityType(entityTypeId)?.combat_targetable === true;
            const color = entityTypeId === "star_yellow"
              ? MINIMAP_STAR_YELLOW_COLOR
              : isOwned
                ? MINIMAP_MY_COLOR
                : isCombatTarget
                  ? MINIMAP_HOSTILE_COLOR
                  : MINIMAP_NEUTRAL_COLOR;
            const { px, py } = worldToMinimapPx(pos.x, pos.y, centerWorld.x, centerWorld.y, halfExtent);
            if (px >= 0 && px <= MINIMAP_SIZE_PX && py >= 0 && py <= MINIMAP_SIZE_PX) {
              minimapGraphics.circle(px, py, MINIMAP_UNIT_DOT_RADIUS).fill({ color });
            }
          }
          drawFog(
            minimapFogGraphics,
            MINIMAP_SIZE_PX,
            MINIMAP_SIZE_PX,
            sensorSources().map((source) => {
              const { px, py } = worldToMinimapPx(source.x, source.y, centerWorld.x, centerWorld.y, halfExtent);
              return { x: px, y: py, range: source.range * MINIMAP_SIZE_PX / (halfExtent * 2) };
            }),
          );
          minimapViewportGraphics.rect(vx, vy, vw, vh).stroke({ width: 1.5, color: 0x6a_aa_ff, alpha: 0.9 });
        }

        // M1: Container for waypoint indicator graphics (drawn each frame)
        const waypointContainer = new Container();
        (waypointContainer as any).label = 'waypoints';
        worldContainer.addChild(waypointContainer);

        const buildProgressByEntity = new Map<string, number>();
        let lastBuildProgressPollAt = 0;
        let buildProgressRequestInFlight = false;
        const refreshBuildProgress = (nowMs: number) => {
          if (buildProgressRequestInFlight || nowMs - lastBuildProgressPollAt < BUILD_PROGRESS_POLL_MS) return;
          const entityIds = Array.from(game.world.with("id"))
            .filter((entity) => String((entity as any).active_intent_kind).toLowerCase() === "build")
            .map((entity) => String((entity as any).id));
          if (entityIds.length === 0) {
            buildProgressByEntity.clear();
            return;
          }
          lastBuildProgressPollAt = nowMs;
          buildProgressRequestInFlight = true;
          void fetch(`/api/v2/build-state?ids=${encodeURIComponent(entityIds.join(","))}`, { cache: "no-store" })
            .then(async (response) => response.ok ? response.json() : {})
            .then((data: { build_state_by_entity?: Record<string, { progress?: number }> }) => {
              buildProgressByEntity.clear();
              for (const [id, state] of Object.entries(data.build_state_by_entity ?? {})) {
                const progress = Number(state.progress);
                if (Number.isFinite(progress)) buildProgressByEntity.set(id, progress);
              }
            })
            .catch(() => {})
            .finally(() => { buildProgressRequestInFlight = false; });
        };

        // Keyboard: M to set Move, C to issue Collect, Escape to clear; WASD/arrows to pan (M5.1/M8)
        const onKeyDown = (ev: KeyboardEvent) => {
          const sel = latestSelectorsRef.current;
          if ((ev.key === "i" || ev.key === "I") && !isFocusInEditable()) {
            setTerminalOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
            ev.preventDefault();
          } else if (ev.key === 'm' || ev.key === 'M') {
            if (sel.hasSelection) setSelectedAction('Move');
          } else if (ev.key === 'c' || ev.key === 'C') {
            if (sel.hasSelection) {
              for (const id of sel.selectedEntities) {
                const entityIdNum = Number(id);
                if (Number.isFinite(entityIdNum)) {
                  intentQueue.handleCollectCommand(entityIdNum, "REPLACE_ACTIVE");
                }
              }
            }
          } else if (ev.key === 'Escape') {
            setSelectedAction(null);
          } else if (ev.code === "Space" && !isFocusInEditable()) {
            const myId = myPlayerIdRef.current;
            if (!myId) return;
            const ownedIds = Array.from(game.world.with("id"))
              .filter((entity) => (entity as any).owner_player_id === myId)
              .map((entity) => String((entity as any).id));
            if (ownedIds.length === 0) return;
            const currentIndex = ownedIds.indexOf(sel.firstSelectedId ?? "");
            setSelection([ownedIds[(currentIndex + 1) % ownedIds.length]!]);
            ev.preventDefault();
          } else if (ev.code === "KeyZ" && !isFocusInEditable()) {
            const entity = sel.firstSelectedId ? findLiveEntityById(sel.firstSelectedId) : null;
            if (!entity?.pos) return;
            worldContainer.position.set(
              app.screen.width / 2 - entity.pos.x * worldContainer.scale.x,
              app.screen.height / 2 - entity.pos.y * worldContainer.scale.y,
            );
            ev.preventDefault();
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

        // Wheel events cover both mouse wheels and two-finger trackpad scrolling.
        // Keep the world point under the cursor fixed as the camera scale changes.
        const onWheel = (event: WheelEvent) => {
          event.preventDefault();

          const bounds = app.canvas.getBoundingClientRect();
          if (bounds.width === 0 || bounds.height === 0) return;
          const pointer = {
            x: (event.clientX - bounds.left) * (app.screen.width / bounds.width),
            y: (event.clientY - bounds.top) * (app.screen.height / bounds.height),
          };
          const worldPoint = worldContainer.toLocal(pointer);
          const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1);
          const currentZoom = worldContainer.scale.x;
          const nextZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, currentZoom * Math.exp(-delta * ZOOM_SENSITIVITY)),
          );
          if (nextZoom === currentZoom) return;

          worldContainer.scale.set(nextZoom);
          worldContainer.position.set(
            pointer.x - worldPoint.x * nextZoom,
            pointer.y - worldPoint.y * nextZoom,
          );
        };
        app.canvas.addEventListener("wheel", onWheel, { passive: false });

        const textureCache = await loadGameEntityTextures();

        // M8c: Authoritative render index keyed by ECS entity id.
        const renderById = new Map<string, EntityVisual>();

        const normalizeId = (id: number | string | undefined | null): string | null => {
          if (id === undefined || id === null) return null;
          return String(id);
        };

        const findLiveEntityById = (id: string) => {
          for (const e of game.world.with("id")) {
            if (String((e as any).id) === id) return e as any;
          }
          return null;
        };

        const destroyRenderRef = (id: string) => {
          const ref = renderById.get(id);
          if (!ref) return;
          try {
            ref.container.removeAllListeners();
            ref.container.parent?.removeChild(ref.container);
            ref.container.destroy({ children: true });
          } catch {}
          renderById.delete(id);
        };

        // Render system: project ECS -> Pixi once per frame (movement handled in world.tick)
        const render = () => {
          const nowMs = performance.now();
          renderRadiationRanges();
          const liveById = new Map<string, any>();
          for (const e of game.world.with("id", "pos")) {
            const id = normalizeId((e as any).id);
            if (!id) continue;
            liveById.set(id, e as any);
            if (!renderById.has(id)) {
              const typeId = ((e as any).entity_type_id as string | undefined) ?? "";
              const visual = createGameEntityVisual(textureCache, typeId);
              const entityContainer = visual.container;
              entityContainer.eventMode = "static";
              worldContainer.addChild(entityContainer);

              entityContainer
                .on("mouseover", () => {
                  const live = findLiveEntityById(id);
                  if (!live) return;
                  if (contentManager.getEntityType(live.entity_type_id ?? "")?.suppress_hover) return;
                  (live as any).hover = true;
                  (live as any).pixiContainer = entityContainer;
                  setHovered(live);
                })
                .on("mouseout", () => {
                  const live = findLiveEntityById(id);
                  if (live) (live as any).hover = false;
                  setHovered(null);
                })
                .on("pointerdown", (ev: any) => {
                  const sel = latestSelectorsRef.current;
                  // In Move mode, entity clicks should bubble to stage and issue a move command.
                  if (sel.selectedAction === "Move") {
                    return;
                  }
                  const live = findLiveEntityById(id);
                  if (!live) {
                    ev.stopPropagation();
                    return;
                  }
                  // M6: Only select entities owned by the current player
                  const myId = myPlayerIdRef.current;
                  const ownerId = (live as any).owner_player_id;
                  const isOwned = myId != null && ownerId !== undefined && ownerId === myId;
                  if (isOwned) {
                    const originalEvent = ev.nativeEvent ?? ev.originalEvent ?? ev;
                    if (originalEvent?.shiftKey) {
                      if (sel.isSelected(id)) removeSelection([id]);
                      else addSelection([id]);
                    } else {
                      setSelection([id]);
                    }
                  }
                  // In non-move mode, entity clicks should not fall through to stage deselect.
                  ev.stopPropagation();
                });
              renderById.set(id, visual);
            }
          }

          // Reconcile removed entities (prune stale render objects).
          for (const id of Array.from(renderById.keys())) {
            if (!liveById.has(id)) {
              destroyRenderRef(id);
            }
          }

          // Project ECS positions/rotation/state to Pixi.
          for (const [id, e] of liveById.entries()) {
            const ref = renderById.get(id);
            if (!ref) continue;
            const container = ref.container;
            if (!container || (container as any).destroyed) {
              destroyRenderRef(id);
              continue;
            }
            (e as any).pixiContainer = container;
            if ((e as any).scale === undefined) (e as any).scale = 1;

            const typeId = ((e as any).entity_type_id as string | undefined) ?? "";
            const suppressHover = contentManager.getEntityType(typeId)?.suppress_hover === true;
            if (suppressHover && (e as any).hover) {
              (e as any).hover = false;
              setHovered(null);
            }
            if (typeId !== ref.lastEntityTypeId) {
              ref.sprite.texture = getGameEntityTexture(textureCache, typeId);
              ref.lastEntityTypeId = typeId;
            }
            updateGameEntityVisual(ref, nowMs);
            // Position: proto pos (already advanced by world.tick)
            container.position.set(e.pos.x, e.pos.y);
            const scale = (e as any).scale ?? 1;
            const visualScale = contentManager.getEntityType(typeId)?.visual_scale ?? 1;
            container.scale.set((scale * visualScale) / 2);
            container.zIndex = contentManager.getEntityType(typeId)?.z_index ?? 0;

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
            const primary = ref.sprite;
            const myId = myPlayerIdRef.current;
            const ownerId = (e as any).owner_player_id;
            const isOwned = myId != null && ownerId !== undefined && ownerId === myId;
            const isNeutral = ownerId === "neutral";
            const baseTint = isOwned || isNeutral ? CLEAN_COLOR : NON_OWNED_TINT;
            const health = Number((e as Entity).health);
            const maxHealth = contentManager.getEntityType(typeId)?.health;
            const hasHealth = Number.isFinite(health) && typeof maxHealth === "number" && maxHealth > 0;
            const isSelected = latestSelectorsRef.current.isSelected(id);
            const shouldShowHealthArc = hasHealth && ((e as any).hover || isSelected || (isOwned && health < maxHealth));
            const buildProgress = buildProgressByEntity.get(String((e as any).id));
            const isBuilding = String((e as any).active_intent_kind).toLowerCase() === "build";
            reconcileEntityRenderEffects(container, e as Entity, performance.now());
            if (((e as any).hover || isSelected) && !suppressHover) {
              if (primary) (primary as any).tint = isOwned || isNeutral ? SELECTED_COLOR : NON_OWNED_TINT;
              // Ensure a selection indicator exists after the sprite (only for owned units).
              let hoverIndicator = container.children.find((c) => c.label === 'hoverIndicator') as Graphics | undefined;
              if (isOwned && !hoverIndicator) {
                hoverIndicator = createHoverIndicator();
                container.addChild(hoverIndicator);
              }
              if ((e as any).hover) setHovered(e);
            } else {
              if (primary) (primary as any).tint = baseTint;
              // remove hover indicator if present
              const existing = container.children.find((c) => c.label === 'hoverIndicator');
              if (existing) existing.parent?.removeChild(existing);
            }

            let healthArc = container.children.find((c) => c.label === "healthArc") as Graphics | undefined;
            if (shouldShowHealthArc && hasHealth) {
              if (!healthArc) {
                healthArc = new Graphics();
                healthArc.label = "healthArc";
                healthArc.eventMode = "none";
                container.addChild(healthArc);
              }
              drawHealthArc(healthArc, health, maxHealth);
              // The entity container rotates to face its velocity. Counter-rotate
              // this overlay so the arc stays centered above the unit on screen.
              healthArc.rotation = -container.rotation;
            } else if (healthArc) {
              healthArc.parent?.removeChild(healthArc);
              healthArc.destroy();
            }

            let buildArc = container.children.find((c) => c.label === "buildArc") as Graphics | undefined;
            if (isBuilding && Number.isFinite(buildProgress)) {
              if (!buildArc) {
                buildArc = new Graphics();
                buildArc.label = "buildArc";
                buildArc.eventMode = "none";
                container.addChild(buildArc);
              }
              drawBuildArc(buildArc, buildProgress!);
              buildArc.rotation = -container.rotation;
            } else if (buildArc) {
              buildArc.parent?.removeChild(buildArc);
              buildArc.destroy();
            }
          }

          reconcileWorldParticleFlowEffects(particleFlowContainer, liveById.values(), nowMs);

          // 4) M1: Render waypoint indicators for entities with queued intents
          // removeChildren only detaches Pixi display objects; destroying the
          // removed Graphics releases their associated GPU/JS resources before
          // this frame creates replacement waypoint markers.
          for (const child of waypointContainer.removeChildren()) {
            child.destroy();
          }
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

        type SelectionDrag = { startX: number; startY: number; shift: boolean };
        let selectionDrag: SelectionDrag | null = null;
        const SELECTION_DRAG_THRESHOLD_PX = 4;

        const drawSelectionBox = (startX: number, startY: number, endX: number, endY: number) => {
          const x = Math.min(startX, endX);
          const y = Math.min(startY, endY);
          const width = Math.abs(endX - startX);
          const height = Math.abs(endY - startY);
          selectionBoxGraphics.clear();
          selectionBoxGraphics.rect(x, y, width, height).fill({ color: 0x44_aa_ff, alpha: 0.12 });
          selectionBoxGraphics.rect(x, y, width, height).stroke({ width: 1, color: 0x88_cc_ff, alpha: 0.9 });
        };

        // Stage click — delegates Move commands or starts a ground-selection drag.
        app.stage.on('pointerdown', (ev: any) => {
          try {
            const global = ev.global;
            // Keep minimap as informational-only; clicks there should not issue move intents.
            const minimapBounds = minimapContainer.getBounds();
            if (
              global.x >= minimapBounds.minX &&
              global.x <= minimapBounds.maxX &&
              global.y >= minimapBounds.minY &&
              global.y <= minimapBounds.maxY
            ) {
              if (DEBUG_MOVE_INPUT) {
                console.debug("[MoveInput] ignored: minimap click", { x: global.x, y: global.y });
              }
              updateMoveDebug("ignored:minimap", { x: global.x, y: global.y });
              return;
            }

            const sel = latestSelectorsRef.current;
            const origEvent = ev.nativeEvent ?? ev.originalEvent ?? ev;
            // Outside Move mode, defer selection changes until pointerup so a
            // click can become a box drag without first clearing the selection.
            if (sel.selectedAction !== 'Move') {
              selectionDrag = { startX: global.x, startY: global.y, shift: !!origEvent?.shiftKey };
              return;
            }
            if (!sel.hasSelection) {
              if (DEBUG_MOVE_INPUT) {
                console.debug("[MoveInput] ignored: no selection");
              }
              updateMoveDebug("ignored:no_selection");
              return;
            }
            // Compute world position from global
            const local = worldContainer.toLocal(global);

            // Read modifier keys from the original DOM event
            const shift = !!origEvent?.shiftKey;
            const ctrl = !!origEvent?.ctrlKey || !!origEvent?.metaKey;

            const target = { x: Number(local.x), y: Number(local.y) };
            const targets = spreadMoveTargets(target, sel.selectedEntities.map((id) => {
              const entityTypeId = findLiveEntityById(id)?.entity_type_id ?? "";
              return contentManager.getEntityType(entityTypeId)?.hull_radius ?? 0;
            }));

            // Issue nearby, non-overlapping destinations to every selected unit.
            for (const [index, id] of sel.selectedEntities.entries()) {
              const entityIdNum = Number(id);
              if (!Number.isFinite(entityIdNum)) continue;
              intentQueue.handleMoveCommand(
                entityIdNum,
                targets[index]!,
                { shift, ctrl },
              );
            }
            if (DEBUG_MOVE_INPUT) {
              console.debug("[MoveInput] dispatched", {
                entityIds: sel.selectedEntities,
                x: Number(local.x),
                y: Number(local.y),
                shift,
                ctrl,
              });
            }
            updateMoveDebug("dispatched", {
              entityIds: sel.selectedEntities,
              x: Number(local.x),
              y: Number(local.y),
              shift,
              ctrl,
            });

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

        app.stage.on("pointermove", (ev: any) => {
          if (!selectionDrag) return;
          drawSelectionBox(selectionDrag.startX, selectionDrag.startY, ev.global.x, ev.global.y);
        });

        app.stage.on("pointerup", (ev: any) => {
          const drag = selectionDrag;
          if (!drag) return;
          selectionDrag = null;
          selectionBoxGraphics.clear();

          const endX = ev.global.x;
          const endY = ev.global.y;
          const width = Math.abs(endX - drag.startX);
          const height = Math.abs(endY - drag.startY);
          if (width < SELECTION_DRAG_THRESHOLD_PX && height < SELECTION_DRAG_THRESHOLD_PX) {
            if (!drag.shift) setSelection([]);
            return;
          }

          const minX = Math.min(drag.startX, endX);
          const maxX = Math.max(drag.startX, endX);
          const minY = Math.min(drag.startY, endY);
          const maxY = Math.max(drag.startY, endY);
          const selectedIds: string[] = [];
          for (const [id, visual] of renderById) {
            const live = findLiveEntityById(id);
            if (!live || (live as any).owner_player_id !== myPlayerIdRef.current) continue;
            const bounds = visual.container.getBounds();
            if (bounds.maxX >= minX && bounds.minX <= maxX && bounds.maxY >= minY && bounds.minY <= maxY) {
              selectedIds.push(id);
            }
          }
          if (drag.shift) addSelection(selectedIds);
          else setSelection(selectedIds);
        });

        app.ticker.add((ticker) => {
            // Wait for first snapshot to be applied before rendering/ticking
            if (!game.ready) return;
            if (recenterRequestedRef.current) {
              const centered = centerCameraOnOwnedEntities();
              if (centered) recenterRequestedRef.current = false;
            }
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
            // M5.2: Transform the cached border every frame, then redraw only
            // when its sampling basis is old enough or has drifted materially.
            const now = performance.now();
            refreshBuildProgress(now);
            const camX = worldContainer.position.x;
            const camY = worldContainer.position.y;
            const camScale = worldContainer.scale.x;
            syncVoronoiCameraTransform();
            if (
              now - lastVoronoiUpdate > VORONOI_UPDATE_INTERVAL_MS ||
              Math.abs(camX - lastCamX) > VORONOI_CAMERA_MOVE_THRESHOLD ||
              Math.abs(camY - lastCamY) > VORONOI_CAMERA_MOVE_THRESHOLD ||
              Math.abs(camScale / lastCamScale - 1) > VORONOI_ZOOM_REDRAW_THRESHOLD
            ) {
              updateVoronoiBorders();
              lastVoronoiUpdate = now;
            }

            // M5.3: Minimap (viewport rect + unit dots)
            updateMinimap();
            updateVisibilityFog();

            // Advance ECS systems (including movement)
            game.tick(performance.now());
            renderLasers(performance.now());
            despawnExplosions.update(performance.now());
            render();

        });

        let destroyed = false;
        return () => {
          if (destroyed) return;
          destroyed = true;
          for (const id of Array.from(renderById.keys())) {
            destroyRenderRef(id);
          }
          window.removeEventListener("bitwars:stream-open", requestRecenter as EventListener);
          window.removeEventListener("bitwars:snapshot-applied", requestRecenter as EventListener);
          window.removeEventListener("bitwars:laser-shot", onLaserShot);
          window.removeEventListener(ENTITY_DESPAWN_EVENT, onEntityDespawn);
          audio.unregisterSfx(SoundEffect.EntityExplosion);
          despawnExplosions.destroy();
          if ((app as unknown as { renderer: unknown | null }).renderer) {
            app.destroy({ removeView: true }, { children: true, texture: false });
          }
          setApp(null);
          setCamera(null);
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
          app.canvas.removeEventListener("wheel", onWheel);
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
      {ready && DEBUG_MOVE_INPUT && (
        <div className="pointer-events-none absolute right-4 top-4 z-50 rounded bg-black/75 px-2 py-1 font-mono text-[11px] text-green-300">
          move-input: {moveDebug}
        </div>
      )}
      {ready && (
        <div className="pointer-events-none absolute bottom-0 left-4 z-50 flex items-end gap-2">
          <CoordsOverlay />
          <FpsOverlay />
        </div>
      )}
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
