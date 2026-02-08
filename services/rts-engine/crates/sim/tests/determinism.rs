use sim::{Engine, IntentEnvelope};
use sim::codec::to_sorted_json;
use sim::pb::{MoveToLocationIntent, Vec2, intent_envelope::Payload};
use uuid::Uuid;

#[test]
fn test_deterministic_replay() {
    // Create a simple world state with an entity
    let entity = sim::pb::Entity {
        id: 1,
        pos: Some(Vec2 { x: 0.0, y: 0.0 }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
    };
    
    let world_state = sim::state::WorldState::new(0, vec![entity]);
    let mut engine1 = Engine::from_snapshot(world_state);
    let mut engine2 = Engine::from_snapshot(engine1.state.clone());

    // Create a move intent
    let move_intent = MoveToLocationIntent {
        entity_id: 1,
        target: Some(Vec2 { x: 10.0, y: 5.0 }),
        client_cmd_id: String::new(),
        player_id: String::new(),
    };

    let envelope = IntentEnvelope {
        client_cmd_id: Uuid::now_v7().into_bytes().to_vec(),
        intent_id: Uuid::now_v7().into_bytes().to_vec(),
        player_id: "test_player".to_string(),
        client_seq: 1,
        server_tick: 0,
        protocol_version: 1,
        policy: 0, // REPLACE_ACTIVE
        payload: Some(Payload::Move(move_intent)),
    };

    // Apply the same intent to both engines
    engine1.accept(&envelope).unwrap();
    engine2.accept(&envelope).unwrap();

    // Run both engines for the same number of ticks
    for _ in 0..5 {
        engine1.tick();
        engine1.state.tick += 1;
        engine2.tick();
        engine2.state.tick += 1;
    }

    // Both engines should produce identical JSON
    let json1 = to_sorted_json(&engine1.state).unwrap();
    let json2 = to_sorted_json(&engine2.state).unwrap();
    
    assert_eq!(json1, json2, "Deterministic replay should produce identical results");
}

#[test]
fn test_idempotent_operations() {
    // Create a world state with an entity
    let entity = sim::pb::Entity {
        id: 1,
        pos: Some(Vec2 { x: 0.0, y: 0.0 }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
    };
    
    let world_state = sim::state::WorldState::new(0, vec![entity]);
    let mut engine = Engine::from_snapshot(world_state);

    // Apply the same move intent twice
    let move_intent = MoveToLocationIntent {
        entity_id: 1,
        target: Some(Vec2 { x: 10.0, y: 5.0 }),
        client_cmd_id: String::new(),
        player_id: String::new(),
    };

    let envelope = IntentEnvelope {
        client_cmd_id: Uuid::now_v7().into_bytes().to_vec(),
        intent_id: Uuid::now_v7().into_bytes().to_vec(),
        player_id: "test_player".to_string(),
        client_seq: 1,
        server_tick: 0,
        protocol_version: 1,
        policy: 0, // REPLACE_ACTIVE
        payload: Some(Payload::Move(move_intent)),
    };

    // First apply succeeds
    engine.accept(&envelope).unwrap();
    let json1 = to_sorted_json(&engine.state).unwrap();

    // Second apply is rejected as duplicate (idempotent — state unchanged)
    let result = engine.accept(&envelope);
    assert!(result.is_err(), "duplicate client_cmd_id should be rejected");
    let json2 = to_sorted_json(&engine.state).unwrap();

    // World state is unchanged after the duplicate rejection
    assert_eq!(json1, json2, "Idempotent: state must not change after duplicate rejection");
}

#[test]
fn test_stable_json_serialization() {
    // Create a world state with multiple entities
    let entities = vec![
        sim::pb::Entity {
            id: 2,
            pos: Some(Vec2 { x: 1.0, y: 2.0 }),
            vel: Some(Vec2 { x: 0.1, y: 0.2 }),
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
        },
        sim::pb::Entity {
            id: 1,
            pos: Some(Vec2 { x: 0.0, y: 0.0 }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
        },
    ];
    
    let world_state = sim::state::WorldState::new(0, entities);
    let json = to_sorted_json(&world_state).unwrap();
    
    // Parse the JSON and verify entities are sorted by ID
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
    let entities = parsed["entities"].as_array().unwrap();
    
    assert_eq!(entities.len(), 2);
    assert_eq!(entities[0]["id"], 1);
    assert_eq!(entities[1]["id"], 2);
}