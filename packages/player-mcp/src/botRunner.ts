import { spawn, type ChildProcess } from "node:child_process";
import { closeSync, mkdirSync, openSync, readSync, fstatSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Config = {
  count: number;
  runTag: string;
  rampMs: number;
  timeoutSeconds: number;
  cleanupGraceSeconds: number;
  baseUrl: string;
  allowRemote: boolean;
  outputDir: string;
};

type ScenarioResult = {
  kind: "scenario_result";
  username: string;
  run_id?: string;
  success: boolean;
  duration_ms: number;
  error?: string;
  cleanup_errors?: string[];
};

type BotResult = {
  index: number;
  username: string;
  status: "succeeded" | "failed" | "not_started";
  started_at_ms?: number;
  ended_at_ms?: number;
  pid?: number;
  exit_code?: number | null;
  signal?: NodeJS.Signals | null;
  timed_out?: boolean;
  error?: string;
  scenario_result?: ScenarioResult;
  stdout_log?: string;
  stderr_log?: string;
};

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(packageDir, "../..");

function log(kind: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ kind, time_ms: Date.now(), ...data }));
}

function integerOption(args: Map<string, string>, name: string, fallback: number, min: number, max: number): number {
  const value = Number(args.get(name) ?? fallback);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`--${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

function parseConfig(argv: string[]): Config | undefined {
  if (argv[0] === "--") argv = argv.slice(1);
  const args = new Map<string, string>();
  const flags = new Set(["allow-game-writes", "allow-remote", "help"]);
  const options = new Set(["count", "run-tag", "ramp-ms", "timeout-seconds", "cleanup-grace-seconds", "base-url", "output-dir"]);
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index]!;
    if (!item.startsWith("--")) throw new Error(`unexpected argument: ${item}`);
    const equal = item.indexOf("=");
    const name = item.slice(2, equal < 0 ? undefined : equal);
    if (!flags.has(name) && !options.has(name)) throw new Error(`unknown option --${name}`);
    if (args.has(name)) throw new Error(`duplicate option --${name}`);
    if (flags.has(name)) {
      if (equal >= 0) throw new Error(`--${name} does not take a value`);
      args.set(name, "true");
    } else {
      const value = equal >= 0 ? item.slice(equal + 1) : argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`missing value for --${name}`);
      args.set(name, value);
    }
  }
  if (args.has("help")) return undefined;
  if (!args.has("allow-game-writes")) throw new Error("pass --allow-game-writes to run bots against the game");
  const runTag = args.get("run-tag");
  if (!runTag || !/^[a-zA-Z0-9_-]{1,35}$/.test(runTag)) {
    throw new Error("--run-tag must contain 1–35 letters, digits, underscores, or hyphens and be unique per run");
  }
  const count = integerOption(args, "count", 1, 1, 1000);
  const rampMs = integerOption(args, "ramp-ms", 500, 0, 60_000);
  const timeoutSeconds = integerOption(args, "timeout-seconds", 1_200, 1, 86_400);
  const cleanupGraceSeconds = integerOption(args, "cleanup-grace-seconds", 30, 1, 600);
  const baseUrl = args.get("base-url") ?? "http://127.0.0.1:3000";
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("game URL must use HTTP(S)");
  const allowRemote = args.has("allow-remote");
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) && !allowRemote) {
    throw new Error("remote game URLs require --allow-remote");
  }
  const outputDir = resolve(args.get("output-dir") ?? resolve(repoRoot, ".metrics/player-mcp/runs", runTag));
  return { count, runTag, rampMs, timeoutSeconds, cleanupGraceSeconds, baseUrl, allowRemote, outputDir };
}

function username(config: Config, index: number): string {
  const width = String(config.count).length;
  return `loadtest-${config.runTag}-${String(index).padStart(width, "0")}`;
}

function readScenarioResult(path: string, expectedUsername: string): ScenarioResult | undefined {
  const fd = openSync(path, "r");
  try {
    const size = fstatSync(fd).size;
    const length = Math.min(size, 65_536);
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, size - length);
    const lines = buffer.toString("utf8").split("\n");
    for (let index = lines.length - 1; index >= 0; index--) {
      try {
        const record: unknown = JSON.parse(lines[index]!);
        if (typeof record === "object" && record !== null && "kind" in record && record.kind === "scenario_result") {
          const result = record as ScenarioResult;
          if (result.username !== expectedUsername || typeof result.success !== "boolean") return undefined;
          return result;
        }
      } catch { /* Other stdout records need not be JSON. */ }
    }
    return undefined;
  } finally {
    closeSync(fd);
  }
}

function signalGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) return;
  try {
    if (process.platform !== "win32") process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch { /* The process has already exited. */ }
  }
}

function delay(ms: number, interrupted: AbortSignal): Promise<void> {
  if (ms === 0 || interrupted.aborted) return Promise.resolve();
  return new Promise(resolveDelay => {
    const finish = () => { clearTimeout(timer); interrupted.removeEventListener("abort", finish); resolveDelay(); };
    const timer = setTimeout(finish, ms);
    interrupted.addEventListener("abort", finish, { once: true });
  });
}

async function runBot(config: Config, index: number, live: Set<ChildProcess>, interrupted: AbortSignal): Promise<BotResult> {
  const name = username(config, index);
  const stdoutLog = resolve(config.outputDir, `${name}.stdout.jsonl`);
  const stderrLog = resolve(config.outputDir, `${name}.stderr.log`);
  const startedAt = Date.now();
  let stdoutFd: number | undefined;
  let stderrFd: number | undefined;
  try {
    stdoutFd = openSync(stdoutLog, "wx", 0o600);
    stderrFd = openSync(stderrLog, "wx", 0o600);
    const args = ["--import", "tsx", "src/scriptedPlayer.ts", "--username", name,
      "--allow-game-writes", "--timeout-seconds", String(config.timeoutSeconds), "--base-url", config.baseUrl];
    if (config.allowRemote) args.push("--allow-remote");
    const child = spawn(process.execPath, args, {
      cwd: packageDir,
      stdio: ["ignore", stdoutFd, stderrFd],
      detached: process.platform !== "win32",
    });
    closeSync(stdoutFd); stdoutFd = undefined;
    closeSync(stderrFd); stderrFd = undefined;
    live.add(child);
    log("bot_started", { index, username: name, pid: child.pid, stdout_log: stdoutLog, stderr_log: stderrLog });
    const outcome = await new Promise<{ code: number | null; signal: NodeJS.Signals | null; error?: string; timedOut: boolean }>(resolveOutcome => {
      let error: string | undefined;
      let timedOut = false;
      let killTimer: NodeJS.Timeout | undefined;
      const onAbort = () => {
        signalGroup(child, "SIGTERM");
        if (!killTimer) killTimer = setTimeout(() => signalGroup(child, "SIGKILL"), 5_000);
      };
      interrupted.addEventListener("abort", onAbort, { once: true });
      const watchdog = setTimeout(() => {
        timedOut = true;
        signalGroup(child, "SIGTERM");
        if (!killTimer) killTimer = setTimeout(() => signalGroup(child, "SIGKILL"), 5_000);
      }, (config.timeoutSeconds + config.cleanupGraceSeconds) * 1_000);
      child.once("error", failure => { error = String(failure); });
      child.once("close", (code, signal) => {
        clearTimeout(watchdog);
        if (killTimer) clearTimeout(killTimer);
        interrupted.removeEventListener("abort", onAbort);
        live.delete(child);
        resolveOutcome({ code, signal, error, timedOut });
      });
      if (interrupted.aborted) onAbort();
    });
    let scenarioResult: ScenarioResult | undefined;
    try { scenarioResult = readScenarioResult(stdoutLog, name); }
    catch (error) { outcome.error = `${outcome.error ?? ""} cannot read scenario result: ${String(error)}`.trim(); }
    const succeeded = outcome.code === 0 && !outcome.timedOut && scenarioResult?.success === true;
    const result: BotResult = {
      index, username: name, status: succeeded ? "succeeded" : "failed",
      started_at_ms: startedAt, ended_at_ms: Date.now(), pid: child.pid,
      exit_code: outcome.code, signal: outcome.signal, timed_out: outcome.timedOut,
      ...(outcome.error ? { error: outcome.error } : {}),
      ...(scenarioResult ? { scenario_result: scenarioResult } : {}),
      stdout_log: stdoutLog, stderr_log: stderrLog,
    };
    log("bot_finished", { index, username: name, status: result.status, exit_code: result.exit_code,
      signal: result.signal, timed_out: result.timed_out, run_id: scenarioResult?.run_id });
    return result;
  } catch (error) {
    log("bot_finished", { index, username: name, status: "failed", error: String(error) });
    return { index, username: name, status: "failed", started_at_ms: startedAt, ended_at_ms: Date.now(),
      error: String(error), stdout_log: stdoutLog, stderr_log: stderrLog };
  } finally {
    if (stdoutFd !== undefined) closeSync(stdoutFd);
    if (stderrFd !== undefined) closeSync(stderrFd);
  }
}

export async function runBotRunner(config: Config): Promise<boolean> {
  mkdirSync(dirname(config.outputDir), { recursive: true });
  mkdirSync(config.outputDir); // Fail on a reused tag/directory; never overwrite earlier evidence.
  const startedAt = Date.now();
  const controller = new AbortController();
  const live = new Set<ChildProcess>();
  let interruptSignal: NodeJS.Signals | undefined;
  const interrupt = (signal: NodeJS.Signals) => {
    if (!controller.signal.aborted) {
      interruptSignal = signal;
      controller.abort();
      for (const child of live) signalGroup(child, "SIGTERM");
      log("runner_interrupted", { signal, live_bots: live.size });
    } else {
      for (const child of live) signalGroup(child, "SIGKILL");
    }
  };
  const onSigint = () => interrupt("SIGINT");
  const onSigterm = () => interrupt("SIGTERM");
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);
  const pending: Promise<BotResult>[] = [];
  let nextIndex = 1;
  try {
    for (; nextIndex <= config.count && !controller.signal.aborted; nextIndex++) {
      pending.push(runBot(config, nextIndex, live, controller.signal));
      if (nextIndex < config.count) await delay(config.rampMs, controller.signal);
    }
    const results = await Promise.all(pending);
    for (let index = nextIndex; index <= config.count; index++) {
      results.push({ index, username: username(config, index), status: "not_started" });
    }
    const succeeded = results.filter(result => result.status === "succeeded").length;
    const failed = results.filter(result => result.status === "failed").length;
    const notStarted = results.filter(result => result.status === "not_started").length;
    const success = succeeded === config.count && !interruptSignal;
    const summaryPath = resolve(config.outputDir, "summary.json");
    const summary = { kind: "runner_result", run_tag: config.runTag, success, count: config.count,
      ramp_ms: config.rampMs, timeout_seconds: config.timeoutSeconds,
      cleanup_grace_seconds: config.cleanupGraceSeconds, base_url: config.baseUrl,
      succeeded, failed, not_started: notStarted, interrupted_by: interruptSignal,
      started_at_ms: startedAt, ended_at_ms: Date.now(), duration_ms: Date.now() - startedAt,
      output_dir: config.outputDir, results };
    writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    log("runner_result", { run_tag: config.runTag, success, count: config.count, succeeded, failed,
      not_started: notStarted, interrupted_by: interruptSignal, summary_path: summaryPath });
    return success;
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = parseConfig(process.argv.slice(2));
    if (config) {
      if (!await runBotRunner(config)) process.exitCode = 1;
    } else {
      console.log("pnpm --filter @bitwars/player-mcp bot-runner -- --count N --run-tag UNIQUE_TAG --allow-game-writes [--ramp-ms 500] [--timeout-seconds 1200] [--cleanup-grace-seconds 30] [--base-url URL] [--allow-remote] [--output-dir PATH]");
    }
  } catch (error) {
    console.error(JSON.stringify({ kind: "runner_error", time_ms: Date.now(), error: String(error) }));
    process.exitCode = 1;
  }
}
