# Entities and Abilities Requirements

Last updated: 2025-09-25 18:36:05 -0400

## Purpose

Define a data-driven model for entities (units, buildings, resources) and abilities that integrates with the entity intent system. Support long-running matches (weeks/months) with controlled mid-match evolution, scripting hooks, and strict determinism/security on the authoritative server.

## Data Model and Content Pipeline

- **Source of Truth**
  - Entity and ability definitions authored as version-controlled JSON/YAML.
  - Seeded into Postgres at build/deploy for authoring/query convenience.
  - Build emits a signed content pack with a content hash/version.

- **Identifiers**
  - Stable `entity_type_id`, `ability_id` (do not recycle IDs across versions).
  - Entities in a match bind to a specific definition version at spawn.

- **Versioning & Match Pinning**
  - Each match declares `content_version` at start; server enforces for all participants.
  - Replays record the content version to ensure deterministic playback.

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
  - Signed content packs; server validates signatures.

## Long-Running Matches and Mid-Match Evolution

- **Policies**
  - Default: matches are pinned to a content version for the full duration.
  - Optional evolution modes for multi-week matches:
    - Additive-only updates (new types/abilities; no breaking changes).
    - Scheduled maintenance ticks with migration scripts and compatibility shims.

- **Coexistence**
  - Old and new ability versions can coexist; existing entities retain bound versions.
  - UI shows versioned tooltips; networking includes version tags when relevant.

## Networking & Client Implications

- **Handshake**
  - Client sends supported content versions; server responds with chosen version and pack hash.

- **Intents**
  - Client includes `ability_id` and `content_version` in messages.
  - Server echoes authoritative ability state and cooldowns in deltas for UX.

- **Prediction**
  - Client uses replicated static data for cooldowns/ranges.
  - If client does not run scripts, predictions are hints only; reconcile with server.

## Observability

- Correlate `intent_id` with `ability_id` and script version in logs/traces.
- Metrics: script validation failure rate, quota hits, migration application count.

## Open Questions

- Scripting engine choice and sandbox (Lua vs JS/WASM) and determinism strategy.
- Content source-of-truth (files vs DB), packaging/signing, and hot reload policy.
- Which mid-match evolution mode to support for long-running games.
- Client prediction scope: mirror scripts client-side vs server-trust with hints.
- Refund policies for interrupted/channeling abilities.
