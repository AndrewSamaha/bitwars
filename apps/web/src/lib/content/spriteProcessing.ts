import sharp from "sharp";

export const SPRITE_PREVIEW_SIZES = [192, 512] as const;
export type SpriteSizeChoice = (typeof SPRITE_PREVIEW_SIZES)[number] | "original";
export type SpriteFront = "top" | "right" | "bottom" | "left";

const clockwiseRotation: Record<SpriteFront, number> = {
  top: 90,
  right: 0,
  bottom: 270,
  left: 180,
};

export function parseSpriteSize(value: unknown): SpriteSizeChoice | null {
  return value === "192" || value === 192 ? 192
    : value === "512" || value === 512 ? 512
    : value === "original" ? "original"
    : null;
}

export function parseSpriteFront(value: unknown): SpriteFront | null {
  return value === "top" || value === "right" || value === "bottom" || value === "left" ? value : null;
}

export async function resizeSprite(image: Buffer, size: 192 | 512): Promise<Buffer> {
  return sharp(image)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

export async function orientSprite(image: Buffer, front: SpriteFront): Promise<Buffer> {
  const rotation = clockwiseRotation[front];
  return rotation === 0 ? image : sharp(image).rotate(rotation).png().toBuffer();
}
