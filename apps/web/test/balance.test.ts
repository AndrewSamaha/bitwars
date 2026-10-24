import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { stringify } from "yaml";
import BalanceChart from "@/features/content/components/BalanceChart";
import {
  balanceExamples,
  evaluateBalance,
  evaluateExpression,
  parseBalance,
  parseExpression,
} from "@/lib/content/balance";
import { balanceStore } from "@/lib/content/balanceFiles";
import {
  balanceFieldPaths,
  expressionCompletions,
} from "@/lib/content/balanceHelp";

const evaluate = (expression: string, entity: unknown = {}) =>
  evaluateExpression(parseExpression(expression), entity);
describe("balance expressions", () => {
  it("handles precedence, unary operators, scientific literals, grouping and multiplication beside wildcards", () => {
    expect(
      evaluate("health / (sum(cost.*) + 1) * -2 + max(cost.*)", {
        health: 12,
        cost: { energy: 2, food: 3 },
      }),
    ).toBe(-1);
    expect(evaluate("2+3*4")).toBe(14);
    expect(evaluate("-(-2) + .5e2")).toBe(52);
    expect(evaluate("sum(cost.*)*2", { cost: { energy: 4 } })).toBe(8);
  });
  it("supports array indices and nested wildcard selections", () => {
    const entity = { combat: { attacks: [{ damage: 2 }, { damage: 5 }] } };
    expect(evaluate("combat.attacks.0.damage", entity)).toBe(2);
    expect(evaluate("max(combat.attacks.*.damage)", entity)).toBe(5);
  });
  it("rejects missing, empty, nonnumeric, unreduced and non-finite values", () => {
    for (const entity of [
      {},
      { cost: {} },
      { cost: { energy: null } },
      { cost: { energy: "2" } },
      { cost: { energy: false } },
    ])
      expect(() => evaluate("sum(cost.*)", entity)).toThrow();
    expect(() =>
      evaluate("sum(items.*.value)", { items: [{ value: 2 }, {}] }),
    ).toThrow("Missing field");
    expect(() => evaluate("cost.*", { cost: { energy: 2 } })).toThrow(
      "reduced",
    );
    expect(() => evaluate("1/0")).toThrow("Division by zero");
    expect(() => evaluate("1e308*2")).toThrow("Non-finite");
    expect(evaluate("sum(cost.*)", { cost: { energy: 0 } })).toBe(0);
  });
  it("rejects unsupported functions, arbitrary code and malformed syntax", () => {
    for (const source of [
      "",
      "sum()",
      "sum(1,2)",
      "Math.max(1)",
      "alert(1)",
      "1;2",
      "a[0]",
      "2+",
      "(2",
      "1e999",
    ])
      expect(() => parseExpression(source)).toThrow();
  });
});
describe("balance configuration and evaluation", () => {
  it("validates both examples, IDs and expression syntax before evaluation", () => {
    for (const example of balanceExamples)
      expect(parseBalance(example.yaml).version).toBe(1);
    const config = {
      version: 1,
      id: "../Mixed/🪐",
      visualization_type: "bar_chart",
      value: { expression: "speed" },
    };
    expect(parseBalance(stringify(config)).id).toBe(config.id);
    for (const id of ["", "a b", 12, "a\nb"])
      expect(() => parseBalance(stringify({ ...config, id }))).toThrow();
    expect(() =>
      parseBalance(stringify({ ...config, value: { expression: "speed +" } })),
    ).toThrow("value:");
    expect(() => parseBalance("version: [")).toThrow();
    expect(() => parseBalance(stringify({ ...config, x: {} }))).toThrow();
  });
  it("reports each affected coordinate and retains authored zeros", () => {
    const config = parseBalance(balanceExamples[0].yaml);
    const result = evaluateBalance(config, [
      {
        id: "zero",
        data: { maintenance_cost_per_minute: { energy: 0 }, speed: 0 },
      },
      { id: "missing", data: {} },
    ]);
    expect(result.points.map((point) => point.id)).toEqual(["zero"]);
    expect(result.omissions[0].reasons).toHaveLength(2);
    expect(result.omissions[0].reasons[0]).toContain("x (sum(");
  });
  it("sorts both directions with deterministic entity ID ties", () => {
    const config = parseBalance(
      "version: 1\nid: bar\nvisualization_type: bar_chart\nvalue:\n  expression: speed\n",
    );
    const entities = [
      { id: "b", data: { speed: 1 } },
      { id: "a", data: { speed: 1 } },
      { id: "z", data: { speed: 3 } },
    ];
    expect(
      evaluateBalance(config, entities).points.map((point) => point.id),
    ).toEqual(["z", "a", "b"]);
    if (config.visualization_type === "bar_chart") config.order = "ascending";
    expect(
      evaluateBalance(config, entities).points.map((point) => point.id),
    ).toEqual(["a", "b", "z"]);
  });
});
describe("balance persistence", () => {
  it("preserves comments, prevents unconfirmed overwrite, and isolates public IDs from paths", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "balance-"));
    try {
      const store = balanceStore(directory);
      const yaml =
        "# keep this comment\n" +
        balanceExamples[0].yaml.replace(
          "maintenance-vs-speed",
          "../../Mixed/🪐",
        );
      const id = parseBalance(yaml).id;
      await store.save(yaml);
      expect(await store.read(id)).toBe(yaml);
      expect((await store.list())[0].id).toBe(id);
      await expect(store.save(`${yaml}# edit\n`)).rejects.toMatchObject({
        code: "EEXIST",
      });
      expect(await store.read(id)).toBe(yaml);
      await store.save(`${yaml}# edit\n`, true);
      expect(await store.read(id)).toBe(`${yaml}# edit\n`);
      const files = await readdir(directory);
      expect(files).toHaveLength(1);
      expect(files[0]).toMatch(/^[a-f0-9]{64}\.yaml$/);
      expect(await readFile(path.join(directory, files[0]), "utf8")).toContain(
        "# edit",
      );
      await expect(store.save("invalid")).rejects.toThrow();
      await writeFile(path.join(directory, files[0]), "invalid");
      expect((await store.list())[0].error).toBeTruthy();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
describe("balance completion", () => {
  it("combines schema fields, authored keys, wildcards and indexed paths", () => {
    const paths = balanceFieldPaths([
      {
        maintenance_cost_per_minute: { custom_resource: 2 },
        combat: { attacks: [{ damage: 3 }] },
      },
    ]);
    expect(paths).toContain("speed");
    expect(paths).toContain("maintenance_cost_per_minute.custom_resource");
    expect(paths).toContain("maintenance_cost_per_minute.*");
    expect(paths).toContain("combat.attacks.0.damage");
    expect(
      expressionCompletions("maintenance_cost_per_minute.c", paths),
    ).toContainEqual({
      label: "custom_resource",
      insertText: "custom_resource",
    });
    expect(expressionCompletions("combat.", paths)).toContainEqual({
      label: "attacks",
      insertText: "attacks.",
    });
  });
});

describe("balance chart rendering", () => {
  vi.stubGlobal("React", React);
  it("keeps zero, constant, negative and very large finite values visible", () => {
    for (const visualization_type of ["scatter_plot", "bar_chart"]) {
      for (const values of [
        [0],
        [-3, 0, 4],
        [Number.MAX_VALUE],
        [-Number.MAX_VALUE, Number.MAX_VALUE],
      ]) {
        const config = parseBalance(
          stringify({
            version: 1,
            id: "chart",
            visualization_type,
            ...(visualization_type === "scatter_plot"
              ? { x: { expression: "speed" }, y: { expression: "speed" } }
              : { value: { expression: "speed" } }),
          }),
        );
        const { points } = evaluateBalance(
          config,
          values.map((speed, index) => ({
            id: `entity${index}`,
            data: { speed },
          })),
        );
        const html = renderToStaticMarkup(
          createElement(BalanceChart, { config, points }),
        );
        expect(html).not.toMatch(/NaN|Infinity/);
        expect(html).toContain("entity0");
      }
    }
  });
});

describe("scatter dot size", () => {
  it("defaults to 40 pixels and rejects nonpositive or nonnumeric sizes", () => {
    expect(
      parseBalance(balanceExamples[0].yaml.replace("dot_size: 40\n", "")),
    ).toMatchObject({ dot_size: 40 });
    for (const size of [0, -1, "small", null, Infinity]) {
      expect(() =>
        parseBalance(
          balanceExamples[0].yaml.replace(
            "dot_size: 40",
            `dot_size: ${stringify(size).trim()}`,
          ),
        ),
      ).toThrow();
    }
  });
  it("scales sprites and fallback dots around unchanged coordinates", () => {
    function render(size: number) {
      const config = parseBalance(
        balanceExamples[0].yaml.replace("dot_size: 40", `dot_size: ${size}`),
      );
      const { points } = evaluateBalance(config, [
        {
          id: "worker",
          data: { speed: 5, maintenance_cost_per_minute: { energy: 2 } },
        },
      ]);
      return renderToStaticMarkup(
        createElement(BalanceChart, { config, points }),
      );
    }
    const normal = render(40);
    const small = render(12);
    expect(small).toContain('width="12" height="12"');
    expect(small).toContain('x="-6" y="-6"');
    expect(small).toContain('circle r="1.5"');
    expect(small.match(/transform="translate\([^"]+\)" tabindex/)?.[0]).toBe(
      normal.match(/transform="translate\([^"]+\)" tabindex/)?.[0],
    );
  });
});
