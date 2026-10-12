import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import type { CallToolResult } from "@modelcontextprotocol/client";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectorState, CommandStatus, GameEntity, IntentInput, WaitCondition } from "./playerGateway.js";
import type { PlayerChange } from "./observationJournal.js";

type Observation = {
  run_id?: string;
  tick?: number | string;
  ready: boolean;
  history_complete: boolean;
  change_cursor: number;
  owned_entities: GameEntity[];
  collector_states: CollectorState[];
  progress: Record<string, unknown>;
};

type VisibleEntities = { run_id?: string; ready: boolean; entities: GameEntity[] };
type ChangeBatch = { changes: PlayerChange[]; next_cursor: number; has_more: boolean; gap: boolean };
type IntentReceipt = { accepted_http: boolean; status: number; client_cmd_id: string; result: unknown };
type Point = { x: number; y: number };
export type BuildJob = { commandId: string; builderId: number; blueprintId: string; priorIds: Set<string>; priorCount: number };

type Config = {
  username: string;
  baseUrl: string;
  timeoutSeconds: number;
  allowRemote: boolean;
};

const WAIT_MS = 10_000;
const RADIATION_RADIUS = 1_200;
const SOLAR_SITE_RADIUS = 1_500;
const HABITAT_SITE_RADIUS = 2_500;
const SOLAR_SPAWN_OFFSET = 62; // worker hull 50 + solar collector hull 12

function log(kind: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ kind, time_ms: Date.now(), ...data }));
}

function idOf(entity: GameEntity): number {
  const id = Number(entity.id);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`unsafe entity ID: ${String(entity.id)}`);
  return id;
}

function pointOf(entity: GameEntity): Point {
  const pos = entity.pos;
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) {
    throw new Error(`entity ${String(entity.id)} has no usable position`);
  }
  return pos;
}

function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
  ));
  return distance(point, { x: start.x + fraction * dx, y: start.y + fraction * dy });
}

function data<T>(result: CallToolResult): T {
  if (result.isError) throw new Error(result.content.filter(item => item.type === "text").map(item => item.text).join("\n"));
  if (result.structuredContent !== undefined) return result.structuredContent as T;
  const value = result.content.find(item => item.type === "text")?.text;
  if (!value) throw new Error("MCP tool returned no result");
  return JSON.parse(value) as T;
}

async function call<T>(client: Client, name: string, args: Record<string, unknown>): Promise<T> {
  return data<T>(await client.callTool({ name, arguments: args }));
}

/** High-level, LLM-free player actions built exclusively from the player MCP tools. */
export class ScriptedPlayer {
  private constructor(
    private readonly client: Client,
    private readonly handle: string,
    private readonly runId: string,
    private cursor: number,
    private readonly deadline: number,
  ) {}

  static async connect(client: Client, username: string, deadline: number): Promise<ScriptedPlayer> {
    const { handle } = await call<{ handle: string }>(client, "connect_player", { username });
    try {
      let observation: Observation;
      do {
        observation = await call<Observation>(client, "get_observation", { handle });
        if (observation.ready) break;
        if (Date.now() >= deadline) throw new Error("player did not become ready before the deadline");
        await new Promise(resolveDelay => setTimeout(resolveDelay, 200));
      } while (true);
      if (!observation.run_id || !observation.history_complete) throw new Error("player has no complete run observation");
      log("connected", { username, run_id: observation.run_id, tick: observation.tick });
      return new ScriptedPlayer(client, handle, observation.run_id, observation.change_cursor, deadline);
    } catch (error) {
      await call(client, "disconnect_player", { handle }).catch(() => undefined);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await call(this.client, "disconnect_player", { handle: this.handle });
  }

  private checkDeadline(stage: string): void {
    if (Date.now() >= this.deadline) throw new Error(`scenario deadline reached during ${stage}`);
  }

  private async changes(): Promise<void> {
    let hasMore: boolean;
    do {
      const batch = await call<ChangeBatch>(this.client, "get_changes", {
        handle: this.handle, run_id: this.runId, cursor: this.cursor, limit: 500,
      });
      if (batch.gap) throw new Error(`observation gap after cursor ${this.cursor}; reconcile before continuing`);
      this.cursor = batch.next_cursor;
      hasMore = batch.has_more;
      for (const change of batch.changes) {
        if (["lifecycle", "entity_created", "entity_removed", "collector_state"].includes(change.kind)) {
          log("change", { cursor: change.cursor, tick: change.tick, change_kind: change.kind, data: change.data });
        }
      }
    } while (hasMore);
  }

  async observe(): Promise<Observation> {
    this.checkDeadline("observation");
    for (let attempt = 0; attempt < 10; attempt++) {
      await this.changes();
      const state = await call<Observation>(this.client, "get_observation", { handle: this.handle });
      if (state.run_id !== this.runId) throw new Error(`game run changed from ${this.runId} to ${String(state.run_id)}`);
      if (!state.history_complete || !state.ready) throw new Error("player observation is incomplete or disconnected");
      if (state.change_cursor <= this.cursor) return state;
    }
    throw new Error("observation changed continuously while the script was reading it");
  }

  async visible(entityTypeIds: string[]): Promise<GameEntity[]> {
    const result = await call<VisibleEntities>(this.client, "get_visible_entities", {
      handle: this.handle, entity_type_ids: entityTypeIds,
    });
    if (!result.ready || result.run_id !== this.runId) throw new Error("visible-entity view is not ready for this run");
    return result.entities;
  }

  private async wait(condition: WaitCondition): Promise<Observation> {
    this.checkDeadline(condition.type);
    const remaining = Math.min(WAIT_MS, this.deadline - Date.now());
    const result = await call<{ run_changed: boolean }>(this.client, "wait_for_observation", {
      handle: this.handle, condition, run_id: this.runId, wait_ms: remaining,
    });
    if (result.run_changed) throw new Error("game run changed while waiting");
    return this.observe();
  }

  private async command(commandId: string): Promise<CommandStatus> {
    const result = await call<{ command: CommandStatus | null }>(this.client, "get_command", {
      handle: this.handle, client_cmd_id: commandId,
    });
    if (!result.command) throw new Error(`command ${commandId} is missing from the gateway`);
    return result.command;
  }

  private async submit(intent: IntentInput): Promise<string> {
    const receipt = await call<IntentReceipt>(this.client, "send_intent", { handle: this.handle, intent });
    log("intent", { intent, ...receipt });
    if (!receipt.accepted_http) throw new Error(`${intent.type} for ${intent.entity_id} failed: HTTP ${receipt.status}: ${JSON.stringify(receipt.result)}`);
    return receipt.client_cmd_id;
  }

  private async started(commandId: string): Promise<void> {
    while (true) {
      await this.observe();
      const command = await this.command(commandId);
      if (command.lifecycle_state === 3 || command.lifecycle_state === 5) return;
      if (command.terminal) throw new Error(`command ${commandId} ended in lifecycle state ${command.lifecycle_state}`);
      await this.wait({ type: "command_state", client_cmd_id: commandId, state: 3 });
    }
  }

  private async finished(commandId: string, builderId?: number): Promise<void> {
    let lastProgress: number | undefined;
    while (true) {
      const observation = await this.observe();
      const command = await this.command(commandId);
      if (command.terminal) {
        if (command.lifecycle_state !== 5) throw new Error(`command ${commandId} ended in lifecycle state ${command.lifecycle_state}`);
        return;
      }
      if (builderId !== undefined) {
        const progress = (observation.progress[String(builderId)] as { progress?: number } | undefined)?.progress;
        if (progress !== undefined && progress !== lastProgress) {
          log("build_progress", { builder_id: builderId, command_id: commandId, progress });
          lastProgress = progress;
        }
      }
      await this.wait({ type: "command_terminal", client_cmd_id: commandId });
    }
  }

  async move(entityId: number, target: Point): Promise<void> {
    const commandId = await this.submit({ type: "Move", entity_id: entityId, target });
    await this.finished(commandId);
    while (true) {
      const entity = (await this.observe()).owned_entities.find(item => idOf(item) === entityId);
      if (!entity) throw new Error(`moved entity ${entityId} disappeared`);
      if (distance(pointOf(entity), target) <= 5) break;
      await new Promise(resolveDelay => setTimeout(resolveDelay, 500));
    }
    log("moved", { entity_id: entityId, target });
  }

  async collect(entityId: number, resourceTypeId: string): Promise<void> {
    const commandId = await this.submit({ type: "Collect", entity_id: entityId, resource_type_id: resourceTypeId });
    await this.started(commandId);
    while (true) {
      const observation = await this.observe();
      const state = observation.collector_states.find(item => Number(item.entity_id) === entityId);
      if (state?.assigned_resource_type === resourceTypeId && state.activity !== "idle") {
        log("collection_assigned", { entity_id: entityId, resource_type_id: resourceTypeId, activity: state.activity });
        return;
      }
      await this.wait({ type: "collector_activity", entity_id: entityId, activity: "moving_to_source", resource_type_id: resourceTypeId });
    }
  }

  async waitForSolarCollection(entityId: number): Promise<void> {
    while (true) {
      const observation = await this.observe();
      const state = observation.collector_states.find(item => Number(item.entity_id) === entityId);
      if (state?.activity === "proximity_collecting" && state.resource_type === "energy" &&
          Number(state.effective_rate_per_second) > 0) {
        log("solar_collecting", { entity_id: entityId, rate: state.effective_rate_per_second });
        return;
      }
      await this.wait({ type: "collector_activity", entity_id: entityId, activity: "proximity_collecting", resource_type_id: "energy" });
    }
  }

  async startBuild(builderId: number, blueprintId: string): Promise<BuildJob> {
    const observation = await this.observe();
    const existing = observation.owned_entities.filter(item => item.entity_type_id === blueprintId);
    const job: BuildJob = {
      builderId, blueprintId, priorIds: new Set(existing.map(item => String(item.id))), priorCount: existing.length,
      commandId: await this.submit({ type: "Build", entity_id: builderId, blueprint_id: blueprintId }),
    };
    await this.started(job.commandId);
    await call(this.client, "set_progress_watch", { handle: this.handle, entity_ids: [builderId] });
    return job;
  }

  async finishBuild(job: BuildJob): Promise<GameEntity> {
    try {
      await this.finished(job.commandId, job.builderId);
      while (true) {
        const observation = await this.observe();
        const created = observation.owned_entities.filter(item =>
          item.entity_type_id === job.blueprintId && !job.priorIds.has(String(item.id)),
        );
        if (created.length === 1) {
          log("built", { builder_id: job.builderId, product: created[0], command_id: job.commandId });
          return created[0]!;
        }
        if (created.length > 1) throw new Error(`ambiguous ${job.blueprintId} products after build ${job.commandId}`);
        await this.wait({ type: "entity_type_count", entity_type_id: job.blueprintId, at_least: job.priorCount + 1 });
      }
    } finally {
      await call(this.client, "set_progress_watch", { handle: this.handle, entity_ids: [] }).catch(() => undefined);
    }
  }
}

function ownedOfType(observation: Observation, type: string): GameEntity[] {
  return observation.owned_entities.filter(item => item.entity_type_id === type).sort((a, b) => idOf(a) - idOf(b));
}

function inventory(entity: GameEntity, resource: string): number {
  const entries = Array.isArray(entity.resources) ? entity.resources : [];
  const entry = entries.find(item => item && typeof item === "object" && (item as { resource_type?: string }).resource_type === resource);
  return Number((entry as { amount?: number } | undefined)?.amount ?? 0);
}

function assertSafeTravel(from: Point, to: Point, sources: GameEntity[], label: string): void {
  for (const source of sources) {
    const clearance = distanceToSegment(pointOf(source), from, to);
    if (clearance < RADIATION_RADIUS + 50) {
      throw new Error(`${label} route passes within ${Math.round(clearance)} units of radiation source ${String(source.id)}`);
    }
  }
}

/** The scripted equivalent of docs/mcp-test.md, with no LLM decisions. */
export async function runDiscoveryScenario(player: ScriptedPlayer): Promise<void> {
  let initial: Observation;
  while (true) {
    initial = await player.observe();
    if (ownedOfType(initial, "habitat").length && ownedOfType(initial, "worker").length >= 3) break;
    await new Promise(resolveDelay => setTimeout(resolveDelay, 500));
  }
  const habitats = ownedOfType(initial, "habitat");
  const workers = ownedOfType(initial, "worker");
  if (habitats.length !== 1 || workers.length !== 3) throw new Error("expected exactly one owned habitat and three starting workers");
  const habitat = habitats[0]!;
  const [mineralsWorker, foodWorker, builder] = workers;
  if (!mineralsWorker || !foodWorker || !builder) throw new Error("starting worker selection failed");
  if (inventory(habitat, "minerals") < 160 || inventory(habitat, "energy") < 110 || inventory(habitat, "food") < 50) {
    throw new Error("starting habitat inventory does not cover the planned builds and basic food reserve");
  }
  log("initial_entities", { habitat: habitat.id, workers: workers.map(item => item.id) });

  const sources = await player.visible(["star_yellow", "theta"]);
  const stars = sources.filter(item => item.entity_type_id === "star_yellow" && item.pos);
  const habitatStart = pointOf(habitat);
  stars.sort((a, b) => distance(pointOf(a), habitatStart) - distance(pointOf(b), habitatStart) || idOf(a) - idOf(b));
  const star = stars[0];
  if (!star) throw new Error("no player-visible yellow star");
  const starPos = pointOf(star);
  const separation = distance(starPos, habitatStart);
  if (separation <= RADIATION_RADIUS + 50) throw new Error("starting habitat is too close to the nearest star");
  const direction = { x: (habitatStart.x - starPos.x) / separation, y: (habitatStart.y - starPos.y) / separation };
  const solarSite = { x: starPos.x + direction.x * SOLAR_SITE_RADIUS, y: starPos.y + direction.y * SOLAR_SITE_RADIUS };
  const habitatSite = { x: starPos.x + direction.x * HABITAT_SITE_RADIUS, y: starPos.y + direction.y * HABITAT_SITE_RADIUS };
  for (const source of sources) {
    if (distance(pointOf(source), solarSite) < RADIATION_RADIUS + 200 + SOLAR_SPAWN_OFFSET ||
        distance(pointOf(source), habitatSite) < RADIATION_RADIUS + 100) {
      throw new Error(`planned sites are too close to radiation source ${String(source.id)}`);
    }
  }
  assertSafeTravel(pointOf(builder), solarSite, sources, "builder");
  assertSafeTravel(habitatStart, habitatSite, sources, "habitat");
  log("sites_selected", { star_id: star.id, solar_site: solarSite, habitat_site: habitatSite });

  await player.collect(idOf(mineralsWorker), "minerals");
  await player.collect(idOf(foodWorker), "food");
  await player.move(idOf(builder), solarSite);
  const refreshedSources = await player.visible(["star_yellow", "theta"]);
  for (const source of refreshedSources) {
    if (distance(pointOf(source), solarSite) < RADIATION_RADIUS + 200 + SOLAR_SPAWN_OFFSET) {
      throw new Error(`solar site became unsafe near source ${String(source.id)}`);
    }
  }
  assertSafeTravel(habitatStart, habitatSite, refreshedSources, "habitat");
  let habitatMoved = false;
  if (distance(habitatStart, solarSite) > 3_800) {
    log("habitat_relocation_before_build", { reason: "builder would leave habitat resource-sharing range" });
    await player.move(idOf(habitat), habitatSite);
    habitatMoved = true;
  }
  const solarBuild = await player.startBuild(idOf(builder), "collector_solar");
  if (!habitatMoved) await player.move(idOf(habitat), habitatSite);
  const solar = await player.finishBuild(solarBuild);
  const finalSources = await player.visible(["star_yellow", "theta"]);
  for (const source of finalSources) {
    if (distance(pointOf(source), pointOf(solar)) < RADIATION_RADIUS + 100) {
      throw new Error(`completed solar collector ${String(solar.id)} is too close to source ${String(source.id)}`);
    }
  }
  await player.collect(idOf(solar), "energy");
  await player.waitForSolarCollection(idOf(solar));
  const activeSolar = (await player.observe()).owned_entities.find(item => idOf(item) === idOf(solar));
  if (!activeSolar) throw new Error(`solar collector ${String(solar.id)} disappeared after collection started`);
  for (const source of await player.visible(["star_yellow", "theta"])) {
    if (distance(pointOf(source), pointOf(activeSolar)) < RADIATION_RADIUS + 100) {
      throw new Error(`collecting solar collector ${String(solar.id)} moved too close to source ${String(source.id)}`);
    }
  }

  const firstWorker = await player.finishBuild(await player.startBuild(idOf(habitat), "worker"));
  const secondWorker = await player.finishBuild(await player.startBuild(idOf(habitat), "worker"));
  await player.collect(idOf(firstWorker), "minerals");
  await player.collect(idOf(secondWorker), "food");
  log("scenario_complete", {
    habitat_id: habitat.id, star_id: star.id, solar_id: solar.id,
    initial_workers: workers.map(item => item.id), new_workers: [firstWorker.id, secondWorker.id],
  });
}

function parseConfig(argv: string[]): Config | undefined {
  if (argv[0] === "--") argv = argv.slice(1);
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index]!;
    if (!item.startsWith("--")) throw new Error(`unexpected argument: ${item}`);
    const equal = item.indexOf("=");
    const name = equal >= 0 ? item.slice(2, equal) : item.slice(2);
    if (!["allow-game-writes", "allow-remote", "help", "username", "base-url", "timeout-seconds"].includes(name)) {
      throw new Error(`unknown option --${name}`);
    }
    if (equal >= 0) args.set(name, item.slice(equal + 1));
    else if (["allow-game-writes", "allow-remote", "help"].includes(name)) args.set(name, "true");
    else {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`missing value for ${item}`);
      args.set(item.slice(2), value);
    }
  }
  if (args.has("help")) return undefined;
  if (!args.has("allow-game-writes")) throw new Error("pass --allow-game-writes to run the scenario");
  const username = args.get("username");
  if (!username || !/^loadtest-[a-zA-Z0-9_-]{1,48}$/.test(username)) throw new Error("--username must be a unique loadtest-* identity");
  const baseUrl = args.get("base-url") ?? "http://127.0.0.1:3000";
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("game URL must use HTTP(S)");
  const allowRemote = args.has("allow-remote");
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) && !allowRemote) {
    throw new Error("remote game URLs require --allow-remote");
  }
  const timeoutSeconds = Number(args.get("timeout-seconds") ?? 1_200);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) throw new Error("--timeout-seconds must be positive");
  return { username, baseUrl, timeoutSeconds, allowRemote };
}

export async function runScriptedPlayer(config: Config): Promise<void> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const environment = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
  const transport = new StdioClientTransport({
    command: process.execPath, args: ["--import", "tsx", "src/server.ts"],
    cwd: resolve(repoRoot, "packages/player-mcp"),
    env: {
      ...environment,
      BITWARS_PLAYER_MCP_ALLOW_WRITES: "1",
      BITWARS_PLAYER_MCP_BASE_URL: config.baseUrl,
      ...(config.allowRemote ? { BITWARS_PLAYER_MCP_ALLOW_REMOTE: "1" } : {}),
    },
  });
  const client = new Client({ name: "bitwars-scripted-player", version: "0.1.0" });
  let player: ScriptedPlayer | undefined;
  try {
    await client.connect(transport);
    log("scenario_start", { username: config.username, base_url: config.baseUrl });
    player = await ScriptedPlayer.connect(client, config.username, Date.now() + config.timeoutSeconds * 1_000);
    await runDiscoveryScenario(player);
  } finally {
    if (player) await player.disconnect().catch(error => log("disconnect_error", { error: String(error) }));
    await client.close().catch(() => undefined);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = parseConfig(process.argv.slice(2));
    if (config) await runScriptedPlayer(config);
    else console.log("pnpm --filter @bitwars/player-mcp scenario -- --username loadtest-scenario-1 --allow-game-writes [--timeout-seconds 1200]");
  } catch (error) {
    log("scenario_error", { error: String(error) });
    process.exitCode = 1;
  }
}
