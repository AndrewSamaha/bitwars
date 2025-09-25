# Project Documentation

Last updated: 2025-09-25 18:22:02 -0400

This directory contains specifications, designs, and decision records for the project.

## Index

- Requirements
  - [Entity Intent System Requirements](./requirements/entity-intents.md)
- Architecture Decision Records (ADRs)
  - See [docs/adr/](./adr/)
- Glossary
  - See [Glossary](./glossary.md)

## Contributing to Docs

- Prefer small, focused documents under `docs/` and group related topics into subfolders like `docs/requirements/` and `docs/design/`.
- For key, long-lived decisions, add an ADR in `docs/adr/`.
- Keep documents dated and list any open decisions at the bottom.

## Style

- Use Markdown headings, code fences, and reference paths (e.g., `docs/requirements/entity-intents.md`).
- Keep diagrams (if any) lightweight and include sources.
- Favor concise sections with clear acceptance criteria and “Open Questions”.

## Next Docs to Add (suggested)

- `docs/design/intent-data-model.md` — schemas for intents, queues, and action state.
- `docs/design/intent-networking.md` — client↔server contract, ordering, idempotency.
- `docs/adr/` entries for: resource reservation policy, determinism strategy, networking protocol shape.
