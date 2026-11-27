import { authorizeBattle, battleError, DASHED_ID } from "@/lib/content/battle/access";
import { runnerRequest } from "@/lib/content/battle/runner";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const owner = await authorizeBattle();
  if (typeof owner !== "string") return owner;
  const { runId } = await params;
  const page = new URL(request.url).searchParams.get("page") ?? "0";
  if (!DASHED_ID.test(runId) || !/^\d{1,4}$/.test(page)) {
    return battleError(404, "run_unavailable", "Run or replay unavailable. Reset and run again.");
  }
  return runnerRequest(owner, { action: "replay", run_id: runId, page: Number(page) }, request.signal);
}
