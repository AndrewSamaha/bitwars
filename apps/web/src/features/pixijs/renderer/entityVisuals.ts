import { Assets, Container, Sprite, type Filter, type Texture } from "pixi.js";
import { PRELOAD_ENTITY_TYPES } from "@bitwars/content";
import { createStarYellowFilter, setStarYellowFilterTime } from "./shaders/starYellow";

export const GAME_WORLD_SCALE = 0.5;
export const DEFAULT_ENTITY_SCALE = 0.5;
const DEFAULT_ENTITY_TYPE = "corvette";

export type EntityTextureCache = Map<string, Texture>;

export type EntityVisual = {
  container: Container;
  sprite: Sprite;
  lastEntityTypeId: string;
  starYellowFilter?: Filter;
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
  const container = new Container();
  container.scale.set(DEFAULT_ENTITY_SCALE);
  const sprite = Sprite.from(getGameEntityTexture(textureCache, typeId));
  sprite.anchor.set(0.5);
  container.addChild(sprite);
  const visual = { container, sprite, lastEntityTypeId: typeId };
  updateGameEntityVisual(visual, typeId, 0);
  return visual;
}

/** Keep an entity's texture-specific visual treatment in sync with game time. */
export function updateGameEntityVisual(
  visual: EntityVisual,
  entityTypeId: string | undefined,
  elapsedMs: number,
) {
  const typeId = entityTypeId?.trim() || "";
  if (typeId === "star_yellow") {
    const filter = visual.starYellowFilter ?? createStarYellowFilter();
    visual.starYellowFilter = filter;
    visual.sprite.filters = [filter];
    setStarYellowFilterTime(filter, elapsedMs);
  } else if (visual.starYellowFilter) {
    visual.sprite.filters = [];
    visual.starYellowFilter.destroy();
    visual.starYellowFilter = undefined;
  }
}
