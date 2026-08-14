# 004 - Render Effects from Authoritative State

Date: 2026-04-05
Status: Accepted

## Context

- The game currently renders units as static Pixi sprites on the client.
- We wanted richer gameplay feedback for resource collection without requiring per-unit or per-team sprite animation sheets.
- The first concrete case was the solar collector: show a visible collection effect only while the server says the unit is actively collecting.
- We expect similar needs for other gameplay feedback:
  - transport mining
  - healing/repair beams
  - attack tracers
  - impact bursts / hit flashes
- We want a pattern that:
  - keeps gameplay authority on the server,
  - avoids hardcoding one-off VFX logic into the main stage renderer,
  - allows procedural effects to be reused across unit types and skins.

## Decision

- Introduce a small client-side render-effects layer that projects authoritative or authority-derived gameplay state into effect descriptors, then reconciles Pixi graphics from those descriptors.

### Pattern

- **Gameplay state remains authoritative on the server.**
  - Examples: `collector_state.activity`, active intent kind, future combat state/events.
- **The client resolves render-effect descriptors from that state.**
  - Example descriptor shape:
    - effect kind (`particle_flow`, `beam`, `ring_pulse`, `impact_burst`)
    - effect key (stable per entity/container)
    - source and target world positions or entity ids
    - visual parameters (colors, size, timing multipliers)
- **The renderer reconciles effect descriptors into Pixi children.**
  - Add/update/remove `Graphics` children under the entity container based on effect keys.

### Current implementation

- `apps/web/src/features/pixijs/effects/renderEffects.ts`
  - resolves the current solar collector effect from entity state,
  - resolves the current mineral gathering effect from entity state,
  - resolves directional radiation shedding from an authoritative health decrease and a nearby radiation emitter,
  - draws collection effects as `particle_flow` and radiation damage as `radiation_shed`,
  - reconciles effect graphics by stable key.
- `apps/web/src/features/pixijs/components/GameStage.tsx`
  - remains responsible for base sprite rendering and entity container lifecycle,
  - delegates per-entity effect reconciliation to the render-effects layer.
- `apps/web/src/features/gamestate/components/GameStateStreamBridge.tsx`
  - hydrates live `collector_state` into the client ECS world via polling for all live entities,
  - makes collection-driven effects available to the renderer even when that state is not present in streamed deltas.
  - records a presentation-only timestamp when a streamed health value decreases.

### Authority rule

- The render-effects layer may use:
  - authoritative fields already streamed into the client world,
  - authority-adjacent client projections derived from authoritative state.
- It must not invent gameplay state or drive simulation.
- If an effect depends on a gameplay endpoint that the client cannot reliably infer, the long-term fix is to expose that endpoint from the engine rather than increasing client guesswork.

## Consequences

- **Positive:** `GameStage` stays focused on sprite/container projection instead of accumulating gameplay-specific VFX branches.
- **Positive:** Effects become reusable. New interaction types can often reuse an existing effect kind with a different resolver.
- **Positive:** Procedural overlays work across teams and unit art without needing bespoke sprite animations.
- **Positive:** This creates a clean seam for future authoritative source/target wiring from the engine.
- **Negative:** There is now an extra client-side projection layer to maintain.
- **Negative:** Some effects may initially rely on inferred endpoints when the authoritative stream does not yet provide exact source/target data.

## Alternatives Considered

- **Keep effect logic inside `GameStage.tsx`**
  - Pros: fastest for one-off experiments.
  - Cons: does not scale; renderer becomes a pile of special cases.
- **Ship animated sprites for each interaction**
  - Pros: deterministic visuals, easier to art-direct per unit.
  - Cons: expensive to produce and maintain across teams/unit variants; poor fit for reusable directional interactions.
- **Build a fully generic VFX engine immediately**
  - Pros: maximum abstraction.
  - Cons: premature; likely to overfit before we have enough effect types.

## Rollout Guidance

- Add new effects by following this order:
  1. Define the authoritative state or event that should trigger the effect.
  2. Add a resolver that maps that state to a small render-effect descriptor.
  3. Reuse an existing effect kind where possible; add a new kind only when the visual behavior is genuinely different.
  4. If endpoint resolution is unreliable on the client, prefer exposing it from the engine.

## References

- [renderEffects.ts](/home/andrew/Development/bitwars/apps/web/src/features/pixijs/effects/renderEffects.ts)
- [GameStage.tsx](/home/andrew/Development/bitwars/apps/web/src/features/pixijs/components/GameStage.tsx)
- [GameStateStreamBridge.tsx](/home/andrew/Development/bitwars/apps/web/src/features/gamestate/components/GameStateStreamBridge.tsx)
