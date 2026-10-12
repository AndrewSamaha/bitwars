import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("stdio MCP server", () => {
  it("advertises the player gateway tools", async () => {
    const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
      cwd: resolve(import.meta.dirname, ".."),
      env: {
        ...process.env,
        BITWARS_PLAYER_MCP_ALLOW_WRITES: "1",
        BITWARS_PLAYER_MCP_BASE_URL: "http://127.0.0.1:3000",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let pending = "";
    const replies = new Map<number, (value: Record<string, unknown>) => void>();
    child.stdout.on("data", chunk => {
      pending += String(chunk);
      let newline = pending.indexOf("\n");
      while (newline >= 0) {
        const line = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        const message = JSON.parse(line) as Record<string, unknown>;
        if (typeof message.id === "number") replies.get(message.id)?.(message);
        newline = pending.indexOf("\n");
      }
    });
    const call = (id: number, method: string, params: Record<string, unknown> = {}) =>
      new Promise<Record<string, unknown>>((resolveReply, reject) => {
        const timeout = setTimeout(() => reject(new Error(`MCP ${method} timed out`)), 5_000);
        replies.set(id, value => { clearTimeout(timeout); replies.delete(id); resolveReply(value); });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    try {
      const initialized = await call(1, "initialize", {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "gateway-test", version: "0.1.0" },
      });
      expect(initialized.error).toBeUndefined();
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
      const listed = await call(2, "tools/list");
      expect(listed.error).toBeUndefined();
      const names = ((listed.result as { tools: Array<{ name: string }> }).tools).map(tool => tool.name);
      expect(names).toEqual(expect.arrayContaining([
        "connect_player", "observe_events", "get_player_state", "set_progress_watch",
        "send_intent", "disconnect_player",
      ]));
      const invalidHandle = await call(3, "tools/call", {
        name: "get_player_state", arguments: { handle: "missing" },
      });
      expect(invalidHandle.error).toBeUndefined();
      expect(invalidHandle.result).toMatchObject({ isError: true });
    } finally {
      child.kill("SIGTERM");
    }
  }, 10_000);
});
