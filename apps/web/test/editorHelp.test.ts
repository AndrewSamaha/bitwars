import { describe, expect, it } from "vitest";
import { completionHelp, hoverHelp, type ContentKind } from "../src/lib/content/editorHelp";
import { initialResourceErrors, resourceSharingPolicyErrors, resourceReserveErrors, unknownEntityFieldErrors } from "../src/lib/content/schemaValidation";

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
    const entity = (reserve: unknown) => ({ max_capacity: { food: 50 }, resource_reserves: { food: reserve } });
    for (const reserve of [0, 5, 50]) expect(resourceReserveErrors(entity(reserve), new Set(["food"]))).toEqual([]);
    for (const reserve of [-1, 51, NaN, Infinity, "5", null]) expect(resourceReserveErrors(entity(reserve)).length).toBeGreaterThan(0);
    expect(resourceReserveErrors({})).toEqual([]);
    expect(resourceReserveErrors({ resource_reserves: [] }).length).toBeGreaterThan(0);
    expect(resourceReserveErrors(entity(5), new Set(["energy"])).join(" ")).toContain("unknown resource");
    expect(resourceReserveErrors({ resource_reserves: { food: 5 } }).join(" ")).toContain("max_capacity");
    expect(unknownEntityFieldErrors(entity(5))).toEqual([]);
  });

  it("documents and validates creation-only initial inventory", () => {
    expect(complete("|").suggestions.map((item) => item.label)).toContain("initial_resources");
    const entity = (amount: unknown) => ({ max_capacity: { food: 50 }, initial_resources: { food: amount } });
    for (const amount of [0, 5, 50]) expect(initialResourceErrors(entity(amount), new Set(["food"]))).toEqual([]);
    for (const amount of [-1, 51, NaN, Infinity, -Infinity, "5", null]) expect(initialResourceErrors(entity(amount)).length).toBeGreaterThan(0);
    expect(initialResourceErrors({})).toEqual([]);
    expect(initialResourceErrors({ initial_resources: [] }).length).toBeGreaterThan(0);
    expect(initialResourceErrors(entity(5), new Set(["energy"])).join(" ")).toContain("unknown resource");
    expect(initialResourceErrors({ initial_resources: { food: 0 } }).join(" ")).toContain("max_capacity");
    expect(initialResourceErrors({ max_capacity: { food: 0 }, initial_resources: { food: 0 } })).toEqual([]);
    for (const capacity of [-1, NaN, Infinity]) {
      expect(initialResourceErrors({ max_capacity: { food: capacity }, initial_resources: { food: 0 } }).length).toBeGreaterThan(0);
    }
    expect(unknownEntityFieldErrors(entity(5))).toEqual([]);
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
    const keys = complete("collector:\n  |").suggestions.map((item) => item.label);
    expect(keys).toContain("transport_rate_per_second");
    expect(keys).not.toContain("carry_capacity");
  });


});
