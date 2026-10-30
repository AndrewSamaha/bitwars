//! Scenario commands are applied between ticks; validation precedes replacement.
use super::*;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

/// Build and place the requester before replacing any live state.
fn regenerated_world(
    config: &SpawnConfig,
    content: &ContentPack,
    player_id: &str,
    rng: &mut impl Rng,
) -> Result<GameState> {
    config.validate_content(content)?;
    let mut state = init_world(config);
    spawn_celestial_field(&mut state.entities, content, config, rng);
    let loadout = rng.gen_range(0..config.loadouts.len());
    generation::spawn_player(&mut state, content, config, player_id, loadout, rng)
        .context("could not place requesting player in regenerated world")?;
    Ok(state)
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Scenario {
    pub version: u32,
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub players: Vec<String>,
    #[serde(default)]
    pub technologies: BTreeMap<String, Vec<String>>,
    pub entities: Vec<ScenarioEntity>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub captured_tick: Option<u64>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ScenarioEntity {
    pub id: u64,
    pub entity_type: String,
    pub owner: String,
    pub position: Point,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub health: Option<f32>,
    #[serde(default)]
    pub resources: BTreeMap<String, f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_deposit: Option<ScenarioResourceDeposit>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cargo: Option<Cargo>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Point {
    pub x: f32,
    pub y: f32,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Cargo {
    pub resource: String,
    pub amount: f32,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ScenarioResourceDeposit {
    pub amount: f64,
    pub remaining: f64,
}

impl From<&pb::ResourceDeposit> for ScenarioResourceDeposit {
    fn from(deposit: &pb::ResourceDeposit) -> Self {
        Self { amount: deposit.amount, remaining: deposit.remaining }
    }
}

#[derive(Default, Serialize, Deserialize)]
pub(super) struct ScenarioRuntime {
    pub run_id: String,
    pub scenario_id: Option<String>,
    pub paused: bool,
    #[serde(default)]
    pub tick: u64,
    #[serde(default)]
    pub steps: u32,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Command {
    request_id: String,
    action: String,
    run_id: String,
    player_id: String,
    #[serde(default)]
    yaml: Option<String>,
    #[serde(default)]
    bindings: BTreeMap<String, String>,
    #[serde(default)]
    ticks: Option<u32>,
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    entity_ids: Option<Vec<u64>>,
    #[serde(default)]
    center: Option<Point>,
    #[serde(default)]
    radius: Option<f32>,
}

impl Scenario {
    fn materialize(
        &self,
        content: &ContentPack,
        spawn_config: &crate::spawn_config::SpawnConfig,
        bindings: &BTreeMap<String, String>,
    ) -> Result<GameState> {
        if self.version != 1 || self.id.is_empty() || self.name.is_empty() {
            bail!("scenario requires version 1, id and name");
        }
        let mut slots = HashSet::new();
        for slot in &self.players {
            if slot.is_empty() || slot == "universe" || slot == "raiders" || !slots.insert(slot) {
                bail!("invalid or duplicate player slot: {slot}");
            }
            let owner = bindings
                .get(slot)
                .ok_or_else(|| anyhow!("missing binding for player slot {slot}"))?;
            Uuid::parse_str(owner).context("player bindings must be UUIDs")?;
        }
        if bindings.keys().any(|slot| !slots.contains(slot)) {
            bail!("binding references unknown player slot");
        }
        if self.entities.len() > 5000 {
            bail!("scenario limit is 5000 entities");
        }
        let mut ids = HashSet::new();
        let mut entities = Vec::new();
        for source in &self.entities {
            if source.id == 0 || source.id > 9_007_199_254_740_991 || !ids.insert(source.id) {
                bail!("invalid or duplicate entity id: {}", source.id);
            }
            let def = content
                .get(&source.entity_type)
                .ok_or_else(|| anyhow!("unknown entity type: {}", source.entity_type))?;
            if !source.position.x.is_finite() || !source.position.y.is_finite() {
                bail!("position must be finite");
            }
            let owner = match source.owner.as_str() {
                "universe" | "raiders" => source.owner.clone(),
                slot => bindings
                    .get(slot)
                    .ok_or_else(|| anyhow!("unknown owner slot: {slot}"))?
                    .clone(),
            };
            let health = source.health.unwrap_or(def.health);
            if !health.is_finite() || health <= 0.0 || health > def.health {
                bail!("invalid health on entity {}", source.id);
            }
            let resource_deposit = match &source.resource_deposit {
                Some(deposit) => {
                    if def.resource_node.is_none()
                        || !deposit.amount.is_finite()
                        || !deposit.remaining.is_finite()
                        || deposit.amount < 0.0
                        || deposit.remaining < 0.0
                        || deposit.remaining > deposit.amount
                    {
                        bail!("invalid resource deposit on entity {}", source.id);
                    }
                    Some(pb::ResourceDeposit { amount: deposit.amount, remaining: deposit.remaining })
                }
                None => super::state::fixed_resource_deposit(&source.entity_type, content, Some(spawn_config)),
            };
            let mut entity = pb::Entity {
                id: source.id,
                entity_type_id: source.entity_type.clone(),
                owner_player_id: owner,
                health,
                pos: Some(pb::Vec2 {
                    x: source.position.x,
                    y: source.position.y,
                }),
                vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                supply: None,
                resource_deposit,
                resources: None,
            };
            // Saved legacy stock may exceed capacity; only inflows enforce capacity.
            for (resource, amount) in &source.resources {
                if !content.resource_types.contains_key(resource)
                    || !amount.is_finite()
                    || *amount < 0.0
                    || (*amount > 0.0 && resource_capacity(content, &source.entity_type, resource) <= 0.0)
                {
                    bail!(
                        "invalid resource {resource} on entity {} (check capacity)",
                        source.id
                    );
                }
                set_resource_amount(&mut entity, resource, *amount);
            }
            if let Some(cargo) = &source.cargo {
                if def.collector.is_none()
                    || !content.resource_types.contains_key(&cargo.resource)
                    || !cargo.amount.is_finite()
                    || cargo.amount < 0.0
                    || resource_capacity(content, &source.entity_type, &cargo.resource) <= 0.0
                {
                    bail!("invalid legacy cargo on entity {}", source.id);
                }
                // Preserve legacy shipments, even if the combined stock exceeds capacity.
                let amount = resource_amount(&entity, &cargo.resource) + cargo.amount as f64;
                set_resource_amount(&mut entity, &cargo.resource, amount);
            }
            entities.push(entity);
        }
        entities.sort_by_key(|entity| entity.id);
        let mut technologies = HashMap::new();
        for (slot, techs) in &self.technologies {
            let owner = bindings
                .get(slot)
                .ok_or_else(|| anyhow!("unknown technology owner slot {slot}"))?;
            for tech in techs {
                if !content.technologies.contains_key(tech) {
                    bail!("unknown technology: {tech}");
                }
            }
            technologies.insert(owner.clone(), techs.iter().cloned().collect());
        }
        Ok(GameState { discovered_entities: Default::default(), generation: super::generation::GenerationState { version: 1, ..Default::default() }, tick: 0, entities, technologies })
    }
}

impl Engine {
    pub(super) async fn initialize_runtime(&mut self, restore: bool) -> Result<()> {
        if restore {
            if let Some(value) = self.redis.read_runtime().await? {
                self.scenario_runtime = serde_json::from_str(&value)?;
            }
            if self.scenario_runtime.scenario_id.is_some() {
                if let Some(value) = self.redis.read_scenario_template().await? {
                    self.loaded_scenario = Some(serde_json::from_str(&value)?);
                }
            }
        }
        self.scenario_runtime.steps = 0;
        if self.scenario_runtime.run_id.is_empty() {
            self.scenario_runtime.run_id = Uuid::now_v7().to_string();
        }
        self.publish_runtime().await
    }
    async fn publish_runtime(&mut self) -> Result<()> {
        self.scenario_runtime.tick = self.state.tick;
        self.redis.run_id = self.scenario_runtime.run_id.clone();
        self.redis.scenario_mode = self.scenario_runtime.scenario_id.is_some();
        self.redis
            .publish_runtime(&serde_json::to_string(&self.scenario_runtime)?)
            .await
    }
    async fn scenario_snapshot(&mut self) -> Result<()> {
        self.redis.run_id = self.scenario_runtime.run_id.clone();
        self.redis.scenario_mode = self.scenario_runtime.scenario_id.is_some();
        let collectors = self.collector_states_for_stream();
        let effects = self.combat_effect_states_for_stream();
        self.redis
            .publish_snapshot(
                &self.state,
                &self.resource_spend_total,
                &self.resource_gain_total,
                self.last_delta_id.as_deref().unwrap_or("0-0"),
                collectors,
                effects,
                self.intents.convoys.clone(),
                self.intents.move_orders_for_snapshot(),
                self.intents.sentries.clone(),
                self.intents.escorts.clone(),
                self.intents.collection_orders_for_snapshot(),
            )
            .await?;
        self.publish_runtime().await
    }
    async fn replace_scenario(
        &mut self,
        scenario: Scenario,
        bindings: BTreeMap<String, String>,
    ) -> Result<()> {
        // Validate and allocate everything that can fail before touching the live world.
        let content = self
            .content
            .as_ref()
            .ok_or_else(|| anyhow!("content unavailable"))?;
        let state = scenario.materialize(content, &self.spawn_config, &bindings)?;
        self.replace_world(state, self.spawn_config.clone(), Some((scenario, bindings))).await
    }

    async fn respawn_world(&mut self, player_id: &str) -> Result<()> {
        let config = SpawnConfig::load(std::path::Path::new(&self.cfg.spawn_config_path))?;
        let content = self.content.as_ref().ok_or_else(|| anyhow!("content unavailable"))?;
        let state = regenerated_world(&config, content, player_id, &mut rand::thread_rng())?;
        self.replace_world(state, config, None).await
    }

    async fn replace_world(
        &mut self,
        state: GameState,
        config: SpawnConfig,
        scenario: Option<(Scenario, BTreeMap<String, String>)>,
    ) -> Result<()> {
        let content = self.content.as_ref().ok_or_else(|| anyhow!("content unavailable"))?;
        let intents = IntentManager::new(
            content.entity_types.clone(),
            self.cfg.default_stop_radius,
            self.cfg.default_entity_speed,
        );
        let raider_script = RaiderScript::new()?;
        let run_id = Uuid::now_v7().to_string();
        self.redis.reset_scenario_tracking().await?;
        self.state = state;
        self.spawn_config = config;
        self.prev_state = self.state.clone();
        self.intents = intents;
        self.raider_script = raider_script;
        self.combat = CombatSystem::default();
        self.last_intent_id = "0-0".into();
        self.player_last_seq.clear();
        self.lifecycle_emitted.clear();
        self.build_progress_stamps.clear();
        self.previous_build_progress_owners.clear();
        self.last_build_progress_publish_at = tokio::time::Instant::now();
        self.joined_players = match &scenario {
            Some((_, bindings)) => bindings.values().cloned().collect(),
            None => self.state.generation.starts.keys().cloned().collect(),
        };
        self.transport_node_by_entity.clear();
        self.transport_wait_since_tick_by_entity.clear();
        self.resource_spend_total.clear();
        self.resource_gain_total.clear();
        self.collector_ui_state_by_entity.clear();
        self.prev_collector_ui_state_by_entity.clear();
        self.collection_retry_tick_by_entity.clear();
        self.combat_effect_ui_state_by_entity.clear();
        self.prev_combat_effect_ui_state_by_entity.clear();
        self.scenario_runtime = ScenarioRuntime {
            run_id,
            scenario_id: scenario.as_ref().map(|(s, _)| s.id.clone()),
            paused: scenario.is_some(),
            tick: 0,
            steps: 0,
        };
        self.loaded_scenario = scenario;
        // Clear the saved template as well when returning to procedural play.
        self.redis
            .save_scenario_template(&serde_json::to_string(&self.loaded_scenario)?)
            .await?;
        self.scenario_snapshot().await?;
        self.last_delta_id = Some(
            self.redis
                .publish_world_reset(&self.scenario_runtime.run_id)
                .await?,
        );
        // A bootstrap with the new run ID ignores its own reset marker.
        self.scenario_snapshot().await
    }
    fn capture_scenario(&self, cmd: &Command) -> Result<Scenario> {
        let id = cmd
            .id
            .clone()
            .ok_or_else(|| anyhow!("bookmark requires id"))?;
        if cmd.center.is_some() != cmd.radius.is_some() {
            bail!("area capture requires both center and radius");
        }
        if let Some(radius) = cmd.radius {
            if !radius.is_finite() || radius <= 0.0 {
                bail!("radius must be positive");
            }
        }
        if let Some(center) = &cmd.center {
            if !center.x.is_finite() || !center.y.is_finite() {
                bail!("center must be finite");
            }
        }
        if let Some(ids) = &cmd.entity_ids {
            if ids.is_empty()
                || ids
                    .iter()
                    .any(|id| !self.state.entities.iter().any(|entity| entity.id == *id))
            {
                bail!("entity selection contains missing entities or is empty");
            }
        }
        let selected: Vec<_> = self
            .state
            .entities
            .iter()
            .filter(|entity| {
                if let Some(ids) = &cmd.entity_ids {
                    if !ids.contains(&entity.id) {
                        return false;
                    }
                }
                if let (Some(center), Some(radius), Some(pos)) =
                    (&cmd.center, cmd.radius, &entity.pos)
                {
                    if (pos.x - center.x).hypot(pos.y - center.y) > radius {
                        return false;
                    }
                }
                true
            })
            .collect();
        if selected.is_empty() {
            bail!("capture contains no entities");
        }
        let mut owners: Vec<_> = selected
            .iter()
            .filter(|entity| is_player_owner(&entity.owner_player_id))
            .map(|entity| entity.owner_player_id.clone())
            .collect();
        owners.sort();
        owners.dedup();
        // The requesting player's slot is always first for convenient loading.
        owners.retain(|owner| owner != &cmd.player_id);
        owners.insert(0, cmd.player_id.clone());
        let slots: BTreeMap<_, _> = owners
            .into_iter()
            .enumerate()
            .map(|(i, owner)| (owner, format!("player{}", i + 1)))
            .collect();
        let mut entities: Vec<_> = selected
            .iter()
            .map(|entity| ScenarioEntity {
                id: entity.id,
                entity_type: entity.entity_type_id.clone(),
                owner: slots
                    .get(&entity.owner_player_id)
                    .cloned()
                    .unwrap_or(entity.owner_player_id.clone()),
                position: Point {
                    x: entity.pos.as_ref().map_or(0.0, |p| p.x),
                    y: entity.pos.as_ref().map_or(0.0, |p| p.y),
                },
                health: Some(entity.health),
                resource_deposit: entity.resource_deposit.as_ref().map(Into::into),
                resources: entity
                    .resources
                    .as_ref()
                    .map(|inventory| {
                        inventory
                            .resources
                            .iter()
                            .map(|entry| (entry.resource_type.clone(), entry.amount))
                            .collect()
                    })
                    .unwrap_or_default(),
                cargo: None,
            })
            .collect();
        entities.sort_by_key(|entity| entity.id);
        let mut players: Vec<_> = slots.values().cloned().collect();
        players.sort_by_key(|slot| slot[6..].parse::<usize>().unwrap_or(0));
        let technologies = slots
            .iter()
            .map(|(owner, slot)| {
                let mut techs: Vec<_> = self
                    .state
                    .technologies
                    .get(owner)
                    .into_iter()
                    .flatten()
                    .cloned()
                    .collect();
                techs.sort();
                (slot.clone(), techs)
            })
            .collect();
        Ok(Scenario {
            version: 1,
            id: id.clone(),
            name: id,
            tags: cmd.tags.clone(),
            players,
            technologies,
            entities,
            captured_tick: Some(self.state.tick),
        })
    }
    async fn execute_scenario_command(&mut self, cmd: &Command) -> Result<serde_json::Value> {
        if cmd.run_id != self.scenario_runtime.run_id {
            bail!("world changed; refresh and retry");
        }
        Uuid::parse_str(&cmd.player_id).context("invalid player id")?;
        match cmd.action.as_str() {
            "world_respawn" => self.respawn_world(&cmd.player_id).await?,
            "validate" | "load" => {
                let scenario: Scenario = serde_yaml::from_str(
                    cmd.yaml
                        .as_deref()
                        .ok_or_else(|| anyhow!("yaml required"))?,
                )?;
                let mut bindings = cmd.bindings.clone();
                if let Some(slot) = scenario.players.first() {
                    bindings.insert(slot.clone(), cmd.player_id.clone());
                }
                scenario.materialize(
                    self.content
                        .as_ref()
                        .ok_or_else(|| anyhow!("content unavailable"))?,
                    &self.spawn_config,
                    &bindings,
                )?;
                if cmd.action == "load" {
                    self.replace_scenario(scenario, bindings).await?;
                }
            }
            "reload" => {
                let (mut scenario, mut bindings) = self
                    .loaded_scenario
                    .clone()
                    .ok_or_else(|| anyhow!("no scenario loaded"))?;
                if let Some(yaml) = &cmd.yaml {
                    scenario = serde_yaml::from_str(yaml)?;
                }
                bindings.retain(|slot, _| scenario.players.contains(slot));
                bindings.extend(cmd.bindings.clone());
                if let Some(slot) = scenario.players.first() {
                    bindings.insert(slot.clone(), cmd.player_id.clone());
                }
                self.replace_scenario(scenario, bindings).await?;
            }
            "pause" => {
                self.scenario_runtime.paused = true;
                self.scenario_runtime.steps = 0;
                self.scenario_snapshot().await?;
            }
            "resume" => {
                self.scenario_runtime.paused = false;
                self.scenario_runtime.steps = 0;
                self.publish_runtime().await?;
            }
            "step" => {
                let ticks = cmd.ticks.unwrap_or(1);
                if !(1..=1200).contains(&ticks) || !self.scenario_runtime.paused {
                    bail!("step requires a paused game and 1..1200 ticks");
                }
                if self.scenario_runtime.steps > 0 {
                    bail!("a step is already in progress");
                }
                self.scenario_runtime.steps = ticks;
            }
            "bookmark" => {
                return Ok(
                    serde_json::json!({ "yaml": serde_yaml::to_string(&self.capture_scenario(cmd)?)?, "runtime": self.scenario_runtime }),
                )
            }
            _ => bail!("unknown scenario action"),
        }
        self.publish_runtime().await?;
        Ok(serde_json::json!({ "runtime": self.scenario_runtime }))
    }
    pub(super) async fn process_scenario_controls(&mut self) -> Result<bool> {
        self.redis.publish_engine_heartbeat().await?;
        // ponytail: one global world, at most eight controls per tick; isolate worlds if concurrent scenarios become necessary.
        for _ in 0..8 {
            let Some(raw) = self.redis.pop_scenario_command().await? else {
                break;
            };
            match serde_json::from_str::<Command>(&raw) {
                Ok(cmd) => {
                    let result = match self.execute_scenario_command(&cmd).await {
                        Ok(value) => serde_json::json!({ "ok": true, "result": value }),
                        Err(error) => {
                            serde_json::json!({ "ok": false, "error": format!("{error:#}") })
                        }
                    };
                    self.redis
                        .publish_scenario_result(&cmd.request_id, &result.to_string())
                        .await?;
                }
                Err(error) => warn!(%error, "invalid scenario command"),
            }
        }
        if self.scenario_runtime.paused {
            if self.scenario_runtime.steps == 0 {
                return Ok(false);
            }
            self.scenario_runtime.steps -= 1;
        }
        Ok(true)
    }
    pub(super) async fn finish_scenario_tick(&mut self) -> Result<()> {
        if self.scenario_runtime.paused {
            self.scenario_snapshot().await?;
        } else if self.state.tick % (self.cfg.tps as u64).max(1) == 0 {
            self.publish_runtime().await?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod inventory_tests {
    use super::*;

    fn spawn_config() -> crate::spawn_config::SpawnConfig {
        crate::spawn_config::SpawnConfig::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("config/spawn.yaml")).unwrap()
    }

    #[test]
    fn regenerated_world_uses_config_and_commits_requester_start() {
        use rand::SeedableRng;
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let mut config = spawn_config();
        config.global_neutral_fields.retain(|f| f.entity_type_id == "star_yellow" || f.entity_type_id == "theta");
        let player = Uuid::now_v7().to_string();
        let state = regenerated_world(&config, &content, &player, &mut rand::rngs::StdRng::seed_from_u64(42)).unwrap();
        assert_eq!(state.tick, 0);
        assert!(state.generation.starts.contains_key(&player));
        assert!(state.generation.pending.is_empty());
        assert!(state.entities.iter().any(|e| e.owner_player_id == player));
        for kind in ["star_yellow", "theta"] {
            let expected: usize = config.global_neutral_fields.iter().filter(|f| f.entity_type_id == kind).map(|f| f.count).sum();
            let actual = state.entities.iter().filter(|e| e.entity_type_id == kind).count();
            assert!(actual >= expected); // Start fallback can add an extra star.
        }
        config.resource_amounts.get_mut("planet_blue").unwrap().average = 0.0;
        assert!(regenerated_world(&config, &content, &player, &mut rand::rngs::StdRng::seed_from_u64(42)).is_err());
    }

    #[test]
    fn scenario_resource_stock_uses_configured_average_without_randomness() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let scenario: Scenario = serde_yaml::from_str(r#"
version: 1
id: deposits
name: Deposits
players: []
entities:
  - {id: 1, entity_type: minerals, owner: universe, position: {x: 0, y: 0}}
  - {id: 2, entity_type: planet_blue, owner: universe, position: {x: 500, y: 0}}
  - {id: 3, entity_type: dead_planet_blue, owner: universe, position: {x: 1000, y: 0}}
  - {id: 4, entity_type: star_yellow, owner: universe, position: {x: 2000, y: 0}}
"#).unwrap();
        let mut config = spawn_config();
        config.resource_amounts.get_mut("minerals").unwrap().average = 12345.0;
        for _ in 0..2 {
            let state = scenario.materialize(&content, &config, &BTreeMap::new()).unwrap();
            for (entity, amount) in state.entities.iter().zip([Some(12345.0), Some(10000.0), Some(1000.0), None]) {
                assert_eq!(entity.resource_deposit.map(|d| d.amount), amount);
                assert_eq!(entity.resource_deposit.map(|d| d.remaining), amount);
            }
        }
    }

    #[test]
    fn scenario_deposit_round_trip_preserves_sampled_maximum_and_depletion() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let mut scenario: Scenario = serde_yaml::from_str(r#"
version: 1
id: depleted-planet
name: Depleted planet
players: []
entities:
  - {id: 973, entity_type: planet_blue, owner: universe, position: {x: 0, y: 0}}
"#).unwrap();
        for remaining in [5597.209548398094, 1.0, 0.0] {
            let original = pb::ResourceDeposit { amount: 7774.054089483202, remaining };
            // Use the same conversion as bookmark capture, then persist and reload YAML.
            scenario.entities[0].resource_deposit = Some((&original).into());
            let yaml = serde_yaml::to_string(&scenario).unwrap();
            let restored: Scenario = serde_yaml::from_str(&yaml).unwrap();
            let state = restored.materialize(&content, &spawn_config(), &BTreeMap::new()).unwrap();
            assert_eq!(state.entities[0].resource_deposit.as_ref(), Some(&original));
        }
        for (amount, remaining) in [(-1.0, 0.0), (10.0, -1.0), (10.0, 11.0),
            (f64::NAN, 0.0), (10.0, f64::INFINITY)] {
            scenario.entities[0].resource_deposit = Some(ScenarioResourceDeposit { amount, remaining });
            assert!(scenario.materialize(&content, &spawn_config(), &BTreeMap::new()).is_err());
        }
        scenario.entities[0].entity_type = "worker".into();
        scenario.entities[0].resource_deposit = Some(ScenarioResourceDeposit { amount: 10.0, remaining: 5.0 });
        assert!(scenario.materialize(&content, &spawn_config(), &BTreeMap::new()).is_err());
    }

    #[test]
    fn legacy_scenario_cargo_merges_and_over_capacity_inventory_can_reload() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let mut scenario: Scenario = serde_yaml::from_str(r#"
version: 1
id: inventory-migration
name: Inventory migration
players: [player1]
entities:
  - id: 1
    entity_type: worker
    owner: player1
    position: {x: 0, y: 0}
    resources: {food: 48}
    cargo: {resource: food, amount: 50}
"#).unwrap();
        let bindings = BTreeMap::from([("player1".into(), Uuid::now_v7().to_string())]);
        let state = scenario.materialize(&content, &spawn_config(), &bindings).unwrap();
        assert_eq!(resource_amount(&state.entities[0], "food"), 98.0);
        scenario.entities[0].cargo = None;
        scenario.entities[0].resources.insert("food".into(), 98.0);
        let state = scenario.materialize(&content, &spawn_config(), &bindings).unwrap();
        assert_eq!(resource_amount(&state.entities[0], "food"), 98.0);
        scenario.entities[0].resources.insert("food".into(), f64::NAN);
        assert!(scenario.materialize(&content, &spawn_config(), &bindings).is_err());
    }

    #[test]
    fn bundled_scenarios_validate_with_shared_inventory() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/content/scenarios");
        for entry in std::fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.extension().and_then(|extension| extension.to_str()) != Some("yaml") { continue; }
            let scenario: Scenario = serde_yaml::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
            let bindings = scenario.players.iter().map(|slot| (slot.clone(), Uuid::now_v7().to_string())).collect();
            scenario.materialize(&content, &spawn_config(), &bindings).unwrap_or_else(|error| panic!("{}: {error}", path.display()));
        }
    }
}
