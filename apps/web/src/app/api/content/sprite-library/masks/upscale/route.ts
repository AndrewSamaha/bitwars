import { NextResponse } from "next/server";
import { createMaskCandidate, writeMaskCandidateImage } from "@/lib/content/maskCandidates";
import { editSpriteWithOpenAI, generationSize, UPSCALE_PROMPT } from "@/lib/content/generatePlayerMasks";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    const { manifest, requestId, source } = await createMaskCandidate(path);
    const size = generationSize(manifest.width, manifest.height);
    const upscaled = await editSpriteWithOpenAI({
      image: source,
      model: "gpt-image-2.5-flare",
      prompt: UPSCALE_PROMPT,
      size,
      quality: "medium",
    });
    await writeMaskCandidateImage(manifest.entityId, requestId, "upscaled", upscaled);
    return NextResponse.json({ requestId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upscale sprite." }, { status: 400 });
  }
}
