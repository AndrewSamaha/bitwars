# M4: Data-Driven Entities, Content Hash, and Pinning

## Overview

Replace the hardcoded entity properties scattered across `GameConfig` with a
YAML definition file loaded at startup.  Compute a deterministic content hash
so server and client can detect version skew.  Expose the definitions to the
client at build time (as JSON) with a lazy-fetch fallback for live-reload
scenarios.

This milestone is the prerequisite for M5 (abilities): abilities need entity
types to attach to, and the content hash/pinning mechanism will extend
naturally to ability definitions later.

## Current state (what's hardcoded today)

| Property | Where | Value |
|---|---|---|
| `default_entity_speed` | `config.rs` | 90.0 |
| `default_stop_radius` | `config.rs` | 0.75 |
| `default_mass` | `config.rs` | 1.0 |
| `num_entities` | `config.rs` | 2 |

All entities are identical — there is no concept of "entity type."  `init_world()`
creates N clones at random positions.  `IntentManager` uses a single
`default_stop_radius`, `follow_targets` uses a single `default_entity_speed`,
and `physics.rs` uses a single `default_mass`.

`main.rs` reads `CONTENT_VERSION` from env and logs it, but does not store it
in Redis or send it to clients.

## Goals

- Entity properties defined in a JSON file, not in Rust constants.
- Each entity in the game world has an `entity_type_id` linking it to a
  definition.
- Deterministic content hash computed at load time; server publishes it;
  client detects mismatches.
- Client has access to entity definitions for rendering/UX, with a
  fallback fetch for version-skew scenarios.

## Non-goals (deferred)

- Postgres / database storage of definitions (JSON file is source of truth).
- Signed content packs / signature verification (no deployment pipeline yet).
- Scripting hooks (M5+).
- Mid-match content evolution / migration (ADR-002 concern; irrelevant until
  multi-week matches exist).
- Ability definitions (M5).

---

## Deliverables

### 1. Entity definition file

Create `packages/content/entities.yaml`:

```yaml
entity_types:
  worker:
    speed: 90.0
    stop_radius: 0.75
    mass: 1.0
    health: 100

  scout:
    speed: 140.0
    stop_radius: 0.5
    mass: 0.6
    health: 60
```

**Design notes:**

- YAML for authoring: cleaner to read and edit than JSON for configuration
  data — no braces, no trailing-comma issues, supports comments.  Adds a
  `serde_yaml` dependency to the Rust engine (small, well-maintained crate).
- The content hash and all wire formats (Redis, API responses, client
  bundle) still use JSON — YAML is the on-disk authoring format only.  The
  loader deserializes YAML into the same Rust structs, then the hash is
  computed from the canonicalized JSON representation.  This keeps ADR-003
  intact (JSON on the reconnect/API path).
- Lives in `packages/content/` (new directory, sibling to `packages/schemas/`).
  This is the "content pack" — one file today, room to grow (abilities, tech
  tree, asset metadata).
- Schema is flat and obvious.  Fields can be added later without breaking
  existing definitions (serde defaults / `#[serde(default)]`).
- `entity_type_id` is the key string (e.g., `"worker"`).  IDs are never
  recycled (per ADR-002).

### 2. Proto schema change

Add `entity_type_id` to the `Entity` message:

```protobuf
message Entity {
  uint64 id             = 1;
  string entity_type_id = 2;   // ← NEW
  Vec2   pos            = 3;
  Vec2   vel            = 4;
  Vec2   force          = 5;
}
```

Tag 2 is available (currently unused).  This is additive and
backward-compatible — existing clients ignore the new field until they're
updated.

Regenerate Rust codegen (`src/pb/bitwars.rs`) and sim codegen
(`crates/sim/src/pb/mod.rs`).

### 3. Content loader and content hash

New file: `services/rts-engine/src/content.rs`

```
ContentPack
├── entity_types: HashMap<String, EntityTypeDef>
├── content_hash: String          // hex xxh3-64 of canonicalized JSON
└── load(path) -> Result<Self>
```

- `EntityTypeDef`: `speed: f32`, `stop_radius: f32`, `mass: f32`,
  `health: f32` (all `f32` for now; add fields as needed).
- `load()` reads the YAML file, deserializes with `serde_yaml` into the
  same Rust structs.
- `content_hash()` serializes the loaded structs to canonicalized JSON
  (sorted keys, no whitespace — reuse the same `sort_json_values` approach
  from `sim/src/codec.rs`), then hashes with xxh3-64 and returns a hex
  string.  This satisfies the deliverable "content hash ignores
  whitespace/map ordering" — two YAML files with different formatting but
  identical data produce the same hash.
- The hash is computed once at load time and stored on the struct.

**New dependency:** `serde_yaml` added to `rts-engine` Cargo.toml.

**Config integration:**

- New env var `CONTENT_PACK_PATH` (default: `packages/content/entities.yaml`).
- `Engine::new()` loads the content pack.  The `ContentPack` is stored on
  `Engine` alongside `GameConfig`.

### 4. Per-entity type stats in the engine

This is the largest piece of work.  Touch points:

| Component | Change |
|---|---|
| `init_world()` | Takes a spawn manifest (e.g., `[("worker", 1), ("scout", 1)]`).  Each entity gets `entity_type_id` set and its type's stats looked up. |
| `IntentManager::new()` | No longer takes a single `default_stop_radius`.  Instead, receives a reference (or `Arc`) to the `ContentPack` so it can look up per-entity-type `stop_radius` when creating `MotionTarget`s in `make_action_state_from_intent`. |
| `IntentManager::follow_targets()` | Uses per-entity-type `speed` instead of the global `default_entity_speed`.  Needs entity → type lookup (via the entity's `entity_type_id` or a pre-built map). |
| `physics.rs` | Uses per-entity-type `mass` instead of `cfg.default_mass`. |
| `GameConfig` | `default_entity_speed`, `default_stop_radius`, `default_mass` become fallback-only (for entities missing a type) or are removed entirely once all entities are typed.  `num_entities` is replaced by the spawn manifest. |

**Lookup strategy:** Rather than doing a `HashMap::get` per entity per tick,
pre-build a `HashMap<u64, &EntityTypeDef>` (entity_id → type def) at world
init and update it when entities are spawned/destroyed.  This keeps the hot
path allocation-free.

### 5. Content hash in Redis + reconnect handshake

- **Engine → Redis**: On startup, write `content_hash` to a Redis key
  (e.g., `HSET rts:match:{game_id}:meta content_hash <hex>` — can use the
  existing `snapshot_meta` hash or a new `meta` key).
- **Reconnect endpoint** (`/api/v2/reconnect`): Add `content_version` (the
  hash string) to the JSON response, alongside the existing
  `protocol_version`.
- **New endpoint** (`GET /api/v2/content`): Returns the entity definitions
  as JSON (not YAML — the wire format is always JSON).  The server reads
  the YAML file, deserializes, and re-serializes to JSON for the response
  (or reads a cached JSON version from Redis if the YAML file isn't
  accessible to the Next.js process — depends on deployment topology).
  This endpoint is only hit in the version-skew case (see part 6).

### 6. Client-side content definitions + mismatch detection

**Build-time bundling (primary path):**

- A build step converts `packages/content/entities.yaml` to JSON and
  places it where the Next.js app can import it as a static module
  (e.g., `import entityDefs from "@content/entities.json"`).  This gives
  the client a typed `EntityTypeDef` map with zero network cost.
  Alternatively, Next.js can use a YAML loader plugin — either approach
  works; the key point is that the client receives JSON at runtime.
- Compute the content hash client-side (same canonicalization + xxh3) at
  build time and embed as a constant.

**Connect-time validation (fallback):**

- On connect, `reconcileWithServer()` already receives the handshake
  response.  Compare `handshake.content_version` against the bundled hash.
- **Match**: use bundled definitions.  No fetch needed.
- **Mismatch**: fetch `GET /api/v2/content`, replace the in-memory
  definitions, store the new hash.  Log a warning:
  `"content version skew: bundled={bundledHash} server={serverHash}, fetched latest"`.
- Store `content_version` in `localStorage` alongside the persisted intent
  queues.  On next reconnect, if the stored version differs from the
  server's, warn that queued intents may have been created under a different
  content pack.

**Why this approach:**

- Common case (no skew): zero extra requests, definitions available on first
  frame.
- Skew case (server redeployed, client tab still open): one fetch, graceful
  recovery.
- No client-side script execution or heavy processing — just a JSON import.

### 7. Sim crate content awareness

- Add a minimal `ContentPack` / `EntityTypeDef` to the sim crate (or factor
  the types into a shared crate if the duplication is uncomfortable — but
  for M4, a small copy is fine).
- `sim::Engine` accepts an optional `ContentPack`.  If absent, uses the
  existing defaults (`DEFAULT_SPEED`, `DEFAULT_STOP_RADIUS`), so all
  existing tests remain unchanged.
- `tick_movement` uses per-entity speed from the content pack when
  available.
- New test: load the actual `entities.json`, spawn a worker and a scout,
  issue identical move intents, verify the scout arrives faster.  Golden
  hash.

### 8. Documentation

- Update `milestones.md` to mark M4 deliverables as done.
- Update `docs/tools/chaos-harness.md` if golden hashes change (they
  shouldn't if existing tests don't use entity types).

---

## Acceptance criteria

Per `milestones.md`:

> M0–M3 behaviors unchanged under content pinning; client refuses unknown
> major protocol.

Concretely:

- [ ] All existing sim tests pass without modification (entities without a
  type fall back to defaults).
- [ ] All existing rts-engine tests pass.
- [ ] A new sim test verifies that two different entity types move at
  different speeds and have different stop radii.
- [ ] The reconnect handshake response includes `content_version`.
- [ ] The client logs a warning when `content_version` mismatches the
  bundled hash.
- [ ] `cargo test -p sim` and `cargo test -p rts-engine --lib` pass.

---

## Implementation order

1. Create `packages/content/entities.yaml` with 2 entity types.
2. Proto schema change (`entity_type_id` on `Entity`) + codegen.
3. `content.rs` — loader + canonical hash.
4. Wire loader into `Engine::new()`.  Update `init_world()` to use spawn
   manifest + per-type stats.
5. Per-entity stats in `IntentManager` (`stop_radius`, `speed`) and
   `physics.rs` (`mass`).
6. Publish content hash to Redis.  Add to reconnect handshake response.
7. `GET /api/v2/content` endpoint.
8. Client: build-time bundle, connect-time validation, `localStorage`
   storage.
9. Sim crate: optional content pack, per-entity-type movement, new test.
10. Update docs.

---

## Open questions

- **Spawn manifest format**: hardcoded in Rust for now (e.g.,
  `vec![("worker", 1), ("scout", 1)]`), or defined in the content JSON?
  Recommend: keep it in `GameConfig` / env for now; a declarative match-setup
  format can come later when there's a lobby/matchmaking system.
- **Health**: The `Entity` proto doesn't have a `health` field yet.  M4
  adds `health` to `EntityTypeDef` but we may not need it on the proto
  until combat exists (M5+).  For now, store it in the definition and use it
  when needed.
- **Shared crate for content types**: Duplicating `EntityTypeDef` in both
  `rts-engine` and `sim` is a small amount of code.  A shared crate adds
  build complexity.  Recommend: duplicate for M4, extract if it grows in M5.
- **Client-side xxh3**: The client needs to hash the bundled JSON to compare
  with the server's hash.  Options: compute at build time and embed as a
  constant (simplest), or use a JS xxh3 library at runtime.  Recommend:
  build-time constant.
- **YAML vs JSON on disk**: YAML is the authoring format for human
  readability.  All derived artifacts (content hash, API responses, client
  bundle, Redis values) use JSON.  If a future tool needs to write
  definitions programmatically, it writes YAML.
