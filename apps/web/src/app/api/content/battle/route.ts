import { authorizeBattle, battleError } from "@/lib/content/battle/access";
import { boundedBody, MAX_DRAFT_BYTES, runnerRequest } from "@/lib/content/battle/runner";

export async function POST(request: Request) {
  const owner = await authorizeBattle(request);
  if (typeof owner !== "string") return owner;
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return battleError(415, "invalid_draft", "Send the draft as application/json.");
  }
  const body = await boundedBody(request, MAX_DRAFT_BYTES);
  return body instanceof Response ? body : runnerRequest(owner, { action: "submit" }, request.signal, body);
}
