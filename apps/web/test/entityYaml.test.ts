import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parse, parseDocument, stringify } from "yaml";
import {
  sortEntityDefinitions,
  stringifyEntityDefinition,
} from "@/lib/content/entityYaml";

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  rename: vi.fn(),
}));
vi.mock("node:fs/promises", () => mocks);

import { PUT } from "@/app/api/content/entities/[entityId]/route";
import { GET, POST } from "@/app/api/content/entities/route";

const authored = readFileSync("../../packages/content/entities.yaml", "utf8");
const spawn = readFileSync(
  "../../services/rts-engine/config/spawn.yaml",
  "utf8",
);

function expectSorted(value: unknown) {
  if (Array.isArray(value)) {
    for (const item of value) expectSorted(item);
  } else if (value && typeof value === "object") {
    expect(Object.keys(value)).toEqual(Object.keys(value).sort());
    for (const item of Object.values(value)) expectSorted(item);
  }
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.readFile.mockImplementation(async (path: string) =>
    path.endsWith("spawn.yaml") ? spawn : authored,
  );
  mocks.writeFile.mockResolvedValue(undefined);
});

describe("entity YAML ordering", () => {
  it("sorts nested mapping keys but preserves values and sequence order", () => {
    const value = {
      z: 0,
      attacks: [
        { priority: 9, damage: 3 },
        { priority: 1, damage: 8 },
      ],
      costs: { minerals: 1, energy: 2 },
    };
    const output = parse(stringifyEntityDefinition(value));
    expectSorted(output);
    expect(output).toEqual(value);
    expect(
      output.attacks.map((attack: { priority: number }) => attack.priority),
    ).toEqual([9, 1]);
  });
  it("retains comments and unrelated section and entity ID ordering in document saves", () => {
    const source =
      "resource_types:\n  z: {}\n  a: {}\nentity_types:\n  z:\n    speed: 2 # authored speed\n    # authored health\n    health: 3\n  a:\n    speed: 1\n    health: 4\n";
    const document = parseDocument(source);
    const output = String(sortEntityDefinitions(document));
    const value = parse(output);
    expect(Object.keys(value)).toEqual(["resource_types", "entity_types"]);
    expect(Object.keys(value.resource_types)).toEqual(["z", "a"]);
    expect(Object.keys(value.entity_types)).toEqual(["z", "a"]);
    expectSorted(value.entity_types.z);
    expect(output).toContain("# authored speed");
    expect(output).toContain("# authored health");
    expect(value).toEqual(parse(source));
    expect(String(sortEntityDefinitions(parseDocument(output)))).toBe(output);
  });
  it("returns sorted entity definitions on GET without rewriting the source file", async () => {
    const response = await GET();
    const body = await response.json();
    for (const entity of body.entities) {
      expectSorted(parse(entity.definition));
      expect(parse(entity.definition)).toEqual(
        parse(authored).entity_types[entity.id],
      );
    }
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
  it("sorts entity definitions before child creation writes", async () => {
    const definition = parse(authored).entity_types.planet_blue;
    const response = await POST(
      new Request("http://localhost/api/content/entities", {
        method: "POST",
        body: JSON.stringify({
          parentId: "planet_blue",
          childId: "planet_blue_child",
          definition: stringify(definition),
        }),
      }),
    );
    expect(response.status).toBe(200);
    const content = parse(mocks.writeFile.mock.calls[0][1]);
    for (const entity of Object.values(content.entity_types))
      expectSorted(entity);
    expect(content.entity_types.planet_blue_child).toEqual(definition);
  });
  it("sorts update writes and returns the saved definition for the editor baseline", async () => {
    const definition = parse(authored).entity_types.habitat;
    const response = await PUT(
      new Request("http://localhost/api/content/entities/habitat", {
        method: "PUT",
        body: JSON.stringify({ definition: stringify(definition) }),
      }),
      { params: Promise.resolve({ entityId: "habitat" }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    const contentWrite = mocks.writeFile.mock.calls.find(([path]) =>
      String(path).endsWith("entities.yaml"),
    );
    const content = parse(contentWrite?.[1]);
    for (const entity of Object.values(content.entity_types))
      expectSorted(entity);
    expectSorted(parse(body.definition));
    expect(parse(body.definition)).toEqual(content.entity_types.habitat);
    expect(content.entity_types.habitat).toEqual(definition);
  });
});
