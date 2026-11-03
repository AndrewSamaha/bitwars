import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), command: vi.fn() }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: mocks.auth }));
vi.mock("@/lib/content/scenarios", () => ({
  scenarioCommand: mocks.command, getScenarioRuntime: vi.fn(), listScenarios: vi.fn(),
  parseScenario: vi.fn(), readScenario: vi.fn(), saveScenario: vi.fn(), scenarioId: vi.fn(), scenarioResult: vi.fn(),
}));
import { POST } from "../src/app/api/content/scenarios/route";
import { executeTerminalCommand } from "@/features/hud/terminal/commands";
import { game } from "@/features/gamestate/world";

const playerId = "12345678-1234-4234-8234-123456789abc";
const context = {
  realPlayerId: playerId, effectivePlayerId: playerId, actingAsId: null,
  sessionStatus: "active" as const, messageLog: [],
  logout: async () => "", su: () => {}, exitSu: () => {},
};
const request = () => new Request("http://localhost/api/content/scenarios", {
  method: "POST", body: JSON.stringify({ action: "world_respawn", run_id: "old-run", player_id: "forged" }),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ auth: { playerId }, res: null });
  mocks.command.mockResolvedValue({ ok: true });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("queues respawn for the authenticated player and preserves the world epoch", async () => {
  expect((await POST(request())).status).toBe(200);
  expect(mocks.command).toHaveBeenCalledWith({ action: "world_respawn", run_id: "old-run" }, playerId);
});

it("requires authentication and the scenario production switch", async () => {
  mocks.auth.mockResolvedValueOnce({ res: new Response(null, { status: 401 }) });
  expect((await POST(request())).status).toBe(401);
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SCENARIOS_ENABLED", "false");
  expect((await POST(request())).status).toBe(403);
  expect(mocks.command).not.toHaveBeenCalled();
});

it("submits world respawn and reports engine errors", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
  vi.stubGlobal("fetch", fetchMock);
  expect((await executeTerminalCommand("world respawn", context)).output).toContain("Your player has respawned");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: "world_respawn", run_id: game.runId || undefined });
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "invalid spawn config" }), { status: 400 }));
  expect((await executeTerminalCommand("world respawn", context)).output).toContain("invalid spawn config");
  fetchMock.mockClear();
  expect((await executeTerminalCommand("world respawn extra", context)).output).toBe("usage: world respawn");
  expect(fetchMock).not.toHaveBeenCalled();
});
