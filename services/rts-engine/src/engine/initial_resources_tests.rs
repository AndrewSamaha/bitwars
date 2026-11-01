use super::*;
use rand::SeedableRng;

fn assert_full_inventory(entity: &pb::Entity, context: &str) {
    assert_eq!(entity.resources.as_ref().unwrap().resources.len(), 3);
    for resource in ["energy", "food", "minerals"] {
        assert_eq!(resource_amount(entity, resource), 50.0);
    }
    println!("{context} {} id={}: energy={} food={} minerals={}",
        entity.entity_type_id, entity.id, resource_amount(entity, "energy"),
        resource_amount(entity, "food"), resource_amount(entity, "minerals"));
}

/// Exercise the real constructors, construction completion, Redis snapshot and restart.
#[tokio::test]
#[ignore = "requires INITIAL_RESOURCES_TEST_REDIS_URL pointing at disposable Redis"]
async fn initial_resources_creation_and_restore_runtime() -> Result<()> {
    use redis::AsyncCommands;
    let url = std::env::var("INITIAL_RESOURCES_TEST_REDIS_URL")
        .context("set INITIAL_RESOURCES_TEST_REDIS_URL to disposable Redis")?;
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let temp = std::env::temp_dir().join(format!("bitwars-initial-resources-{}", Uuid::now_v7()));
    std::fs::create_dir_all(&temp)?;
    let path = temp.join("entities.yaml");
    std::fs::copy(root.join("packages/content/entities.yaml"), &path)?;
    let game_id = format!("initial-resources-test-{}", Uuid::now_v7());
    let mut cfg = GameConfig {
        game_id: game_id.clone(), redis_url: url.clone(),
        content_pack_path: path.to_string_lossy().into_owned(),
        spawn_config_path: root.join("services/rts-engine/config/spawn.yaml").to_string_lossy().into_owned(),
        ..Default::default()
    };
    let mut engine = Engine::new(cfg.clone()).await?;
    let content = engine.content.as_ref().unwrap().clone();
    let next_id = engine.state.entities.iter().map(|entity| entity.id).max().unwrap_or(0) + 1;
    let before_loadout = engine.state.entities.len();
    let loadout = [("planet_blue_inhabitated".into(), 1), ("worker".into(), 1), ("scout".into(), 1)].into();
    state::on_player_spawn(&mut engine.state.entities, next_id, "alice", 0.0, 0.0,
        &loadout, 0.0, 0.0, &[], &content, &mut rand::rngs::StdRng::seed_from_u64(42));
    assert_eq!(engine.state.entities.len(), before_loadout + 3);
    for kind in ["worker", "scout"] {
        let entity = engine.state.entities[before_loadout..].iter()
            .find(|entity| entity.entity_type_id == kind).unwrap();
        assert_full_inventory(entity, "loadout");
    }
    let builder_id = engine.state.entities[before_loadout..].iter()
        .find(|entity| entity.entity_type_id == "planet_blue_inhabitated").unwrap().id;
    let builder = engine.state.entities.iter_mut().find(|entity| entity.id == builder_id).unwrap();
    for (resource, capacity) in &content.get("planet_blue_inhabitated").unwrap().max_capacity {
        set_resource_amount(builder, resource, *capacity as f64);
    }
    let mut product_ids = Vec::new();
    for kind in ["worker", "scout"] {
        let before_build = engine.state.entities.len();
        let metadata = IntentMetadata {
            entity_id: builder_id, intent_id: Uuid::now_v7().as_bytes().to_vec(),
            client_cmd_id: Uuid::now_v7().as_bytes().to_vec(), player_id: "alice".into(),
            protocol_version: ENGINE_PROTOCOL_MAJOR, server_tick: engine.state.tick,
            policy: pb::IntentPolicy::ReplaceActive,
        };
        let intent = pb::Intent { kind: Some(pb::intent::Kind::Build(pb::BuildIntent {
            entity_id: builder_id, blueprint_id: kind.into(), ..Default::default()
        })) };
        assert!(engine.intents.try_activate(intent, metadata, "planet_blue_inhabitated").started.is_some());
        engine.maintain_depot_operations(1.0 / engine.cfg.tps.max(1) as f32).await;
        engine.advance_builds(10_000.0).await;
        assert_eq!(engine.state.entities.len(), before_build + 1);
        let product = engine.state.entities.last().unwrap();
        assert_eq!(product.entity_type_id, kind);
        assert_full_inventory(product, "completed-build");
        product_ids.push(product.id);
    }
    // A synthetic upgrade to an existing granted type must preserve source stock.
    let upgrade_id = engine.state.entities[before_loadout..].iter()
        .find(|entity| entity.entity_type_id == "worker").unwrap().id;
    let mut upgrade_content = content.clone();
    let upgrade_option = crate::content::UpgradeOptionDef {
        entity_type_id: "scout".into(), spend_rates: HashMap::new(), duration_seconds: Some(1.0),
    };
    upgrade_content.entity_types.get_mut("worker").unwrap().upgrades.push(upgrade_option);
    engine.intents.entity_types = upgrade_content.entity_types.clone();
    engine.content = Some(upgrade_content);
    let source = engine.state.entities.iter_mut().find(|entity| entity.id == upgrade_id).unwrap();
    set_resource_amount(source, "energy", 0.0);
    set_resource_amount(source, "food", 12.0);
    set_resource_amount(source, "minerals", 0.0);
    let inventory_before_upgrade = source.resources.clone();
    let metadata = IntentMetadata {
        entity_id: upgrade_id, intent_id: Uuid::now_v7().as_bytes().to_vec(),
        client_cmd_id: Uuid::now_v7().as_bytes().to_vec(), player_id: "alice".into(),
        protocol_version: ENGINE_PROTOCOL_MAJOR, server_tick: engine.state.tick,
        policy: pb::IntentPolicy::ReplaceActive,
    };
    let intent = pb::Intent { kind: Some(pb::intent::Kind::Upgrade(pb::UpgradeIntent {
        entity_id: upgrade_id, target_entity_type_id: "scout".into(),
    })) };
    assert!(engine.intents.try_activate(intent, metadata, "worker").started.is_some());
    engine.maintain_depot_operations(1.0 / engine.cfg.tps.max(1) as f32).await;
    engine.advance_builds(10_000.0).await;
    let upgraded = engine.state.entities.iter().find(|entity| entity.id == upgrade_id).unwrap();
    assert_eq!(upgraded.entity_type_id, "scout");
    assert_eq!(upgraded.resources, inventory_before_upgrade);
    println!("upgraded scout id={upgrade_id}: energy=0 food=12 minerals=0 (no fresh grant)");
    // An empty inventory and an absent inventory must both survive restart unchanged.
    for (index, id) in product_ids.iter().enumerate() {
        let product = engine.state.entities.iter_mut().find(|entity| entity.id == *id).unwrap();
        if index == 0 {
            for resource in ["energy", "food", "minerals"] {
                set_resource_amount(product, resource, 0.0);
            }
        } else {
            product.resources = None;
        }
    }
    let saved: Vec<_> = product_ids.iter().map(|id| {
        engine.state.entities.iter().find(|entity| entity.id == *id).unwrap().clone()
    }).collect();
    engine.redis.publish_snapshot(&engine.state, &engine.resource_spend_total, &engine.resource_gain_total,
        "0-0", Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new()).await?;
    drop(engine);
    cfg.restore_gamestate = true;
    let restored = Engine::new(cfg).await?;
    for expected in &saved {
        let actual = restored.state.entities.iter().find(|entity| entity.id == expected.id).unwrap();
        assert_eq!(actual, expected);
        println!("restored {} id={}: energy={} food={} minerals={} inventory_present={}",
            actual.entity_type_id, actual.id, resource_amount(actual, "energy"),
            resource_amount(actual, "food"), resource_amount(actual, "minerals"), actual.resources.is_some());
    }
    drop(restored);
    let mut connection = redis::Client::open(url)?.get_multiplexed_async_connection().await?;
    let mut keys: Vec<String> = connection.keys(format!("rts:match:{game_id}:*")).await?;
    keys.extend([format!("snapshot:{game_id}"), format!("snapshot_meta:{game_id}")]);
    let _: usize = connection.del(keys).await?;
    std::fs::remove_dir_all(temp)?;
    Ok(())
}
