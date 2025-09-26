# 002 - Content Versioning, Packaging, and Long-Running Evolution

Date: 2025-09-25
Status: Proposed

## Context
- Matches can last weeks/months; we may need to evolve entity/ability definitions mid-match.
- We need determinism and fairness; players must share the same content state.
- We want a data-driven pipeline (JSON/YAML in repo) seeded to Postgres, producing signed packs.

## Decision
- Establish content packs as the deployable unit of game definitions:
  - A pack is a snapshot of the latest versions of all entities and abilities at a point in time, plus assets metadata and a manifest with a content hash/version.
  - Packs are signed; servers verify signature on load.
- Pin each match to a specific content pack version by default.
- Per-entity immutable version binding:
  - Each live entity is bound to a specific `entity_type_id@version` and each ability intent references `ability_id@version`.
  - The bound version for a live entity never changes automatically; only newly created entities after an upgrade use the latest definitions.
  - Existing entities continue to use their bound versions even if the active content pack changes mid-match.
- Ability Library (auto-upgrading):
  - Abilities are resolved through a global Ability Library mapping `ability_id -> current_version` within a match.
  - When a new ability version is released to the match (via content pack upgrade), all entities that can access that ability automatically resolve to the latest ability version for new validations/executions.
  - In-progress actions continue using the ability version they started with until completion or interrupt. New evaluations (new intents or re-validations) use the latest.
  - Application timing: upgrades are applied at maintenance ticks to preserve determinism and fairness during a match.
- Support optional, controlled mid-match evolution via two modes (opt-in per game/match type):
  1) Additive-Only Updates: load a newer content pack at maintenance; allow adding new types/abilities only. New spawns use latest-from-pack; existing entities remain on their bound versions.
  2) Scheduled Migration Windows: at preannounced maintenance ticks, apply migration scripts with compatibility shims. Optionally rebind certain entities/queues to new versions according to explicit rules.
- Definitions are immutable once published; to change behavior, create a new versioned definition (e.g., `ability_id: fireball@2`).

## Consequences
- Determinism: Pinning and signed packs maintain fairness. Evolution is explicit and bounded.
- Complexity: Migration tooling is required for long-running matches (state transforms, coexistence of versions).
- UX: Clients display versioned tooltips and handle coexistence gracefully.

## Alternatives Considered
- No mid-match changes: simplest and safest, but conflicts with multi-week game goals.
- Freeform hot reload: fast iteration, but unsafe for fairness/determinism and difficult to reconcile across clients.

## Implementation Notes
- Pipeline
  - Author in repo as JSON/YAML; validate with schema + static analysis; then seed to Postgres and bundle into a pack.
  - Compute `content_hash` from canonicalized data; include creation timestamp and semantic version.
- Distribution
  - Server loads a single pack per match; handshake sends `content_version` and hash to clients.
  - Replays record the content hash; viewers must load the same pack.
- Evolution
  - Additive mode: allow only new IDs; validators reject modifications/removals. After upgrade, new spawns use latest-from-pack; existing entities keep their bound versions.
  - Migration mode: prepare migration scripts that can map live entities/queues/cooldowns/reservations; apply at a maintenance tick. Rebinding is explicit and limited in scope.
  - Compatibility shims: allow both old and new versions concurrently as needed; intent validation and script dispatch are version-aware (`entity_type_id@version`, `ability_id@version_used`).
  - Ability Library resolution: on upgrade, set `current_version` for each ability; cache-bust script modules for abilities that changed.
  - Queued intents: if they reference an older ability version, attempt automatic migration to the latest compatible version; if incompatible, keep the old version or surface a warning and allow cancel with refund policy.
- Observability
  - Log content version per match; metrics for migration success/failure and time.

## Open Questions
- What cadence and SLAs for maintenance ticks in competitive modes?
- What subset of fields qualify as "additive only" (e.g., adding a new ability vs adding a new projectile attr to existing ability)?
- What is the policy for refunds/compensation when a migration invalidates queued intents?
- How do we define "compatible" for queued-intent auto-migration (e.g., same targeting schema and cost keys)?
- Do we allow per-queue pinning to an ability version to avoid surprises, or always auto-upgrade at validation time?

## References
- `docs/requirements/entities-and-abilities.md`
- `docs/requirements/entity-intents.md`
- `docs/adr/README.md`
