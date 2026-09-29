import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { generationSize } from "../src/lib/content/generatePlayerMasks";
import { alignMaskToSprite, excludePrimaryRegion } from "../src/lib/content/maskCandidates";

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

  it("uses generated alpha while clipping to the original sprite", async () => {
    const source = await pngAt([[1, 1, 10, 20, 30, 255]]);
    const generated = await pngAt([[1, 1, 0, 0, 200, 128], [0, 0, 0, 0, 200, 255]]);
    const aligned = await alignMaskToSprite(generated, source, WIDTH, HEIGHT);
    expect(await rgba(aligned, 1, 1)).toEqual([255, 255, 255, 128]);
    expect(await rgba(aligned, 0, 0)).toEqual([255, 255, 255, 0]);
  });

  it("keeps primary and secondary regions separate", async () => {
    const primary = await pngAt([[1, 1, 255, 255, 255, 255]]);
    const secondary = await pngAt([[1, 1, 255, 255, 255, 255], [2, 1, 255, 255, 255, 255]]);
    const result = await excludePrimaryRegion(secondary, primary);
    expect((await rgba(result, 1, 1))[3]).toBe(0);
    expect((await rgba(result, 2, 1))[3]).toBe(255);
  });
});
