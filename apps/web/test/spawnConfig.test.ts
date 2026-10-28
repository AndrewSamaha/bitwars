import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { parse, stringify } from "yaml";
import { parseSpawnConfig, renameSpawnEntity } from "../src/lib/content/spawnConfig";

const mocks = vi.hoisted(() => ({ readFile: vi.fn(), writeFile: vi.fn(), auth: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile, writeFile: mocks.writeFile }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: mocks.auth }));
import { GET, PUT } from "../src/app/api/content/spawn/route";

const yaml = readFileSync(path.resolve(process.cwd(), "../../services/rts-engine/config/spawn.yaml"), "utf8");

const content = readFileSync(path.resolve(process.cwd(), "../../packages/content/entities.yaml"), "utf8");

describe("spawn configuration editor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ res: null });
    mocks.readFile.mockImplementation((file: string) => Promise.resolve(file.endsWith("entities.yaml") ? content : yaml));
    mocks.writeFile.mockResolvedValue(undefined);
  });

  it("loads and saves the current config without losing YAML comments", async () => {
    expect(await (await GET()).json()).toEqual({ yaml });
    const submitted = `# Edited spawn configuration\n${yaml}`;
    const response = await PUT(new Request("http://localhost/api/content/spawn", { method: "PUT", body: JSON.stringify({ yaml: submitted }) }));
    expect(response.status).toBe(200);
    expect(mocks.writeFile).toHaveBeenCalledWith(expect.stringContaining("config/spawn.yaml"), submitted);
  });

  it("rejects invalid distributions, counts, fields and YAML before writing", async () => {
    for (const invalid of [
      yaml.replace("sd: 2000", "sd: -1"),
      yaml.replace("min: 6000", "min: 11000"),
      yaml.replace("max: 20000", "max: 9000"),
      yaml.replace("count: 100", "count: -1"),
      yaml.replace("average: 10000", "average: .inf"),
      `${yaml}\nunknown_field: 1\n`,
      "loadouts: [",
    ]) {
      const response = await PUT(new Request("http://localhost/api/content/spawn", { method: "PUT", body: JSON.stringify({ yaml: invalid }) }));
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBeTruthy();
    }
    expect(mocks.writeFile).not.toHaveBeenCalled();
    const config = parseSpawnConfig(yaml);
    config.loadouts = [];
    expect(() => parseSpawnConfig(stringify(config))).toThrow();
    config.loadouts = [{ worker: 1 }];
    config.global_neutral_fields = [];
    expect(() => parseSpawnConfig(stringify(config))).toThrow("star_yellow");
  });

  it("requires authentication before reading or saving the file", async () => {
    mocks.auth.mockResolvedValue({ res: new Response(null, { status: 401 }) });
    expect((await GET()).status).toBe(401);
    expect((await PUT(new Request("http://localhost/api/content/spawn", { method: "PUT" }))).status).toBe(401);
    expect(mocks.readFile).not.toHaveBeenCalled();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});


describe("procedural spawn rules", () => {
  it("saves star and theta fields with distribution-backed food and minerals", async () => {
    const config = parse(yaml);
    config.global_neutral_fields = config.global_neutral_fields.filter((field: { type: string }) => ["star_yellow", "theta"].includes(field.type));
    const entities = parse(content);
    delete entities.entity_types.planet_blue.resource_node.amount;
    delete entities.entity_types.minerals.resource_node.amount;
    mocks.auth.mockResolvedValue({ res: null });
    mocks.readFile.mockResolvedValue(stringify(entities));
    const response = await PUT(new Request("http://localhost/api/content/spawn", { method: "PUT", body: JSON.stringify({ yaml: stringify(config) }) }));
    expect(response.status).toBe(200);
  });

  it("uses distribution stock before entity stock and falls back when absent", () => {
    const config = parse(yaml);
    const entities = parse(content);
    delete entities.entity_types.planet_blue.resource_node.regeneration;
    entities.entity_types.planet_blue.resource_node.amount = 2000;
    delete config.resource_amounts.planet_blue;
    expect(() => parseSpawnConfig(stringify(config), entities)).not.toThrow();
    config.resource_amounts.planet_blue = { average: 0, sd: 0, min: 0, max: 0 };
    expect(() => parseSpawnConfig(stringify(config), entities)).toThrow("Starting planet requires finite food");
    delete config.resource_amounts.planet_blue;
    delete entities.entity_types.planet_blue.resource_node.amount;
    expect(() => parseSpawnConfig(stringify(config), entities)).toThrow("Starting planet requires finite food");
  });

  it("rejects distributions on entities without resource nodes", () => {
    const config = parse(yaml);
    config.resource_amounts.worker = { average: 100, sd: 0, min: 100, max: 100 };
    expect(() => parseSpawnConfig(stringify(config), parse(content))).toThrow("requires a resource node: worker");
  });

  it("requires positive minimum stock for every renewable node", () => {
    const config = parse(yaml);
    const entities = parse(content);
    entities.entity_types.minerals.resource_node.regeneration = {};
    config.resource_amounts.minerals.min = 0;
    expect(() => parseSpawnConfig(stringify(config), entities)).toThrow("Renewable resource minerals");
    config.resource_amounts.minerals.sd = 0;
    expect(() => parseSpawnConfig(stringify(config), entities)).not.toThrow();
  });

  it("checks attainable mineral stock for fixed and sampled distributions", () => {
    const config = parse(yaml);
    config.resource_amounts.minerals = { average: 100, sd: 0, min: 0, max: 2000 };
    expect(() => parseSpawnConfig(stringify(config), parse(content))).toThrow("Mineral stock cannot meet start minimum");
    config.resource_amounts.minerals.sd = 1;
    expect(() => parseSpawnConfig(stringify(config), parse(content))).not.toThrow();
  });

  it("reports an empty planet table as a schema error", () => {
    const config = parse(yaml);
    config.solar_systems.planets.type_weights.points = [];
    expect(() => parseSpawnConfig(stringify(config))).toThrow("solar_systems.planets.type_weights.points:");
  });

  it("validates the real content and rejects unknown references", () => {
    const config = parseSpawnConfig(yaml, parse(content));
    config.exposure.sources.missing_star = 1;
    expect(() => parseSpawnConfig(stringify(config), parse(content))).toThrow("Unknown spawn entity");
  });
  it("rejects invalid exposure tables, incomplete configuration and local sources", () => {
    for (const edit of [
      (v: any) => { delete v.exposure; },
      (v: any) => { v.exposure.minimum_distance = 0; },
      (v: any) => { v.solar_systems.planets.count_weights = { 0: 100 }; },
      (v: any) => { v.solar_systems.planets.type_weights.points[1].exposure = 0.1; },
      (v: any) => { v.solar_systems.planets.type_weights.points[0].weights.planet_blue = -1; },
      (v: any) => { v.solar_systems.populations[0].type = "theta"; },
      (v: any) => { v.player_starts.exposure.min = 5; },
      (v: any) => { v.player_starts.placement.radiation_clearance_multiplier = 0.5; },
      (v: any) => { v.solar_systems.planets.placement.unknown = true; },
    ]) {
      const config = parse(yaml); edit(config);
      expect(() => parseSpawnConfig(stringify(config))).toThrow();
    }
  });
  it("accepts quoted count keys but rejects numeric/string key collisions", () => {
    const quoted = yaml.replace("      0: 15", '      "0": 15');
    expect(parseSpawnConfig(quoted).solar_systems.planets.count_weights["0"]).toBe(15);
    expect(() => parseSpawnConfig(yaml.replace('      "0": 15', '      0: 15\n      "0": 10'))).toThrow("Duplicate spawn key");
  });
  it("renames entity keys and values without changing resource IDs or count keys", () => {
    const renamed = renameSpawnEntity(parseSpawnConfig(yaml), "planet_blue", "planet_temperate");
    expect(renamed.player_starts.planet_type).toBe("planet_temperate");
    expect(renamed.solar_systems.planets.type_weights.points[0].weights).toHaveProperty("planet_temperate");
    expect(renamed.resource_amounts).toHaveProperty("planet_temperate");
    const minerals = renameSpawnEntity(parseSpawnConfig(yaml), "minerals", "mineral_node");
    expect(minerals.starting_resources).toHaveProperty("minerals");
    expect(minerals.resource_amounts).toHaveProperty("mineral_node");
    const sources = renameSpawnEntity(parseSpawnConfig(yaml), "star_yellow", "star_red");
    expect(sources.exposure.sources).toHaveProperty("star_red");
    expect(sources.solar_systems.anchor_type).toBe("star_red");
  });
});
