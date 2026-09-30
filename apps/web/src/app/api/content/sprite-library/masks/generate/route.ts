import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { candidateImagePath, alignMaskToSprite, readMaskCandidate, writeMaskCandidateImage } from "@/lib/content/maskCandidates";
import { editSpriteWithOpenAI, generationSize } from "@/lib/content/generatePlayerMasks";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { path, requestId, prompt } = await request.json();
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 10_000) {
      return NextResponse.json({ error: "Enter a mask prompt of up to 10,000 characters." }, { status: 400 });
    }
    const { manifest } = await readMaskCandidate(path, requestId);
    const [upscaled, downscaled] = await Promise.all([
      readFile(candidateImagePath(manifest.entityId, requestId, "upscaled")),
      readFile(candidateImagePath(manifest.entityId, requestId, "downscaled")),
    ]);
    const size = generationSize(manifest.width, manifest.height);
    const upscaledMetadata = await sharp(upscaled).metadata();
    if (!upscaledMetadata.width || !upscaledMetadata.height) throw new Error("The enlarged sprite has no readable dimensions.");
    const generated = await editSpriteWithOpenAI({
      image: upscaled,
      model: "gpt-image-2.5-sunburst",
      prompt: prompt.trim(),
      size,
      quality: "high",
    });
    const { data } = await sharp(generated).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;
    for (let offset = 3; offset < data.length; offset += 4) if (data[offset] === 0) transparentPixels += 1;
    if (transparentPixels < data.length / 4 * 0.05) {
      throw new Error("The model returned an opaque image instead of a transparent mask. Try generating this region again.");
    }
    const upscaledMask = await alignMaskToSprite(generated, upscaled, upscaledMetadata.width, upscaledMetadata.height);
    const aligned = await alignMaskToSprite(upscaledMask, downscaled, manifest.width, manifest.height);
    await writeMaskCandidateImage(manifest.entityId, requestId, "primary-upscaled", upscaledMask);
    await writeMaskCandidateImage(manifest.entityId, requestId, "primary", aligned);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate player mask." }, { status: 400 });
  }
}
