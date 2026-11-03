import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canonicalContentJson, contentSha256, mutateContentResponse, readImmutableContentAsset, requestContentReload, stageContentRevision } from "../src/lib/content/contentRevisions";

const database = vi.hoisted(() => ({ get: vi.fn(), eval: vi.fn() }));
vi.mock("@/lib/db/connection", () => ({ redis: database }));

let root: string;
const authored = "entity_types:\n  worker:\n    health: 100\n    speed: 2\nresource_types:\n  minerals: { display_name: Minerals }\ntechnologies: {}\n";
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "bitwars-content-revisions-"));
  await mkdir(path.join(root, "assets/worker"), { recursive: true });
  await writeFile(path.join(root, "entities.yaml"), authored);
  await writeFile(path.join(root, "assets/worker/idle.png"), Buffer.from("original sprite bytes"));
  database.get.mockReset().mockResolvedValue(JSON.stringify({ content_revision: "a".repeat(64) }));
  database.eval.mockReset().mockImplementation(async (...args: unknown[]) => args[6]);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("canonical authored content revisions", () => {
  it("sorts keys recursively, preserves array order, and hashes UTF8 compact JSON", () => {
    const value = { z: [{ b: 1, a: "é" }, 2], a: true };
    expect(canonicalContentJson(value)).toBe('{"a":true,"z":[{"a":"é","b":1},2]}');
    expect(contentSha256(canonicalContentJson(value))).toBe(contentSha256('{"a":true,"z":[{"a":"é","b":1},2]}'));
    expect(canonicalContentJson([1, 2])).not.toBe(canonicalContentJson([2, 1]));
    expect(() => canonicalContentJson({ bad: Number.NaN })).toThrow("finite JSON");
  });

  it("is deterministic across YAML formatting and excludes generated/candidate images", async () => {
    const first = await stageContentRevision({ contentRoot: root });
    await writeFile(path.join(root, "entities.yaml"), "# formatting only\ntechnologies: {}\nresource_types: { minerals: {display_name: Minerals} }\nentity_types: { worker: {speed: 2, health: 100} }\n");
    await mkdir(path.join(root, "art-candidates/worker"), { recursive: true });
    await writeFile(path.join(root, "art-candidates/worker/candidate-1.png"), "candidate");
    await writeFile(path.join(root, "assets/worker/preview-upscaled.png"), "not a final bundle file");
    await writeFile(path.join(root, "generated.json"), "generated output");
    const second = await stageContentRevision({ contentRoot: root });
    expect(second.candidate_revision).toBe(first.candidate_revision);
    expect(second.manifest.entities.worker!.files).toEqual({ "idle.png": contentSha256("original sprite bytes") });
    expect(await readdir(path.join(root, ".revisions"))).toEqual(expect.arrayContaining(["bundles", first.candidate_revision]));
  });

  it("separates definition, bundle, resource, and global changes", async () => {
    const first = await stageContentRevision({ contentRoot: root });
    await writeFile(path.join(root, "entities.yaml"), authored.replace("health: 100", "health: 110"));
    const definition = await stageContentRevision({ contentRoot: root });
    expect(definition.manifest.entities.worker!.definition_hash).not.toBe(first.manifest.entities.worker!.definition_hash);
    expect(definition.manifest.entities.worker!.asset_hash).toBe(first.manifest.entities.worker!.asset_hash);
    await writeFile(path.join(root, "assets/worker/primary.png"), "mask");
    const mask = await stageContentRevision({ contentRoot: root });
    expect(mask.manifest.entities.worker!.definition_hash).toBe(definition.manifest.entities.worker!.definition_hash);
    expect(mask.manifest.entities.worker!.asset_hash).not.toBe(definition.manifest.entities.worker!.asset_hash);
    await writeFile(path.join(root, "entities.yaml"), authored.replace("Minerals", "Ore"));
    const resource = await stageContentRevision({ contentRoot: root });
    expect(new Set([first.candidate_revision, definition.candidate_revision, mask.candidate_revision, resource.candidate_revision]).size).toBe(4);
  });

  it("retains old immutable file bytes and rejects corrupted existing bundle storage", async () => {
    const first = await stageContentRevision({ contentRoot: root });
    const hash = first.manifest.entities.worker!.asset_hash!;
    const revisionRoot = path.join(root, ".revisions");
    await writeFile(path.join(root, "assets/worker/idle.png"), "updated sprite");
    const second = await stageContentRevision({ contentRoot: root });
    expect(second.manifest.entities.worker!.asset_hash).not.toBe(hash);
    expect((await readImmutableContentAsset("worker", hash, "idle.png", revisionRoot))!.toString()).toBe("original sprite bytes");
    await writeFile(path.join(revisionRoot, "bundles/worker", second.manifest.entities.worker!.asset_hash!, "idle.png"), "corrupt storage");
    await expect(stageContentRevision({ contentRoot: root })).rejects.toThrow("Immutable content conflict");
  });

  it("includes public corvette fallback art without inventing an authored definition", async () => {
    const fallback = path.join(root, "public/assets");
    await mkdir(path.join(fallback, "corvette"), { recursive: true });
    await writeFile(path.join(fallback, "corvette/idle.png"), "fallback");
    const result = await stageContentRevision({ contentRoot: root, fallbackRoot: fallback });
    expect(result.manifest.entities.corvette!.definition_hash).toBe("");
    expect(result.manifest.entities.corvette!.files["idle.png"]).toBe(contentSha256("fallback"));
  });

  it("confines asset reads and refuses source symlinks outside the asset root", async () => {
    const result = await stageContentRevision({ contentRoot: root });
    const hash = result.manifest.entities.worker!.asset_hash!;
    const revisionRoot = path.join(root, ".revisions");
    for (const [entity, digest, filename] of [["../worker", hash, "idle.png"], ["worker", "../bad", "idle.png"], ["worker", hash, "../../entities.yaml"], ["worker", hash, "request.json"]]) {
      expect(await readImmutableContentAsset(entity!, digest!, filename!, revisionRoot)).toBeNull();
    }
    await symlink(path.join(root, "entities.yaml"), path.join(root, "assets/worker/gray.png"));
    await expect(stageContentRevision({ contentRoot: root })).rejects.toThrow("escapes its root");
  });

  it("rejects malformed definitions before publishing a candidate", async () => {
    await writeFile(path.join(root, "entities.yaml"), "entity_types: {worker: null}");
    await expect(stageContentRevision({ contentRoot: root })).rejects.toThrow("worker must be a mapping");
    expect(await readdir(root)).not.toContain(".revisions");
    await writeFile(path.join(root, "entities.yaml"), "entity_types:\n  worker: {}\n  worker: {}\n");
    await expect(stageContentRevision({ contentRoot: root })).rejects.toThrow("Invalid entities.yaml");
  });

  it("durably records staging errors with the explicit optimistic base and never marks them staged", async () => {
    const operation = await requestContentReload({ base_revision: "not-a-revision", requested_by: "editor-test" });
    expect(operation).toMatchObject({ base_revision: "not-a-revision", requested_by: "editor-test", status: "failed", candidate_revision: "", error: { stage: "staging", code: "staging_failed", message: "base_revision must be a SHA256 revision." } });
    expect(operation.reload_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(operation.transitions).toEqual([{ status: "failed", at: expect.any(Number) }]);
    expect(database.eval).toHaveBeenCalledOnce();
    expect(database.eval.mock.calls[0]![0]).toContain("if op.status == 'staged' then");
  });

  it("uses the coherent active revision as the default optimistic base", async () => {
    database.get.mockResolvedValueOnce(JSON.stringify({ content_revision: "invalid-active" }));
    const operation = await requestContentReload();
    expect(operation.base_revision).toBe("invalid-active");
    expect(operation.status).toBe("failed");
    expect(operation.error?.message).toBe("base_revision must be a SHA256 revision.");
  });

  it("serializes the whole editor read-modify-write callback rather than only its final write", async () => {
    let stored = 0;
    const events: string[] = [];
    const first = mutateContentResponse(async () => {
      const original = stored;
      events.push("first-read");
      await Promise.resolve();
      stored = original + 1;
      events.push("first-write");
      return Response.json({ ok: true, id: "first" });
    }, { base_revision: "invalid", requested_by: "editor-one" });
    const second = mutateContentResponse(async () => {
      const original = stored;
      events.push("second-read");
      stored = original + 1;
      events.push("second-write");
      return Response.json({ ok: true, id: "second" });
    }, { base_revision: "invalid", requested_by: "editor-two" });
    const responses = await Promise.all([first, second]);
    expect(stored).toBe(2);
    expect(events).toEqual(["first-read", "first-write", "second-read", "second-write"]);
    expect(await responses[1]!.json()).toMatchObject({ ok: true, id: "second", content_reload: { requested_by: "editor-two" } });
  });

  it("does not stage or enqueue a rejected editor validation response", async () => {
    const response = await mutateContentResponse(
      async () => Response.json({ error: "invalid definition" }, { status: 400 }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid definition" });
    expect(database.get).not.toHaveBeenCalled();
    expect(database.eval).not.toHaveBeenCalled();
  });
});
