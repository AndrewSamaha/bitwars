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
  showTargetHalo?: boolean;
};

export type RadiationShedEffect = {
  key: string;
  kind: "radiation_shed";
  startedAtMs: number;
  sourceWorldPos: Vec2;
};

type RenderEffectDescriptor = ParticleFlowEffect | RadiationShedEffect;

const SOLAR_COLLECTOR_TYPE = "collector_solar";
const SOLAR_COLLECTION_COLOR = 0xf4_d3_5e;
const SOLAR_COLLECTION_GLOW_COLOR = 0xff_f2_b2;
const SOLAR_COLLECTION_CORE_COLOR = 0xff_fb_db;
const SOLAR_COLLECTION_SIZE_MULTIPLIER = 3;
const MINERAL_COLLECTOR_TYPE = "worker";
const MINERAL_COLLECTION_COLOR = 0x6f_c8_ff;
const MINERAL_COLLECTION_GLOW_COLOR = 0xb9_e7_ff;
const MINERAL_COLLECTION_CORE_COLOR = 0xe7_f7_ff;
const MINERAL_COLLECTION_SIZE_MULTIPLIER = 6.4;
export const RADIATION_SHED_DURATION_MS = 1_150;
const DAMAGE_BURST_COLOR = 0xff_63_36;
const DAMAGE_BURST_GLOW_COLOR = 0xff_c4_51;
const FALLBACK_ENERGY_SOURCE_TYPES = new Set(["theta", "star_yellow"]);
const FALLBACK_MINERAL_SOURCE_TYPES = new Set(["minerals"]);
const RENDER_EFFECT_LABEL_PREFIX = "renderEffect:";

function isResourceSourceEntityType(
  entityTypeId: string | undefined,
  resourceType: string,
): boolean {
  const id = entityTypeId?.trim() ?? "";
  if (!id) return false;

  const content = contentManager.getContent();
  const def = (content?.entity_types?.[id] ?? null) as
    | { resource_node?: { resource_type?: string } }
    | null;
  if (def?.resource_node?.resource_type === resourceType) return true;

  if (resourceType === "energy") return FALLBACK_ENERGY_SOURCE_TYPES.has(id);
  if (resourceType === "minerals") return FALLBACK_MINERAL_SOURCE_TYPES.has(id);
  return false;
}

function findNearestResourceSource(
  resourceType: string,
  targetX: number,
  targetY: number,
): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const e of game.world.with("pos", "id")) {
    const typeId = (e as Entity).entity_type_id;
    if (!isResourceSourceEntityType(typeId, resourceType)) continue;
    const pos = (e as Entity).pos;
    if (!pos) continue;
    const dx = pos.x - targetX;
    const dy = pos.y - targetY;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = { x: pos.x, y: pos.y };
    }
  }

  return nearest;
}

/** Find the closest configured radiation emitter whose outer range contains the ship. */
function findNearestRadiationSource(targetX: number, targetY: number): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const e of game.world.with("pos", "id")) {
    const typeId = (e as Entity).entity_type_id?.trim() ?? "";
    const sources = contentManager.getEntityType(typeId)?.radiation_sources ?? [];
    const pos = (e as Entity).pos;
    if (!pos || sources.length === 0) continue;

    const dx = pos.x - targetX;
    const dy = pos.y - targetY;
    const distSq = dx * dx + dy * dy;
    const reachesTarget = sources.some((source) => {
      const maxDistance = source.max_effective_distance ?? 0;
      return maxDistance > 0 && distSq <= maxDistance * maxDistance;
    });
    if (reachesTarget && distSq < nearestDistSq) {
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

  const source = findNearestResourceSource("energy", collectorPos.x, collectorPos.y);
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
    showTargetHalo: true,
  }];
}

function resolveMineralCollectorEffect(entity: Entity): RenderEffectDescriptor[] {
  const entityTypeId = entity.entity_type_id?.trim() ?? "";
  const collectorActivity = entity.collector_state?.activity ?? "";
  const collectorPos = entity.pos;
  const resourceType = entity.collector_state?.resource_type ?? "";
  if (
    entityTypeId !== MINERAL_COLLECTOR_TYPE ||
    collectorActivity !== "gathering" ||
    resourceType !== "minerals" ||
    !collectorPos
  ) {
    return [];
  }

  const source = findNearestResourceSource("minerals", collectorPos.x, collectorPos.y);
  if (!source) return [];

  return [{
    key: "mineral-collection-flow",
    kind: "particle_flow",
    sourceWorldPos: source,
    targetWorldPos: collectorPos,
    color: MINERAL_COLLECTION_COLOR,
    glowColor: MINERAL_COLLECTION_GLOW_COLOR,
    coreColor: MINERAL_COLLECTION_CORE_COLOR,
    sizeMultiplier: MINERAL_COLLECTION_SIZE_MULTIPLIER,
    showTargetHalo: false,
  }];
}

/**
 * A health decrease paired with a nearby configured radiation emitter produces
 * a directional presentation effect. This is visual-only; the server remains
 * responsible for both damage and radiation-range evaluation.
 */
function resolveRadiationShedEffect(entity: Entity, nowMs: number): RenderEffectDescriptor[] {
  const startedAtMs = entity.damage_flash_started_at;
  const pos = entity.pos;
  if (
    startedAtMs === undefined ||
    !pos ||
    nowMs - startedAtMs < 0 ||
    nowMs - startedAtMs >= RADIATION_SHED_DURATION_MS
  ) {
    return [];
  }
  const source = findNearestRadiationSource(pos.x, pos.y);
  if (!source) return [];

  return [{
    key: "radiation-shed",
    kind: "radiation_shed",
    startedAtMs,
    sourceWorldPos: source,
  }];
}

function resolveRenderEffects(entity: Entity, nowMs: number): RenderEffectDescriptor[] {
  return [
    ...resolveSolarCollectorEffect(entity),
    ...resolveMineralCollectorEffect(entity),
    ...resolveRadiationShedEffect(entity, nowMs),
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
  graphics.clear();

  if (effect.showTargetHalo !== false) {
    const haloRadius = (24 + pulse * 6) * size;
    const innerHaloRadius = (12 + pulse * 3) * size;
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
  }

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

  if (effect.showTargetHalo !== false) {
    graphics.circle(0, 0, (15 + pulse * 4) * size).stroke({
      width: 1.5 * size,
      color: effect.glowColor,
      alpha: 0.4 + pulse * 0.18,
    });
  }
}

export function drawRadiationShedEffect(
  graphics: Graphics,
  container: Container,
  effect: RadiationShedEffect,
  nowMs: number,
) {
  const sourceLocal = container.toLocal(
    new Point(effect.sourceWorldPos.x, effect.sourceWorldPos.y),
    container.parent ?? undefined,
  );
  const distance = Math.hypot(sourceLocal.x, sourceLocal.y);
  if (distance <= 0) return;
  const towardStarX = sourceLocal.x / distance;
  const towardStarY = sourceLocal.y / distance;
  const awayFromStarX = -towardStarX;
  const awayFromStarY = -towardStarY;
  const perpX = -towardStarY;
  const perpY = towardStarX;
  const elapsed = nowMs - effect.startedAtMs;
  graphics.clear();

  // Each particle starts on the star-facing edge, then drifts away through a
  // broad plume. Staggering their births makes consecutive heat ticks feel
  // like continuous material shedding rather than a single explosion.
  const particleCount = 18;
  for (let i = 0; i < particleCount; i++) {
    const birthDelay = (i / particleCount) * RADIATION_SHED_DURATION_MS * 0.42;
    const particleAge = (elapsed - birthDelay) / (RADIATION_SHED_DURATION_MS * 0.58);
    if (particleAge < 0 || particleAge >= 1) continue;

    const spread = ((i % 7) - 3) * 23 + Math.sin(i * 2.7 + effect.startedAtMs * 0.004) * 13;
    const edgeDistance = 116 + Math.abs(spread) * 0.08;
    const drift = 35 + particleAge * 330;
    const turbulence = Math.sin(particleAge * 9 + i * 1.9) * 22 * particleAge;
    const x = towardStarX * edgeDistance + awayFromStarX * drift + perpX * (spread + turbulence);
    const y = towardStarY * edgeDistance + awayFromStarY * drift + perpY * (spread + turbulence);
    const fade = (1 - particleAge) ** 1.5;
    const radius = (i % 3 === 0 ? 7 : 4.5) * (0.65 + fade * 0.35);
    graphics.circle(x, y, radius).fill({
      color: i % 2 === 0 ? DAMAGE_BURST_COLOR : DAMAGE_BURST_GLOW_COLOR,
      alpha: fade * 0.82,
    });
  }
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
    case "radiation_shed":
      drawRadiationShedEffect(graphics, container, effect, nowMs);
      break;
  }
}

export function reconcileEntityRenderEffects(
  container: Container,
  entity: Entity,
  nowMs: number,
) {
  const effects = resolveRenderEffects(entity, nowMs);
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
