# Glossary

Concise definitions of common terms used across `docs/` and code.

- **Intent**: A player-issued command describing an action for one or more entities (e.g., Move, Attack, Build).
- **Intent Queue**: Per-entity ordered list of future intents; supports insert-front, append, replace, clear.
- **Current Action**: The action an entity is executing; includes type, state, progress, and parameters.
- **Lifecycle States**: `QUEUED`, `VALIDATING`, `READY`, `IN_PROGRESS`, `BLOCKED`, `INTERRUPTED`, `SUCCEEDED`, `FAILED`, `CANCELLED`.
- **Reservation**: A hold on resources/slots to ensure future intents can execute.
- **Hard Reservation**: Immediate deduction of resources (e.g., at enqueue/start).
- **Soft Reservation**: Provisional allocation that can time out or be revoked.
- **Client Command ID (`client_cmd_id`)**: Client-generated id for deduplication/idempotency.
- **Intent ID (`intent_id`)**: Server-assigned unique id for tracking and observability.
- **Server Tick**: Discrete time step for deterministic simulation and state updates.
- **Snapshot**: Periodic full or compressed representation of state.
- **Delta**: Incremental update between snapshots.
- **Prediction**: Client-side approximation of results before server confirmation.
- **Reconciliation**: Correcting client state to match the authoritative server.
- **LOS / Fog of War**: Line-of-sight based visibility; server-enforced vision rules.
- **Stance**: Behavior preset (aggressive/defensive/hold/stand-ground) influencing targets/movement.
- **Formation**: Spatial arrangement rules for group movement.
- **Squad**: Logical grouping of entities that share commands and cohesion settings.
- **Interest Management**: Filtering updates to only what a client needs to know.
- **Tech State**: Player’s unlocked technologies/prerequisites.
- **Production Queue**: Building’s training/production slots for units or items.
- **Rally Point**: Destination or target assigned to newly produced units.
- **Attack-Move**: Move while auto-acquiring targets along the path.
- **Patrol**: Repeating movement across waypoints with engagement rules.
- **Hold Position**: Stay in place and only engage within range.
- **Interrupted**: Action forcibly stopped (e.g., by damage or new order) during execution.
- **Blocked**: Action cannot proceed due to temporary constraints (path fail, resource shortfall).
- **Idempotency**: Safe to apply the same command multiple times without changing the outcome.

## Content and Scripting Terminology

- **Content Version**: A hash/semantic version representing the set of entity/ability definitions used by a match.
- **Content Pack**: The bundled, signed definitions (and metadata) for entities/abilities for a specific content version.
- **Match Pinning**: Binding a match to a single `content_version` for its entire duration.
- **Migration**: A controlled change to content or live state applied during a long-running match; requires compatibility shims.
- **Maintenance Tick**: A scheduled simulation tick window during which migrations may be safely applied.
- **Hot Reload**: Reloading content without restarting the match; typically allowed only in development.
- **Sandbox**: Restricted script execution environment with limited APIs and enforced quotas.
- **Ability Hooks**: Script entry points like `canExecute`, `onStart`, `onTick`, `onInterrupt`, `onComplete` used to validate/drive abilities.
- **Deterministic RNG**: Pseudo-random number generator seeded by match/tick to ensure reproducible results.
- **Compatibility Shim**: Code or data layer translating between old and new content versions to keep ongoing actions valid.
