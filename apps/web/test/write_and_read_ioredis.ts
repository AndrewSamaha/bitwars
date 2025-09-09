// apps/web/test/write_and_read_ioredis.ts
// Same as write_and_read_redis.ts but implemented with ioredis. Writes
// a known-good snapshot and delta under a separate GAME_ID and reads
// them back, comparing bytes and decoding.

import Redis, { Command } from "ioredis";
import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { create, toBinary, fromBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import { EntityDeltaSchema } from "@bitwars/shared/gen/entity_delta_pb";

function getEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

async function main() {
  // Load env
  const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(__dirname, "../../../.env"),
  ];
  for (const p of envCandidates) {
    try { dotenv.config({ path: p, override: false }); } catch {}
  }

  const REDIS_URL = getEnv("GAMESTATE_REDIS_URL", "redis://127.0.0.1:6379");
  const TEST_GAME_ID = "ioredis-selftest-001";
  const outDir = path.resolve(__dirname, "../../../packages/schemas/testdata");
  const wSnapPath = path.join(outDir, "ioredis_written_snapshot.bin");
  const rSnapPath = path.join(outDir, "ioredis_readback_snapshot.bin");
  const wDeltaPath = path.join(outDir, "ioredis_written_delta.bin");
  const rDeltaPath = path.join(outDir, "ioredis_readback_delta.bin");

  const redis = new Redis(REDIS_URL);

  const useResp2 = process.argv.includes("--resp2");
  if (useResp2) {
    try {
      // Force RESP2
      const res = await redis.sendCommand(new Command("HELLO", ["2"] as any));
      console.log("[ioredis] HELLO 2:", res);
    } catch (e) {
      console.warn("[ioredis] HELLO 2 failed:", e);
    }
  }

  const keySnapshot = `snapshot:${TEST_GAME_ID}`;
  const keySnapshotMeta = `snapshot_meta:${TEST_GAME_ID}`;
  const streamDeltas = `deltas:${TEST_GAME_ID}`;

  // Build messages
  const snapshot = create(SnapshotSchema, {
    tick: 100n,
    entities: [
      { id: 1n, pos: { x: 1.25, y: -2.5 }, vel: { x: 0.1, y: 0.2 }, force: { x: 0, y: 0 } },
      { id: 2n, pos: { x: -3.0, y: 4.5 } },
    ],
  });
  const snapshotBytes = Buffer.from(toBinary(SnapshotSchema, snapshot));
  fs.writeFileSync(wSnapPath, snapshotBytes);

  const delta = create(DeltaSchema, {
    tick: 101n,
    updates: [
      create(EntityDeltaSchema, { id: 1n, pos: { x: 2.0, y: -1.0 } }),
    ],
  });
  const deltaBytes = Buffer.from(toBinary(DeltaSchema, delta));
  fs.writeFileSync(wDeltaPath, deltaBytes);

  console.log("[ioredis] writing snapshot+delta", { TEST_GAME_ID, REDIS_URL });

  // Write snapshot and meta
  await redis.set(keySnapshot, snapshotBytes);
  const exists = await redis.exists(keySnapshot);
  console.log("[ioredis] snapshot EXISTS=", exists);
  const nowMs = Date.now().toString();
  await redis.hset(keySnapshotMeta, {
    tick: "100",
    boundary_stream_id: "0-0",
    updated_at_ms: nowMs,
  });

  // Write delta to stream
  const xaddId = await redis.xadd(streamDeltas, "*", "data", deltaBytes);
  console.log("[ioredis] XADD id=", xaddId);

  // Read back snapshot
  const snapRes = await redis.getBuffer(keySnapshot);
  if (!snapRes) {
    console.error("[ioredis] failed to read back snapshot bytes");
  } else {
    fs.writeFileSync(rSnapPath, snapRes);
    if (!snapshotBytes.equals(snapRes)) {
      const firstDiff = (() => { for (let i = 0; i < Math.min(snapshotBytes.length, snapRes.length); i++) { if (snapshotBytes[i] !== snapRes[i]) return i; } return -1; })();
      const ctx = (buf: Buffer, i: number) => Array.from(buf.subarray(Math.max(0, i - 8), Math.min(buf.length, i + 8))).map(b => b.toString(16).padStart(2, "0")).join(" ");
      console.warn("[ioredis] SNAPSHOT bytes differ:", { wLen: snapshotBytes.length, rLen: snapRes.length, firstDiff, wCtx: firstDiff>=0?ctx(snapshotBytes, firstDiff):undefined, rCtx: firstDiff>=0?ctx(snapRes, firstDiff):undefined, wPath: wSnapPath, rPath: rSnapPath });
    } else {
      console.log("[ioredis] SNAPSHOT bytes match exactly");
    }
    const snapDecoded = fromBinary(SnapshotSchema, new Uint8Array(snapRes));
    console.log("[ioredis] snapshot decoded:", { tick: snapDecoded.tick, entities: snapDecoded.entities.length });
  }

  // Read back last delta via XRANGE COUNT 1
  const xr = await redis.xrangeBuffer(streamDeltas, "-", "+", "COUNT", 1);
  if (!xr || xr.length === 0) {
    console.error("[ioredis] no XRANGE entries returned");
  } else {
    const entry = xr[xr.length - 1];
    const fields = entry[1] as Array<[Buffer, Buffer]> | Buffer[];
    // ioredis returns pairs [[field, value], ...] when using Buffer helpers
    let data: Buffer | undefined;
    if (Array.isArray(fields) && fields.length > 0) {
      if (Array.isArray(fields[0])) {
        for (const pair of fields as Array<[Buffer, Buffer]>) {
          const [f, v] = pair;
          if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
        }
      } else {
        // Rare case: [field, value, ...]
        const flat = fields as Buffer[];
        for (let i = 0; i + 1 < flat.length; i += 2) {
          if (flat[i].toString() === "data") { data = flat[i + 1]; break; }
        }
      }
    }
    if (!data) {
      console.error("[ioredis] XRANGE returned but no binary data field found", typeof fields);
    } else {
      fs.writeFileSync(rDeltaPath, data);
      if (!deltaBytes.equals(data)) {
        const firstDiff = (() => { for (let i = 0; i < Math.min(deltaBytes.length, data.length); i++) { if (deltaBytes[i] !== data[i]) return i; } return -1; })();
        const ctx = (buf: Buffer, i: number) => Array.from(buf.subarray(Math.max(0, i - 8), Math.min(buf.length, i + 8))).map(b => b.toString(16).padStart(2, "0")).join(" ");
        console.warn("[ioredis] DELTA bytes differ:", { wLen: deltaBytes.length, rLen: data.length, firstDiff, wCtx: firstDiff>=0?ctx(deltaBytes, firstDiff):undefined, rCtx: firstDiff>=0?ctx(data, firstDiff):undefined, wPath: wDeltaPath, rPath: rDeltaPath });
      } else {
        console.log("[ioredis] DELTA bytes match exactly");
      }
      const d = fromBinary(DeltaSchema, new Uint8Array(data));
      console.log("[ioredis] delta decoded:", { tick: d.tick, updates: d.updates.length, first: d.updates[0] });
    }
  }

  await redis.quit();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
