//! M3 Movement Polish tests — arrival stabilisation, overshoot clamping,
//! mid-move preemption, and stationary-entity drift prevention.
//!
//! Run: `cargo test -p sim movement`

use sim::codec::to_sorted_json;
use sim::pb::intent_envelope::Payload;
use sim::pb::{Entity, MoveToLocationIntent, Vec2};
use sim::state::WorldState;
use sim::{Engine, IntentEnvelope, DEFAULT_STOP_RADIUS};

// ── Helpers ─────────────────────────────────────────────────────────────────

fn make_cmd_id(seed: u8) -> Vec<u8> {
    let mut bytes = [0u8; 16];
    bytes[6] = 0x70 | (seed & 0x0F);
    bytes[8] = 0x80 | seed;
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
        pos: Some(Vec2 { x, y }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
    }
}

fn make_move(entity_id: u64, target_x: f32, target_y: f32, cmd_id: Vec<u8>) -> IntentEnvelope {
    IntentEnvelope {
        client_cmd_id: cmd_id,
        intent_id: uuid::Uuid::now_v7().into_bytes().to_vec(),
        player_id: "movement_test".to_string(),
        client_seq: 0,
        server_tick: 0,
        protocol_version: 1,
        policy: 0,
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

fn world_hash(engine: &Engine) -> u64 {
    let json = to_sorted_json(&engine.state).unwrap();
    xxhash_rust::xxh3::xxh3_64(json.as_bytes())
}

fn run_ticks(engine: &mut Engine, n: u64) -> Vec<Vec<u64>> {
    let mut all_finished = Vec::new();
    for _ in 0..n {
        let finished = engine.tick();
        engine.state.tick += 1;
        all_finished.push(finished);
    }
    all_finished
}

// ── Tests ───────────────────────────────────────────────────────────────────

/// Entity moves from (0,0) toward (10,0).
/// speed=90, dt=1/60 → step=1.5 units/tick.
/// distance=10, effective=10−0.75=9.25 → arrives in ceil(9.25/1.5)=7 ticks.
/// After arrival: velocity is zero, position is at the stop boundary,
/// and no further movement occurs for subsequent ticks.
#[test]
fn arrival_within_stop_radius() {
    let world = WorldState::new(0, vec![make_entity(1, 0.0, 0.0)]);
    let mut engine = Engine::from_snapshot(world);

    engine.accept(&make_move(1, 10.0, 0.0, make_cmd_id(1))).unwrap();

    let mut arrival_tick = None;
    for tick in 0..20 {
        let finished = engine.tick();
        engine.state.tick += 1;
        if finished.contains(&1) {
            arrival_tick = Some(tick);
            break;
        }
    }

    let tick = arrival_tick.expect("entity should arrive");
    assert!(tick <= 7, "should arrive within 7 ticks, arrived at tick {}", tick);

    let entity = engine.state.find_entity(1).unwrap();
    let pos = entity.pos.as_ref().unwrap();
    let vel = entity.vel.as_ref().unwrap();

    // Velocity is zero after arrival.
    assert_eq!(vel.x, 0.0, "x velocity should be zero after arrival");
    assert_eq!(vel.y, 0.0, "y velocity should be zero after arrival");

    // Position is at the stop boundary (distance from target ≈ stop_radius).
    let dist = ((10.0 - pos.x).powi(2) + pos.y.powi(2)).sqrt();
    assert!(
        (dist - DEFAULT_STOP_RADIUS).abs() < 0.01,
        "entity should be at stop boundary; distance from target = {dist}"
    );

    // No further movement for 10 more ticks.
    let snapshot_x = pos.x;
    let snapshot_y = pos.y;
    for _ in 0..10 {
        let finished = engine.tick();
        engine.state.tick += 1;
        assert!(finished.is_empty(), "no entities should finish after arrival");
    }
    let entity = engine.state.find_entity(1).unwrap();
    let pos = entity.pos.as_ref().unwrap();
    assert_eq!(pos.x, snapshot_x, "x position should not change after arrival");
    assert_eq!(pos.y, snapshot_y, "y position should not change after arrival");

    assert_eq!(world_hash(&engine), GOLDEN_ARRIVAL, "arrival golden hash");
}

/// Entity starts very close to the stop boundary (distance − stop_radius < step).
/// Overshoot clamping should snap it to the boundary on the first tick.
/// Subsequent ticks must produce zero movement (no oscillation).
#[test]
fn no_oscillation_near_boundary() {
    // Entity at (9.5, 0), target (10, 0). distance=0.5, effective=0.5−0.75<0 → already in radius.
    // Actually distance=0.5 < stop_radius=0.75, so it should arrive tick 0.
    // Use a case where effective > 0 but < step:
    // Entity at (8.0, 0), target (10, 0). distance=2.0, effective=1.25. step=1.5 ≥ 1.25 → snap.
    let world = WorldState::new(0, vec![make_entity(1, 8.0, 0.0)]);
    let mut engine = Engine::from_snapshot(world);

    engine.accept(&make_move(1, 10.0, 0.0, make_cmd_id(1))).unwrap();

    let finished = engine.tick();
    engine.state.tick += 1;
    assert!(
        finished.contains(&1),
        "entity should arrive on first tick (overshoot clamp)"
    );

    let entity = engine.state.find_entity(1).unwrap();
    let pos = entity.pos.as_ref().unwrap();
    let vel = entity.vel.as_ref().unwrap();
    assert_eq!(vel.x, 0.0);
    assert_eq!(vel.y, 0.0);

    let snapshot_x = pos.x;
    let snapshot_y = pos.y;

    // 20 more ticks — no movement at all.
    for _ in 0..20 {
        let finished = engine.tick();
        engine.state.tick += 1;
        assert!(finished.is_empty());
    }
    let entity = engine.state.find_entity(1).unwrap();
    let pos = entity.pos.as_ref().unwrap();
    assert_eq!(pos.x, snapshot_x, "no oscillation: x unchanged");
    assert_eq!(pos.y, snapshot_y, "no oscillation: y unchanged");

    assert_eq!(world_hash(&engine), GOLDEN_NO_OSCILLATION, "no-oscillation golden hash");
}

/// Entity already at the target — should arrive immediately on first tick.
#[test]
fn immediate_arrival_at_target() {
    let world = WorldState::new(0, vec![make_entity(1, 10.0, 5.0)]);
    let mut engine = Engine::from_snapshot(world);

    engine.accept(&make_move(1, 10.0, 5.0, make_cmd_id(1))).unwrap();

    let finished = engine.tick();
    engine.state.tick += 1;
    assert!(finished.contains(&1), "entity at target should finish immediately");

    let entity = engine.state.find_entity(1).unwrap();
    let vel = entity.vel.as_ref().unwrap();
    assert_eq!(vel.x, 0.0);
    assert_eq!(vel.y, 0.0);

    // Motion target should be removed.
    assert!(engine.motion_targets().is_empty(), "no active targets after arrival");
}

/// REPLACE_ACTIVE mid-move: entity is moving east, replacement redirects north.
/// After replacement, velocity should point north with no residual x-component.
#[test]
fn replace_active_mid_move_no_residual() {
    let world = WorldState::new(0, vec![make_entity(1, 0.0, 0.0)]);
    let mut engine = Engine::from_snapshot(world);

    // Start moving east
    engine.accept(&make_move(1, 100.0, 0.0, make_cmd_id(1))).unwrap();

    // Move 3 ticks east
    run_ticks(&mut engine, 3);

    let entity = engine.state.find_entity(1).unwrap();
    let pos_x_after_3 = entity.pos.as_ref().unwrap().x;
    assert!(pos_x_after_3 > 0.0, "entity should have moved east");

    // Replace with northward move
    engine.accept(&make_move(1, 0.0, 100.0, make_cmd_id(2))).unwrap();

    // Velocity should be zeroed immediately on replacement (before next tick).
    let entity = engine.state.find_entity(1).unwrap();
    let vel = entity.vel.as_ref().unwrap();
    assert_eq!(vel.x, 0.0, "velocity zeroed on replacement");
    assert_eq!(vel.y, 0.0, "velocity zeroed on replacement");

    // After one tick, velocity should point toward (0, 100) — predominantly +y.
    engine.tick();
    engine.state.tick += 1;

    let entity = engine.state.find_entity(1).unwrap();
    let vel = entity.vel.as_ref().unwrap();
    assert!(vel.y > 0.0, "y velocity should be positive (moving north)");
    // x velocity can be slightly negative (entity east of target) but should
    // be small compared to y velocity.
    assert!(
        vel.y.abs() > vel.x.abs(),
        "y component should dominate: vx={}, vy={}",
        vel.x,
        vel.y
    );

    // Run to stable state and check golden hash.
    run_ticks(&mut engine, 50);
    assert_eq!(world_hash(&engine), GOLDEN_REPLACE_MID_MOVE, "replace-mid-move golden hash");
}

/// Stationary entity with no intents should not drift over many ticks.
#[test]
fn stationary_entity_no_drift() {
    let world = WorldState::new(0, vec![make_entity(1, 5.0, 5.0)]);
    let mut engine = Engine::from_snapshot(world);

    // 100 ticks, no intents.
    for _ in 0..100 {
        let finished = engine.tick();
        engine.state.tick += 1;
        assert!(finished.is_empty());
    }

    let entity = engine.state.find_entity(1).unwrap();
    let pos = entity.pos.as_ref().unwrap();
    let vel = entity.vel.as_ref().unwrap();

    assert_eq!(pos.x, 5.0, "x should not drift");
    assert_eq!(pos.y, 5.0, "y should not drift");
    assert_eq!(vel.x, 0.0, "vx should remain zero");
    assert_eq!(vel.y, 0.0, "vy should remain zero");

    assert_eq!(world_hash(&engine), GOLDEN_STATIONARY, "stationary golden hash");
}

/// Two entities moving to the same destination from different positions.
/// Both should arrive and stabilise; arrival order depends on distance.
#[test]
fn two_entities_same_target() {
    let world = WorldState::new(
        0,
        vec![make_entity(1, 0.0, 0.0), make_entity(2, 20.0, 0.0)],
    );
    let mut engine = Engine::from_snapshot(world);

    engine.accept(&make_move(1, 10.0, 0.0, make_cmd_id(1))).unwrap();
    engine.accept(&make_move(2, 10.0, 0.0, make_cmd_id(2))).unwrap();

    let mut arrived = [false; 2];
    for _ in 0..30 {
        let finished = engine.tick();
        engine.state.tick += 1;
        if finished.contains(&1) { arrived[0] = true; }
        if finished.contains(&2) { arrived[1] = true; }
        if arrived[0] && arrived[1] { break; }
    }

    assert!(arrived[0], "entity 1 should arrive");
    assert!(arrived[1], "entity 2 should arrive");

    // Both at stop boundary, both stationary.
    for id in [1, 2] {
        let entity = engine.state.find_entity(id).unwrap();
        let pos = entity.pos.as_ref().unwrap();
        let vel = entity.vel.as_ref().unwrap();
        let dist = ((10.0 - pos.x).powi(2) + pos.y.powi(2)).sqrt();
        assert!(
            (dist - DEFAULT_STOP_RADIUS).abs() < 0.01,
            "entity {id} should be at stop boundary, dist={dist}"
        );
        assert_eq!(vel.x, 0.0);
        assert_eq!(vel.y, 0.0);
    }

    // Stable after more ticks.
    run_ticks(&mut engine, 10);
    assert_eq!(world_hash(&engine), GOLDEN_TWO_SAME_TARGET, "two-entities-same-target golden hash");
}

// ── Golden hashes ──────────────────────────────────────────────────────────
// Generated by running each scenario and capturing the xxh3 hash.
// To regenerate: set the constant to 0 and run — the assertion message
// will show the actual hash.

const GOLDEN_ARRIVAL: u64 = 11036478118369653364;
const GOLDEN_NO_OSCILLATION: u64 = 2182732989025190288;
const GOLDEN_REPLACE_MID_MOVE: u64 = 12380075696246219907;
const GOLDEN_STATIONARY: u64 = 6510937402586056124;
const GOLDEN_TWO_SAME_TARGET: u64 = 7185151553615365936;
