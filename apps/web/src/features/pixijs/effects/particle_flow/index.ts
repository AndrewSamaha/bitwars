import { Container, Graphics, Point } from "pixi.js";
import type { Entity } from "@/features/gamestate/world";
import type { RenderEffectsWorld, Vec2 } from "../types";

export type ParticleFlowEffect = {
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
const FALLBACK_ENERGY_SOURCE_TYPES = new Set(["theta", "star_yellow"]);
const FALLBACK_MINERAL_SOURCE_TYPES = new Set(["minerals"]);

function isResourceSourceEntityType(
  world: RenderEffectsWorld,
  entityTypeId: string | undefined,
  resourceType: string,
): boolean {
  const id = entityTypeId?.trim() ?? "";
  if (!id) return false;

  const def = world.getEntityType(id);
  if (def?.resource_node?.resource_type === resourceType) return true;

  if (resourceType === "energy") return FALLBACK_ENERGY_SOURCE_TYPES.has(id);
  if (resourceType === "minerals") return FALLBACK_MINERAL_SOURCE_TYPES.has(id);
  return false;
}

function findNearestResourceSource(
  world: RenderEffectsWorld,
  resourceType: string,
  targetX: number,
  targetY: number,
): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const entity of world.entities()) {
    if (!isResourceSourceEntityType(world, entity.entity_type_id, resourceType)) continue;
    const pos = entity.pos;
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

export function resolveParticleFlowEffects(
  entity: Entity,
  world: RenderEffectsWorld,
): ParticleFlowEffect[] {
  const entityTypeId = entity.entity_type_id?.trim() ?? "";
  const activity = entity.collector_state?.activity ?? "";
  const pos = entity.pos;
  if (!pos) return [];

  if (entityTypeId === SOLAR_COLLECTOR_TYPE && activity === "proximity_collecting") {
    const source = findNearestResourceSource(world, "energy", pos.x, pos.y);
    return source ? [{
      key: "solar-collection-flow", kind: "particle_flow", sourceWorldPos: source,
      targetWorldPos: pos, color: SOLAR_COLLECTION_COLOR, glowColor: SOLAR_COLLECTION_GLOW_COLOR,
      coreColor: SOLAR_COLLECTION_CORE_COLOR, sizeMultiplier: SOLAR_COLLECTION_SIZE_MULTIPLIER,
      showTargetHalo: true,
    }] : [];
  }

  if (
    entityTypeId === MINERAL_COLLECTOR_TYPE &&
    activity === "gathering" &&
    entity.collector_state?.resource_type === "minerals"
  ) {
    const source = findNearestResourceSource(world, "minerals", pos.x, pos.y);
    return source ? [{
      key: "mineral-collection-flow", kind: "particle_flow", sourceWorldPos: source,
      targetWorldPos: pos, color: MINERAL_COLLECTION_COLOR, glowColor: MINERAL_COLLECTION_GLOW_COLOR,
      coreColor: MINERAL_COLLECTION_CORE_COLOR, sizeMultiplier: MINERAL_COLLECTION_SIZE_MULTIPLIER,
      showTargetHalo: false,
    }] : [];
  }

  return [];
}

export function drawParticleFlowEffect(
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
    graphics.circle(0, 0, haloRadius).stroke({ width: 2 * size, color: effect.color, alpha: 0.3 + pulse * 0.18 });
    graphics.circle(0, 0, innerHaloRadius).stroke({ width: 2 * size, color: effect.glowColor, alpha: 0.55 + pulse * 0.2 });
    graphics.circle(0, 0, (8 + pulse * 2) * size).fill({ color: effect.coreColor, alpha: 0.24 + pulse * 0.12 });
  }

  graphics.moveTo(streamStartX, streamStartY);
  graphics.lineTo(0, 0);
  graphics.stroke({ width: 1.5 * size, color: effect.color, alpha: 0.16 + pulse * 0.08 });

  const particleCount = 9;
  for (let i = 0; i < particleCount; i++) {
    const travel = (t * 0.9 + i / particleCount) % 1;
    const px = streamStartX * (1 - travel);
    const py = streamStartY * (1 - travel);
    const wobble = Math.sin((t * 8) + i * 1.7) * 6 * size;
    const particleRadius = ((i % 3 === 0 ? 2.4 : 1.6) + pulse * 0.5) * size;
    graphics.circle(px + perpX * wobble, py + perpY * wobble, particleRadius).fill({
      color: i % 2 === 0 ? effect.color : effect.glowColor, alpha: 0.28 + travel * 0.55,
    });
  }

  if (effect.showTargetHalo !== false) {
    graphics.circle(0, 0, (15 + pulse * 4) * size).stroke({ width: 1.5 * size, color: effect.glowColor, alpha: 0.4 + pulse * 0.18 });
  }
}
