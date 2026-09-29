import { NextResponse } from "next/server";
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
    if (body?.kind === "downsample") {
      const size = parseSpriteSize(body?.size);
      if (size !== 192 && size !== 512) return NextResponse.json({ error: "Choose a valid output resolution." }, { status: 400 });
      const metadata = await sharp(original).metadata();
      if (!metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) <= size) {
        return NextResponse.json({ error: "Choose a resolution smaller than the current sprite." }, { status: 400 });
      }
      transformed = await transformLibrarySprite(original, { kind: "downsample", size });
    } else if (body?.kind === "rotate") {
      const front = parseSpriteFront(body?.front);
      if (!front) return NextResponse.json({ error: "Choose the entity’s front." }, { status: 400 });
      transformed = await transformLibrarySprite(original, { kind: "rotate", front });
    } else {
      return NextResponse.json({ error: "Choose a valid sprite tool." }, { status: 400 });
    }

    await saveLibrarySprite(relativePath, transformed);
    const metadata = await sharp(transformed).metadata();
    return NextResponse.json({ ok: true, width: metadata.width, height: metadata.height });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update sprite." }, { status: 400 });
  }
}
