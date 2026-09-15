import entitySchema from "@bitwars/content/entity.schema.json";

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

function resolve(schema: JsonSchema): JsonSchema {
  if (!schema.$ref) return schema;
  const name = schema.$ref.match(/^#\/\$defs\/(.+)$/)?.[1];
  return name ? rootSchema.$defs?.[name] ?? schema : schema;
}

function schemaForValue(schema: JsonSchema, value: unknown): JsonSchema {
  const resolved = resolve(schema);
  if (!resolved.anyOf) return resolved;
  const valueType = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
  return resolved.anyOf
    .map(resolve)
    .find((option) => option.type === valueType || (Array.isArray(option.type) && option.type.includes(valueType)))
    ?? resolved.anyOf.map(resolve)[0]!;
}

function collectUnknownFields(value: unknown, schema: JsonSchema, path: string, errors: string[]) {
  const resolved = schemaForValue(schema, value);
  if (Array.isArray(value)) {
    if (resolved.items) value.forEach((item, index) => collectUnknownFields(item, resolved.items!, `${path}[${index}]`, errors));
    return;
  }
  if (!value || typeof value !== "object") return;

  const properties = resolved.properties;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (properties?.[key]) {
      collectUnknownFields(child, properties[key], childPath, errors);
      continue;
    }
    if (resolved.additionalProperties === false) {
      errors.push(`Unknown field \`${childPath}\``);
    } else if (typeof resolved.additionalProperties === "object") {
      collectUnknownFields(child, resolved.additionalProperties, childPath, errors);
    }
  }
}

/** Checks the generated content schema's closed objects before a content write. */
export function unknownEntityFieldErrors(value: unknown): string[] {
  const errors: string[] = [];
  collectUnknownFields(value, rootSchema, "entity", errors);
  return errors;
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
