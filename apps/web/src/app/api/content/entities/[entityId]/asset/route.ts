import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(entityId)) return NextResponse.json({ error: "Invalid entity id" }, { status: 400 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.type !== "image/png") return NextResponse.json({ error: "Upload a PNG" }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer());
  const roots = ["../../packages/content/assets", "public/assets"].map((root) => path.resolve(process.cwd(), root, entityId));
  await Promise.all(roots.map(async (root) => {
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, "idle.png"), data);
  }));
  return NextResponse.json({ ok: true });
}
