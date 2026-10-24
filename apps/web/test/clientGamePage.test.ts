import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ status: "logged-out" }));
vi.mock("@/features/users/components/identity/SessionContext", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => session,
}));
vi.mock("@/features/users/components/identity/PlayerContext", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/hud/components/HUDContext", () => ({
  HUDProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/gamestate/components/GameStreamGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/hud/components/TerminalPanel", () => ({
  default: () => React.createElement("input", { "aria-label": "Terminal login" }),
}));
vi.mock("@/features/gamestate/components/GameConnectionOverlay", () => ({
  default: () => React.createElement("div", null, "Connection overlay"),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/features/audio/components/AudioEventBridge", () => ({ default: () => null }));
vi.mock("@/features/gamestate/components/GameStateStreamBridge", () => ({ default: () => null }));
vi.mock("@/features/hud/components/EntityDetailPanel", () => ({ default: () => null }));
vi.mock("@/features/intent-queue/IntentQueuePanel", () => ({ default: () => null }));
vi.mock("@/features/hud/components/ResourceHUD", () => ({ ResourceHUD: () => null }));
vi.mock("@/features/hud/components/LifecycleToasts", () => ({ default: () => null }));

import ClientGamePage from "@/app/play/ClientGamePage";

vi.stubGlobal("React", React);
afterAll(() => vi.unstubAllGlobals());
const render = () => renderToStaticMarkup(React.createElement(ClientGamePage, { initialPlayer: null }));

describe("session connection blocking", () => {
  it.each(["logged-out", "logging-in", "logging-out"])("keeps the terminal interactive while %s without a live connection", (status) => {
    session.status = status;
    const html = render();
    expect(html).toContain('<div><input aria-label="Terminal login"/></div>');
    expect(html).not.toContain("Connection overlay");
  });

  it("blocks the terminal and mounts the overlay during an active session awaiting connection", () => {
    session.status = "active";
    const html = render();
    expect(html).toContain('<div inert=""><input aria-label="Terminal login"/></div>');
    expect(html).toContain("Connection overlay");
  });
});
