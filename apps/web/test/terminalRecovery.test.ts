import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  milestones: [] as { label: string; done: boolean; running: boolean }[],
  error: null as string | null,
  recovering: false,
  retry: vi.fn(),
  busy: false,
  ready: true,
  status: "active",
  login: vi.fn(),
  unlock: vi.fn(),
  playMusic: vi.fn(),
}));
vi.mock("@/features/gamestate/components/BootContext", () => ({
  useBoot: () => fixture,
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
  fixture.milestones = [];
  fixture.error = null;
  fixture.recovering = false;
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

it("renders ls row links as buttons and dispatches their IDs only while ready", async () => {
  const { executeTerminalCommand } = await import("@/features/hud/terminal/commands");
  const { game } = await import("@/features/gamestate/world");
  const { CENTER_CAMERA_ON_ENTITY_EVENT } = await import("@/features/gamestate/events");
  const entities = [
    game.world.add({ id: 902, owner_player_id: "ls-player", entity_type_id: "worker" }),
    game.world.add({ id: 8, owner_player_id: "ls-player", entity_type_id: "worker" }),
  ];
  let result;
  try {
    result = await executeTerminalCommand("ls", {
      realPlayerId: "ls-player", effectivePlayerId: "ls-player", actingAsId: null,
      sessionStatus: "active", logout: async () => "", su: () => {}, exitSu: () => {},
    });
  } finally {
    for (const entity of entities) game.world.remove(entity);
  }
  const dispatchEvent = vi.fn();
  vi.stubGlobal("CustomEvent", class {
    constructor(public type: string, public options: { detail: string }) {}
    get detail() { return this.options.detail; }
  });
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }), dispatchEvent });
  saved = JSON.stringify({ isTerminalOpen: true, isTerminalWide: false });
  await act(async () => { root = create(tree()); });
  await act(async () => hud.actions.pushCommandHistory({ command: "ls", ...result }));
  const buttons = () => root.root.findAllByType("button").filter(button => button.props.title?.startsWith("Focus entity"));
  expect(buttons().map(button => button.children.join(""))).toEqual(["8       worker", "902       worker"]);
  const stopPropagation = vi.fn();
  for (const button of buttons()) {
    expect(button.props.type).toBe("button");
    await act(async () => button.props.onClick({ stopPropagation }));
  }
  expect(dispatchEvent.mock.calls.map(([event]) => [event.type, event.detail])).toEqual([
    [CENTER_CAMERA_ON_ENTITY_EVENT, "8"], [CENTER_CAMERA_ON_ENTITY_EVENT, "902"],
  ]);
  expect(stopPropagation).toHaveBeenCalledTimes(2);
  dispatchEvent.mockClear();
  await act(async () => { fixture.ready = false; fixture.busy = true; root.update(tree()); });
  await act(async () => buttons()[0].props.onClick({ stopPropagation }));
  expect(dispatchEvent).not.toHaveBeenCalled();
});

const renderedText = (node: ReturnType<ReactTestRenderer["root"]["findByType"]>): string =>
  node.children.map(child => typeof child === "string" ? child : renderedText(child)).join("");

it("shows completed green milestones and one blue truthful concurrent summary, hiding pending steps", async () => {
  fixture.busy = true;
  fixture.ready = false;
  fixture.milestones = [
    { label: "Authentication", done: true, running: true },
    { label: "Load definitions", done: true, running: true },
    { label: "Prepare graphics", done: false, running: true },
    { label: "Synchronize world", done: false, running: true },
    { label: "Pending milestone", done: false, running: false },
  ];
  await act(async () => { root = create(tree()); });
  const active = root.root.findAllByProps({ "data-boot-active": true });
  expect(active).toHaveLength(1);
  expect(active[0].props.className).toBe("text-blue-400");
  expect(renderedText(active[0])).toBe("[|] Prepare graphics and synchronize world");
  expect(active[0].findByType("span").props["aria-hidden"]).toBe("true");
  const completed = root.root.findAllByType("div").filter(node => node.props.className === "text-green-400");
  expect(completed.map(renderedText)).toEqual(["[OK] Authentication", "[OK] Load definitions"]);
  expect(JSON.stringify(root.toJSON())).not.toContain("Pending milestone");
  expect(renderedText(root.root.findByProps({ role: "status" }))).toContain("Prepare graphics and synchronize world");
  await act(async () => { fixture.milestones[2].done = true; root.update(tree()); });
  expect(renderedText(root.root.findByProps({ "data-boot-active": true }))).toBe("[|] Synchronize world");
  await act(async () => { fixture.milestones = fixture.milestones.map(item => ({ ...item, done: true })); root.update(tree()); });
  expect(root.root.findAllByProps({ "data-boot-active": true })).toHaveLength(0);
  await act(async () => { fixture.busy = false; fixture.ready = true; root.update(tree()); });
  expect(renderedText(root.root.findByProps({ role: "status" }))).toBe("Battlefield ready.");
});

it("shows reconnect context, waits truthfully, and replaces progress with a retryable error", async () => {
  fixture.busy = true;
  fixture.ready = false;
  fixture.recovering = true;
  fixture.milestones = [
    { label: "Reconnect transport", done: false, running: true },
    { label: "Synchronize world", done: false, running: false },
  ];
  await act(async () => { root = create(tree()); });
  expect(renderedText(root.root.findByProps({ className: "text-amber-300" }))).toBe("Connection interrupted.");
  expect(renderedText(root.root.findByProps({ "data-boot-active": true }))).toBe("[|] Reconnect transport");
  await act(async () => { fixture.milestones[0].running = false; root.update(tree()); });
  expect(renderedText(root.root.findByProps({ "data-boot-active": true }))).toContain("Waiting for reconnect transport and synchronize world");
  await act(async () => { fixture.error = "Definitions failed"; root.update(tree()); });
  expect(root.root.findAllByProps({ "data-boot-active": true })).toHaveLength(0);
  expect(renderedText(root.root.findByProps({ className: "text-red-300" }))).toContain("Definitions failed");
  expect(renderedText(root.root.findByProps({ role: "status" }))).toBe("Definitions failed");
  const retry = root.root.findAllByType("button").find(node => renderedText(node) === "Retry")!;
  expect(retry.props.disabled).toBeUndefined();
  await act(async () => retry.props.onClick());
  expect(fixture.retry).toHaveBeenCalledOnce();
  await act(async () => { fixture.error = null; fixture.milestones[0].running = true; root.update(tree()); });
  expect(root.root.findAllByProps({ "data-boot-active": true })).toHaveLength(1);
});

it("renders every reroute entity through Terminal log and dispatches its own ID", async () => {
  const { executeTerminalCommand } = await import("@/features/hud/terminal/commands");
  const { formatMessage } = await import("@/features/hud/messages");
  const { CENTER_CAMERA_ON_ENTITY_EVENT } = await import("@/features/gamestate/events");
  const dispatchEvent = vi.fn();
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }), dispatchEvent });
  saved = JSON.stringify({ isTerminalOpen: true, isTerminalWide: false });
  await act(async () => { root = create(tree()); });
  const kind = "collection-rerouted" as const;
  await act(async () => hud.actions.pushMessageLog({ kind, timestamp: 1,
    ...formatMessage({ kind, detail: { entityId: 7, fromDepotId: 8, toDepotId: 9 } }),
  }));
  const result = await executeTerminalCommand("log -ts", {
    realPlayerId: "p", effectivePlayerId: "p", actingAsId: null, sessionStatus: "active",
    messageLog: hud.state.messageLog, logout: async () => "", su: () => {}, exitSu: () => {},
  });
  await act(async () => hud.actions.pushCommandHistory({ command: "log -ts", ...result }));
  const buttons = root.root.findAllByType("button").filter(button => button.props.title?.startsWith("Focus entity"));
  expect(buttons.map(button => button.children.join(""))).toEqual(["Worker 7", "depot #8", "depot #9"]);
  for (const button of buttons) await act(async () => button.props.onClick({ stopPropagation: vi.fn() }));
  expect(dispatchEvent.mock.calls.map(([event]) => [event.type, event.detail])).toEqual([
    [CENTER_CAMERA_ON_ENTITY_EVENT, "7"], [CENTER_CAMERA_ON_ENTITY_EVENT, "8"], [CENTER_CAMERA_ON_ENTITY_EVENT, "9"],
  ]);
});
