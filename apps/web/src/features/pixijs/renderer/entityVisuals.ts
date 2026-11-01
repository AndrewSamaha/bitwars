import { Assets, Container, Sprite, Texture } from "pixi.js";
import { PRELOAD_ENTITY_TYPES } from "@bitwars/content";
import { playerColorMaskCanvases, playerColorMaskCanvasesFromImages } from "@/lib/playerColorMaskCanvas";
import { ContentSyncError, type ContentData, type EntityContentHashes } from "@/features/content/contentManager";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_OPACITY, isPlayerColorOpacity, isSecondaryBrightnessThreshold } from "@/lib/playerColorSettings";
import { createStarVisual } from "./entities/starVisual";
import { GAME_WORLD_SCALE } from "./entityScale";

export { GAME_WORLD_SCALE } from "./entityScale";
export const DEFAULT_ENTITY_SCALE = 0.5;
const DEFAULT_ENTITY_TYPE = "corvette";

export type EntityTextureCache = Map<string, Texture> & {
  primaryOpacityByType: Map<string, number>;
  secondaryOpacityByType: Map<string, number>;
  bundleKeysByType: Map<string, string>;
  assetBundles: Record<string, string>;
  release: () => void;
};

type Bundle = {
  texture?: Texture;
  primary?: Texture;
  secondary?: Texture;
  invariantColors?: Texture;
  primaryOpacity: number;
  secondaryOpacity: number;
  dispose: () => void;
};
type BundleLease = { promise: Promise<Bundle>; references: number };
type AcquiredBundle = { key: string; promise: Promise<Bundle>; release: () => void };
const bundles = new Map<string, BundleLease>();
const leaseBySource = new WeakMap<Texture["source"], { key: string; lease: BundleLease }>();
const ASSET_FILES: Record<string, true> = {
  "idle.png": true, "gray.png": true, "primary.png": true, "invariants.png": true,
  "invariant-colors.png": true, "player-colors.json": true,
};

async function sha256(bytes: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), byte =>
    byte.toString(16).padStart(2, "0")).join("");
}

function assetError(id: string, hashes: EntityContentHashes, file: string, code: string, message: string, expectedHash = hashes.files[file] ?? hashes.asset_hash ?? undefined) {
  return new ContentSyncError({ stage: "assets", code, message, entity_id: id,
    url: `/assets/${id}/${hashes.asset_hash}/${file}`, expected_hash: expectedHash });
}

async function loadBundle(id: string, hashes: EntityContentHashes): Promise<Bundle> {
  const canonicalFiles = Object.fromEntries(Object.entries(hashes.files).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  const actualHash = await sha256(new TextEncoder().encode(JSON.stringify(canonicalFiles)).buffer);
  if (actualHash !== hashes.asset_hash) throw assetError(id, hashes, "idle.png", "bundle_hash_mismatch", `Bundle manifest hash mismatch for ${id}`, hashes.asset_hash ?? undefined);
  const images = new Map<string, HTMLImageElement>();
  const objectUrls: string[] = [];
  const textures: Texture[] = [];
  let settings: { primaryOpacity?: unknown; secondaryOpacity?: unknown; secondaryBrightnessThreshold?: unknown } | null = null;
  const dispose = () => {
    for (const texture of textures) texture.destroy(true);
    for (const url of objectUrls) URL.revokeObjectURL(url);
  };
  try {
    // Settle all fetch/decode jobs before disposing a failed bundle.
    const loaded = await Promise.allSettled(Object.entries(hashes.files).map(async ([file, expected]) => {
      if (ASSET_FILES[file] !== true || !/^[a-z0-9_-]+$/i.test(id) || !/^[a-f0-9]{64}$/.test(expected)) {
        throw assetError(id, hashes, file, "invalid_bundle_file", `Invalid asset manifest file ${id}/${file}`);
      }
      const url = `/assets/${id}/${hashes.asset_hash}/${file}`;
      try {
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw assetError(id, hashes, file, "asset_fetch_failed", `Asset request failed: HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (await sha256(bytes) !== expected) throw assetError(id, hashes, file, "asset_hash_mismatch", `Asset hash mismatch for ${id}/${file}`);
        if (file === "player-colors.json") {
          settings = JSON.parse(new TextDecoder().decode(bytes));
        } else {
          const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
          objectUrls.push(objectUrl);
          const image = new Image();
          image.src = objectUrl;
          await image.decode();
          images.set(file, image);
        }
      } catch (error) {
        if (error instanceof ContentSyncError) throw error;
        throw assetError(id, hashes, file, "asset_decode_failed", error instanceof Error ? error.message : String(error));
      }
    }));
    const failure = loaded.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failure) throw failure.reason;
    const textureFor = (image: HTMLImageElement | HTMLCanvasElement) => {
      const texture = Texture.from(image);
      textures.push(texture);
      return texture;
    };
    const colors = settings as { primaryOpacity?: unknown; secondaryOpacity?: unknown; secondaryBrightnessThreshold?: unknown } | null;
    const base = images.get("gray.png") ?? images.get("idle.png");
    const bundle: Bundle = {
      texture: base ? textureFor(base) : undefined,
      primaryOpacity: isPlayerColorOpacity(colors?.primaryOpacity) ? colors.primaryOpacity : DEFAULT_PRIMARY_OPACITY,
      secondaryOpacity: isPlayerColorOpacity(colors?.secondaryOpacity) ? colors.secondaryOpacity : DEFAULT_SECONDARY_OPACITY,
      dispose,
    };
    const primary = images.get("primary.png");
    if (primary && base) {
      try {
        const masks = playerColorMaskCanvasesFromImages(base, primary,
          isSecondaryBrightnessThreshold(colors?.secondaryBrightnessThreshold) ? colors.secondaryBrightnessThreshold : 0,
          images.get("invariants.png"));
        bundle.primary = textureFor(masks.primary);
        bundle.secondary = textureFor(masks.secondary);
      } catch (error) {
        throw assetError(id, hashes, "primary.png", "mask_failed", error instanceof Error ? error.message : String(error));
      }
    }
    if (base && images.has("invariant-colors.png")) bundle.invariantColors = textureFor(images.get("invariant-colors.png")!);
    return bundle;
  } catch (error) {
    dispose();
    throw error;
  }
}

function acquireBundle(id: string, hashes: EntityContentHashes): AcquiredBundle {
  const key = `${id}/${hashes.asset_hash}`;
  let lease = bundles.get(key);
  if (!lease) {
    const created: BundleLease = { promise: loadBundle(id, hashes), references: 0 };
    created.promise = created.promise.then(bundle => {
      for (const texture of [bundle.texture, bundle.primary, bundle.secondary, bundle.invariantColors]) {
        if (texture) leaseBySource.set(texture.source, { key, lease: created });
      }
      return bundle;
    });
    lease = created;
    bundles.set(key, lease);
  }
  lease.references += 1;
  const owned = lease;
  return { key, promise: owned.promise, release: () => {
    releaseBundleLease(key, owned);
  } };
}

function releaseBundleLease(key: string, lease: BundleLease): void {
  lease.references -= 1;
  if (lease.references !== 0) return;
  if (bundles.get(key) === lease) bundles.delete(key);
  void lease.promise.then(bundle => {
    for (const texture of [bundle.texture, bundle.primary, bundle.secondary, bundle.invariantColors]) {
      if (texture) leaseBySource.delete(texture.source);
    }
    bundle.dispose();
  }, () => {});
}

/** Fragments share a texture source after the entity sprite has been replaced. */
export function retainGameEntityTexture(texture: Texture): () => void {
  const entry = leaseBySource.get(texture.source);
  if (!entry) return () => {};
  entry.lease.references += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseBundleLease(entry.key, entry.lease);
  };
}

function emptyCache(): EntityTextureCache {
  return Object.assign(new Map<string, Texture>(), {
    primaryOpacityByType: new Map<string, number>(), secondaryOpacityByType: new Map<string, number>(),
    bundleKeysByType: new Map<string, string>(), assetBundles: {} as Record<string, string>, release: () => {},
  });
}

export type EntityVisual = {
  container: Container;
  sprite: Sprite;
  invariantColorSprite?: Sprite;
  playerColorSprites?: { primary: Sprite; secondary: Sprite };
  lastEntityTypeId: string;
  lastAssetKey: string;
  update?: (elapsedMs: number) => void;
};

function addPlayerColorSprites(visual: EntityVisual, textureCache: EntityTextureCache, typeId: string) {
  const invariantColorTexture = textureCache.get(`${typeId}/invariant-colors`);
  if (invariantColorTexture) {
    const invariantColors = new Sprite(invariantColorTexture);
    invariantColors.anchor.set(0.5);
    invariantColors.eventMode = "none";
    visual.container.addChild(invariantColors);
    visual.invariantColorSprite = invariantColors;
  }
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

/** Live caches use immutable manifests; explicit ID arrays are isolated art previews. */
export async function loadGameEntityTextures(
  content: ContentData | readonly string[] = PRELOAD_ENTITY_TYPES,
): Promise<EntityTextureCache> {
  if (Array.isArray(content)) return loadPreviewTextures(content);
  const data = content as ContentData;
  const cache = emptyCache();
  const leases = new Map<string, AcquiredBundle>();
  let released = false;
  cache.release = () => {
    if (released) return;
    released = true;
    for (const lease of leases.values()) lease.release();
  };
  try {
    for (const [id, hashes] of Object.entries(data.entities)) {
      if (!hashes.asset_hash) continue;
      leases.set(id, acquireBundle(id, hashes));
      cache.assetBundles[id] = hashes.asset_hash;
    }
    const loaded = await Promise.allSettled([...leases].map(async ([id, lease]) => [id, await lease.promise] as const));
    const failure = loaded.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failure) throw failure.reason;
    for (const result of loaded) {
      if (result.status !== "fulfilled") continue;
      const [id, bundle] = result.value;
      // Authored mask/settings-only bundles have no sprite to apply them to.
      // Verify their immutable bytes but keep the standard fallback visual.
      if (!bundle.texture) continue;
      cache.set(id, bundle.texture);
      cache.bundleKeysByType.set(id, leases.get(id)!.key);
      if (bundle.primary) cache.set(`${id}/primary`, bundle.primary);
      if (bundle.secondary) cache.set(`${id}/secondary`, bundle.secondary);
      if (bundle.invariantColors) cache.set(`${id}/invariant-colors`, bundle.invariantColors);
      cache.primaryOpacityByType.set(id, bundle.primaryOpacity);
      cache.secondaryOpacityByType.set(id, bundle.secondaryOpacity);
    }
    for (const id of Object.keys(data.entity_types)) {
      if (cache.has(id)) continue;
      const fallback = cache.get(DEFAULT_ENTITY_TYPE);
      if (!fallback) throw new ContentSyncError({ stage: "assets", code: "missing_fallback",
        message: `No authored sprite for ${id} and no corvette fallback`, entity_id: id });
      cache.set(id, fallback);
      cache.bundleKeysByType.set(id, cache.bundleKeysByType.get(DEFAULT_ENTITY_TYPE)!);
    }
    return cache;
  } catch (error) {
    cache.release();
    throw error;
  }
}

async function loadPreviewTextures(entityTypeIds: readonly string[]): Promise<EntityTextureCache> {
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
  const cache = emptyCache();
  for (const [id, texture] of entries) {
    cache.set(id, texture);
    cache.bundleKeysByType.set(id, `preview/${id}`);
  }
  await Promise.all(ids.map(async (id) => {
    try {
      const primaryResponse = await fetch(`/assets/${id}/primary.png`, { method: "HEAD" });
      if (!primaryResponse.ok) return;
      const grayUrl = `/assets/${id}/gray.png`;
      const grayResponse = await fetch(grayUrl, { method: "HEAD" });
      const baseUrl = grayResponse.ok ? grayUrl : `/assets/${id}/idle.png`;
      const invariantsUrl = `/assets/${id}/invariants.png`;
      const invariantsResponse = await fetch(invariantsUrl, { method: "HEAD" });
      const response = await fetch(`/assets/${id}/player-colors.json`);
      const settings = response.ok ? await response.json().catch(() => null) as { primaryOpacity?: unknown; secondaryOpacity?: unknown; secondaryBrightnessThreshold?: unknown } | null : null;
      const secondaryBrightnessThreshold = isSecondaryBrightnessThreshold(settings?.secondaryBrightnessThreshold) ? settings.secondaryBrightnessThreshold : 0;
      const masks = await playerColorMaskCanvases(baseUrl, `/assets/${id}/primary.png`, secondaryBrightnessThreshold, invariantsResponse.ok ? invariantsUrl : null);
      if (grayResponse.ok) cache.set(id, await Assets.load(grayUrl));
      const invariantColorsUrl = `/assets/${id}/invariant-colors.png`;
      try {
        const invariantColorsResponse = await fetch(invariantColorsUrl, { method: "HEAD" });
        if (invariantColorsResponse.ok) cache.set(`${id}/invariant-colors`, await Assets.load(invariantColorsUrl));
      } catch (error) {
        console.warn(`Unable to load ${id} invariant colors`, error);
      }
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

export function gameEntityBundleKey(cache: EntityTextureCache, typeId: string): string {
  return cache.bundleKeysByType.get(typeId) ?? cache.bundleKeysByType.get(DEFAULT_ENTITY_TYPE) ?? "";
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
    const visual: EntityVisual = { ...starVisual, lastEntityTypeId: typeId, lastAssetKey: gameEntityBundleKey(textureCache, typeId) };
    addPlayerColorSprites(visual, textureCache, typeId);
    return visual;
  }

  const container = new Container();
  container.scale.set(DEFAULT_ENTITY_SCALE);
  const sprite = Sprite.from(texture);
  sprite.anchor.set(0.5);
  container.addChild(sprite);
  const visual: EntityVisual = { container, sprite, lastEntityTypeId: typeId, lastAssetKey: gameEntityBundleKey(textureCache, typeId) };
  addPlayerColorSprites(visual, textureCache, typeId);
  return visual;
}

/** Keep overlays aligned when an entity changes type through an upgrade. */
export function setGameEntityVisualType(visual: EntityVisual, textureCache: EntityTextureCache, typeId: string) {
  visual.sprite.texture = getGameEntityTexture(textureCache, typeId);
  if (visual.invariantColorSprite) {
    visual.invariantColorSprite.destroy();
    visual.invariantColorSprite = undefined;
  }
  if (visual.playerColorSprites) {
    visual.playerColorSprites.primary.destroy();
    visual.playerColorSprites.secondary.destroy();
    visual.playerColorSprites = undefined;
  }
  addPlayerColorSprites(visual, textureCache, typeId);
  visual.lastEntityTypeId = typeId;
  visual.lastAssetKey = gameEntityBundleKey(textureCache, typeId);
}

/** Advance an entity visual's optional time-based presentation. */
export function updateGameEntityVisual(visual: EntityVisual, elapsedMs: number) {
  visual.update?.(elapsedMs);
}
