pub mod intent;
pub mod state;

use std::collections::{HashMap, HashSet};

use anyhow::{anyhow, bail, Context, Result};
use rand::Rng;
use tokio::time::{interval, Duration, Instant};
use tracing::{error, info, warn};
use uuid::{Uuid, Version};

use crate::config::GameConfig;
use crate::combat::CombatSystem;
use crate::content::{CollectionMode, ContentPack, EntityTypeDef, RadiationShieldingDef};
use crate::delta::compute_delta;
use crate::engine::intent::{format_uuid, IntentManager, IntentMetadata};
use crate::io::redis::{CollectorUiState, IntentPoint, RedisClient};
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
const COLLECTOR_ACTIVITY_IDLE: &str = "idle";
const COLLECTOR_ACTIVITY_MOVING_TO_SOURCE: &str = "moving_to_source";
const COLLECTOR_ACTIVITY_GATHERING: &str = "gathering";
const COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF: &str = "moving_to_dropoff";
const COLLECTOR_ACTIVITY_DELIVERING: &str = "delivering";
const COLLECTOR_ACTIVITY_PROXIMITY_COLLECTING: &str = "proximity_collecting";
const BUILD_SPAWN_RADIUS: f32 = 100.0;

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

fn debit_maintenance_without_debt(
    ledger: &mut HashMap<String, HashMap<String, i64>>,
    fractional: &mut HashMap<(String, String), f32>,
    player_id: &str,
    resource_type: &str,
    amount: f32,
) {
    if !amount.is_finite() || amount <= 0.0 {
        return;
    }
    let key = (player_id.to_string(), resource_type.to_string());
    let total = fractional.get(&key).copied().unwrap_or(0.0) + amount;
    let whole = total.floor() as i64;
    let remainder = total - whole as f32;
    if whole <= 0 {
        fractional.insert(key, remainder);
        return;
    }

    let available = ledger
        .get(player_id)
        .and_then(|resources| resources.get(resource_type))
        .copied()
        .unwrap_or(0);
    let paid = available.min(whole);
    if paid > 0 {
        let resources = ledger.entry(player_id.to_string()).or_default();
        *resources.entry(resource_type.to_string()).or_insert(0) -= paid;
    }

    if paid == whole && remainder > 0.0 {
        fractional.insert(key, remainder);
    } else {
        // Any unpaid upkeep is deliberately discarded: maintenance creates no debt.
        fractional.remove(&key);
    }
}

#[cfg(test)]
mod maintenance_tests {
    use super::*;

    #[test]
    fn maintenance_charges_whole_units_and_discards_unaffordable_upkeep() {
        let mut ledger = HashMap::from([(
            "player-1".to_string(),
            HashMap::from([("energy".to_string(), 2_i64)]),
        )]);
        let mut fractional = HashMap::new();

        debit_maintenance_without_debt(
            &mut ledger,
            &mut fractional,
            "player-1",
            "energy",
            2.25,
        );
        assert_eq!(ledger["player-1"]["energy"], 0);
        assert_eq!(
            fractional[&("player-1".to_string(), "energy".to_string())],
            0.25
        );

        debit_maintenance_without_debt(
            &mut ledger,
            &mut fractional,
            "player-1",
            "energy",
            0.75,
        );
        assert_eq!(ledger["player-1"]["energy"], 0);
        assert!(fractional.is_empty());
    }
}

#[derive(Clone)]
struct RadiationSourceSnapshot {
    entity_id: u64,
    x: f32,
    y: f32,
    radiation_type: String,
    min_effective_distance: f32,
    max_effective_distance: f32,
    full_damage_distance: f32,
    damage_per_second: f32,
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

#[cfg(test)]
mod radiation_tests {
    use super::*;
    use crate::content::{RadiationShieldingDef, RadiationSourceDef};

    fn make_content() -> ContentPack {
        let mut entity_types = HashMap::new();
        entity_types.insert(
            "star_yellow".to_string(),
            EntityTypeDef {
                speed: 0.0,
                stop_radius: 1.0,
                mass: 500.0,
                health: 100.0,
                combat: None,
                collector: None,
                resource_node: None,
                refinery: None,
                radiation_sources: vec![RadiationSourceDef {
                    radiation_type: "stellar_heat".to_string(),
                    min_effective_distance_border_color: None,
                    min_effective_distance_fill_color: None,
                    full_damage_distance_border_color: None,
                    full_damage_distance_fill_color: None,
                    max_effective_distance_border_color: None,
                    max_effective_distance_fill_color: None,
                    min_effective_distance: 0.0,
                    max_effective_distance: 180.0,
                    full_damage_distance: 80.0,
                    damage_per_second: 24.0,
                }],
                radiation_shielding: HashMap::new(),
                visual_scale: 1.0,
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                builds: Vec::new(),
            },
        );

        let mut collector_shielding = HashMap::new();
        collector_shielding.insert(
            "stellar_heat".to_string(),
            RadiationShieldingDef {
                distance_offset: 90.0,
                damage_multiplier: 0.35,
            },
        );
        entity_types.insert(
            "collector_solar".to_string(),
            EntityTypeDef {
                speed: 20.0,
                stop_radius: 1.0,
                mass: 500.0,
                health: 100.0,
                combat: None,
                collector: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: collector_shielding,
                visual_scale: 1.0,
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                builds: Vec::new(),
            },
        );
        entity_types.insert(
            "worker".to_string(),
            EntityTypeDef {
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                combat: None,
                collector: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual_scale: 1.0,
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                builds: Vec::new(),
            },
        );

        ContentPack {
            entity_types,
            resource_types: HashMap::new(),
            content_hash: "test".to_string(),
        }
    }

    #[test]
    fn shielding_creates_safe_collection_band_but_not_safe_core() {
        let content = make_content();
        let star = pb::Entity {
            id: 1,
            entity_type_id: "star_yellow".to_string(),
            pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: NEUTRAL_OWNER.to_string(),
            health: 100.0,
        };
        let collector_safe = pb::Entity {
            id: 2,
            entity_type_id: "collector_solar".to_string(),
            pos: Some(pb::Vec2 { x: 120.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: "p1".to_string(),
            health: 100.0,
        };
        let collector_too_close = pb::Entity {
            id: 3,
            entity_type_id: "collector_solar".to_string(),
            pos: Some(pb::Vec2 { x: 20.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: "p1".to_string(),
            health: 100.0,
        };
        let worker_same_distance = pb::Entity {
            id: 4,
            entity_type_id: "worker".to_string(),
            pos: Some(pb::Vec2 { x: 120.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: "p1".to_string(),
            health: 100.0,
        };
        let state = GameState {
            tick: 0,
            entities: vec![
                star,
                collector_safe,
                collector_too_close,
                worker_same_distance,
            ],
            ledger: HashMap::new(),
        };

        let damage = Engine::compute_radiation_damage(&state, &content);
        assert_eq!(damage.get(&2).copied().unwrap_or(0.0), 0.0);
        assert!(damage.get(&3).copied().unwrap_or(0.0) > 0.0);
        assert!(damage.get(&4).copied().unwrap_or(0.0) > 0.0);
    }

    #[test]
    fn overlapping_sources_stack_damage() {
        let content = make_content();
        let state = GameState {
            tick: 0,
            entities: vec![
                pb::Entity {
                    id: 1,
                    entity_type_id: "star_yellow".to_string(),
                    pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                    vel: None,
                    force: None,
                    owner_player_id: NEUTRAL_OWNER.to_string(),
                    health: 100.0,
                },
                pb::Entity {
                    id: 2,
                    entity_type_id: "star_yellow".to_string(),
                    pos: Some(pb::Vec2 { x: 60.0, y: 0.0 }),
                    vel: None,
                    force: None,
                    owner_player_id: NEUTRAL_OWNER.to_string(),
                    health: 100.0,
                },
                pb::Entity {
                    id: 3,
                    entity_type_id: "worker".to_string(),
                    pos: Some(pb::Vec2 { x: 40.0, y: 0.0 }),
                    vel: None,
                    force: None,
                    owner_player_id: "p1".to_string(),
                    health: 100.0,
                },
            ],
            ledger: HashMap::new(),
        };

        let damage = Engine::compute_radiation_damage(&state, &content);
        let worker_damage = damage.get(&3).copied().unwrap_or(0.0);
        assert!(
            worker_damage > 24.0,
            "expected stacked damage, got {worker_damage}"
        );
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
    /// Fractional resource debits accumulated while construction channels run.
    build_spend_fractional: HashMap<(String, String), f32>,
    /// Fractional upkeep accumulated between whole-unit ledger debits.
    maintenance_spend_fractional: HashMap<(String, String), f32>,
    /// M8b: Per-collector runtime telemetry projected to Redis/UI.
    collector_ui_state_by_entity: HashMap<u64, CollectorUiState>,
    /// Runtime-only cooldown tracking for autonomous neutral combatants.
    combat: CombatSystem,
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
                    build_spend_fractional: HashMap::new(),
                    maintenance_spend_fractional: HashMap::new(),
                    collector_ui_state_by_entity: HashMap::new(),
                    combat: CombatSystem::default(),
                };
                engine.hydrate_entity_health_if_missing();
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
            build_spend_fractional: HashMap::new(),
            maintenance_spend_fractional: HashMap::new(),
            collector_ui_state_by_entity: HashMap::new(),
            combat: CombatSystem::default(),
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
            _content,
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
            Some(pb::intent::Kind::Collect(c)) => c.entity_id,
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

    /// Debit whole ledger units while retaining fractional construction spend.
    /// Construction is only accepted when its full cost is currently affordable,
    /// so this cannot take a ledger negative during normal play.
    fn spend_resource(&mut self, player_id: &str, resource_type: &str, amount: f32) -> bool {
        if amount <= 0.0 {
            return true;
        }
        let key = (player_id.to_string(), resource_type.to_string());
        let total = self
            .build_spend_fractional
            .get(&key)
            .copied()
            .unwrap_or(0.0)
            + amount;
        let whole = total.floor() as i64;
        let remainder = total - whole as f32;
        if whole > 0 {
            let available = self
                .state
                .ledger
                .get(player_id)
                .and_then(|ledger| ledger.get(resource_type))
                .copied()
                .unwrap_or(0);
            if available < whole {
                return false;
            }
            let ledger = self.state.ledger.entry(player_id.to_string()).or_default();
            *ledger.entry(resource_type.to_string()).or_insert(0) -= whole;
        }
        if remainder > 0.0 {
            self.build_spend_fractional.insert(key, remainder);
        } else {
            self.build_spend_fractional.remove(&key);
        }
        true
    }

    /// Charge continuous upkeep without taking a ledger below zero or accruing debt.
    fn spend_maintenance_resource(&mut self, player_id: &str, resource_type: &str, amount: f32) {
        debit_maintenance_without_debt(
            &mut self.state.ledger,
            &mut self.maintenance_spend_fractional,
            player_id,
            resource_type,
            amount,
        );
    }

    fn apply_maintenance_costs(&mut self, dt: f32) {
        let Some(content) = self.content.as_ref() else {
            return;
        };
        if !dt.is_finite() || dt <= 0.0 {
            return;
        }

        let mut totals: HashMap<(String, String), f32> = HashMap::new();
        for entity in &self.state.entities {
            if entity.owner_player_id.is_empty()
                || entity.owner_player_id == NEUTRAL_OWNER
                || entity.health <= 0.0
            {
                continue;
            }
            let Some(def) = content.get(&entity.entity_type_id) else {
                continue;
            };
            for (resource_type, per_minute) in &def.maintenance_cost_per_minute {
                if !per_minute.is_finite() || *per_minute <= 0.0 {
                    continue;
                }
                *totals
                    .entry((entity.owner_player_id.clone(), resource_type.clone()))
                    .or_insert(0.0) += per_minute * dt / 60.0;
            }
        }

        for ((player_id, resource_type), amount) in totals {
            self.spend_maintenance_resource(&player_id, &resource_type, amount);
        }
    }

    /// Advance active construction channels, charge their content-defined
    /// resource rates, and spawn completed units near their builder.
    async fn advance_builds(&mut self, dt: f32) {
        let Some(content) = self.content.clone() else {
            return;
        };
        let mut updates = Vec::new();
        for (entity_id, active) in self.intents.active_intents() {
            let Some(pb::action_state::Exec::Build(build)) = active.action.exec.as_ref() else {
                continue;
            };
            let Some(builder) = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == *entity_id)
            else {
                continue;
            };
            let Some(builder_def) = content.get(&builder.entity_type_id) else {
                continue;
            };
            let Some(option) = builder_def
                .builds
                .iter()
                .find(|option| option.entity_type_id == build.blueprint_id)
            else {
                continue;
            };
            let Some(product_def) = content.get(&build.blueprint_id) else {
                continue;
            };
            let mut duration = 0.0f32;
            for (resource, cost) in &product_def.build_cost {
                if *cost <= 0.0 {
                    continue;
                }
                let rate = option.spend_rates.get(resource).copied().unwrap_or(1.0);
                if rate <= 0.0 {
                    continue;
                }
                duration = duration.max(*cost / rate);
            }
            if duration > 0.0 {
                updates.push((
                    *entity_id,
                    active.metadata.player_id.clone(),
                    build.blueprint_id.clone(),
                    build.progress,
                    duration,
                    option.spend_rates.clone(),
                    product_def.build_cost.clone(),
                ));
            }
        }

        let mut completed = Vec::new();
        for (entity_id, player_id, blueprint_id, old_progress, duration, rates, costs) in updates {
            let new_progress = (old_progress + dt / duration).min(1.0);
            let old_elapsed = old_progress * duration;
            let new_elapsed = new_progress * duration;
            let mut can_spend = true;
            for (resource, cost) in &costs {
                if *cost <= 0.0 {
                    continue;
                }
                let rate = rates.get(resource).copied().unwrap_or(1.0);
                let amount =
                    ((new_elapsed * rate).min(*cost) - (old_elapsed * rate).min(*cost)).max(0.0);
                can_spend &= self.spend_resource(&player_id, resource, amount);
            }
            if !can_spend {
                continue;
            }
            if let Some(active) = self.intents.active_intents_mut().get_mut(&entity_id) {
                if let Some(pb::action_state::Exec::Build(build)) = active.action.exec.as_mut() {
                    build.progress = new_progress;
                }
            }
            if let Err(error) = self
                .redis
                .update_build_progress(entity_id, &blueprint_id, new_progress)
                .await
            {
                warn!(
                    ?error,
                    entity_id, "failed to update build progress tracking"
                );
            }
            if new_progress >= 1.0 {
                completed.push((entity_id, player_id, blueprint_id));
            }
        }

        for (builder_id, player_id, blueprint_id) in completed {
            let Some(builder) = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == builder_id)
                .cloned()
            else {
                continue;
            };
            let Some(pos) = builder.pos else { continue };
            let next_id = self
                .state
                .entities
                .iter()
                .map(|entity| entity.id)
                .max()
                .unwrap_or(0)
                + 1;
            let angle = (next_id as f32 * 2.399_963_1) % std::f32::consts::TAU;
            let spawn_distance = BUILD_SPAWN_RADIUS * 0.75;
            let health = content
                .get(&blueprint_id)
                .map(|definition| definition.health.max(0.0))
                .unwrap_or(0.0);
            self.state.entities.push(pb::Entity {
                id: next_id,
                entity_type_id: blueprint_id,
                pos: Some(pb::Vec2 {
                    x: pos.x + angle.cos() * spawn_distance,
                    y: pos.y + angle.sin() * spawn_distance,
                }),
                vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: player_id,
                health,
            });
            if let Some(metadata) = self.intents.finish(builder_id) {
                let _ = self.redis.clear_active_intent(builder_id).await;
                let _ = self
                    .emit_lifecycle_event(
                        &metadata,
                        pb::LifecycleState::Finished,
                        pb::LifecycleReason::None,
                        self.state.tick,
                    )
                    .await;
            }
        }
    }

    fn clear_fractional_for_entity(&mut self, entity_id: u64) {
        if let Some(carry) = self.carry_by_entity.remove(&entity_id) {
            if carry.amount > 0.0 {
                // Keep deterministic accounting by dropping sub-unit carry on despawn/loss.
                warn!(entity_id, resource_type = %carry.resource_type, amount = carry.amount, "dropping carry due to missing collector entity");
            }
        }
        self.collector_ui_state_by_entity.remove(&entity_id);
    }

    fn set_collector_ui_state(
        &mut self,
        entity_id: u64,
        activity: &str,
        resource_type: &str,
        carry_amount: f32,
        carry_capacity: f32,
        effective_rate_per_second: f32,
    ) {
        self.collector_ui_state_by_entity.insert(
            entity_id,
            CollectorUiState {
                activity: activity.to_string(),
                resource_type: resource_type.to_string(),
                carry_amount: carry_amount.max(0.0),
                carry_capacity: carry_capacity.max(0.0),
                effective_rate_per_second: effective_rate_per_second.max(0.0),
                updated_tick: self.state.tick,
            },
        );
    }

    fn hydrate_entity_health_if_missing(&mut self) {
        let Some(content) = self.content.as_ref() else {
            return;
        };
        if self.state.entities.is_empty() {
            return;
        }
        if !self
            .state
            .entities
            .iter()
            .all(|entity| entity.health <= 0.0)
        {
            return;
        }
        for entity in &mut self.state.entities {
            if let Some(def) = content.get(&entity.entity_type_id) {
                entity.health = def.health.max(0.0);
            }
        }
        self.prev_state = self.state.clone();
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

    fn resolve_radiation_shielding<'a>(
        entity_type: &'a EntityTypeDef,
        radiation_type: &str,
    ) -> Option<&'a RadiationShieldingDef> {
        entity_type.radiation_shielding.get(radiation_type)
    }

    fn radiation_damage_per_second(
        source: &RadiationSourceSnapshot,
        target_type: &EntityTypeDef,
        actual_distance: f32,
    ) -> f32 {
        if source.damage_per_second <= 0.0 {
            return 0.0;
        }
        let shielding = Self::resolve_radiation_shielding(target_type, &source.radiation_type);
        let distance_offset = shielding.map(|s| s.distance_offset.max(0.0)).unwrap_or(0.0);
        let damage_multiplier = shielding
            .map(|s| s.damage_multiplier.max(0.0))
            .unwrap_or(1.0);
        if damage_multiplier <= 0.0 {
            return 0.0;
        }
        let effective_distance = actual_distance + distance_offset;
        if effective_distance < source.min_effective_distance
            || effective_distance > source.max_effective_distance
        {
            return 0.0;
        }
        let base_damage = if effective_distance <= source.full_damage_distance
            || (source.max_effective_distance - source.full_damage_distance).abs() <= f32::EPSILON
        {
            source.damage_per_second
        } else {
            let falloff = (source.max_effective_distance - effective_distance)
                / (source.max_effective_distance - source.full_damage_distance);
            source.damage_per_second * falloff.clamp(0.0, 1.0)
        };
        base_damage * damage_multiplier
    }

    fn compute_radiation_damage(state: &GameState, content: &ContentPack) -> HashMap<u64, f32> {
        let mut damage_by_entity = HashMap::new();
        let mut sources = Vec::new();
        for entity in &state.entities {
            let Some(pos) = entity.pos.as_ref() else {
                continue;
            };
            let Some(entity_type) = content.get(&entity.entity_type_id) else {
                continue;
            };
            for source in &entity_type.radiation_sources {
                let min_effective_distance = source.min_effective_distance.max(0.0);
                let max_effective_distance =
                    source.max_effective_distance.max(min_effective_distance);
                sources.push(RadiationSourceSnapshot {
                    entity_id: entity.id,
                    x: pos.x,
                    y: pos.y,
                    radiation_type: source.radiation_type.clone(),
                    min_effective_distance,
                    max_effective_distance,
                    full_damage_distance: source
                        .full_damage_distance
                        .clamp(min_effective_distance, max_effective_distance),
                    damage_per_second: source.damage_per_second.max(0.0),
                });
            }
        }
        sources.sort_by(|a, b| {
            a.entity_id
                .cmp(&b.entity_id)
                .then_with(|| a.radiation_type.cmp(&b.radiation_type))
        });

        for entity in &state.entities {
            if entity.health <= 0.0 {
                continue;
            }
            let Some(pos) = entity.pos.as_ref() else {
                continue;
            };
            let Some(entity_type) = content.get(&entity.entity_type_id) else {
                continue;
            };
            let total = sources
                .iter()
                .filter(|source| source.entity_id != entity.id)
                .map(|source| {
                    let actual_distance =
                        Self::distance_sq(pos.x, pos.y, source.x, source.y).sqrt();
                    Self::radiation_damage_per_second(source, entity_type, actual_distance)
                })
                .sum::<f32>();
            if total > 0.0 {
                damage_by_entity.insert(entity.id, total);
            }
        }

        damage_by_entity
    }

    fn apply_radiation_damage(&mut self, dt: f32) {
        let Some(content) = self.content.as_ref() else {
            return;
        };
        if dt <= 0.0 {
            return;
        }
        let damage_by_entity = Self::compute_radiation_damage(&self.state, content);
        for entity in &mut self.state.entities {
            let Some(damage_per_second) = damage_by_entity.get(&entity.id).copied() else {
                continue;
            };
            entity.health = (entity.health - damage_per_second * dt).max(0.0);
        }
    }

    /// Advance autonomous neutral combat and remove entities killed by it.
    /// Returns killed IDs so the tick loop can cancel any active player intent
    /// and update reconnect tracking before publishing the resulting delta.
    fn apply_npc_combat(&mut self, dt: f32) -> crate::combat::CombatTick {
        let Some(content) = self.content.as_ref() else {
            return crate::combat::CombatTick {
                dead_entity_ids: Vec::new(),
                laser_shots: Vec::new(),
            };
        };
        let outcome = self
            .combat
            .tick(&mut self.state.entities, content, self.state.tick, dt);
        if outcome.dead_entity_ids.is_empty() {
            return outcome;
        }
        let dead_ids: HashSet<u64> = outcome.dead_entity_ids.iter().copied().collect();
        self.state.entities.retain(|entity| !dead_ids.contains(&entity.id));
        for entity_id in &outcome.dead_entity_ids {
            self.clear_fractional_for_entity(*entity_id);
        }
        outcome
    }

    async fn emit_laser_shots(&mut self, shots: &[crate::combat::LaserShot]) {
        for shot in shots {
            let event = pb::LaserShotEvent {
                attacker_id: shot.attacker_id,
                target_id: shot.target_id,
                origin: Some(shot.origin.clone()),
                target: Some(shot.target.clone()),
                server_tick: self.state.tick,
            };
            if let Err(error) = self.redis.publish_laser_shot(&event).await {
                warn!(?error, attacker_id = shot.attacker_id, target_id = shot.target_id, "failed to publish laser shot");
            }
        }
    }

    async fn cancel_destroyed_intents(&mut self, entity_ids: &[u64]) {
        for entity_id in entity_ids {
            let Some(metadata) = self.intents.finish(*entity_id) else {
                continue;
            };
            if let Err(error) = self.redis.clear_active_intent(*entity_id).await {
                warn!(?error, entity_id, "failed to clear destroyed entity intent tracking");
            }
            if let Err(error) = self
                .emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Canceled,
                    pb::LifecycleReason::Interrupted,
                    self.state.tick,
                )
                .await
            {
                warn!(?error, entity_id, "failed to emit destroyed entity cancellation");
            }
        }
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
        let collect_active_entities: HashSet<u64> = self
            .intents
            .active_intents()
            .iter()
            .filter_map(|(id, active)| match active.action.exec.as_ref() {
                Some(pb::action_state::Exec::Collect(_)) => Some(*id),
                _ => None,
            })
            .collect();
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
        let stale_ui_ids: Vec<u64> = self
            .collector_ui_state_by_entity
            .keys()
            .copied()
            .filter(|id| !collector_ids.contains(id))
            .collect();
        for id in stale_ui_ids {
            self.collector_ui_state_by_entity.remove(&id);
        }

        for collector in collectors {
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
            let carry_capacity = collector_def.carry_capacity.max(0.0);
            let carry_snapshot = self.carry_by_entity.get(&collector.id).cloned();

            // M8 (collect-intent model): autonomous collection only runs while
            // a maintained Collect intent is active for this entity.
            if !collect_active_entities.contains(&collector.id) {
                if let Some(carry) = carry_snapshot.as_ref() {
                    self.set_collector_ui_state(
                        collector.id,
                        COLLECTOR_ACTIVITY_IDLE,
                        &carry.resource_type,
                        carry.amount,
                        carry_capacity,
                        0.0,
                    );
                } else {
                    self.set_collector_ui_state(
                        collector.id,
                        COLLECTOR_ACTIVITY_IDLE,
                        "",
                        0.0,
                        carry_capacity,
                        0.0,
                    );
                }
                continue;
            }

            // Transport mode: carry->deposit has priority only when carry is full.
            if let Some(ref carry) = carry_snapshot {
                let carry_is_full =
                    carry_capacity > 0.0 && carry.amount >= (carry_capacity - f32::EPSILON);
                if carry.amount > 0.0 && carry_is_full {
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
                            self.set_collector_ui_state(
                                collector.id,
                                COLLECTOR_ACTIVITY_DELIVERING,
                                &carry.resource_type,
                                0.0,
                                carry_capacity,
                                0.0,
                            );
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
                        self.set_collector_ui_state(
                            collector.id,
                            COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF,
                            &carry.resource_type,
                            carry.amount,
                            carry_capacity,
                            0.0,
                        );
                        continue;
                    }
                    // No valid refinery: hold position.
                    self.set_collector_ui_state(
                        collector.id,
                        COLLECTOR_ACTIVITY_IDLE,
                        &carry.resource_type,
                        carry.amount,
                        carry_capacity,
                        0.0,
                    );
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
            let preferred_resource_type = carry_snapshot
                .as_ref()
                .filter(|c| c.amount > 0.0)
                .map(|c| c.resource_type.as_str());
            let node = if let Some(resource_type) = preferred_resource_type {
                nodes
                    .iter()
                    .filter(|n| n.mode == CollectionMode::Transport)
                    .filter(|n| n.resource_type == resource_type)
                    .min_by(|a, b| {
                        let da = Self::distance_sq(collector.x, collector.y, a.x, a.y);
                        let db = Self::distance_sq(collector.x, collector.y, b.x, b.y);
                        da.partial_cmp(&db)
                            .unwrap_or(std::cmp::Ordering::Equal)
                            .then_with(|| a.id.cmp(&b.id))
                    })
            } else {
                Self::pick_best_node(
                    &collector,
                    &nodes,
                    CollectionMode::Transport,
                    &collector_def.collects,
                )
            };
            if let Some(node) = node {
                let dist = Self::distance_sq(collector.x, collector.y, node.x, node.y).sqrt();
                if dist >= node.min_effective_distance && dist <= node.max_effective_distance {
                    let gather = collector_def.transport_rate_per_second.max(0.0) * dt;
                    if gather > 0.0 {
                        let (resource_type, carry_amount) = {
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
                            carry.amount = (carry.amount + gather).min(carry_capacity);
                            (carry.resource_type.clone(), carry.amount)
                        };
                        self.set_collector_ui_state(
                            collector.id,
                            COLLECTOR_ACTIVITY_GATHERING,
                            &resource_type,
                            carry_amount,
                            carry_capacity,
                            collector_def.transport_rate_per_second.max(0.0),
                        );
                    } else {
                        self.set_collector_ui_state(
                            collector.id,
                            COLLECTOR_ACTIVITY_GATHERING,
                            &node.resource_type,
                            carry_snapshot.as_ref().map(|c| c.amount).unwrap_or(0.0),
                            carry_capacity,
                            0.0,
                        );
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
                    self.set_collector_ui_state(
                        collector.id,
                        COLLECTOR_ACTIVITY_MOVING_TO_SOURCE,
                        &node.resource_type,
                        carry_snapshot.as_ref().map(|c| c.amount).unwrap_or(0.0),
                        carry_capacity,
                        0.0,
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
                    self.set_collector_ui_state(
                        collector.id,
                        COLLECTOR_ACTIVITY_PROXIMITY_COLLECTING,
                        &node.resource_type,
                        0.0,
                        carry_capacity,
                        collector_def.proximity_rate_per_second.max(0.0),
                    );
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
                    self.set_collector_ui_state(
                        collector.id,
                        COLLECTOR_ACTIVITY_MOVING_TO_SOURCE,
                        &node.resource_type,
                        0.0,
                        carry_capacity,
                        0.0,
                    );
                }
            } else {
                self.set_collector_ui_state(
                    collector.id,
                    COLLECTOR_ACTIVITY_IDLE,
                    carry_snapshot
                        .as_ref()
                        .map(|c| c.resource_type.as_str())
                        .unwrap_or(""),
                    carry_snapshot.as_ref().map(|c| c.amount).unwrap_or(0.0),
                    carry_capacity,
                    0.0,
                );
            }
        }
    }

    async fn publish_collector_ui_state(&mut self) {
        let mut states: Vec<(u64, CollectorUiState)> = self
            .collector_ui_state_by_entity
            .iter()
            .map(|(id, state)| (*id, state.clone()))
            .collect();
        states.sort_by_key(|(id, _)| *id);
        if let Err(err) = self
            .redis
            .persist_collector_states(&states, self.cfg.tracking_ttl_secs)
            .await
        {
            warn!(error = ?err, "failed to persist collector ui state");
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
        let combat = self.apply_npc_combat(dt);
        self.emit_laser_shots(&combat.laser_shots).await;
        self.cancel_destroyed_intents(&combat.dead_entity_ids).await;
        self.apply_resource_collection(dt);
        self.advance_builds(dt).await;
        self.publish_collector_ui_state().await;
        integrate(&self.cfg, &mut self.state, dt);
        self.apply_radiation_damage(dt);
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
            let combat = self.apply_npc_combat(dt);
            self.emit_laser_shots(&combat.laser_shots).await;
            self.cancel_destroyed_intents(&combat.dead_entity_ids).await;
            self.apply_resource_collection(dt);
            self.advance_builds(dt).await;
            self.apply_maintenance_costs(dt);
            self.publish_collector_ui_state().await;
            integrate(&self.cfg, &mut self.state, dt);
            self.apply_radiation_damage(dt);
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
            Some(intent_envelope::Payload::Collect(c)) => {
                info!(entity_id = c.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, "accept intent=Collect");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Collect(c)),
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
            Some(pb::intent::Kind::Collect(c)) => c.entity_id,
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

        // Production is entirely content-driven and always revalidated by the
        // server; the client-side disabled button is only a convenience.
        if let Some(pb::intent::Kind::Build(build)) = payload_intent.kind.as_ref() {
            let builder_type = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == entity_id)
                .map(|entity| entity.entity_type_id.as_str())
                .unwrap_or_default();
            let Some(content) = self.content.as_ref() else {
                return Err(anyhow!("build unavailable without content pack"));
            };
            let Some(builder) = content.get(builder_type) else {
                return Err(anyhow!("unknown builder type"));
            };
            let Some(option) = builder
                .builds
                .iter()
                .find(|option| option.entity_type_id == build.blueprint_id)
            else {
                return Err(anyhow!("builder cannot produce requested entity"));
            };
            let Some(product) = content.get(&build.blueprint_id) else {
                return Err(anyhow!("unknown build product"));
            };
            if product.build_cost.is_empty() {
                return Err(anyhow!("build product has no build_cost"));
            }
            let ledger = self.state.ledger.get(&player_id);
            for (resource, cost) in &product.build_cost {
                let rate = option.spend_rates.get(resource).copied().unwrap_or(1.0);
                if *cost <= 0.0 || !rate.is_finite() || rate <= 0.0 {
                    return Err(anyhow!("invalid build cost or spend rate for {resource}"));
                }
                let available = ledger
                    .and_then(|resources| resources.get(resource))
                    .copied()
                    .unwrap_or(0);
                if available < cost.ceil() as i64 {
                    return Err(anyhow!("insufficient {resource} for build"));
                }
            }
        }

        // M4: Look up entity_type_id for per-type stat resolution.
        let entity_type_id = self.resolve_entity_type_id(&payload_intent);
        let (intent_kind, move_target) = match payload_intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => (
                "move",
                m.target.as_ref().map(|t| IntentPoint { x: t.x, y: t.y }),
            ),
            Some(pb::intent::Kind::Attack(_)) => ("attack", None),
            Some(pb::intent::Kind::Build(_)) => ("build", None),
            Some(pb::intent::Kind::Collect(_)) => ("collect", None),
            None => ("unknown", None),
        };

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
                .persist_active_intent(
                    entity_id,
                    &metadata,
                    intent_kind,
                    move_target,
                    self.cfg.tracking_ttl_secs,
                )
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
            Some(pb::intent::Kind::Collect(c)) => intent_envelope::Payload::Collect(c),
            None => return Err(anyhow!("legacy intent missing kind")),
        };

        let legacy_client_cmd = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Attack(a)) => a.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Build(b)) => b.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Collect(c)) => c.client_cmd_id.as_str(),
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
            Some(pb::intent::Kind::Collect(c)) => c.player_id.clone(),
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
