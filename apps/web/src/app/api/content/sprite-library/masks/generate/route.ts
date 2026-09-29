import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { candidateImagePath, alignMaskToSprite, excludePrimaryRegion, readMaskCandidate, writeMaskCandidateImage } from "@/lib/content/maskCandidates";
import { editSpriteWithOpenAI, generationSize, regionMaskPrompt } from "@/lib/content/generatePlayerMasks";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { path, requestId, part } = await request.json();
    if (part !== "primary" && part !== "secondary") {
      return NextResponse.json({ error: "Choose a player color region." }, { status: 400 });
    }
    const { manifest, source } = await readMaskCandidate(path, requestId);
    const upscaled = await readFile(candidateImagePath(manifest.entityId, requestId, "upscaled"));
    const size = generationSize(manifest.width, manifest.height);
    const primary = part === "secondary"
      ? await readFile(candidateImagePath(manifest.entityId, requestId, "primary"))
      : null;
    const [outputWidth, outputHeight] = size.split("x").map(Number);
    const generated = await editSpriteWithOpenAI({
      image: upscaled,
      referenceImage: primary ? await sharp(primary).resize(outputWidth, outputHeight).png().toBuffer() : undefined,
      model: "gpt-image-2.5-sunburst",
      prompt: regionMaskPrompt(part),
      size,
      quality: "high",
    });
    const { data } = await sharp(generated).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;
    for (let offset = 3; offset < data.length; offset += 4) if (data[offset] === 0) transparentPixels += 1;
    if (transparentPixels < data.length / 4 * 0.05) {
      throw new Error("The model returned an opaque image instead of a transparent mask. Try generating this region again.");
    }
    let aligned = await alignMaskToSprite(generated, source, manifest.width, manifest.height);
    if (primary) {
      aligned = await excludePrimaryRegion(aligned, primary);
    }
    await writeMaskCandidateImage(manifest.entityId, requestId, part, aligned);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate player mask." }, { status: 400 });
  }
}
