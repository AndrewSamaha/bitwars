import { describe, it, expect } from "vitest";
import {
  CELL_SIZE,
  SEED,
  DEFAULT_PALETTE,
  getSectorAt,
  getSectorColor,
  getSiteForCell,
  getViewportWorldAABB,
  getVisibleCellRange,
} from "@/features/pixijs/utils/proceduralBackground";

describe("proceduralBackground (M5.2 determinism)", () => {
  it("getSiteForCell is deterministic for fixed (cellX, cellY)", () => {
    const a = getSiteForCell(0, 0, CELL_SIZE, SEED);
    const b = getSiteForCell(0, 0, CELL_SIZE, SEED);
    expect(a.x).toBe(b.x);
    expect(a.y).toBe(b.y);
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.x).toBeLessThan(CELL_SIZE);
    expect(a.y).toBeGreaterThanOrEqual(0);
    expect(a.y).toBeLessThan(CELL_SIZE);
  });

  it("getSectorAt is deterministic and returns sector id", () => {
    const sector1 = getSectorAt(0, 0, CELL_SIZE, SEED);
    const sector2 = getSectorAt(0, 0, CELL_SIZE, SEED);
    expect(sector1).toEqual(sector2);
    expect(typeof sector1.cx).toBe("number");
    expect(typeof sector1.cy).toBe("number");
  });

  it("getSectorColor is deterministic for fixed sector", () => {
    const sector = getSectorAt(100, 200, CELL_SIZE, SEED);
    const c1 = getSectorColor(sector, [...DEFAULT_PALETTE]);
    const c2 = getSectorColor(sector, [...DEFAULT_PALETTE]);
    expect(c1).toBe(c2);
    expect(Number.isInteger(c1)).toBe(true);
    expect(c1).toBeGreaterThanOrEqual(0);
    expect(c1).toBeLessThanOrEqual(0xffffff);
  });

  it("same world point yields same sector and color across calls", () => {
    const x = 1234.5;
    const y = -567.8;
    const s1 = getSectorAt(x, y, CELL_SIZE, SEED);
    const c1 = getSectorColor(s1, [...DEFAULT_PALETTE]);
    const s2 = getSectorAt(x, y, CELL_SIZE, SEED);
    const c2 = getSectorColor(s2, [...DEFAULT_PALETTE]);
    expect(s1).toEqual(s2);
    expect(c1).toBe(c2);
  });

  it("getViewportWorldAABB returns AABB with margin", () => {
    const camera = {
      toLocal: (p: { x: number; y: number }) => ({ x: p.x * 2, y: p.y * 2 }),
    };
    const aabb = getViewportWorldAABB(camera, 100, 50, 200);
    expect(aabb.minX).toBeLessThanOrEqual(aabb.maxX);
    expect(aabb.minY).toBeLessThanOrEqual(aabb.maxY);
    expect(aabb.minX).toBe(0 - 200);
    expect(aabb.minY).toBe(0 - 200);
    expect(aabb.maxX).toBe(100 * 2 + 200);
    expect(aabb.maxY).toBe(50 * 2 + 200);
  });

  it("getVisibleCellRange returns inclusive range", () => {
    const aabb = { minX: 0, minY: 0, maxX: CELL_SIZE * 3, maxY: CELL_SIZE * 2 };
    const r = getVisibleCellRange(aabb, CELL_SIZE, 0);
    expect(r.minCx).toBeLessThanOrEqual(r.maxCx);
    expect(r.minCy).toBeLessThanOrEqual(r.maxCy);
    expect(r.minCx).toBe(0);
    expect(r.minCy).toBe(0);
    expect(r.maxCx).toBe(3);
    expect(r.maxCy).toBe(2);
  });
});
