import { battleDisabled, battleError, developerConfig, sameOrigin, unlockBattle } from "@/lib/content/battle/access";
import { boundedBody } from "@/lib/content/battle/runner";

export async function POST(request: Request) {
  const config = developerConfig();
  if (!config) return battleDisabled();
  if (!sameOrigin(request, config)) return battleError(403, "wrong_origin", `Open Battle at ${config.origin} to unlock it.`);
  const body = await boundedBody(request, 4096);
  if (body instanceof Response) return body;
  if (!await unlockBattle(config, body.toString("utf8"))) {
    return battleError(401, "unauthorized", "Key did not match the local BATTLE_DEV_KEY. Check your dev configuration.");
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}
