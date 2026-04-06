"use client";

import { Container, Graphics, Point } from "pixi.js";
import { contentManager } from "@/features/content/contentManager";
import { game, type Entity } from "@/features/gamestate/world";

type Vec2 = { x: number; y: number };

type ParticleFlowEffect = {
  key: string;
  kind: "particle_flow";
  sourceWorldPos: Vec2;
  targetWorldPos: Vec2;
  color: number;
  glowColor: number;
  coreColor: number;
  sizeMultiplier: number;
};

type RenderEffectDescriptor = ParticleFlowEffect;

const SOLAR_COLLECTOR_TYPE = "collector_solar";
const SOLAR_COLLECTION_COLOR = 0xf4_d3_5e;
const SOLAR_COLLECTION_GLOW_COLOR = 0xff_f2_b2;
const SOLAR_COLLECTION_CORE_COLOR = 0xff_fb_db;
const SOLAR_COLLECTION_SIZE_MULTIPLIER = 3;
const FALLBACK_ENERGY_SOURCE_TYPES = new Set(["theta", "star_yellow"]);
const RENDER_EFFECT_LABEL_PREFIX = "renderEffect:";

function isEnergySourceEntityType(entityTypeId: string | undefined): boolean {
  const id = entityTypeId?.trim() ?? "";
  if (!id) return false;

  const content = contentManager.getContent();
  const def = (content?.entity_types?.[id] ?? null) as
    | { resource_node?: { resource_type?: string } }
    | null;
  if (def?.resource_node?.resource_type === "energy") return true;

  return FALLBACK_ENERGY_SOURCE_TYPES.has(id);
}

function findNearestEnergySource(
  collectorX: number,
  collectorY: number,
): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const e of game.world.with("pos", "id")) {
    const typeId = (e as Entity).entity_type_id;
    if (!isEnergySourceEntityType(typeId)) continue;
    const pos = (e as Entity).pos;
    if (!pos) continue;
    const dx = pos.x - collectorX;
    const dy = pos.y - collectorY;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = { x: pos.x, y: pos.y };
    }
  }

  return nearest;
}

function resolveSolarCollectorEffect(entity: Entity): RenderEffectDescriptor[] {
  const entityTypeId = entity.entity_type_id?.trim() ?? "";
  const collectorActivity = entity.collector_state?.activity ?? "";
  const collectorPos = entity.pos;
  if (
    entityTypeId !== SOLAR_COLLECTOR_TYPE ||
    collectorActivity !== "proximity_collecting" ||
    !collectorPos
  ) {
    return [];
  }

  const source = findNearestEnergySource(collectorPos.x, collectorPos.y);
  if (!source) return [];

  return [{
    key: "solar-collection-flow",
    kind: "particle_flow",
    sourceWorldPos: source,
    targetWorldPos: collectorPos,
    color: SOLAR_COLLECTION_COLOR,
    glowColor: SOLAR_COLLECTION_GLOW_COLOR,
    coreColor: SOLAR_COLLECTION_CORE_COLOR,
    sizeMultiplier: SOLAR_COLLECTION_SIZE_MULTIPLIER,
  }];
}

function resolveRenderEffects(entity: Entity): RenderEffectDescriptor[] {
  return [
    ...resolveSolarCollectorEffect(entity),
  ];
}

function destroyEffect(graphics: Graphics) {
  graphics.parent?.removeChild(graphics);
  graphics.destroy();
}

function drawParticleFlowEffect(
  graphics: Graphics,
  container: Container,
  effect: ParticleFlowEffect,
  nowMs: number,
) {
  const sourceLocal = container.toLocal(
    new Point(effect.sourceWorldPos.x, effect.sourceWorldPos.y),
    container.parent ?? undefined,
  );
  const t = nowMs / 1000;
  const pulse = (Math.sin(t * 5.2) + 1) * 0.5;
  const size = effect.sizeMultiplier;
  const dx = sourceLocal.x;
  const dy = sourceLocal.y;
  const distance = Math.hypot(dx, dy);
  const dirX = distance > 0 ? dx / distance : 0;
  const dirY = distance > 0 ? dy / distance : 0;
  const perpX = -dirY;
  const perpY = dirX;
  const sourceInset = Math.min(16 * size, distance * 0.12);
  const streamStartX = dx - dirX * sourceInset;
  const streamStartY = dy - dirY * sourceInset;
  const haloRadius = (24 + pulse * 6) * size;
  const innerHaloRadius = (12 + pulse * 3) * size;

  graphics.clear();

  graphics.circle(0, 0, haloRadius).stroke({
    width: 2 * size,
    color: effect.color,
    alpha: 0.3 + pulse * 0.18,
  });
  graphics.circle(0, 0, innerHaloRadius).stroke({
    width: 2 * size,
    color: effect.glowColor,
    alpha: 0.55 + pulse * 0.2,
  });
  graphics.circle(0, 0, (8 + pulse * 2) * size).fill({
    color: effect.coreColor,
    alpha: 0.24 + pulse * 0.12,
  });

  graphics.moveTo(streamStartX, streamStartY);
  graphics.lineTo(0, 0);
  graphics.stroke({
    width: 1.5 * size,
    color: effect.color,
    alpha: 0.16 + pulse * 0.08,
  });

  const particleCount = 9;
  for (let i = 0; i < particleCount; i++) {
    const travel = (t * 0.9 + i / particleCount) % 1;
    const px = streamStartX * (1 - travel);
    const py = streamStartY * (1 - travel);
    const wobble = Math.sin((t * 8) + i * 1.7) * 6 * size;
    const particleX = px + perpX * wobble;
    const particleY = py + perpY * wobble;
    const particleRadius = ((i % 3 === 0 ? 2.4 : 1.6) + pulse * 0.5) * size;
    const alpha = 0.28 + travel * 0.55;
    graphics.circle(particleX, particleY, particleRadius).fill({
      color: i % 2 === 0 ? effect.color : effect.glowColor,
      alpha,
    });
  }

  graphics.circle(0, 0, (15 + pulse * 4) * size).stroke({
    width: 1.5 * size,
    color: effect.glowColor,
    alpha: 0.4 + pulse * 0.18,
  });
}

function drawEffect(
  graphics: Graphics,
  container: Container,
  effect: RenderEffectDescriptor,
  nowMs: number,
) {
  switch (effect.kind) {
    case "particle_flow":
      drawParticleFlowEffect(graphics, container, effect, nowMs);
      break;
  }
}

export function reconcileEntityRenderEffects(
  container: Container,
  entity: Entity,
  nowMs: number,
) {
  const effects = resolveRenderEffects(entity);
  const activeKeys = new Set(effects.map((effect) => effect.key));

  for (const child of container.children) {
    if (!(child instanceof Graphics)) continue;
    if (!child.label?.startsWith(RENDER_EFFECT_LABEL_PREFIX)) continue;
    const key = child.label.slice(RENDER_EFFECT_LABEL_PREFIX.length);
    if (!activeKeys.has(key)) destroyEffect(child);
  }

  for (const effect of effects) {
    const label = `${RENDER_EFFECT_LABEL_PREFIX}${effect.key}`;
    const existing = container.children.find((child) => child.label === label) as Graphics | undefined;
    const graphics = existing ?? (() => {
      const next = new Graphics();
      next.label = label;
      next.eventMode = "none";
      container.addChild(next);
      return next;
    })();
    drawEffect(graphics, container, effect, nowMs);
  }
}
