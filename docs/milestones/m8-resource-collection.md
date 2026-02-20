# M8 Resource Collection (Dual Mode + Collect Intent Foundation)

**Status:** Planned  
**Milestone intent:** Build the resource collection foundation once, so both classic transport gathering and proximity-based collection use the same deterministic system, driven by an explicit maintained `Collect` intent.

---

## Goals

- Support two collection modes through shared data and shared simulation systems:
  - `transport`: gather at source, carry, deposit at refinery/processor.
  - `proximity`: collect while staying within an effective distance band around a source.
- Make collection **intent-gated**:
  - collectors do nothing autonomously when not in `Collect`,
  - collectors run autonomous collection behavior while `Collect` is active.
- Keep the model deterministic, replay-friendly, and content-driven.
- Enable future mechanics without redesign:
  - distance-based collection windows,
  - environmental hazard/damage near resources,
  - collector specialization by resource type.

## Non-Goals (M8)

- Full hazard/damage gameplay tuning (planned for later milestone).
- Rich UI/VFX polish for collection zones (debug/basic feedback is enough).
- Complex automation scripting; maintained behavior should remain engine-native.
- Long-lived stance trees beyond `Collect` (future expansion if needed).

---

## Core Design

## 1) Resource collection modes (data-driven)

Each collectible resource definition declares a `collection_mode`:

- `transport`
- `proximity`

This avoids splitting logic by hardcoded resource names.

## 2) Collector compatibility profile (data-driven)

Each collector-capable entity type declares what it can collect:

- `collects`: resource type ids it supports.
- optional per-resource modifiers (rate multiplier, capacity multiplier, etc.).

If collector/resource pair is not compatible, collection is rejected or no-op (deterministic).

## 3) Distance-band primitives (used now and later)

Use consistent distance parameters in resource interaction rules:

- `min_effective_distance`
- `max_effective_distance`

M8 uses them for proximity collection gating.  
Later milestones can reuse the same primitives for hazard rules.

## 4) Unified per-tick resource interaction system (while `Collect` active)

Server tick evaluates active collection behavior uniformly for entities with active `Collect`:

- Validate ownership and compatibility.
- Compute collector↔source distance.
- Apply mode-specific results:
  - `transport`: gather toward carry capacity; travel to drop-off; deposit; repeat.
  - `proximity`: apply collection while in effective band; no carry/deposit loop required.
- Apply ledger updates deterministically.
- If another intent replaces `Collect`, collection behavior stops immediately.

---

## M8 Deliverables

- Schema/content
  - Resource definitions include `collection_mode`.
  - Collector entity types include compatibility profile.
  - Proximity-capable resources declare effective distance band.
- Server
  - Add maintained `Collect` intent kind and lifecycle semantics.
  - Single resource interaction pipeline handling both `transport` and `proximity`.
  - Resource interaction runs only when entity is in active `Collect`.
  - Deterministic gather/deposit loop for `transport`.
  - Deterministic in-range collection for `proximity`.
  - Rejection/no-op reasons for incompatible collector/resource pairs.
  - Any other intent (`Move`, `Attack`, `Build`, etc.) replaces/interrupts collection behavior immediately.
- Client
  - Ability to issue `Collect` per selected compatible entity.
  - Basic state feedback (collecting, returning/depositing, out-of-range, incompatible, blocked, interrupted).
  - Keep HUD/ledger updates consistent with server.

---

## Acceptance Criteria

- Without active `Collect`, collectors do not gather.
- With active `Collect`, collectors execute deterministic mode-specific behavior.
- `transport` mode:
  - Worker gathers, carries, deposits, and repeats deterministically.
- `proximity` mode:
  - Collector gains resource only while inside configured effective band.
  - Too near or too far yields no collection (per configured min/max rules).
- Compatibility:
  - Wrong collector type cannot collect unsupported resource type.
- Interrupt semantics:
  - Replacing `Collect` with another intent immediately halts collection behavior.
- Replay:
  - Deterministic replay/hash checks pass for both modes.

---

## Test Plan (Minimum)

- Unit/sim tests:
  - Idle collector with no `Collect` does not gather.
  - `Collect` activation starts mode-specific behavior.
  - `transport` gather loop (single collector).
  - `proximity` in-band vs out-of-band gating.
  - Compatibility rejection/no-op.
  - Interrupt during active collection.
- Integration tests:
  - Two players collecting from same source with deterministic tie behavior.
  - Reconnect correctness for active collection intents.

---

## Forward Plan (Post-M8)

- Hazard extension (future milestone):
  - Add resource hazard profiles using the same distance-band model.
  - Example: too close to `solar`/`theta` applies periodic damage.
- Collector specialization expansion:
  - Additional collector classes for distinct energy/resource families.
- Maintained-intent expansion:
  - Reuse `Collect` maintained-action pattern for future “automated while active” loops.
- UX upgrades:
  - Range ring visualization for effective and hazard bands.
  - Better feedback for in-range/out-of-range/danger states.
