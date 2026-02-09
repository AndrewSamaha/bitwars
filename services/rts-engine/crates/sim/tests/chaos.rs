//! M2 Chaos Harness — synthetic reorder / drop / dupe tests.
//!
//! Each test defines a canonical intent stream, applies a controlled mutation
//! (reorder, drop, duplicate, or a combination), runs the result through the
//! sim `Engine`, and asserts the final world hash matches a golden value.
//!
//! The sim Engine includes in-memory dedupe by `client_cmd_id`, mirroring the
//! Redis-backed dedupe in the full rts-engine.  These tests prove that the
//! simulation logic is robust to the kinds of delivery anomalies that the
//! network layer might produce.
//!
//! Run: `cargo test -p sim chaos`

use sim::codec::to_sorted_json;
use sim::pb::intent_envelope::Payload;
use sim::pb::{Entity, MoveToLocationIntent, Vec2};
use sim::state::WorldState;
use sim::{Engine, IntentEnvelope, Reject};
use uuid::Uuid;

// ── Helpers ─────────────────────────────────────────────────────────────────

/// Create a deterministic UUIDv7-shaped 16-byte ID from a seed byte.
/// NOT a real UUIDv7 (timestamp is fake), but unique per seed and 16 bytes
/// so it passes length checks and is usable as a client_cmd_id for dedupe.
fn make_cmd_id(seed: u8) -> Vec<u8> {
    // Use a real UUIDv7 structure with the seed embedded for uniqueness
    let mut bytes = [0u8; 16];
    // Set version nibble to 7 (0b0111) at byte 6 high nibble
    bytes[6] = 0x70 | (seed & 0x0F);
    // Set variant bits at byte 8 (0b10xx_xxxx)
    bytes[8] = 0x80 | seed;
    // Fill remaining bytes with seed for uniqueness
    for i in 0..6 {
        bytes[i] = seed.wrapping_add(i as u8);
    }
    for i in 9..16 {
        bytes[i] = seed.wrapping_mul(3).wrapping_add(i as u8);
    }
    bytes.to_vec()
}

fn make_entity(id: u64, x: f32, y: f32) -> Entity {
    Entity {
        id,
        entity_type_id: String::new(),
        pos: Some(Vec2 { x, y }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
    }
}

fn make_move(
    entity_id: u64,
    target_x: f32,
    target_y: f32,
    cmd_id: Vec<u8>,
) -> IntentEnvelope {
    IntentEnvelope {
        client_cmd_id: cmd_id,
        intent_id: Uuid::now_v7().into_bytes().to_vec(),
        player_id: "chaos_test".to_string(),
        client_seq: 0,
        server_tick: 0,
        protocol_version: 1,
        policy: 0, // REPLACE_ACTIVE
        payload: Some(Payload::Move(MoveToLocationIntent {
            entity_id,
            target: Some(Vec2 {
                x: target_x,
                y: target_y,
            }),
            client_cmd_id: String::new(),
            player_id: String::new(),
        })),
    }
}

/// Run a sequence of intents through a fresh engine and return the final
/// world hash (xxh3 of sorted JSON).
fn run_intents(
    initial: WorldState,
    intents: &[IntentEnvelope],
    ticks_after: u64,
) -> (u64, String, Vec<Result<(), Reject>>) {
    let mut engine = Engine::from_snapshot(initial);
    let mut results = Vec::new();

    for env in intents {
        results.push(engine.accept(env));
    }

    for _ in 0..ticks_after {
        engine.tick();
        engine.state.tick += 1;
    }

    let json = to_sorted_json(&engine.state).unwrap();
    let hash = xxhash_rust::xxh3::xxh3_64(json.as_bytes());
    (hash, json, results)
}

// ── Scenario: two independent entities, one move each ───────────────────────
//
// Canonical stream: [move entity 1 → (10,5), move entity 2 → (20,15)]
// Both are independent (different entities), so the final state should be the
// same regardless of delivery order.

fn two_entity_world() -> WorldState {
    WorldState::new(
        0,
        vec![
            make_entity(1, 0.0, 0.0),
            make_entity(2, 5.0, 5.0),
        ],
    )
}

fn two_entity_intents() -> (IntentEnvelope, IntentEnvelope) {
    let a = make_move(1, 10.0, 5.0, make_cmd_id(1));
    let b = make_move(2, 20.0, 15.0, make_cmd_id(2));
    (a, b)
}

// ── Tests ───────────────────────────────────────────────────────────────────

/// Baseline: canonical order, no mutations.  Establishes the golden hash that
/// all chaos variants must match.
#[test]
fn chaos_baseline_two_entities() {
    let (a, b) = two_entity_intents();
    let (hash, _json, results) = run_intents(two_entity_world(), &[a, b], 5);

    // Both should succeed
    assert!(results[0].is_ok());
    assert!(results[1].is_ok());

    assert_eq!(hash, GOLDEN_TWO_ENTITY, "baseline hash mismatch — regenerate golden");
}

/// Reorder: deliver [B, A] instead of [A, B] for independent entities.
/// Since the intents target different entities, the final world state must
/// be identical regardless of delivery order.
#[test]
fn chaos_reorder_independent_entities() {
    let (a, b) = two_entity_intents();
    // Reversed order
    let (hash, _json, results) = run_intents(two_entity_world(), &[b, a], 5);

    assert!(results[0].is_ok());
    assert!(results[1].is_ok());

    assert_eq!(
        hash, GOLDEN_TWO_ENTITY,
        "reordered independent intents must produce identical world hash"
    );
}

/// Duplicate: deliver intent A twice.  The second should be rejected as
/// Duplicate and the world state should match the single-delivery baseline.
#[test]
fn chaos_dupe_same_envelope() {
    let (a, b) = two_entity_intents();
    let a_clone = a.clone();
    let (hash, _json, results) = run_intents(two_entity_world(), &[a, a_clone, b], 5);

    assert!(results[0].is_ok(), "first delivery should succeed");
    assert!(results[1].is_err(), "duplicate should be rejected");
    assert!(results[2].is_ok(), "unrelated intent should succeed");

    // Verify the rejection is specifically a Duplicate
    match &results[1] {
        Err(Reject::Duplicate) => {}
        other => panic!("expected Reject::Duplicate, got {:?}", other),
    }

    assert_eq!(
        hash, GOLDEN_TWO_ENTITY,
        "duplicate intent must not change final world hash"
    );
}

/// Duplicate + reorder: deliver [B, A, A].  A is duped and B arrives first.
#[test]
fn chaos_dupe_and_reorder() {
    let (a, b) = two_entity_intents();
    let a_clone = a.clone();
    let (hash, _json, results) = run_intents(two_entity_world(), &[b, a, a_clone], 5);

    assert!(results[0].is_ok(), "B should succeed");
    assert!(results[1].is_ok(), "first A should succeed");
    assert!(results[2].is_err(), "second A should be duplicate");

    assert_eq!(
        hash, GOLDEN_TWO_ENTITY,
        "dupe + reorder must produce identical world hash"
    );
}

/// Drop: intent for entity 2 is lost.  Entity 1 moves, entity 2 stays put.
#[test]
fn chaos_drop_one_intent() {
    let (a, _b) = two_entity_intents();
    // Only deliver A; B is "dropped"
    let (hash, _json, results) = run_intents(two_entity_world(), &[a], 5);

    assert!(results[0].is_ok());

    assert_eq!(
        hash, GOLDEN_DROP_ENTITY2,
        "drop scenario: entity 2 should remain at origin"
    );
}

// ── Scenario: same entity, two competing moves (REPLACE_ACTIVE) ────────────
//
// Two moves for the same entity. With REPLACE_ACTIVE policy, the last-applied
// wins.  The sim engine's apply_move_intent teleports the entity to the target,
// so the final position is determined by which intent is applied last.

fn single_entity_world() -> WorldState {
    WorldState::new(0, vec![make_entity(1, 0.0, 0.0)])
}

/// Canonical order: move to (10,5) then to (20,15).  Last wins → (20,15).
#[test]
fn chaos_same_entity_canonical_order() {
    let a = make_move(1, 10.0, 5.0, make_cmd_id(10));
    let b = make_move(1, 20.0, 15.0, make_cmd_id(11));
    let (hash, _json, results) = run_intents(single_entity_world(), &[a, b], 5);

    assert!(results[0].is_ok());
    assert!(results[1].is_ok());

    assert_eq!(hash, GOLDEN_SAME_ENTITY_LAST_B, "canonical: last intent (B) wins");
}

/// Reorder same entity: [B, A].  Last applied is A → entity at (10,5).
#[test]
fn chaos_same_entity_reordered() {
    let a = make_move(1, 10.0, 5.0, make_cmd_id(10));
    let b = make_move(1, 20.0, 15.0, make_cmd_id(11));
    let (hash, _json, results) = run_intents(single_entity_world(), &[b, a], 5);

    assert!(results[0].is_ok());
    assert!(results[1].is_ok());

    assert_eq!(hash, GOLDEN_SAME_ENTITY_LAST_A, "reordered: last intent (A) wins");
}

/// Same entity, dupe: [A, B, A].  Second A is rejected; B is last valid → (20,15).
#[test]
fn chaos_same_entity_dupe() {
    let a = make_move(1, 10.0, 5.0, make_cmd_id(10));
    let b = make_move(1, 20.0, 15.0, make_cmd_id(11));
    let a_clone = a.clone();
    let (hash, _json, results) = run_intents(single_entity_world(), &[a, b, a_clone], 5);

    assert!(results[0].is_ok());
    assert!(results[1].is_ok());
    assert!(results[2].is_err(), "duplicate A should be rejected");

    assert_eq!(
        hash, GOLDEN_SAME_ENTITY_LAST_B,
        "dupe A after B should not change result; B still wins"
    );
}

// ── Scenario: triple dupe barrage ──────────────────────────────────────────
//
// Deliver the same intent 5 times.  Only the first should apply.

#[test]
fn chaos_triple_dupe_barrage() {
    let a = make_move(1, 42.0, 99.0, make_cmd_id(50));
    let intents: Vec<_> = (0..5).map(|_| a.clone()).collect();
    let (hash, _json, results) = run_intents(single_entity_world(), &intents, 5);

    assert!(results[0].is_ok(), "first should succeed");
    for (i, r) in results.iter().enumerate().skip(1) {
        assert!(r.is_err(), "delivery #{} should be rejected as duplicate", i);
    }

    assert_eq!(hash, GOLDEN_DUPE_BARRAGE, "barrage of dupes: only first apply counts");
}

// ── Scenario: combined chaos — reorder + dupe + drop across 3 entities ─────

fn three_entity_world() -> WorldState {
    WorldState::new(
        0,
        vec![
            make_entity(1, 0.0, 0.0),
            make_entity(2, 10.0, 10.0),
            make_entity(3, 20.0, 20.0),
        ],
    )
}

/// Combined: 3 intents (one per entity). Deliver as [C, A, B, A, C] — reorder
/// + dupe A and C, drop nothing.  Final state should match canonical [A, B, C].
#[test]
fn chaos_combined_reorder_dupe() {
    let a = make_move(1, 5.0, 5.0, make_cmd_id(30));
    let b = make_move(2, 15.0, 15.0, make_cmd_id(31));
    let c = make_move(3, 25.0, 25.0, make_cmd_id(32));

    // Canonical run
    let (canonical_hash, _, _) =
        run_intents(three_entity_world(), &[a.clone(), b.clone(), c.clone()], 5);

    // Chaos run: [C, A, B, A, C]
    let (chaos_hash, _, results) = run_intents(
        three_entity_world(),
        &[c.clone(), a.clone(), b.clone(), a.clone(), c.clone()],
        5,
    );

    assert!(results[0].is_ok(), "C first");
    assert!(results[1].is_ok(), "A first");
    assert!(results[2].is_ok(), "B first");
    assert!(results[3].is_err(), "A dupe");
    assert!(results[4].is_err(), "C dupe");

    assert_eq!(
        chaos_hash, canonical_hash,
        "combined chaos (reorder + dupe) must match canonical hash"
    );
    assert_eq!(
        canonical_hash, GOLDEN_THREE_ENTITY_ALL,
        "three-entity canonical hash mismatch — regenerate golden"
    );
}

/// Combined: deliver only [A, C] — B is dropped.  Entity 2 stays at origin.
#[test]
fn chaos_combined_drop_middle() {
    let a = make_move(1, 5.0, 5.0, make_cmd_id(30));
    let c = make_move(3, 25.0, 25.0, make_cmd_id(32));

    let (hash, _json, results) = run_intents(three_entity_world(), &[a, c], 5);

    assert!(results[0].is_ok());
    assert!(results[1].is_ok());

    assert_eq!(
        hash, GOLDEN_THREE_ENTITY_DROP_B,
        "drop B: entity 2 stays at origin"
    );
}

// ── Golden hashes ──────────────────────────────────────────────────────────
// Generated by running each scenario and capturing the xxh3 hash.
// To regenerate: change the constant to 0 and run the test — the assertion
// message will print the actual hash.

const GOLDEN_TWO_ENTITY: u64 = 1504965851243601467;
const GOLDEN_DROP_ENTITY2: u64 = 15728293238854734021;
const GOLDEN_SAME_ENTITY_LAST_B: u64 = 16074229635097407750;
const GOLDEN_SAME_ENTITY_LAST_A: u64 = 585317416330256995;
const GOLDEN_DUPE_BARRAGE: u64 = 5602212584383532031;
const GOLDEN_THREE_ENTITY_ALL: u64 = 9798817850985035973;
const GOLDEN_THREE_ENTITY_DROP_B: u64 = 16578209666156329052;
