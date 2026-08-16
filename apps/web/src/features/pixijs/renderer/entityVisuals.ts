import { Assets, Container, Sprite, type Texture } from "pixi.js";
import { PRELOAD_ENTITY_TYPES } from "@bitwars/content";
import { createStarVisual } from "./entities/starVisual";

export const GAME_WORLD_SCALE = 0.5;
export const DEFAULT_ENTITY_SCALE = 0.5;
const DEFAULT_ENTITY_TYPE = "corvette";

export type EntityTextureCache = Map<string, Texture>;

export type EntityVisual = {
  container: Container;
  sprite: Sprite;
  lastEntityTypeId: string;
  update?: (elapsedMs: number) => void;
};

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
  const entries = await Promise.all(ids.map(async (id) => [
    id,
    await Assets.load(`/assets/${id}/idle.png`),
  ] as const));
  return new Map(entries);
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
  return { container, sprite, lastEntityTypeId: typeId };
}

/** Advance an entity visual's optional time-based presentation. */
export function updateGameEntityVisual(visual: EntityVisual, elapsedMs: number) {
  visual.update?.(elapsedMs);
}
