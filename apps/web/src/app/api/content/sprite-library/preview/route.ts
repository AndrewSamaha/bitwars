import { NextResponse } from "next/server";
import { readLibrarySprite, spriteLibraryPath, transformLibrarySprite } from "@/lib/content/spriteLibraryAsset";
import { parseSpriteFront, parseSpriteSize } from "@/lib/content/spriteProcessing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const relativePath = params.get("path");
  const sizeValue = params.get("size");
  const frontValue = params.get("front");
  const size = parseSpriteSize(sizeValue);
  const front = parseSpriteFront(frontValue);
  if (!relativePath || (sizeValue === null) === (frontValue === null) || (sizeValue !== null && size !== 192 && size !== 512) || (frontValue !== null && !front)) {
    return NextResponse.json({ error: "Choose a valid sprite transform." }, { status: 400 });
  }

  try {
    spriteLibraryPath(relativePath);
    const original = await readLibrarySprite(relativePath);
    const image = await transformLibrarySprite(original, size === 192 || size === 512 ? { kind: "downsample", size } : { kind: "rotate", front: front! });
    return new NextResponse(Uint8Array.from(image), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to preview sprite." }, { status: 400 });
  }
}
