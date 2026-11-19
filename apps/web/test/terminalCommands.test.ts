import { afterEach, describe, expect, it, vi } from "vitest";
import { executeTerminalCommand, type TerminalCommandContext } from "@/features/hud/terminal/commands";
import { type Entity, game } from "@/features/gamestate/world";
import { appendMessageLog, type MessageLogEntry } from "@/features/hud/messageLog";

const added: Entity[] = [];

afterEach(() => {
  for (const entity of added.splice(0)) game.world.remove(entity);
  vi.unstubAllGlobals();
});

describe("log", () => {
  it("links entity labels in collection and starvation messages with and without timestamps", async () => {
    const context: TerminalCommandContext = {
      realPlayerId: "player-a", effectivePlayerId: "player-a", actingAsId: null,
      sessionStatus: "active" as const,
      messageLog: [
        { kind: "collection-spacing-waiting", title: "Collection blocked", message: "Collector 42 is too close to another active collector. Move it farther away and restart, or wait for an automatic retry.", timestamp: 1,
          focusEntityId: "42", focusLabel: "Collector 42" },
        { kind: "resource-starvation", title: "Resource starvation", message: "worker 680 is taking damage because it lacks resources for maintenance.", timestamp: 2,
          focusEntityId: "680", focusLabel: "worker 680" },
      ],
      logout: async () => "", su: () => {}, exitSu: () => {},
    };
    for (const command of ["log", "log -ts"]) {
      const result = await executeTerminalCommand(command, context);
      expect(result.links).toHaveLength(2);
      expect(result.links!.map(link => [result.output.slice(link.start, link.end), link.entityId])).toEqual([
        ["Collector 42", "42"],
        ["worker 680", "680"],
      ]);
    }
  });

  it("retains the latest 100 messages and prints them with optional original timestamps", async () => {
    let messageLog: MessageLogEntry[] = [];
    for (let index = 0; index < 105; index += 1) {
      messageLog = appendMessageLog(messageLog, {
        kind: "collection-spacing-waiting", title: "Collection blocked", message: `Collector ${index} is waiting.`,
        timestamp: Date.UTC(2026, 9, 8, 12, 0, index),
      });
    }
    expect(messageLog).toHaveLength(100);
    expect(messageLog[0].message).toBe("Collector 5 is waiting.");
    expect(messageLog[99].message).toBe("Collector 104 is waiting.");
    const context = {
      realPlayerId: "player-a", effectivePlayerId: "player-a", actingAsId: null,
      sessionStatus: "active" as const, messageLog,
      logout: async () => "", su: () => {}, exitSu: () => {},
    };

    const plain = await executeTerminalCommand("log", context);
    expect(plain.output.split("\n")).toEqual(messageLog.map(entry => `${entry.title}: ${entry.message}`));
    const timestamped = await executeTerminalCommand("log -ts", context);
    expect(timestamped.output.split("\n")).toEqual(messageLog.map(entry =>
      `[${new Date(entry.timestamp).toLocaleString()}] ${entry.title}: ${entry.message}`,
    ));
    expect((await executeTerminalCommand("log", { ...context, messageLog: [] })).output).toBe("No messages logged.");
    expect((await executeTerminalCommand("log --bad", context)).output).toBe("usage: log [-ts]");
    expect((await executeTerminalCommand("log -ts extra", context)).output).toBe("usage: log [-ts]");
    expect((await executeTerminalCommand("help", context)).output).toContain("log [-ts]");
  });
});

describe("ls", () => {
  const context: TerminalCommandContext = {
    realPlayerId: "player-a", effectivePlayerId: "raiders", actingAsId: "raiders",
    sessionStatus: "active", logout: async () => "", su: () => {}, exitSu: () => {},
  };

  it("filters partial names without case sensitivity and keeps sorted row links", async () => {
    added.push(
      game.world.add({ id: 12003, owner_player_id: "raiders", entity_type_id: "heavy_fighter" }),
      game.world.add({ id: 7, owner_player_id: "raiders", entity_type_id: "fighter_v1" }),
      game.world.add({ id: 42, owner_player_id: "raiders", entity_type_id: "worker" }),
      game.world.add({ id: 1, owner_player_id: "player-a", entity_type_id: "fighter_v1" }),
      game.world.add({ id: 2, entity_type_id: "fighter_v1" }),
    );
    for (const command of ["ls figh", "ls FiGh"]) {
      const result = await executeTerminalCommand(command, context);
      const rows = ["7       fighter_v1", "12003       heavy_fighter"];
      expect(result.output).toBe(["id      entity_type", ...rows].join("\n"));
      expect(result.links).toEqual([
        { start: 20, end: 20 + rows[0].length, entityId: "7" },
        { start: 21 + rows[0].length, end: result.output.length, entityId: "12003" },
      ]);
      expect(result.links?.map(link => result.output.slice(link.start, link.end))).toEqual(rows);
    }
    for (const filter of ["missing", "figh*", "figh.*", "fighter v1"]) {
      expect(await executeTerminalCommand(`ls ${filter}`, context)).toEqual({
        output: `No owned entities match "${filter}".`,
      });
    }
    expect(await executeTerminalCommand("ls   \t ", context)).toEqual(await executeTerminalCommand("ls", context));
    expect((await executeTerminalCommand("help", context)).output).toContain("ls [filter]");
  });

  it("joins parsed arguments into one literal search phrase", async () => {
    added.push(game.world.add({ id: 7, owner_player_id: "raiders", entity_type_id: "heavy fighter" }));
    expect((await executeTerminalCommand("ls heavy   fighter", context)).output).toBe(
      "id      entity_type\n7       heavy fighter",
    );
    expect((await executeTerminalCommand("ls fighter heavy", context)).output).toBe(
      'No owned entities match "fighter heavy".',
    );
  });

  it("links each complete row to its sorted ID using effective ownership", async () => {
    added.push(
      game.world.add({ id: 12003, owner_player_id: "raiders", entity_type_id: "worker" }),
      game.world.add({ id: 7, owner_player_id: "raiders", entity_type_id: "worker" }),
      game.world.add({ id: 42, owner_player_id: "raiders", entity_type_id: "collector_solar_v2" }),
      game.world.add({ id: 81, owner_player_id: "raiders" }),
      game.world.add({ id: 1, owner_player_id: "player-a", entity_type_id: "worker" }),
      game.world.add({ id: 2, entity_type_id: "worker" }),
    );
    const result = await executeTerminalCommand("ls", context);
    const rows = ["7       worker", "42       collector_solar_v2", "81       (no type)", "12003       worker"];
    expect(result.output).toBe(["id      entity_type", ...rows].join("\n"));
    expect(result.links?.map(link => [result.output.slice(link.start, link.end), link.entityId])).toEqual(
      rows.map((row, index) => [row, ["7", "42", "81", "12003"][index]]),
    );
    let offset = "id      entity_type".length + 1;
    expect(result.links).toHaveLength(rows.length);
    result.links!.forEach((link, index) => {
      expect(link.start).toBe(offset);
      expect(link.end).toBe(offset + rows[index].length);
      offset = link.end + 1;
    });
  });

  it("does not link empty, unauthenticated, or ending-session output", async () => {
    for (const overrides of [
      {}, { effectivePlayerId: null }, { realPlayerId: null }, { sessionStatus: "logging-out" as const },
    ]) {
      const result = await executeTerminalCommand("ls", { ...context, ...overrides });
      expect(result.links ?? []).toEqual([]);
      expect(result.output).not.toContain("id      entity_type");
    }
    expect((await executeTerminalCommand("ls", context)).output).toBe("No entities owned by you.");
    expect((await executeTerminalCommand("ls figh", context)).output).toBe("No entities owned by you.");
  });
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
