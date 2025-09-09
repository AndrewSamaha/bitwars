// apps/web/test/read_redis.ts
// Standalone Node script to read snapshot and recent deltas from Redis
// and decode using protobuf-es schemas from @bitwars/shared

import { createClient } from "redis";
import dotenv from "dotenv";
import path from "node:path";
import { fromBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
// Do not use the shared app client here; create a dedicated client with Buffer replies

function getEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

function decodeSnapshotBinary(buf: Buffer) {
  const msg = fromBinary(SnapshotSchema, new Uint8Array(buf));
  return msg;
}

function decodeDeltaBinary(buf: Buffer) {
  const msg = fromBinary(DeltaSchema, new Uint8Array(buf));
  return msg;
}

async function readSnapshot(client: any, gameId: string) {
  const snapKey = `snapshot:${gameId}`;
  const metaKey = `snapshot_meta:${gameId}`;

  console.log("[read_redis] readSnapshot", { snapKey, metaKey });
  const snapRes = await (client as any).sendCommand(["GET", snapKey], { returnBuffers: true });
  console.log("[read_redis] GET resp type", snapRes && typeof snapRes, Buffer.isBuffer(snapRes) ? `buffer(${(snapRes as Buffer).length})` : snapRes);
  const snapBuf = Buffer.isBuffer(snapRes) ? (snapRes as Buffer) : null;
  if (snapBuf) {
    const snapshot = decodeSnapshotBinary(snapBuf);
    console.log("snapshot:", { bytes: snapBuf.length, tick: snapshot.tick, entities: snapshot.entities.length });
    for (const e of snapshot.entities.slice(0, 2)) {
      console.log("  entity", {
        id: e.id,
        pos: e.pos ?? null,
        vel: e.vel ?? null,
        force: e.force ?? null,
      });
    }
  } else {
    console.log("no snapshot found at", snapKey);
  }

  const meta = await (client as any).sendCommand(["HGETALL", metaKey], { returnBuffers: true }) as Buffer[] | null;
  console.log("[read_redis] HGETALL resp", Array.isArray(meta) ? `array(${meta.length})` : typeof meta);
  if (meta && Array.isArray(meta)) {
    const obj: Record<string, string> = {};
    for (let i = 0; i < meta.length - 1; i += 2) {
      const k = meta[i]?.toString();
      const v = meta[i + 1]?.toString();
      if (k) obj[k] = v ?? "";
    }
    console.log("snapshot_meta:", obj);
  } else {
    console.log("no snapshot_meta found at", metaKey);
  }
}

async function readRecentDeltas(client: any, gameId: string, count = 10) {
  const stream = `deltas:${gameId}`;
  console.log("[read_redis] readRecentDeltas", { stream, count });
  const res = await (client as any).sendCommand(["XRANGE", stream, "-", "+", "COUNT", String(count)], { returnBuffers: true }) as any[] | null;
  console.log("[read_redis] XRANGE resp", Array.isArray(res) ? `array(${res.length})` : res === null ? "null" : typeof res);

  if (!res) {
    console.log("no entries or unexpected response for XRANGE", stream);
    return;
  }

  console.log(`stream ${stream} entries (up to ${count}):`);
  for (const entry of res) {
    const idBuf: Buffer = entry[0];
    const id = idBuf.toString();
    const fields = entry[1] ?? [];
    let data: Buffer | undefined;
    const parseFieldName = (f: any) => (Buffer.isBuffer(f) ? f.toString() : String(f));
    const coerceVal = (v: any): Buffer | undefined => {
      if (Buffer.isBuffer(v)) return v as Buffer;
      if (typeof v === "string") return Buffer.from(v, "binary");
      if (v && typeof v === "object" && (v as any).type === "Buffer" && Array.isArray((v as any).data)) return Buffer.from((v as any).data);
      return undefined;
    };
    if (Array.isArray(fields)) {
      if (fields.length > 0 && Array.isArray(fields[0])) {
        // [[field, value], ...]
        for (const pair of fields) {
          const f = pair?.[0];
          const v = pair?.[1];
          if (parseFieldName(f) === "data") { data = coerceVal(v); if (data) break; }
        }
      } else {
        // [field, value, ...]
        for (let i = 0; i < fields.length - 1; i += 2) {
          const f = fields[i];
          const v = fields[i + 1];
          if (parseFieldName(f) === "data") { data = coerceVal(v); if (data) break; }
        }
      }
    } else if (fields && typeof fields === "object") {
      // RESP3 map/object
      for (const [k, v] of Object.entries(fields)) {
        if (k === "data") { data = coerceVal(v); break; }
      }
    }
    if (!data) {
      console.log(`  id=${id} (no binary data field) fieldsType=${typeof fields} sample=`, Array.isArray(fields) ? fields.slice(0, 4) : fields);
      continue;
    }
    try {
      const len = data.length;
      const head = Array.from(data.subarray(0, Math.min(16, len))).map((b) => b.toString(16).padStart(2, "0")).join(" ");
      console.log(`  id=${id} bytes=${len} head=${head}`);
      const delta = decodeDeltaBinary(data);
      console.log(`    → tick=${delta.tick} updates=${delta.updates.length}`);
    } catch (e) {
      console.error(`  id=${id} failed to decode delta:`, e);
    }
  }
}

async function main() {
  // Load env from likely locations (do not override already-set vars)
  const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    // When running from monorepo root
    path.resolve(process.cwd(), "../../.env"),
    // Relative to this script's directory
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../.env.local"),
  ];
  for (const p of envCandidates) {
    try {
      dotenv.config({ path: p, override: false });
    } catch {}
  }

  const GAME_ID = getEnv("GAME_ID", "demo-001");
  const REDIS_URL = getEnv("GAMESTATE_REDIS_URL", "redis://127.0.0.1:6379");

  console.log("[read_redis] config", { GAME_ID, REDIS_URL, cwd: process.cwd() });

  // Dedicated client with Buffer replies
  const client = createClient({ url: REDIS_URL, returnBuffers: true } as any);
  client.on("error", (err) => console.error("Redis Client Error", err));
  await client.connect();
  console.log("[read_redis] connected");

  try {
    await readSnapshot(client, GAME_ID);
  } catch (e) {
    console.error(e);
  }
  try {
    await readRecentDeltas(client, GAME_ID, 10);
  } catch (e) {
    console.error(e);
  } 
  try { await client.quit?.(); } catch {}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
