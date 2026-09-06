import { afterEach, describe, expect, it, vi } from "vitest";
import { executeTerminalCommand } from "@/features/hud/terminal/commands";
import { type Entity, game } from "@/features/gamestate/world";

const added: Entity[] = [];

afterEach(() => {
  for (const entity of added.splice(0)) game.world.remove(entity);
  vi.unstubAllGlobals();
});

describe("who", () => {
  it("lists active players with their current unit counts", async () => {
    added.push(
      game.world.add({ id: 1, owner_player_id: "player-a" }),
      game.world.add({ id: 2, owner_player_id: "player-a" }),
      game.world.add({ id: 3, owner_player_id: "player-b" }),
      game.world.add({ id: 4, owner_player_id: "neutral" }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "player-b", name: "Beta" },
        { id: "player-a", name: "Alpha" },
      ],
    }));

    const result = await executeTerminalCommand("who", {
      realPlayerId: "player-a",
      effectivePlayerId: "player-a",
      actingAsId: null,
      sessionStatus: "active",
      logout: async () => "",
      su: () => {},
      exitSu: () => {},
    });

    expect(result.output).toBe("player  units\nAlpha   2\nBeta    1\nNPCs    1");
  });

  it("switches to NPCs and exits the su session without logging out", async () => {
    const su = vi.fn();
    const exitSu = vi.fn();
    const logout = vi.fn().mockResolvedValue("Logged out.");
    const context = {
      realPlayerId: "player-a",
      effectivePlayerId: "player-a",
      actingAsId: null,
      sessionStatus: "active" as const,
      logout,
      su,
      exitSu,
    };

    const suResult = await executeTerminalCommand("su npc", context);
    expect(su).toHaveBeenCalledWith("neutral");
    expect(suResult.output).toBe("Now acting as NPCs. Use exit to return.");

    const exitResult = await executeTerminalCommand("exit", { ...context, actingAsId: "neutral" });
    expect(exitSu).toHaveBeenCalledOnce();
    expect(logout).not.toHaveBeenCalled();
    expect(exitResult.output).toBe("Returned to your session.");
  });
});
