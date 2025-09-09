// apps/web/test/read_redis.ts
// Standalone Node script to read snapshot and recent deltas from Redis
// and decode using protobuf-es schemas from @bitwars/shared

import { createClient } from "redis";
import dotenv from "dotenv";
import path from "node:path";
import { fromBinary } from "@bufbuild/protobuf";
import { SnapshotSchema } from "@bitwars/shared/gen/snapshot_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";

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

async function readSnapshot(client: ReturnType<typeof createClient>, gameId: string) {
  const snapKey = `snapshot:${gameId}`;
  const metaKey = `snapshot_meta:${gameId}`;

  console.log("[read_redis] readSnapshot", { snapKey, metaKey });
  const snapRes = await (client as any).sendCommand({ returnBuffers: true }, ["GET", snapKey]);
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

  const meta = await (client as any).sendCommand({ returnBuffers: true }, ["HGETALL", metaKey]) as Buffer[] | null;
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

async function readRecentDeltas(client: ReturnType<typeof createClient>, gameId: string, count = 10) {
  const stream = `deltas:${gameId}`;
  console.log("[read_redis] readRecentDeltas", { stream, count });
  const res = await (client as any).sendCommand({ returnBuffers: true }, ["XRANGE", stream, "-", "+", "COUNT", String(count)]) as any[] | null;
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
    if (Array.isArray(fields) && fields.length > 0 && Array.isArray(fields[0])) {
      // Shape: [[field, value], [field, value], ...]
      for (const pair of fields) {
        const f = pair?.[0];
        const v = pair?.[1];
        if (parseFieldName(f) === "data" && Buffer.isBuffer(v)) {
          data = v as Buffer;
          break;
        }
      }
    } else if (Array.isArray(fields)) {
      // Shape: [field, value, field, value, ...]
      for (let i = 0; i < fields.length - 1; i += 2) {
        const f = fields[i];
        const v = fields[i + 1];
        if (parseFieldName(f) === "data" && Buffer.isBuffer(v)) {
          data = v as Buffer;
          break;
        }
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

  const client = createClient({ url: REDIS_URL });
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
  await client.quit();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
