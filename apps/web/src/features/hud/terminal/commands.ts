import { game } from "@/features/gamestate/world";

export type TerminalCommandContext = {
  myPlayerId: string | null;
};

export type TerminalCommandResult = {
  output: string;
  navigateTo?: string;
};

type TerminalCommand = {
  name: string;
  aliases?: string[];
  description: string;
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

const commands: TerminalCommand[] = [
  {
    name: "help",
    description: "List available commands",
    run: () => ({ output: formatHelp() }),
  },
  {
    name: "ls",
    description: "List your units",
    run: (_args, context) => ({ output: listOwnedEntities(context.myPlayerId) }),
  },
  {
    name: "logout",
    aliases: ["exit"],
    description: "End the current session",
    run: async () => {
      const response = await fetch("/api/players/logout", { method: "POST" });
      if (!response.ok) throw new Error(`Logout failed (${response.status})`);
      return { output: "Logged out.", navigateTo: "/" };
    },
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
  return command.run(args, context);
}
