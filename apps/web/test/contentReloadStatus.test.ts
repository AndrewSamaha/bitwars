import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db/connection", () => ({ redis: {} }));
import { parseContentClientReport } from "../src/lib/content/contentReloadStatus";

const revision = "a".repeat(64);
const report = {
  client_id: "019a0000-0000-7000-8000-000000000001",
  advertised_revision: revision,
  definitions_revision: revision,
  asset_bundles: { worker: "b".repeat(64) },
  status: "synchronized",
};

describe("content client synchronization diagnostics", () => {
  it("rejects synchronized claims when definitions lag the advertised revision", () => {
    expect(() => parseContentClientReport({ ...report, definitions_revision: "c".repeat(64) })).toThrow();
    expect(parseContentClientReport({ ...report, status: "loading", definitions_revision: "c".repeat(64) }).status).toBe("loading");
  });

  it("preserves actionable asset failure identities but does not accept caller-owned player identity", () => {
    const error = {
      stage: "assets", code: "decode_failed", message: "PNG could not be decoded",
      entity_id: "worker", url: `/assets/worker/${"b".repeat(64)}/primary.png`, expected_hash: "d".repeat(64),
    };
    const parsed = parseContentClientReport({ ...report, status: "failed", error, player_id: "spoofed" });
    expect(parsed.error).toEqual(error);
    expect(parsed).not.toHaveProperty("player_id");
  });

  it("rejects malformed revision, bundle, identifier and timestamp boundaries", () => {
    for (const invalid of [
      { client_id: "019a0000000070008000000000000001" },
      { advertised_revision: "../manifest" },
      { asset_bundles: { "../worker": "b".repeat(64) } },
      { asset_bundles: { worker: "wrong-hash" } },
      { last_applied_at: -1 },
      { error: { stage: "assets", message: "missing code" } },
    ]) expect(() => parseContentClientReport({ ...report, ...invalid })).toThrow();
  });
});
