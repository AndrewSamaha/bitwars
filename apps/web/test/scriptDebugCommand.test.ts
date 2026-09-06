import { afterEach, expect, it, vi } from "vitest";
import { executeTerminalCommand } from "@/features/hud/terminal/commands";

afterEach(() => vi.unstubAllGlobals());
it("toggles capture for the effective owner and supports explicit inspection", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: true }) });
  vi.stubGlobal("fetch", fetch);
  const context = {
    realPlayerId: "player", effectivePlayerId: "raiders", actingAsId: "raiders",
    sessionStatus: "active" as const, logout: async () => "", su: () => {}, exitSu: () => {},
  };
  await executeTerminalCommand("debug on", context);
  expect(fetch).toHaveBeenLastCalledWith("/api/v2/script-debug?owner=raiders",
    expect.objectContaining({ method: "POST", body: '{"enabled":true}' }));
  await executeTerminalCommand("debug off", context);
  expect(fetch).toHaveBeenLastCalledWith("/api/v2/script-debug?owner=raiders",
    expect.objectContaining({ method: "POST", body: '{"enabled":false}' }));
  await executeTerminalCommand("debug state player", context);
  expect(fetch).toHaveBeenLastCalledWith("/api/v2/script-debug?owner=player", { cache: "no-store" });
});
