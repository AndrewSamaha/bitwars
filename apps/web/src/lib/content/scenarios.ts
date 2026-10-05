import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseDocument } from "yaml";
import { redis } from "@/lib/db/connection";

const directory = path.resolve(process.cwd(), "../../packages/content/scenarios");
export const scenarioPrefix = `rts:match:${process.env.GAME_ID || "demo-001"}`;
export function scenarioId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_-]{0,79}$/.test(value)) throw new Error("ID must start with a letter and contain only lowercase letters, digits, - or _ (max 80)");
  return value;
}
export function parseScenario(yaml: unknown) {
  if (typeof yaml !== "string" || Buffer.byteLength(yaml) > 2_000_000) throw new Error("YAML required (max 2 MB)");
  const document = parseDocument(yaml);
  if (document.errors.length) throw new Error(document.errors.map(error => error.message).join("; "));
  const scenario = document.toJS({ maxAliasCount: 0 });
  if (!scenario || scenario.version !== 1 || typeof scenario.name !== "string" || !scenario.name.trim()
    || !Array.isArray(scenario.players) || !Array.isArray(scenario.entities)) throw new Error("Scenario requires version: 1, id, name, players and entities");
  scenarioId(scenario.id);
  return scenario as { id: string; name: string; tags?: string[]; players: string[]; entities: unknown[]; captured_tick?: number };
}
export async function readScenario(id: string) {
  return readFile(path.join(directory, `${scenarioId(id)}.yaml`), "utf8");
}
export async function listScenarios() {
  await mkdir(directory, { recursive: true });
  const files = (await readdir(directory)).filter(file => /^[a-z][a-z0-9_-]{0,79}\.yaml$/.test(file)).sort();
  return Promise.all(files.map(async file => {
    const yaml = await readFile(path.join(directory, file), "utf8");
    try { const scenario = parseScenario(yaml); return { ...scenario, entities: undefined, entity_count: scenario.entities.length, yaml }; }
    catch (error) { return { id: file.slice(0, -5), name: file, yaml, error: String(error) }; }
  }));
}
export async function saveScenario(yaml: string, createOnly = false) {
  const scenario = parseScenario(yaml);
  await mkdir(directory, { recursive: true });
  const destination = path.join(directory, `${scenario.id}.yaml`);
  // Exclusive bookmark creation protects an existing scenario from being overwritten.
  if (createOnly) await writeFile(destination, yaml, { flag: "wx" });
  else {
    const { rename, unlink } = await import("node:fs/promises");
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try { await writeFile(temporary, yaml, { flag: "wx" }); await rename(temporary, destination); }
    finally { await unlink(temporary).catch(() => {}); }
  }
  return scenario.id;
}
export async function getScenarioRuntime() {
  const value = await redis.get(`${scenarioPrefix}:runtime`);
  return value ? JSON.parse(value) : null;
}
export async function scenarioResult(requestId: string) {
  if (!/^[0-9a-f-]{36}$/.test(requestId)) throw new Error("invalid request id");
  const key = `${scenarioPrefix}:scenario_result:${requestId}`;
  const value = await redis.get(key);
  if (!value) return null;
  const result = JSON.parse(value);
  if (result.ok && result.result?.yaml && !result.result.saved_id) {
    try { result.result.saved_id = await saveScenario(result.result.yaml, true); }
    catch (error) {
      // Concurrent retrievals of one capture may both try to create its file.
      const id = parseScenario(result.result.yaml).id;
      if ((error as NodeJS.ErrnoException).code === "EEXIST" && await readScenario(id) === result.result.yaml) result.result.saved_id = id;
      else { result.ok = false; result.error = `Bookmark was captured but could not be saved: ${String(error)}`; }
    }
    await redis.set(key, JSON.stringify(result), "EX", 300);
  }
  return result;
}
export async function scenarioCommand(command: Record<string, unknown>, playerId: string): Promise<{ request_id: string; pending?: boolean; ok?: boolean; error?: string; result?: any; saved_id?: string }> {
  const runtime = await getScenarioRuntime();
  if (!runtime?.run_id) throw new Error("Engine does not support scenarios yet; restart it once after this update");
  const requestId = randomUUID();
  const payload = { ...command, request_id: requestId, player_id: playerId, run_id: command.run_id || runtime.run_id };
  if (await redis.llen(`${scenarioPrefix}:scenario_commands`) >= 64) throw new Error("Scenario command queue is full; engine may be offline");
  await redis.rpush(`${scenarioPrefix}:scenario_commands`, JSON.stringify(payload));
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await scenarioResult(requestId);
    if (result) return { request_id: requestId, ...result };
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return { request_id: requestId, pending: true };
}
