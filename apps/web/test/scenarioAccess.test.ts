import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), command: vi.fn(), list: vi.fn(), runtime: vi.fn() }));
vi.mock("@/features/users/utils/auth", () => ({ getOptionalAuth: mocks.auth }));
vi.mock("@/lib/content/scenarios", () => ({
  getScenarioRuntime: mocks.runtime,
  listScenarios: mocks.list,
  scenarioCommand: mocks.command,
  parseScenario: vi.fn(), readScenario: vi.fn(), saveScenario: vi.fn(), scenarioId: vi.fn(), scenarioResult: vi.fn(),
}));
import { GET, POST } from "../src/app/api/content/scenarios/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(null);
  mocks.list.mockResolvedValue([]);
  mocks.runtime.mockResolvedValue({ run_id: "test-run" });
  mocks.command.mockResolvedValue({ ok: true });
});

it("allows listing scenarios without a session", async () => {
  const response = await GET(new Request("http://localhost/api/content/scenarios"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ scenarios: [], runtime: { run_id: "test-run" } });
});

it("allows anonymous commands with a stable player binding", async () => {
  for (let i = 0; i < 2; i++) {
    const response = await POST(new Request("http://localhost/api/content/scenarios", {
      method: "POST", body: JSON.stringify({ action: "load", yaml: "scenario" }),
    }));
    expect(response.status).toBe(200);
  }
  expect(mocks.command).toHaveBeenCalledWith({ action: "load", yaml: "scenario" }, "00000000-0000-4000-8000-000000000001");
});

it("preserves the signed-in player's binding", async () => {
  const playerId = "12345678-1234-4234-8234-123456789abc";
  mocks.auth.mockResolvedValue({ playerId });
  const response = await POST(new Request("http://localhost/api/content/scenarios", {
    method: "POST", body: JSON.stringify({ action: "load", yaml: "scenario" }),
  }));
  expect(response.status).toBe(200);
  expect(mocks.command).toHaveBeenCalledWith({ action: "load", yaml: "scenario" }, playerId);
});
