import { getAllEntitiesFromIndex } from '@/features/gamestate/queries/read/getAllEntities';
import { requireAuthOr401 } from '@/features/users/utils/auth';

export async function GET(request: Request) {
  const { res } = await requireAuthOr401();
  if (res) return res; // 401 when not authenticated

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(chunk);
        } catch {
          // controller already closed
          closed = true;
        }
      };

      // Cleanup helper
      const cleanup = (id?: ReturnType<typeof setInterval>) => {
        if (id) clearInterval(id);
        if (!closed) {
          closed = true;
          try { controller.close(); } catch {}
        }
      };

      // Abort/disconnect handling
      const onAbort = () => cleanup(intervalId);
      request.signal.addEventListener('abort', onAbort);

      // Initial tick
      try {
        const entities = await getAllEntitiesFromIndex();
        safeEnqueue(encoder.encode(`event: entities\ndata: ${JSON.stringify(entities)}\n\n`));
      } catch (err) {
        safeEnqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'initial fetch failed' })}\n\n`));
      }

      // Periodic polling
      const intervalId = setInterval(async () => {
        if (closed) return;
        try {
          const entities = await getAllEntitiesFromIndex();
          safeEnqueue(encoder.encode(`event: entities\ndata: ${JSON.stringify(entities)}\n\n`));
        } catch (err) {
          safeEnqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'poll failed' })}\n\n`));
        }
      }, 1000);

      // Store cleanup on controller
      (controller as any)._cleanup = () => {
        request.signal.removeEventListener('abort', onAbort);
        cleanup(intervalId);
      };
    },
    cancel() {
      const doCleanup = (this as any)._cleanup;
      if (typeof doCleanup === 'function') doCleanup();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
