import { readImmutableContentAsset } from "@/lib/content/contentRevisions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ entityId: string; assetHash: string; filename: string }> }) {
  const { entityId, assetHash, filename } = await params;
  try {
    const bytes = await readImmutableContentAsset(entityId, assetHash, filename);
    if (!bytes) return new Response("Asset not found", { status: 404 });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": filename.endsWith(".png") ? "image/png" : "application/json; charset=utf-8",
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("escapes its root")) return new Response("Asset not found", { status: 404 });
    return new Response("Unable to read immutable asset", { status: 500 });
  }
}
