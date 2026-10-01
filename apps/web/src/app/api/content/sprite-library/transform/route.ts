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

    const companionPaths = path.posix.basename(relativePath) === "idle.png"
      ? (["gray", "primary"] as const).map((part) => `${path.posix.dirname(relativePath)}/${part}.png`)
      : [];
    const companions = await Promise.all(companionPaths.map(async (companionPath) => {
      try {
        return { path: companionPath, image: await readLibrarySprite(companionPath) };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    }));
    if (companions.some(Boolean)) {
      const originalSize = await sharp(original).metadata();
      for (const companion of companions.filter((item): item is NonNullable<typeof item> => item !== null)) {
        const size = await sharp(companion.image).metadata();
        if (size.width !== originalSize.width || size.height !== originalSize.height) {
          return NextResponse.json({ error: "Gray sprite and player mask must match idle.png dimensions." }, { status: 400 });
        }
      }
    }
    const transformedCompanions = await Promise.all(companions.filter((companion): companion is NonNullable<typeof companion> => companion !== null)
      .map(async (companion) => ({ path: companion.path, image: await transformLibrarySprite(companion.image, operation) })));
    await Promise.all([
      saveLibrarySprite(relativePath, transformed),
      ...transformedCompanions.map((companion) => saveLibrarySprite(companion.path, companion.image)),
    ]);
    const metadata = await sharp(transformed).metadata();
    return NextResponse.json({ ok: true, width: metadata.width, height: metadata.height });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update sprite." }, { status: 400 });
  }
}
