import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { PlayerGateway, type IntentInput, type WaitCondition } from "./playerGateway.js";

const baseUrl = process.env.BITWARS_PLAYER_MCP_BASE_URL ?? "http://127.0.0.1:3000";
const parsedUrl = new URL(baseUrl);
if (process.env.BITWARS_PLAYER_MCP_ALLOW_WRITES !== "1") {
  throw new Error("Set BITWARS_PLAYER_MCP_ALLOW_WRITES=1 to enable test-player login and intents");
}
if (!["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname) &&
    process.env.BITWARS_PLAYER_MCP_ALLOW_REMOTE !== "1") {
  throw new Error("Remote game targets require BITWARS_PLAYER_MCP_ALLOW_REMOTE=1");
}

const gateway = new PlayerGateway({ baseUrl, journalDir: process.env.BITWARS_PLAYER_MCP_JOURNAL_DIR });
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
const waitConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("command_terminal"), client_cmd_id: z.string().uuid() }),
  z.object({ type: z.literal("command_state"), client_cmd_id: z.string().uuid(), state: z.number().int().min(1).max(7) }),
  z.object({ type: z.literal("entity_type_count"), entity_type_id: z.string().min(1), at_least: z.number().int().nonnegative() }),
  z.object({ type: z.literal("collector_activity"), entity_id: entityId, activity: z.string().min(1), resource_type_id: z.string().min(1).optional() }),
  z.object({ type: z.literal("resource_at_least"), entity_id: entityId, resource_type_id: z.string().min(1), amount: z.number().finite().nonnegative() }),
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
  }, {
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
    description: "Read current player-visible entities, collector states, active intents, build progress, semantic cursor, and traffic counters.",
    inputSchema: handleSchema,
  }, ({ handle }) => tool(() => gateway.getPlayerState(handle))());
  server.registerTool("get_observation", {
    description: "Read the current player observation and semantic change cursor. Equivalent to get_player_state.",
    inputSchema: handleSchema,
  }, ({ handle }) => tool(() => gateway.getPlayerState(handle))());
  server.registerTool("get_visible_entities", {
    description: "Read currently player-visible entities, optionally filtered by entity type. Includes neutral stars and resource nodes; never reveals hidden entities.",
    inputSchema: handleSchema.extend({ entity_type_ids: z.array(z.string().min(1)).max(32).optional() }),
  }, ({ handle, entity_type_ids }) => tool(() => gateway.getVisibleEntities(handle, entity_type_ids))());
  server.registerTool("get_changes", {
    description: "Read ordered, durable player changes after a semantic cursor. Include run_id when continuing a prior observation.",
    inputSchema: handleSchema.extend({
      cursor: z.number().int().nonnegative().optional(),
      limit: z.number().int().min(1).max(500).optional(),
      run_id: z.string().min(1).optional(),
    }),
  }, ({ handle, cursor, limit, run_id }) => tool(() => gateway.getChanges(handle, cursor, limit, run_id))());
  server.registerTool("get_command", {
    description: "Read the HTTP receipt and latest lifecycle state for a command ID returned by send_intent.",
    inputSchema: handleSchema.extend({ client_cmd_id: z.string().uuid() }),
  }, ({ handle, client_cmd_id }) => tool(() => ({ command: gateway.getCommand(handle, client_cmd_id) }))());
  server.registerTool("get_gameplay_events", {
    description: "Read durable gameplay events visible to this player after a stream cursor, including entity destruction and its cause. Follow next_cursor while has_more is true.",
    inputSchema: handleSchema.extend({ after: z.string().regex(/^\d+-\d+$/) }),
  }, ({ handle, after }) => tool(() => gateway.getGameplayEvents(handle, after))());
  server.registerTool("wait_for_observation", {
    description: "Wait for a command, owned entity count, collector activity, or resource condition, then return the current observation.",
    inputSchema: handleSchema.extend({
      condition: waitConditionSchema,
      wait_ms: z.number().int().min(0).max(60_000).optional(),
      run_id: z.string().min(1).optional(),
    }),
  }, ({ handle, condition, wait_ms, run_id }) => tool(() => gateway.waitForObservation(handle, condition as WaitCondition, wait_ms, run_id))());
  server.registerTool("set_progress_watch", {
    description: "Watch progress for these owned entity IDs from the game's SSE stream, with v3 build-state polling if the stream is stale; an empty list stops the watch.",
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
