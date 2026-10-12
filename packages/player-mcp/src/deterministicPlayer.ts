import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { mkdir, createWriteStream } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CallToolResult } from "@modelcontextprotocol/client";
import { DeterministicPolicy, type PlayerProfile } from "./deterministicPolicy.js";
import type { GameEntity, IntentInput } from "./playerGateway.js";
import type { PlayerChange } from "./observationJournal.js";

type BotConfig = {
  username: string;
  seed: string;
  profile: PlayerProfile;
  baseUrl: string;
  durationSeconds: number;
  stepMs: number;
  stepTicks?: number;
  jitterPercent: number;
  moveRadius: number;
  entityTypeId?: string;
  blueprintId?: string;
  logPath: string;
  allowRemote: boolean;
};

type PlayerState = {
  username: string;
  player_id?: string;
  run_id?: string;
  client_seq: number;
  tick?: number | string;
  connected: boolean;
  ready: boolean;
  owned_entities: GameEntity[];
  change_cursor: number;
  history_complete: boolean;
  progress: Record<string, unknown>;
  metrics: Record<string, number>;
  last_error?: string;
};

type ChangeBatch = { changes: PlayerChange[]; next_cursor: number; has_more: boolean; gap: boolean; run_id?: string; observation?: PlayerState };

function parseArgs(argv: string[]): Map<string, string> {
  const result = new Map<string, string>();
  if (argv[0] === "--") argv = argv.slice(1);
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index]!;
    if (!item.startsWith("--")) throw new Error(`unexpected argument: ${item}`);
    const equals = item.indexOf("=");
    if (equals >= 0) {
      result.set(item.slice(2, equals), item.slice(equals + 1));
    } else if (["allow-game-writes", "allow-remote", "help"].includes(item.slice(2))) {
      result.set(item.slice(2), "true");
    } else {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`missing value for ${item}`);
      result.set(item.slice(2), value);
    }
  }
  return result;
}

function positiveNumber(args: Map<string, string>, name: string, fallback: number): number {
  const value = Number(args.get(name) ?? fallback);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`--${name} must be a positive number`);
  return value;
}

function readConfig(argv: string[]): BotConfig | undefined {
  const args = parseArgs(argv);
  if (args.has("help")) return undefined;
  if (!args.has("allow-game-writes")) {
    throw new Error("This bot logs in a player and can submit game intents; pass --allow-game-writes to run it.");
  }
  const username = args.get("username");
  if (!username) throw new Error("--username loadtest-... is required");
  if (!/^loadtest-[a-zA-Z0-9_-]{1,48}$/.test(username)) throw new Error("--username must start with loadtest-");
  const seed = args.get("seed");
  if (!seed) throw new Error("--seed is required for reproducible behavior");
  const profile = args.get("profile") ?? "observer";
  if (!["observer", "mover", "builder"].includes(profile)) throw new Error("--profile must be observer, mover, or builder");
  const baseUrl = args.get("base-url") ?? "http://127.0.0.1:3000";
  const parsedUrl = new URL(baseUrl);
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname);
  const allowRemote = args.has("allow-remote");
  if (!isLoopback && !allowRemote) throw new Error("remote game URLs require --allow-remote");
  const jitterPercent = Number(args.get("jitter-percent") ?? 15);
  if (!Number.isFinite(jitterPercent) || jitterPercent < 0 || jitterPercent > 100) {
    throw new Error("--jitter-percent must be between 0 and 100");
  }
  const config: BotConfig = {
    username, seed, profile: profile as PlayerProfile, baseUrl,
    durationSeconds: positiveNumber(args, "duration-seconds", 60),
    stepMs: positiveNumber(args, "step-ms", 1500),
    jitterPercent,
    moveRadius: positiveNumber(args, "move-radius", 100),
    logPath: resolve(args.get("log-path") ?? `.metrics/player-mcp/${username}-${seed}.jsonl`),
    allowRemote,
  };
  if (args.has("step-ticks")) {
    const stepTicks = positiveNumber(args, "step-ticks", 1);
    if (!Number.isSafeInteger(stepTicks)) throw new Error("--step-ticks must be a positive integer");
    config.stepTicks = stepTicks;
  }
  const entityTypeId = args.get("entity-type-id");
  const blueprintId = args.get("blueprint-id");
  if (entityTypeId) config.entityTypeId = entityTypeId;
  if (blueprintId) config.blueprintId = blueprintId;
  if (config.profile === "builder" && !config.blueprintId) throw new Error("builder profile requires --blueprint-id");
  return config;
}

function help(): string {
  return [
    "Deterministic MCP player",
    "",
    "pnpm --filter @bitwars/player-mcp bot -- --username loadtest-a --seed run-1 --profile mover --allow-game-writes",
    "",
    "Options: --username --seed --profile observer|mover|builder --duration-seconds",
    "        --step-ms --step-ticks --jitter-percent --move-radius --entity-type-id --blueprint-id",
    "        --base-url --allow-remote --allow-game-writes --log-path",
  ].join("\n");
}

function resultData<T>(result: CallToolResult): T {
  if (result.isError) {
    const message = result.content.filter(item => item.type === "text").map(item => item.text).join("\n");
    throw new Error(message || "MCP tool call failed");
  }
  if (result.structuredContent !== undefined) return result.structuredContent as T;
  const text = result.content.find(item => item.type === "text")?.text;
  if (!text) throw new Error("MCP tool returned no structured result");
  return JSON.parse(text) as T;
}

async function call<T>(client: Client, name: string, args: Record<string, unknown>): Promise<T> {
  return resultData<T>(await client.callTool({ name, arguments: args }));
}

function record(stream: ReturnType<typeof createWriteStream>, value: unknown): void {
  stream.write(`${JSON.stringify(value)}\n`);
}

function lifecycle(event: PlayerChange): { clientCmdId?: string; state?: number; reason?: string } | undefined {
  if (event.kind !== "lifecycle") return undefined;
  const data = event.data.lifecycle as Record<string, unknown> | undefined;
  if (!data) return undefined;
  return {
    clientCmdId: typeof data.clientCmdId === "string" ? data.clientCmdId : undefined,
    state: Number.isFinite(Number(data.state)) ? Number(data.state) : undefined,
    reason: typeof data.reason === "string" ? data.reason : undefined,
  };
}

async function wait(ms: number): Promise<void> {
  await new Promise(resolveDelay => setTimeout(resolveDelay, ms));
}

export async function runDeterministicPlayer(config: BotConfig): Promise<void> {
  const directory = dirname(config.logPath);
  await new Promise<void>((resolveDir, reject) => mkdir(directory, { recursive: true }, error => error ? reject(error) : resolveDir()));
  const log = createWriteStream(config.logPath, { flags: "a" });
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const inheritedEnv = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "src/server.ts"],
    cwd: resolve(repoRoot, "packages/player-mcp"),
    env: {
      ...inheritedEnv,
      BITWARS_PLAYER_MCP_ALLOW_WRITES: "1",
      BITWARS_PLAYER_MCP_BASE_URL: config.baseUrl,
      ...(config.allowRemote ? { BITWARS_PLAYER_MCP_ALLOW_REMOTE: "1" } : {}),
    },
  });
  const client = new Client({ name: "bitwars-deterministic-player", version: "0.1.0" });
  const policy = new DeterministicPolicy(config.seed, {
    profile: config.profile,
    moveRadius: config.moveRadius,
    entityTypeId: config.entityTypeId,
    blueprintId: config.blueprintId,
  });
  let handle: string | undefined;
  let stopping = false;
  let cursor = 0;
  let nextActionAt = 0;
  let nextActionTick: number | undefined;
  let actionsSent = 0;
  let actionsRejected = 0;
  let pendingBuild: { commandId: string; entityId: number } | undefined;
  let completedBuilds = 0;
  const buildTerminalStates = new Set([5, 6, 7]);
  const stop = () => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await client.connect(transport);
    record(log, { kind: "run", timestamp_ms: Date.now(), seed: config.seed, username: config.username, profile: config.profile, config });
    const connected = await call<{ handle: string }>(client, "connect_player", { username: config.username });
    handle = connected.handle;
    record(log, { kind: "player_connected", timestamp_ms: Date.now(), handle });

    const deadline = Date.now() + config.durationSeconds * 1000;
    let state = await call<PlayerState>(client, "get_observation", { handle });
    while (!state.ready && !stopping && Date.now() < deadline) {
      await wait(100);
      state = await call<PlayerState>(client, "get_observation", { handle });
    }
    if (!state.ready) throw new Error(`player did not become ready: ${state.last_error ?? "connection timeout"}`);
    if (!state.history_complete) throw new Error("player observation history is incomplete");
    cursor = state.change_cursor;
    record(log, { kind: "player_ready", timestamp_ms: Date.now(), player_id: state.player_id, run_id: state.run_id, tick: state.tick });
    nextActionAt = Date.now();
    if (config.stepTicks !== undefined) {
      const tick = Number(state.tick);
      if (!Number.isSafeInteger(tick)) throw new Error("tick-based scheduling requires a safe integer game tick");
      nextActionTick = tick;
    }

    while (!stopping && Date.now() < deadline) {
      if (!state.ready) {
        await wait(100);
        state = await call<PlayerState>(client, "get_observation", { handle });
        continue;
      }

      const currentTick = Number(state.tick);
      if (config.stepTicks !== undefined && !Number.isSafeInteger(currentTick)) throw new Error("game tick is not a safe integer");
      if (config.stepTicks !== undefined ? currentTick >= nextActionTick! : Date.now() >= nextActionAt) {
        const randomStateBefore = policy.getRandomState();
        const decision = policy.decide({
          tick: state.tick,
          ownedEntities: state.owned_entities,
          hasPendingBuild: pendingBuild !== undefined,
        });
        const decisionRandomState = policy.getRandomState();
        record(log, {
          kind: "decision", timestamp_ms: Date.now(), random_state_before: randomStateBefore,
          random_state_after: decisionRandomState, input: {
            tick: state.tick, owned_entities: decision.candidates,
            has_pending_build: pendingBuild !== undefined,
          }, decision,
        });
        if (decision.action) {
          const submittedAt = Date.now();
          const response = await call<{ accepted_http: boolean; status: number; client_seq: number; client_cmd_id: string; result: unknown }>(
            client, "send_intent", { handle, intent: decision.action as IntentInput },
          );
          const latencyMs = Date.now() - submittedAt;
          if (response.accepted_http) {
            actionsSent++;
            if (decision.action.type === "Build") {
              pendingBuild = { commandId: response.client_cmd_id, entityId: decision.action.entity_id };
              await call(client, "set_progress_watch", { handle, entity_ids: [decision.action.entity_id] });
            }
          } else {
            actionsRejected++;
          }
          record(log, {
            kind: "intent_result", timestamp_ms: Date.now(), latency_ms: latencyMs,
            client_seq: response.client_seq, client_cmd_id: response.client_cmd_id,
            status: response.status, accepted_http: response.accepted_http,
            action: decision.action, result: response.result,
          });
        }
        const interval = config.stepTicks ?? config.stepMs;
        const maxJitter = Math.floor(interval * config.jitterPercent / 100);
        const jitter = policy.nextJitter(maxJitter);
        if (config.stepTicks !== undefined) {
          nextActionTick = currentTick + config.stepTicks + jitter;
          record(log, { kind: "schedule", timestamp_ms: Date.now(), next_tick: nextActionTick, random_state: policy.getRandomState() });
        } else {
          nextActionAt = Date.now() + config.stepMs + jitter;
          record(log, { kind: "schedule", timestamp_ms: Date.now(), next_delay_ms: config.stepMs + jitter, random_state: policy.getRandomState() });
        }
      }

      const batch = await call<ChangeBatch>(client, "get_changes", {
        handle, cursor, limit: 500, run_id: state.run_id,
      });
      if (batch.gap) {
        record(log, { kind: "observation_gap", timestamp_ms: Date.now(), cursor, next_cursor: batch.next_cursor, observation: batch.observation });
        throw new Error("observation history has a gap; reconcile before continuing");
      }
      cursor = batch.next_cursor;
      for (const event of batch.changes) {
        const stateEvent = lifecycle(event);
        if (!stateEvent) continue;
        record(log, { kind: "lifecycle", timestamp_ms: event.received_at_ms, change_cursor: event.cursor, ...stateEvent });
        if (pendingBuild?.commandId === stateEvent.clientCmdId && stateEvent.state !== undefined && buildTerminalStates.has(stateEvent.state)) {
          if (stateEvent.state === 5) completedBuilds++;
          pendingBuild = undefined;
          await call(client, "set_progress_watch", { handle, entity_ids: [] });
        }
      }
      state = await call<PlayerState>(client, "get_observation", { handle });
      if (!batch.has_more) await wait(Math.min(100, Math.max(0, deadline - Date.now())));
    }

    record(log, {
      kind: "summary", timestamp_ms: Date.now(), duration_seconds: config.durationSeconds,
      actions_sent: actionsSent, actions_rejected: actionsRejected, completed_builds: completedBuilds,
      player_state: handle ? await call(client, "get_observation", { handle }) : undefined,
    });
  } finally {
    if (handle) {
      await call(client, "disconnect_player", { handle }).catch(error => {
        record(log, { kind: "disconnect_error", timestamp_ms: Date.now(), error: String(error) });
      });
    }
    await client.close().catch(() => undefined);
    await new Promise<void>(resolveLog => log.end(resolveLog));
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}

const usage = help();
const entryPoint = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPoint === fileURLToPath(import.meta.url)) {
  try {
    const config = readConfig(process.argv.slice(2));
    if (!config) {
      console.log(usage);
    } else {
      await runDeterministicPlayer(config);
      console.log(`Player run complete; replay log: ${config.logPath}`);
    }
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
  }
}
