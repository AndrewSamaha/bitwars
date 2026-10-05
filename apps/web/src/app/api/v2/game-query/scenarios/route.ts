import { NextResponse } from "next/server";
import { assertGameQueryAccess } from "@/lib/game-query";
import { getScenarioRuntime, listScenarios } from "@/lib/content/scenarios";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  assertGameQueryAccess();
  return NextResponse.json({ runtime: await getScenarioRuntime(), scenarios: (await listScenarios()).map(({ yaml, ...scenario }) => scenario) });
}
