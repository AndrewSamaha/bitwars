import { redis } from "@/lib/db/connection";
import { decodeDeltaBinary, decodeSnapshotBinary } from "@/lib/db/utils/binary-encoding";
import { getEnv } from "@/lib/utils";
import { type Delta } from "@bitwars/shared/gen/delta_pb";
import { type Snapshot } from "@bitwars/shared/gen/snapshot_pb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_GAME_ID = "demo-001";
const HEARTBEAT_INTERVAL_MS = 10_000;
const XREAD_BLOCK_MS = 15_000; // as per spec
const XRANGE_BATCH_COUNT = 512;

function sseFormat({ event, id, data, comment }: { event?: string; id?: string; data?: any; comment?: string; }): string {
  if (comment) {
    return `: ${comment}\n\n`;
  }
  let out = "";
  if (event) out += `event: ${event}\n`;
  if (id) out += `id: ${id}\n`;
  if (data !== undefined) out += `data: ${JSON.stringify(data)}\n`;
  return out + "\n";
}

// Helpers to convert protobuf-es messages into compact, client-friendly JSON
const biToNumOrStr = (v: bigint): number | string => {
  const num = Number(v);
  return Number.isSafeInteger(num) ? num : v.toString();
};

const mapDeltaToJson = (d: Delta) => ({
  type: "delta" as const,
  tick: biToNumOrStr(d.tick),
  updates: (d.updates ?? []).map((u) => ({
    id: biToNumOrStr(u.id),
    ...(u.pos ? { pos: { x: u.pos.x, y: u.pos.y } } : {}),
    ...(u.vel ? { vel: { x: u.vel.x, y: u.vel.y } } : {}),
    ...(u.force ? { force: { x: u.force.x, y: u.force.y } } : {}),
  })),
});

const mapSnapshotToJson = (s: Snapshot) => ({
  type: "snapshot" as const,
  tick: biToNumOrStr(s.tick),
  entities: (s.entities ?? []).map((e) => ({
    id: biToNumOrStr(e.id),
    ...(e.pos ? { pos: { x: e.pos.x, y: e.pos.y } } : {}),
    ...(e.vel ? { vel: { x: e.vel.x, y: e.vel.y } } : {}),
    ...(e.force ? { force: { x: e.force.x, y: e.force.y } } : {}),
  })),
});


export async function GET(req: Request) {
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const lastEventId = req.headers.get("last-event-id");

  const GAME_ID = getEnv("GAME_ID", DEFAULT_GAME_ID);

  const encoder = new TextEncoder();

  const transform = new TransformStream<Uint8Array, Uint8Array>();
  const writer = transform.writable.getWriter();

  let closed = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  const logPrefix = `[sse ${Date.now().toString(36)}]`;
  const log = (...args: any[]) => console.log(logPrefix, ...args);
  const logErr = (...args: any[]) => console.error(logPrefix, ...args);

  const safeWrite = async (chunk: string) => {
    if (closed) return;
    try {
      await writer.write(encoder.encode(chunk));
    } catch (e) {
      closed = true;
    }
  };

  const end = async () => {
    if (closed) return;
    closed = true;
    try { if (heartbeatTimer) clearInterval(heartbeatTimer); } catch {}
    try { await writer.close(); } catch {}
  };

  const onAbort = () => {
    log("client aborted");
    end();
  };
  req.signal.addEventListener("abort", onAbort);

  // Start heartbeat
  heartbeatTimer = setInterval(() => {
    void safeWrite(sseFormat({ comment: "ping" }));
  }, HEARTBEAT_INTERVAL_MS);

  // Helpers to read streams with Buffer replies using ioredis
  const xRangeWithBuffers = async (
    key: string,
    start: string,
    end: string,
    count: number
  ): Promise<Array<{ id: string; data?: Buffer }>> => {
    const res = (await (redis as any).xrangeBuffer(key, start, end, "COUNT", count)) as any[] | null;
    if (!res) return [];
    // res shape: [ [idBuf, [ [fieldBuf, valueBuf], ... ]], ... ]
    return res.map((entry: any) => {
      const idBuf: Buffer = entry[0];
      const fields: any = entry[1] ?? [];
      let data: Buffer | undefined;
      if (Array.isArray(fields) && fields.length > 0) {
        if (Array.isArray(fields[0])) {
          for (const pair of fields) {
            const f = pair?.[0];
            const v = pair?.[1];
            if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
          }
        } else {
          for (let i = 0; i + 1 < fields.length; i += 2) {
            const f = fields[i]; const v = fields[i + 1];
            if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
          }
        }
      }
      return { id: idBuf.toString(), data };
    });
  };

  const xReadWithBuffers = async (
    key: string,
    lastId: string,
    blockMs: number,
    count: number
  ): Promise<Array<{ id: string; data?: Buffer }>> => {
    const res = (await (redis as any).xreadBuffer("BLOCK", blockMs, "COUNT", count, "STREAMS", key, lastId)) as any[] | null;
    if (!res) return [];
    // res shape: [ [ streamKeyBuf, [ [idBuf, [ [fieldBuf, valBuf], ... ]], ... ] ] ]
    const out: Array<{ id: string; data?: Buffer }> = [];
    for (const stream of res) {
      const messages = stream[1] as any[];
      if (!messages) continue;
      for (const msg of messages) {
        const idBuf: Buffer = msg[0];
        const fields: any = msg[1] ?? [];
        let data: Buffer | undefined;
        if (Array.isArray(fields) && fields.length > 0) {
          if (Array.isArray(fields[0])) {
            for (const pair of fields) {
              const f = pair?.[0]; const v = pair?.[1];
              if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
            }
          } else {
            for (let i = 0; i + 1 < fields.length; i += 2) {
              const f = fields[i]; const v = fields[i + 1];
              if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) { data = v; break; }
            }
          }
        }
        out.push({ id: idBuf.toString(), data });
      }
    }
    return out;
  };

  // Set up connection and streaming logic
  (async () => {
    try {
      // Determine resume behavior
      let startFromId: string | undefined = undefined;
      if (sinceParam && sinceParam.trim().length > 0) {
        startFromId = sinceParam;
      } else if (lastEventId && lastEventId.trim().length > 0) {
        startFromId = lastEventId;
      }

      const keySnapshot = `snapshot:${GAME_ID}`;
      const keySnapshotMeta = `snapshot_meta:${GAME_ID}`;
      const streamDeltas = `deltas:${GAME_ID}`;

      let lastId = startFromId; // L

      if (!lastId) {
        // Full bootstrap: snapshot + gap catch-up
        const meta = await (redis as any).hgetall(keySnapshotMeta);
        const boundaryId = meta["boundary_stream_id"]; // B
        const snapshotBuf: Buffer | null = (await (redis as any).getBuffer?.(keySnapshot)) ?? null;

        if (snapshotBuf) {
          try {
            const snapshot = decodeSnapshotBinary(snapshotBuf);
            const payload = mapSnapshotToJson(snapshot as any);
            await safeWrite(
              sseFormat({ event: "snapshot", id: boundaryId || "0-0", data: payload })
            );
          } catch (e) {
            logErr("snapshot decode error", e);
          }

          // Gap catch-up after boundary
          let nextStart = `(${boundaryId || "0-0"}`; // exclusive
          while (!closed) {
            // XRANGE stream (B + COUNT 512)
            const entries = await xRangeWithBuffers(streamDeltas, nextStart, "+", XRANGE_BATCH_COUNT);
            if (!entries || entries.length === 0) break;
            for (const ent of entries) {
              const id = ent.id;
              const dataBuf = ent.data;
              if (!dataBuf) continue;
              try {
                const delta = decodeDeltaBinary(dataBuf);
                const payload = mapDeltaToJson(delta as any);
                await safeWrite(sseFormat({ event: "delta", id, data: payload }));
                lastId = id;
              } catch (e) {
                logErr("delta decode error (gap)", e);
                continue; // skip bad entry
              }
            }
            nextStart = `(${entries[entries.length - 1]!.id}`;
            if (entries.length < XRANGE_BATCH_COUNT) break; // drained
          }
        } else {
          log("no snapshot or boundary id; skipping bootstrap and starting live tail");
        }
      } else {
        log("resuming from", lastId);
      }

      // Live tail via XREAD BLOCK 15000 STREAMS deltas:<GAME_ID> L
      // For XREAD, when lastId is undefined, start from '$' to only get new ones.
      if (!lastId) lastId = "$";

      while (!closed) {
        try {
          const entries = await xReadWithBuffers(streamDeltas, lastId, XREAD_BLOCK_MS, XRANGE_BATCH_COUNT);
          if (!entries || entries.length === 0) {
            // timeout, emit heartbeat has already been doing pings
            continue;
          }
          for (const ent of entries) {
            const id = ent.id;
            const dataBuf = ent.data;
            if (!dataBuf) continue;
            try {
              const delta = decodeDeltaBinary(dataBuf);
              const payload = mapDeltaToJson(delta as any);
              if ((payload.tick === 0 || payload.tick === "0") && payload.updates.length === 0) {
                logErr("decoded empty delta LIVE — likely schema mismatch; did you run gen:ts? wrong GAME_ID?");
              }
              await safeWrite(sseFormat({ event: "delta", id, data: payload }));
              lastId = id;
            } catch (e) {
              logErr("delta decode error (live)", e);
              continue;
            }
          }
        } catch (e: any) {
          // Attempt a simple retry loop on transient errors
          logErr("xread error", e?.message || e);
          // small delay before retry to avoid hot loop
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
      }
    } catch (e) {
      logErr("fatal error", e);
    } finally {
      await end();
    }
  })();

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    "Connection": "keep-alive",
    "Transfer-Encoding": "chunked",
  });

  return new Response(transform.readable, { headers });
}
