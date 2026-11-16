import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  autoDefinitions: false,
  session: { status: "active", effectivePlayerId: "player-a" as string | null },
  content: {
    status: "loading",
    error: undefined as { message: string } | undefined,
  },
  listeners: new Set<() => void>(),
  history: [] as { output: string }[],
}));
vi.mock("@/features/users/components/identity/SessionContext", () => ({
  useSession: () => fixture.session,
}));
vi.mock("@/features/hud/components/HUDContext", () => {
  const actions = {
    pushCommandHistory: (entry: { output: string }) =>
      fixture.history.push(entry),
  };
  return { useHUD: () => ({ actions }) };
});
vi.mock("@/features/content/contentManager", () => ({
  contentManager: {
    getSyncState: () => fixture.content,
    subscribeSyncState: (listener: () => void) => {
      fixture.listeners.add(listener);
      return () => fixture.listeners.delete(listener);
    },
  },
}));
import {
  BootProvider,
  useBoot,
} from "../src/features/gamestate/components/BootContext";
import { gameConnection } from "../src/features/gamestate/connection";
let boot: ReturnType<typeof useBoot>;
let root: ReactTestRenderer;
function Probe() {
  boot = useBoot();
  React.useEffect(() => {
    if (fixture.autoDefinitions) boot.definitionsLoaded();
  }, []);
  return null;
}
const tree = () =>
  React.createElement(BootProvider, null, React.createElement(Probe));
function live() {
  gameConnection.opened();
  gameConnection.receivedSnapshot();
  gameConnection.reconciledIntents();
  gameConnection.health(true);
}
function graphics(status: string) {
  fixture.content = {
    status,
    error: status === "failed" ? { message: "Texture failed" } : undefined,
  };
  fixture.listeners.forEach((listener) => listener());
}
beforeEach(async () => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fixture.autoDefinitions = false;
  fixture.session = { status: "active", effectivePlayerId: "player-a" };
  fixture.content = { status: "loading", error: undefined };
  fixture.history.length = 0;
  gameConnection.reset();
  await act(async () => {
    root = create(tree());
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

it("treats an authenticated refresh as initial boot and waits for renderer acknowledgment", async () => {
  expect(boot.recovering).toBe(false);
  expect(boot.visible).toBe(false);
  await act(async () => {
    boot.definitionsLoaded();
    live();
  });
  expect(boot.ready).toBe(false);
  expect(boot.busy).toBe(true);
  expect(fixture.history).toHaveLength(0);
  await act(async () => graphics("synchronized"));
  expect(boot.ready).toBe(true);
  expect(boot.visible).toBe(true);
  expect(fixture.history).toHaveLength(1);
  expect(fixture.history[0].output).toContain("[OK] Battlefield ready.");
});
it("keeps the last battlefield through repeated interruptions and completes recovery only after synchronization", async () => {
  await act(async () => {
    boot.definitionsLoaded();
    live();
    graphics("synchronized");
  });
  for (let index = 0; index < 2; index++) {
    await act(async () => gameConnection.disconnect());
    expect(boot.visible).toBe(true);
    expect(boot.recovering).toBe(true);
    expect(boot.busy).toBe(true);
    await act(async () => gameConnection.opened());
    expect(boot.milestones[0].done).toBe(true);
    expect(boot.ready).toBe(false);
    await act(async () => live());
    expect(boot.ready).toBe(true);
    expect(boot.recovering).toBe(false);
  }
  expect(
    fixture.history
      .map((entry) => entry.output)
      .filter((output) => output.includes("Connection restored.")),
  ).toHaveLength(2);
});
it("does not label a content reload as transport recovery and exposes a usable retry", async () => {
  await act(async () => {
    boot.definitionsLoaded();
    live();
    graphics("synchronized");
  });
  await act(async () => graphics("loading"));
  expect(boot.recovering).toBe(false);
  expect(boot.busy).toBe(true);
  expect(boot.visible).toBe(true);
  await act(async () => graphics("failed"));
  expect(boot.error).toBe("Texture failed");
  const attempt = boot.attempt;
  await act(async () => boot.retry());
  expect(boot.attempt).toBe(attempt + 1);
  expect(boot.ready).toBe(false);
});
it("resets startup on effective-player changes and logout/login even with a live singleton", async () => {
  await act(async () => {
    boot.definitionsLoaded();
    live();
    graphics("synchronized");
  });
  await act(async () => {
    fixture.session.effectivePlayerId = "player-b";
    root.update(tree());
  });
  expect(boot.ready).toBe(false);
  expect(boot.visible).toBe(false);
  expect(boot.recovering).toBe(false);
  await act(async () => {
    fixture.session = { status: "logged-out", effectivePlayerId: null };
    root.update(tree());
  });
  expect(boot.busy).toBe(false);
  await act(async () => {
    fixture.session = { status: "logging-in", effectivePlayerId: null };
    root.update(tree());
  });
  expect(boot.busy).toBe(true);
  await act(async () => {
    fixture.session = { status: "active", effectivePlayerId: "player-a" };
    root.update(tree());
  });
  expect(boot.ready).toBe(false);
  expect(boot.recovering).toBe(false);
});

it("retains an immediate child definitions acknowledgment on initial mount", async () => {
  await act(async () => root.unmount());
  fixture.autoDefinitions = true;
  await act(async () => {
    live();
    graphics("synchronized");
    root = create(tree());
  });
  expect(boot.ready).toBe(true);
  expect(boot.busy).toBe(false);
  expect(fixture.history).toHaveLength(1);
});
