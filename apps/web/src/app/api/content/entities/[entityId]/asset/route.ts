import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { mutateContentAndReload } from "@/lib/content/contentRevisions";
import { requireAuthOr401 } from "@/features/users/utils/auth";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  if (typeof auth?.playerId !== "string" || !auth.playerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requested_by = auth.playerId;
  const { entityId } = await params;
  if (!/^[a-z][a-z0-9_]*$/.test(entityId)) return NextResponse.json({ error: "Invalid entity id" }, { status: 400 });
  const form = await request.formData();
  const file = form.get("file");
  const expectedBase = form.get("base_revision");
  if (!(file instanceof File) || file.type !== "image/png") return NextResponse.json({ error: "Upload a PNG" }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer());
  const roots = ["../../packages/content/assets", "public/assets"].map((root) => path.resolve(process.cwd(), root, entityId));
  const { content_reload } = await mutateContentAndReload(async () => {
    await Promise.all(roots.map(async (root) => {
      await mkdir(root, { recursive: true });
      await writeFile(path.join(root, "idle.png"), data);
    }));
  }, { base_revision: typeof expectedBase === "string" ? expectedBase : undefined, requested_by });
  return NextResponse.json({ ok: true, content_reload });
}
