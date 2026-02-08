# Chaos Harness (M2) & Movement Tests (M3)

## Overview

The chaos harness is a suite of deterministic tests in the `sim` crate that prove the simulation engine correctly handles the kinds of delivery anomalies a real network can produce: **reordered**, **duplicated**, and **dropped** intent envelopes.  Each test feeds a mutated intent stream into `sim::Engine`, then asserts the final world state hash matches a pre-computed golden value.

These tests satisfy the M2 acceptance criterion: *"Synthetic tests pass for reorder/dupe scenarios; world hashes match golden results."*

## Location

```
services/rts-engine/crates/sim/tests/chaos.rs      # M2: reorder/dupe/drop scenarios + golden hashes
services/rts-engine/crates/sim/tests/movement.rs   # M3: arrival, oscillation, mid-move preemption + golden hashes
services/rts-engine/crates/sim/tests/determinism.rs # M0.1: deterministic replay + idempotency
services/rts-engine/crates/sim/src/lib.rs           # sim::Engine (dedupe + motion targets)
services/rts-engine/crates/sim/src/systems.rs       # tick_movement (steering + overshoot clamping)
```

## Running

```bash
# All sim tests (chaos + determinism + movement)
cargo test -p sim

# Only chaos tests
cargo test -p sim chaos

# Only movement polish tests
cargo test -p sim movement
```

No Redis, no network, no running engine required.  The sim crate is a pure in-memory simulation.

## What the tests prove

### Idempotency (dedupe)

`sim::Engine` tracks every `client_cmd_id` it has seen.  If the same envelope is delivered again, the engine returns `Err(Reject::Duplicate)` and the world state is unchanged.  This mirrors the Redis-backed dedupe store in the full `rts-engine`.

| Test | Mutation | Assertion |
|---|---|---|
| `chaos_dupe_same_envelope` | Deliver A twice, then B | Second A is `Reject::Duplicate`; hash matches baseline |
| `chaos_triple_dupe_barrage` | Deliver A five times | Only first succeeds; hash matches single-delivery |
| `chaos_same_entity_dupe` | Deliver [A, B, A] to same entity | Second A rejected; B is last valid → B wins |

### Order tolerance

For **independent entities** (different entity IDs), delivery order does not affect the final world state.

| Test | Mutation | Assertion |
|---|---|---|
| `chaos_reorder_independent_entities` | Deliver [B, A] instead of [A, B] | Hash identical to canonical [A, B] |
| `chaos_dupe_and_reorder` | Deliver [B, A, A] | Hash identical to canonical [A, B] |

For the **same entity**, the sim engine applies `REPLACE_ACTIVE` semantics — the last-applied intent wins.  Reordering changes which intent is "last" and therefore changes the outcome deterministically.

| Test | Mutation | Assertion |
|---|---|---|
| `chaos_same_entity_canonical_order` | [A, B] → B wins | Hash matches `GOLDEN_SAME_ENTITY_LAST_B` |
| `chaos_same_entity_reordered` | [B, A] → A wins | Hash matches `GOLDEN_SAME_ENTITY_LAST_A` |

### Graceful degradation (drop)

When intents are lost, the affected entities simply remain at their original position.

| Test | Mutation | Assertion |
|---|---|---|
| `chaos_drop_one_intent` | Only deliver A; B is dropped | Entity 2 stays at origin; hash matches drop golden |
| `chaos_combined_drop_middle` | Deliver [A, C]; B is dropped | Entity 2 stays at origin |

### Combined chaos

| Test | Mutation | Assertion |
|---|---|---|
| `chaos_combined_reorder_dupe` | [C, A, B, A, C] — reorder + dupe | Hash identical to canonical [A, B, C] |

## M3 movement tests

The movement test suite (`movement.rs`) verifies the M3 movement polish deliverables using the same golden-hash technique as the chaos harness.

| Test | What it proves |
|---|---|
| `arrival_within_stop_radius` | Entity reaches stop boundary, velocity zeroes, position stable for 10+ ticks |
| `no_oscillation_near_boundary` | Overshoot clamp snaps entity to boundary on first tick when `step ≥ effective_dist` |
| `immediate_arrival_at_target` | Entity already at target finishes immediately; motion target cleaned up |
| `replace_active_mid_move_no_residual` | REPLACE_ACTIVE zeroes velocity instantly; new direction dominates next tick |
| `stationary_entity_no_drift` | Entity with no intent stays put for 100 ticks |
| `two_entities_same_target` | Both arrive at stop boundary independently; both stabilise |

## How golden hashes work

Each test computes the final world state as sorted JSON (via `to_sorted_json`), then hashes it with xxh3-64.  The hash is compared against a constant at the bottom of `chaos.rs` and `movement.rs`:

```rust
const GOLDEN_TWO_ENTITY: u64 = 1504965851243601467;
const GOLDEN_DROP_ENTITY2: u64 = 15728293238854734021;
// ...
```

The sorted JSON representation is deterministic: entities are sorted by ID, and object keys are sorted alphabetically.  This means two runs with the same input always produce the same hash, regardless of HashMap iteration order or similar non-determinism.

## When golden hashes need to be regenerated

The hashes will break (tests fail) if any of the following change:

1. **Entity state structure** — Adding, removing, or renaming fields in `SerializableEntity` or `SerializableVec2` (`crates/sim/src/state.rs`) changes the JSON output.

2. **Intent application logic** — Changes to `apply_move_intent` in `crates/sim/src/intent.rs` (e.g., switching from teleport to velocity-based movement) change the resulting entity positions.

3. **Movement / physics systems** — Changes to the `movement()` function in `crates/sim/src/systems.rs` (friction constant, assumed TPS, integration formula) change final positions for entities with non-zero velocity.

4. **JSON serialization / sorting** — Changes to `to_sorted_json` in `crates/sim/src/codec.rs` (key ordering, float formatting, entity sort order) change the canonical representation.

5. **Hash function** — Upgrading `xxhash-rust` to a version with different output (unlikely for a stable algorithm, but possible on major version bumps).

6. **Test scenario parameters** — Changes to initial entity positions, move targets, tick counts, or the `make_cmd_id` helper in `chaos.rs` itself.

The hashes will **not** break for:

- Changes to the rts-engine (Redis, networking, lifecycle events, telemetry)
- Changes to the client (Next.js, IntentQueueManager, SSE bridge)
- Adding new fields to `IntentEnvelope` in the protobuf schema (additive; sim ignores unknown fields)
- Adding new test scenarios (each gets its own golden hash)

**A failing golden hash is a feature, not a bug** — it means the deterministic simulation output changed, and you need to verify the change is intentional before updating the hash.

## How to regenerate golden hashes

1. Make your change to the sim crate.

2. Run the chaos tests — they will fail with the old hashes:

   ```bash
   cargo test -p sim chaos
   ```

3. Each failing assertion prints the actual hash:

   ```
   assertion `left == right` failed: baseline hash mismatch — regenerate golden
     left: 12345678901234567890
    right: 7768459978369806801
   ```

4. Verify the change is intentional (review the diff to the sim crate).

5. Update the `GOLDEN_*` constants in `chaos.rs` and/or `movement.rs` with the new hash values from the test output.

6. Re-run and confirm all tests pass:

   ```bash
   cargo test -p sim
   ```

**Tip:** To regenerate a single hash, set its constant to `0` and run the test.  The assertion message will show the actual hash.

## Relationship to the full rts-engine

The chaos harness tests the `sim::Engine`, which is a pure in-memory simulation with no Redis or network dependencies.  The full `rts-engine` binary adds:

- Redis-backed dedupe store (keyed by `(player_id, client_cmd_id)` with TTL)
- Per-player `client_seq` validation (rejects out-of-order intents)
- Protocol version checking
- Tick-bounded ingress (backpressure)

The chaos harness proves the **simulation logic** is robust to delivery anomalies.  The Redis dedupe, seq validation, and reconnect handshake are the **production mechanisms** that prevent these anomalies from reaching the engine in the first place.  Together they provide defense in depth: even if the network layer has gaps, the engine produces a correct, deterministic result.
