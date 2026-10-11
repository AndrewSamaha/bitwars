import { NextResponse } from "next/server";
import { requireAuthOr401 } from "@/features/users/utils/auth";
import { getScenarioRuntime, listScenarios, parseScenario, readScenario, saveScenario, scenarioCommand, scenarioId, scenarioResult } from "@/lib/content/scenarios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { res } = await requireAuthOr401();
  if (res) return res;
  if (process.env.NODE_ENV === "production" && process.env.SCENARIOS_ENABLED !== "true")
    return NextResponse.json({ error: "Scenarios are disabled in production" }, { status: 403 });
  try {
    const params = new URL(request.url).searchParams;
    if (params.has("request_id")) {
      const result = await scenarioResult(params.get("request_id")!);
      return NextResponse.json(result ?? { pending: true }, { status: result ? 200 : 202 });
    }
    if (params.has("id")) return NextResponse.json({ yaml: await readScenario(params.get("id")!) });
    return NextResponse.json({ scenarios: await listScenarios(), runtime: await getScenarioRuntime() });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 400 }); }
}
export async function POST(request: Request) {
  const { auth, res } = await requireAuthOr401();
  if (res) return res;
  if (process.env.NODE_ENV === "production" && process.env.SCENARIOS_ENABLED !== "true")
    return NextResponse.json({ error: "Scenario controls are disabled in production" }, { status: 403 });
  try {
    const body = await request.json();
    const action = body.action;
    if (!["save", "validate", "load", "reload", "pause", "resume", "step", "bookmark"].includes(action)) throw new Error("Unknown scenario action");
    const command: Record<string, unknown> = { action: action === "save" ? "validate" : action };
    if (body.run_id !== undefined) {
      if (typeof body.run_id !== "string") throw new Error("Invalid run id");
      command.run_id = body.run_id;
    }
    if (body.bindings !== undefined) {
      if (!body.bindings || Array.isArray(body.bindings) || typeof body.bindings !== "object"
        || Object.values(body.bindings).some(value => typeof value !== "string")) throw new Error("Bindings must map slots to player UUIDs");
      command.bindings = body.bindings;
    }
    if (["save", "validate", "load"].includes(action)) {
      command.yaml = body.yaml ?? await readScenario(scenarioId(body.id));
      parseScenario(command.yaml);
    }
    if (action === "reload") {
      const current = await getScenarioRuntime();
      if (current?.scenario_id) {
        try { command.yaml = await readScenario(current.scenario_id); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      }
    }
    if (action === "step") {
      if (body.ticks !== undefined && (!Number.isInteger(body.ticks) || body.ticks < 1 || body.ticks > 3600)) throw new Error("ticks must be an integer from 1 to 3600");
      command.ticks = body.ticks ?? 1;
    }
    if (action === "bookmark") {
      command.id = scenarioId(body.id);
      try { await readScenario(command.id as string); throw new Error("Bookmark ID already exists; choose another name"); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.length > 32 || body.tags.some((tag: unknown) => typeof tag !== "string" || tag.length > 80))) throw new Error("Invalid tags");
      command.tags = body.tags ?? [];
      if (body.entity_ids !== undefined) {
        if (!Array.isArray(body.entity_ids) || !body.entity_ids.length || body.entity_ids.some((id: unknown) => typeof id !== "number" || !Number.isSafeInteger(id) || id < 1)) throw new Error("Invalid entity IDs");
        command.entity_ids = body.entity_ids;
      }
      if (body.radius !== undefined || body.center !== undefined) {
        if (!Number.isFinite(body.radius) || body.radius <= 0 || !Number.isFinite(body.center?.x) || !Number.isFinite(body.center?.y)) throw new Error("Area capture requires center {x,y} and positive radius");
        command.radius = body.radius; command.center = { x: body.center.x, y: body.center.y };
      }
    }
    const response = await scenarioCommand(command, auth!.playerId as string);
    if (action === "save" && response.pending) return NextResponse.json({ error: "Validation timed out; scenario was not saved", request_id: response.request_id }, { status: 504 });
    if (action === "save" && response.ok) response.saved_id = await saveScenario(command.yaml as string);
    return NextResponse.json(response, { status: response.pending ? 202 : response.ok ? 200 : 400 });
  } catch (error) { return NextResponse.json({ error: String(error) }, { status: 400 }); }
}
