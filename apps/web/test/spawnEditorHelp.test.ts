import { describe, expect, it } from "vitest";
import schema from "../src/lib/content/spawn.schema.json";
import { spawnJsonSchema } from "../src/lib/content/spawnConfig";
import { completionHelp, hoverHelp } from "../src/lib/content/editorHelp";

function complete(source: string) {
  const offset = source.indexOf("|");
  return completionHelp(source.replace("|", ""), offset, offset, "spawn");
}

describe("procedural spawn editor help", () => {
  it("keeps the generated language-service schema in sync", () => {
    expect(schema).toEqual(spawnJsonSchema());
  });
  it("completes generation settings and documents exposure", () => {
    expect(complete("|").suggestions.map(s => s.label)).toEqual(expect.arrayContaining(["exposure", "solar_systems", "player_starts"]));
    const source = "exposure:\n  reference_distance: 3750";
    expect(hoverHelp(source, source.indexOf("reference_distance"), "spawn")).toContain("strength-1");
    expect(complete("solar_systems:\n  planets:\n    placement:\n      sampling: |").suggestions.map(s => s.label)).toEqual(expect.arrayContaining(["uniform_radius", "uniform_area"]));
  });
  it("suggests entity references in values and map keys", () => {
    for (const source of ["solar_systems:\n  anchor_type: |", "player_starts:\n  planet_type: |", "exposure:\n  sources:\n    |: 1", "solar_systems:\n  planets:\n    type_weights:\n      points:\n        - exposure: 1\n          weights:\n            |: 10"]) {
      expect(complete(source).references, source).toBe("entities");
    }
    expect(complete("solar_systems:\n  planets:\n    count_weights:\n      |: 10").references).toBeUndefined();
    expect(complete("player_starts:\n  inhabited_planet_type: |").references).toBe("entities");
    const source = "player_starts:\n  inhabited_planet_type: planet_blue_inhabitated";
    expect(hoverHelp(source, source.indexOf("inhabited_planet_type"), "spawn")).toContain("replacing the selected neutral planet");
  });
});
