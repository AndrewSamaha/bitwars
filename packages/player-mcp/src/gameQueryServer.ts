import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const baseUrl = new URL(process.env.BITWARS_GAME_QUERY_BASE_URL ?? "http://127.0.0.1:3000");
if (baseUrl.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname)) {
  throw new Error("Game-query MCP requires a local HTTP game endpoint");
}

async function query(path: string) {
  try {
    const response = await fetch(new URL(`/api/v2/game-query/${path}`, baseUrl), {
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`Game-query HTTP ${response.status}: ${await response.text()}`);
    const value = await response.json();
    return { content: [{ type: "text" as const, text: JSON.stringify(value) }] };
  } catch (error) {
    return { content: [{ type: "text" as const, text: String(error) }], isError: true };
  }
}

function createServer() {
  const server = new McpServer({ name: "bitwars-game-query", version: "0.1.0" }, {
    instructions: "Read-only authoritative game inspection, including hidden entities. Uses the existing game-query HTTP API, not a player session. Compare snapshot ticks and player ledger spend_total to distinguish consumption from transfers. Published snapshots may skip simulation ticks. Owner IDs are identifiers, not necessarily usernames. No writes or Redis access are exposed.",
  });
  const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  for (const [name, path, description] of [
    ["get_snapshot", "snapshot", "Read the latest authoritative snapshot: entities, resources, player spending ledgers, orders, convoys, and collector states."],
    ["get_owners", "owners", "List owner IDs represented in the current authoritative snapshot."],
    ["get_scenarios", "scenarios", "Read active scenario status, tick, pause state, and saved scenario metadata."],
  ]) {
    server.registerTool(name, { description, inputSchema: z.object({}), annotations }, () => query(path));
  }
  server.registerTool("get_entity", {
    description: "Read one authoritative entity by numeric ID, including its current resources.",
    inputSchema: z.object({ entity_id: z.string().regex(/^\d+$/).or(z.number().int().positive().safe()) }),
    annotations,
  }, ({ entity_id }) => query(`entities/${entity_id}`));
  server.registerTool("get_script_debug", {
    description: "Read an owner's Lua debug setting and most recent captured state. Does not enable capture.",
    inputSchema: z.object({ owner: z.string().min(1) }),
    annotations,
  }, ({ owner }) => query(`script-debug?${new URLSearchParams({ owner })}`));
  return server;
}

void serveStdio(createServer);
