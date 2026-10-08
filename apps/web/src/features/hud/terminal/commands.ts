import { game } from "@/features/gamestate/world";
import { contentManager } from "@/features/content/contentManager";
import type { SessionStatus } from "@/features/users/components/identity/SessionContext";
import type { MessageLogEntry } from "@/features/hud/messageLog";

const SYSTEM_OWNERS = [
  { id: "raiders", name: "Raiders" },
  { id: "universe", name: "Universe" },
];

export type TerminalCommandContext = {
  realPlayerId: string | null;
  effectivePlayerId: string | null;
  actingAsId: string | null;
  sessionStatus: SessionStatus;
  messageLog?: readonly MessageLogEntry[];
  logout: () => Promise<string>;
  su: (playerId: string) => void;
  exitSu: () => void;
};

export type TerminalCommandResult = {
  output: string;
  sessionEnded?: boolean;
};

type TerminalCommand = {
  name: string;
  aliases?: string[];
  description: string;
  requiresAuth?: boolean;
  run: (
    args: string[],
    context: TerminalCommandContext,
  ) => TerminalCommandResult | Promise<TerminalCommandResult>;
};

function listOwnedEntities(myPlayerId: string | null): string {
  if (myPlayerId == null) {
    return "Not logged in. List shows only your entities after you log in.";
  }

  const entities: Array<{ id: number | string; entityTypeId: string }> = [];
  for (const entity of game.world.with("id")) {
    if (entity.owner_player_id !== myPlayerId) continue;
    entities.push({
      id: entity.id,
      entityTypeId: entity.entity_type_id ?? "(no type)",
    });
  }

  entities.sort((a, b) => Number(a.id) - Number(b.id));
  if (entities.length === 0) return "No entities owned by you.";

  return [
    "id      entity_type",
    ...entities.map((entity) => `${entity.id}       ${entity.entityTypeId}`),
  ].join("\n");
}

async function listPlayers(): Promise<string> {
  const response = await fetch("/api/players/getActive", { cache: "no-store" });
  if (!response.ok) throw new Error("who: unable to list players");
  const players = await response.json() as Array<{ id: string; name: string }>;

  const unitsByPlayer = new Map<string, number>();
  for (const entity of game.world.with("owner_player_id")) {
    const ownerId = entity.owner_player_id;
    if (ownerId) unitsByPlayer.set(ownerId, (unitsByPlayer.get(ownerId) ?? 0) + 1);
  }

  players.push(...SYSTEM_OWNERS);
  const nameWidth = Math.max("player".length, ...players.map((player) => player.name.length));
  return [
    `${"player".padEnd(nameWidth)}  units`,
    ...players
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((player) => `${player.name.padEnd(nameWidth)}  ${unitsByPlayer.get(player.id) ?? 0}`),
  ].join("\n");
}

async function resolveSuTarget(input: string): Promise<{ id: string; name: string } | null> {
  const systemOwner = SYSTEM_OWNERS.find((owner) =>
    owner.id === (input.toLowerCase() === "npc" ? "raiders" : input.toLowerCase()),
  );
  if (systemOwner) {
    return systemOwner;
  }
  const response = await fetch("/api/players/getActive", { cache: "no-store" });
  if (!response.ok) throw new Error("su: unable to list players");
  const players = await response.json() as Array<{ id: string; name: string }>;
  const target = input.toLowerCase();
  return players.find((player) => player.id === input || player.name.toLowerCase() === target) ?? null;
}

const commands: TerminalCommand[] = [
  {
    name: "log",
    description: "Show the last 100 toast messages: log [-ts] (include timestamps)",
    requiresAuth: true,
    run: (args, context) => {
      if (args.length > 1 || (args.length === 1 && args[0] !== "-ts")) {
        return { output: "usage: log [-ts]" };
      }
      const entries = context.messageLog ?? [];
      return { output: entries.length === 0 ? "No messages logged." : entries.map((entry) => {
        const prefix = args[0] === "-ts" ? `[${new Date(entry.timestamp).toLocaleString()}] ` : "";
        return `${prefix}${entry.title}: ${entry.message}`;
      }).join("\n") };
    },
  },
  {
    name: "scenario",
    description: "scenario list|status|validate <id>|load <id>|reload|pause|resume|step [ticks]|bookmark <id> [tags...] [--entities=1,2]",
    requiresAuth: true,
    run: async (args) => {
      const [action = "status", id, ...rest] = args;
      if (["list", "status"].includes(action)) {
        const response = await fetch("/api/content/scenarios", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) return { output: data.error ?? "Unable to access scenarios" };
        return { output: action === "status" ? JSON.stringify(data.runtime, null, 2)
          : data.scenarios.map((item: { id: string; name: string; tags?: string[] }) => `${item.id}: ${item.name} [${(item.tags ?? []).join(", ")}]`).join("\n") || "No scenarios" };
      }
      if (!["validate", "load", "reload", "pause", "resume", "step", "bookmark"].includes(action)
        || (["validate", "load", "bookmark"].includes(action) && !id)
        || (["reload", "pause", "resume"].includes(action) && args.length > 1)
        || (["validate", "load"].includes(action) && args.length > 2)
        || (action === "step" && (args.length > 2 || (id !== undefined && !/^\d+$/.test(id)))))
        return { output: "usage: scenario list|status|validate <id>|load <id>|reload|pause|resume|step [ticks]|bookmark <id> [tags...] [--entities=1,2]" };
      const body: Record<string, unknown> = { action, run_id: game.runId || undefined };
      if (["validate", "load", "bookmark"].includes(action)) body.id = id;
      if (action === "step") body.ticks = id === undefined ? 1 : Number(id);
      if (action === "bookmark") {
        body.tags = rest.filter(tag => !tag.startsWith("--entities="));
        const selected = rest.find(argument => argument.startsWith("--entities="));
        if (selected) body.entity_ids = selected.slice("--entities=".length).split(",").map(Number);
      }
      const response = await fetch("/api/content/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      let data = await response.json();
      if (!response.ok && response.status !== 202) return { output: `scenario: ${data.error ?? "Command failed"}` };
      const requestId = data.request_id;
      const deadline = Date.now() + 10_000;
      while (data.pending && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const result = await fetch(`/api/content/scenarios?request_id=${encodeURIComponent(requestId)}`, { cache: "no-store" });
        data = await result.json();
        if (!result.ok && result.status !== 202) return { output: `scenario: ${data.error ?? "Could not read result"}` };
      }
      if (data.pending) return { output: `scenario: request ${requestId} is pending; check that the engine is running.` };
      if (!data.ok) return { output: `scenario: ${data.error}` };
      return { output: data.result?.saved_id ? `Bookmark saved: ${data.result.saved_id}`
        : `${action} accepted. ${JSON.stringify(data.result?.runtime ?? {})}` };
    },
  },
  {
    name: "debug",
    description: "Lua capture: debug <on|off|state> [owner id] (defaults to current owner)",
    requiresAuth: true,
    run: async (args, context) => {
      const [action, explicitOwner] = args;
      if (!["on", "off", "state"].includes(action) || args.length > 2) {
        return { output: "usage: debug <on|off|state> [owner id]" };
      }
      const owner = explicitOwner ?? context.effectivePlayerId;
      if (!owner) return { output: "debug: no current owner" };
      const response = await fetch(`/api/v2/script-debug?owner=${encodeURIComponent(owner)}`, {
        cache: "no-store",
        ...(action === "state" ? {} : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: action === "on" }),
        }),
      });
      if (!response.ok) throw new Error("debug: unable to access Lua debug settings");
      const data = await response.json();
      return { output: action === "state" ? JSON.stringify(data, null, 2)
        : `Lua state capture ${action} for ${owner}.${action === "on" ? " Expires in one hour; use debug state to inspect. Only active scripting owners publish snapshots." : ""}` };
    },
  },
  {
    name: "spawn-raiders",
    description: "Spawn NPC raiders: spawn-raiders <count> (requires su npc)",
    requiresAuth: true,
    run: async (args, context) => {
      if (context.actingAsId !== "raiders") {
        return { output: "spawn-raiders: use `su npc` first" };
      }
      if (args.length !== 1 || !/^\d+$/.test(args[0])) {
        return { output: "usage: spawn-raiders <count>" };
      }
      const count = Number(args[0]);
      const response = await fetch("/api/v2/spawn-raiders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        return { output: `spawn-raiders: ${data?.error ?? "request failed"}` };
      }
      return {
        output: `Queued ${data.queued} raider${data.queued === 1 ? "" : "s"}; the engine will spawn them on its next tick.`,
      };
    },
  },
  {
    name: "help",
    description: "List available commands",
    run: () => ({ output: formatHelp() }),
  },
  {
    name: "ls",
    description: "List your units",
    requiresAuth: true,
    run: (_args, context) => ({ output: listOwnedEntities(context.effectivePlayerId) }),
  },
  {
    name: "desc",
    description: "Show an entity's health and resources: desc <entity_id|entity_type[index]>",
    requiresAuth: true,
    run: (args, context) => {
      if (args.length !== 1) {
        return { output: "usage: desc <entity_id|entity_type[index]>" };
      }
      const selector = args[0];
      const entities = [...game.world.with("id")];
      let entity = /^\d+$/.test(selector)
        ? entities.find((candidate) => String(candidate.id) === selector)
        : undefined;
      if (!/^\d+$/.test(selector)) {
        const match = /^([a-zA-Z0-9_-]+)(?:\[(\d+)\])?$/.exec(selector);
        if (!match) return { output: "usage: desc <entity_id|entity_type[index]>" };
        const [, entityTypeId, indexText] = match;
        const matches = entities
          .filter((candidate) => candidate.owner_player_id === context.realPlayerId)
          .filter((candidate) => candidate.entity_type_id === entityTypeId)
          .sort((a, b) => Number(a.id) - Number(b.id));
        const index = indexText === undefined ? 0 : Number(indexText);
        entity = matches[index];
        if (!entity) {
          return { output: `desc: ${entityTypeId}[${index}] not found (${matches.length} owned)` };
        }
      }
      if (!entity) return { output: `desc: entity ${args[0]} not found in your visible world` };
      if (entity.owner_player_id !== context.realPlayerId) {
        return { output: "desc: resource inventory is only available for entities you own" };
      }

      const maxHealth = contentManager.getEntityType(entity.entity_type_id ?? "")?.health;
      const health = Number((entity.health ?? 0).toFixed(3));
      const amounts = new Map((entity.resources ?? []).map(({ resource_type, amount }) => [resource_type, amount]));
      const resourceTypes = contentManager.getContent()?.resource_types ?? {};
      const resourceIds = [...new Set([...Object.keys(resourceTypes), ...amounts.keys()])].sort((a, b) =>
        (resourceTypes[a]?.order ?? Number.MAX_SAFE_INTEGER) - (resourceTypes[b]?.order ?? Number.MAX_SAFE_INTEGER)
        || a.localeCompare(b),
      );
      const lines = resourceIds.map((id) => `${id}: ${Number((amounts.get(id) ?? 0).toFixed(3))}`);
      const cargo = entity.collector_state;
      if (cargo?.resource_type && cargo.carry_amount > 0) {
        lines.push(`transport cargo (${cargo.resource_type}): ${Number(cargo.carry_amount.toFixed(3))}`);
      }
      return {
        output: [
          `Entity ${entity.id} (${entity.entity_type_id ?? "unknown"})`,
          `health: ${health}/${maxHealth === undefined ? "?" : Number(maxHealth.toFixed(3))}`,
          ...lines,
        ].join("\n"),
      };
    },
  },
  {
    name: "who",
    description: "List active players and their units",
    requiresAuth: true,
    run: async () => ({ output: await listPlayers() }),
  },
  {
    name: "su",
    description: "View and control an active player or NPC faction",
    requiresAuth: true,
    run: async (args, context) => {
      const input = args.join(" ").trim();
      if (!input) return { output: "usage: su <player name, id, raiders, universe, or npc>" };
      const target = await resolveSuTarget(input);
      if (!target) return { output: `su: ${input}: player not found` };
      context.su(target.id);
      return { output: `Now acting as ${target.name}. Use exit to return.` };
    },
  },
  {
    name: "exit",
    description: "Return from su, or log out",
    requiresAuth: true,
    run: async (_args, context) => {
      if (context.actingAsId) {
        context.exitSu();
        return { output: "Returned to your session." };
      }
      return { output: await context.logout(), sessionEnded: true };
    },
  },
  {
    name: "logout",
    description: "End the current session",
    requiresAuth: true,
    run: async (_args, context) => ({ output: await context.logout(), sessionEnded: true }),
  },
];

function formatHelp(): string {
  const commandWidth = Math.max(
    ...commands.map((command) =>
      [command.name, ...(command.aliases ?? [])].join(", ").length
    ),
  );
  return commands
    .map((command) => {
      const names = [command.name, ...(command.aliases ?? [])].join(", ");
      return `${names.padEnd(commandWidth)}  ${command.description}`;
    })
    .join("\n");
}

const commandsByName = new Map<string, TerminalCommand>();
for (const command of commands) {
  commandsByName.set(command.name, command);
  for (const alias of command.aliases ?? []) commandsByName.set(alias, command);
}

export async function executeTerminalCommand(
  input: string,
  context: TerminalCommandContext,
): Promise<TerminalCommandResult> {
  const [name = "", ...args] = input.trim().split(/\s+/);
  const command = commandsByName.get(name.toLowerCase());
  if (!command) return { output: `${name}: command not found` };
  if (command.requiresAuth && !context.realPlayerId) {
    return { output: `${command.name}: authentication required` };
  }
  if (command.requiresAuth && context.sessionStatus !== "active") {
    return { output: `${command.name}: logout in progress` };
  }
  return command.run(args, context);
}
