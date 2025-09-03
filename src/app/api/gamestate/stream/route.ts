import { getAllEntitiesFromIndex } from '@/features/gamestate/queries/read/getAllEntities';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial tick
      try {
        const entities = await getAllEntitiesFromIndex();
        controller.enqueue(encoder.encode(`event: entities\ndata: ${JSON.stringify(entities)}\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'initial fetch failed' })}\n\n`));
      }

      const id = setInterval(async () => {
        try {
          const entities = await getAllEntitiesFromIndex();
          controller.enqueue(encoder.encode(`event: entities\ndata: ${JSON.stringify(entities)}\n\n`));
        } catch (err) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'poll failed' })}\n\n`));
        }
      }, 1000);

      // Store interval id on controller for cleanup in cancel
      (controller as any)._intervalId = id;
    },
    cancel() {
      const id = (this as any)._intervalId;
      if (id) clearInterval(id);
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
