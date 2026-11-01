use super::{Engine, intent::IntentManager, state::GameState};
use crate::{content::ContentPack, content_revision::{Revision, revision_root}, pb};
use anyhow::{Context, Result};
use serde_json::{Value, json};
use tracing::warn;

fn transition(operation: &mut Value, status: &str) {
    operation["status"] = json!(status);
    if !operation["transitions"].is_array() { operation["transitions"] = json!([]); }
    operation["transitions"].as_array_mut().unwrap().push(json!({"status":status,"at":super::current_unix_ms()}));
}
fn terminal(status: &str) -> bool { matches!(status, "active" | "rejected" | "failed" | "no_change") }

/// Pure validation: rejection cannot mutate world, actions, balances, or accepted definitions.
fn validate_live(state: &GameState, intents: &IntentManager, old: Option<&ContentPack>, candidate: &ContentPack) -> Result<()> {
    for technologies in state.technologies.values() {
        for id in technologies { anyhow::ensure!(candidate.technologies.contains_key(id), "completed technology removed: {id}"); }
    }
    for entity in &state.entities {
        let definition = candidate.get(&entity.entity_type_id)
            .with_context(|| format!("live entity {} type removed: {}", entity.id, entity.entity_type_id))?;
        anyhow::ensure!(definition.health >= entity.health, "entity {} maximum health is below live health", entity.id);
        if let Some(resources) = &entity.resources {
            for resource in &resources.resources {
                anyhow::ensure!(candidate.resource_types.contains_key(&resource.resource_type),
                    "entity {} live resource removed: {}", entity.id, resource.resource_type);
                let capacity = definition.max_capacity.get(&resource.resource_type).copied().unwrap_or(0.0) as f64;
                anyhow::ensure!(capacity >= resource.amount, "entity {} capacity below live {} stock", entity.id, resource.resource_type);
            }
        }
        if entity.resource_deposit.is_some() {
            let node = definition.resource_node.as_ref().with_context(|| format!("entity {} live deposit profile removed", entity.id))?;
            if let Some(previous) = old.and_then(|pack| pack.get(&entity.entity_type_id)).and_then(|def| def.resource_node.as_ref()) {
                anyhow::ensure!(previous.resource_type == node.resource_type, "entity {} live deposit resource changed", entity.id);
            }
        }
    }
    for (entity_id, active) in intents.active_intents() {
        let entity = state.entities.iter().find(|entity| entity.id == *entity_id).context("active action has no entity")?;
        let definition = candidate.get(&entity.entity_type_id).context("active actor type removed")?;
        let empty = std::collections::HashSet::new();
        let owned = state.technologies.get(&entity.owner_player_id).unwrap_or(&empty);
        let target = match active.action.exec.as_ref() {
            Some(pb::action_state::Exec::Build(build)) => {
                anyhow::ensure!(definition.builds.iter().any(|option| option.entity_type_id == build.blueprint_id),
                    "entity {entity_id} active build option removed");
                Some(build.blueprint_id.as_str())
            }
            Some(pb::action_state::Exec::Upgrade(upgrade)) => {
                anyhow::ensure!(definition.upgrades.iter().any(|option| option.entity_type_id == upgrade.target_entity_type_id),
                    "entity {entity_id} active upgrade option removed");
                let target = candidate.get(&upgrade.target_entity_type_id).context("active upgrade target removed")?;
                for resource in entity.resources.as_ref().into_iter().flat_map(|inventory| &inventory.resources) {
                    anyhow::ensure!(target.max_capacity.get(&resource.resource_type).copied().unwrap_or(0.0) as f64 >= resource.amount,
                        "entity {entity_id} active upgrade target capacity below live {} stock", resource.resource_type);
                }
                Some(upgrade.target_entity_type_id.as_str())
            }
            Some(pb::action_state::Exec::Research(research)) => {
                anyhow::ensure!(definition.researches.contains(&research.technology_id), "entity {entity_id} active research option removed");
                let technology = candidate.technology(&research.technology_id).context("active research technology removed")?;
                anyhow::ensure!(technology.requires.as_ref().is_none_or(|requirement| requirement.is_satisfied_by(owned)),
                    "entity {entity_id} active research prerequisites changed");
                None
            }
            Some(pb::action_state::Exec::Collect(collect)) => {
                let collector = definition.collector.as_ref().context("active collector capability removed")?;
                anyhow::ensure!(if collect.nearest_compatible { !collector.collects.is_empty() } else {
                    collector.collects.contains(&collect.resource_type_id) && candidate.resource_types.contains_key(&collect.resource_type_id)
                }, "entity {entity_id} active collection resource removed");
                None
            }
            Some(pb::action_state::Exec::Repair(_)) => {
                anyhow::ensure!(definition.repair.is_some(), "entity {entity_id} active repair capability removed"); None
            }
            Some(pb::action_state::Exec::Deliver(deliver)) => {
                anyhow::ensure!(deliver.resource_type_ids.iter().all(|id| candidate.resource_types.contains_key(id)),
                    "entity {entity_id} active delivery resource removed"); None
            }
            Some(pb::action_state::Exec::Resupply(order)) => {
                anyhow::ensure!(super::resupply::valid(&state.entities, candidate, order), "entity {entity_id} active resupply dependencies removed"); None
            }
            _ => None,
        };
        if let Some(id) = target {
            let target = candidate.get(id).context("active production target removed")?;
            anyhow::ensure!(target.requires_technologies.as_ref().is_none_or(|requirement| requirement.is_satisfied_by(owned)),
                "entity {entity_id} active production prerequisites changed");
        }
    }
    Ok(())
}

impl Engine {
    fn install_content_revision(&mut self, revision: Revision) {
        self.intents.entity_types = revision.pack.entity_types.clone();
        // Motion targets cache a definition-derived stop radius; keep all route/action identity.
        for (id, active) in self.intents.current_action.iter_mut() {
            if let Some(pb::action_state::Exec::Move(movement)) = active.action.exec.as_mut() {
                if let Some(target) = movement.target.as_mut() {
                    if let Some(definition) = self.state.entities.iter().find(|entity| entity.id == *id)
                        .and_then(|entity| revision.pack.get(&entity.entity_type_id)) {
                        target.stop_radius = definition.stop_radius;
                    }
                }
            }
        }
        self.content = Some(revision.pack);
        self.raider_script.invalidate_content();
        // Remaining gameplay systems derive their definitions each tick. These are only
        // presentation/retry caches, not authoritative orders or resource reservations.
        self.collector_ui_state_by_entity.clear();
        self.combat_effect_ui_state_by_entity.clear();
        self.collection_retry_tick_by_entity.clear();
        self.build_progress_stamps.clear();
        for pending in self.state.generation.pending.values_mut() { pending.last_revision = None; }
    }

    async fn commit_content_checkpoint(&mut self, payload: &Value, operation: &Value) -> Result<()> {
        let result = self.redis.publish_snapshot_with_content(
            &self.state, &self.resource_spend_total, &self.resource_gain_total,
            self.last_delta_id.as_deref().unwrap_or("0-0"),
            self.collector_states_for_stream(), self.combat_effect_states_for_stream(),
            self.intents.convoys.clone(), self.intents.move_orders_for_snapshot(),
            self.intents.sentries.clone(), self.intents.escorts.clone(),
            self.intents.collection_orders_for_snapshot(), Some((payload, operation)),
        ).await;
        if let Err(error) = &result {
            // A lost MULTI reply or a failed stream notification must not turn an
            // already committed acceptance into a failed operation.
            let id = operation["reload_id"].as_str().context("missing reload ID")?;
            if let Some(mut saved) = self.redis.content_reload_operation(id).await?.filter(|saved| saved["status"] == "active") {
                saved["error"] = json!({"stage":"notification","code":"checkpoint_delivery_failed","message":error.to_string()});
                if let Err(diagnostic_error) = self.redis.save_content_reload_operation(&saved, false).await {
                    warn!(?diagnostic_error, "failed to persist accepted checkpoint delivery diagnostic");
                }
                self.redis.content_revision = payload["content_revision"].as_str().unwrap().to_string();
                warn!(?error, "content checkpoint committed despite notification/response failure");
                return Ok(());
            }
        }
        result
    }

    pub(super) async fn bootstrap_content_revision(&mut self, revision: Revision) -> Result<()> {
        self.spawn_config.validate_content(&revision.pack)?;
        for mut interrupted in self.redis.interrupted_content_reload_operations().await? {
            transition(&mut interrupted, "failed");
            interrupted["error"] = json!({"stage":"recovery","code":"engine_restarted",
                "message":"Engine restarted before this reload committed; resubmit against the restored active revision."});
            self.redis.save_content_reload_operation(&interrupted, false).await?;
        }
        let previous_active = self.redis.active_content_payload().await?;
        let reload_id = uuid::Uuid::now_v7().to_string();
        let mut operation = json!({"reload_id":reload_id,"base_revision": self.redis.content_revision,
            "candidate_revision": revision.pack.content_hash,"requested_by":"engine-startup",
            "requested_at":super::current_unix_ms(),"transitions":[]});
        if self.cfg.restore_gamestate {
            if let Some(previous) = previous_active.filter(|payload| payload["content_revision"] != revision.pack.content_hash) {
                operation["recovery"] = json!({"code":"snapshot_revision_mismatch","snapshot_revision":revision.pack.content_hash,
                    "previous_active_revision":previous["content_revision"],"at":super::current_unix_ms()});
                warn!(snapshot_revision = %revision.pack.content_hash, previous_active = %previous["content_revision"],
                    "restoring snapshot's exact content rather than newer advertised content");
            }
        }
        transition(&mut operation, "staged");
        self.redis.save_content_reload_operation(&operation, true).await?;
        for status in ["validating", "ready", "activating"] {
            transition(&mut operation, status);
            self.redis.save_content_reload_operation(&operation, false).await?;
        }
        let payload = revision.payload(&reload_id, self.state.tick);
        transition(&mut operation, "active"); operation["activated_tick"] = json!(self.state.tick);
        self.commit_content_checkpoint(&payload, &operation).await?;
        self.install_content_revision(revision);
        if let Err(error) = self.redis.notify_content_revision(&payload).await {
            operation["error"] = json!({"stage":"notification","code":"event_publish_failed","message":error.to_string()});
            if let Err(diagnostic_error) = self.redis.save_content_reload_operation(&operation, false).await {
                warn!(?diagnostic_error, "failed to persist startup notification diagnostic");
            }
            warn!(?error, "accepted startup content notification failed");
        }
        Ok(())
    }

    pub(super) async fn process_content_reload(&mut self) -> Result<()> {
        let Some(request) = self.redis.next_content_reload().await? else { return Ok(()); };
        let id = request["reload_id"].as_str().context("reload request missing reload_id")?;
        let mut operation = self.redis.content_reload_operation(id).await?.unwrap_or_else(|| request.clone());
        if terminal(operation["status"].as_str().unwrap_or("")) {
            self.redis.acknowledge_content_reload().await?; return Ok(());
        }
        transition(&mut operation, "validating");
        self.redis.save_content_reload_operation(&operation, false).await?;
        let candidate = request["candidate_revision"].as_str().unwrap_or("");
        let base = request["base_revision"].as_str().unwrap_or("");
        let active = self.content.as_ref().map(|pack| pack.content_hash.as_str()).unwrap_or("");
        let validation: Result<Revision> = (|| {
            anyhow::ensure!(uuid::Uuid::parse_str(id).is_ok_and(|uuid| uuid.to_string() == id), "invalid reload ID");
            anyhow::ensure!(base == active, "stale base revision: expected {active}, received {base}");
            let revision = Revision::load(&revision_root(std::path::Path::new(&self.cfg.content_pack_path)), candidate)?;
            self.spawn_config.validate_content(&revision.pack)?;
            if candidate != active {
                validate_live(&self.state, &self.intents, self.content.as_ref(), &revision.pack)?;
            }
            Ok(revision)
        })();
        let revision = match validation {
            Ok(revision) => revision,
            Err(error) => {
                transition(&mut operation, "rejected");
                operation["error"] = json!({"stage":"validation","code":if base != active { "stale_base_revision" } else { "incompatible_content" },"message":format!("{error:#}")});
                self.redis.save_content_reload_operation(&operation, false).await?;
                self.redis.acknowledge_content_reload().await?; return Ok(());
            }
        };
        if candidate == active {
            transition(&mut operation, "no_change");
            self.redis.save_content_reload_operation(&operation, false).await?;
            self.redis.acknowledge_content_reload().await?; return Ok(());
        }
        for status in ["ready", "activating"] {
            transition(&mut operation, status);
            self.redis.save_content_reload_operation(&operation, false).await?;
        }
        let payload = revision.payload(id, self.state.tick);
        transition(&mut operation, "active"); operation["activated_tick"] = json!(self.state.tick);
        // No world mutation before the single coherent accepted-publication transaction.
        if let Err(error) = self.commit_content_checkpoint(&payload, &operation).await {
            operation["transitions"].as_array_mut().unwrap().pop();
            transition(&mut operation, "failed");
            operation["error"] = json!({"stage":"activation","code":"publication_failed","message":error.to_string()});
            self.redis.save_content_reload_operation(&operation, false).await?;
            self.redis.acknowledge_content_reload().await?; return Ok(());
        }
        self.install_content_revision(revision);
        if let Err(error) = self.redis.notify_content_revision(&payload).await {
            operation["error"] = json!({"stage":"notification","code":"event_publish_failed","message":error.to_string()});
            if let Err(diagnostic_error) = self.redis.save_content_reload_operation(&operation, false).await {
                warn!(?diagnostic_error, "failed to persist accepted content notification diagnostic");
            }
            warn!(?error, "accepted content notification failed");
        }
        self.redis.acknowledge_content_reload().await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use prost::Message;
    fn setup() -> (ContentPack, GameState, IntentManager) {
        let pack = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/content/entities.yaml")).unwrap();
        let state = GameState { discovered_entities: Default::default(), generation: Default::default(), tick: 42,
            technologies: [("alice".into(), ["space_age".into()].into())].into(),
            entities: vec![pb::Entity { id: 91, entity_type_id: "worker".into(), owner_player_id: "alice".into(),
                health: pack.get("worker").unwrap().health, pos: Some(pb::Vec2 { x: 23.0, y: 45.0 }), ..Default::default() }] };
        let intents = IntentManager::new(pack.entity_types.clone(), 0.75, 1.0);
        (pack, state, intents)
    }
    #[test]
    fn speed_change_is_live_compatible() {
        let (pack, state, intents) = setup();
        let mut candidate = pack.clone(); candidate.entity_types.get_mut("worker").unwrap().speed *= 2.0;
        validate_live(&state, &intents, Some(&pack), &candidate).unwrap();
    }
    #[test]
    fn live_type_health_stock_and_completed_technology_removals_are_rejected() {
        let (pack, mut state, intents) = setup();
        super::super::state::set_resource_amount(&mut state.entities[0], "minerals", 8.0);
        for change in 0..4 {
            let mut candidate = pack.clone();
            match change {
                0 => { candidate.entity_types.remove("worker"); }
                1 => { candidate.entity_types.get_mut("worker").unwrap().health = 0.5; }
                2 => { candidate.entity_types.get_mut("worker").unwrap().max_capacity.insert("minerals".into(), 7.0); }
                _ => { candidate.technologies.remove("space_age"); }
            }
            assert!(validate_live(&state, &intents, Some(&pack), &candidate).is_err());
        }
    }
    #[test]
    fn active_build_dependency_cannot_be_removed() {
        let (pack, state, mut intents) = setup();
        let target = pack.get("worker").unwrap().builds.first().unwrap().entity_type_id.clone();
        intents.current_action.insert(91, super::super::intent::ActiveIntent {
            action: pb::ActionState { exec: Some(pb::action_state::Exec::Build(pb::BuildState { blueprint_id: target.clone(), ..Default::default() })), ..Default::default() },
            metadata: super::super::intent::IntentMetadata { entity_id: 0, intent_id: vec![], client_cmd_id: vec![], player_id: "alice".into(),
                protocol_version: 21, server_tick: 40, policy: pb::IntentPolicy::ReplaceActive },
        });
        let mut candidate = pack.clone(); candidate.entity_types.get_mut("worker").unwrap().builds.retain(|build| build.entity_type_id != target);
        assert!(validate_live(&state, &intents, Some(&pack), &candidate).is_err());
    }

    /// Runs production engine initialization, boundary activation, Redis publication,
    /// protobuf checkpointing, and restart against an explicitly supplied disposable Redis.
    #[tokio::test]
    #[ignore = "requires CONTENT_RELOAD_TEST_REDIS_URL pointing at disposable Redis"]
    async fn durable_reload_activation_rejection_no_change_stale_and_restart() -> Result<()> {
        use redis::AsyncCommands;
        let url = std::env::var("CONTENT_RELOAD_TEST_REDIS_URL").context("set CONTENT_RELOAD_TEST_REDIS_URL")?;
        let repo = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let temp = std::env::temp_dir().join(format!("bitwars-live-reload-{}", uuid::Uuid::now_v7()));
        std::fs::create_dir_all(&temp)?;
        let path = temp.join("entities.yaml");
        std::fs::copy(repo.join("packages/content/entities.yaml"), &path)?;
        let game_id = format!("content-reload-test-{}", uuid::Uuid::now_v7());
        let mut cfg = crate::config::GameConfig {
            game_id: game_id.clone(), redis_url: url.clone(), content_pack_path: path.to_string_lossy().into_owned(),
            spawn_config_path: repo.join("services/rts-engine/config/spawn.yaml").to_string_lossy().into_owned(),
            ..Default::default()
        };
        let mut engine = Engine::new(cfg.clone()).await?;
        let mut connection = redis::Client::open(url)?.get_multiplexed_async_connection().await?;
        let prefix = format!("rts:match:{game_id}:content_reload");
        let initial = engine.content.as_ref().unwrap().content_hash.clone();
        let worker_id = engine.state.entities.iter().map(|entity| entity.id).max().unwrap_or(0) + 1;
        let mut worker = pb::Entity { id: worker_id, entity_type_id: "worker".into(), owner_player_id: "alice".into(),
            pos: Some(pb::Vec2 { x: 23.0, y: 45.0 }), health: 100.0, ..Default::default() };
        super::super::state::set_resource_amount(&mut worker, "minerals", 8.0);
        engine.state.entities.push(worker);
        engine.state.technologies.insert("alice".into(), ["space_age".into()].into());
        engine.scenario_runtime.paused = true;
        let before: Vec<_> = engine.state.entities.iter().map(Message::encode_to_vec).collect();
        let tick = engine.state.tick;
        let original: Value = serde_yaml::from_slice(&std::fs::read(&path)?)?;
        let mut changed = original.clone();
        changed["entity_types"]["worker"]["speed"] = json!(123);
        std::fs::write(&path, serde_yaml::to_string(&changed)?)?;
        let accepted = Revision::bootstrap(&path)?.pack.content_hash;

        async fn enqueue(connection: &mut redis::aio::MultiplexedConnection, prefix: &str, base: &str, candidate: &str) -> Result<String> {
            let id = uuid::Uuid::now_v7().to_string();
            let mut operation = json!({"reload_id":id,"base_revision":base,"candidate_revision":candidate,
                "requested_by":"engine-integration-test","requested_at":super::super::current_unix_ms(),"transitions":[]});
            transition(&mut operation, "staged");
            let request = serde_json::to_string(&operation)?;
            let _: () = redis::pipe().atomic()
                .cmd("HSET").arg(format!("{prefix}:operations")).arg(&id).arg(&request).ignore()
                .cmd("LPUSH").arg(format!("{prefix}:history")).arg(&id).ignore()
                .cmd("RPUSH").arg(format!("{prefix}:queue")).arg(&request).ignore()
                .query_async(connection).await?;
            Ok(id)
        }
        let accepted_id = enqueue(&mut connection, &prefix, &initial, &accepted).await?;
        engine.process_content_reload().await?;
        assert_eq!(engine.content.as_ref().unwrap().content_hash, accepted);
        assert_eq!(engine.intents.entity_types["worker"].speed, 123.0);
        assert_eq!(engine.state.tick, tick);
        assert_eq!(engine.state.entities.iter().map(Message::encode_to_vec).collect::<Vec<_>>(), before);
        let operation = engine.redis.content_reload_operation(&accepted_id).await?.unwrap();
        assert_eq!(operation["status"], "active");
        assert_eq!(operation["transitions"].as_array().unwrap().iter().map(|step| step["status"].as_str().unwrap()).collect::<Vec<_>>(),
            ["staged", "validating", "ready", "activating", "active"]);
        let bytes: Vec<u8> = connection.get(format!("snapshot:{game_id}")).await?;
        assert_eq!(pb::Snapshot::decode(bytes.as_slice())?.content_revision, accepted);
        let active: String = connection.get(format!("{prefix}:active")).await?;
        let active: Value = serde_json::from_str(&active)?;
        let version: String = connection.get(format!("rts:match:{game_id}:content_version")).await?;
        assert_eq!(active["content_revision"], version);
        let no_change = enqueue(&mut connection, &prefix, &accepted, &accepted).await?;
        engine.process_content_reload().await?;
        assert_eq!(engine.redis.content_reload_operation(&no_change).await?.unwrap()["status"], "no_change");
        let stale = enqueue(&mut connection, &prefix, &initial, &initial).await?;
        engine.process_content_reload().await?;
        assert_eq!(engine.redis.content_reload_operation(&stale).await?.unwrap()["error"]["code"], "stale_base_revision");
        changed["entity_types"]["worker"]["max_capacity"]["minerals"] = json!(7);
        std::fs::write(&path, serde_yaml::to_string(&changed)?)?;
        let bad = Revision::bootstrap(&path)?.pack.content_hash;
        let rejected = enqueue(&mut connection, &prefix, &accepted, &bad).await?;
        engine.process_content_reload().await?;
        assert_eq!(engine.redis.content_reload_operation(&rejected).await?.unwrap()["status"], "rejected");
        assert_eq!(engine.content.as_ref().unwrap().content_hash, accepted);
        assert_eq!(engine.state.entities.iter().map(Message::encode_to_vec).collect::<Vec<_>>(), before);
        let interrupted_id = enqueue(&mut connection, &prefix, &accepted, &initial).await?;
        let mut interrupted = engine.redis.content_reload_operation(&interrupted_id).await?.unwrap();
        transition(&mut interrupted, "validating");
        engine.redis.save_content_reload_operation(&interrupted, false).await?;
        // Mutable source is now incompatible; restart must use the accepted checkpoint manifest.
        drop(engine);
        cfg.restore_gamestate = true;
        let mut restored = Engine::new(cfg).await?;
        assert_eq!(restored.content.as_ref().unwrap().content_hash, accepted);
        assert_eq!(restored.state.entities.iter().map(Message::encode_to_vec).collect::<Vec<_>>(), before);
        assert_eq!(restored.intents.entity_types["worker"].speed, 123.0);
        let interrupted = restored.redis.content_reload_operation(&interrupted_id).await?.unwrap();
        assert_eq!(interrupted["status"], "failed");
        assert_eq!(interrupted["error"]["code"], "engine_restarted");
        drop(restored);
        let mut keys: Vec<String> = connection.keys(format!("rts:match:{game_id}:*")).await?;
        keys.extend([format!("snapshot:{game_id}"), format!("snapshot_meta:{game_id}")]);
        let _: usize = connection.del(keys).await?;
        std::fs::remove_dir_all(temp)?;
        Ok(())
    }
}
