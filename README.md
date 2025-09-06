Yet another RTS game. Using Next.js, Redis, and TypeScript.

## Getting Started

First, install dependencies, start redis, start the server, run migrations and seed mock entities:

 From the repository's root:
```bash
pnpm run clean
pnpm install
pnpm approve-builds
docker compose up -d
pnpm dev
cd apps/web
pnpm db:migrate
pnpm createmock:gamestate
```

Open [http://localhost:8001/redis-stack/browser](http://localhost:8001/redis-stack/browser) with your browser to connect to redis stack.

## Working Endpoints

- `GET /api/setup` - Initialize the entity index (run migrations) in redis
- `POST /api/gamestate/mocks/create_gamestate` - Add mock entities to the redis cache
- `GET /api/gamestate/poll` - Return all entities
- `GET /api/gamestate/poll?x=87&y=87&radius=60` - Search for entities within a radius of x/y
- `GET /api/gamestate/debug` - Debug the entity index  (to the console)
- `GET /api/gamestate/stream` - Stream gamestate to clients

