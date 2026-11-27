import { lstat, realpath } from "node:fs/promises";
import { createConnection } from "node:net";
import path from "node:path";
import { CONTENT_ROOT, contentSha256 } from "../contentRevisionFiles";
import { battleError } from "./access";

export const BATTLE_REVISION_ROOT = path.join(CONTENT_ROOT, ".battle-revisions");
// Keep in sync with Rust's battle::draft::load_revision.
const MIB = 1024 * 1024;
export const BATTLE_REVISION_LIMITS = { manifestBytes: MIB / 2, assetBytes: 2 * MIB, totalAssetBytes: 16 * MIB };
export const MAX_DRAFT_BYTES = 128 * 1024;
const MAX_RESPONSE = 256 * 1024 + 4; // Body plus three status digits and newline.

export async function boundedBody(request: Request, limit: number) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > limit) return battleError(413, "request_limit", `Request cannot exceed ${limit / 1024} KiB.`);
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const bytes = Buffer.allocUnsafe(limit);
  let total = 0;
  const timer = setTimeout(() => { void reader.cancel("request timeout").catch(() => {}); }, 10_000);
  const deadline = Date.now() + 10_000;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (Date.now() >= deadline) return battleError(408, "request_timeout", "Request took too long. Retry the submission.");
      if (done) return bytes.subarray(0, total);
      if (total + value.byteLength > limit) {
        void reader.cancel("request too large").catch(() => {});
        return battleError(413, "request_limit", `Request cannot exceed ${limit / 1024} KiB.`);
      }
      bytes.set(value, total);
      total += value.byteLength;
    }
  } catch {
    return battleError(400, "request_failed", "The request could not be read. Retry the submission.");
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

type Command = { action: "submit" } | { action: "catalog"; revision: string }
  | { action: "status"; run_id: string } | { action: "replay"; run_id: string; page: number };

async function socketPath() {
  const workspace = await realpath(path.resolve(CONTENT_ROOT, "../.."));
  const dir = `/tmp/bitwars-battle-${contentSha256(workspace).slice(0, 24)}`;
  const socket = path.join(dir, "runner.sock");
  const uid = process.geteuid?.();
  const owner = await lstat(dir);
  if (!owner.isDirectory() || owner.uid !== uid || (owner.mode & 0o777) !== 0o700) throw new Error("Invalid runner directory");
  const endpoint = await lstat(socket);
  if (!endpoint.isSocket() || endpoint.uid !== uid || (endpoint.mode & 0o777) !== 0o600) throw new Error("Invalid runner socket");
  return socket;
}

export async function runnerRequest(owner: string, command: Command, signal: AbortSignal, body?: Buffer) {
  try {
    const path = await socketPath();
    const socket = createConnection({ path, signal });
    const chunks: Buffer[] = [];
    let size = 0;
    const timeout = setTimeout(() => socket.destroy(new Error("Runner response timeout")), 17_000);
    socket.once("connect", () => {
      socket.write(`${JSON.stringify({ ...command, owner })}\n`);
      if (body) socket.end(body);
      else socket.end();
    });
    try {
      for await (const chunk of socket) {
        size += chunk.length;
        if (size > MAX_RESPONSE) throw new Error("Runner response limit");
        chunks.push(chunk);
      }
    } finally {
      clearTimeout(timeout);
      socket.destroy();
    }
    const result = Buffer.concat(chunks, size);
    if (result[3] !== 10) throw new Error("Malformed runner status");
    const status = Number(result.subarray(0, 3).toString("ascii"));
    if (!Number.isInteger(status) || status < 200 || status > 599) throw new Error("Malformed runner status");
    return new Response(new Uint8Array(result.subarray(4)), {
      status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return battleError(503, "runner_unavailable", "Battle runner unavailable. Check the @bitwars/battle-runner dev task and retry.");
  }
}
