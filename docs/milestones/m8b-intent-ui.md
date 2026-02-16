# M8b Intent UI (Active Intent Visibility)

## Scope

- Goal: show per-entity active intent state in UI (EntityDetailPanel first, hover optional).
- Goal: be authoritative to server state and reconnect-safe.
- Non-goal: full intent history timeline or replay UI.

## Core Design Decision

- Use server as source of truth for "active intent per entity".
- Bootstrap from reconnect payload, then keep live with lifecycle SSE events.
- Do not infer intent state from movement/velocity.

## Data Contract Changes

1. Extend reconnect `active_intents` entries to include:
- `intent_kind` (`move|attack|build|collect`)
- Optional kind payload summary:
- `move_target` (x,y) when move
- `collect` marker when collect
2. Keep existing lifecycle events for transitions.
3. Add `intent_kind` to lifecycle SSE payload for ACCEPTED/IN_PROGRESS if easy; if not, client can map by `intent_id` from reconnect + local sends.

## Server Work

1. In engine intent tracking persistence, include intent kind and minimal payload summary.
2. In `/api/v2/reconnect`, return enriched active intent objects.
3. Keep lifecycle emission unchanged unless adding `intent_kind` is low-risk.
4. Ensure replace/cancel/finish transitions clear active state consistently.

## Client State Model

1. Add a small `activeIntentStore` keyed by `entity_id`.
2. On SSE open:
- hydrate from reconnect `active_intents`.
3. On lifecycle:
- `ACCEPTED/IN_PROGRESS`: set/update active intent for entity.
- `FINISHED/CANCELED/REJECTED`: clear active intent for entity.
4. On full snapshot reload:
- do not wipe active intent store blindly; rely on reconnect + lifecycle reconciliation.

## UI Surfaces (M8b)

1. EntityDetailPanel:
- show `Active intent: Collect/Move/Attack/Build`
- show summary (`target`, `started_tick`, `intent_id` short).
2. Hover tooltip (optional in M8b):
- one-line badge, e.g. `Collecting`, `Moving`.
3. Dev debug badge:
- selected entity active intent + last lifecycle transition.

## Observability and Testing

1. Add dev logs behind flag:
- reconnect hydrate count
- lifecycle transition application
- active intent set/clear events.
2. Add small unit tests for client reducer/store transitions.
3. Add one engine/integration test:
- `Collect` accepted then replaced by `Move` => UI model transitions `Collect -> Move`.
4. Manual checklist:
- initial load, reconnect, replace-active, cancel, entity despawn.

## Acceptance Criteria

1. Selecting any entity shows correct active intent within 1 lifecycle event.
2. Reconnect restores active intent display without page refresh hacks.
3. Replacing `Collect` with `Move` updates UI immediately and deterministically.
4. No false positives from velocity-based inference.

## Suggested Sequencing

1. Reconnect payload enrichment.
2. Client active intent store + lifecycle reducer.
3. EntityDetailPanel rendering.
4. Optional hover + debug badge.
5. Tests and manual verification script.
