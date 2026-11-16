import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  id: "a",
  attempt: 0,
  loaded: vi.fn(),
  failed: vi.fn(),
  loadBundle: vi.fn(),
}));
vi.mock("@/features/users/components/identity/SessionContext", () => ({
  useSession: () => ({ status: "active", effectivePlayerId: fixture.id }),
}));
vi.mock("@/features/users/components/identity/PlayerContext", () => ({
  usePlayer: () => ({ player: { id: fixture.id }, loading: false }),
}));
vi.mock("@/features/gamestate/components/BootContext", () => ({
  useBoot: () => ({
    attempt: fixture.attempt,
    definitionsLoaded: fixture.loaded,
    definitionsFailed: fixture.failed,
  }),
}));
vi.mock("@/features/content/contentManager", () => ({
  contentManager: { loadBundle: fixture.loadBundle },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
import GameStreamGate from "../src/features/gamestate/components/GameStreamGate";
let root: ReactTestRenderer;
let requests: { resolve: (value: unknown) => void; signal: AbortSignal }[];
const tree = () =>
  React.createElement(
    GameStreamGate,
    null,
    React.createElement("span", null, "world"),
  );
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  fixture.id = "a";
  fixture.attempt = 0;
  requests = [];
  vi.stubGlobal(
    "fetch",
    (_url: string, options: { signal: AbortSignal }) =>
      new Promise((resolve) =>
        requests.push({ resolve, signal: options.signal }),
      ),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
it("ignores an obsolete definitions response after an identity change", async () => {
  await act(async () => {
    root = create(tree());
  });
  await act(async () => {
    fixture.id = "b";
    root.update(tree());
  });
  expect(requests[0].signal.aborted).toBe(true);
  await act(async () =>
    requests[0].resolve({ ok: true, json: async () => ({ revision: "old" }) }),
  );
  expect(fixture.loaded).not.toHaveBeenCalled();
  expect(fixture.loadBundle).not.toHaveBeenCalled();
  expect(root.toJSON()).toBeNull();
  await act(async () =>
    requests[1].resolve({ ok: true, json: async () => ({ revision: "new" }) }),
  );
  expect(fixture.loaded).toHaveBeenCalledOnce();
  expect(fixture.loadBundle).toHaveBeenCalledWith({ revision: "new" });
  expect(root.toJSON()).toMatchObject({ type: "span" });
});
it("reports definitions errors to Terminal and retries without rendering a competing screen", async () => {
  await act(async () => {
    root = create(tree());
  });
  await act(async () => requests[0].resolve({ ok: false, status: 503 }));
  expect(fixture.failed).toHaveBeenCalledWith("Content request failed: 503");
  expect(root.toJSON()).toBeNull();
  await act(async () => {
    fixture.attempt++;
    root.update(tree());
  });
  await act(async () =>
    requests[1].resolve({
      ok: true,
      json: async () => ({ revision: "retry" }),
    }),
  );
  expect(fixture.loaded).toHaveBeenCalledOnce();
  expect(root.toJSON()).toMatchObject({ type: "span" });
});
