import { Assets, Container, Sprite, Texture } from "pixi.js";
import { PRELOAD_ENTITY_TYPES } from "@bitwars/content";
import { createStarVisual } from "./entities/starVisual";
import { GAME_WORLD_SCALE } from "./entityScale";

export { GAME_WORLD_SCALE } from "./entityScale";
export const DEFAULT_ENTITY_SCALE = 0.5;
const DEFAULT_ENTITY_TYPE = "corvette";
const PLAYER_MASK_ENTITY_TYPES = ["battleship"] as const;

export type EntityTextureCache = Map<string, Texture>;

export type EntityVisual = {
  container: Container;
  sprite: Sprite;
  playerColorSprites?: { primary: Sprite; secondary: Sprite };
  lastEntityTypeId: string;
  update?: (elapsedMs: number) => void;
};

/** A mask's alpha selects pixels; its painted RGB must not affect the player color. */
async function loadPlayerMaskTexture(url: string): Promise<Texture> {
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error(`Unable to read player mask ${url}`);
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    pixels.data[index] = 255;
    pixels.data[index + 1] = 255;
    pixels.data[index + 2] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return Texture.from(canvas);
}

function addPlayerColorSprites(visual: EntityVisual, textureCache: EntityTextureCache, typeId: string) {
  if (!PLAYER_MASK_ENTITY_TYPES.some((id) => id === typeId)) return;
  const primaryTexture = textureCache.get(`${typeId}/primary`);
  const secondaryTexture = textureCache.get(`${typeId}/secondary`);
  if (!primaryTexture || !secondaryTexture) return;
  const primary = new Sprite(primaryTexture);
  const secondary = new Sprite(secondaryTexture);
  primary.anchor.set(0.5);
  secondary.anchor.set(0.5);
  primary.eventMode = "none";
  secondary.eventMode = "none";
  visual.container.addChild(primary, secondary);
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
  const cache: EntityTextureCache = new Map(entries);
  await Promise.all(PLAYER_MASK_ENTITY_TYPES.flatMap((id) => (["primary", "secondary"] as const).map(async (part) => {
    try {
      cache.set(`${id}/${part}`, await loadPlayerMaskTexture(`/assets/${id}/${part}.png`));
    } catch (error) {
      console.warn(`Unable to load ${id} ${part} player mask`, error);
    }
  })));
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
