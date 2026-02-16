pub mod intent;
pub mod state;

use std::collections::{HashMap, HashSet};

use anyhow::{anyhow, bail, Context, Result};
use rand::Rng;
use tokio::time::{interval, Duration, Instant};
use tracing::{error, info, warn};
use uuid::{Uuid, Version};

use crate::config::GameConfig;
use crate::content::{CollectionMode, ContentPack};
use crate::delta::compute_delta;
use crate::engine::intent::{format_uuid, IntentManager, IntentMetadata};
use crate::io::redis::RedisClient;
use crate::io::telemetry::Telemetry;
use crate::pb::{self, intent_envelope};
use crate::physics::integrate;
use crate::spawn_config::SpawnConfig;
use crate::spawn_config::NEUTRAL_OWNER;
use prost::Message;
use state::{init_world, log_sample, on_player_spawn, GameState};

pub const ENGINE_PROTOCOL_MAJOR: u32 = 4;
const DEDUPE_TTL_SECS: usize = 600;
const DEPOSIT_DISTANCE: f32 = 80.0;

#[derive(Clone, Debug)]
struct CarryState {
    resource_type: String,
    amount: f32,
}

#[derive(Clone)]
struct ResourceNodeSnapshot {
    id: u64,
    x: f32,
    y: f32,
    resource_type: String,
    mode: CollectionMode,
    min_effective_distance: f32,
    max_effective_distance: f32,
}

#[derive(Clone)]
struct RefinerySnapshot {
    id: u64,
    entity_type_id: String,
    owner_player_id: String,
    x: f32,
    y: f32,
    accepts: Vec<String>,
}

#[derive(Clone)]
struct CollectorSnapshot {
    id: u64,
    entity_type_id: String,
    owner_player_id: String,
    x: f32,
    y: f32,
}

fn ensure_uuid_v7(bytes: &[u8], field: &str) -> Result<()> {
    if bytes.len() != 16 {
        bail!("{field} must be 16 bytes (UUIDv7)");
    }

    let uuid = Uuid::from_slice(bytes)
        .with_context(|| format!("{field} must contain valid UUID bytes"))?;

    if uuid.get_version() != Some(Version::SortRand) {
        let version = uuid
            .get_version()
            .map(|v| format!("{:?}", v))
            .unwrap_or_else(|| "unknown".to_string());
        bail!("{field} must be a UUIDv7 (found version {version})");
    }

    Ok(())
}

#[cfg(test)]
mod uuid_tests {
    use super::*;

    #[test]
    fn ensure_uuid_v7_accepts_valid_uuid() {
        let uuid = Uuid::now_v7();
        ensure_uuid_v7(uuid.as_bytes(), "test-field").expect("valid UUIDv7 should pass");
    }

    #[test]
    fn ensure_uuid_v7_rejects_wrong_length() {
        let err =
            ensure_uuid_v7(&[0u8; 15], "test-field").expect_err("length mismatch should fail");
        assert!(err.to_string().contains("16 bytes"));
    }

    #[test]
    fn ensure_uuid_v7_rejects_wrong_version() {
        let uuid_nil = Uuid::nil();
        let err = ensure_uuid_v7(uuid_nil.as_bytes(), "test-field")
            .expect_err("wrong version should fail");
        assert!(err.to_string().contains("UUIDv7"));
    }
}

/// Load spawn config from cfg.spawn_config_path. Exits the process if path is empty or load fails.
fn load_spawn_config_or_exit(cfg: &GameConfig) -> SpawnConfig {
    if cfg.spawn_config_path.is_empty() {
        eprintln!("FATAL: SPAWN_CONFIG_PATH is not set. The engine requires a spawn config (config-based init only).");
        std::process::exit(1);
    }
    match SpawnConfig::load(std::path::Path::new(&cfg.spawn_config_path)) {
        Ok(sc) => {
            if !sc.is_valid() {
                eprintln!(
                    "FATAL: Spawn config at {} is invalid (e.g. no loadouts).",
                    cfg.spawn_config_path
                );
                std::process::exit(1);
            }
            info!(spawn_config = ?sc, "spawn config loaded");
            sc
        }
        Err(e) => {
            eprintln!(
                "FATAL: Failed to load spawn config from {}: {}",
                cfg.spawn_config_path, e
            );
            std::process::exit(1);
        }
    }
}

pub struct Engine {
    cfg: GameConfig,
    content: Option<ContentPack>,
    spawn_config: SpawnConfig,
    state: GameState,
    prev_state: GameState,
    last_delta_id: Option<String>,
    redis: RedisClient,
    intents: IntentManager,
    last_intent_id: String,
    player_last_seq: HashMap<String, u64>,
    lifecycle_emitted: HashSet<(Vec<u8>, pb::LifecycleState)>,
    telemetry: Option<Telemetry>,
    /// M6: Players that have already been given a spawn (idempotency).
    joined_players: HashSet<String>,
    /// M8: In-flight transport-mode carry amounts per collector entity.
    carry_by_entity: HashMap<u64, CarryState>,
    /// M8: Fractional per-player resources accumulated between integer ledger commits.
    resource_fractional: HashMap<(String, String), f32>,
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    use prost::Message;
    use redis::Value as RedisValue;
    use std::path::Path;
    use uuid::Uuid;

    fn test_redis_url() -> String {
        std::env::var("TEST_REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string())
    }

    /// Paths to spawn config and content pack (must exist when test runs from crate root).
    fn test_spawn_and_content_paths() -> (String, String) {
        let manifest = Path::new(env!("CARGO_MANIFEST_DIR"));
        let spawn = manifest.join("config/spawn.example.yaml");
        let content = manifest.join("../../packages/content/entities.yaml");
        (
            spawn.to_string_lossy().into_owned(),
            content.to_string_lossy().into_owned(),
        )
    }

    #[tokio::test]
    #[ignore = "requires Redis server (set TEST_REDIS_URL)"]
    #[allow(deprecated)]
    async fn lifecycle_sequence_for_move_intent() -> Result<()> {
        let redis_url = test_redis_url();
        let game_id = format!("itest-{}", Uuid::now_v7());
        let events_stream = format!("rts:match:{}:events", game_id);
        let intents_stream = format!("rts:match:{}:intents", game_id);
        let pending_joins_key = format!("rts:match:{}:pending_joins", game_id);

        let client = redis::Client::open(redis_url.clone())?;
        let mut conn = client.get_multiplexed_async_connection().await?;
        redis::cmd("DEL")
            .arg(&events_stream)
            .arg(&intents_stream)
            .query_async::<_, ()>(&mut conn)
            .await?;
        drop(conn);

        let (spawn_path, content_path) = test_spawn_and_content_paths();
        let mut cfg = GameConfig::default();
        cfg.game_id = game_id.clone();
        cfg.redis_url = redis_url.clone();
        cfg.spawn_config_path = spawn_path;
        cfg.content_pack_path = content_path;

        let mut engine = Engine::new(cfg).await?;
        assert!(
            engine.state.entities.is_empty(),
            "config-based init starts with no entities"
        );

        let mut rconn = client.get_multiplexed_async_connection().await?;
        redis::cmd("RPUSH")
            .arg(&pending_joins_key)
            .arg("player-1")
            .query_async::<_, ()>(&mut rconn)
            .await?;
        drop(rconn);
        engine.run_one_tick().await?;

        let entity = engine
            .state
            .entities
            .first()
            .cloned()
            .expect("world should have at least one entity after run_one_tick (spawn on join)");

        let move_intent = pb::MoveToLocationIntent {
            entity_id: entity.id,
            target: entity.pos.clone(),
            client_cmd_id: String::new(),
            player_id: String::new(),
        };

        let envelope = pb::IntentEnvelope {
            client_cmd_id: Uuid::now_v7().into_bytes().to_vec(),
            intent_id: Vec::new(),
            player_id: "player-1".to_string(),
            client_seq: 1,
            server_tick: 0,
            protocol_version: ENGINE_PROTOCOL_MAJOR,
            policy: pb::IntentPolicy::ReplaceActive as i32,
            payload: Some(intent_envelope::Payload::Move(move_intent)),
        };

        // M1: handle_envelope now activates the intent and emits
        // RECEIVED, ACCEPTED, and IN_PROGRESS internally.
        engine.handle_envelope(envelope).await?;

        // follow_targets should finish the intent (entity already at target)
        let finished =
            engine
                .intents
                .follow_targets(&mut engine.state, engine.cfg.default_entity_speed, 0.0);
        for (_, metadata) in finished {
            engine
                .emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Finished,
                    pb::LifecycleReason::None,
                    engine.state.tick,
                )
                .await?;
        }

        engine.state.tick += 1;

        let mut read_conn = redis::Client::open(redis_url.clone())?
            .get_multiplexed_async_connection()
            .await?;
        let reply: RedisValue = redis::cmd("XRANGE")
            .arg(&events_stream)
            .arg("-")
            .arg("+")
            .query_async(&mut read_conn)
            .await?;

        let mut states = Vec::new();
        if let RedisValue::Bulk(entries) = reply {
            for entry in entries {
                if let RedisValue::Bulk(parts) = entry {
                    if let Some(RedisValue::Bulk(fieldvals)) = parts.get(1) {
                        let mut i = 0;
                        while i + 1 < fieldvals.len() {
                            if let (RedisValue::Data(field), RedisValue::Data(value)) =
                                (&fieldvals[i], &fieldvals[i + 1])
                            {
                                if field == b"data" {
                                    if let Ok(record) =
                                        pb::EventsStreamRecord::decode(value.as_slice())
                                    {
                                        if let Some(pb::events_stream_record::Record::Lifecycle(
                                            event,
                                        )) = record.record
                                        {
                                            if let Some(state) =
                                                pb::LifecycleState::from_i32(event.state)
                                            {
                                                states.push(state);
                                            }
                                        }
                                    }
                                }
                            }
                            i += 2;
                        }
                    }
                }
            }
        }

        assert_eq!(
            states,
            vec![
                pb::LifecycleState::Received,
                pb::LifecycleState::Accepted,
                pb::LifecycleState::InProgress,
                pb::LifecycleState::Finished,
            ]
        );

        Ok(())
    }
}

impl Engine {
    pub async fn new(cfg: GameConfig) -> anyhow::Result<Self> {
        let mut redis = RedisClient::connect(&cfg.redis_url, cfg.game_id.clone()).await?;
        let telemetry = Telemetry::from_env()?;
        if let Some(ref t) = telemetry {
            info!(dataset = t.dataset(), "axiom telemetry enabled");
        }

        // M4: Load content pack if configured
        let content = if !cfg.content_pack_path.is_empty() {
            let pack = ContentPack::load(std::path::Path::new(&cfg.content_pack_path))?;
            info!(
                content_hash = %pack.content_hash,
                entity_types = pack.entity_types.len(),
                "loaded content pack"
            );
            Some(pack)
        } else {
            info!("no CONTENT_PACK_PATH set; using default entity stats");
            None
        };

        let default_stop_radius = cfg.default_stop_radius;
        let default_speed = cfg.default_entity_speed;
        let entity_types = content
            .as_ref()
            .map(|c| c.entity_types.clone())
            .unwrap_or_default();

        if cfg.restore_gamestate {
            // ── Restore mode: load latest snapshot + replay intents since boundary ──
            info!(game_id = %cfg.game_id, "RESTORE_GAMESTATE_ON_RESTART=true; attempting restore");

            if let Some((state, boundary)) = redis.read_latest_snapshot().await? {
                info!(
                    tick = state.tick,
                    boundary = %boundary,
                    entities = state.entities.len(),
                    "restored world from snapshot"
                );

                // M2: Restore per-player last-processed seq from Redis so that
                // client_seq validation works correctly after restart.  Active
                // intents are NOT restored into IntentManager (they are lost on
                // restart); clear the tracking hash so the reconnect handshake
                // reports entities as idle.
                let tracking = redis.read_all_tracking().await?;
                let mut player_last_seq = HashMap::new();
                for (pid, seq) in &tracking.player_seqs {
                    info!(player_id = %pid, last_seq = seq, "restored player_last_seq");
                    player_last_seq.insert(pid.clone(), *seq);
                }
                if !tracking.active_intents.is_empty() {
                    info!(
                        count = tracking.active_intents.len(),
                        "clearing stale active_intents (intents lost on restart)"
                    );
                    // Clear each entry so reconnect handshake sees entities as idle
                    for entry in &tracking.active_intents {
                        let _ = redis.clear_active_intent(entry.entity_id).await;
                    }
                }

                // Start reading intents from the boundary so any intents that arrived
                // after the snapshot are replayed during the first ticks.
                let last_intent_id = boundary.clone();

                // M6: Restore joined_players from entities (distinct owner_player_id != neutral)
                let joined_players: HashSet<String> = state
                    .entities
                    .iter()
                    .filter_map(|e| {
                        let o = e.owner_player_id.as_str();
                        if o.is_empty() || o == NEUTRAL_OWNER {
                            None
                        } else {
                            Some(o.to_string())
                        }
                    })
                    .collect();
                let spawn_config_restore = load_spawn_config_or_exit(&cfg);

                let mut engine = Self {
                    prev_state: state.clone(),
                    state,
                    last_delta_id: if boundary == "0-0" {
                        None
                    } else {
                        Some(boundary)
                    },
                    content,
                    spawn_config: spawn_config_restore,
                    cfg,
                    redis,
                    intents: IntentManager::new(
                        entity_types.clone(),
                        default_stop_radius,
                        default_speed,
                    ),
                    last_intent_id,
                    player_last_seq,
                    lifecycle_emitted: HashSet::new(),
                    telemetry,
                    joined_players,
                    carry_by_entity: HashMap::new(),
                    resource_fractional: HashMap::new(),
                };
                // Publish a fresh snapshot so newly connecting clients see current state
                let snap_boundary = engine.last_delta_id.as_deref().unwrap_or("0-0");
                engine
                    .redis
                    .publish_snapshot(&engine.state, snap_boundary)
                    .await?;

                // M4: Publish content hash + definitions in restore path too
                if let Some(ref pack) = engine.content {
                    engine
                        .redis
                        .publish_content_version(&pack.content_hash)
                        .await?;
                    let json = pack.to_json()?;
                    engine.redis.publish_content_defs(&json).await?;
                }

                return Ok(engine);
            }

            warn!("no snapshot found in Redis; falling back to fresh world");
            // Fall through to clean-start path
        }

        // ── Clean-start mode (default): flush Redis and generate fresh world ──
        info!(game_id = %cfg.game_id, "clean start; flushing game streams");
        redis.flush_game_streams().await?;

        let spawn_config = load_spawn_config_or_exit(&cfg);
        info!(
            path = %cfg.spawn_config_path,
            loadouts = spawn_config.loadouts.len(),
            "loaded spawn config"
        );

        let state = init_world(&spawn_config);
        info!(
            "Initialized world: entities={}, tps={}, friction={}",
            state.entities.len(),
            cfg.tps,
            cfg.friction
        );

        let mut engine = Self {
            prev_state: state.clone(),
            state,
            last_delta_id: None,
            content,
            spawn_config,
            cfg,
            redis,
            intents: IntentManager::new(entity_types, default_stop_radius, default_speed),
            // Stream is empty after flush, so "0-0" is correct
            last_intent_id: "0-0".to_string(),
            player_last_seq: HashMap::new(),
            lifecycle_emitted: HashSet::new(),
            telemetry,
            joined_players: HashSet::new(),
            carry_by_entity: HashMap::new(),
            resource_fractional: HashMap::new(),
        };
        engine.redis.publish_snapshot(&engine.state, "0-0").await?;

        // M4: Publish content hash + definitions to Redis
        if let Some(ref pack) = engine.content {
            engine
                .redis
                .publish_content_version(&pack.content_hash)
                .await?;
            let json = pack.to_json()?;
            engine.redis.publish_content_defs(&json).await?;
        }

        Ok(engine)
    }

    /// M6: Spawn for one player on join (idempotent). Picks a procedural spawn location and random loadout.
    fn ensure_spawned(&mut self, player_id: &str) -> Result<()> {
        if self.joined_players.contains(player_id) {
            return Ok(());
        }
        let sc = &self.spawn_config;
        let _content = match &self.content {
            Some(c) => c,
            None => {
                warn!(
                    player_id = %player_id,
                    "skip spawn: no content pack loaded (set CONTENT_PACK_PATH)"
                );
                return Ok(());
            }
        };

        let mut rng = rand::thread_rng();
        let angle = rng.gen_range(0.0..std::f32::consts::TAU);
        let dist = rng.gen_range(0.0..sc.max_distance_from_origin);
        let spawn_x = sc.origin_x() + angle.cos() * dist;
        let spawn_y = sc.origin_y() + angle.sin() * dist;

        let loadout_idx = rand::thread_rng().gen_range(0..sc.loadouts.len());
        let loadout = &sc.loadouts[loadout_idx];

        let next_id = self.state.entities.iter().map(|e| e.id).max().unwrap_or(0) + 1;

        let entity_count_before = self.state.entities.len();

        let mut rng = rand::thread_rng();
        on_player_spawn(
            &mut self.state.entities,
            next_id,
            player_id,
            spawn_x,
            spawn_y,
            loadout,
            sc.min_entity_spawn_distance,
            sc.max_entity_spawn_distance,
            &sc.neutrals_near_spawn,
            &mut rng,
        );

        let spawned: Vec<(u64, String)> = self.state.entities[entity_count_before..]
            .iter()
            .map(|e| (e.id, e.entity_type_id.clone()))
            .collect();
        info!(
            player_id = %player_id,
            spawn_x = %spawn_x,
            spawn_y = %spawn_y,
            entity_count = spawned.len(),
            entities = ?spawned,
            "spawned on join"
        );

        // M7: Grant starting resources from spawn config (deterministic).
        if !sc.starting_resources.is_empty() {
            let resources = self.state.ledger.entry(player_id.to_string()).or_default();
            for (resource_type, amount) in &sc.starting_resources {
                *resources.entry(resource_type.clone()).or_insert(0) += amount;
            }
        }

        self.joined_players.insert(player_id.to_string());
        Ok(())
    }

    /// M4: Resolve entity_type_id for the target entity of an intent.
    fn resolve_entity_type_id(&self, intent: &pb::Intent) -> String {
        let entity_id = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.entity_id,
            Some(pb::intent::Kind::Attack(a)) => a.entity_id,
            Some(pb::intent::Kind::Build(b)) => b.entity_id,
            None => return String::new(),
        };
        self.state
            .entities
            .iter()
            .find(|e| e.id == entity_id)
            .map(|e| e.entity_type_id.clone())
            .unwrap_or_default()
    }

    fn credit_resource(&mut self, player_id: &str, resource_type: &str, amount: f32) {
        if amount <= 0.0 {
            return;
        }
        let key = (player_id.to_string(), resource_type.to_string());
        let total = self.resource_fractional.get(&key).copied().unwrap_or(0.0) + amount;
        let whole = total.floor() as i64;
        let remainder = total - whole as f32;
        if whole > 0 {
            let ledger = self.state.ledger.entry(player_id.to_string()).or_default();
            *ledger.entry(resource_type.to_string()).or_insert(0) += whole;
        }
        if remainder > 0.0 {
            self.resource_fractional.insert(key, remainder);
        } else {
            self.resource_fractional.remove(&key);
        }
    }

    fn clear_fractional_for_entity(&mut self, entity_id: u64) {
        if let Some(carry) = self.carry_by_entity.remove(&entity_id) {
            if carry.amount > 0.0 {
                // Keep deterministic accounting by dropping sub-unit carry on despawn/loss.
                warn!(entity_id, resource_type = %carry.resource_type, amount = carry.amount, "dropping carry due to missing collector entity");
            }
        }
    }

    fn build_resource_node_snapshots(&self) -> Vec<ResourceNodeSnapshot> {
        let Some(content) = self.content.as_ref() else {
            return Vec::new();
        };
        let mut nodes = Vec::new();
        for e in &self.state.entities {
            let Some(pos) = e.pos.as_ref() else {
                continue;
            };
            let Some(entity_type) = content.get(&e.entity_type_id) else {
                continue;
            };
            let Some(node) = entity_type.resource_node.as_ref() else {
                continue;
            };
            nodes.push(ResourceNodeSnapshot {
                id: e.id,
                x: pos.x,
                y: pos.y,
                resource_type: node.resource_type.clone(),
                mode: node.collection_mode.clone(),
                min_effective_distance: node.min_effective_distance.max(0.0),
                max_effective_distance: node
                    .max_effective_distance
                    .max(node.min_effective_distance.max(0.0)),
            });
        }
        nodes.sort_by_key(|n| n.id);
        nodes
    }

    fn build_refinery_snapshots(&self) -> Vec<RefinerySnapshot> {
        let Some(content) = self.content.as_ref() else {
            return Vec::new();
        };
        let mut refineries = Vec::new();
        for e in &self.state.entities {
            let owner = e.owner_player_id.as_str();
            if owner.is_empty() || owner == NEUTRAL_OWNER {
                continue;
            }
            let Some(pos) = e.pos.as_ref() else {
                continue;
            };
            let Some(entity_type) = content.get(&e.entity_type_id) else {
                continue;
            };
            let Some(refinery) = entity_type.refinery.as_ref() else {
                continue;
            };
            refineries.push(RefinerySnapshot {
                id: e.id,
                entity_type_id: e.entity_type_id.clone(),
                owner_player_id: e.owner_player_id.clone(),
                x: pos.x,
                y: pos.y,
                accepts: refinery.accepts.clone(),
            });
        }
        refineries.sort_by_key(|r| r.id);
        refineries
    }

    fn build_collector_snapshots(&self) -> Vec<CollectorSnapshot> {
        let Some(content) = self.content.as_ref() else {
            return Vec::new();
        };
        let mut collectors = Vec::new();
        for e in &self.state.entities {
            let owner = e.owner_player_id.as_str();
            if owner.is_empty() || owner == NEUTRAL_OWNER {
                continue;
            }
            let Some(pos) = e.pos.as_ref() else {
                continue;
            };
            let Some(entity_type) = content.get(&e.entity_type_id) else {
                continue;
            };
            if entity_type.collector.is_none() {
                continue;
            }
            collectors.push(CollectorSnapshot {
                id: e.id,
                entity_type_id: e.entity_type_id.clone(),
                owner_player_id: e.owner_player_id.clone(),
                x: pos.x,
                y: pos.y,
            });
        }
        collectors.sort_by_key(|c| c.id);
        collectors
    }

    fn distance_sq(ax: f32, ay: f32, bx: f32, by: f32) -> f32 {
        let dx = ax - bx;
        let dy = ay - by;
        dx * dx + dy * dy
    }

    fn pick_best_node<'a>(
        collector: &CollectorSnapshot,
        nodes: &'a [ResourceNodeSnapshot],
        mode: CollectionMode,
        collects: &[String],
    ) -> Option<&'a ResourceNodeSnapshot> {
        nodes
            .iter()
            .filter(|n| n.mode == mode && collects.iter().any(|r| r == &n.resource_type))
            .min_by(|a, b| {
                let da = Self::distance_sq(collector.x, collector.y, a.x, a.y);
                let db = Self::distance_sq(collector.x, collector.y, b.x, b.y);
                da.partial_cmp(&db)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| a.id.cmp(&b.id))
            })
    }

    fn pick_best_refinery<'a>(
        collector: &CollectorSnapshot,
        refineries: &'a [RefinerySnapshot],
        resource_type: &str,
        allowed_entity_types: &[String],
    ) -> Option<&'a RefinerySnapshot> {
        refineries
            .iter()
            .filter(|r| r.owner_player_id == collector.owner_player_id)
            .filter(|r| r.accepts.iter().any(|v| v == resource_type))
            .filter(|r| {
                allowed_entity_types.is_empty()
                    || allowed_entity_types
                        .iter()
                        .any(|et| et == &r.entity_type_id)
            })
            .min_by(|a, b| {
                let da = Self::distance_sq(collector.x, collector.y, a.x, a.y);
                let db = Self::distance_sq(collector.x, collector.y, b.x, b.y);
                da.partial_cmp(&db)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| a.id.cmp(&b.id))
            })
    }

    fn drive_velocity_toward(
        entity: &mut pb::Entity,
        speed: f32,
        target_x: f32,
        target_y: f32,
        stop_distance: f32,
    ) {
        let Some(pos) = entity.pos.as_ref() else {
            return;
        };
        let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
        let dx = target_x - pos.x;
        let dy = target_y - pos.y;
        let dist_sq = dx * dx + dy * dy;
        let stop_sq = stop_distance * stop_distance;
        if dist_sq <= stop_sq {
            vel.x = 0.0;
            vel.y = 0.0;
            return;
        }
        let dist = dist_sq.sqrt();
        if dist <= f32::EPSILON {
            vel.x = 0.0;
            vel.y = 0.0;
            return;
        }
        vel.x = (dx / dist) * speed;
        vel.y = (dy / dist) * speed;
    }

    fn drive_velocity_to_band(
        entity: &mut pb::Entity,
        speed: f32,
        anchor_x: f32,
        anchor_y: f32,
        min_distance: f32,
        max_distance: f32,
    ) {
        let Some(pos) = entity.pos.as_ref() else {
            return;
        };
        let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
        let dx = anchor_x - pos.x;
        let dy = anchor_y - pos.y;
        let dist_sq = dx * dx + dy * dy;
        let dist = dist_sq.sqrt();
        if dist >= min_distance && dist <= max_distance {
            vel.x = 0.0;
            vel.y = 0.0;
            return;
        }
        if dist <= f32::EPSILON {
            vel.x = speed;
            vel.y = 0.0;
            return;
        }
        if dist > max_distance {
            vel.x = (dx / dist) * speed;
            vel.y = (dy / dist) * speed;
        } else {
            vel.x = -(dx / dist) * speed;
            vel.y = -(dy / dist) * speed;
        }
    }

    fn apply_resource_collection(&mut self, dt: f32) {
        if self.content.is_none() {
            return;
        }
        let active_entities: HashSet<u64> = self.intents.active_intents().keys().copied().collect();
        let collectors = self.build_collector_snapshots();
        let nodes = self.build_resource_node_snapshots();
        let refineries = self.build_refinery_snapshots();
        let collector_ids: HashSet<u64> = collectors.iter().map(|c| c.id).collect();
        let stale_carry_ids: Vec<u64> = self
            .carry_by_entity
            .keys()
            .copied()
            .filter(|id| !collector_ids.contains(id))
            .collect();
        for id in stale_carry_ids {
            self.clear_fractional_for_entity(id);
        }

        for collector in collectors {
            if active_entities.contains(&collector.id) {
                continue;
            }
            let Some(def) = self
                .content
                .as_ref()
                .and_then(|content| content.get(&collector.entity_type_id))
                .cloned()
            else {
                continue;
            };
            let Some(collector_def) = def.collector else {
                continue;
            };
            let speed = def.speed.max(0.0);

            // Transport mode: carry->deposit has priority when carrying.
            let carry_snapshot = self.carry_by_entity.get(&collector.id).cloned();
            if let Some(carry) = carry_snapshot {
                if carry.amount > 0.0 {
                    if let Some(refinery) = Self::pick_best_refinery(
                        &collector,
                        &refineries,
                        &carry.resource_type,
                        &collector_def.deposit_entity_types,
                    ) {
                        let dist =
                            Self::distance_sq(collector.x, collector.y, refinery.x, refinery.y)
                                .sqrt();
                        if dist <= DEPOSIT_DISTANCE {
                            self.credit_resource(
                                &collector.owner_player_id,
                                &carry.resource_type,
                                carry.amount,
                            );
                            self.carry_by_entity.remove(&collector.id);
                            if let Some(entity) = self
                                .state
                                .entities
                                .iter_mut()
                                .find(|e| e.id == collector.id)
                            {
                                let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                                vel.x = 0.0;
                                vel.y = 0.0;
                            }
                            continue;
                        }
                        if let Some(entity) = self
                            .state
                            .entities
                            .iter_mut()
                            .find(|e| e.id == collector.id)
                        {
                            Self::drive_velocity_toward(
                                entity,
                                speed,
                                refinery.x,
                                refinery.y,
                                DEPOSIT_DISTANCE,
                            );
                        }
                        continue;
                    }
                    // No valid refinery: hold position.
                    if let Some(entity) = self
                        .state
                        .entities
                        .iter_mut()
                        .find(|e| e.id == collector.id)
                    {
                        let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                        vel.x = 0.0;
                        vel.y = 0.0;
                    }
                    continue;
                }
            }

            let mut handled_transport = false;
            if let Some(node) = Self::pick_best_node(
                &collector,
                &nodes,
                CollectionMode::Transport,
                &collector_def.collects,
            ) {
                let dist = Self::distance_sq(collector.x, collector.y, node.x, node.y).sqrt();
                if dist >= node.min_effective_distance && dist <= node.max_effective_distance {
                    let gather = collector_def.transport_rate_per_second.max(0.0) * dt;
                    if gather > 0.0 {
                        let carry =
                            self.carry_by_entity
                                .entry(collector.id)
                                .or_insert(CarryState {
                                    resource_type: node.resource_type.clone(),
                                    amount: 0.0,
                                });
                        if carry.resource_type != node.resource_type {
                            carry.resource_type = node.resource_type.clone();
                            carry.amount = 0.0;
                        }
                        carry.amount =
                            (carry.amount + gather).min(collector_def.carry_capacity.max(0.0));
                    }
                    if let Some(entity) = self
                        .state
                        .entities
                        .iter_mut()
                        .find(|e| e.id == collector.id)
                    {
                        let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                        vel.x = 0.0;
                        vel.y = 0.0;
                    }
                } else if let Some(entity) = self
                    .state
                    .entities
                    .iter_mut()
                    .find(|e| e.id == collector.id)
                {
                    Self::drive_velocity_to_band(
                        entity,
                        speed,
                        node.x,
                        node.y,
                        node.min_effective_distance,
                        node.max_effective_distance,
                    );
                }
                handled_transport = true;
            }

            // Proximity mode only when not engaged in transport mode for this tick.
            if handled_transport {
                continue;
            }
            if let Some(node) = Self::pick_best_node(
                &collector,
                &nodes,
                CollectionMode::Proximity,
                &collector_def.collects,
            ) {
                let dist = Self::distance_sq(collector.x, collector.y, node.x, node.y).sqrt();
                if dist >= node.min_effective_distance && dist <= node.max_effective_distance {
                    let rate = collector_def.proximity_rate_per_second.max(0.0) * dt;
                    self.credit_resource(&collector.owner_player_id, &node.resource_type, rate);
                    if let Some(entity) = self
                        .state
                        .entities
                        .iter_mut()
                        .find(|e| e.id == collector.id)
                    {
                        let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                        vel.x = 0.0;
                        vel.y = 0.0;
                    }
                } else if let Some(entity) = self
                    .state
                    .entities
                    .iter_mut()
                    .find(|e| e.id == collector.id)
                {
                    Self::drive_velocity_to_band(
                        entity,
                        speed,
                        node.x,
                        node.y,
                        node.min_effective_distance,
                        node.max_effective_distance,
                    );
                }
            }
        }
    }

    /// Run one tick (for tests). Does not wait for ticker.
    pub async fn run_one_tick(&mut self) -> Result<()> {
        let dt = 1.0 / self.cfg.tps as f32;
        let snapshot_interval = (self.cfg.tps as u64) * self.cfg.snapshot_every_secs;

        // M6: Process pending joins (spawn on join)
        while let Ok(Some(player_id)) = self.redis.pop_next_pending_join().await {
            info!(player_id = %player_id, "processing join from pending_joins");
            if let Err(e) = self.ensure_spawned(&player_id) {
                warn!(player_id = %player_id, error = ?e, "ensure_spawned failed");
            }
        }

        let batch_start = Instant::now();
        let mut cmds_this_tick: u32 = 0;
        let read_count = self.cfg.max_cmds_per_tick as usize;
        if let Ok(Some(entries)) = self
            .redis
            .read_new_intents(&self.last_intent_id, read_count)
            .await
        {
            for (entry_id, bytes) in entries {
                if cmds_this_tick >= self.cfg.max_cmds_per_tick {
                    warn!(
                        tick = self.state.tick,
                        limit = self.cfg.max_cmds_per_tick,
                        "max_cmds_per_tick reached, deferring remaining"
                    );
                    break;
                }
                if self.cfg.max_batch_ms > 0
                    && batch_start.elapsed().as_millis() as u64 >= self.cfg.max_batch_ms
                {
                    warn!(
                        tick = self.state.tick,
                        elapsed_ms = batch_start.elapsed().as_millis() as u64,
                        limit_ms = self.cfg.max_batch_ms,
                        "max_batch_ms reached, deferring remaining"
                    );
                    break;
                }
                if let Err(err) = self.process_raw_intent(bytes.as_slice()).await {
                    warn!(error = ?err, "failed to handle intent payload from Redis");
                }
                cmds_this_tick += 1;
                self.last_intent_id = entry_id;
            }
        }

        let finished =
            self.intents
                .follow_targets(&mut self.state, self.cfg.default_entity_speed, dt);
        for (entity_id, metadata) in finished {
            if let Err(err) = self.redis.clear_active_intent(entity_id).await {
                warn!(error = ?err, entity_id, "failed to clear active intent tracking");
            }
            if let Err(err) = self
                .emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Finished,
                    pb::LifecycleReason::None,
                    self.state.tick,
                )
                .await
            {
                warn!(error = ?err, intent_id = %format_uuid(&metadata.intent_id), "failed to emit FINISHED lifecycle event");
            }
        }
        self.apply_resource_collection(dt);
        integrate(&self.cfg, &mut self.state, dt);
        self.state.tick += 1;

        let delta = compute_delta(
            &self.prev_state,
            &self.state,
            self.cfg.eps_pos,
            self.cfg.eps_vel,
        );
        if !delta.updates.is_empty() {
            if let Ok(id) = self.redis.publish_delta(&delta).await {
                self.last_delta_id = Some(id);
            }
        }
        if self.state.tick % snapshot_interval == 0 {
            let boundary = self.last_delta_id.as_deref().unwrap_or("0-0");
            let _ = self.redis.publish_snapshot(&self.state, boundary).await;
        }
        if self.state.tick % (self.cfg.tps as u64) == 0 {
            log_sample(&self.state);
        }
        self.prev_state = self.state.clone();
        Ok(())
    }

    pub async fn run(&mut self) -> anyhow::Result<()> {
        let dt = 1.0 / self.cfg.tps as f32;
        let mut ticker = interval(Duration::from_micros(
            (1_000_000.0 / self.cfg.tps as f64) as u64,
        ));
        let snapshot_interval = (self.cfg.tps as u64) * self.cfg.snapshot_every_secs;

        loop {
            ticker.tick().await;

            // M6: Process pending joins (spawn on join)
            while let Ok(Some(player_id)) = self.redis.pop_next_pending_join().await {
                info!(player_id = %player_id, "processing join from pending_joins");
                if let Err(e) = self.ensure_spawned(&player_id) {
                    warn!(player_id = %player_id, error = ?e, "ensure_spawned failed");
                }
            }

            // Phase B: Ingest intents from Redis stream (tick-bounded)
            let batch_start = Instant::now();
            let mut cmds_this_tick: u32 = 0;
            let read_count = self.cfg.max_cmds_per_tick as usize;

            if let Ok(Some(entries)) = self
                .redis
                .read_new_intents(&self.last_intent_id, read_count)
                .await
            {
                for (entry_id, bytes) in entries {
                    // Tick-bounded ingress: respect max_cmds_per_tick
                    if cmds_this_tick >= self.cfg.max_cmds_per_tick {
                        warn!(
                            tick = self.state.tick,
                            limit = self.cfg.max_cmds_per_tick,
                            "max_cmds_per_tick reached, deferring remaining"
                        );
                        break;
                    }
                    // Tick-bounded ingress: respect max_batch_ms
                    if self.cfg.max_batch_ms > 0
                        && batch_start.elapsed().as_millis() as u64 >= self.cfg.max_batch_ms
                    {
                        warn!(
                            tick = self.state.tick,
                            elapsed_ms = batch_start.elapsed().as_millis() as u64,
                            limit_ms = self.cfg.max_batch_ms,
                            "max_batch_ms reached, deferring remaining"
                        );
                        break;
                    }

                    if let Err(err) = self.process_raw_intent(bytes.as_slice()).await {
                        warn!(error = ?err, "failed to handle intent payload from Redis");
                    }
                    cmds_this_tick += 1;
                    // Advance cursor per-entry so unprocessed entries are re-read next tick
                    self.last_intent_id = entry_id;
                }
            }

            // M1: No process_pending step. Intents are activated immediately
            // inside handle_envelope via IntentManager::try_activate.

            // Advance currently executing actions (e.g., Move) toward targets
            let finished =
                self.intents
                    .follow_targets(&mut self.state, self.cfg.default_entity_speed, dt);
            for (entity_id, metadata) in finished {
                // M2: clear tracking before emitting lifecycle event
                if let Err(err) = self.redis.clear_active_intent(entity_id).await {
                    warn!(error = ?err, entity_id, "failed to clear active intent tracking");
                }
                if let Err(err) = self
                    .emit_lifecycle_event(
                        &metadata,
                        pb::LifecycleState::Finished,
                        pb::LifecycleReason::None,
                        self.state.tick,
                    )
                    .await
                {
                    warn!(error = ?err, intent_id = %format_uuid(&metadata.intent_id), "failed to emit FINISHED lifecycle event");
                }
            }
            self.apply_resource_collection(dt);
            integrate(&self.cfg, &mut self.state, dt);
            self.state.tick += 1;

            // Delta
            let delta = compute_delta(
                &self.prev_state,
                &self.state,
                self.cfg.eps_pos,
                self.cfg.eps_vel,
            );
            if !delta.updates.is_empty() {
                match self.redis.publish_delta(&delta).await {
                    Ok(id) => self.last_delta_id = Some(id),
                    Err(e) => error!(?e, "delta publish failed"),
                }
            }
            // Periodic snapshot
            if self.state.tick % snapshot_interval == 0 {
                let boundary = self.last_delta_id.as_deref().unwrap_or("0-0");
                if let Err(e) = self.redis.publish_snapshot(&self.state, boundary).await {
                    error!(?e, "snapshot publish failed");
                }
            }

            // Log once per second
            if self.state.tick % (self.cfg.tps as u64) == 0 {
                log_sample(&self.state);
            }

            self.prev_state = self.state.clone();
        }
    }

    async fn process_raw_intent(&mut self, bytes: &[u8]) -> Result<()> {
        match pb::IntentEnvelope::decode(bytes) {
            Ok(envelope) => self.handle_envelope(envelope).await,
            Err(_) => {
                // Legacy fallback to bare Intent
                let intent = pb::Intent::decode(bytes)?;
                self.handle_legacy_intent(intent).await
            }
        }
    }

    async fn handle_envelope(&mut self, envelope: pb::IntentEnvelope) -> Result<()> {
        let accept_tick = self.state.tick;
        let player_id = envelope.player_id.clone();
        let client_seq = envelope.client_seq;
        let protocol_version = envelope.protocol_version;
        let intent_id = if envelope.intent_id.is_empty() {
            Uuid::now_v7().into_bytes().to_vec()
        } else {
            envelope.intent_id.clone()
        };
        let client_cmd_id = envelope.client_cmd_id.clone();

        let policy =
            pb::IntentPolicy::try_from(envelope.policy).unwrap_or(pb::IntentPolicy::ReplaceActive);

        let metadata = IntentMetadata {
            intent_id: intent_id.clone(),
            client_cmd_id: client_cmd_id.clone(),
            player_id: player_id.clone(),
            protocol_version,
            server_tick: accept_tick,
            policy,
        };

        self.emit_lifecycle_event(
            &metadata,
            pb::LifecycleState::Received,
            pb::LifecycleReason::None,
            accept_tick,
        )
        .await?;

        if let Err(validation_err) = ensure_uuid_v7(&client_cmd_id, "client_cmd_id") {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::InvalidTarget,
                accept_tick,
            )
            .await?;
            warn!(
                player_id = %player_id,
                error = ?validation_err,
                "invalid client_cmd_id (expected UUIDv7)"
            );
            return Err(validation_err);
        }

        if !envelope.intent_id.is_empty() {
            if let Err(validation_err) = ensure_uuid_v7(&intent_id, "intent_id") {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                    accept_tick,
                )
                .await?;
                warn!(
                    player_id = %player_id,
                    error = ?validation_err,
                    "invalid intent_id (expected UUIDv7)"
                );
                return Err(validation_err);
            }
        }

        if protocol_version != ENGINE_PROTOCOL_MAJOR {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::ProtocolMismatch,
                accept_tick,
            )
            .await?;
            warn!(player_id = %player_id, expected = ENGINE_PROTOCOL_MAJOR, got = protocol_version, "protocol mismatch");
            return Err(anyhow!("protocol mismatch"));
        }

        // Per-player client_seq validation (skip for legacy intents with seq=0)
        if client_seq > 0 {
            if let Some(last_seq) = self.player_last_seq.get(&player_id).copied() {
                if client_seq <= last_seq {
                    self.emit_lifecycle_event(
                        &metadata,
                        pb::LifecycleState::Rejected,
                        pb::LifecycleReason::OutOfOrder,
                        accept_tick,
                    )
                    .await?;
                    warn!(player_id = %player_id, client_seq, last_seq, "dropping out-of-order intent");
                    return Err(anyhow!("out of order"));
                }
            }
        }

        if let Some(existing_intent_id) = self
            .redis
            .existing_intent_for_cmd(&player_id, &client_cmd_id)
            .await?
        {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::Duplicate,
                accept_tick,
            )
            .await?;
            warn!(player_id = %player_id, existing_intent_id = %format_uuid(&existing_intent_id), "duplicate client_cmd_id received");
            return Err(anyhow!("duplicate command"));
        }

        // Update seq tracking (only for non-zero seq values)
        if client_seq > 0 {
            self.player_last_seq.insert(player_id.clone(), client_seq);
            // M2: persist to Redis so reconnect handshake can report last_processed_client_seq
            self.redis
                .persist_player_seq(&player_id, client_seq)
                .await?;
        }
        self.redis
            .store_client_cmd(&player_id, &client_cmd_id, &intent_id, DEDUPE_TTL_SECS)
            .await?;

        let payload_intent = match envelope.payload {
            Some(intent_envelope::Payload::Move(m)) => {
                info!(entity_id = m.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, "accept intent=Move");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(m)),
                }
            }
            Some(intent_envelope::Payload::Attack(a)) => {
                info!(entity_id = a.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, target_id = a.target_id, "accept intent=Attack");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Attack(a)),
                }
            }
            Some(intent_envelope::Payload::Build(b)) => {
                if let Some(loc) = b.location.as_ref() {
                    info!(entity_id = b.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, blueprint_id = b.blueprint_id, loc_x = loc.x, loc_y = loc.y, "accept intent=Build");
                } else {
                    info!(entity_id = b.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, blueprint_id = b.blueprint_id, "accept intent=Build (missing location)");
                }
                pb::Intent {
                    kind: Some(pb::intent::Kind::Build(b)),
                }
            }
            None => {
                warn!(player_id = %player_id, "envelope missing payload");
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                    accept_tick,
                )
                .await?;
                return Err(anyhow!("envelope missing payload"));
            }
        };

        // M6: Ownership check — reject if entity not owned by issuing player.
        let entity_id = match payload_intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.entity_id,
            Some(pb::intent::Kind::Attack(a)) => a.entity_id,
            Some(pb::intent::Kind::Build(b)) => b.entity_id,
            None => {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                    accept_tick,
                )
                .await?;
                return Err(anyhow!("intent missing kind"));
            }
        };
        let entity_owner = self
            .state
            .entities
            .iter()
            .find(|e| e.id == entity_id)
            .map(|e| e.owner_player_id.clone());
        match entity_owner {
            None => {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                    accept_tick,
                )
                .await?;
                warn!(entity_id = entity_id, player_id = %player_id, "rejected: entity not found");
                return Err(anyhow!("entity not found"));
            }
            Some(owner) if owner != player_id => {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::NotOwned,
                    accept_tick,
                )
                .await?;
                warn!(
                    entity_id = entity_id,
                    player_id = %player_id,
                    owner = %owner,
                    "rejected: entity not owned by player"
                );
                return Err(anyhow!("entity not owned"));
            }
            Some(_) => {}
        }

        // M4: Look up entity_type_id for per-type stat resolution.
        let entity_type_id = self.resolve_entity_type_id(&payload_intent);

        // M1: Try to activate immediately (no server-side queue).
        let outcome = self
            .intents
            .try_activate(payload_intent, metadata.clone(), &entity_type_id);

        // M2: Clear tracking for any preempted intents, then emit CANCELED
        for (entity_id, canceled_metadata) in outcome.canceled.iter() {
            self.redis.clear_active_intent(*entity_id).await?;
            self.emit_lifecycle_event(
                canceled_metadata,
                pb::LifecycleState::Canceled,
                pb::LifecycleReason::Interrupted,
                self.state.tick,
            )
            .await?;
        }

        if outcome.rejected_busy {
            // M1: APPEND / CLEAR_THEN_APPEND when entity is busy -> REJECTED(ENTITY_BUSY)
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::EntityBusy,
                accept_tick,
            )
            .await?;
            warn!(
                player_id = %player_id,
                intent_id = %format_uuid(&metadata.intent_id),
                policy = ?metadata.policy,
                "rejected: entity busy (client should hold in local queue)"
            );
            return Err(anyhow!("entity busy"));
        }

        if let Some((entity_id, _)) = outcome.started {
            // M2: persist active intent to Redis for reconnect tracking
            self.redis
                .persist_active_intent(entity_id, &metadata, self.cfg.tracking_ttl_secs)
                .await?;

            // Emit ACCEPTED then immediately IN_PROGRESS (M1: no intermediate queue)
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Accepted,
                pb::LifecycleReason::None,
                accept_tick,
            )
            .await?;

            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::InProgress,
                pb::LifecycleReason::None,
                accept_tick,
            )
            .await?;
        }

        Ok(())
    }

    async fn handle_legacy_intent(&mut self, intent: pb::Intent) -> Result<()> {
        let payload = match intent.kind.clone() {
            Some(pb::intent::Kind::Move(m)) => intent_envelope::Payload::Move(m),
            Some(pb::intent::Kind::Attack(a)) => intent_envelope::Payload::Attack(a),
            Some(pb::intent::Kind::Build(b)) => intent_envelope::Payload::Build(b),
            None => return Err(anyhow!("legacy intent missing kind")),
        };

        let legacy_client_cmd = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Attack(a)) => a.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Build(b)) => b.client_cmd_id.as_str(),
            None => "",
        };

        let client_cmd_bytes = match Uuid::parse_str(legacy_client_cmd) {
            Ok(uuid) if uuid.get_version() == Some(Version::SortRand) => uuid.into_bytes().to_vec(),
            Ok(uuid) => {
                warn!(
                    client_cmd_id = %uuid,
                    "legacy client_cmd_id not UUIDv7; generating replacement"
                );
                Uuid::now_v7().into_bytes().to_vec()
            }
            Err(_) => Uuid::now_v7().into_bytes().to_vec(),
        };

        let player_id = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.player_id.clone(),
            Some(pb::intent::Kind::Attack(a)) => a.player_id.clone(),
            Some(pb::intent::Kind::Build(b)) => b.player_id.clone(),
            None => String::new(),
        };

        let envelope = pb::IntentEnvelope {
            client_cmd_id: client_cmd_bytes,
            intent_id: Vec::new(),
            player_id: if player_id.is_empty() {
                "legacy".into()
            } else {
                player_id
            },
            client_seq: 0,
            server_tick: 0,
            protocol_version: ENGINE_PROTOCOL_MAJOR,
            policy: pb::IntentPolicy::ReplaceActive as i32,
            payload: Some(payload),
        };

        self.handle_envelope(envelope).await
    }

    async fn emit_lifecycle_event(
        &mut self,
        metadata: &IntentMetadata,
        state: pb::LifecycleState,
        reason: pb::LifecycleReason,
        tick: u64,
    ) -> Result<()> {
        if !self
            .lifecycle_emitted
            .insert((metadata.intent_id.clone(), state))
        {
            return Ok(());
        }
        self.emit_lifecycle_event_raw(
            &metadata.intent_id,
            &metadata.client_cmd_id,
            &metadata.player_id,
            state,
            reason,
            tick,
            metadata.protocol_version,
        )
        .await
    }

    async fn emit_lifecycle_event_raw(
        &mut self,
        intent_id: &[u8],
        client_cmd_id: &[u8],
        player_id: &str,
        state: pb::LifecycleState,
        reason: pb::LifecycleReason,
        tick: u64,
        protocol_version: u32,
    ) -> Result<()> {
        let event = pb::LifecycleEvent {
            intent_id: intent_id.to_vec(),
            client_cmd_id: client_cmd_id.to_vec(),
            player_id: player_id.to_string(),
            server_tick: tick,
            state: state as i32,
            reason: reason as i32,
            protocol_version,
        };
        self.redis
            .publish_lifecycle_event(&event)
            .await
            .context("publish lifecycle event")?;

        if let Some(telemetry) = self.telemetry.as_ref() {
            let intent_id_str = format_uuid(intent_id);
            let client_cmd_id_str = format_uuid(client_cmd_id);
            let state_str = state.as_str_name();
            let reason_str = reason.as_str_name();
            if let Err(err) = telemetry
                .publish_lifecycle_event(
                    &self.cfg.game_id,
                    player_id,
                    &intent_id_str,
                    &client_cmd_id_str,
                    state_str,
                    reason_str,
                    tick,
                    protocol_version,
                )
                .await
            {
                warn!(error = ?err, "failed to publish lifecycle telemetry");
            }
        }

        Ok(())
    }
}
