import { afterEach, expect, it, vi } from "vitest";
import { readCameraView, saveCameraView } from "../src/features/pixijs/utils/cameraSession";

afterEach(() => vi.unstubAllGlobals());
const storage = () => {
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
};

it("restores a world center and zoom only for the matching player and run", () => {
  storage();
  const view = { x: -150047.4, y: 92636.3, zoom: 0.075 };
  saveCameraView("run-a", "player-a", view);
  expect(readCameraView("run-a", "player-a", 0.01, 2)).toEqual(view);
  expect(readCameraView("run-b", "player-a", 0.01, 2)).toBeNull();
  expect(readCameraView("run-a", "player-b", 0.01, 2)).toBeNull();
});

it("clamps saved zoom to current camera bounds and ignores invalid camera coordinates", () => {
  storage();
  saveCameraView("run", "player", { x: 10, y: -20, zoom: 5 });
  expect(readCameraView("run", "player", 0.01, 2)).toEqual({ x: 10, y: -20, zoom: 2 });
  saveCameraView("run", "player", { x: 10, y: -20, zoom: 0.001 });
  expect(readCameraView("run", "player", 0.01, 2)?.zoom).toBe(0.01);
  for (const view of [{ x: NaN, y: 0, zoom: 1 }, { x: 0, y: Infinity, zoom: 1 }, { x: 0, y: 0, zoom: 0 }]) {
    saveCameraView("run", "player", view);
    expect(readCameraView("run", "player", 0.01, 2)).toBeNull();
  }
});

it("falls back to normal camera initialization when session storage is corrupt or denied", () => {
  vi.stubGlobal("sessionStorage", { getItem: () => "{broken" });
  expect(readCameraView("run", "player", 0.01, 2)).toBeNull();
  vi.stubGlobal("sessionStorage", {
    getItem: () => { throw new Error("denied"); },
    setItem: () => { throw new Error("denied"); },
  });
  saveCameraView("run", "player", { x: 1, y: 2, zoom: 1 });
  expect(readCameraView("run", "player", 0.01, 2)).toBeNull();
});
