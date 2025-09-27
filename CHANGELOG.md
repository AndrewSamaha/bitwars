# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

- Keep a Changelog: https://keepachangelog.com/en/1.1.0/
- Semantic Versioning: https://semver.org/spec/v2.0.0.html

## [Unreleased]

### Added
- `CHANGELOG.md` created and aligned with existing git history.
- Updated `README.md` Getting Started to match current tooling (`pnpm`, `turbo`) and Redis Stack via `docker-compose.yml`.
- Documentation index and links surfaced in `README.md` (see `docs/`).

### Notes
- See the development milestones in `docs/milestones.md` for the incremental feature plan (M0–M10).
- For decision context on scripting/determinism, see `docs/adr/001-scripting-engine-and-sandbox.md`.

## [2025-09-26]

### Chore
- Design docs: Entity Intent System captured (Issue #27, PR #28). Adds/updates `docs/requirements/entity-intents.md` with lifecycle, reservations, versioning, and networking details; complements `docs/milestones.md` and `docs/glossary.md`.

## [2025-09-25]

### Added
- UI/UX: Hovering over entity shows state indicator (PR #25) to aid debugging of gamestate and intent progress.

## [2025-09-22]

### Refactor
- Cleans up TypeScript errors across the web app (PR #24) to stabilize local dev experience and CI lint/typecheck.

## [2025-09-21]

### Added
- Web app structure: HUD context provider introduced and `TerminalPanel` modularized (PR #23) for clearer state management and UI composition.

## [2025-09-20]

### Fixed
- Streaming: Addressed issue where streaming did not work on first `/play` (PR #22).

## [2025-09-12]

### Added
- Auth UX: Loading states added to login flow (PR #21) for improved feedback.

## [2025-09-11]

### Refactor
- Gamestate pipeline migrated to use protobuf types (PR #16). This aligns with the shared schema approach under `packages/schemas/` and generated types in `packages/shared/`.

## [2025-09-10]

### Added
- Observability: Snapshot listener/counter (PR #14) to validate periodic snapshot emission.

### Fixed
- Redis I/O: Correctly reading binary streams from Redis (PR #13), unblocking robust delta/snapshot handling.

## [2025-09-07]

### Added
- Engine → Redis: `rts-engine` publishes delta stream and snapshots to Redis (PR #12). Establishes the server-authoritative state export for the client to consume.
- Engine: Proof-of-concept game loop in `services/rts-engine/src/main.rs`.
- Build: Proto types flow into `rts-engine` (prost build pipeline).

### Chore
- README updates and Rust-specific `.gitignore` additions for cleaner workspace.

## [2025-09-06]

### Added
- Protobuf: Basic world definitions introduced to support typed gamestate across services.

### Changed
- Repo layout: Moved `rts-engine` out of a same-named parent directory to a clean `services/rts-engine/` location.
- Docs: README updated with monorepo folder structure and conventions.

### Fixed
- Rendering: Typeguard added to render loop (PR #11).

### Chore
- Build system: Set up protobuf type generation (PR #10) to produce TS types in `packages/shared/`.

## [2025-09-05]

### Chore
- Monorepo migration (PR #6): Adopted `pnpm` workspaces and `turbo` for builds. Introduced `packages/schemas/` and `packages/shared/`, prepared `apps/web/` and `services/` layout.

## [2025-09-03]

### Added
- Frontend tech: PixiJS and Miniplex ECS setup (PR #4) to bootstrap rendering and simple ECS on the client.

## [2025-09-01]

### Added
- Auth: Initial login flow (PR #3).

### Changed
- Docs: README updates (PR #1).
- Coordinate system: Entities now use `x, y` for position consistently.

### Chore
- Data: Adds `entityDoc` schema for early data modeling.

## [2025-08-31]

### Added
- Infrastructure: Redis Stack `docker-compose.yml` for local dev, including browser UI at `http://localhost:8001/redis-stack/browser`.
- Data layer: Basic Redis CRUD for early persistence.
- Networking: Proof-of-concept streaming route to demonstrate client consumption of server updates.
