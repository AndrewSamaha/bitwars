import { authorizeBattle, battleError, REVISION_HASH } from "@/lib/content/battle/access";
import { BATTLE_REVISION_LIMITS, BATTLE_REVISION_ROOT, boundedBody, runnerRequest } from "@/lib/content/battle/runner";
import { stageContentRevision } from "@/lib/content/contentRevisionFiles";
import { tryContentCapture } from "@/lib/content/contentMutationLane";

export async function GET(request: Request) {
  const owner = await authorizeBattle();
  if (typeof owner !== "string") return owner;
  const revision = new URL(request.url).searchParams.get("revision");
  if (!revision || !REVISION_HASH.test(revision)) return battleError(400, "invalid_revision", "Choose a valid pinned SHA-256 revision.");
  return runnerRequest(owner, { action: "catalog", revision }, request.signal);
}

export async function POST(request: Request) {
  const owner = await authorizeBattle(request);
  if (typeof owner !== "string") return owner;
  const empty = await boundedBody(request, 0);
  if (empty instanceof Response) return empty;
  const capture = tryContentCapture(() => stageContentRevision({ revisionRoot: BATTLE_REVISION_ROOT, limits: BATTLE_REVISION_LIMITS }));
  if (!capture) return battleError(429, "catalog_busy", "Authored content is being edited or captured. Retry in a moment.");
  let revision: string;
  try {
    revision = (await capture).candidate_revision;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return battleError(422, "capture_failed", `Could not pin authored content in the sandbox. Fix the content or restore retained files, then retry. ${detail}`);
  }
  return runnerRequest(owner, { action: "catalog", revision }, request.signal);
}
