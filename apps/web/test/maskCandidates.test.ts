import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { generationSize } from "../src/lib/content/generatePlayerMasks";
import { alignMaskToSprite } from "../src/lib/content/maskCandidates";
import { secondaryCoverageAlpha } from "../src/lib/playerColorSettings";

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

  it("removes primary coverage from the secondary layer before opacity is applied", () => {
    expect(secondaryCoverageAlpha(255, 255)).toBe(0);
    expect(secondaryCoverageAlpha(255, 128)).toBe(127);
    expect(secondaryCoverageAlpha(180, 70)).toBe(110);
    expect(secondaryCoverageAlpha(180, 255)).toBe(0);
  });
});
