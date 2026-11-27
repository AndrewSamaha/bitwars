import { authorizeBattle, battleError, DASHED_ID } from "@/lib/content/battle/access";
import { runnerRequest } from "@/lib/content/battle/runner";

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const owner = await authorizeBattle();
  if (typeof owner !== "string") return owner;
  const { runId } = await params;
  if (!DASHED_ID.test(runId)) return battleError(404, "run_unavailable", "Run or replay unavailable. Reset and run again.");
  return runnerRequest(owner, { action: "status", run_id: runId }, request.signal);
}
