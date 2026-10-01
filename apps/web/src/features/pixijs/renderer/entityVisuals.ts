import { Assets, Container, Sprite, Texture } from "pixi.js";
import { PRELOAD_ENTITY_TYPES } from "@bitwars/content";
import { playerColorMaskCanvases } from "@/lib/playerColorMaskCanvas";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_OPACITY, isPlayerColorOpacity, isSecondaryBrightnessThreshold } from "@/lib/playerColorSettings";
import { createStarVisual } from "./entities/starVisual";
import { GAME_WORLD_SCALE } from "./entityScale";

export { GAME_WORLD_SCALE } from "./entityScale";
export const DEFAULT_ENTITY_SCALE = 0.5;
const DEFAULT_ENTITY_TYPE = "corvette";

export type EntityTextureCache = Map<string, Texture> & { primaryOpacityByType: Map<string, number>; secondaryOpacityByType: Map<string, number> };

export type EntityVisual = {
  container: Container;
  sprite: Sprite;
  playerColorSprites?: { primary: Sprite; secondary: Sprite };
  lastEntityTypeId: string;
  update?: (elapsedMs: number) => void;
};

function addPlayerColorSprites(visual: EntityVisual, textureCache: EntityTextureCache, typeId: string) {
  const primaryTexture = textureCache.get(`${typeId}/primary`);
  const secondaryTexture = textureCache.get(`${typeId}/secondary`);
  if (!primaryTexture || !secondaryTexture) return;
  const primary = new Sprite(primaryTexture);
  const secondary = new Sprite(secondaryTexture);
  primary.anchor.set(0.5);
  secondary.anchor.set(0.5);
  primary.eventMode = "none";
  secondary.eventMode = "none";
  primary.alpha = textureCache.primaryOpacityByType.get(typeId) ?? DEFAULT_PRIMARY_OPACITY;
  secondary.alpha = textureCache.secondaryOpacityByType.get(typeId) ?? DEFAULT_SECONDARY_OPACITY;
  visual.container.addChild(secondary, primary);
  visual.playerColorSprites = { primary, secondary };
}

/** The camera/world transform used by the live game and isolated Pixi labs. */
export function createGameWorldContainer() {
  const worldContainer = new Container();
  worldContainer.scale.set(GAME_WORLD_SCALE);
  return worldContainer;
}

/** Load the same idle textures and fallback used by the live stage. */
export async function loadGameEntityTextures(
  entityTypeIds: readonly string[] = PRELOAD_ENTITY_TYPES,
): Promise<EntityTextureCache> {
  const ids = [...new Set([DEFAULT_ENTITY_TYPE, ...entityTypeIds])];
  const fallback = await Assets.load(`/assets/${DEFAULT_ENTITY_TYPE}/idle.png`);
  const entries = await Promise.all(ids.map(async (id) => {
    if (id === DEFAULT_ENTITY_TYPE) return [id, fallback] as const;
    try {
      return [id, await Assets.load(`/assets/${id}/idle.png`)] as const;
    } catch {
      // Content can introduce a server-only entity before bespoke art ships.
      // Keep the match playable by rendering the standard ship texture.
      return [id, fallback] as const;
    }
  }));
  const cache = new Map(entries) as EntityTextureCache;
  cache.primaryOpacityByType = new Map();
  cache.secondaryOpacityByType = new Map();
  await Promise.all(ids.map(async (id) => {
    try {
      const primaryResponse = await fetch(`/assets/${id}/primary.png`, { method: "HEAD" });
      if (!primaryResponse.ok) return;
      const grayUrl = `/assets/${id}/gray.png`;
      const grayResponse = await fetch(grayUrl, { method: "HEAD" });
      const baseUrl = grayResponse.ok ? grayUrl : `/assets/${id}/idle.png`;
      const response = await fetch(`/assets/${id}/player-colors.json`);
      const settings = response.ok ? await response.json().catch(() => null) as { primaryOpacity?: unknown; secondaryOpacity?: unknown; secondaryBrightnessThreshold?: unknown } | null : null;
      const secondaryBrightnessThreshold = isSecondaryBrightnessThreshold(settings?.secondaryBrightnessThreshold) ? settings.secondaryBrightnessThreshold : 0;
      const masks = await playerColorMaskCanvases(baseUrl, `/assets/${id}/primary.png`, secondaryBrightnessThreshold);
      if (grayResponse.ok) cache.set(id, await Assets.load(grayUrl));
      cache.set(`${id}/primary`, Texture.from(masks.primary));
      cache.set(`${id}/secondary`, Texture.from(masks.secondary));
      if (isPlayerColorOpacity(settings?.primaryOpacity)) cache.primaryOpacityByType.set(id, settings.primaryOpacity);
      if (isPlayerColorOpacity(settings?.secondaryOpacity)) cache.secondaryOpacityByType.set(id, settings.secondaryOpacity);
    } catch (error) {
      console.warn(`Unable to load ${id} player color overlay`, error);
    }
  }));
  return cache;
}

export function getGameEntityTexture(
  textureCache: EntityTextureCache,
  entityTypeId: string | undefined,
): Texture {
  const typeId = entityTypeId?.trim() || DEFAULT_ENTITY_TYPE;
  const texture = textureCache.get(typeId) ?? textureCache.get(DEFAULT_ENTITY_TYPE);
  if (!texture) throw new Error(`Missing game texture for ${typeId}`);
  return texture;
}

/** Create the standard entity container/sprite pair used by GameStage. */
export function createGameEntityVisual(
  textureCache: EntityTextureCache,
  entityTypeId: string | undefined,
): EntityVisual {
  const typeId = entityTypeId?.trim() || "";
  const texture = getGameEntityTexture(textureCache, typeId);
  if (typeId === "star_yellow") {
    const starVisual = createStarVisual({ texture });
    starVisual.container.scale.set(DEFAULT_ENTITY_SCALE);
    return { ...starVisual, lastEntityTypeId: typeId };
  }

  const container = new Container();
  container.scale.set(DEFAULT_ENTITY_SCALE);
  const sprite = Sprite.from(texture);
  sprite.anchor.set(0.5);
  container.addChild(sprite);
  const visual: EntityVisual = { container, sprite, lastEntityTypeId: typeId };
  addPlayerColorSprites(visual, textureCache, typeId);
  return visual;
}

/** Keep overlays aligned when an entity changes type through an upgrade. */
export function setGameEntityVisualType(visual: EntityVisual, textureCache: EntityTextureCache, typeId: string) {
  visual.sprite.texture = getGameEntityTexture(textureCache, typeId);
  if (visual.playerColorSprites) {
    visual.playerColorSprites.primary.destroy();
    visual.playerColorSprites.secondary.destroy();
    visual.playerColorSprites = undefined;
  }
  addPlayerColorSprites(visual, textureCache, typeId);
  visual.lastEntityTypeId = typeId;
}

/** Advance an entity visual's optional time-based presentation. */
export function updateGameEntityVisual(visual: EntityVisual, elapsedMs: number) {
  visual.update?.(elapsedMs);
}
