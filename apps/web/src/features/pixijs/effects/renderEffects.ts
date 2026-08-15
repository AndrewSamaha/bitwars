"use client";

import { Container, Graphics } from "pixi.js";
import { contentManager } from "@/features/content/contentManager";
import { game, type Entity } from "@/features/gamestate/world";
import {
  drawParticleFlowEffect,
  resolveParticleFlowEffects,
  type ParticleFlowEffect,
} from "./particle_flow";
import {
  drawRadiationShedEffect,
  RADIATION_SHED_DURATION_MS,
  resolveRadiationShedEffects,
  type RadiationShedEffect,
} from "./radiation_shed";
import type { RenderEffectsWorld } from "./types";

export { drawRadiationShedEffect, RADIATION_SHED_DURATION_MS };
export type { RadiationShedEffect, RenderEffectsWorld };

type RenderEffectDescriptor = ParticleFlowEffect | RadiationShedEffect;

const RENDER_EFFECT_LABEL_PREFIX = "renderEffect:";

const liveRenderEffectsWorld: RenderEffectsWorld = {
  entities: () => game.world.with("pos", "id"),
  getEntityType: (entityTypeId) => contentManager.getEntityType(entityTypeId),
};

function resolveRenderEffects(entity: Entity, nowMs: number, world: RenderEffectsWorld): RenderEffectDescriptor[] {
  return [
    ...resolveParticleFlowEffects(entity, world),
    ...resolveRadiationShedEffects(entity, nowMs, world),
  ];
}

function destroyEffect(graphics: Graphics) {
  graphics.parent?.removeChild(graphics);
  graphics.destroy();
}

function drawEffect(graphics: Graphics, container: Container, effect: RenderEffectDescriptor, nowMs: number) {
  switch (effect.kind) {
    case "particle_flow":
      drawParticleFlowEffect(graphics, container, effect, nowMs);
      break;
    case "radiation_shed":
      drawRadiationShedEffect(graphics, container, effect, nowMs);
      break;
  }
}

/** Reconciles all visual-only effects for one live entity. */
export function reconcileEntityRenderEffects(
  container: Container,
  entity: Entity,
  nowMs: number,
  world: RenderEffectsWorld = liveRenderEffectsWorld,
) {
  const effects = resolveRenderEffects(entity, nowMs, world);
  const activeKeys = new Set(effects.map((effect) => effect.key));

  for (const child of container.children) {
    if (!(child instanceof Graphics) || !child.label?.startsWith(RENDER_EFFECT_LABEL_PREFIX)) continue;
    if (!activeKeys.has(child.label.slice(RENDER_EFFECT_LABEL_PREFIX.length))) destroyEffect(child);
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
