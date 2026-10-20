import { readFileSync } from "node:fs";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { parse, stringify } from "yaml";

const mocks = vi.hoisted(() => ({ readFile: vi.fn(), writeFile: vi.fn() }));
vi.mock("node:fs/promises", () => mocks);
import { POST } from "../src/app/api/content/entities/route";

const content = readFileSync("../../packages/content/entities.yaml", "utf8");
const parent = parse(content).entity_types.planet_blue;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.readFile.mockResolvedValue(content);
  mocks.writeFile.mockResolvedValue(undefined);
});

function create(definition: string) {
  return POST(new Request("http://localhost/api/content/entities", {
    method: "POST",
    body: JSON.stringify({ parentId: "planet_blue", childId: "planet_blue_child", definition }),
  }));
}

describe("create child entity", () => {
  it("accepts empty editor placeholders and saves a planet child and parent link", async () => {
    const response = await create(stringify({ ...parent, depot: null, depot_range: null, resource_reserves: null }));
    expect(await response.json()).toEqual({ ok: true });
    const saved = parse(mocks.writeFile.mock.calls[0][1]);
    expect(saved.entity_types.planet_blue_child).toEqual(parent);
    expect(saved.entity_types.planet_blue.builds).toContainEqual({ entity_type_id: "planet_blue_child" });
  });

  it("still rejects invalid nonempty depot fields without writing", async () => {
    const response = await create(stringify({ ...parent, depot: "yes" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("depot: must be a boolean");
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});
