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
  getStarCountForCell,
  getStarForCell,
} from "@/features/pixijs/utils/proceduralBackground";

  it("generates stable 0–10 star counts and positions within each grid cell", () => {
    for (const [cellX, cellY] of [[0, 0], [-3, 7], [14, -9]]) {
      const count = getStarCountForCell(cellX, cellY, SEED);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(10);
      expect(getStarCountForCell(cellX, cellY, SEED)).toBe(count);
      for (let index = 0; index < count; index++) {
        const star = getStarForCell(cellX, cellY, index, CELL_SIZE, SEED);
        expect(star).toEqual(getStarForCell(cellX, cellY, index, CELL_SIZE, SEED));
        expect(star.x).toBeGreaterThanOrEqual(cellX * CELL_SIZE);
        expect(star.x).toBeLessThan((cellX + 1) * CELL_SIZE);
        expect(star.y).toBeGreaterThanOrEqual(cellY * CELL_SIZE);
        expect(star.y).toBeLessThan((cellY + 1) * CELL_SIZE);
      }
    }
  });

it("favors empty cells with a sparse tail and decorrelated position axes", () => {
  const counts = Array(11).fill(0);
  let xy = 0;
  let xSum = 0;
  let ySum = 0;
  const samples = 10000;
  for (let i = 0; i < samples; i++) {
    counts[getStarCountForCell(i - 5000, 17, SEED)]++;
    const star = getStarForCell(i - 5000, 17, 0, 1, SEED);
    const x = star.x - (i - 5000);
    const y = star.y - 17;
    xy += x * y;
    xSum += x;
    ySum += y;
  }
  expect(counts[0] / samples).toBeGreaterThan(0.37);
  expect(counts[0] / samples).toBeLessThan(0.43);
  expect(counts[0]).toBeGreaterThan(counts[1]);
  expect(counts[1]).toBeGreaterThan(counts[2]);
  expect(counts[10]).toBeGreaterThan(0);
  expect(counts[10] / samples).toBeLessThan(0.015);
  expect(Math.abs(xy / samples - xSum * ySum / samples ** 2)).toBeLessThan(0.005);
});

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
