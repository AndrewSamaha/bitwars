import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BUILD_COMPLETED_EVENT,
  dispatchBuildCompleted,
  dispatchEntityDetected,
  ENTITY_DETECTED_EVENT,
} from "../src/features/gamestate/events";

afterEach(() => vi.unstubAllGlobals());

describe("entity detection events", () => {
  it("only announces entities with a known position", () => {
    const target = new EventTarget();
    const detected: unknown[] = [];
    vi.stubGlobal("window", target);
    target.addEventListener(ENTITY_DETECTED_EVENT, (event) => {
      detected.push((event as CustomEvent).detail);
    });

    dispatchEntityDetected({ id: 1 });
    dispatchEntityDetected({ id: 2, pos: { x: 10, y: 20 } });

    expect(detected).toEqual([{ id: 2, pos: { x: 10, y: 20 } }]);
  });
});

describe("build completion events", () => {
  it("announces the completed build at its position", () => {
    const target = new EventTarget();
    const completed: unknown[] = [];
    vi.stubGlobal("window", target);
    target.addEventListener(BUILD_COMPLETED_EVENT, (event) => {
      completed.push((event as CustomEvent).detail);
    });

    dispatchBuildCompleted({ id: 1 });
    dispatchBuildCompleted({ id: 2, pos: { x: 10, y: 20 } });

    expect(completed).toEqual([{ id: 2, pos: { x: 10, y: 20 } }]);
  });
});
