import { authorizeBattle, battleError } from "@/lib/content/battle/access";
import { BATTLE_REVISION_LIMITS, BATTLE_REVISION_ROOT } from "@/lib/content/battle/runner";
import { readRevisionSprite } from "@/lib/content/contentRevisionFiles";

export async function GET(_request: Request, { params }: { params: Promise<{ revision: string; typeId: string }> }) {
  const owner = await authorizeBattle();
  if (typeof owner !== "string") return owner;
  const { revision, typeId } = await params;
  try {
    const bytes = await readRevisionSprite(BATTLE_REVISION_ROOT, revision, typeId, BATTLE_REVISION_LIMITS);
    if (bytes) return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch { /* Do not serve bytes from a damaged or unavailable manifest. */ }
  return battleError(404, "sprite_unavailable", "Pinned sprite unavailable. Restore the retained revision's manifest and bundles.");
}
