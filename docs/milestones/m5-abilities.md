# M5: Abilities as First-Class Intents (Client Queue Still Applies)

## Overview

Generalize intents so that **abilities** are the primary concept: each intent is an invocation of an ability (e.g. `move`, `attack`, `build`) with a targeting schema. Model `Move` as `Ability(move)` with point targeting; add **cooldowns** and **targeting validation**. The client queue remains per-entity FIFO and policy-driven (REPLACE_ACTIVE / APPEND / CLEAR_THEN_APPEND); the server continues to execute at most one intent per entity at a time.

This milestone builds on M4 (data-driven entities and content hash): ability definitions live in the content pack and are versioned with the same hash; entity types can restrict which abilities an entity can use.

## Current state (pre–M5)

- Intents are **kind-based**: `IntentEnvelope` has a `oneof payload { move, attack, build }`. There is no explicit `ability_id`; the payload type implies the “ability.”
- **No cooldowns**: Move can be issued repeatedly with no server-side throttle.
- **Targeting**: Move uses `MoveToLocationIntent` (entity_id + Vec2 target). Validation is minimal (no range, no “can this entity use this ability”).
- **Client queue**: `IntentQueueManager` is move-only (`QueuedMoveIntent`, `handleMoveCommand`). The UI shows “Move” and waypoints but no ability names or “may fail” hints.
- **Lifecycle reasons**: Rejection reasons include `ENTITY_BUSY`, `INVALID_TARGET`, etc., but there are no ability-specific reasons (e.g. `COOLDOWN`, `ABILITY_NOT_ALLOWED`).

## Goals

- Generalize intents to **Ability**: model `Move` as `Ability(move)` with a targeting schema; add cooldowns.
- **Ability registry** (server-native): load ability definitions from content; validate targeting and cooldown before activating.
- **Client queue UI**: show ability name + target; surface “may fail” warnings (cooldown / resource) and server rejection reasons; let the client decide whether to keep or drop subsequent queued items on reject.

## Non-goals (deferred)

- Full resource/reservation system (M6): no escrow, cast time, or refund rules in M5.
- Server-side scripting (M7): abilities are data-driven only (cooldown, targeting, allowed entity types).
- Ability versioning / match-pinned library (M8): single content version per match for now.

---

## Deliverables

### 1. Schema / protobuf changes

**Ability identity on the wire**

- Add an explicit **ability_id** so the server and client agree on which ability is being invoked.
  - **Option A:** Add `string ability_id` to existing intent payloads (`MoveToLocationIntent`, etc.) and treat them as instances of that ability.
  - **Option B:** Introduce a generic `AbilityIntent` with `entity_id`, `ability_id`, and a `oneof target { Vec2 point; uint64 target_entity_id; }` (and optional params). Keep or deprecate `MoveToLocationIntent` by mapping it to `ability_id = "move"` with point target.
- Ensure the **reconnect handshake** and any **lifecycle** payloads that echo intent info include `ability_id` so the client can display “active ability” and reconcile queues.

**Lifecycle reasons**

- Extend `LifecycleReason` in `intent.proto` with ability-specific rejection reasons, e.g.:
  - `COOLDOWN`
  - `INVALID_ABILITY`
  - `ABILITY_NOT_ALLOWED_FOR_ENTITY`
  - (Optional for M5) `INSUFFICIENT_RESOURCES` as a placeholder for M6.
- Server uses these when validation fails; client surfaces them in the UI.

**Execution state (optional)**

- Add `string ability_id` to `ActionState` (or inside `MoveState` / a new `AbilityState`) so logs and replay can attribute execution to a specific ability.

**Files:** `packages/schemas/proto/intent.proto`; regenerate `packages/shared`, `services/rts-engine/src/pb/bitwars.rs`, and sim codegen.

---

### 2. Content: ability definitions

**Source of truth**

- Extend the content pack with an **abilities** map. Either:
  - Add an `abilities:` top-level key to `packages/content/entities.yaml`, or
  - Add a sibling file (e.g. `packages/content/abilities.yaml`) and load it alongside entity types.
- Each ability definition includes at least:
  - `id` (string, e.g. `"move"`)
  - `display_name` (for UI)
  - `cooldown_seconds` (float)
  - `targeting`: e.g. `type: "point" | "entity" | "none"`, optional `range`, and (if needed) allowed `entity_types` for the target.
  - Optional: `allowed_entity_types` (list of entity_type_ids that can use this ability); if absent, all types may use it.

**Example (YAML):**

```yaml
abilities:
  move:
    display_name: Move
    cooldown_seconds: 0.0   # or small value for demo
    targeting:
      type: point
  attack:
    display_name: Attack
    cooldown_seconds: 1.0
    targeting:
      type: entity
      range: 5.0
```

**Content hash**

- Include ability definitions in the canonical JSON used for the content hash so changes to cooldowns or targeting bump `content_version`. Client and server continue to use the same M4 pinning flow.

**Files:** `packages/content/entities.yaml` (or new `abilities.yaml`), `services/rts-engine/src/content.rs` (structs + loader), `apps/web/src/features/content/contentManager.ts` and content API types so the client can read abilities for UI.

---

### 3. Engine: ability registry, validation, cooldowns

**Ability registry**

- New module (e.g. `services/rts-engine/src/engine/ability.rs`) or extend `intent.rs`:
  - Load `AbilityDef`s from `ContentPack` into a registry (e.g. `HashMap<String, AbilityDef>`).
  - Expose something like: `validate_and_build_action(ability_id, intent_payload, entity, world, tick)` that:
    - Ensures the ability exists and (if defined) is allowed for the entity’s `entity_type_id`.
    - Validates target: for point targets, optional range; for entity targets, target exists and optionally in range / type checks.
    - Checks **cooldown**: maintain per-entity, per-ability last-use tick (e.g. `HashMap<(u64, String), u64>`); if `tick - last_used < cooldown_ticks`, return a validation failure reason.
  - On success, returns the `ActionState` (or equivalent) to be stored as the active intent; on failure, the ingestion path does not start the intent and emits a `LifecycleEvent` with the appropriate `REJECTED` reason.

**Cooldown tracking**

- When an intent is **ACCEPTED** (or when it **FINISHED**, depending on design), update the last-used tick for `(entity_id, ability_id)`.
- Cooldown is enforced at activation time: a new intent for the same ability on the same entity within the cooldown window is rejected with `COOLDOWN`.

**Integration with IntentManager**

- Before calling `IntentManager::try_activate`, resolve `ability_id` from the intent (for current Move payloads, use `"move"`).
- Run ability validation (targeting + cooldown). If validation fails, do not call `try_activate`; emit lifecycle event and return. If it passes, proceed with existing activation and action application (replace/append semantics unchanged).

**Files:** `services/rts-engine/src/engine/ability.rs` (or integrated into `intent.rs`), `services/rts-engine/src/content.rs`, `services/rts-engine/src/engine/mod.rs` (wire registry and validation into ingestion).

---

### 4. Client: generalize queue and send path to abilities

**Queue types**

- Introduce a generalized queue item type, e.g. `QueuedAbilityIntent`:
  - `abilityId: string`
  - `entityId: number`
  - `target`: `{ kind: "point"; x: number; y: number } | { kind: "entity"; targetEntityId: number } | { kind: "none" }`
  - `policy`, `clientCmdId`, `createdAt` (and any future fields).
- Keep backward compatibility: `handleMoveCommand(entityId, target, modifiers)` becomes a wrapper that enqueues (or sends) an item with `abilityId: "move"` and a point target.

**Send callback and API**

- Extend the payload sent to the server (e.g. `POST /api/v1/intent` or equivalent) to include `ability_id` and a structured `target` so the server can map to the new proto shape. Ensure the client sends the same policy and client_cmd_id / client_seq as today.

**Rejection handling**

- When a lifecycle event with state `REJECTED` arrives, use the new reason enum to decide:
  - Whether to remove only the rejected item from the queue and try the next, or
  - Clear the rest of the queue for that entity (e.g. if the ability is invalid for the entity or the situation changed).
- Document or expose this policy (e.g. “on COOLDOWN, drop this item and drain next”; “on ENTITY_BUSY, keep queue but don’t send until idle”) so the UI can reflect it and future milestones can tune behavior.

**Files:** `apps/web/src/features/intent-queue/intentQueueManager.ts` (types, `handleAbilityCommand`, send payload, lifecycle handling), and any callers (e.g. GameStage ground click) that currently call `handleMoveCommand` (can keep calling it as a thin wrapper).

---

### 5. Client UI: abilities in HUD and queue display

**Entity detail panel / actions**

- Replace or extend the hardcoded “Move” action with a list of **abilities** derived from content:
  - For the selected entity, look up its `entity_type_id` and from the content abilities map determine which abilities are allowed (e.g. by `allowed_entity_types` or “all if unspecified”).
  - Each action shows `display_name` and optional hotkey (e.g. Move = “M”). On click, call the generalized `handleAbilityCommand(entityId, abilityId, target, modifiers)` (for Move, target comes from the next ground click).
- If an ability is on cooldown, show it as disabled or show remaining time (if the client has enough state to compute it from last use + cooldown_seconds). M5 may only show “on cooldown” from server rejections unless the client tracks last-used from lifecycle.

**Queue UI**

- Wherever the queue is shown (e.g. IntentQueuePanel, waypoint list):
  - Display **ability name + target** (e.g. “Move → (120, 80)”) instead of assuming every item is “Move.” Use the content abilities map for display names.
  - Optionally show “may fail” warnings (e.g. “Cooldown” or “Invalid target”) based on client-side hints or previous rejections.

**Rejection reasons in UI**

- When the server rejects an intent, surface the reason (e.g. “Cooldown”, “Entity busy”, “Invalid target”) in the HUD, tooltip, or a small toast so the user understands why an ability did not start.

**Files:** `apps/web/src/features/hud/components/EntityDetailPanel.tsx`, `apps/web/src/features/hud/components/AvailableAction.tsx`, `apps/web/src/features/intent-queue/IntentQueuePanel.tsx`, and any waypoint/queue list components.

---

### 6. Reconnect and lifecycle payloads

**Reconnect handshake**

- Extend `GET /api/v2/reconnect` response so each entry in `active_intents` includes `ability_id` (and optionally a target summary). This lets the client:
  - Show which ability is currently active per entity.
  - Rebuild `ActiveIntentInfo` (or equivalent) with ability id for display and for correct queue drain behavior after reconnect.

**Lifecycle events**

- Lifecycle events already carry state and reason. Once the intent envelope (and any echoed intent info) includes `ability_id`, the client can match events to queued ability intents by `client_cmd_id` and show ability names alongside state changes and failure reasons.

**Files:** `apps/web/src/app/api/v2/reconnect/route.ts` (if it aggregates active intents from Redis or engine), engine code that writes active-intent metadata to Redis, and client `intentQueueManager.ts` (reconcile and active-intent type).

---

### 7. Tests and determinism

**Sim crate**

- Add a minimal ability registry and cooldown mechanism to the sim so that:
  - Move (or the single ability used in tests) can be modeled as an ability with optional cooldown.
  - Tests can assert that a second move issued immediately after the first is rejected or delayed when cooldown > 0.
- Add or extend tests for invalid targets (e.g. out-of-range) if targeting rules exist in the sim.

**Replay / golden tests**

- Add one or more replay scenarios (e.g. in `replay_test.rs`) that:
  - Issue sequences of ability intents (including Move-as-ability) with cooldown and replace semantics.
  - Assert golden world hash so that cooldown and preemption behavior are deterministic and regression-safe.

**Files:** `services/rts-engine/crates/sim/src/lib.rs` (or new ability module), `services/rts-engine/crates/sim/tests/*.rs`, `services/rts-engine/src/bin/replay_test.rs`.

---

### 8. Content hash and pinning

- Ensure the content pack’s canonical representation and hash include **ability definitions**. Any change to abilities (cooldowns, targeting, allowed entity types) must change `content_version` so clients can detect skew and fetch updated content (M4 flow). No new client or server pinning logic is required beyond including abilities in the hashed payload.

**Files:** `services/rts-engine/src/content.rs` (hash input), any script or process that builds the client content bundle.

---

## Acceptance criteria

- Move respects cooldown (when cooldown &gt; 0): a second move issued before cooldown expires is rejected with a clear reason; client can surface it.
- Invalid targets are rejected with clear reasons (e.g. out of range, wrong target type); reasons appear in lifecycle and can be shown in the UI.
- Replace semantics still preempt: REPLACE_ACTIVE cancels the current intent and starts the new one; cooldown does not block replace (only blocks starting a *new* instance of the same ability when the entity is already idle or the previous use was too recent, per design).
- Client queue UI shows ability name + target; server rejection reasons are surfaced in the UI.
- Determinism: replay of the same intent stream with the same content version yields the same world hash.

---

## Implementation order (suggested)

1. **Content + schema:** Add ability definitions to the content pack (YAML + loader structs). Add `ability_id` and new lifecycle reasons to proto; regenerate.
2. **Engine:** Implement ability registry, cooldown tracker, and validation; integrate with intent ingestion so invalid or cooldown-blocked intents emit REJECTED with the new reasons.
3. **Reconnect + lifecycle:** Extend reconnect handshake and any stored active-intent shape with `ability_id`; ensure lifecycle events carry reason and (where useful) ability_id.
4. **Client queue:** Generalize queue item and send payload to ability + target; add rejection handling and optional “drop rest of queue” policy.
5. **Client UI:** Entity detail panel and queue UI show ability names and targets; surface rejection reasons; wire Move to ability "move" and add any other abilities for demo.
6. **Tests:** Sim cooldown and targeting tests; replay golden tests for ability intents.
7. **Docs:** Update `milestones.md` and this file as needed; update README if new content or env vars are added.

---

## Open questions

- **Cooldown start:** Should cooldown start on ACCEPTED or on FINISHED? (Start on ACCEPTED is simpler and prevents queue drain from bypassing cooldown.)
- **Replace vs cooldown:** If the user issues REPLACE_ACTIVE with a new move while the previous move is still in progress, the current intent is canceled. Should the *cooldown* for the canceled ability still apply? (Likely yes, to avoid “cancel and re-issue” as a cooldown bypass.)
- **Ability list source for UI:** Should the client derive “available abilities” only from content (entity_type_id → allowed abilities), or also from server-supplied state (e.g. “this entity has these abilities” in snapshot)? M5 can start with content-only and no per-entity ability list in the proto.
- **Build / Attack in M5:** Are Attack and Build wired as abilities in M5 (with stubbed or minimal execution), or is the scope only Move-as-ability + cooldown + validation? Document the scope before implementation.
