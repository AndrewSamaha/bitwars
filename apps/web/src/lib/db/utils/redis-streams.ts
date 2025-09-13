import { redis } from "@/lib/db/connection";

export type StreamEntry = { id: string; data?: Buffer };

// Extract the `data` Buffer field from a Redis Streams fields payload that may
// be represented either as an array of pairs [[field, value], ...] or a flat
// alternating array [field, value, field, value, ...].
function extractDataField(fields: any): Buffer | undefined {
  if (!Array.isArray(fields) || fields.length === 0) return undefined;

  // Pair form
  if (Array.isArray(fields[0])) {
    for (const pair of fields) {
      const f = pair?.[0];
      const v = pair?.[1];
      if (Buffer.isBuffer(f) && f.toString() === "data" && Buffer.isBuffer(v)) {
        return v;
      }
    }
  } else {
    // Flat alternating form
    for (let i = 0; i + 1 < fields.length; i += 2) {
      const f = fields[i];
      const v = fields[i + 1];
      if (Buffer.isBuffer(f) && Buffer.isBuffer(v) && f.toString() === "data") {
        return v;
      }
    }
  }
  return undefined;
}

// XRANGE helper that returns ids and data buffers only.
export async function xRangeWithBuffers(
  key: string,
  start: string,
  end: string,
  count: number
): Promise<StreamEntry[]> {
  const res = (await (redis as any).xrangeBuffer(
    key,
    start,
    end,
    "COUNT",
    count
  )) as any[] | null;
  if (!res) return [];
  // res: [ [idBuf, fields], ... ]
  return res.map((entry: any) => {
    const idBuf: Buffer = entry[0];
    const fields: any = entry[1] ?? [];
    const data = extractDataField(fields);
    return { id: idBuf.toString(), data };
  });
}

// XREAD helper that returns ids and data buffers only.
export async function xReadWithBuffers(
  key: string,
  lastId: string,
  blockMs: number,
  count: number
): Promise<StreamEntry[]> {
  const res = (await (redis as any).xreadBuffer(
    "BLOCK",
    blockMs,
    "COUNT",
    count,
    "STREAMS",
    key,
    lastId
  )) as any[] | null;
  if (!res) return [];
  const out: StreamEntry[] = [];
  // res: [ [streamKeyBuf, [ [idBuf, fields], ... ] ] ]
  for (const stream of res) {
    const messages = stream?.[1] as any[] | undefined;
    if (!messages) continue;
    for (const msg of messages) {
      const idBuf: Buffer = msg[0];
      const fields: any = msg[1] ?? [];
      const data = extractDataField(fields);
      out.push({ id: idBuf.toString(), data });
    }
  }
  return out;
}
