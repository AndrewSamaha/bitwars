import { describe, expect, it } from "vitest";
import { completionHelp, contentSchemas, hoverHelp, type ContentKind } from "../src/lib/content/editorHelp";

function hover(source: string, kind: ContentKind = "entity") {
  const offset = source.indexOf("|");
  return hoverHelp(source.replace("|", ""), offset, kind);
}
function complete(source: string, kind: ContentKind = "entity") {
  const offset = source.indexOf("|");
  return completionHelp(source.replace("|", ""), offset, offset, kind);
}

describe("content editor help", () => {
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
});
