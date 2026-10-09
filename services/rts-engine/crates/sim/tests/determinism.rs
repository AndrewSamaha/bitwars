use sim::{Engine, IntentEnvelope};
use sim::codec::to_sorted_json;
use sim::pb::{MoveToLocationIntent, Vec2, intent_envelope::Payload};
use uuid::Uuid;

#[test]
fn test_deterministic_replay() {
    // Create a simple world state with an entity
    let entity = sim::pb::Entity {
        id: 1,
        entity_type_id: String::new(),
        pos: Some(Vec2 { x: 0.0, y: 0.0 }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
        health: 100.0,
        ..Default::default()
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
        entity_type_id: String::new(),
        pos: Some(Vec2 { x: 0.0, y: 0.0 }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
        health: 100.0,
        ..Default::default()
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
            entity_type_id: String::new(),
            pos: Some(Vec2 { x: 1.0, y: 2.0 }),
            vel: Some(Vec2 { x: 0.1, y: 0.2 }),
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
            health: 100.0,
        ..Default::default()
},
        sim::pb::Entity {
            id: 1,
            entity_type_id: String::new(),
            pos: Some(Vec2 { x: 0.0, y: 0.0 }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
            health: 100.0,
        ..Default::default()
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

#[test]
fn snapshot_inventory_is_preserved_and_changes_deterministic_state() {
    use prost::Message;
    use sim::pb::{Entity, ResourceAmount, ResourceInventory, ResourceDeposit, Snapshot, CollectorState};
    let snapshot = Snapshot {
        entities: vec![Entity {
            id: 718,
            owner_player_id: "andrew".into(),
            resources: Some(ResourceInventory { resources: vec![ResourceAmount { resource_type: "food".into(), amount: 48.0 }] }),
            resource_deposit: Some(ResourceDeposit { amount: 100.0, remaining: 55.0 }),
            ..Default::default()
        }],
        collector_states: vec![CollectorState { entity_id: 718, resource_type: "food".into(), carry_amount: 50.0 }],
        ..Default::default()
    };
    let state = sim::codec::from_snapshot_proto(&snapshot.encode_to_vec()).unwrap();
    assert_eq!(state.entities[0].resources["food"], 98.0);
    assert_eq!(state.entities[0].owner_player_id, "andrew");
    let restored = Entity::from(&state.entities[0]);
    assert_eq!(restored.resources.unwrap().resources[0].amount, 98.0);
    assert_eq!(restored.resource_deposit.unwrap().remaining, 55.0);
    let json = to_sorted_json(&state).unwrap();
    let mut different_inventory = state.clone();
    different_inventory.entities[0].resources.insert("food".into(), 97.0);
    assert_ne!(json, to_sorted_json(&different_inventory).unwrap());
    let mut first = Engine::from_snapshot(state.clone());
    let mut second = Engine::from_snapshot(state);
    for _ in 0..10 { first.tick(); second.tick(); }
    assert_eq!(to_sorted_json(&first.state).unwrap(), to_sorted_json(&second.state).unwrap());
    assert_eq!(first.state.entities[0].resources["food"], 98.0);
}
