import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { stringify } from "yaml";
import BalanceChart from "@/features/content/components/BalanceChart";
import { evaluateBalance, parseBalance } from "@/lib/content/balance";
import { balanceAxis } from "@/lib/content/balanceAxis";

vi.stubGlobal("React", React);

describe("bounded balance axes", () => {
  it("collapses all values beyond the same bound without changing in-range spacing", () => {
    const axis = balanceAxis([-500, -30, 0, 25, 50, 100, 130, 500], {
      min: 0,
      max: 100,
    });
    expect(axis.position(130)).toBe(axis.position(500));
    expect(axis.position(-30)).toBe(axis.position(-500));
    expect(axis.position(0)).toBeGreaterThan(axis.position(-30));
    expect(axis.position(100)).toBeLessThan(axis.position(130));
    expect(axis.position(25) - axis.position(0)).toBeCloseTo(
      axis.position(50) - axis.position(25),
    );
    expect(axis.breaks.map((b) => b.side)).toEqual(["below", "above"]);
    expect(axis.ticks.map((t) => t.value)).toEqual([0, 20, 40, 60, 80, 100]);
  });
  it("uses inclusive bounds and only draws breaks for actual outliers", () => {
    const axis = balanceAxis([0, 50, 100], { min: 0, max: 100 });
    expect(axis.breaks).toEqual([]);
    expect(axis.position(0)).toBe(0);
    expect(axis.position(100)).toBe(1);
    expect(
      balanceAxis([130, 500], { max: 100 }).breaks.map((b) => b.side),
    ).toEqual(["above"]);
  });
  it("handles missing bounds, constant data and entirely out-of-range data", () => {
    for (const [values, bounds] of [
      [[5], {}],
      [[130, 500], { min: 0, max: 100 }],
      [[-500, -130], { min: 0 }],
      [[130, 500], { max: -100 }],
      [[Number.MAX_VALUE], { min: Number.MAX_VALUE }],
      [[-Number.MAX_VALUE, Number.MAX_VALUE], {}],
    ] as const) {
      const axis = balanceAxis([...values], bounds);
      expect(Number.isFinite(axis.min)).toBe(true);
      expect(Number.isFinite(axis.max)).toBe(true);
      for (const value of values)
        expect(Number.isFinite(axis.position(value))).toBe(true);
      for (const tick of axis.ticks)
        expect(Number.isFinite(tick.value)).toBe(true);
    }
  });
  it("rejects equal, reversed, nonnumeric and non-finite bounds on any numeric axis", () => {
    for (const kind of ["scatter_plot", "bar_chart"]) {
      for (const bounds of [
        { min: 1, max: 1 },
        { min: 2, max: 1 },
        { min: "0" },
        { max: Infinity },
      ]) {
        const config = {
          version: 1,
          id: "bounds",
          visualization_type: kind,
          ...(kind === "scatter_plot"
            ? {
                x: { expression: "speed", ...bounds },
                y: { expression: "speed" },
              }
            : { value: { expression: "speed", ...bounds } }),
        };
        expect(() => parseBalance(stringify(config))).toThrow();
      }
    }
  });
});

describe("broken axis charts", () => {
  function render(
    kind: string,
    values: number[],
    bounds: { min: number; max: number },
  ) {
    const axis = { expression: "speed", ...bounds };
    const config = parseBalance(
      stringify({
        version: 1,
        id: "broken",
        visualization_type: kind,
        ...(kind === "scatter_plot"
          ? { x: { ...axis }, y: { ...axis } }
          : { value: axis }),
      }),
    );
    const result = evaluateBalance(
      config,
      values.map((speed, index) => ({ id: `entity${index}`, data: { speed } })),
    );
    expect(result.omissions).toEqual([]);
    return renderToStaticMarkup(
      React.createElement(BalanceChart, {
        config,
        points: result.points,
        onSelectEntity: () => {},
      }),
    );
  }
  it("puts scatter outliers at identical coordinates and retains original values and selection controls", () => {
    const html = render("scatter_plot", [50, 130, 500], { min: 0, max: 100 });
    const coordinates = [
      ...html.matchAll(/transform="translate\(([^"]+)\)" tabindex/g),
    ].map((match) => match[1]);
    expect(coordinates).toHaveLength(3);
    expect(coordinates[1]).toBe(coordinates[2]);
    expect(coordinates[0]).not.toBe(coordinates[1]);
    expect(html).toContain('data-axis-break="x-above"');
    expect(html).toContain('data-axis-break="y-above"');
    expect(html).toContain("entity2: x=500, y=500");
    expect(html).not.toContain('data-axis-break="y-below"');
  });
  it("gives bar outliers equal heights and marks the axis and bars as broken", () => {
    const html = render("bar_chart", [-50, 50, 130, 500], { min: 0, max: 100 });
    const bars = [
      ...html.matchAll(
        /<rect x="[^"]+" y="([^"]+)" width="[^"]+" height="([^"]+)" fill="#22d3ee"/g,
      ),
    ];
    expect(bars).toHaveLength(4);
    expect(bars[0][1]).toBe(bars[1][1]);
    expect(bars[0][2]).toBe(bars[1][2]);
    expect(html).toContain('data-axis-break="y-above"');
    expect(html).toContain('data-axis-break="y-below"');
    expect(html).toContain('stroke-width="6"');
    expect(html).not.toMatch(/NaN|Infinity/);
  });
  it("does not invent a low break for a bar baseline outside a positive configured range", () => {
    const html = render("bar_chart", [50, 80], { min: 20, max: 100 });
    expect(html).not.toContain("data-axis-break");
    expect(html).not.toMatch(/NaN|Infinity/);
  });
});
