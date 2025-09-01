export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send a hello event immediately
      controller.enqueue(encoder.encode(`event: hello\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`));

      // Example: push periodic state
      const id = setInterval(() => {
        const payload = { x: Math.random(), y: Math.random(), t: Date.now() };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)); // 'message' event by default
      }, 1_050);

      // Clean up if client disconnects
      (controller as any).signal?.addEventListener?.('abort', () => clearInterval(id));
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // (Optionally) allow CORS
    }
  });
}
