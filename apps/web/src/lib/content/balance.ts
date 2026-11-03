import { parseDocument } from "yaml";
import { z } from "zod";

export type Expression =
  | { kind: "number"; value: number }
  | { kind: "path"; parts: string[] }
  | { kind: "unary"; sign: string; operand: Expression }
  | { kind: "binary"; op: string; left: Expression; right: Expression }
  | { kind: "call"; name: "sum" | "max"; argument: Expression };

// Recursive descent keeps expressions independent of JavaScript execution.
export function parseExpression(source: string): Expression {
  if (source.length > 4096)
    throw new Error("Expression exceeds 4096 characters");
  let offset = 0;
  let depth = 0;
  const space = () => {
    while (/\s/.test(source[offset] ?? "") && offset < source.length) offset++;
  };
  const take = (token: string) => {
    space();
    if (source.startsWith(token, offset)) {
      offset += token.length;
      return true;
    }
    return false;
  };
  const fail = (): never => {
    throw new Error(`Invalid expression at column ${offset + 1}: ${source}`);
  };
  function primary(): Expression {
    if (++depth > 100) throw new Error("Expression nesting exceeds 100 levels");
    try {
      if (take("+")) return { kind: "unary", sign: "+", operand: primary() };
      if (take("-")) return { kind: "unary", sign: "-", operand: primary() };
      if (take("(")) {
        const value = binary(0);
        if (!take(")")) fail();
        return value;
      }
      space();
      const number = source
        .slice(offset)
        .match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
      if (number) {
        offset += number[0].length;
        const value = Number(number[0]);
        if (!Number.isFinite(value)) fail();
        return { kind: "number", value };
      }
      const identifier = source
        .slice(offset)
        .match(/^[a-zA-Z_][a-zA-Z0-9_]*/)?.[0];
      if (!identifier) return fail();
      offset += identifier.length;
      if (take("(")) {
        if (identifier !== "sum" && identifier !== "max") return fail();
        const argument = binary(0);
        if (!take(")")) fail();
        return { kind: "call", name: identifier, argument };
      }
      const parts = [identifier];
      while (true) {
        space();
        if (source[offset] !== ".") break;
        offset++;
        space();
        const part = source
          .slice(offset)
          .match(/^(?:\*|\d+|[a-zA-Z_][a-zA-Z0-9_]*)/)?.[0];
        if (!part) return fail();
        offset += part.length;
        parts.push(part);
      }
      return { kind: "path", parts };
    } finally {
      depth--;
    }
  }
  function binary(level: number): Expression {
    if (level === 2) return primary();
    let left = binary(level + 1);
    while (true) {
      space();
      const op = source[offset];
      if (!(level === 0 ? ["+", "-"] : ["*", "/"]).includes(op)) break;
      offset++;
      left = { kind: "binary", op, left, right: binary(level + 1) };
    }
    return left;
  }
  const result = binary(0);
  space();
  if (offset !== source.length) fail();
  return result;
}

function finite(value: unknown): number {
  if (typeof value !== "number") throw new Error("Nonnumeric value");
  if (!Number.isFinite(value)) throw new Error("Non-finite result");
  return value;
}
function scalar(value: number | number[]): number {
  if (Array.isArray(value))
    throw new Error("Wildcard selection must be reduced with sum or max");
  return finite(value);
}
export function evaluateExpression(
  expression: Expression,
  entity: unknown,
): number {
  function evaluate(node: Expression): number | number[] {
    switch (node.kind) {
      case "number":
        return node.value;
      case "path": {
        const parts = node.parts;
        function walk(value: unknown, index: number): number[] {
          const field = parts.slice(0, index).join(".");
          if (index === parts.length) {
            try {
              return [finite(value)];
            } catch (error) {
              throw new Error(`${field}: ${(error as Error).message}`);
            }
          }
          const part = parts[index];
          if (part === "*") {
            if (!value || typeof value !== "object")
              throw new Error(`${field}: wildcard requires a map or array`);
            const values = Object.values(value);
            if (!values.length)
              throw new Error(`${field}.*: empty wildcard selection`);
            return values.flatMap((item) => walk(item, index + 1));
          }
          if (
            !value ||
            typeof value !== "object" ||
            !Object.hasOwn(value, part)
          )
            throw new Error(
              `Missing field ${parts.slice(0, index + 1).join(".")}`,
            );
          return walk((value as Record<string, unknown>)[part], index + 1);
        }
        const values = walk(entity, 0);
        return parts.includes("*") ? values : values[0];
      }
      case "unary": {
        const value = scalar(evaluate(node.operand));
        return node.sign === "-" ? -value : value;
      }
      case "call": {
        const value = evaluate(node.argument);
        const values = Array.isArray(value) ? value : [value];
        return finite(
          node.name === "sum"
            ? values.reduce((a, b) => a + b, 0)
            : values.reduce((a, b) => Math.max(a, b)),
        );
      }
      case "binary": {
        const left = scalar(evaluate(node.left));
        const right = scalar(evaluate(node.right));
        if (node.op === "/" && right === 0) throw new Error("Division by zero");
        return finite(
          node.op === "+"
            ? left + right
            : node.op === "-"
              ? left - right
              : node.op === "*"
                ? left * right
                : left / right,
        );
      }
    }
  }
  return scalar(evaluate(expression));
}

const axis = z
  .object({
    expression: z.string().min(1),
    label: z.string().optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
  })
  .strict()
  .refine(
    (axis) =>
      axis.min === undefined || axis.max === undefined || axis.min < axis.max,
    { message: "Axis min must be less than max", path: ["max"] },
  );
const common = {
  version: z.literal(1),
  id: z.string().min(1).regex(/^\S+$/u, "ID must not contain whitespace"),
  name: z.string().optional(),
};
export const balanceSchema = z.discriminatedUnion("visualization_type", [
  z
    .object({
      ...common,
      visualization_type: z.literal("scatter_plot"),
      dot_size: z.number().finite().positive().default(40),
      x: axis,
      y: axis,
    })
    .strict(),
  z
    .object({
      ...common,
      visualization_type: z.literal("bar_chart"),
      value: axis,
      order: z.enum(["descending", "ascending"]).default("descending"),
    })
    .strict(),
]);
export type BalanceConfig = z.infer<typeof balanceSchema>;
export function parseBalance(yaml: unknown): BalanceConfig {
  if (
    typeof yaml !== "string" ||
    new TextEncoder().encode(yaml).length > 2_000_000
  )
    throw new Error("YAML required (max 2 MB)");
  const document = parseDocument(yaml);
  if (document.errors.length)
    throw new Error(document.errors.map((error) => error.message).join("; "));
  const config = balanceSchema.parse(document.toJS({ maxAliasCount: 0 }));
  for (const [key, value] of Object.entries(config)) {
    if (value && typeof value === "object" && "expression" in value) {
      try {
        parseExpression(value.expression);
      } catch (error) {
        throw new Error(`${key}: ${(error as Error).message}`);
      }
    }
  }
  return config;
}
export type BalanceEntity = { id: string; data: unknown };
export function evaluateBalance(
  config: BalanceConfig,
  entities: BalanceEntity[],
) {
  const axes =
    config.visualization_type === "scatter_plot"
      ? { x: config.x, y: config.y }
      : { value: config.value };
  const compiled = Object.entries(axes).map(
    ([key, axis]) =>
      [key, axis.expression, parseExpression(axis.expression)] as const,
  );
  const points: {
    id: string;
    values: Record<string, number>;
    data: unknown;
  }[] = [];
  const omissions: { id: string; reasons: string[] }[] = [];
  for (const entity of entities) {
    const values: Record<string, number> = {};
    const reasons: string[] = [];
    for (const [key, source, expression] of compiled) {
      try {
        values[key] = evaluateExpression(expression, entity.data);
      } catch (error) {
        reasons.push(`${key} (${source}): ${(error as Error).message}`);
      }
    }
    if (reasons.length) omissions.push({ id: entity.id, reasons });
    else points.push({ ...entity, values });
  }
  if (config.visualization_type === "bar_chart")
    points.sort(
      (a, b) =>
        (config.order === "ascending"
          ? a.values.value - b.values.value
          : b.values.value - a.values.value) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  return { points, omissions };
}
export const balanceExamples = [
  {
    name: "Maintenance vs speed",
    yaml: "version: 1\nid: maintenance-vs-speed\nname: Maintenance vs speed\nvisualization_type: scatter_plot\ndot_size: 40\nx:\n  expression: sum(maintenance_cost_per_minute.*)\n  label: Maintenance per minute\ny:\n  expression: speed\n  label: Speed\n",
  },
  {
    name: "Maintenance by entity",
    yaml: "version: 1\nid: maintenance-by-entity\nname: Maintenance by entity\nvisualization_type: bar_chart\nvalue:\n  expression: sum(maintenance_cost_per_minute.*)\n  label: Maintenance per minute\norder: descending\n",
  },
];
