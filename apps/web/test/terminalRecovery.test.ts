import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  busy: false,
  ready: true,
  status: "active",
  login: vi.fn(),
  unlock: vi.fn(),
  playMusic: vi.fn(),
}));
vi.mock("@/features/gamestate/components/BootContext", () => ({
  useBoot: () => ({ ...fixture, milestones: [], error: null }),
}));
vi.mock("@/features/users/components/identity/SessionContext", () => ({
  useSession: () => ({ status: fixture.status, login: fixture.login }),
}));
vi.mock("@/features/users/components/identity/PlayerContext", () => ({
  usePlayer: () => ({ player: null }),
}));
vi.mock("@/features/audio/audioManager", () => ({
  audio: { unlock: fixture.unlock, playMusic: fixture.playMusic },
}));
vi.mock("@/features/gamestate/components/EntitiesStreamCounter", () => ({
  default: () => null,
}));
vi.mock("@/features/gamestate/components/EcsEntityCount", () => ({
  default: () => null,
}));
import { HUDProvider, useHUD } from "../src/features/hud/components/HUDContext";
import TerminalPanel from "../src/features/hud/components/TerminalPanel";
let hud: ReturnType<typeof useHUD>;
let root: ReactTestRenderer;
let saved: string;
let focus = vi.fn();
let viewport = { scrollTop: 0, scrollHeight: 123 };
function Probe() {
  hud = useHUD();
  return React.createElement(TerminalPanel);
}
const tree = () =>
  React.createElement(HUDProvider, null, React.createElement(Probe));
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
  vi.stubGlobal("sessionStorage", {
    getItem: () => saved,
    setItem: (_key: string, value: string) => {
      saved = value;
    },
  });
  fixture.busy = false;
  fixture.ready = true;
  fixture.status = "active";
  vi.clearAllMocks();
  focus = vi.fn();
  viewport = { scrollTop: 0, scrollHeight: 123 };
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
it.each([
  { isTerminalOpen: false, isTerminalWide: false },
  { isTerminalOpen: true, isTerminalWide: false },
  { isTerminalOpen: true, isTerminalWide: true },
])(
  "temporarily opens recovery and restores exact saved layout %j with draft and history intact",
  async (layout) => {
    saved = JSON.stringify(layout);
    await act(async () => {
      root = create(tree(), {
        createNodeMock: (element) =>
          element.type === "input"
            ? { focus }
            : element.type === "div"
              ? viewport
              : null,
      });
    });
    await act(async () => {
      hud.actions.setTerminalInput("unfinished command");
      hud.actions.pushCommandHistory({
        command: "help",
        output: "prior output",
      });
    });
    const history = hud.selectors.commandHistory;
    viewport.scrollTop = 0;
    focus.mockClear();
    await act(async () => {
      fixture.busy = true;
      fixture.ready = false;
      root.update(tree());
    });
    expect(viewport.scrollTop).toBe(viewport.scrollHeight);
    expect(focus).not.toHaveBeenCalled();
    const outer = root.root.findAllByType("div")[0];
    expect(outer.props.className).toContain(
      layout.isTerminalWide ? "inset-x-4" : "w-96",
    );
    expect(
      root.root.findByProps({ "aria-label": "Close terminal" }).props.disabled,
    ).toBe(true);
    expect(root.root.findByType("form").props.className).toBe("hidden");
    expect(JSON.parse(saved)).toEqual(layout);
    expect(hud.selectors.currentCommand).toBe("unfinished command");
    expect(hud.selectors.commandHistory).toBe(history);
    await act(async () => {
      fixture.busy = false;
      fixture.ready = true;
      root.update(tree());
    });
    if (layout.isTerminalOpen) expect(focus).toHaveBeenCalled();
    expect(hud.selectors.isTerminalOpen).toBe(layout.isTerminalOpen);
    expect(hud.selectors.isTerminalWide).toBe(layout.isTerminalWide);
    expect(JSON.parse(saved)).toEqual(layout);
  },
);

it("restores login input after authentication failure and unlocks audio in the submit gesture", async () => {
  fixture.status = "logged-out";
  fixture.ready = false;
  fixture.login.mockRejectedValueOnce(new Error("Login failed (503)"));
  saved = JSON.stringify({ isTerminalOpen: true, isTerminalWide: false });
  await act(async () => {
    root = create(tree());
  });
  await act(async () => hud.actions.setTerminalInput("pilot"));
  await act(async () =>
    root.root.findByType("form").props.onSubmit({ preventDefault() {} }),
  );
  expect(fixture.unlock).toHaveBeenCalledOnce();
  expect(fixture.login).toHaveBeenCalledWith("pilot");
  expect(fixture.playMusic).not.toHaveBeenCalled();
  expect(hud.selectors.commandHistory.at(-1)?.output).toBe(
    "Login failed (503)",
  );
  expect(root.root.findByType("form").props.className).toBe("flex");
  expect(root.root.findByType("input").props.readOnly).toBe(false);
});
