import { NextResponse } from "next/server";
import path from "node:path";
import sharp from "sharp";
import { readLibrarySprite, saveLibrarySprite, transformLibrarySprite } from "@/lib/content/spriteLibraryAsset";
import { parseSpriteFront, parseSpriteSize } from "@/lib/content/spriteProcessing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const relativePath = body?.path;
    if (typeof relativePath !== "string") return NextResponse.json({ error: "Choose a sprite." }, { status: 400 });
    const original = await readLibrarySprite(relativePath);

    let transformed: Buffer;
    let operation: { kind: "downsample"; size: 192 | 512 } | { kind: "rotate"; front: "top" | "right" | "bottom" | "left" };
    if (body?.kind === "downsample") {
      const size = parseSpriteSize(body?.size);
      if (size !== 192 && size !== 512) return NextResponse.json({ error: "Choose a valid output resolution." }, { status: 400 });
      const metadata = await sharp(original).metadata();
      if (!metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) <= size) {
        return NextResponse.json({ error: "Choose a resolution smaller than the current sprite." }, { status: 400 });
      }
      operation = { kind: "downsample", size };
      transformed = await transformLibrarySprite(original, operation);
    } else if (body?.kind === "rotate") {
      const front = parseSpriteFront(body?.front);
      if (!front) return NextResponse.json({ error: "Choose the entity’s front." }, { status: 400 });
      operation = { kind: "rotate", front };
      transformed = await transformLibrarySprite(original, operation);
    } else {
      return NextResponse.json({ error: "Choose a valid sprite tool." }, { status: 400 });
    }

    const maskPaths = path.posix.basename(relativePath) === "idle.png"
      ? [`${path.posix.dirname(relativePath)}/primary.png`]
      : [];
    const masks = await Promise.all(maskPaths.map(async (maskPath) => {
      try {
        return { path: maskPath, image: await readLibrarySprite(maskPath) };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    }));
    if (masks[0]) {
      const originalSize = await sharp(original).metadata();
      for (const mask of masks) {
        const size = await sharp(mask!.image).metadata();
        if (size.width !== originalSize.width || size.height !== originalSize.height) {
          return NextResponse.json({ error: "Player masks must match the sprite dimensions." }, { status: 400 });
        }
      }
    }
    const transformedMasks = await Promise.all(masks.filter((mask): mask is NonNullable<typeof mask> => mask !== null)
      .map(async (mask) => ({ path: mask.path, image: await transformLibrarySprite(mask.image, operation) })));
    await Promise.all([
      saveLibrarySprite(relativePath, transformed),
      ...transformedMasks.map((mask) => saveLibrarySprite(mask.path, mask.image)),
    ]);
    const metadata = await sharp(transformed).metadata();
    return NextResponse.json({ ok: true, width: metadata.width, height: metadata.height });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update sprite." }, { status: 400 });
  }
}
