// apps/web/test/write_and_read_redis.ts
// Write a known-good snapshot and delta to Redis under a separate GAME_ID,
// then read them back and decode using protobuf-es.

import Redis from "ioredis";
import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { create, toBinary, fromBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import { EntityDeltaSchema } from "@bitwars/shared/gen/entity_delta_pb";
import { EventsStreamRecordSchema } from "@bitwars/shared/gen/intent_pb";

function getEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

async function main() {
  // Load env from common locations
  const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(__dirname, "../../../.env"),
  ];
  for (const p of envCandidates) {
    try { dotenv.config({ path: p, override: false }); } catch {}
  }

  const REDIS_URL = getEnv("GAMESTATE_REDIS_URL", "redis://127.0.0.1:6379");
  const TEST_GAME_ID = "node-selftest-001";
  const outDir = path.resolve(__dirname, "../../../packages/schemas/testdata");
  const wSnapPath = path.join(outDir, "node_written_snapshot.bin");
  const rSnapPath = path.join(outDir, "node_readback_snapshot.bin");
  const wDeltaPath = path.join(outDir, "node_written_delta.bin");
  const rDeltaPath = path.join(outDir, "node_readback_event_record.bin");

  const client = new Redis(REDIS_URL);
  client.on("error", (err: unknown) => console.error("Redis Client Error", err));
  const useResp2 = process.argv.includes("--resp2");
  if (useResp2) {
    try {
      const hello = await (client as any).sendCommand(["HELLO", "2"], { returnBuffers: true });
      console.log("[write_and_read] switched to RESP2 via HELLO 2:", hello);
    } catch (e) {
      console.warn("[write_and_read] HELLO 2 failed; continuing with default RESP:", e);
    }
  }

  const keySnapshot = `snapshot:${TEST_GAME_ID}`;
  const keySnapshotMeta = `snapshot_meta:${TEST_GAME_ID}`;
  const streamEvents = `rts:match:${TEST_GAME_ID}:events`;

  // Construct a simple snapshot (tick=100, two entities)
  const snapshot = create(SnapshotSchema, {
    tick: 100n,
    entities: [
      { id: 1n, pos: { x: 1.25, y: -2.5 }, vel: { x: 0.1, y: 0.2 }, force: { x: 0, y: 0 } },
      { id: 2n, pos: { x: -3.0, y: 4.5 } },
    ],
  });
  const snapshotBytes = Buffer.from(toBinary(SnapshotSchema, snapshot));
  try { fs.writeFileSync(wSnapPath, snapshotBytes); } catch {}

  // Construct a simple delta (tick=101, update entity 1 pos)
  const delta = create(DeltaSchema, {
    tick: 101n,
    updates: [
      create(EntityDeltaSchema, { id: 1n, pos: { x: 2.0, y: -1.0 } }),
    ],
  });
  const deltaBytes = Buffer.from(toBinary(DeltaSchema, delta));
  try { fs.writeFileSync(wDeltaPath, deltaBytes); } catch {}

  console.log("[write_and_read] writing snapshot and delta to", { TEST_GAME_ID, REDIS_URL });

  // Write snapshot
  await client.set(keySnapshot, snapshotBytes);
  const exists = await client.exists(keySnapshot);
  console.log("[write_and_read] snapshot EXISTS=", exists);
  const nowMs = Date.now().toString();
  await client.hset(keySnapshotMeta, {
    tick: "100",
    boundary_stream_id: "0-0",
    updated_at_ms: nowMs,
  });

  // Append delta to stream
  const eventsRecord = create(EventsStreamRecordSchema, {
    record: { case: "delta", value: delta },
  });
  const eventsBytes = Buffer.from(toBinary(EventsStreamRecordSchema, eventsRecord));

  const xaddId = await client.xadd(streamEvents, "*", "data", eventsBytes);
  console.log("[write_and_read] XADD id=", Buffer.isBuffer(xaddId) ? xaddId.toString() : xaddId);

  // Read back snapshot
  const snapRes = await client.getBuffer(keySnapshot);
  console.log("[write_and_read] GET type:", snapRes && typeof snapRes, Buffer.isBuffer(snapRes) ? `buffer(${(snapRes as Buffer).length})` : snapRes);
  const snapBuf = snapRes ?? null;
  if (!snapBuf) {
    console.error("[write_and_read] failed to read back snapshot bytes");
  } else {
    try { fs.writeFileSync(rSnapPath, snapBuf); } catch {}
    if (!snapshotBytes.equals(snapBuf)) {
      const firstDiff = (() => { for (let i = 0; i < Math.min(snapshotBytes.length, snapBuf.length); i++) { if (snapshotBytes[i] !== snapBuf[i]) return i; } return -1; })();
      const ctx = (buf: Buffer, i: number) => Array.from(buf.subarray(Math.max(0, i - 8), Math.min(buf.length, i + 8))).map(b => b.toString(16).padStart(2, "0")).join(" ");
      console.warn("[write_and_read] SNAPSHOT bytes differ:", { wLen: snapshotBytes.length, rLen: snapBuf.length, firstDiff, wCtx: firstDiff>=0?ctx(snapshotBytes, firstDiff):undefined, rCtx: firstDiff>=0?ctx(snapBuf, firstDiff):undefined, wPath: wSnapPath, rPath: rSnapPath });
    }
    const snapDecoded = fromBinary(SnapshotSchema, new Uint8Array(snapBuf));
    console.log("[write_and_read] snapshot decoded:", { tick: snapDecoded.tick, entities: snapDecoded.entities.length });
  }

  // Read back last delta
  const xrange = await (client as any).xrangeBuffer(streamEvents, "-", "+", "COUNT", 1);
  console.log("[write_and_read] XRANGE type:", Array.isArray(xrange) ? `array(${xrange.length})` : typeof xrange);
  if (!xrange || !Array.isArray(xrange) || xrange.length === 0) {
    console.error("[write_and_read] no XRANGE entries returned");
  } else {
    const entry = xrange[xrange.length - 1];
    const fields = entry?.[1] ?? [];
    let data: Buffer | undefined;
    // Fields as flat [field, value ...]
    if (Array.isArray(fields)) {
      for (let i = 0; i < fields.length - 1; i += 2) {
        const f = fields[i];
        const v = fields[i + 1];
        if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
      }
      if (!data && fields.length > 0 && Array.isArray(fields[0])) {
        // Or as pairs [[field, value] ...]
        for (const pair of fields) {
          const f = pair?.[0]; const v = pair?.[1];
          if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
        }
      }
    }
    if (!data) {
      console.error("[write_and_read] XRANGE returned but no binary data field found", typeof fields);
    } else {
      try { fs.writeFileSync(rDeltaPath, data); } catch {}

      const record = fromBinary(EventsStreamRecordSchema, new Uint8Array(data));
      if (!record?.record || record.record.case !== "delta") {
        console.error("[write_and_read] events record missing delta payload", { case: record?.record?.case });
      } else {
        const decodedDelta = record.record.value;
        const decodedBytes = Buffer.from(toBinary(DeltaSchema, decodedDelta));
        if (!deltaBytes.equals(decodedBytes)) {
          const firstDiff = (() => { for (let i = 0; i < Math.min(deltaBytes.length, decodedBytes.length); i++) { if (deltaBytes[i] !== decodedBytes[i]) return i; } return -1; })();
          const ctx = (buf: Buffer, i: number) => Array.from(buf.subarray(Math.max(0, i - 8), Math.min(buf.length, i + 8))).map(b => b.toString(16).padStart(2, "0")).join(" ");
          console.warn("[write_and_read] DELTA payload differs after roundtrip:", { wLen: deltaBytes.length, rLen: decodedBytes.length, firstDiff, wCtx: firstDiff>=0?ctx(deltaBytes, firstDiff):undefined, rCtx: firstDiff>=0?ctx(decodedBytes, firstDiff):undefined, wPath: wDeltaPath, rPath: rDeltaPath });
        } else {
          console.log("[write_and_read] DELTA payload matches inner record exactly");
        }
        console.log("[write_and_read] delta decoded:", { tick: decodedDelta.tick, updates: decodedDelta.updates.length, first: decodedDelta.updates[0] });
      }
    }
  }

  await client.quit();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
