import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { orientSprite, resizeSprite, type SpriteFront } from "../src/lib/content/spriteProcessing";

function testSprite() {
  const pixels = Buffer.alloc(5 * 5 * 4);
  const markers: Array<[number, number, number[]]> = [
    [2, 0, [255, 0, 0, 255]],
    [4, 2, [0, 255, 0, 255]],
    [2, 4, [0, 0, 255, 255]],
    [0, 2, [255, 255, 0, 255]],
  ];
  for (const [x, y, color] of markers) pixels.set(color, (y * 5 + x) * 4);
  return sharp(pixels, { raw: { width: 5, height: 5, channels: 4 } }).png().toBuffer();
}

describe("sprite processing", () => {
  it("writes real square PNGs with transparent padding", async () => {
    const source = await testSprite();
    for (const size of [192, 512] as const) {
      const output = await resizeSprite(source, size);
      const metadata = await sharp(output).metadata();
      expect({ width: metadata.width, height: metadata.height, format: metadata.format }).toEqual({ width: size, height: size, format: "png" });
      const { data } = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(data[3]).toBe(0);
    }
  });

  it("rotates each selected front to the right edge", async () => {
    const source = await testSprite();
    const expected: Array<[SpriteFront, number[]]> = [
      ["top", [255, 0, 0, 255]],
      ["right", [0, 255, 0, 255]],
      ["bottom", [0, 0, 255, 255]],
      ["left", [255, 255, 0, 255]],
    ];
    for (const [front, color] of expected) {
      const { data } = await sharp(await orientSprite(source, front)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([...data.subarray((2 * 5 + 4) * 4, (2 * 5 + 4) * 4 + 4)]).toEqual(color);
    }
  });
});
