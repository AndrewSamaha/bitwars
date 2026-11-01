import { NextResponse } from "next/server";
import { readAcceptedContent } from "@/lib/content/contentReloadStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns one coherent accepted revision, never a staged candidate. */
export async function GET(request: Request) {
  const revision = new URL(request.url).searchParams.get("revision") ?? undefined;
  if (revision !== undefined && !/^[a-f0-9]{64}$/.test(revision)) {
    return NextResponse.json({ error: "Invalid content revision" }, { status: 400 });
  }
  try {
    const content = await readAcceptedContent(revision);
    if (!content) return NextResponse.json({ error: "Accepted content revision is unavailable" }, { status: 404 });
    return NextResponse.json(content, { headers: { "Cache-Control": revision ? "public, max-age=31536000, immutable" : "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read accepted content" }, { status: 500 });
  }
}
