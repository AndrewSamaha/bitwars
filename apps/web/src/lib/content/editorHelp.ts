import { isMap, isScalar, isSeq, parseDocument } from "yaml";
import entitySchema from "@bitwars/content/entity.schema.json";
import technologySchema from "@bitwars/content/technology.schema.json";

export type ContentKind = "entity" | "technology";
type Schema = {
  $ref?: string;
  $defs?: Record<string, Schema>;
  description?: string;
  default?: unknown;
  type?: string | string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  items?: Schema;
  anyOf?: Schema[];
  oneOf?: Schema[];
  enum?: unknown[];
  const?: unknown;
};
type Path = (string | number)[];
export const contentSchemas: Record<ContentKind, Schema> = { entity: entitySchema as Schema, technology: technologySchema as Schema };

// Expand only the current level: requirement schemas can refer to themselves.
function variants(schema: Schema, root: Schema): Schema[] {
  if (schema.$ref) {
    const target = root.$defs?.[schema.$ref.replace("#/$defs/", "")];
    if (target) return variants({ ...target, ...schema, $ref: undefined }, root);
  }
  const alternatives = schema.anyOf ?? schema.oneOf;
  return alternatives
    ? alternatives.flatMap((child) => variants({ description: schema.description, default: schema.default, ...child }, root))
    : [schema];
}

export function schemasAt(kind: ContentKind, path: Path): Schema[] {
  const root = contentSchemas[kind];
  let candidates = variants(root, root);
  for (const key of path) {
    candidates = candidates.flatMap((schema) => {
      const child = typeof key === "number" ? schema.items : schema.properties?.[key]
        ?? (typeof schema.additionalProperties === "object" ? schema.additionalProperties : undefined);
      if (!child) return [];
      // Map entries and array items inherit their enclosing field's explanation.
      return variants({ description: schema.description, ...child }, root);
    });
  }
  return candidates;
}

function location(text: string, offset: number): { path: Path; key: boolean; value?: unknown } | undefined {
  const doc = parseDocument(text);
  function find(node: unknown, path: Path): ReturnType<typeof location> {
    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isScalar(pair.key)) continue;
        const childPath = [...path, String(pair.key.value)];
        const range = pair.key.range;
        if (range && offset >= range[0] && offset < range[1]) return { path: childPath, key: true };
        const child = find(pair.value, childPath);
        if (child) return child;
      }
    } else if (isSeq(node)) {
      for (const [index, item] of node.items.entries()) {
        const child = find(item, [...path, index]);
        if (child) return child;
      }
    } else if (isScalar(node) && node.range && offset >= node.range[0] && offset < node.range[1]) {
      return { path, key: false, value: node.value };
    }
    return undefined;
  }
  return find(doc.contents, []);
}

function documentation(schemas: Schema[], value?: unknown): string | undefined {
  const matching = value === undefined ? schemas : schemas.filter((schema) =>
    schema.const === value || schema.enum?.includes(value));
  const selected = matching.length ? matching : schemas;
  const descriptions = [...new Set(selected.flatMap((schema) => schema.description ? [schema.description] : []))];
  const defaults = selected.find((schema) => schema.default !== undefined);
  if (defaults) descriptions.push(`Default: ${JSON.stringify(defaults.default)}.`);
  return descriptions.join("\n\n") || undefined;
}

export function hoverHelp(text: string, offset: number, kind: ContentKind): string | undefined {
  const at = location(text, offset);
  return at ? documentation(schemasAt(kind, at.path), at.key ? undefined : at.value) : undefined;
}

export type HelpCompletion = { label: string; insertText: string; documentation?: string; property?: boolean; filterText?: string };
function effectTargetCompletions(prefix: string): HelpCompletion[] {
  const segments = prefix.split(".");
  if (!prefix.includes(".")) return "entity".startsWith(prefix) ? [{ label: "entity", insertText: "entity." }] : [];
  if (segments[0] !== "entity") return [];
  const schemas = schemasAt("entity", segments.slice(1, -1));
  const filterPrefix = `${segments.slice(0, -1).join(".")}.`;
  return [...new Map(schemas.flatMap((schema) => Object.entries(schema.properties ?? {})).map(([label, child]) => [label, {
    label,
    insertText: `${label}${variants(child, contentSchemas.entity).some((schema) => schema.properties) ? "." : ""}`,
    filterText: `${filterPrefix}${label}`,
    documentation: documentation(variants(child, contentSchemas.entity)),
    property: true,
  }])).values()];
}
export function completionHelp(text: string, start: number, end: number, kind: ContentKind): {
  suggestions: HelpCompletion[];
  references?: "entities" | "technologies";
} {
  const targetPrefix = kind === "technology"
    ? text.slice(text.lastIndexOf("\n", start - 1) + 1, start).match(/^\s*-\s+target:\s*([^\s]*)$/)?.[1]
    : undefined;
  if (targetPrefix !== undefined) return { suggestions: effectTargetCompletions(targetPrefix) };
  // Parse a placeholder so incomplete keys/empty values still have a YAML path.
  const marker = "__bitwars_completion__";
  const draft = text.slice(0, start) + marker + text.slice(end);
  const at = location(draft, start);
  if (!at) return { suggestions: [] };
  const lineEnd = draft.indexOf("\n", start);
  const suffix = draft.slice(start + marker.length, lineEnd < 0 ? undefined : lineEnd);
  const parent = schemasAt(kind, at.path.slice(0, -1));
  const schemas = schemasAt(kind, at.path);
  // An unfinished block key parses as a scalar; its schema is an object.
  const keySchemas = at.key ? parent : schemas.filter((schema) => schema.properties);
  const suggestions: HelpCompletion[] = keySchemas.flatMap((schema) => Object.entries(schema.properties ?? {}).map(([label, child]) => ({
    label,
    insertText: `${label}${at.key && /^\s*:/.test(suffix) ? "" : ": "}`,
    documentation: documentation(variants(child, contentSchemas[kind])),
    property: true,
  })));
  if (!at.key) {
    for (const schema of schemas) {
      const values = schema.enum ?? (schema.const !== undefined ? [schema.const] : schema.type === "boolean" ? [true, false] : []);
      for (const value of values) suggestions.push({ label: String(value), insertText: String(value), documentation: documentation([schema]) });
    }
  }
  const names = at.path.filter((key): key is string => typeof key === "string");
  const field = names.at(-1);
  const references = at.key ? undefined
    : field === "entity_type_id" || field === "deposit_entity_types" ? "entities"
    : names.some((name) => ["requires", "requires_technologies", "researches"].includes(name)) ? "technologies"
    : undefined;
  return { suggestions: [...new Map(suggestions.map((item) => [item.label, item])).values()], references };
}
