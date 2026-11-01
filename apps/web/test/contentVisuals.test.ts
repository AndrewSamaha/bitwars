import { createHash, webcrypto } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ContentData, EntityContentHashes } from "../src/features/content/contentManager";

vi.mock("@bitwars/content", () => ({ PRELOAD_ENTITY_TYPES: [] }));
vi.mock("../src/features/pixijs/renderer/entities/starVisual", () => ({ createStarVisual: vi.fn() }));
vi.mock("../src/lib/playerColorMaskCanvas", () => ({
  playerColorMaskCanvases: vi.fn(),
  playerColorMaskCanvasesFromImages: vi.fn(() => ({ primary: {}, secondary: {} })),
}));
vi.mock("pixi.js", () => {
  class Texture {
    source = {};
    destroy = vi.fn();
    static from() { return new Texture(); }
  }
  class Container {
    children: Sprite[] = [];
    scale = { set: vi.fn() };
    addChild(...children: Sprite[]) { for (const child of children) { child.parent = this; this.children.push(child); } }
  }
  class Sprite {
    parent?: Container;
    texture: Texture;
    anchor = { set: vi.fn() };
    eventMode = "none";
    alpha = 1;
    constructor(texture: Texture) { this.texture = texture; }
    static from(texture: Texture) { return new Sprite(texture); }
    destroy() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  }
  return { Container, Sprite, Texture, Assets: { load: vi.fn() } };
});

import { createGameEntityVisual, gameEntityBundleKey, loadGameEntityTextures, retainGameEntityTexture, setGameEntityVisualType } from "../src/features/pixijs/renderer/entityVisuals";
import { playerColorMaskCanvasesFromImages } from "../src/lib/playerColorMaskCanvas";

const hash = (bytes: string) => createHash("sha256").update(bytes).digest("hex");
const sourceFiles = new Map<string, string>();
const caches: Array<{ release: () => void }> = [];
function bundle(id: string, files: Record<string, string>): EntityContentHashes {
  const mapping = Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, hash(bytes)]).sort(([a], [b]) => a.localeCompare(b)));
  const assetHash = hash(JSON.stringify(mapping));
  for (const [name, bytes] of Object.entries(files)) sourceFiles.set(`/assets/${id}/${assetHash}/${name}`, bytes);
  return { definition_hash: "d".repeat(64), asset_hash: assetHash, files: mapping };
}
function content(ship: EntityContentHashes, fallback = bundle("corvette", { "idle.png": "fallback" })): ContentData {
  return { content_version: "a".repeat(64), content_revision: "a".repeat(64),
    entity_types: { ship: { fog_memory: "retain_last_known", speed: 1, mass: 1, health: 100, stop_radius: 0 } },
    entities: { ship, corvette: fallback } };
}
async function load(data: ContentData) {
  const cache = await loadGameEntityTextures(data);
  caches.push(cache);
  return cache;
}

beforeEach(() => {
  sourceFiles.clear();
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("Image", class { naturalWidth = 2; naturalHeight = 2; src = ""; async decode() {} });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const bytes = sourceFiles.get(url);
    return { ok: bytes !== undefined, status: bytes === undefined ? 404 : 200,
      arrayBuffer: async () => new TextEncoder().encode(bytes).buffer };
  }));
});
afterEach(async () => {
  for (const cache of caches.splice(0)) cache.release();
  await Promise.resolve();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("does not refetch unchanged bundles on definition-only revisions and supports new artless types", async () => {
  const data = content(bundle("ship", { "idle.png": "ship" }));
  const first = await load(data);
  const requests = vi.mocked(fetch).mock.calls.length;
  const next: ContentData = { ...data, content_revision: "b".repeat(64), content_version: "b".repeat(64),
    entity_types: { ship: { ...data.entity_types.ship, visual: { scale: 3 } },
      newly_added: { ...data.entity_types.ship } },
    entities: { ...data.entities, newly_added: { definition_hash: "e".repeat(64), asset_hash: null, files: {} } } };
  const second = await load(next);
  expect(fetch).toHaveBeenCalledTimes(requests);
  expect(second.get("ship")).toBe(first.get("ship"));
  expect(second.get("newly_added")).toBe(first.get("corvette"));
  expect(gameEntityBundleKey(second, "newly_added")).toBe(gameEntityBundleKey(first, "corvette"));
  first.release();
  await Promise.resolve();
  expect(second.get("ship")!.destroy).not.toHaveBeenCalled();
});

it("stages an entire changed sprite/mask/settings bundle before swapping the same entity type", async () => {
  const original = content(bundle("ship", { "idle.png": "old" }));
  const first = await load(original);
  const visual = createGameEntityVisual(first, "ship");
  const previousTexture = visual.sprite.texture;
  const changed = content(bundle("ship", { "idle.png": "new", "gray.png": "gray", "primary.png": "mask",
    "invariants.png": "invariants", "invariant-colors.png": "colors",
    "player-colors.json": '{"primaryOpacity":0.3,"secondaryOpacity":0.7,"secondaryBrightnessThreshold":12}' }), original.entities.corvette);
  const requests = vi.mocked(fetch).mock.calls.length;
  const second = await load(changed);
  expect(vi.mocked(fetch).mock.calls.length - requests).toBe(6);
  expect(visual.sprite.texture).toBe(previousTexture);
  expect(visual.playerColorSprites).toBeUndefined();
  expect(playerColorMaskCanvasesFromImages).toHaveBeenCalled();
  setGameEntityVisualType(visual, second, "ship");
  expect(visual.lastEntityTypeId).toBe("ship");
  expect(visual.lastAssetKey).toBe(gameEntityBundleKey(second, "ship"));
  expect(visual.sprite.texture).not.toBe(previousTexture);
  expect(visual.playerColorSprites?.primary.alpha).toBe(0.3);
  expect(visual.playerColorSprites?.secondary.alpha).toBe(0.7);
  expect(visual.invariantColorSprite).toBeDefined();
  first.release();
  await Promise.resolve();
  expect(previousTexture.destroy).toHaveBeenCalledTimes(1);
  expect(visual.sprite.texture.destroy).not.toHaveBeenCalled();
});

it("retains old visual resources on fetch/hash failure and reports the precise immutable file", async () => {
  const original = content(bundle("ship", { "idle.png": "old" }));
  const first = await load(original);
  const visual = createGameEntityVisual(first, "ship");
  const changed = content(bundle("ship", { "idle.png": "new", "primary.png": "mask" }), original.entities.corvette);
  const url = `/assets/ship/${changed.entities.ship.asset_hash}/primary.png`;
  sourceFiles.set(url, "corrupted");
  await expect(loadGameEntityTextures(changed)).rejects.toMatchObject({ detail: {
    stage: "assets", code: "asset_hash_mismatch", entity_id: "ship", url,
    expected_hash: changed.entities.ship.files["primary.png"],
  } });
  expect(visual.sprite.texture).toBe(first.get("ship"));
  expect(visual.sprite.texture.destroy).not.toHaveBeenCalled();
  sourceFiles.delete(url);
  await expect(loadGameEntityTextures(changed)).rejects.toMatchObject({ detail: {
    code: "asset_fetch_failed", entity_id: "ship", url,
  } });
});

it("deduplicates concurrent immutable bundle loads and retains shared explosion sources until released", async () => {
  const data = content(bundle("ship", { "idle.png": "ship" }));
  const [first, second] = await Promise.all([load(data), load(data)]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(first.get("ship")).toBe(second.get("ship"));
  const texture = first.get("ship")!;
  const releaseFragment = retainGameEntityTexture(texture);
  first.release();
  second.release();
  await Promise.resolve();
  expect(texture.destroy).not.toHaveBeenCalled();
  releaseFragment();
  await Promise.resolve();
  expect(texture.destroy).toHaveBeenCalledTimes(1);
});

it("rejects a bundle mapping whose asset hash does not match its canonical files map", async () => {
  const data = content(bundle("ship", { "idle.png": "ship" }));
  data.entities.ship.asset_hash = "f".repeat(64);
  await expect(loadGameEntityTextures(data)).rejects.toMatchObject({ detail: {
    code: "bundle_hash_mismatch", entity_id: "ship", expected_hash: "f".repeat(64),
  } });
});

it("verifies mask-only authored bundles and preserves the fallback instead of failing the renderer", async () => {
  const data = content(bundle("ship", { "primary.png": "mask", "player-colors.json": "{}" }));
  const cache = await load(data);
  expect(cache.get("ship")).toBe(cache.get("corvette"));
  expect(cache.get("ship/primary")).toBeUndefined();
  expect(cache.assetBundles.ship).toBe(data.entities.ship.asset_hash);
  expect(fetch).toHaveBeenCalledWith(`/assets/ship/${data.entities.ship.asset_hash}/primary.png`, { cache: "force-cache" });
  const next = await load({ ...data, entities: { ...data.entities,
    ship: bundle("ship", { "gray.png": "gray-base", "primary.png": "mask" }) } });
  expect(next.get("ship")).not.toBe(cache.get("corvette"));
  expect(next.get("ship/primary")).toBeDefined();
});

it("reports mask generation failure without disturbing previously loaded visual resources", async () => {
  const original = content(bundle("ship", { "idle.png": "old" }));
  const cache = await load(original);
  const texture = cache.get("ship")!;
  const changed = content(bundle("ship", { "gray.png": "new", "primary.png": "mask" }), original.entities.corvette);
  vi.mocked(playerColorMaskCanvasesFromImages).mockImplementationOnce(() => { throw new Error("Mask dimensions differ"); });
  await expect(loadGameEntityTextures(changed)).rejects.toMatchObject({ detail: {
    code: "mask_failed", entity_id: "ship", expected_hash: changed.entities.ship.files["primary.png"],
    url: `/assets/ship/${changed.entities.ship.asset_hash}/primary.png`,
  } });
  expect(texture.destroy).not.toHaveBeenCalled();
});

it("renders authored gray-only sprite bundles instead of rejecting existing habitat and worker art", async () => {
  const cache = await load(content(bundle("ship", {
    "gray.png": "gray-base", "primary.png": "mask", "invariant-colors.png": "colors",
  })));
  const visual = createGameEntityVisual(cache, "ship");
  expect(visual.sprite.texture).toBe(cache.get("ship"));
  expect(visual.sprite.texture).not.toBe(cache.get("corvette"));
  expect(visual.playerColorSprites?.primary).toBeDefined();
  expect(visual.invariantColorSprite).toBeDefined();
});
