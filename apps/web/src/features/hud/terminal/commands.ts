import { game } from "@/features/gamestate/world";
import type { SessionStatus } from "@/features/users/components/identity/SessionContext";

const SYSTEM_OWNERS = [
  { id: "raiders", name: "Raiders" },
  { id: "universe", name: "Universe" },
];

export type TerminalCommandContext = {
  realPlayerId: string | null;
  effectivePlayerId: string | null;
  actingAsId: string | null;
  sessionStatus: SessionStatus;
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
