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

  const snapRes = (await (client as any).sendCommand(["GET", snapKey], { returnBuffers: true })) as Buffer | null;
  if (snapRes && Buffer.isBuffer(snapRes)) {
    const snapshot = decodeSnapshotBinary(snapRes);
    console.log("snapshot:", { bytes: snapRes.length, tick: snapshot.tick, entities: snapshot.entities.length });
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

  const meta = (await (client as any).sendCommand(["HGETALL", metaKey], { returnBuffers: true })) as Buffer[] | null;
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
  const res = (await (client as any).sendCommand(
    ["XRANGE", stream, "-", "+", "COUNT", String(count)],
    { returnBuffers: true }
  )) as any[] | null;

  if (!res) {
    console.log("no entries or unexpected response for XRANGE", stream);
    return;
  }

  console.log(`stream ${stream} entries (up to ${count}):`);
  for (const entry of res) {
    const idBuf: Buffer = entry[0];
    const id = idBuf.toString();
    const fields: Buffer[] = entry[1] ?? [];
    let data: Buffer | undefined;
    for (let i = 0; i < fields.length - 1; i += 2) {
      const f = fields[i];
      if (f && f.toString() === "data") {
        data = fields[i + 1] as Buffer;
        break;
      }
    }
    if (!data) {
      console.log(`  id=${id} (no data field)`);
      continue;
    }
    try {
      const delta = decodeDeltaBinary(data);
      console.log(`  id=${id} tick=${delta.tick} updates=${delta.updates.length}`);
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

  const client = createClient({ url: REDIS_URL });
  client.on("error", (err) => console.error("Redis Client Error", err));
  await client.connect();

  try {
    await readSnapshot(client, GAME_ID);
    await readRecentDeltas(client, GAME_ID, 10);
  } finally {
    await client.quit();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
