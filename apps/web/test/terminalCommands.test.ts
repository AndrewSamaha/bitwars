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
      game.world.add({ id: 4, owner_player_id: "raiders" }),
      game.world.add({ id: 5, owner_player_id: "universe" }),
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

    expect(result.output).toBe("player    units\nAlpha     2\nBeta      1\nRaiders   1\nUniverse  1");
  });

  it("switches to raiders and exits the su session without logging out", async () => {
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
    expect(su).toHaveBeenCalledWith("raiders");
    expect(suResult.output).toBe("Now acting as Raiders. Use exit to return.");

    const exitResult = await executeTerminalCommand("exit", { ...context, actingAsId: "raiders" });
    expect(exitSu).toHaveBeenCalledOnce();
    expect(logout).not.toHaveBeenCalled();
    expect(exitResult.output).toBe("Returned to your session.");
  });

  it("queues raiders only while acting as the NPC faction", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ queued: 12 }),
    });
    vi.stubGlobal("fetch", fetch);
    const context = {
      realPlayerId: "player-a",
      effectivePlayerId: "raiders",
      actingAsId: "raiders",
      sessionStatus: "active" as const,
      logout: async () => "",
      su: () => {},
      exitSu: () => {},
    };

    const result = await executeTerminalCommand("spawn-raiders 12", context);

    expect(fetch).toHaveBeenCalledWith("/api/v2/spawn-raiders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 12 }),
    });
    expect(result.output).toBe("Queued 12 raiders; the engine will spawn them on its next tick.");
  });
});
