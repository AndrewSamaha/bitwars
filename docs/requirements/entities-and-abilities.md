# Entities and Abilities Requirements

Last updated: 2026-10-31

## Purpose

Define a data-driven model for entities (units, buildings, resources) and abilities that integrates with the entity intent system. Support long-running matches (weeks/months) with controlled mid-match evolution, scripting hooks, and strict determinism/security on the authoritative server.

## Data Model and Content Pipeline

- **Source of truth:** authored `packages/content/entities.yaml` and final sprite/mask/settings files under `packages/content/assets`. Every entity whose art ships with content must have its files there; files that exist only in `apps/web/public/assets` are not included in a revision and fall back to the corvette sprite in the live client (only the corvette fallback itself is read from `public/assets`). Editor saves automatically stage publication; explicit authenticated `POST /api/content/reload` publishes external file edits. There is no file watcher.
- **Global revision:** SHA256 of canonical authored JSON containing all entity/resource/technology definitions and the entity asset mappings. Object keys sort in UTF-16 order; arrays retain order; numbers use ECMAScript JSON formatting. Rust and TypeScript use the same algorithm.
- **Per-entity hashes:** each authored entity definition has an independent SHA256. Each sprite bundle hashes its filename-to-file-SHA256 map, covering idle/gray/primary/invariant images and `player-colors.json`. Artless types use the verified corvette fallback. Gray-only authored bases are supported.
- **Immutable storage:** `packages/content/.revisions/<revision>/manifest.json` retains the manifest; `.revisions/bundles/<entity_id>/<asset_hash>/<filename>` retains artwork. Public URLs are `/assets/<entity_id>/<asset_hash>/<filename>` with immutable caching. Old manifests and bundles are retained, not garbage-collected.
- **Activation:** stage → validate → ready → activate at a simulation tick boundary, also while paused. The engine publishes accepted definitions, revision, operation status, and binary world checkpoint atomically. Rejected revisions do not alter the accepted pack or live world.
- **Identity:** entity IDs, ownership, positions, health, inventories and orders remain unchanged on accepted reload. Existing instances use the newly active definitions; types are not permanently pinned at spawn.
- **Snapshots:** `Snapshot.content_revision` identifies the exact accepted content for restoration. Missing retained data fails restoration rather than silently substituting edited disk files. Legacy snapshots without this field adopt current disk content once with a warning. Retain and back up `.revisions` with the game's Redis snapshots.
- **Authoring concurrency:** each reload has a dashed-UUID `reload_id` and `base_revision`; a stale base is rejected. Whole-file editor reads/writes and revision capture are serialized within the web process. Concurrent external file changes during capture fail staging rather than publishing an inconsistent bundle.
- **Scope:** this revision covers definitions and entity artwork, not live positions/resources/orders, spawn configuration, scenario selection, or SFX. Those retain their own controls.

## Scripting Model (Server-Authoritative)

- **Engine and Sandbox**
  - Lua (or equivalent) executed server-side only.
  - No wall-clock, filesystem, or network access.
  - Deterministic RNG seeded per match/tick; fixed-timestep inputs.
  - CPU and memory quotas with hard timeouts and clear error surfacing.

- **Ability Hooks**
  - `canExecute(ctx) -> { ok, reason?, cost?, reservations? }`
  - `onStart(ctx)`, `onTick(ctx)`, `onInterrupt(ctx)`, `onComplete(ctx)`
  - Targeting schema declared in data: `self | entity | position | area` (+ filters/ranges).

- **Validation & Reservations**
  - Reservation manager is authoritative; scripts return desired costs which are validated and escrowed.
  - Policy flags per ability: hard vs soft reservation, refund rules, interrupt refunds.

## Determinism & Security

- **Determinism**
  - Script results are a pure function of tick, entity state, and context.
  - Constrained numeric ops (fixed-point or vetted FP) consistent across platforms.

- **Security**
  - Strict module whitelist; no ambient authority.
  - Static analysis/lint prior to packaging; runtime quotas and error isolation.
  - Authenticated editor publication; authoritative schema, hash, asset integrity and live-compatibility validation before activation. This implementation does not sign content packs.

## Long-Running Matches and Mid-Match Evolution

- A match has one accepted global revision at a time. Live reload affects all instances of each edited type; there is no mixed-version compatibility shim.
- Reject deleting a live entity type, removing held resource/completed technology definitions, changing a live deposit's resource, lowering capacity below stored stock, or lowering maximum health below current health.
- Reject removing dependencies required by active construction, upgrades, research, collection, repairs, delivery and resupply.
- Compatible balance/visual updates and new types can be activated without resetting the match. No automatic inventory truncation or entity migration is performed.

## Networking & Client Implications

- Reconnect handshakes advertise the global SHA256 as `content_version`.
- Live SSE `content_changed` events carry `content_revision`, `reload_id`, and `activated_tick`.
- Clients fetch exactly `GET /api/v2/content?revision=<hash>`; unaccepted candidates are not served. Superseded requests cannot overwrite a newer advertised revision.
- Renderers load and verify changed immutable bundles before swapping existing visuals, including same-type entities. Definition-only revisions reuse unchanged textures. Texture references held by explosion fragments remain valid until released.
- Failed asset fetch/hash/decode/mask work retains previous visuals and reports the affected entity, immutable URL and expected hash. Synchronized acknowledgements require definitions and renderer application, not merely receiving an event.
- Intents execute against accepted authoritative content; candidate validation protects dependencies of in-progress actions.

## Observability

- Correlate `intent_id` with `ability_id` and script version in logs/traces.
- Metrics: script validation failure rate, quota hits, migration application count.
- The Live content panel and game-query endpoints expose the active revision, durable reload transitions/errors and activation tick, current client reports, and the last 100 client state transitions. A failure remains inspectable after recovery.
- Reload operations retain the last 100 history entries, while pending/in-progress operations remain durable. Client reports expire from the connected view after two minutes; reports heartbeat every 30 seconds.
- Interrupted activation operations are marked failed on restart. Notification failures are recorded without mislabeling already activated content as rejected. The SSE bridge also checks the accepted revision index so lost notifications do not strand connected clients.

## Open Questions

- Scripting engine choice and sandbox (Lua vs JS/WASM) and determinism strategy.
- Long-term immutable manifest/bundle retention is currently operator-managed; no garbage collector is enabled.
- Client prediction scope: mirror scripts client-side vs server-trust with hints.
- Refund policies for interrupted/channeling abilities.
