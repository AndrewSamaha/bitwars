import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isPlayerColorOpacity, isSecondaryBrightnessThreshold } from "@/lib/playerColorSettings";
import { readLibrarySprite } from "./spriteLibraryAsset";

export type MaskCandidatePart = "upscaled" | "gray-upscaled" | "gray" | "primary" | "primary-upscaled" | "invariants" | "invariants-upscaled" | "invariant-colors" | "invariant-colors-upscaled";
export type MaskCandidateManifest = {
  entityId: string;
  sourcePath: string;
  sourceHash: string;
  width: number;
  height: number;
  createdAt: string;
};

const REQUEST_ID = /^[0-9a-f-]{36}$/i;
const ENTITY_ID = /^[a-z][a-z0-9_]*$/;
const PARTS = new Set<MaskCandidatePart>(["upscaled", "gray-upscaled", "gray", "primary", "primary-upscaled", "invariants", "invariants-upscaled", "invariant-colors", "invariant-colors-upscaled"]);
const CANDIDATE_ROOT = path.resolve(process.cwd(), "../../packages/content/mask-candidates");

export function maskEntityId(sourcePath: unknown): string {
  if (typeof sourcePath !== "string") throw new Error("Choose a sprite.");
  const match = /^([a-z][a-z0-9_]*)\/idle\.png$/.exec(sourcePath);
  if (!match) throw new Error("Choose an entity's idle.png sprite.");
  return match[1]!;
}

function candidateDirectory(entityId: string, requestId: string) {
  if (!ENTITY_ID.test(entityId) || !REQUEST_ID.test(requestId)) throw new Error("Invalid mask request.");
  return path.join(CANDIDATE_ROOT, entityId, requestId);
}

export function candidateImagePath(entityId: string, requestId: string, part: MaskCandidatePart) {
  if (!PARTS.has(part)) throw new Error("Invalid mask image.");
  return path.join(candidateDirectory(entityId, requestId), `${part}.png`);
}

export async function createMaskCandidate(sourcePath: string) {
  const entityId = maskEntityId(sourcePath);
  const source = await readLibrarySprite(sourcePath);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error("The sprite has no readable dimensions.");
  const requestId = randomUUID();
  const manifest: MaskCandidateManifest = {
    entityId,
    sourcePath,
    sourceHash: createHash("sha256").update(source).digest("hex"),
    width: metadata.width,
    height: metadata.height,
    createdAt: new Date().toISOString(),
  };
  const directory = candidateDirectory(entityId, requestId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest));
  return { manifest, requestId, source };
}

export async function readMaskCandidate(sourcePath: string, requestId: string) {
  const entityId = maskEntityId(sourcePath);
  const manifest = JSON.parse(await readFile(path.join(candidateDirectory(entityId, requestId), "manifest.json"), "utf8")) as MaskCandidateManifest;
  if (manifest.entityId !== entityId || manifest.sourcePath !== sourcePath) throw new Error("Mask request does not match this sprite.");
  const source = await readLibrarySprite(sourcePath);
  if (createHash("sha256").update(source).digest("hex") !== manifest.sourceHash) {
    throw new Error("The sprite changed during mask generation. Start again with the current sprite.");
  }
  return { manifest, source };
}

export async function readMaskCandidateImage(sourcePath: string, requestId: string, part: MaskCandidatePart) {
  const { manifest } = await readMaskCandidate(sourcePath, requestId);
  return readFile(candidateImagePath(manifest.entityId, requestId, part));
}

export async function writeMaskCandidateImage(entityId: string, requestId: string, part: MaskCandidatePart, image: Buffer) {
  await writeFile(candidateImagePath(entityId, requestId, part), image);
}

/** Resample a proposed transparent region to the target sprite's exact grid. */
export async function alignMaskToSprite(image: Buffer, source: Buffer, width: number, height: number, allowEmpty = false): Promise<Buffer> {
  const [{ data: mask, info }, { data: sprite }] = await Promise.all([
    sharp(image).ensureAlpha().resize(width, height, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true }),
    sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (info.width !== width || info.height !== height || sprite.length !== mask.length) throw new Error("Mask size does not match the sprite.");
  let selectedPixels = 0;
  for (let offset = 0; offset < mask.length; offset += 4) {
    const alpha = Math.round(mask[offset + 3]! * sprite[offset + 3]! / 255);
    mask[offset] = 255;
    mask[offset + 1] = 255;
    mask[offset + 2] = 255;
    mask[offset + 3] = alpha;
    if (alpha > 0) selectedPixels += 1;
  }
  if (selectedPixels === 0 && !allowEmpty) throw new Error("The model returned an empty mask. Generate masks again.");
  return sharp(mask, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** Remove invariant coverage from a grayscale sprite before primary mask generation. */
export async function cutOutInvariantRegions(spriteImage: Buffer, invariantMaskImage: Buffer): Promise<Buffer> {
  const [{ data: sprite, info }, { data: invariants, info: maskInfo }] = await Promise.all([
    sharp(spriteImage).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(invariantMaskImage).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (info.width !== maskInfo.width || info.height !== maskInfo.height) {
    throw new Error("Invariant mask must match the grayscale sprite dimensions.");
  }
  let visiblePixels = 0;
  for (let offset = 3; offset < sprite.length; offset += 4) {
    sprite[offset] = Math.max(0, sprite[offset]! - invariants[offset]!);
    if (sprite[offset]! > 0) visiblePixels += 1;
  }
  if (visiblePixels === 0) throw new Error("The invariant mask covers the entire sprite. Reduce its coverage and generate masks again.");
  return sharp(sprite, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

/** Keep the upscaled sprite's colors only where the invariant mask selects them. */
export async function copyInvariantColors(colorImage: Buffer, invariantMaskImage: Buffer): Promise<Buffer> {
  const [{ data: color, info }, { data: invariants, info: maskInfo }] = await Promise.all([
    sharp(colorImage).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(invariantMaskImage).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (info.width !== maskInfo.width || info.height !== maskInfo.height) {
    throw new Error("Invariant mask must match the color sprite dimensions.");
  }
  for (let offset = 3; offset < color.length; offset += 4) {
    color[offset] = Math.min(color[offset]!, invariants[offset]!);
  }
  return sharp(color, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

export async function publishMaskCandidate(sourcePath: string, requestId: string, primaryOpacity: number, secondaryOpacity: number, secondaryBrightnessThreshold: number) {
  if (!isPlayerColorOpacity(primaryOpacity) || !isPlayerColorOpacity(secondaryOpacity)) {
    throw new Error("Player color opacity must be between 0 and 1.");
  }
  if (!isSecondaryBrightnessThreshold(secondaryBrightnessThreshold)) {
    throw new Error("Secondary brightness threshold must be between 0 and 0.85.");
  }
  const { manifest } = await readMaskCandidate(sourcePath, requestId);
  const parts = ["gray", "primary", "invariants", "invariant-colors"] as const;
  const images = await Promise.all(parts.map((part) => readFile(candidateImagePath(manifest.entityId, requestId, part))));
  for (const image of images) {
    const metadata = await sharp(image).metadata();
    if (metadata.format !== "png" || metadata.width !== manifest.width || metadata.height !== manifest.height) {
      throw new Error("The sprite and masks must match the original sprite dimensions.");
    }
  }
  const roots = [
    path.resolve(process.cwd(), "public/assets", manifest.entityId),
    path.resolve(process.cwd(), "../../packages/content/assets", manifest.entityId),
  ];
  const filenames = ["gray.png", "primary.png", "invariants.png", "invariant-colors.png"] as const;
  const settings = JSON.stringify({ primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold }, null, 2) + "\n";
  await Promise.all(roots.map((root) => mkdir(root, { recursive: true })));
  await Promise.all(roots.flatMap((root) => [
    ...filenames.map((filename, index) => writeFile(path.join(root, filename), images[index]!)),
    writeFile(path.join(root, "player-colors.json"), settings),
  ]));
}
