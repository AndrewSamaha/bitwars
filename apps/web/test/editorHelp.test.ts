import { describe, expect, it } from "vitest";
import { completionHelp, contentSchemas, hoverHelp, type ContentKind } from "../src/lib/content/editorHelp";
import { resourceSharingPolicyErrors, resourceReserveErrors, unknownEntityFieldErrors } from "../src/lib/content/schemaValidation";

function hover(source: string, kind: ContentKind = "entity") {
  const offset = source.indexOf("|");
  return hoverHelp(source.replace("|", ""), offset, kind);
}
function complete(source: string, kind: ContentKind = "entity") {
  const offset = source.indexOf("|");
  return completionHelp(source.replace("|", ""), offset, offset, kind);
}

describe("content editor help", () => {
  it("documents sharing policies and validates thresholds against resource capacity", () => {
    const source = "resource_sharing:\n  resources:\n    energy:\n      |";
    expect(complete(source).suggestions.map(item => item.label).sort()).toEqual(["fill_to", "overflow_priority", "priority", "refill_below", "reserve"]);
    expect(hover("resource_sharing:\n  resources:\n    energy:\n      |reserve: 50")).toContain("Keep this stock");
    expect(hover("resource_sharing:\n  resources:\n    energy:\n      |overflow_priority: -1")).toContain("surplus");
    const policy = { priority: 10, refill_below: 700, fill_to: 900, reserve: 900 };
    const entity = (changes = {}, resource = "energy") => ({
      max_capacity: { energy: 1000 },
      resource_sharing: { range: 4000, resources: { [resource]: { ...policy, ...changes } } },
    });
    expect(unknownEntityFieldErrors(entity())).toEqual([]);
    expect(resourceSharingPolicyErrors(entity(), new Set(["energy"]))).toEqual([]);
    expect(resourceSharingPolicyErrors(entity({ overflow_priority: -1 }))).toEqual([]);
    expect(resourceSharingPolicyErrors(entity({ overflow_priority: null }))).toEqual([]);
    for (const changes of [{ refill_below: -1 }, { refill_below: 901 }, { fill_to: 1001 }, { reserve: -1 },
      { reserve: 1001 }, { priority: 0.5 }, { fill_to: NaN }, { fill_to: undefined },
      { overflow_priority: 0.5 }, { overflow_priority: "1" }, { overflow_priority: 2147483648 }]) {
      expect(resourceSharingPolicyErrors(entity(changes)).length).toBeGreaterThan(0);
    }
    expect(resourceSharingPolicyErrors(entity({}, "unknown"), new Set(["energy"])).join(" ")).toContain("unknown resource");
    expect(resourceSharingPolicyErrors({ ...entity(), max_capacity: { energy: 0 } })[0]).toContain("positive max_capacity");
    expect(unknownEntityFieldErrors(entity({ typo: 1 }))[0]).toContain("typo");
    expect(resourceSharingPolicyErrors({ resource_sharing: { range: 4000 } })).toEqual([]);
  });

  it("documents and validates shared-inventory upkeep reserves", () => {
    expect(complete("|").suggestions.map((item) => item.label)).toContain("resource_reserves");
    expect(hover("resource_reserves:\n  |food: 5")).toContain("upkeep buffers");
    const entity = (reserve: unknown) => ({ max_capacity: { food: 50 }, resource_reserves: { food: reserve } });
    for (const reserve of [0, 5, 50]) expect(resourceReserveErrors(entity(reserve), new Set(["food"]))).toEqual([]);
    for (const reserve of [-1, 51, NaN, Infinity, "5", null]) expect(resourceReserveErrors(entity(reserve)).length).toBeGreaterThan(0);
    expect(resourceReserveErrors({})).toEqual([]);
    expect(resourceReserveErrors({ resource_reserves: [] }).length).toBeGreaterThan(0);
    expect(resourceReserveErrors(entity(5), new Set(["energy"])).join(" ")).toContain("unknown resource");
    expect(resourceReserveErrors({ resource_reserves: { food: 5 } }).join(" ")).toContain("max_capacity");
    expect(unknownEntityFieldErrors(entity(5))).toEqual([]);
  });

  it("documents every property and enum choice in both generated schemas", () => {
    function audit(node: unknown, path: string) {
      if (!node || typeof node !== "object") return;
      const schema = node as Record<string, any>;
      for (const [key, field] of Object.entries(schema.properties ?? {})) {
        expect((field as { description?: string }).description, `${path}.${key}`).toBeTruthy();
      }
      if (schema.enum || schema.const !== undefined) expect(schema.description, path).toBeTruthy();
      for (const [key, value] of Object.entries(schema)) audit(value, `${path}.${key}`);
    }
    for (const [kind, schema] of Object.entries(contentSchemas)) audit(schema, kind);
  });

  it("distinguishes sensor, weapon, and repair range", () => {
    expect(hover("sensor:\n  |range: 100")).toContain("detection");
    expect(hover("combat:\n  attacks:\n    - id: laser\n      |range: 100")).toContain("laser distance");
    expect(hover("repair: { |range: 100 }")).toContain("repair distance");
  });

  it("documents enum values and recursive requirements in context", () => {
    expect(hover("effects:\n  - operation: |cap", "technology")).toContain("smaller");
    expect(hover("fog_memory: |retain_last_known")).toContain("last observed");
    expect(hover("requires:\n  all:\n    - any:\n        - |base", "technology")).toContain("technology");
    expect(hover("requires: { |any: [base] }", "technology")).toContain("At least one");
    expect(hover("display_name: |cap", "technology")).toContain("Player-facing");
    expect(hover("# |range: 50")).toBeUndefined();
  });

  it("inherits help for resource map entries", () => {
    expect(hover("research_cost:\n  |energy: 20", "technology")).toContain("progressively");
    expect(hover("radiation_shielding:\n  heat:\n    |distance_offset: 50")).toContain("actual source distance");
  });

  it("offers keys at the current object level including incomplete YAML", () => {
    expect(complete("|").suggestions.map((item) => item.label)).toContain("sensor");
    const sensor = complete("sensor:\n  |").suggestions;
    expect(sensor.map((item) => item.label)).toEqual(["cost_per_minute", "range"]);
    expect(sensor.find((item) => item.label === "range")?.documentation).toContain("detection");
    expect(complete("combat:\n  attacks:\n    - id: laser\n      |").suggestions.map((item) => item.label)).toContain("cooldown_ticks");
    expect(complete("requires:\n  all:\n    - |", "technology").suggestions.map((item) => item.label)).toEqual(["all", "any"]);
  });

  it("offers documented enums, booleans, and current reference categories", () => {
    const operations = complete("effects:\n  - operation: |", "technology").suggestions;
    expect(operations.map((item) => item.label)).toEqual(["add", "multiply", "set", "cap"]);
    expect(operations.every((item) => item.documentation)).toBe(true);
    expect(complete("granted_on_spawn: |", "technology").suggestions.map((item) => item.label)).toEqual(["true", "false"]);
    expect(complete("builds:\n  - entity_type_id: |").references).toBe("entities");
    expect(complete("requires:\n  any:\n    - |", "technology").references).toBe("technologies");
    expect(complete("requires: base\neffects:\n  - target: |", "technology").references).toBeUndefined();
  });

  it("completes entity-schema paths for effect targets", () => {
    expect(complete("effects:\n  - target: |", "technology").suggestions.map((item) => item.label)).toEqual(["entity"]);
    const entity = complete("effects:\n  - target: entity.|", "technology").suggestions;
    expect(entity.map((item) => item.label)).toContain("health");
    expect(entity.find((item) => item.label === "health")?.filterText).toBe("entity.health");
    expect(entity.find((item) => item.label === "sensor")?.insertText).toBe("sensor.");
    expect(complete("effects:\n  - target: entity.sensor.|", "technology").suggestions.map((item) => item.label)).toContain("range");
  });

  it("replaces a partial key without inserting a second colon", () => {
    const text = "sensor:\n  ran: 100";
    const start = text.indexOf("ran");
    const help = completionHelp(text, start, start + 3, "entity");
    expect(help.suggestions.find((item) => item.label === "range")?.insertText).toBe("range");
  });
  it("documents shared per-resource capacity and retires the separate cargo limit", () => {
    expect(hover("|max_capacity:\n  food: 50")).toContain("shipments and upkeep");
    const keys = complete("collector:\n  |").suggestions.map((item) => item.label);
    expect(keys).toContain("transport_rate_per_second");
    expect(keys).not.toContain("carry_capacity");
  });

  it("explains upkeep-first supply and the donor's bulk protection", () => {
    expect(hover("|resource_reserves:\n  energy: 5")).toContain("one minute of upkeep");
    expect(hover("resource_sharing:\n  resources:\n    energy:\n      |priority: 10")).toContain("higher effective priority than the donor");
    expect(hover("resource_sharing:\n  resources:\n    energy:\n      |fill_to: 900")).toContain("operating supply may draw below it");
  });

});
