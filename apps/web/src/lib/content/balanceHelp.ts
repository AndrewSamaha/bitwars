import entitySchema from "@bitwars/content/entity.schema.json";

type Schema = {
  type?: string | string[];
  $ref?: string;
  $defs?: Record<string, Schema>;
  properties?: Record<string, Schema>;
  additionalProperties?: Schema | boolean;
  items?: Schema;
  anyOf?: Schema[];
  oneOf?: Schema[];
};
export function balanceFieldPaths(entities: unknown[]): string[] {
  const result = new Set<string>();
  const root = entitySchema as Schema;
  function schemaWalk(schema: Schema, prefix: string, depth: number) {
    if (depth > 12) return;
    if (schema.$ref) {
      const target = root.$defs?.[schema.$ref.split("/").at(-1) ?? ""];
      if (target) schemaWalk(target, prefix, depth + 1);
      return;
    }
    for (const variant of schema.anyOf ?? schema.oneOf ?? [])
      schemaWalk(variant, prefix, depth + 1);
    if (schema.type === "number" || schema.type === "integer")
      result.add(prefix);
    for (const [key, child] of Object.entries(schema.properties ?? {}))
      schemaWalk(child, prefix ? `${prefix}.${key}` : key, depth + 1);
    if (schema.items) schemaWalk(schema.items, `${prefix}.*`, depth + 1);
    if (typeof schema.additionalProperties === "object")
      schemaWalk(schema.additionalProperties, `${prefix}.*`, depth + 1);
  }
  function dataWalk(value: unknown, prefix: string, depth: number) {
    if (depth > 12) return;
    if (typeof value === "number" && Number.isFinite(value)) result.add(prefix);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      dataWalk(child, prefix ? `${prefix}.${key}` : key, depth + 1);
      if (prefix) dataWalk(child, `${prefix}.*`, depth + 1);
    }
  }
  schemaWalk(root, "", 0);
  for (const entity of entities) dataWalk(entity, "", 0);
  return [...result].filter(Boolean).sort();
}

export function expressionCompletions(prefix: string, paths: string[]) {
  const parent = prefix.includes(".")
    ? prefix.slice(0, prefix.lastIndexOf(".") + 1)
    : "";
  const fragment = prefix.slice(parent.length);
  const children = new Set(
    paths
      .filter((path) => path.startsWith(parent))
      .map((path) => path.slice(parent.length).split(".")[0]),
  );
  return [...children]
    .filter((child) => child.startsWith(fragment))
    .map((child) => ({
      label: child,
      insertText:
        child +
        (paths.some((path) => path.startsWith(`${parent}${child}.`))
          ? "."
          : ""),
    }));
}
