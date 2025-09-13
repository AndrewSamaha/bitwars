import { sseFormat } from "@/lib/db/utils/sse";

export type SseChannel = {
  readable: ReadableStream<Uint8Array>;
  write: (chunk: string) => Promise<void>;
  writeComment: (comment: string) => Promise<void>;
  close: () => Promise<void>;
  attachAbortSignal: (signal: AbortSignal, onAbort?: () => void) => void;
  headers: Headers;
  isClosed: () => boolean;
};

export function createSseChannel(options?: { heartbeatMs?: number; log?: (...args: any[]) => void }): SseChannel {
  const heartbeatMs = options?.heartbeatMs ?? 10_000;
  const log = options?.log ?? (() => {});

  const encoder = new TextEncoder();
  const transform = new TransformStream<Uint8Array, Uint8Array>();
  const writer = transform.writable.getWriter();

  let closed = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  const safeWrite = async (chunk: string) => {
    if (closed) return;
    try {
      await writer.write(encoder.encode(chunk));
    } catch {
      closed = true;
    }
  };

  const write = async (chunk: string) => {
    await safeWrite(chunk);
  };

  const writeComment = async (comment: string) => {
    await safeWrite(sseFormat({ comment }));
  };

  const close = async () => {
    if (closed) return;
    closed = true;
    try { if (heartbeatTimer) clearInterval(heartbeatTimer); } catch {}
    try { await writer.close(); } catch {}
  };

  const attachAbortSignal = (signal: AbortSignal, onAbort?: () => void) => {
    const handler = () => {
      log("client aborted");
      onAbort?.();
      void close();
    };
    signal.addEventListener("abort", handler);
  };

  // Start heartbeat
  heartbeatTimer = setInterval(() => {
    void safeWrite(sseFormat({ comment: "ping" }));
  }, heartbeatMs);

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    "Connection": "keep-alive",
    "Transfer-Encoding": "chunked",
  });

  return { readable: transform.readable, write, writeComment, close, attachAbortSignal, headers, isClosed: () => closed };
}
