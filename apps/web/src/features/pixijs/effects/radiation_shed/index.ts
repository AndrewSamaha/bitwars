import { type Container, type Graphics, Point } from "pixi.js";
import {
  type Entity,
  RADIATION_DAMAGE_VISUAL_LINGER_MS,
} from "@/features/gamestate/world";
import type { RenderEffectsWorld, Vec2 } from "../types";

export const RADIATION_SHED_DURATION_MS = 1_150;
const DAMAGE_BURST_COLOR = 0xff_63_36;
const DAMAGE_BURST_GLOW_COLOR = 0xff_c4_51;

export type RadiationShedEffect = {
  key: string;
  kind: "radiation_shed";
  startedAtMs: number;
  sourceWorldPos: Vec2;
};

function findNearestRadiationSource(
  world: RenderEffectsWorld,
  targetX: number,
  targetY: number,
): Vec2 | null {
  let nearest: Vec2 | null = null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const entity of world.entities()) {
    const sources =
      world.getEntityType(entity.entity_type_id?.trim() ?? "")
        ?.radiation_sources ?? [];
    const pos = entity.pos;
    if (!pos || sources.length === 0) continue;
    const dx = pos.x - targetX;
    const dy = pos.y - targetY;
    const distSq = dx * dx + dy * dy;
    if (
      sources.some(
        ({ max_effective_distance = 0 }) =>
          max_effective_distance > 0 && distSq <= max_effective_distance ** 2,
      ) &&
      distSq < nearestDistSq
    ) {
      nearestDistSq = distSq;
      nearest = { x: pos.x, y: pos.y };
    }
  }
  return nearest;
}

export function resolveRadiationShedEffects(
  entity: Entity,
  nowMs: number,
  world: RenderEffectsWorld,
): RadiationShedEffect[] {
  const startedAtMs = entity.radiation_shed_started_at;
  const lastDamageAtMs = entity.radiation_damage_last_at;
  const pos = entity.pos;
  if (
    startedAtMs === undefined ||
    lastDamageAtMs === undefined ||
    !pos ||
    nowMs - lastDamageAtMs < 0 ||
    nowMs - lastDamageAtMs >= RADIATION_DAMAGE_VISUAL_LINGER_MS
  )
    return [];
  const source = findNearestRadiationSource(world, pos.x, pos.y);
  return source
    ? [
        {
          key: "radiation-shed",
          kind: "radiation_shed",
          startedAtMs,
          sourceWorldPos: source,
        },
      ]
    : [];
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

  // Each particle starts on the star-facing edge, then repeatedly drifts away
  // through the plume. Health ticks refresh liveness, never this timeline.
  const particleCount = 18;
  const particleLifetimeMs = RADIATION_SHED_DURATION_MS * 0.58;
  for (let i = 0; i < particleCount; i++) {
    const birthDelay = (i / particleCount) * RADIATION_SHED_DURATION_MS * 0.42;
    const ageSinceBirth = elapsed - birthDelay;
    if (ageSinceBirth < 0) continue;
    const particleAge =
      (ageSinceBirth % particleLifetimeMs) / particleLifetimeMs;
    const spread =
      ((i % 7) - 3) * 23 + Math.sin(i * 2.7 + effect.startedAtMs * 0.004) * 13;
    const edgeDistance = 116 + Math.abs(spread) * 0.08; // 116
    const drift = 130 + particleAge * 330; // 35
    const turbulence = Math.sin(particleAge * 9 + i * 1.9) * 22 * particleAge;
    const fade = (1 - particleAge) ** 1.5;
    const radius = (i % 3 === 0 ? 7 : 4.5) * (0.65 + fade * 0.35);
    graphics
      .circle(
        towardStarX * edgeDistance +
          awayFromStarX * drift +
          perpX * (spread + turbulence),
        towardStarY * edgeDistance +
          awayFromStarY * drift +
          perpY * (spread + turbulence),
        radius,
      )
      .fill({
        color: i % 2 === 0 ? DAMAGE_BURST_COLOR : DAMAGE_BURST_GLOW_COLOR,
        alpha: fade * 0.82,
      });
  }
}
