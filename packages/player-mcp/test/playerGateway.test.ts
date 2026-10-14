import { describe, expect, it } from "vitest";
import { PlayerGateway } from "../src/playerGateway.js";

async function eventually(check: () => boolean, maxAttempts = 100): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error("condition was not reached");
}

describe("PlayerGateway", () => {
  it("uses a separate authenticated SSE session, reconciles, polls, stamps intents, and disconnects", async () => {
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
    const encoder = new TextEncoder();
    const postedIntents: Record<string, unknown>[] = [];
    const calls: Array<{ path: string; cookie: string | null }> = [];
    const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      calls.push({ path: url.pathname, cookie: headers.get("Cookie") });
      if (url.pathname === "/api/players/login") {
        return new Response("{}", { headers: { "set-cookie": "player_token=test-token; Path=/; HttpOnly" } });
      }
      if (url.pathname === "/api/v2/gamestate/stream") {
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) { streamController = controller; },
        }), { headers: { "Content-Type": "text/event-stream" } });
      }
      if (url.pathname === "/api/v2/reconnect") {
        return Response.json({ run_id: "run-1", player_id: "player-1", last_processed_client_seq: 3, active_intents: [] });
      }
      if (url.pathname === "/api/v3/build-state") {
        return Response.json({ build_state_by_entity: { 710: { blueprint_id: "corvette", progress: 0.4 } } });
      }
      if (url.pathname === "/api/v1/intent") {
        postedIntents.push(JSON.parse(String(init?.body)));
        return Response.json({ accepted: true });
      }
      throw new Error(`unexpected request ${url}`);
    }) as typeof fetch;
    const gateway = new PlayerGateway({ baseUrl: "http://127.0.0.1:3000", fetchImpl: fakeFetch, progressIntervalMs: 20 });
    try {
      const { handle } = await gateway.connectPlayer("loadtest-one");
      await eventually(() => streamController !== undefined);
      streamController!.enqueue(encoder.encode('event: snapshot\nid: 1-0\ndata: {"run_id":"run-1","tick":8,"entities":[{"id":710,"owner_player_id":"player-1","pos":{"x":1,"y":2}}]}\n\n'));
      await eventually(() => gateway.getPlayerState(handle).ready);
      expect(gateway.getPlayerState(handle).client_seq).toBe(3);
      expect(gateway.getPlayerState(handle).owned_entities).toHaveLength(1);
      await expect(gateway.observeEvents(handle, 0)).resolves.toMatchObject({ gap: false, ready: true });
      await expect(gateway.connectPlayer("loadtest-one")).rejects.toThrow("already connected");
      expect(() => gateway.setProgressWatch(handle, [711])).toThrow("not known to be owned");
      await expect(gateway.sendIntent(handle, { type: "Move", entity_id: 711, target: { x: 1, y: 2 } })).rejects.toThrow("not known to be owned");

      gateway.setProgressWatch(handle, [710]);
      await eventually(() => gateway.getPlayerState(handle).metrics.progress_requests > 0, 400);
      expect(gateway.getPlayerState(handle).progress).toMatchObject({ 710: { progress: 0.4 } });

      const sent = await gateway.sendIntent(handle, { type: "Move", entity_id: 710, target: { x: 5, y: 6 } });
      expect(sent).toMatchObject({ accepted_http: true, status: 200, client_seq: 4 });
      expect(sent.client_cmd_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(postedIntents[0]).toMatchObject({ run_id: "run-1", client_seq: 4, entity_id: 710 });
      expect(calls.filter(call => call.path !== "/api/players/login").every(call => call.cookie === "player_token=test-token")).toBe(true);

      expect(gateway.disconnectPlayer(handle)).toEqual({ disconnected: true });
      expect(() => gateway.getPlayerState(handle)).toThrow("unknown or closed player handle");
    } finally {
      gateway.close();
    }
  });

  it("rejects non-test identities before creating a player", async () => {
    const gateway = new PlayerGateway({ baseUrl: "http://127.0.0.1:3000", fetchImpl: (() => { throw new Error("should not fetch"); }) as typeof fetch });
    await expect(gateway.connectPlayer("andrew")).rejects.toThrow("loadtest-");
  });

  it("reopens SSE and reconciles a newer sequence after the stream ends", async () => {
    const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];
    let handshakeCount = 0;
    const fakeFetch = (async (input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path === "/api/players/login") {
        return new Response("{}", { headers: { "set-cookie": "player_token=test-token; Path=/" } });
      }
      if (path === "/api/v2/gamestate/stream") {
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) { controllers.push(controller); },
        }));
      }
      if (path === "/api/v2/reconnect") {
        handshakeCount++;
        return Response.json({ run_id: "run-1", player_id: "player-1", last_processed_client_seq: handshakeCount, active_intents: [] });
      }
      throw new Error(`unexpected request ${path}`);
    }) as typeof fetch;
    const gateway = new PlayerGateway({ baseUrl: "http://127.0.0.1:3000", fetchImpl: fakeFetch, reconnectDelayMs: 5 });
    try {
      const { handle } = await gateway.connectPlayer("loadtest-reconnect");
      await eventually(() => controllers.length === 1);
      controllers[0]!.enqueue(new TextEncoder().encode('event: snapshot\ndata: {"run_id":"run-1","tick":1,"entities":[]}\n\n'));
      await eventually(() => gateway.getPlayerState(handle).ready);
      expect(gateway.getPlayerState(handle).client_seq).toBe(1);
      controllers[0]!.close();
      await eventually(() => controllers.length === 2);
      controllers[1]!.enqueue(new TextEncoder().encode('event: snapshot\ndata: {"run_id":"run-1","tick":2,"entities":[]}\n\n'));
      await eventually(() => gateway.getPlayerState(handle).ready && gateway.getPlayerState(handle).client_seq === 2);
      expect(gateway.getPlayerState(handle).metrics.reconnects).toBe(1);
    } finally {
      gateway.close();
    }
  });

  it("replaces watched progress from reconnect batches without polling", async () => {
    const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];
    const encoder = new TextEncoder();
    const fakeFetch = (async (input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path === "/api/players/login") {
        return new Response("{}", { headers: { "set-cookie": "player_token=test-token; Path=/" } });
      }
      if (path === "/api/v2/gamestate/stream") {
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) { controllers.push(controller); },
        }));
      }
      if (path === "/api/v2/reconnect") {
        return Response.json({ run_id: "run-1", player_id: "player-1", last_processed_client_seq: 0, active_intents: [] });
      }
      throw new Error(`unexpected fallback request ${path}`);
    }) as typeof fetch;
    const gateway = new PlayerGateway({ baseUrl: "http://127.0.0.1:3000", fetchImpl: fakeFetch,
      progressIntervalMs: 20, reconnectDelayMs: 5 });
    const send = (controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) => {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };
    try {
      const { handle } = await gateway.connectPlayer("loadtest-progress-reconnect");
      await eventually(() => controllers.length === 1);
      send(controllers[0]!, "snapshot", { run_id: "run-1", tick: 10,
        entities: [{ id: 710, owner_player_id: "player-1" }] });
      await eventually(() => gateway.getPlayerState(handle).ready);
      gateway.setProgressWatch(handle, [710]);
      send(controllers[0]!, "build-progress", { type: "build-progress", run_id: "run-1", server_tick: 10,
        build_state_by_entity: { "710": { blueprint_id: "ship", progress: 0.4 } } });
      await eventually(() => (gateway.getPlayerState(handle).progress["710"] as { progress?: number })?.progress === 0.4);
      send(controllers[0]!, "build-progress", { type: "build-progress", run_id: "run-1", server_tick: 9,
        build_state_by_entity: {} });
      expect((gateway.getPlayerState(handle).progress["710"] as { progress: number }).progress).toBe(0.4);

      controllers[0]!.close();
      await eventually(() => controllers.length === 2);
      send(controllers[1]!, "snapshot", { run_id: "run-1", tick: 11,
        entities: [{ id: 710, owner_player_id: "player-1" }] });
      send(controllers[1]!, "build-progress", { type: "build-progress", run_id: "run-1", server_tick: 11,
        build_state_by_entity: {} });
      await eventually(() => gateway.getPlayerState(handle).metrics.progress_stream_events === 2);
      expect(gateway.getPlayerState(handle).progress).toEqual({});
      expect(gateway.getPlayerState(handle).metrics.progress_requests).toBe(0);
      expect(gateway.getPlayerState(handle).metrics.reconnects).toBe(1);
    } finally {
      gateway.close();
    }
  });
});
