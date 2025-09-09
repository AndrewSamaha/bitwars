import { describe, it, expect } from "vitest";
import { fromBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import fs from "node:fs/promises";
import path from "node:path";

const testdataDir = path.resolve(process.cwd(), "../../packages/schemas/testdata");

async function readFixture(name: string): Promise<Uint8Array> {
  const p = path.join(testdataDir, name);
  const buf = await fs.readFile(p);
  return new Uint8Array(buf);
}

describe("protobuf decode compatibility with prost", () => {
  it("decodes snapshot.bin", async () => {
    const bin = await readFixture("snapshot.bin");
    const snap = fromBinary(SnapshotSchema, bin);
    // Basic shape assertions
    expect(typeof snap.tick === "bigint").toBe(true);
    expect(Array.isArray(snap.entities)).toBe(true);
    // From generator data: tick=42, entities length 2
    expect(snap.tick).toBe(42n);
    expect(snap.entities.length).toBe(2);
    // Spot check fields
    const e1 = snap.entities[0]!;
    expect(e1.id).toBe(1n);
    expect(e1.pos?.x).toBeCloseTo(10.0);
    expect(e1.pos?.y).toBeCloseTo(20.0);
  });

  it("decodes delta.bin", async () => {
    const bin = await readFixture("delta.bin");
    const delta = fromBinary(DeltaSchema, bin);
    expect(typeof delta.tick === "bigint").toBe(true);
    expect(Array.isArray(delta.updates)).toBe(true);
    // From generator data: tick=43, updates length 2
    expect(delta.tick).toBe(43n);
    expect(delta.updates.length).toBe(2);
    const u1 = delta.updates[0]!;
    expect(u1.id).toBe(1n);
    expect(u1.pos?.x).toBeCloseTo(11.0);
    expect(u1.pos?.y).toBeCloseTo(19.5);
  });
});
