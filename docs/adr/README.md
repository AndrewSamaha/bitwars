# Architecture Decision Records (ADRs)

ADRs capture significant technical decisions, the context that led to them, and the consequences. They help future contributors understand why things are the way they are.

## Workflow

1. Create a new ADR file: `docs/adr/NNN-title.md` where `NNN` is zero-padded (e.g., `001`).
2. Use the template below. Start with `Status: Proposed`. During review, discuss tradeoffs. When accepted, update to `Accepted` (or `Rejected`, `Superseded by NNN`, etc.).
3. Link to the ADR from relevant docs and code comments where the decision applies.

## ADR Template

```
# NNN - Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Rejected | Superseded by NNN

## Context
- What problem are we solving? Constraints? Requirements?

## Decision
- The decision we are making.

## Consequences
- Positive, negative, risks, roll-out plan.

## Alternatives Considered
- Option A: pros/cons
- Option B: pros/cons

## References
- Links to issues, PRs, docs.
```

## Candidate ADRs to Write

- Resource reservation policy (enqueue vs start vs refundable deposits).
- Determinism strategy (fixed-point vs constrained floating point; RNG seeding).
- Networking contract for intents (ordering, idempotency, batching, snapshots/deltas).
- Pathfinding and movement policy (formation-aware pathing, avoidance levels).
