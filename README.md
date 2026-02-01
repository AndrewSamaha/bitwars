Yet another RTS game. Using Next.js, Redis, and TypeScript.

## Getting Started

First, install dependencies, start Redis Stack, start the dev servers, and (optionally) seed some mock data:

 From the repository's root:
```bash
pnpm run clean
pnpm install
docker compose up -d
pnpm dev

# In another terminal (optional data init for the web app):
pnpm -C apps/web run db:init
pnpm -C apps/web run createmock:players
```

Open [http://localhost:8001/redis-stack/browser](http://localhost:8001/redis-stack/browser) with your browser to connect to Redis Stack.

## Working Endpoints

- `POST /api/init` - Initialize any required indexes/state (development convenience)
- `POST /api/players/mocks/create_players` - Seed mock players (development/testing)

## Monorepo Structure
```
bitwars/
├─ docker-compose.yml     (redis-stack cache and ui)
├─ docs/                  (documentation)
│  ├─ requirements/       (High-level future requirements)
│  ├─ milestones/         (Detailed development milestones that latter up toward requirements)
│  ├─ adr/                (Architecture Decision Records)
│  ├─ glossary.md         (Shared terminology)
│  ├─ milestones.md       (High-level overview of milestones)
│  └─ README.md           (Documentation index)
├─ apps/
│  └─ web/                (Next.js 15 app; dev scripts and API routes under `/api`)
├─ crates/                (currently empty)
├─ packages/
│  ├─ schemas/            (Protobuf schema definitions)
│  └─ shared/             (TypeScript types generated from protobuf schemas)
└─ services/
   └─ rts-engine/         (Rust server/engine; Redis client, examples, protobuf build)
```

### Using pnpm in monorepo
Adding dependencies at the root level is easy, you simply run your pnpm commands at root.

Adding dependencies to a specific package is a bit more involved. You need to run pnpm install --filter <package-name>, e.g.,
```bash
pnpm -F bitwars add @bufbuild/protobuf
```

## rts-engine
This is the Rust server that will run the game loop. It integrates with Redis and protobuf-generated types.

Common tasks from repo root (see `package.json`):
```bash
# Build and run
pnpm engine:build
pnpm engine:run

# Utilities/examples
pnpm engine:generate-examples
pnpm engine:read-snapshot
pnpm engine:read-deltas
```

You can also invoke Cargo directly:
```bash
cargo build -p rts-engine
cargo run -p rts-engine
```

### Replay tests (`pnpm test:replay:x`)

Named replay tests run a scenario (beginning world state, entities, predefined intents, predefined ticks) against the in-memory sim engine and assert the final world hash (xxh3). No Redis required.

**Run a replay test** (from repo root):

```bash
pnpm test:replay:two_entities_move
```

Exit 0 means the hash matched; exit 1 means mismatch (a minimal diff is printed).

**Add another scenario:**

1. Define the scenario in `services/rts-engine/src/bin/replay_test.rs` inside `scenarios()`: set `initial_state`, `intents`, `total_ticks`, and use `expected_hash: 0` and `expected_json: ""` as placeholders.
2. Run with `--golden` to print the expected hash and JSON:
   ```bash
   cargo run -p rts-engine --bin replay_test -- <scenario_name> --golden
   ```
3. Paste the printed `expected_hash` and `expected_json` into the scenario in `replay_test.rs`.
4. Add a script in the root `package.json`:
   ```json
   "test:replay:<name>": "cargo run -p rts-engine --bin replay_test -- <name>"
   ```

## Side-by-side testing of type decoding
In nextjs:
```bash
pnpm --filter bitwars run test:read-redis
```

In rust:
```bash
pnpm engine:read-deltas
```

## Documentation

See `docs/` for specifications and design:
- `docs/README.md` – documentation index
- `docs/requirements/` – system requirements
- `docs/adr/` – Architecture Decision Records (e.g., `001-scripting-engine-and-sandbox.md`)
- `docs/milestones.md` – development roadmap
- `docs/glossary.md` – shared terminology
