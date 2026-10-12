import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { PlayerGateway, type IntentInput } from "./playerGateway.js";

const baseUrl = process.env.BITWARS_PLAYER_MCP_BASE_URL ?? "http://127.0.0.1:3000";
const parsedUrl = new URL(baseUrl);
if (process.env.BITWARS_PLAYER_MCP_ALLOW_WRITES !== "1") {
  throw new Error("Set BITWARS_PLAYER_MCP_ALLOW_WRITES=1 to enable test-player login and intents");
}
if (!["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname) &&
    process.env.BITWARS_PLAYER_MCP_ALLOW_REMOTE !== "1") {
  throw new Error("Remote game targets require BITWARS_PLAYER_MCP_ALLOW_REMOTE=1");
}

const gateway = new PlayerGateway({ baseUrl });
const handleSchema = z.object({ handle: z.string().min(1) });
const entityId = z.number().int().positive().safe();
const policy = z.enum(["REPLACE_ACTIVE", "APPEND", "CLEAR_THEN_APPEND"]).optional();
const intentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Move"), entity_id: entityId, target: z.object({ x: z.number().finite(), y: z.number().finite() }), policy }),
  z.object({ type: z.literal("Build"), entity_id: entityId, blueprint_id: z.string().min(1), policy }),
  z.object({ type: z.literal("Upgrade"), entity_id: entityId, target_entity_type_id: z.string().min(1), policy }),
  z.object({ type: z.literal("Research"), entity_id: entityId, technology_id: z.string().min(1), policy }),
  z.object({ type: z.literal("Collect"), entity_id: entityId, resource_type_id: z.string().min(1).optional(), nearest_compatible: z.boolean().optional(), policy }),
  z.object({ type: z.literal("Repair"), entity_id: entityId, target_id: entityId, policy }),
  z.object({ type: z.literal("Deliver"), entity_id: entityId, target_id: entityId, resource_type_ids: z.array(z.string().min(1)).min(1).max(64), policy }),
  z.object({ type: z.literal("Transport"), entity_id: entityId, target_id: entityId, donor_id: entityId, resource_type_ids: z.array(z.string().min(1)).min(1).max(64), policy }),
]);

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value as Record<string, unknown>,
  };
}

function tool(handler: () => Promise<unknown> | unknown) {
  return async () => {
    try { return result(await handler()); }
    catch (error) {
      return { content: [{ type: "text" as const, text: String(error) }], isError: true };
    }
  };
}

function createServer() {
  const server = new McpServer({
    name: "bitwars-player",
    version: "0.1.0",
    instructions: [
      "Bitwars is a real-time space strategy game. Players manage habitats and workers, gather resources, and build units and structures.",
      "Resource nodes are identified by entity type: planet_blue provides food, minerals provides minerals, and star_yellow provides energy through proximity collection. Yellow stars also cause radiation damage within 1200 world units; keep entities well outside that radius.",
      "After connect_player, wait until the player state or event stream reports ready before acting. Collect requires exactly one of resource_type_id or nearest_compatible. Build has no placement coordinate; completed products spawn near the builder, so inspect state or events for the resulting entity and position.",
      "Player intents change the active game world. Use only an authorized disposable game and disconnect when finished.",
    ].join(" "),
  });
  server.registerTool("connect_player", {
    description: "Log in as a loadtest-* player and open its game SSE connection. Only use on a disposable game.",
    inputSchema: z.object({ username: z.string().regex(/^loadtest-[a-zA-Z0-9_-]{1,48}$/) }),
  }, ({ username }) => tool(() => gateway.connectPlayer(username))());
  server.registerTool("observe_events", {
    description: "Read a bounded batch of this player's game SSE events after a cursor; reports dropped-event gaps.",
    inputSchema: handleSchema.extend({
      cursor: z.number().int().nonnegative().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      wait_ms: z.number().int().min(0).max(5000).optional(),
    }),
  }, ({ handle, cursor, limit, wait_ms }) => tool(() => gateway.observeEvents(handle, cursor, limit, wait_ms))());
  server.registerTool("get_player_state", {
    description: "Read the gateway's player-visible state, owned entities, progress, and per-player traffic counters.",
    inputSchema: handleSchema,
  }, ({ handle }) => tool(() => gateway.getPlayerState(handle))());
  server.registerTool("set_progress_watch", {
    description: "Poll the union of these owned entity IDs via the game's v3 build-state endpoint every 500 ms; an empty list stops polling.",
    inputSchema: handleSchema.extend({ entity_ids: z.array(entityId).max(1000) }),
  }, ({ handle, entity_ids }) => tool(() => gateway.setProgressWatch(handle, entity_ids))());
  server.registerTool("send_intent", {
    description: "Submit an intent for an owned entity using this player's current run and next sequence.",
    inputSchema: handleSchema.extend({ intent: intentSchema }),
  }, ({ handle, intent }) => tool(() => gateway.sendIntent(handle, intent as IntentInput))());
  server.registerTool("disconnect_player", {
    description: "Close the player's game SSE stream, progress timer, and event buffer.",
    inputSchema: handleSchema,
  }, ({ handle }) => tool(() => gateway.disconnectPlayer(handle))());
  return server;
}

process.once("SIGINT", () => { gateway.close(); process.exit(0); });
process.once("SIGTERM", () => { gateway.close(); process.exit(0); });
void serveStdio(createServer);
console.error(`Bitwars player MCP ready for ${parsedUrl.origin} (stdio)`);
