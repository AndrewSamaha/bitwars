import { NextResponse } from "next/server";
import { readMaskCandidateImage, type MaskCandidatePart } from "@/lib/content/maskCandidates";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const path = params.get("path");
    const requestId = params.get("requestId");
    const part = params.get("part");
    if (!path || !requestId || (part !== "upscaled" && part !== "gray-upscaled" && part !== "gray" && part !== "primary" && part !== "primary-upscaled" && part !== "invariants" && part !== "invariants-upscaled" && part !== "invariant-colors" && part !== "invariant-colors-upscaled")) {
      return NextResponse.json({ error: "Invalid mask image request." }, { status: 400 });
    }
    const image = await readMaskCandidateImage(path, requestId, part as MaskCandidatePart);
    return new NextResponse(Uint8Array.from(image), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Mask image unavailable." }, { status: 404 });
  }
}
