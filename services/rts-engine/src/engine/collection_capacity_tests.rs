use super::*;

fn content() -> ContentPack {
    ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/content/entities.yaml")).unwrap()
}

fn fixture(content: &ContentPack) -> Vec<pb::Entity> {
    let node = content.get("minerals").unwrap().resource_node.as_ref().unwrap();
    let distance = (node.min_effective_distance + node.max_effective_distance) / 2.0;
    let entity = |id, kind: &str, owner: &str, x| pb::Entity {
        id, entity_type_id: kind.into(), owner_player_id: owner.into(), health: 100.0,
        pos: Some(pb::Vec2 { x, y: 0.0 }), ..Default::default()
    };
    let mut entities = vec![entity(1, "worker", "alice", distance),
        entity(2, "minerals", UNIVERSE_OWNER, 0.0), entity(3, "habitat", "alice", distance)];
    for resource in ["food", "energy"] {
        set_resource_amount(&mut entities[0], resource,
            content.get("worker").unwrap().max_capacity[resource] as f64);
    }
    entities[1].resource_deposit = Some(pb::ResourceDeposit { amount: 1000.0, remaining: 1000.0 });
    entities
}

fn assert_supplies_unchanged(entities: &[pb::Entity], content: &ContentPack) {
    for resource in ["food", "energy"] {
        assert_eq!(resource_amount(&entities[0], resource),
            content.get("worker").unwrap().max_capacity[resource] as f64);
        assert_eq!(resource_amount(&entities[2], resource), 0.0);
    }
}

#[test]
fn requested_inventory_gathers_and_delivers_independently_of_full_supplies() {
    let content = content();
    let def = content.get("worker").unwrap();
    let mut entities = fixture(&content);
    let index = collection_entity_index(&entities);
    assert!(collection_load(&entities[0], def, ["minerals"]).is_none());
    assert_eq!(collection_load(&entities[0], def, ["food", "minerals"]).unwrap().resource_type, "food");
    assert_eq!(gather_transport_inventory(&mut entities, 1, 2, def, "minerals", 8.0, &index), 8.0);
    assert_eq!(resource_amount(&entities[0], "minerals"), 8.0);
    assert_supplies_unchanged(&entities, &content);

    set_resource_amount(&mut entities[0], "minerals", def.max_capacity["minerals"] as f64);
    let load = collection_load(&entities[0], def, ["minerals"]).unwrap();
    assert_eq!(load.resource_type, "minerals");
    let (actor, rest) = entities.split_at_mut(1);
    deposit_collection_inventory(&mut actor[0], def, &mut rest[1], content.get("habitat").unwrap(), &load.resource_type);
    assert_eq!(resource_amount(&entities[0], "minerals"), 0.0);
    assert_eq!(resource_amount(&entities[2], "minerals"), load.amount);
    assert_supplies_unchanged(&entities, &content);
}

#[test]
fn zero_requested_capacity_cannot_take_any_deposit() {
    let mut content = content();
    let mut entities = fixture(&content);
    content.entity_types.get_mut("worker").unwrap().max_capacity.insert("minerals".into(), 0.0);
    let before = entities.clone();
    let index = collection_entity_index(&entities);
    assert_eq!(gather_transport_inventory(&mut entities, 1, 2, content.get("worker").unwrap(), "minerals", 8.0, &index), 0.0);
    assert_eq!(entities, before);
}

#[test]
fn explicit_source_selection_ignores_stale_load_and_binding_but_auto_preserves_them() {
    let collector = CollectorSnapshot { id: 1, entity_type_id: "worker".into(), owner_player_id: "alice".into(), x: 0.0, y: 0.0 };
    let mineral = ResourceNodeSnapshot { id: 2, x: 30.0, y: 0.0, resource_type: "minerals".into(), mode: CollectionMode::Transport,
        max_simultaneous_collectors: Some(1), min_effective_distance: 20.0, max_effective_distance: 50.0 };
    let nodes = [mineral.clone(), ResourceNodeSnapshot { id: 4, x: 10.0, resource_type: "food".into(), ..mineral }];
    let indexes = nodes.iter().enumerate().map(|(index, node)| (node.id, index)).collect();
    let collects = vec!["minerals".into(), "food".into()];
    let mut capacities = HashMap::from([("minerals".into(), 50.0), ("food".into(), 50.0)]);
    assert_eq!(Engine::pick_transport_node(&collector, &nodes, Some(4), &indexes, Some("food"), "minerals", false, &collects, &capacities).unwrap().id, 2);
    assert_eq!(Engine::pick_transport_node(&collector, &nodes, Some(4), &indexes, Some("food"), "", true, &collects, &capacities).unwrap().id, 4);
    assert_eq!(Engine::pick_transport_node(&collector, &nodes, None, &indexes, None, "", true, &collects, &capacities).unwrap().id, 4);
    capacities.insert("food".into(), 0.0);
    assert_eq!(Engine::pick_transport_node(&collector, &nodes, Some(4), &indexes, None, "", true, &collects, &capacities).unwrap().id, 2);
    capacities.remove("minerals");
    assert!(Engine::pick_transport_node(&collector, &nodes, None, &indexes, None, "", true, &collects, &capacities).is_none());
}

fn assign(engine: &mut Engine, nearest_compatible: bool) {
    let metadata = IntentMetadata {
        entity_id: 1, intent_id: Uuid::now_v7().as_bytes().to_vec(),
        client_cmd_id: Uuid::now_v7().as_bytes().to_vec(), player_id: "alice".into(),
        protocol_version: ENGINE_PROTOCOL_MAJOR, server_tick: engine.state.tick, policy: pb::IntentPolicy::ReplaceActive,
    };
    let intent = pb::Intent { kind: Some(pb::intent::Kind::Collect(pb::CollectIntent {
        entity_id: 1, resource_type_id: if nearest_compatible { String::new() } else { "minerals".into() },
        nearest_compatible, ..Default::default()
    })) };
    assert!(engine.intents.try_activate(intent, metadata, "worker").started.is_some());
}

/// Executable smoke of the actual unplanned tick path against a disposable Redis.
#[tokio::test]
#[ignore = "requires COLLECTION_CAPACITY_TEST_REDIS_URL pointing at disposable Redis"]
async fn collection_capacity_runtime() -> Result<()> {
    use redis::AsyncCommands;
    let url = std::env::var("COLLECTION_CAPACITY_TEST_REDIS_URL")
        .context("set COLLECTION_CAPACITY_TEST_REDIS_URL to disposable Redis")?;
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let temp = std::env::temp_dir().join(format!("bitwars-collection-capacity-{}", Uuid::now_v7()));
    std::fs::create_dir_all(&temp)?;
    let path = temp.join("entities.yaml");
    std::fs::copy(root.join("packages/content/entities.yaml"), &path)?;
    let game_id = format!("collection-capacity-test-{}", Uuid::now_v7());
    let cfg = GameConfig {
        game_id: game_id.clone(), redis_url: url.clone(), content_pack_path: path.to_string_lossy().into_owned(),
        spawn_config_path: root.join("services/rts-engine/config/spawn.yaml").to_string_lossy().into_owned(),
        ..Default::default()
    };
    let mut engine = Engine::new(cfg).await?;
    let content = engine.content.as_ref().unwrap().clone();
    engine.state.entities = fixture(&content);
    engine.state.discovered_entities.insert("alice".into(), [2].into());
    assign(&mut engine, false);
    // A replaced food delivery must neither unload food nor redirect the new order.
    engine.set_collector_ui_state(1, COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF, "food", 0.0);
    engine.transport_node_by_entity.insert(1, 99);
    engine.apply_resource_collection(1.0).await;
    assert_eq!(engine.collector_ui_state_by_entity[&1].activity, COLLECTOR_ACTIVITY_GATHERING);
    assert_eq!(resource_amount(&engine.state.entities[0], "minerals"), 8.0);
    assert_supplies_unchanged(&engine.state.entities, &content);
    println!("explicit minerals: full food/energy preserved, minerals gathered=8");

    // Partial mineral cargo must not inherit a missing previous food source or its delivery phase.
    engine.set_collector_ui_state(1, COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF, "food", 0.0);
    engine.transport_node_by_entity.insert(1, 99);
    engine.apply_resource_collection(1.0).await;
    assert_eq!(resource_amount(&engine.state.entities[0], "minerals"), 16.0);
    assert_supplies_unchanged(&engine.state.entities, &content);

    let mineral_capacity = content.get("worker").unwrap().max_capacity["minerals"] as f64;
    set_resource_amount(&mut engine.state.entities[0], "minerals", mineral_capacity);
    engine.apply_resource_collection(1.0).await;
    assert_eq!(engine.collector_ui_state_by_entity[&1].activity, COLLECTOR_ACTIVITY_DELIVERING);
    assert_eq!(resource_amount(&engine.state.entities[0], "minerals"), 0.0);
    assert_eq!(resource_amount(&engine.state.entities[2], "minerals"), mineral_capacity);
    assert_supplies_unchanged(&engine.state.entities, &content);
    println!("full requested minerals: delivered={mineral_capacity}, food/energy preserved");

    engine.apply_resource_collection(1.0).await;
    assert_eq!(resource_amount(&engine.state.entities[0], "minerals"), 8.0);
    assert_supplies_unchanged(&engine.state.entities, &content);
    set_resource_amount(&mut engine.state.entities[0], "minerals", 0.0);
    engine.content.as_mut().unwrap().entity_types.get_mut("worker").unwrap().max_capacity.insert("minerals".into(), 0.0);
    let deposit = engine.state.entities[1].resource_deposit;
    engine.apply_resource_collection(1.0).await;
    assert_eq!(engine.collector_ui_state_by_entity[&1].activity, "waiting_for_capacity");
    assert_eq!(engine.collector_ui_state_by_entity[&1].resource_type, "minerals");
    assert_eq!(engine.state.entities[1].resource_deposit, deposit);
    assert_eq!(resource_amount(&engine.state.entities[0], "minerals"), 0.0);
    assert_supplies_unchanged(&engine.state.entities, &content);
    println!("zero requested mineral capacity: blocked without consuming deposit");

    engine.content = Some(content.clone());
    engine.state.entities = fixture(&content);
    set_resource_amount(&mut engine.state.entities[0], "food", 0.0);
    engine.collector_ui_state_by_entity.clear();
    engine.transport_node_by_entity.clear();
    assign(&mut engine, true);
    engine.apply_resource_collection(1.0).await;
    assert_eq!(resource_amount(&engine.state.entities[0], "minerals"), 8.0);
    assert_eq!(engine.collector_ui_state_by_entity[&1].resource_type, "minerals");
    println!("nearest-compatible: selected discovered mineral source and gathered=8");

    drop(engine);
    let mut connection = redis::Client::open(url)?.get_multiplexed_async_connection().await?;
    let mut keys: Vec<String> = connection.keys(format!("rts:match:{game_id}:*")).await?;
    keys.extend([format!("snapshot:{game_id}"), format!("snapshot_meta:{game_id}")]);
    let _: usize = connection.del(keys).await?;
    std::fs::remove_dir_all(temp)?;
    Ok(())
}
