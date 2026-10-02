import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { candidateImagePath, alignMaskToSprite, copyInvariantColors, cutOutInvariantRegions, readMaskCandidate, writeMaskCandidateImage } from "@/lib/content/maskCandidates";
import { editSpriteWithOpenAI, generationSize, ImageTransportError } from "@/lib/content/generatePlayerMasks";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { path, requestId, prompt, kind, skipInvariants } = await request.json();
    if (kind !== "primary" && kind !== "invariants") {
      return NextResponse.json({ error: "Choose a mask to generate." }, { status: 400 });
    }
    if (skipInvariants === true && kind !== "invariants") {
      return NextResponse.json({ error: "Only invariant generation can be skipped." }, { status: 400 });
    }
    if (skipInvariants !== true && (typeof prompt !== "string" || !prompt.trim() || prompt.length > 10_000)) {
      return NextResponse.json({ error: "Enter a mask prompt of up to 10,000 characters." }, { status: 400 });
    }
    const { manifest } = await readMaskCandidate(path, requestId);
    const [upscaled, grayUpscaled, gray] = await Promise.all([
      readFile(candidateImagePath(manifest.entityId, requestId, "upscaled")),
      readFile(candidateImagePath(manifest.entityId, requestId, "gray-upscaled")),
      readFile(candidateImagePath(manifest.entityId, requestId, "gray")),
    ]);
    const size = generationSize(manifest.width, manifest.height);
    const upscaledMetadata = await sharp(grayUpscaled).metadata();
    if (!upscaledMetadata.width || !upscaledMetadata.height) throw new Error("The enlarged sprite has no readable dimensions.");
    if (skipInvariants === true) {
      const [emptyUpscaled, emptyPublished] = await Promise.all([
        sharp({ create: { width: upscaledMetadata.width, height: upscaledMetadata.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer(),
        sharp({ create: { width: manifest.width, height: manifest.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer(),
      ]);
      await Promise.all([
        writeMaskCandidateImage(manifest.entityId, requestId, "invariants-upscaled", emptyUpscaled),
        writeMaskCandidateImage(manifest.entityId, requestId, "invariants", emptyPublished),
        writeMaskCandidateImage(manifest.entityId, requestId, "invariant-colors-upscaled", emptyUpscaled),
        writeMaskCandidateImage(manifest.entityId, requestId, "invariant-colors", emptyPublished),
      ]);
      return NextResponse.json({ ok: true });
    }
    let generationSource = kind === "primary" ? grayUpscaled : upscaled;
    let publishedSource = gray;
    if (kind === "primary") {
      let invariantUpscaled: Buffer;
      let invariantPublished: Buffer;
      try {
        [invariantUpscaled, invariantPublished] = await Promise.all([
          readFile(candidateImagePath(manifest.entityId, requestId, "invariants-upscaled")),
          readFile(candidateImagePath(manifest.entityId, requestId, "invariants")),
        ]);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          throw new Error("Generate the invariant mask before generating the primary mask.");
        }
        throw error;
      }
      [generationSource, publishedSource] = await Promise.all([
        cutOutInvariantRegions(grayUpscaled, invariantUpscaled),
        cutOutInvariantRegions(gray, invariantPublished),
      ]);
    }
    const generated = await editSpriteWithOpenAI({
      image: generationSource,
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
    const upscaledMask = await alignMaskToSprite(generated, kind === "primary" ? generationSource : grayUpscaled, upscaledMetadata.width, upscaledMetadata.height, kind === "invariants");
    const aligned = await alignMaskToSprite(upscaledMask, publishedSource, manifest.width, manifest.height, kind === "invariants");
    if (kind === "invariants") {
      const downscaledColor = await sharp(upscaled).resize(manifest.width, manifest.height, { fit: "fill" }).png().toBuffer();
      const [upscaledColors, publishedColors] = await Promise.all([
        copyInvariantColors(upscaled, upscaledMask),
        copyInvariantColors(downscaledColor, aligned),
      ]);
      await Promise.all([
        writeMaskCandidateImage(manifest.entityId, requestId, "invariants-upscaled", upscaledMask),
        writeMaskCandidateImage(manifest.entityId, requestId, "invariants", aligned),
        writeMaskCandidateImage(manifest.entityId, requestId, "invariant-colors-upscaled", upscaledColors),
        writeMaskCandidateImage(manifest.entityId, requestId, "invariant-colors", publishedColors),
      ]);
    } else {
      await Promise.all([
        writeMaskCandidateImage(manifest.entityId, requestId, "primary-upscaled", upscaledMask),
        writeMaskCandidateImage(manifest.entityId, requestId, "primary", aligned),
      ]);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate player mask." }, { status: error instanceof ImageTransportError ? 502 : 400 });
  }
}
