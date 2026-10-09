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

/** Validate upkeep buffers against each entity type's capacity. */
export function resourceReserveErrors(value: unknown, knownResources?: Set<string>): string[] {
  if (!value || typeof value !== "object") return [];
  const entity = value as { max_capacity?: Record<string, unknown>; resource_reserves?: unknown };
  const reserves = entity.resource_reserves;
  if (reserves === undefined) return [];
  if (!reserves || typeof reserves !== "object" || Array.isArray(reserves)) return ["resource_reserves must be a resource amount map"];
  const errors: string[] = [];
  for (const [resource, reserve] of Object.entries(reserves)) {
    const path = `resource_reserves.${resource}`;
    const capacity = entity.max_capacity?.[resource];
    if (knownResources && !knownResources.has(resource)) errors.push(`${path}: unknown resource`);
    if (typeof capacity !== "number" || !Number.isFinite(capacity) || capacity <= 0) errors.push(`${path}: requires positive max_capacity`);
    else if (typeof reserve !== "number" || !Number.isFinite(reserve) || reserve < 0 || reserve > capacity) errors.push(`${path}: must be between 0 and max_capacity (${capacity})`);
  }
  return errors;
}

/** Cross-field constraints that JSON Schema cannot express for inventory policies. */
export function resourceSharingPolicyErrors(value: unknown, knownResources?: Set<string>): string[] {
  if (!value || typeof value !== "object") return [];
  const entity = value as { max_capacity?: Record<string, unknown>; resource_sharing?: { resources?: unknown } };
  const policies = entity.resource_sharing?.resources;
  if (policies === undefined) return [];
  if (!policies || typeof policies !== "object" || Array.isArray(policies)) return ["resource_sharing.resources must be a resource policy map"];
  const errors: string[] = [];
  for (const [resource, policy] of Object.entries(policies)) {
    const path = `resource_sharing.resources.${resource}`;
    const capacity = entity.max_capacity?.[resource];
    if (knownResources && !knownResources.has(resource)) errors.push(`${path}: unknown resource`);
    if (typeof capacity !== "number" || !Number.isFinite(capacity) || capacity <= 0) {
      errors.push(`${path}: requires positive max_capacity for ${resource}`);
      continue;
    }
    if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
      errors.push(`${path}: must be a policy object`);
      continue;
    }
    const fields = policy as Record<string, unknown>;
    const priority = fields.priority;
    if (typeof priority !== "number" || !Number.isInteger(priority) || priority < -2147483648 || priority > 2147483647) {
      errors.push(`${path}.priority: must be a 32-bit integer`);
    }
    const overflowPriority = fields.overflow_priority;
    if (overflowPriority != null && (typeof overflowPriority !== "number" || !Number.isInteger(overflowPriority)
      || overflowPriority < -2147483648 || overflowPriority > 2147483647)) {
      errors.push(`${path}.overflow_priority: must be a 32-bit integer when provided`);
    }
    const { refill_below, fill_to, reserve } = fields;
    if (typeof refill_below !== "number" || !Number.isFinite(refill_below)
      || typeof fill_to !== "number" || !Number.isFinite(fill_to)
      || refill_below < 0 || refill_below > fill_to || fill_to > capacity) {
      errors.push(`${path}: requires 0 <= refill_below <= fill_to <= max_capacity (${capacity})`);
    }
    if (typeof reserve !== "number" || !Number.isFinite(reserve) || reserve < 0 || reserve > capacity) {
      errors.push(`${path}.reserve: must be between 0 and max_capacity (${capacity})`);
    }
  }
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
