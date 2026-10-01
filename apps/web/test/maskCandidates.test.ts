import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { generationSize } from "../src/lib/content/generatePlayerMasks";
import { alignMaskToSprite, copyInvariantColors, cutOutInvariantRegions } from "../src/lib/content/maskCandidates";
import { secondaryCoverageAlpha, tintableSpriteAlpha } from "../src/lib/playerColorSettings";

const WIDTH = 4;
const HEIGHT = 4;

async function pngAt(pixels: Array<[number, number, number, number, number, number]>) {
  const raw = Buffer.alloc(WIDTH * HEIGHT * 4);
  for (const [x, y, red, green, blue, alpha] of pixels) raw.set([red, green, blue, alpha], (y * WIDTH + x) * 4);
  return sharp(raw, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).png().toBuffer();
}

async function rgba(image: Buffer, x: number, y: number) {
  const { data } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return [...data.subarray((y * WIDTH + x) * 4, (y * WIDTH + x) * 4 + 4)];
}

describe("player mask candidates", () => {
  it("requests a valid enlarged image size", () => {
    expect(generationSize(192, 192)).toBe("1024x1024");
    const [width, height] = generationSize(192, 128).split("x").map(Number);
    expect(width! * height!).toBeGreaterThanOrEqual(655_360);
    expect(width! % 16).toBe(0);
    expect(height! % 16).toBe(0);
  });

  it("uses generated alpha while clipping to the sprite being published", async () => {
    const source = await pngAt([[1, 1, 10, 20, 30, 255]]);
    const generated = await pngAt([[1, 1, 0, 0, 200, 128], [0, 0, 0, 0, 200, 255]]);
    const aligned = await alignMaskToSprite(generated, source, WIDTH, HEIGHT);
    expect(await rgba(aligned, 1, 1)).toEqual([255, 255, 255, 128]);
    expect(await rgba(aligned, 0, 0)).toEqual([255, 255, 255, 0]);
  });

  it("accepts an empty invariant selection without inventing coverage", async () => {
    const source = await pngAt([[1, 1, 10, 20, 30, 255]]);
    const generated = await pngAt([]);
    const aligned = await alignMaskToSprite(generated, source, WIDTH, HEIGHT, true);
    expect(await rgba(aligned, 1, 1)).toEqual([255, 255, 255, 0]);
  });

  it("cuts invariant pixels out of the grayscale input and clips primary coverage", async () => {
    const gray = await pngAt([
      [0, 0, 40, 40, 40, 255],
      [1, 0, 80, 80, 80, 255],
      [2, 0, 120, 120, 120, 255],
    ]);
    const invariants = await pngAt([
      [0, 0, 255, 255, 255, 255],
      [1, 0, 255, 255, 255, 128],
    ]);
    const cutout = await cutOutInvariantRegions(gray, invariants);
    expect(await rgba(cutout, 0, 0)).toEqual([40, 40, 40, 0]);
    expect(await rgba(cutout, 1, 0)).toEqual([80, 80, 80, 127]);
    expect(await rgba(cutout, 2, 0)).toEqual([120, 120, 120, 255]);

    const generated = await pngAt([
      [0, 0, 255, 255, 255, 255],
      [1, 0, 255, 255, 255, 255],
      [2, 0, 255, 255, 255, 255],
    ]);
    const primary = await alignMaskToSprite(generated, cutout, WIDTH, HEIGHT);
    expect(await rgba(primary, 0, 0)).toEqual([255, 255, 255, 0]);
    expect(await rgba(primary, 1, 0)).toEqual([255, 255, 255, 127]);
    expect(await rgba(primary, 2, 0)).toEqual([255, 255, 255, 255]);
  });

  it("copies color only inside invariant coverage", async () => {
    const color = await pngAt([
      [0, 0, 12, 90, 210, 255],
      [1, 0, 230, 80, 40, 255],
      [2, 0, 20, 180, 60, 160],
    ]);
    const invariants = await pngAt([
      [0, 0, 255, 255, 255, 255],
      [1, 0, 255, 255, 255, 96],
      [2, 0, 255, 255, 255, 220],
    ]);
    const cutout = await copyInvariantColors(color, invariants);
    expect(await rgba(cutout, 0, 0)).toEqual([12, 90, 210, 255]);
    expect(await rgba(cutout, 1, 0)).toEqual([230, 80, 40, 96]);
    expect(await rgba(cutout, 2, 0)).toEqual([20, 180, 60, 160]);
    expect(await rgba(cutout, 3, 0)).toEqual([0, 0, 0, 0]);
  });

  it("reserves invariant coverage before applying either player color", () => {
    const tintable = tintableSpriteAlpha(255, 255);
    expect(tintable).toBe(0);
    expect(secondaryCoverageAlpha(tintable, Math.min(tintable, 255), 255, 0)).toBe(0);
    expect(tintableSpriteAlpha(255, 128)).toBe(127);
    expect(tintableSpriteAlpha(128, 255)).toBe(0);
  });

  it("removes primary coverage from the secondary layer before opacity is applied", () => {
    expect(secondaryCoverageAlpha(255, 255, 255, 0)).toBe(0);
    expect(secondaryCoverageAlpha(255, 128, 255, 0)).toBe(127);
    expect(secondaryCoverageAlpha(180, 70, 255, 0)).toBe(110);
    expect(secondaryCoverageAlpha(180, 255, 255, 0)).toBe(0);
  });

  it("feathers secondary coverage above the grayscale brightness threshold", () => {
    expect(secondaryCoverageAlpha(255, 0, 50, 0.25)).toBe(0);
    expect(secondaryCoverageAlpha(255, 0, 83, 0.25)).toBeGreaterThan(0);
    expect(secondaryCoverageAlpha(255, 0, 83, 0.25)).toBeLessThan(255);
    expect(secondaryCoverageAlpha(255, 0, 128, 0.25)).toBe(255);
    expect(secondaryCoverageAlpha(255, 128, 255, 0.25)).toBe(127);
    expect(secondaryCoverageAlpha(255, 0, 0, 0)).toBe(255);
  });
});
