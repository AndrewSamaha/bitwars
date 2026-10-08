import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { stringify } from "yaml";
import { parseSpawnConfig } from "../src/lib/content/spawnConfig";

const mocks = vi.hoisted(() => ({ readFile: vi.fn(), writeFile: vi.fn(), auth: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile, writeFile: mocks.writeFile }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: mocks.auth }));
import { GET, PUT } from "../src/app/api/content/spawn/route";

const yaml = readFileSync(path.resolve(process.cwd(), "../../services/rts-engine/config/spawn.yaml"), "utf8");

describe("spawn configuration editor", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ res: null });
    mocks.readFile.mockResolvedValue(yaml);
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
      yaml.replace("min: 2000", "min: 11000"),
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
