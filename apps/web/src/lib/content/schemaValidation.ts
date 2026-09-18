import entitySchema from "@bitwars/content/entity.schema.json";
import technologySchema from "@bitwars/content/technology.schema.json";

type JsonSchema = {
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
};

type RootSchema = JsonSchema & { $defs?: Record<string, JsonSchema> };

const rootSchema = entitySchema as RootSchema;
const technologyRootSchema = technologySchema as RootSchema;

function resolve(schema: JsonSchema, root: RootSchema): JsonSchema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.match(/^#\/\$defs\/(.+)$/)?.[1];
  return name ? root.$defs?.[name] ?? schema : schema;
}

function schemaForValue(schema: JsonSchema, value: unknown, root: RootSchema): JsonSchema {
  const resolved = resolve(schema, root);
  if (!resolved.anyOf) return resolved;
  const valueType = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  return resolved.anyOf
    .map((option) => resolve(option, root))
    .find((option) => option.type === valueType || (Array.isArray(option.type) && option.type.includes(valueType)))
    ?? resolved.anyOf.map((option) => resolve(option, root))[0]!;
}

function collectUnknownFields(value: unknown, schema: JsonSchema, path: string, errors: string[], root: RootSchema) {
  const resolved = schemaForValue(schema, value, root);
  if (Array.isArray(value)) {
    if (resolved.items) value.forEach((item, index) => collectUnknownFields(item, resolved.items!, `${path}[${index}]`, errors, root));
    return;
  }
  if (!value || typeof value !== "object") return;

  const properties = resolved.properties;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (properties?.[key]) {
      collectUnknownFields(child, properties[key], childPath, errors, root);
      continue;
    }
    if (resolved.additionalProperties === false) {
      errors.push(`Unknown field \`${childPath}\``);
    } else if (typeof resolved.additionalProperties === "object") {
      collectUnknownFields(child, resolved.additionalProperties, childPath, errors, root);
    }
  }
}

/** Checks the generated content schema's closed objects before a content write. */
export function unknownEntityFieldErrors(value: unknown): string[] {
  const errors: string[] = [];
  collectUnknownFields(value, rootSchema, "entity", errors, rootSchema);
  return errors;
}

export function unknownTechnologyFieldErrors(value: unknown): string[] {
  const errors: string[] = [];
  collectUnknownFields(value, technologyRootSchema, "technology", errors, technologyRootSchema);
  return errors;
}

export function technologyRequirementErrors(requirement: unknown, knownIds: Set<string>): string[] {
  if (requirement === undefined || requirement === null) return [];
  if (typeof requirement === "string") return knownIds.has(requirement) ? [] : [`Unknown technology requirement \`${requirement}\``];
  if (!requirement || typeof requirement !== "object" || Array.isArray(requirement)) return ["Invalid technology requirement"];
  const record = requirement as { all?: unknown; any?: unknown };
  const groups = (["all", "any"] as const).filter((key) => record[key] !== undefined);
  const values = groups.length === 1 ? record[groups[0]!] : undefined;
  if (!Array.isArray(values) || !values.length) return ["A technology requirement needs one non-empty all or any group"];
  return values.flatMap((item) => technologyRequirementErrors(item, knownIds));
}

export type EntityCombatRangeWarning = {
  kind: "sensor" | "attack";
  attackIndex?: number;
  message: string;
};

/**
 * Content balance guidance: an autonomous unit should be able to sense every
 * enemy it can acquire, and acquire every enemy it can shoot.
 */
export function entityCombatRangeWarnings(value: unknown): EntityCombatRangeWarning[] {
  if (!value || typeof value !== "object") return [];
  const entity = value as {
    sensor?: { range?: unknown };
    combat?: { acquisition_range?: unknown; attacks?: Array<{ range?: unknown }> };
  };
  const acquisitionRange = entity.combat?.acquisition_range;
  if (typeof acquisitionRange !== "number" || !Number.isFinite(acquisitionRange)) return [];

  const warnings: EntityCombatRangeWarning[] = [];
  const sensorRange = entity.sensor?.range;
  if (!Number.isFinite(sensorRange) || (sensorRange as number) < acquisitionRange) {
    warnings.push({
      kind: "sensor",
      message: `Sensor range (${Number.isFinite(sensorRange) ? sensorRange : "missing"}) should be at least combat acquisition range (${acquisitionRange}).`,
    });
  }
  for (const [attackIndex, attack] of (entity.combat?.attacks ?? []).entries()) {
    if (Number.isFinite(attack.range) && (attack.range as number) > acquisitionRange) {
      warnings.push({
        kind: "attack",
        attackIndex,
        message: `Weapon range (${attack.range}) exceeds combat acquisition range (${acquisitionRange}).`,
      });
    }
  }
  return warnings;
}
