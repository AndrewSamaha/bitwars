# WindSurf Prompt — Build `/api/gamestate/stream` v2 (SSE over Redis, protobuf)

You are working in a PNPM/Turborepo monorepo called **bitwars**. Ship a production-ready **Next.js App Router** API route `apps/web/app/api/gamestate/stream/route.ts` (SSE) that reads **protobuf-encoded** snapshots & deltas from Redis and streams JSON events to the browser.

---

## Current repo shape (relevant parts)

```
bitwars/
├─ packages/
│  ├─ schemas/                  # .proto sources (compiled elsewhere)
│  └─ shared/
│     └─ src/gen/               # TypeScript protobuf-es codegen output
│        # ex: bitwars_snapshot.ts, bitwars_delta.ts, bitwars_entity.ts, etc.
├─ services/
│  └─ rts-engine/               # Rust engine publishes to Redis
│     └─ (publishes Snapshot & Delta protobuf bytes)
└─ apps/
   └─ web/                      # Next.js front end (App Router)
      └─ app/api/gamestate/stream/route.ts   # <-- implement v2 here
```

---

## Wire contract (Rust engine → Redis)

- **Snapshot** (full state):
  - Redis **key**: `snapshot:<GAME_ID>`
  - **value**: protobuf `Snapshot` **bytes** (engine uses `prost`)
  - `Snapshot` fields: `int64 tick`, `repeated Entity entities`
- **Snapshot metadata**:
  - Redis **hash**: `snapshot_meta:<GAME_ID>`
  - fields:
    - `tick` (i64)
    - `boundary_stream_id` (string) ← stream ID of the **last Delta included** in the snapshot
    - `updated_at_ms` (i64)
- **Deltas** (sparse updates):
  - Redis **stream**: `deltas:<GAME_ID>`
  - entries: field `data` = protobuf `Delta` **bytes**
  - `Delta` fields: `uint64 tick`, `repeated EntityDelta updates`
- Engine publishes periodically:
  - `XADD deltas:<GAME_ID> * data <bytes>` (with `MAXLEN ~ 10000`)
  - `SET snapshot:<GAME_ID> <bytes>`
  - `HSET snapshot_meta:<GAME_ID> boundary_stream_id <id> tick <tick> updated_at_ms <ms>`

---

## TypeScript protobuf setup

- We already generate TS types with **buf.build/bufbuild/es** (protobuf-es).
- Import the generated classes from `packages/shared/src/gen/*` and use `.fromBinary()` / `.toBinary()` / `.toJson()` as provided by protobuf-es.
  - e.g.:
    ```ts
    // Adjust import paths/filenames to your codegen output
    import { Snapshot } from "@bitwars/shared/gen/bitwars_snapshot_pb";
    import { Delta }    from "@bitwars/shared/gen/bitwars_delta_pb";
    ```
  - If no TS path alias exists, use a relative import `../../../../packages/shared/src/gen/...`. Prefer adding a tsconfig path alias `@bitwars/shared/gen/*` in the app.

---

## Environment & config

- Environment variables (load from **repo root** `.env` within Next config or via `dotenv`):
  - `GAME_ID` (default: `demo-001`)
  - `GAMESTATE_REDIS_URL` (default: `redis://127.0.0.1:6379`)
- This route must run on **Node.js runtime** (not edge), because we need TCP to Redis.
  - `export const runtime = "nodejs";`
  - `export const dynamic = "force-dynamic";` (this is a long-lived streaming response)

---

## What to build (SSE API)

Implement GET `/api/gamestate/stream` that:

1) **Connects to Redis** (node-redis or ioredis; your call).
2) **Bootstrap:**
   - Read `snapshot_meta:<GAME_ID>` (HGETALL) → get `boundary_stream_id` (**B**) and `tick`.
   - Read `snapshot:<GAME_ID>` (GET as `Buffer`) and **decode** protobuf → `Snapshot`.
   - **Emit SSE event**:
     ```
     event: snapshot
     id: <B>
     data: <JSON>   // JSON-serializable object converted from Snapshot (protobuf-es toJson() or a manual transform)
     ```
3) **Gap catch-up:** fetch deltas **after** boundary:
   - `XRANGE deltas:<GAME_ID> (B + COUNT 512` in a loop until empty.
   - For each entry:
     - extract field `data` (Buffer), decode `Delta` (protobuf-es), **emit SSE**:
       ```
       event: delta
       id: <stream-id>
       data: <JSON>
       ```
     - keep the **latest stream ID** as **L**.
4) **Live tail:** switch to **blocking** reads:
   - Use `XREAD BLOCK 15000 STREAMS deltas:<GAME_ID> L` (note: XREAD expects the **last seen** ID; it returns strictly newer).
   - For each batch, decode and emit `delta` events as above, updating **L**.
   - Send a heartbeat comment every ~10s: `: ping\n\n` to keep proxies happy.
5) **Cancellation & reconnect:**
   - Tie Redis reads to `req.signal` (abort on client disconnect).
   - Support two ways to resume on reconnect:
     - If the browser sends `Last-Event-ID` header, start from that ID (i.e., treat it as **L** and skip the snapshot).
     - Otherwise, do the full **snapshot + gap** bootstrap again.
   - Also accept a query param `?since=<stream-id>` to override resume behavior (useful for tests/tooling).
6) **Headers & caching:**
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-store`
   - `Connection: keep-alive`
   - `Transfer-Encoding: chunked`
   - Flush after each write; use a `TransformStream` or Node `PassThrough` as needed.
7) **Error handling:**
   - On any decode error, log and continue to next entry (don’t kill the stream).
   - On Redis reconnectable error, attempt a couple retries; otherwise end the response gracefully.

---

## Output event shapes (JSON in `data:`)

Keep it small and client-friendly. Convert protobuf messages to plain JSON:

- `snapshot`:
  ```json
  {
    "type": "snapshot",
    "tick": 0,
    "entities": [{ "id": 1, "pos": {"x": 0, "y": 0}, "vel": {"x": 0, "y": 0} }]
  }
  ```
- `delta`:
  ```json
  {
    "type": "delta",
    "tick": 1,
    "updates": [{ "id": 1, "pos": {"x": 0.1, "y": 0.0}, "vel": {"x": 0.6, "y": 0.0} }]
  }
  ```

---

## Acceptance criteria

- A **single** TypeScript file `apps/web/app/api/gamestate/stream/route.ts` that compiles in Next.js App Router.
- Uses **SSE** with proper headers and **auto-flush**.
- Implements **snapshot → gap (XRANGE) → live (XREAD)** exactly as above.
- Decodes protobuf bytes using the classes from `packages/shared/src/gen`.
- Obeys `Last-Event-ID` and `?since=` for resume.
- Cleans up on abort (closes Redis connection).
- Uses `GAMESTATE_REDIS_URL` & `GAME_ID`.
- Includes a tiny **client usage snippet** (in comments) showing:
  ```ts
  const es = new EventSource("/api/gamestate/stream");
  es.addEventListener("snapshot", (e) => { const s = JSON.parse(e.data); /* render */ });
  es.addEventListener("delta",    (e) => { const d = JSON.parse(e.data); /* apply */  });
  es.onerror = () => es.close();
  ```
- (Nice to have) basic logging with request id.

---

## Notes

- If our TS codegen file names differ, search under `packages/shared/src/gen` and import the correct paths. Use protobuf-es (`.fromBinary(Uint8Array)` / `.toJson()`).
- We’re OK sending **JSON** over SSE; don’t stream raw protobuf to the browser.
- Use Node Redis v4 or ioredis; prefer simple, dependency-light code.
- Assume Redis auth not required for local (but wire env var if you need it).
