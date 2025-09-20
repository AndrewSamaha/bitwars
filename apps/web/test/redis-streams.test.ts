import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the redis connection used by the module under test
vi.mock("../src/lib/db/connection", () => {
  return {
    redis: {},
  };
});

// Import after mocking so the module picks up the mock
import { xRangeWithBuffers, xReadWithBuffers } from "../src/lib/db/utils/redis-streams";
import { redis } from "../src/lib/db/connection";

const buf = (s: string | number[] | Buffer) =>
  Buffer.isBuffer(s) ? s : Array.isArray(s) ? Buffer.from(s) : Buffer.from(String(s));

describe("redis-streams utils", () => {
  beforeEach(() => {
    (redis as any).xrangeBuffer = undefined;
    (redis as any).xreadBuffer = undefined;
  });

  describe("xRangeWithBuffers", () => {
    it("returns [] when redis returns null", async () => {
      (redis as any).xrangeBuffer = vi.fn().mockResolvedValue(null);
      const out = await xRangeWithBuffers("k", "-", "+", 10);
      expect(out).toEqual([]);
      expect((redis as any).xrangeBuffer).toHaveBeenCalled();
    });

    it("extracts data from pair-form fields", async () => {
      const entries = [
        [buf("1-0"), [[buf("data"), buf([1, 2, 3])], [buf("x"), buf("y")]]],
        [buf("1-1"), [[buf("foo"), buf("bar")]]],
      ];
      (redis as any).xrangeBuffer = vi.fn().mockResolvedValue(entries);
      const out = await xRangeWithBuffers("k", "-", "+", 10);
      expect(out).toEqual([
        { id: "1-0", data: buf([1, 2, 3]) },
        { id: "1-1", data: undefined },
      ]);
    });

    it("extracts data from flat-form fields", async () => {
      const entries = [
        [buf("2-0"), [buf("data"), buf([9, 9]), buf("foo"), buf("bar")]],
        [buf("2-1"), [buf("a"), buf("b")]],
      ];
      (redis as any).xrangeBuffer = vi.fn().mockResolvedValue(entries);
      const out = await xRangeWithBuffers("k", "-", "+", 10);
      expect(out).toEqual([
        { id: "2-0", data: buf([9, 9]) },
        { id: "2-1", data: undefined },
      ]);
    });
  });

  describe("xReadWithBuffers", () => {
    it("returns [] when redis returns null", async () => {
      (redis as any).xreadBuffer = vi.fn().mockResolvedValue(null);
      const out = await xReadWithBuffers("stream", "$", 1000, 10);
      expect(out).toEqual([]);
      expect((redis as any).xreadBuffer).toHaveBeenCalled();
    });

    it("extracts data for pair-form fields", async () => {
      const res = [[
        buf("stream"),
        [
          [buf("3-0"), [[buf("data"), buf([7])]]],
          [buf("3-1"), [[buf("foo"), buf("bar")]]],
        ],
      ]];
      (redis as any).xreadBuffer = vi.fn().mockResolvedValue(res);
      const out = await xReadWithBuffers("stream", "$", 1000, 10);
      expect(out).toEqual([
        { id: "3-0", data: buf([7]) },
        { id: "3-1", data: undefined },
      ]);
    });

    it("extracts data for flat-form fields", async () => {
      const res = [[
        buf("stream"),
        [
          [buf("4-0"), [buf("data"), buf([5, 5]), buf("x"), buf("y")]],
          [buf("4-1"), [buf("a"), buf("b")]],
        ],
      ]];
      (redis as any).xreadBuffer = vi.fn().mockResolvedValue(res);
      const out = await xReadWithBuffers("stream", "$", 1000, 10);
      expect(out).toEqual([
        { id: "4-0", data: buf([5, 5]) },
        { id: "4-1", data: undefined },
      ]);
    });
  });
});
