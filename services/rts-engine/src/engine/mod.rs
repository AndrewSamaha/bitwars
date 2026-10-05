pub mod intent;
pub mod state;
mod scenario;

use std::collections::{HashMap, HashSet};

use anyhow::{anyhow, bail, Context, Result};
use rand::{seq::SliceRandom, Rng};
use tokio::time::{interval, Duration, Instant};
use tracing::{error, info, warn};
use uuid::{Uuid, Version};

use crate::combat::CombatSystem;
use crate::config::GameConfig;
use crate::content::{
    CollectionMode, ContentPack, EntityTypeDef, MinimumDistanceDef, RadiationShieldingDef,
    RepairDef,
};
use crate::delta::compute_delta;
use crate::engine::intent::{format_uuid, IntentManager, IntentMetadata};
use crate::io::redis::{
    CollectorUiState, CombatEffectUiState, GameplayEntityRef, GameplayEvent, IntentPoint,
    RedisClient,
};
use crate::io::telemetry::{summarize_tick_durations, Telemetry};
use crate::npc_scripting::{NpcCommands, RaiderScript};
use crate::pb::{self, intent_envelope};
use crate::physics::integrate;
use crate::spatial::SpatialIndex;
use crate::spawn_config::{is_player_owner, SpawnConfig, UNIVERSE_OWNER};
use prost::Message;
use state::{ensure_minerals_near_spawn, init_world, log_sample, on_player_spawn, resource_amount, resource_capacity, set_resource_amount, spawn_celestial_field, GameState};

pub const ENGINE_PROTOCOL_MAJOR: u32 = 12;
const TICK_TIMING_WINDOW_TICKS: usize = 600;
const DEDUPE_TTL_SECS: usize = 600;
const DEPOSIT_DISTANCE: f32 = 80.0;
const COLLECTOR_ACTIVITY_IDLE: &str = "idle";
const COLLECTOR_ACTIVITY_MOVING_TO_SOURCE: &str = "moving_to_source";
const COLLECTOR_ACTIVITY_GATHERING: &str = "gathering";
const COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF: &str = "moving_to_dropoff";
const COLLECTOR_ACTIVITY_DELIVERING: &str = "delivering";
const COLLECTOR_ACTIVITY_PROXIMITY_COLLECTING: &str = "proximity_collecting";
const COLLECTOR_ACTIVITY_WAITING_FOR_TURN: &str = "waiting_for_turn";

fn retry_delay_ticks(retry_after_ms: u64, tps: u32) -> u64 {
    (retry_after_ms
        .saturating_mul(tps as u64)
        .saturating_add(999)
        / 1000)
        .max(1)
}

#[derive(Clone, Debug)]
struct CarryState {
    resource_type: String,
    amount: f32,
}

/// Fractional upkeep is already owed, even before the next whole-unit payment.
fn accrued_upkeep(fractional: &HashMap<(String, String), f32>, entity_id: u64, resource: &str) -> f64 {
    fractional.get(&(format!("entity:{entity_id}"), resource.to_string())).copied().unwrap_or(0.0) as f64
}

fn pay_entity_upkeep(
    entity: &mut pb::Entity,
    def: &EntityTypeDef,
    dt: f32,
    fractional: &mut HashMap<(String, String), f32>,
) -> (Vec<String>, Vec<(String, f32)>) {
    let mut missing_resources = Vec::new();
    let mut spends = Vec::new();
    for costs in std::iter::once(&def.maintenance_cost_per_minute)
        .chain(def.sensor.iter().map(|sensor| &sensor.cost_per_minute))
    {
        for (resource_type, per_minute) in costs {
            if !per_minute.is_finite() || *per_minute <= 0.0 {
                continue;
            }
            let amount = per_minute * dt / 60.0;
            let key = (format!("entity:{}", entity.id), resource_type.clone());
            let total = fractional.get(&key).copied().unwrap_or(0.0) + amount;
            let whole = total.floor();
            let available = resource_amount(entity, resource_type);
            if available + f64::EPSILON < whole as f64
                && !missing_resources.contains(resource_type)
            {
                missing_resources.push(resource_type.clone());
            }
            let paid = available.min(whole as f64);
            set_resource_amount(entity, resource_type, available - paid);
            if paid == whole as f64 && total > whole { fractional.insert(key, total - whole); }
            else { fractional.remove(&key); }
            if paid > 0.0 { spends.push((resource_type.clone(), paid as f32)); }
        }
    }
    (missing_resources, spends)
}

/// Transfer cargo first, then local inventory, retaining every unit that does not fit.
fn deliver_resources(
    actor: &mut pb::Entity,
    recipient: &mut pb::Entity,
    recipient_def: &EntityTypeDef,
    resource_types: &[String],
    mut cargo: Option<&mut CarryState>,
) {
    for resource in resource_types {
        let current = resource_amount(recipient, resource);
        let room = (recipient_def.max_capacity.get(resource).copied().unwrap_or(0.0) as f64 - current).max(0.0);
        let cargo_amount = cargo.as_ref()
            .filter(|carry| carry.resource_type == *resource)
            .map(|carry| carry.amount as f64).unwrap_or(0.0);
        let from_cargo = cargo_amount.min(room);
        let from_inventory = resource_amount(actor, resource).min(room - from_cargo);
        if from_cargo + from_inventory <= 0.0 { continue; }
        if let Some(carry) = cargo.as_mut().filter(|carry| carry.resource_type == *resource) {
            carry.amount = (carry.amount - from_cargo as f32).max(0.0);
        }
        set_resource_amount(actor, resource, resource_amount(actor, resource) - from_inventory);
        set_resource_amount(recipient, resource, current + from_cargo + from_inventory);
    }
}

/// Shipment inventory shares the collector's carry limit; unrelated upkeep stock stays aboard.
fn load_transfer_resources(actor: &mut pb::Entity, donor: &mut pb::Entity, recipient: &pb::Entity,
    actor_def: &EntityTypeDef, recipient_def: &EntityTypeDef, resources: &[String], existing_cargo: Option<&CarryState>) {
    let limit = actor_def.collector.as_ref().map_or(0.0, |collector| collector.carry_capacity as f64);
    // Upkeep buffers have their own per-resource capacities, separate from the shipment carry quota.
    let held: f64 = actor.resources.as_ref().into_iter().flat_map(|inventory| &inventory.resources)
        .filter(|entry| actor_def.maintenance_cost_per_minute.get(&entry.resource_type).copied().unwrap_or(0.0) <= 0.0
            && actor_def.sensor.as_ref().and_then(|sensor| sensor.cost_per_minute.get(&entry.resource_type)).copied().unwrap_or(0.0) <= 0.0)
        .map(|entry| entry.amount).sum();
    let mut room = (limit - held - existing_cargo.map_or(0.0, |cargo| cargo.amount as f64)).max(0.0);
    for resource in resources {
        let aboard = resource_amount(actor, resource);
        let carrier_room = (actor_def.max_capacity.get(resource).copied().unwrap_or(0.0) as f64 - aboard).max(0.0);
        let recipient_room = (recipient_def.max_capacity.get(resource).copied().unwrap_or(0.0) as f64
            - resource_amount(recipient, resource) - aboard
            - existing_cargo.filter(|cargo| cargo.resource_type == *resource).map_or(0.0, |cargo| cargo.amount as f64)).max(0.0);
        let amount = resource_amount(donor, resource).min(room).min(carrier_room).min(recipient_room);
        if amount > 0.0 {
            set_resource_amount(donor, resource, resource_amount(donor, resource) - amount);
            set_resource_amount(actor, resource, aboard + amount);
            room -= amount;
        }
    }
}

#[derive(Clone)]
struct ResourceNodeSnapshot {
    id: u64,
    x: f32,
    y: f32,
    resource_type: String,
    mode: CollectionMode,
    max_simultaneous_collectors: Option<u32>,
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
    max_capacity: HashMap<String, f32>,
}

#[derive(Clone)]
struct CollectorSnapshot {
    id: u64,
    entity_type_id: String,
    owner_player_id: String,
    x: f32,
    y: f32,
}

fn claim_transport_slot(node: &ResourceNodeSnapshot, gathering_by_node: &mut HashMap<u64, u32>) -> bool {
    let gathering = gathering_by_node.entry(node.id).or_default();
    if node.max_simultaneous_collectors.is_some_and(|limit| *gathering >= limit) {
        return false;
    }
    *gathering += 1;
    true
}

fn collection_order_key(previous_activity: Option<&str>, waiting_since: Option<u64>, entity_id: u64) -> (u8, u64, u64) {
    let priority = if matches!(previous_activity, Some(COLLECTOR_ACTIVITY_PROXIMITY_COLLECTING | COLLECTOR_ACTIVITY_GATHERING)) {
        0
    } else if waiting_since.is_some() {
        1
    } else {
        2
    };
    (priority, waiting_since.unwrap_or(u64::MAX), entity_id)
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

fn repair_tick(repair: &RepairDef, dt: f32, missing_health: f32) -> (f32, HashMap<String, f32>) {
    let desired = repair.cost_per_min.values().sum::<f32>() * repair.efficiency * dt / 60.0;
    let restored = desired.min(missing_health);
    if desired <= 0.0 || restored <= 0.0 {
        return (0.0, HashMap::new());
    }
    let scale = restored / desired;
    let costs = repair
        .cost_per_min
        .iter()
        .map(|(resource, per_minute)| (resource.clone(), per_minute * dt / 60.0 * scale))
        .collect();
    (restored, costs)
}

#[cfg(test)]
mod repair_tests {
    use super::*;

    #[test]
    fn efficiency_converts_each_resource_unit_to_health() {
        let repair = RepairDef {
            range: 150.0,
            cost_per_min: HashMap::from([
                ("energy".to_string(), 60.0),
                ("minerals".to_string(), 60.0),
            ]),
            efficiency: 1.0,
        };
        let (health, costs) = repair_tick(&repair, 1.0, 100.0);
        assert_eq!(health, 2.0);
        assert_eq!(costs["energy"], 1.0);
        assert_eq!(costs["minerals"], 1.0);
        let (health, costs) = repair_tick(&repair, 1.0, 0.5);
        assert_eq!(health, 0.5);
        assert_eq!(costs["energy"], 0.25);
        assert_eq!(costs["minerals"], 0.25);
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

        debit_maintenance_without_debt(&mut ledger, &mut fractional, "player-1", "energy", 2.25);
        assert_eq!(ledger["player-1"]["energy"], 0);
        assert_eq!(
            fractional[&("player-1".to_string(), "energy".to_string())],
            0.25
        );

        debit_maintenance_without_debt(&mut ledger, &mut fractional, "player-1", "energy", 0.75);
        assert_eq!(ledger["player-1"]["energy"], 0);
        assert!(fractional.is_empty());
    }
}

#[cfg(test)]
mod collection_distance_tests {
    use super::*;

    #[test]
    fn proximity_collection_requires_distance_from_listed_same_owner_types() {
        let collector = CollectorSnapshot {
            id: 1,
            entity_type_id: "collector_solar".to_string(),
            owner_player_id: "p1".to_string(),
            x: 0.0,
            y: 0.0,
        };
        let rule = MinimumDistanceDef {
            value: 250.0,
            entity_types: vec!["collector_solar".to_string()],
            retry_after_ms: 1000,
        };
        let entity = |id, entity_type_id: &str, owner_player_id: &str, x| pb::Entity {
            id,
            entity_type_id: entity_type_id.to_string(),
            owner_player_id: owner_player_id.to_string(),
            pos: Some(pb::Vec2 { x, y: 0.0 }),
            ..Default::default()
        };

        let violation = Engine::minimum_distance_violation(
            &collector,
            &[entity(2, "collector_solar", "p1", 249.0)],
            &rule,
            &HashSet::from([2]),
        )
        .expect("nearby same-owner collector should block collection");
        assert_eq!(violation.blocking_entity_id, 2);
        assert_eq!(violation.required_distance, 250.0);
        assert_eq!(violation.actual_distance, 249.0);
        assert!(Engine::minimum_distance_violation(
            &collector,
            &[
                entity(2, "collector_solar", "p2", 1.0),
                entity(3, "worker", "p1", 1.0),
                entity(4, "collector_solar", "p1", 250.0),
            ],
            &rule,
            &HashSet::from([2, 3, 4]),
        )
        .is_none());
        assert!(Engine::minimum_distance_violation(
            &collector,
            &[entity(2, "collector_solar", "p1", 10.0)],
            &rule,
            &HashSet::new(),
        )
        .is_none());
    }

    #[test]
    fn retry_delay_rounds_up_to_a_tick() {
        assert_eq!(retry_delay_ticks(1000, 60), 60);
        assert_eq!(retry_delay_ticks(1001, 60), 61);
        assert_eq!(retry_delay_ticks(1, 60), 1);
    }
}

#[cfg(test)]
mod transport_capacity_tests {
    use super::*;

    #[test]
    fn content_configures_transport_node_capacity() {
        let path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml");
        let content = ContentPack::load(&path).unwrap();
        for entity_type in ["minerals", "planet_blue"] {
            assert_eq!(content.get(entity_type).unwrap().resource_node.as_ref().unwrap().max_simultaneous_collectors, Some(1));
        }
    }

    #[test]
    fn capacity_is_per_resource_entity() {
        let node = ResourceNodeSnapshot {
            id: 10,
            x: 0.0,
            y: 0.0,
            resource_type: "minerals".into(),
            mode: CollectionMode::Transport,
            max_simultaneous_collectors: Some(1),
            min_effective_distance: 20.0,
            max_effective_distance: 50.0,
        };
        let mut gathering = HashMap::new();
        assert!(claim_transport_slot(&node, &mut gathering));
        assert!(!claim_transport_slot(&node, &mut gathering));
        assert!(claim_transport_slot(&ResourceNodeSnapshot { id: 11, ..node.clone() }, &mut gathering));
        gathering.clear(); // A full worker has started its delivery trip.
        assert!(claim_transport_slot(&node, &mut gathering));
    }

    #[test]
    fn incumbent_then_longest_waiting_then_new_arrival() {
        let mut workers = [
            (1, None, None),
            (7, Some("waiting_for_turn"), Some(3)),
            (9, Some("gathering"), None),
            (2, Some("waiting_for_turn"), Some(5)),
            (4, Some("waiting_for_turn"), Some(3)),
        ];
        workers.sort_by_key(|(id, activity, since)| collection_order_key(*activity, *since, *id));
        assert_eq!(workers.map(|(id, _, _)| id), [9, 4, 7, 2, 1]);
    }

    #[test]
    fn collector_stays_bound_to_its_node_across_trips() {
        let collector = CollectorSnapshot {
            id: 1,
            entity_type_id: "worker".into(),
            owner_player_id: "p1".into(),
            x: 0.0,
            y: 0.0,
        };
        let far = ResourceNodeSnapshot {
            id: 10,
            x: 100.0,
            y: 0.0,
            resource_type: "minerals".into(),
            mode: CollectionMode::Transport,
            max_simultaneous_collectors: Some(1),
            min_effective_distance: 20.0,
            max_effective_distance: 50.0,
        };
        let nodes = [far.clone(), ResourceNodeSnapshot { id: 11, x: 10.0, ..far }];
        let collects = vec!["minerals".to_string()];
        assert_eq!(Engine::pick_transport_node(&collector, &nodes, Some(10), None, "minerals", false, &collects).unwrap().id, 10);
        assert_eq!(Engine::pick_transport_node(&collector, &nodes, Some(99), None, "minerals", false, &collects).unwrap().id, 11);
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

fn record_tick_phase(
    samples: Option<&mut HashMap<bool, HashMap<&'static str, Vec<Duration>>>>,
    raider_ai_spatial_index_enabled: bool,
    phase: &'static str,
    started: &mut Option<Instant>,
) {
    if let (Some(samples), Some(phase_started)) = (samples, started.as_mut()) {
        samples
            .entry(raider_ai_spatial_index_enabled)
            .or_default()
            .entry(phase)
            .or_default()
            .push(phase_started.elapsed());
        *phase_started = Instant::now();
    }
}

fn record_tick_phase_duration(
    samples: Option<&mut HashMap<bool, HashMap<&'static str, Vec<Duration>>>>,
    raider_ai_spatial_index_enabled: bool,
    phase: &'static str,
    duration: Duration,
) {
    if let Some(samples) = samples {
        samples
            .entry(raider_ai_spatial_index_enabled)
            .or_default()
            .entry(phase)
            .or_default()
            .push(duration);
    }
}

fn count_percentiles(samples: &mut [usize]) -> (f64, f64) {
    if samples.is_empty() {
        return (0.0, 0.0);
    }
    samples.sort_unstable();
    let percentile =
        |percent: usize| samples[((samples.len() * percent + 99) / 100).saturating_sub(1)] as f64;
    (percentile(50), percentile(95))
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
    use crate::content::{RadiationShieldingDef, RadiationSourceDef, VisualDef};

    fn make_content() -> ContentPack {
        let mut entity_types = HashMap::new();
        entity_types.insert(
            "star_yellow".to_string(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_sharing: None,
                fog_memory: Default::default(),
                speed: 0.0,
                stop_radius: 1.0,
                mass: 500.0,
                health: 100.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
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
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
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
                max_capacity: HashMap::new(),
                resource_sharing: None,
                fog_memory: Default::default(),
                speed: 20.0,
                stop_radius: 1.0,
                mass: 500.0,
                health: 100.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: collector_shielding,
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );
        entity_types.insert(
            "worker".to_string(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_sharing: None,
                fog_memory: Default::default(),
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );

        ContentPack {
            entity_types,
            resource_types: HashMap::new(),
            technologies: HashMap::new(),
            content_hash: "test".to_string(),
        }
    }

    #[test]
    fn shielding_creates_safe_collection_band_but_not_safe_core() {
        let content = make_content();
        let star = pb::Entity {
            resources: None,
            id: 1,
            entity_type_id: "star_yellow".to_string(),
            pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: UNIVERSE_OWNER.to_string(),
            health: 100.0,
        };
        let collector_safe = pb::Entity {
            resources: None,
            id: 2,
            entity_type_id: "collector_solar".to_string(),
            pos: Some(pb::Vec2 { x: 120.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: "p1".to_string(),
            health: 100.0,
        };
        let collector_too_close = pb::Entity {
            resources: None,
            id: 3,
            entity_type_id: "collector_solar".to_string(),
            pos: Some(pb::Vec2 { x: 20.0, y: 0.0 }),
            vel: None,
            force: None,
            owner_player_id: "p1".to_string(),
            health: 100.0,
        };
        let worker_same_distance = pb::Entity {
            resources: None,
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
            technologies: HashMap::new(),
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
                    resources: None,
                    id: 1,
                    entity_type_id: "star_yellow".to_string(),
                    pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                    vel: None,
                    force: None,
                    owner_player_id: UNIVERSE_OWNER.to_string(),
                    health: 100.0,
                },
                pb::Entity {
                    resources: None,
                    id: 2,
                    entity_type_id: "star_yellow".to_string(),
                    pos: Some(pb::Vec2 { x: 60.0, y: 0.0 }),
                    vel: None,
                    force: None,
                    owner_player_id: UNIVERSE_OWNER.to_string(),
                    health: 100.0,
                },
                pb::Entity {
                    resources: None,
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
            technologies: HashMap::new(),
        };

        let damage = Engine::compute_radiation_damage(&state, &content);
        let worker_damage = damage.get(&3).copied().unwrap_or(0.0);
        assert!(
            worker_damage > 24.0,
            "expected stacked damage, got {worker_damage}"
        );
    }

    #[test]
    fn radiation_grid_finds_sources_across_cell_boundaries() {
        let content = make_content();
        let state = GameState {
            tick: 0,
            entities: vec![
                pb::Entity {
                    id: 1,
                    entity_type_id: "star_yellow".to_string(),
                    pos: Some(pb::Vec2 { x: 950.0, y: 0.0 }),
                    health: 100.0,
                    ..Default::default()
                },
                pb::Entity {
                    id: 2,
                    entity_type_id: "worker".to_string(),
                    pos: Some(pb::Vec2 { x: 1_050.0, y: 0.0 }),
                    health: 100.0,
                    ..Default::default()
                },
            ],
            ledger: HashMap::new(),
            technologies: HashMap::new(),
        };

        assert!(Engine::compute_radiation_damage(&state, &content)[&2] > 0.0);
    }

    #[test]
    fn zero_health_entities_are_removed_after_radiation_resolution() {
        let mut entities = vec![
            pb::Entity {
                resources: None,
                id: 1,
                entity_type_id: "worker".to_string(),
                pos: None,
                vel: None,
                force: None,
                owner_player_id: "p1".to_string(),
                health: 0.0,
            },
            pb::Entity {
                resources: None,
                id: 2,
                entity_type_id: "worker".to_string(),
                pos: None,
                vel: None,
                force: None,
                owner_player_id: "p1".to_string(),
                health: 1.0,
            },
        ];

        assert_eq!(remove_zero_health_entities(&mut entities), vec![1]);
        assert_eq!(entities.len(), 1);
        assert_eq!(entities[0].id, 2);
    }

    #[test]
    fn removal_only_deltas_are_published() {
        let delta = pb::Delta {
            removed_entity_ids: vec![42],
            ..Default::default()
        };
        assert!(should_publish_delta(&delta));
        assert!(!should_publish_delta(&pb::Delta::default()));
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
    /// Transport collectors stay bound to one resource entity across delivery trips.
    transport_node_by_entity: HashMap<u64, u64>,
    /// First tick spent waiting at a full resource entity; used for FIFO admission.
    transport_wait_since_tick_by_entity: HashMap<u64, u64>,
    /// M8: Fractional per-player resources accumulated between integer ledger commits.
    resource_fractional: HashMap<(String, String), f32>,
    /// Fractional resource debits accumulated while construction channels run.
    build_spend_fractional: HashMap<(String, String), f32>,
    /// Fractional resource debits accumulated while repair channels run.
    repair_spend_fractional: HashMap<(String, String), f32>,
    /// Fractional upkeep accumulated between whole-unit ledger debits.
    maintenance_spend_fractional: HashMap<(String, String), f32>,
    /// Cumulative maintenance demand and successful construction spending,
    /// published for economy diagnostics even when a ledger is at zero.
    resource_spend_total: HashMap<(String, String), f64>,
    resource_gain_total: HashMap<(String, String), f64>,
    /// Per-collector runtime telemetry published through authoritative snapshots and deltas.
    collector_ui_state_by_entity: HashMap<u64, CollectorUiState>,
    /// Next tick when a spacing-blocked collector may try gathering again.
    collection_retry_tick_by_entity: HashMap<u64, u64>,
    /// Previous telemetry state used to emit sparse authoritative delta updates.
    prev_collector_ui_state_by_entity: HashMap<u64, CollectorUiState>,
    /// Per-attacker continuous combat effects, streamed for presentation.
    combat_effect_ui_state_by_entity: HashMap<u64, CombatEffectUiState>,
    prev_combat_effect_ui_state_by_entity: HashMap<u64, CombatEffectUiState>,
    /// Runtime-only cooldown tracking for autonomous combatants.
    combat: CombatSystem,
    raider_script: RaiderScript,
    scenario_runtime: scenario::ScenarioRuntime,
    loaded_scenario: Option<(scenario::Scenario, std::collections::BTreeMap<String, String>)>,
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
        let spawn = manifest.join("config/spawn.yaml");
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

fn remove_zero_health_entities(entities: &mut Vec<pb::Entity>) -> Vec<u64> {
    let dead_entity_ids: Vec<u64> = entities
        .iter()
        .filter(|entity| entity.health <= 0.0)
        .map(|entity| entity.id)
        .collect();
    if dead_entity_ids.is_empty() {
        return dead_entity_ids;
    }
    let dead_ids: HashSet<u64> = dead_entity_ids.iter().copied().collect();
    entities.retain(|entity| !dead_ids.contains(&entity.id));
    dead_entity_ids
}

/// A removal-only delta is still an authoritative state change. Keep all
/// other no-op delta suppression intact.
fn should_publish_delta(delta: &pb::Delta) -> bool {
    !delta.updates.is_empty()
        || !delta.removed_entity_ids.is_empty()
        || !delta.collector_state_updates.is_empty()
        || !delta.combat_effect_state_updates.is_empty()
}

fn gameplay_event_recipients(victim_owner: &str, attacker_owner: &str) -> Vec<String> {
    let mut recipients = Vec::new();
    for owner in [victim_owner, attacker_owner] {
        if is_player_owner(owner) && !recipients.iter().any(|id| id == owner) {
            recipients.push(owner.to_string());
        }
    }
    recipients
}

fn migrate_legacy_neutral_owners(entities: &mut [pb::Entity]) {
    for entity in entities
        .iter_mut()
        .filter(|entity| entity.owner_player_id == "neutral")
    {
        entity.owner_player_id = if entity.entity_type_id == "raider" {
            crate::spawn_config::RAIDERS_OWNER
        } else {
            UNIVERSE_OWNER
        }
        .to_string();
    }
}

#[cfg(test)]
mod ownership_tests {
    use super::*;

    #[test]
    fn restore_migrates_legacy_system_owners() {
        let mut entities = vec![
            pb::Entity {
                entity_type_id: "raider".into(),
                owner_player_id: "neutral".into(),
                ..Default::default()
            },
            pb::Entity {
                entity_type_id: "star_yellow".into(),
                owner_player_id: "neutral".into(),
                ..Default::default()
            },
        ];
        migrate_legacy_neutral_owners(&mut entities);
        assert_eq!(
            entities[0].owner_player_id,
            crate::spawn_config::RAIDERS_OWNER
        );
        assert_eq!(entities[1].owner_player_id, UNIVERSE_OWNER);
    }
}

fn gameplay_entity_ref(entity: &pb::Entity) -> GameplayEntityRef {
    GameplayEntityRef {
        entity_id: entity.id,
        entity_type_id: entity.entity_type_id.clone(),
        owner_player_id: entity.owner_player_id.clone(),
    }
}

fn entity_position(entity: &pb::Entity) -> IntentPoint {
    let position = entity.pos.as_ref();
    IntentPoint {
        x: position.map(|pos| pos.x).unwrap_or(0.0),
        y: position.map(|pos| pos.y).unwrap_or(0.0),
    }
}

fn unix_time_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

impl Engine {
    async fn publish_script_debug(&mut self) {
        if self.state.tick % u64::from(self.cfg.tps.max(1)) != 0 {
            return;
        }
        let result = async {
            let owner = crate::spawn_config::RAIDERS_OWNER;
            if self.redis.script_debug_enabled(owner).await? {
                let mut snapshot = self.raider_script.debug_snapshot(self.state.tick)?;
                snapshot["game_id"] = serde_json::json!(self.cfg.game_id);
                let owned: Vec<_> = self
                    .state
                    .entities
                    .iter()
                    .filter(|entity| entity.owner_player_id == owner)
                    .take(1025)
                    .collect();
                if owned.len() > 1024 {
                    snapshot["truncated"] = serde_json::json!(true);
                }
                snapshot["entities"] = serde_json::json!(owned
                    .iter()
                    .take(1024)
                    .map(|entity| {
                        serde_json::json!({"id": entity.id.to_string(),
                        "entity_type_id": entity.entity_type_id, "health": entity.health,
                        "position": entity.pos.as_ref().map(|p| [p.x, p.y]),
                        "velocity": entity.vel.as_ref().map(|v| [v.x, v.y])})
                    })
                    .collect::<Vec<_>>());
                self.redis.publish_script_debug(owner, &snapshot).await?;
            }
            anyhow::Ok(())
        }
        .await;
        if let Err(error) = result {
            warn!(?error, "script debug snapshot failed");
        }
    }

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

            if let Some((mut state, boundary, snapshot_collector_states)) =
                redis.read_latest_snapshot().await?
            {
                info!(
                    tick = state.tick,
                    boundary = %boundary,
                    entities = state.entities.len(),
                    "restored world from snapshot"
                );

                // Restore per-player sequence numbers and maintained collection orders.
                let tracking = redis.read_all_tracking().await?;
                let mut player_last_seq = HashMap::new();
                for (pid, seq) in &tracking.player_seqs {
                    info!(player_id = %pid, last_seq = seq, "restored player_last_seq");
                    player_last_seq.insert(pid.clone(), *seq);
                }
                let restored_collects: Vec<_> = tracking
                    .active_intents
                    .iter()
                    .filter_map(|entry| {
                        if entry.intent_kind != "collect" {
                            return None;
                        }
                        let snapshot_assignment = snapshot_collector_states
                            .iter()
                            .find(|state| state.entity_id == entry.entity_id)
                            .map(|state| {
                                (
                                    state.assigned_resource_type.clone(),
                                    state.assigned_nearest_compatible,
                                )
                            });
                        let assignment = entry
                            .collect_resource_type_id
                            .clone()
                            .zip(entry.collect_nearest_compatible)
                            .or(snapshot_assignment);
                        let Some((resource_type_id, nearest_compatible)) = assignment else {
                            return None;
                        };
                        let entity = state
                            .entities
                            .iter()
                            .find(|entity| entity.id == entry.entity_id)?;
                        if entity.owner_player_id != entry.player_id {
                            return None;
                        }
                        let content = content.as_ref()?;
                        let collector = content.get(&entity.entity_type_id)?.collector.as_ref()?;
                        let valid_assignment = if nearest_compatible {
                            resource_type_id.is_empty()
                        } else {
                            !resource_type_id.is_empty()
                                && content.get_resource_type(&resource_type_id).is_some()
                                && collector.collects.iter().any(|id| id == &resource_type_id)
                        };
                        valid_assignment.then(|| {
                            (
                                entry.clone(),
                                resource_type_id,
                                nearest_compatible,
                                entity.entity_type_id.clone(),
                            )
                        })
                    })
                    .collect();
                let restored_builds: Vec<_> = tracking
                    .active_intents
                    .iter()
                    .filter_map(|entry| {
                        if entry.intent_kind != "build" {
                            return None;
                        }
                        let blueprint_id = entry.blueprint_id.clone()?;
                        let progress = entry.snapshot_progress.unwrap_or(0.0);
                        if !progress.is_finite() || !(0.0..=1.0).contains(&progress) {
                            return None;
                        }
                        let entity = state
                            .entities
                            .iter()
                            .find(|entity| entity.id == entry.entity_id)?;
                        if entity.owner_player_id != entry.player_id {
                            return None;
                        }
                        let content = content.as_ref()?;
                        let builder = content.get(&entity.entity_type_id)?;
                        if !builder.builds.iter().any(|build| build.entity_type_id == blueprint_id)
                            || content.get(&blueprint_id).is_none()
                            || entry.build_location.as_ref().is_some_and(|point| {
                                !point.x.is_finite() || !point.y.is_finite()
                            })
                        {
                            return None;
                        }
                        Some((
                            entry.clone(),
                            blueprint_id,
                            progress,
                            entity.entity_type_id.clone(),
                        ))
                    })
                    .collect();
                let restored_transfers: Vec<_> = tracking.active_intents.iter().filter_map(|entry| {
                    if entry.intent_kind != "transport" { return None; }
                    let route = entry.transfer_route.as_ref()?;
                    let actor = state.entities.iter().find(|entity| entity.id == entry.entity_id && entity.owner_player_id == entry.player_id)?;
                    Some((entry.clone(), route.clone(), actor.entity_type_id.clone()))
                }).collect();
                let restored_ids: HashSet<_> = restored_collects
                    .iter()
                    .map(|(entry, ..)| entry.entity_id)
                    .chain(restored_builds.iter().map(|(entry, ..)| entry.entity_id))
                    .chain(restored_transfers.iter().map(|(entry, ..)| entry.entity_id))
                    .collect();
                for entry in &tracking.active_intents {
                    if !restored_ids.contains(&entry.entity_id) {
                        redis.clear_active_intent(entry.entity_id).await?;
                    }
                }

                // Start reading intents from the boundary so any intents that arrived
                // after the snapshot are replayed during the first ticks.
                let last_intent_id = boundary.clone();

                migrate_legacy_neutral_owners(&mut state.entities);
                // Restore joined players from player-owned entities only.
                let joined_players: HashSet<String> = state
                    .entities
                    .iter()
                    .filter_map(|e| {
                        let o = e.owner_player_id.as_str();
                        is_player_owner(o).then(|| o.to_string())
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
                    transport_node_by_entity: HashMap::new(),
                    transport_wait_since_tick_by_entity: HashMap::new(),
                    resource_fractional: HashMap::new(),
                    build_spend_fractional: HashMap::new(),
                    repair_spend_fractional: HashMap::new(),
                    maintenance_spend_fractional: HashMap::new(),
                    resource_spend_total: HashMap::new(),
                    resource_gain_total: HashMap::new(),
                    collector_ui_state_by_entity: HashMap::new(),
                    collection_retry_tick_by_entity: HashMap::new(),
                    prev_collector_ui_state_by_entity: HashMap::new(),
                    combat_effect_ui_state_by_entity: HashMap::new(),
                    prev_combat_effect_ui_state_by_entity: HashMap::new(),
                    combat: CombatSystem::default(),
                    raider_script: RaiderScript::new()?,
                    scenario_runtime: Default::default(),
                    loaded_scenario: None,
                };
                for state in &snapshot_collector_states {
                    if state.carry_amount > 0.0 && engine.state.entities.iter().any(|entity| entity.id == state.entity_id) {
                        engine.carry_by_entity.insert(state.entity_id, CarryState { resource_type: state.resource_type.clone(), amount: state.carry_amount });
                    }
                }
                for (entry, route, entity_type_id) in restored_transfers {
                    let (Ok(intent_id), Ok(client_cmd_id)) = (Uuid::parse_str(&entry.intent_id), Uuid::parse_str(&entry.client_cmd_id)) else {
                        engine.redis.clear_active_intent(entry.entity_id).await?; continue;
                    };
                    let delivery = pb::DeliverIntent { entity_id: entry.entity_id, target_id: route.target_id,
                        donor_id: route.donor_id, resource_type_ids: route.resource_type_ids };
                    let loaded = engine.state.entities.iter().find(|entity| entity.id == entry.entity_id).is_some_and(|entity|
                        delivery.resource_type_ids.iter().any(|resource| resource_amount(entity, resource) > 0.0))
                        || engine.carry_by_entity.get(&entry.entity_id).is_some_and(|cargo| delivery.resource_type_ids.contains(&cargo.resource_type));
                    let metadata = IntentMetadata { intent_id: intent_id.into_bytes().to_vec(), client_cmd_id: client_cmd_id.into_bytes().to_vec(),
                        player_id: entry.player_id, protocol_version: ENGINE_PROTOCOL_MAJOR, server_tick: entry.started_tick, policy: pb::IntentPolicy::ReplaceActive };
                    engine.intents.try_activate(pb::Intent { kind: Some(pb::intent::Kind::Deliver(delivery.clone())) }, metadata.clone(), &entity_type_id);
                    if loaded {
                        if let Some(active) = engine.intents.active_intents_mut().get_mut(&entry.entity_id) {
                            if let Some(pb::action_state::Exec::Deliver(state)) = active.action.exec.as_mut() { state.returning_to_donor = false; }
                        }
                    }
                    engine.redis.persist_active_intent(entry.entity_id, &metadata, "transport", None, None, None, engine.cfg.tracking_ttl_secs).await?;
                    engine.redis.persist_transfer_route(entry.entity_id, &delivery).await?;
                }
                for (entry, resource_type_id, nearest_compatible, entity_type_id) in restored_collects {
                    let (Ok(intent_id), Ok(client_cmd_id)) = (
                        Uuid::parse_str(&entry.intent_id),
                        Uuid::parse_str(&entry.client_cmd_id),
                    ) else {
                        engine.redis.clear_active_intent(entry.entity_id).await?;
                        continue;
                    };
                    let intent = pb::Intent {
                        kind: Some(pb::intent::Kind::Collect(pb::CollectIntent {
                            entity_id: entry.entity_id,
                            client_cmd_id: String::new(),
                            player_id: String::new(),
                            resource_type_id: resource_type_id.clone(),
                            nearest_compatible,
                        })),
                    };
                    let metadata = IntentMetadata {
                        intent_id: intent_id.into_bytes().to_vec(),
                        client_cmd_id: client_cmd_id.into_bytes().to_vec(),
                        player_id: entry.player_id,
                        protocol_version: ENGINE_PROTOCOL_MAJOR,
                        server_tick: entry.started_tick,
                        policy: pb::IntentPolicy::ReplaceActive,
                    };
                    engine
                        .intents
                        .try_activate(intent, metadata.clone(), &entity_type_id);
                    engine
                        .redis
                        .persist_active_intent(
                            entry.entity_id,
                            &metadata,
                            "collect",
                            None,
                            Some((resource_type_id, nearest_compatible)),
                            None,
                            engine.cfg.tracking_ttl_secs,
                        )
                        .await?;
                }
                for (entry, blueprint_id, progress, entity_type_id) in restored_builds {
                    let (Ok(intent_id), Ok(client_cmd_id)) = (
                        Uuid::parse_str(&entry.intent_id),
                        Uuid::parse_str(&entry.client_cmd_id),
                    ) else {
                        engine.redis.clear_active_intent(entry.entity_id).await?;
                        continue;
                    };
                    let intent = pb::Intent {
                        kind: Some(pb::intent::Kind::Build(pb::BuildIntent {
                            entity_id: entry.entity_id,
                            blueprint_id: blueprint_id.clone(),
                            location: entry.build_location.as_ref().map(|point| pb::Vec2 {
                                x: point.x,
                                y: point.y,
                            }),
                            client_cmd_id: String::new(),
                            player_id: String::new(),
                        })),
                    };
                    let metadata = IntentMetadata {
                        intent_id: intent_id.into_bytes().to_vec(),
                        client_cmd_id: client_cmd_id.into_bytes().to_vec(),
                        player_id: entry.player_id,
                        protocol_version: ENGINE_PROTOCOL_MAJOR,
                        server_tick: entry.started_tick,
                        policy: pb::IntentPolicy::ReplaceActive,
                    };
                    engine
                        .intents
                        .try_activate(intent, metadata.clone(), &entity_type_id);
                    if let Some(active) = engine.intents.active_intents_mut().get_mut(&entry.entity_id) {
                        if let Some(pb::action_state::Exec::Build(build)) = active.action.exec.as_mut() {
                            build.progress = progress;
                        }
                    }
                    engine
                        .redis
                        .persist_active_intent(
                            entry.entity_id,
                            &metadata,
                            "build",
                            None,
                            None,
                            Some((blueprint_id.clone(), entry.build_location.clone(), progress)),
                            engine.cfg.tracking_ttl_secs,
                        )
                        .await?;
                }
                engine.hydrate_entity_health_if_missing();
                // Publish a fresh snapshot so newly connecting clients see current state
                let snap_boundary = engine.last_delta_id.as_deref().unwrap_or("0-0");
                engine
                    .redis
                    .publish_snapshot(
                        &engine.state,
                        &engine.resource_spend_total,
                        &engine.resource_gain_total,
                        snap_boundary,
                        engine.collector_states_for_stream(),
                        engine.combat_effect_states_for_stream(),
                    )
                    .await?;
                let build_progress = engine.construction_progress_for_snapshot();
                engine
                    .redis
                    .checkpoint_construction_progress(&build_progress)
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

                engine.initialize_runtime(true).await?;
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

        let mut state = init_world(&spawn_config);
        if let Some(content) = content.as_ref() {
            spawn_celestial_field(
                &mut state.entities,
                content,
                &spawn_config,
                &mut rand::thread_rng(),
            );
        }
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
            transport_node_by_entity: HashMap::new(),
            transport_wait_since_tick_by_entity: HashMap::new(),
            resource_fractional: HashMap::new(),
            build_spend_fractional: HashMap::new(),
            repair_spend_fractional: HashMap::new(),
            maintenance_spend_fractional: HashMap::new(),
            resource_spend_total: HashMap::new(),
            resource_gain_total: HashMap::new(),
            collector_ui_state_by_entity: HashMap::new(),
            collection_retry_tick_by_entity: HashMap::new(),
            prev_collector_ui_state_by_entity: HashMap::new(),
            combat_effect_ui_state_by_entity: HashMap::new(),
            prev_combat_effect_ui_state_by_entity: HashMap::new(),
            combat: CombatSystem::default(),
            raider_script: RaiderScript::new()?,
            scenario_runtime: Default::default(),
            loaded_scenario: None,
        };
        engine
            .redis
            .publish_snapshot(&engine.state, &engine.resource_spend_total, &engine.resource_gain_total, "0-0", Vec::new(), Vec::new())
            .await?;

        // M4: Publish content hash + definitions to Redis
        if let Some(ref pack) = engine.content {
            engine
                .redis
                .publish_content_version(&pack.content_hash)
                .await?;
            let json = pack.to_json()?;
            engine.redis.publish_content_defs(&json).await?;
        }

        engine.initialize_runtime(false).await?;
        Ok(engine)
    }

    /// M6: Spawn for one player on join (idempotent), near a random planet.
    fn ensure_spawned(&mut self, player_id: &str) -> Result<()> {
        if self.scenario_runtime.scenario_id.is_some() { return Ok(()); }
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
        let planets: Vec<_> = self
            .state
            .entities
            .iter()
            .filter_map(|entity| {
                (entity.entity_type_id == "planet_blue")
                    .then_some(entity.pos.as_ref())
                    .flatten()
            })
            .collect();
        let Some(planet) = planets.choose(&mut rng) else {
            anyhow::bail!("cannot spawn player: celestial field has no planet_blue");
        };
        let angle = rng.gen_range(0.0..std::f32::consts::TAU);
        let dist = rng.gen_range(200.0..=800.0);
        let spawn_x = planet.x + angle.cos() * dist;
        let spawn_y = planet.y + angle.sin() * dist;

        let loadout_idx = rand::thread_rng().gen_range(0..sc.loadouts.len());
        let loadout = &sc.loadouts[loadout_idx];
        if !sc.starting_resources.is_empty() {
            let recipient_type = &sc.starting_resources_recipient_type;
            if loadout.get(recipient_type).copied().unwrap_or(0) != 1 {
                anyhow::bail!("starting resource recipient {recipient_type} must appear exactly once in the selected loadout");
            }
            let definition = _content
                .get(recipient_type)
                .ok_or_else(|| anyhow!("unknown starting resource recipient type {recipient_type}"))?;
            for (resource_type, amount) in &sc.starting_resources {
                let capacity = definition.max_capacity.get(resource_type).copied().unwrap_or(0.0);
                if *amount < 0 || *amount as f32 > capacity {
                    anyhow::bail!("starting {resource_type} amount exceeds {recipient_type} capacity");
                }
            }
        }

        let mut next_id = self.state.entities.iter().map(|e| e.id).max().unwrap_or(0) + 1;

        let mut rng = rand::thread_rng();
        next_id = ensure_minerals_near_spawn(
            &mut self.state.entities,
            next_id,
            spawn_x,
            spawn_y,
            _content,
            &mut rng,
        )?;

        let entity_count_before = self.state.entities.len();

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

        // Grant starting stock to the configured player-owned entity.
        if !sc.starting_resources.is_empty() {
            let recipient_type = &sc.starting_resources_recipient_type;
            let recipient = self.state.entities[entity_count_before..]
                .iter_mut()
                .find(|entity| entity.entity_type_id == *recipient_type && entity.owner_player_id == player_id)
                .expect("validated starting resource recipient is spawned");
            for (resource_type, amount) in &sc.starting_resources {
                set_resource_amount(recipient, resource_type, *amount as f64);
            }
        }
        if let Some(content) = self.content.as_ref() {
            let technologies = self
                .state
                .technologies
                .entry(player_id.to_string())
                .or_default();
            technologies.extend(
                content.technologies.iter().filter_map(|(id, definition)| {
                    definition.granted_on_spawn.then_some(id.clone())
                }),
            );
        }

        self.joined_players.insert(player_id.to_string());
        Ok(())
    }

    fn spawn_raiders_at_random_map_locations(&mut self, requested: usize) -> usize {
        const MAX_TERMINAL_RAIDER_SPAWN: usize = 1_000;
        let Some(content) = self.content.as_ref() else {
            warn!("skipping terminal raider spawn: no content pack loaded");
            return 0;
        };
        let Some(definition) = content.get("raider") else {
            warn!("skipping terminal raider spawn: raider type is missing from content");
            return 0;
        };

        // This is an explicit diagnostic command, so it intentionally bypasses
        // the regular AI's `max_raiders` limit. The API and this guard keep an
        // accidental request bounded.
        let count = requested.min(MAX_TERMINAL_RAIDER_SPAWN);

        let mut min_x = f32::INFINITY;
        let mut max_x = f32::NEG_INFINITY;
        let mut min_y = f32::INFINITY;
        let mut max_y = f32::NEG_INFINITY;
        for entity in &self.state.entities {
            let Some(position) = entity.pos.as_ref() else {
                continue;
            };
            if !position.x.is_finite() || !position.y.is_finite() {
                continue;
            }
            min_x = min_x.min(position.x);
            max_x = max_x.max(position.x);
            min_y = min_y.min(position.y);
            max_y = max_y.max(position.y);
        }
        if !min_x.is_finite() {
            min_x = -50_000.0;
            max_x = 50_000.0;
            min_y = -50_000.0;
            max_y = 50_000.0;
        }
        let padding = (max_x - min_x).max(max_y - min_y).max(10_000.0) * 0.05;
        let (min_x, max_x) = (min_x - padding, max_x + padding);
        let (min_y, max_y) = (min_y - padding, max_y + padding);

        let next_id = self
            .state
            .entities
            .iter()
            .map(|entity| entity.id)
            .max()
            .unwrap_or(0)
            .saturating_add(1);
        let health = definition.health.max(0.0);
        let mut rng = rand::thread_rng();
        for offset in 0..count {
            self.state.entities.push(pb::Entity {
                id: next_id.saturating_add(offset as u64),
                entity_type_id: "raider".to_string(),
                pos: Some(pb::Vec2 {
                    x: rng.gen_range(min_x..=max_x),
                    y: rng.gen_range(min_y..=max_y),
                }),
                vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: crate::spawn_config::RAIDERS_OWNER.to_string(),
                health,
                resources: None,
            });
        }
        info!(
            requested,
            spawned = count,
            min_x,
            max_x,
            min_y,
            max_y,
            "spawned terminal raiders at random map locations"
        );
        count
    }

    async fn process_pending_raider_spawns(&mut self) {
        while let Ok(Some(count)) = self.redis.pop_next_pending_raider_spawn().await {
            if self.scenario_runtime.scenario_id.is_none() { self.spawn_raiders_at_random_map_locations(count); }
        }
    }

    /// M4: Resolve entity_type_id for the target entity of an intent.
    fn resolve_entity_type_id(&self, intent: &pb::Intent) -> String {
        let entity_id = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.entity_id,
            Some(pb::intent::Kind::Attack(a)) => a.entity_id,
            Some(pb::intent::Kind::Build(b)) => b.entity_id,
            Some(pb::intent::Kind::Collect(c)) => c.entity_id,
            Some(pb::intent::Kind::Repair(r)) => r.entity_id,
            Some(pb::intent::Kind::Upgrade(u)) => u.entity_id,
            Some(pb::intent::Kind::Research(r)) => r.entity_id,
            Some(pb::intent::Kind::Deliver(d)) => d.entity_id,
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
        *self.resource_gain_total.entry((player_id.to_string(), resource_type.to_string())).or_insert(0.0) += amount as f64;
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

    fn record_resource_spend(&mut self, player_id: &str, resource_type: &str, amount: f32) {
        if amount.is_finite() && amount > 0.0 {
            *self
                .resource_spend_total
                .entry((player_id.to_string(), resource_type.to_string()))
                .or_insert(0.0) += amount as f64;
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
        self.record_resource_spend(player_id, resource_type, amount);
        true
    }

    fn build_donor_ids(&self, builder_id: u64, player_id: &str) -> Vec<u64> {
        let Some(builder) = self.state.entities.iter().find(|entity| entity.id == builder_id) else {
            return Vec::new();
        };
        let Some(builder_pos) = builder.pos.as_ref() else { return vec![builder_id]; };
        let mut donors: Vec<_> = self.state.entities.iter().filter_map(|entity| {
            if entity.owner_player_id != player_id { return None; }
            if entity.id == builder_id { return Some(entity.id); }
            let definition = self.content.as_ref()?.get(&entity.entity_type_id)?;
            let range = definition.resource_sharing.as_ref()?.range;
            let pos = entity.pos.as_ref()?;
            let dx = pos.x - builder_pos.x;
            let dy = pos.y - builder_pos.y;
            (dx * dx + dy * dy <= range * range).then_some(entity.id)
        }).collect();
        donors.sort_unstable();
        donors
    }

    fn available_build_resource(&self, builder_id: u64, player_id: &str, resource: &str) -> f64 {
        let donor_ids = self.build_donor_ids(builder_id, player_id);
        self.state.entities.iter().filter(|entity| donor_ids.binary_search(&entity.id).is_ok())
            .map(|entity| resource_amount(entity, resource)).sum()
    }

    fn spend_build_resources(&mut self, builder_id: u64, player_id: &str, costs: &HashMap<String, f32>) -> bool {
        let donor_ids = self.build_donor_ids(builder_id, player_id);
        if costs.iter().any(|(resource, amount)| {
            self.state.entities.iter().filter(|entity| donor_ids.binary_search(&entity.id).is_ok())
                .map(|entity| resource_amount(entity, resource)).sum::<f64>() + f64::EPSILON < *amount as f64
        }) { return false; }
        for (resource, amount) in costs {
            let mut remaining = *amount as f64;
            for donor_id in &donor_ids {
                let Some(entity) = self.state.entities.iter_mut().find(|entity| entity.id == *donor_id) else { continue; };
                let available = resource_amount(entity, resource);
                let spent = available.min(remaining);
                if spent > 0.0 {
                    set_resource_amount(entity, resource, available - spent);
                    remaining -= spent;
                }
                if remaining <= f64::EPSILON { break; }
            }
            self.record_resource_spend(player_id, resource, *amount);
        }
        true
    }

    /// Atomically charge all resources for one repair tick.
    fn spend_repair_resources(&mut self, player_id: &str, costs: &HashMap<String, f32>) -> bool {
        let charges: Vec<_> = costs
            .iter()
            .map(|(resource, amount)| {
                let key = (player_id.to_string(), resource.clone());
                let total = self
                    .repair_spend_fractional
                    .get(&key)
                    .copied()
                    .unwrap_or(0.0)
                    + amount;
                (resource, key, total.floor() as i64, total.fract())
            })
            .collect();
        if charges.iter().any(|(resource, _, whole, _)| {
            let available = self
                .state
                .ledger
                .get(player_id)
                .and_then(|ledger| ledger.get(*resource))
                .copied()
                .unwrap_or(0);
            available <= 0 || available < *whole
        }) {
            return false;
        }
        let ledger = self.state.ledger.entry(player_id.to_string()).or_default();
        for (resource, key, whole, remainder) in charges {
            if whole > 0 {
                *ledger.entry(resource.clone()).or_insert(0) -= whole;
            }
            if remainder > 0.0 {
                self.repair_spend_fractional.insert(key, remainder);
            } else {
                self.repair_spend_fractional.remove(&key);
            }
        }
        true
    }

    /// Charge continuous upkeep without taking a ledger below zero or accruing debt.
    fn spend_maintenance_resource(&mut self, player_id: &str, resource_type: &str, amount: f32) {
        self.record_resource_spend(player_id, resource_type, amount);
        debit_maintenance_without_debt(
            &mut self.state.ledger,
            &mut self.maintenance_spend_fractional,
            player_id,
            resource_type,
            amount,
        );
    }

    /// Collectors pay upkeep first; wireless receivers pay after receiving supply.
    async fn maintain_and_share_resources(&mut self, dt: f32) -> HashMap<u64, Vec<String>> {
        let mut unpaid = self.apply_maintenance_costs(dt, false);
        let wireless_suppliers = self.share_wireless_collector_resources(&unpaid);
        unpaid.extend(self.apply_maintenance_costs(dt, true));
        self.share_resources(&unpaid, &wireless_suppliers);
        self.emit_starvation_events(&unpaid).await;
        unpaid
    }

    fn apply_maintenance_costs(&mut self, dt: f32, wireless_receivers: bool) -> HashMap<u64, Vec<String>> {
        let mut starvation_damage = HashMap::new();
        let Some(content) = self.content.as_ref() else {
            return starvation_damage;
        };
        if !dt.is_finite() || dt <= 0.0 {
            return starvation_damage;
        }

        let upgrading: HashSet<u64> = self.intents.active_intents().iter().filter_map(|(id, active)| matches!(active.action.exec, Some(pb::action_state::Exec::Upgrade(_))).then_some(*id)).collect();
        let mut spends = Vec::new();
        for entity in &mut self.state.entities {
            if !is_player_owner(&entity.owner_player_id)
                || entity.health <= 0.0
                || upgrading.contains(&entity.id)
            {
                continue;
            }
            let Some(def) = content.get(&entity.entity_type_id) else {
                continue;
            };
            let receives_wirelessly = def.resource_sharing.as_ref()
                .is_some_and(|sharing| sharing.wireless_receives.iter().any(|r| r == "energy"));
            if receives_wirelessly != wireless_receivers { continue; }
            let (mut missing_resources, paid) = pay_entity_upkeep(entity, def, dt, &mut self.maintenance_spend_fractional);
            spends.extend(paid.into_iter().map(|(resource, amount)| (entity.owner_player_id.clone(), resource, amount)));
            if !missing_resources.is_empty() {
                entity.health = (entity.health - 1.0).max(0.0);
                missing_resources.sort_unstable();
                starvation_damage.insert(entity.id, missing_resources);
            }
        }
        for (player_id, resource, amount) in spends { self.record_resource_spend(&player_id, &resource, amount); }
        starvation_damage
    }

    fn share_resources(&mut self, unpaid_entities: &HashMap<u64, Vec<String>>, wireless_suppliers: &HashMap<u64, u64>) {
        let Some(content) = self.content.as_ref() else { return; };
        let entities: Vec<_> = self.state.entities.iter().filter_map(|e| {
            if e.health <= 0.0 || !is_player_owner(&e.owner_player_id)
                || unpaid_entities.contains_key(&e.id) || self.is_upgrading(e.id) { return None; }
            let def = content.get(&e.entity_type_id)?;
            let share = def.resource_sharing.as_ref()?;
            let pos = e.pos.as_ref()?;
            Some((e.id, e.owner_player_id.clone(), e.entity_type_id.clone(), pos.x, pos.y, share.range))
        }).collect();
        let upkeep_types: HashMap<u64, HashSet<String>> = self.state.entities.iter().filter_map(|e| {
            let def = content.get(&e.entity_type_id)?;
            let types = def.maintenance_cost_per_minute.keys().chain(def.sensor.iter().flat_map(|s| s.cost_per_minute.keys())).cloned().collect::<HashSet<_>>();
            Some((e.id, types))
        }).collect();
        for (donor_id, owner, _, x, y, range) in entities {
            let donor_types: Vec<String> = self.state.entities.iter().find(|e| e.id == donor_id).map(|e| e.resources.as_ref().into_iter().flat_map(|i| i.resources.iter().map(|r| r.resource_type.clone())).collect()).unwrap_or_default();
            for resource in donor_types {
                let mut recipients: Vec<u64> = self.state.entities.iter().filter(|e| {
                    if e.id == donor_id || e.owner_player_id != owner || !upkeep_types.get(&e.id).is_some_and(|types| types.contains(&resource)) { return false; }
                    if e.health <= 0.0 || self.is_upgrading(e.id) { return false; }
                    // Do not return energy to a collector that just supplied this donor.
                    if resource == "energy" && wireless_suppliers.get(&e.id) == Some(&donor_id) { return false; }
                    let Some(pos) = e.pos.as_ref() else { return false; };
                    let dx = pos.x - x; let dy = pos.y - y;
                    dx * dx + dy * dy <= range * range
                }).map(|e| e.id).collect();
                recipients.sort_unstable();
                let mut donor_stock = self.state.entities.iter().find(|e| e.id == donor_id).map(|e| resource_amount(e, &resource)).unwrap_or(0.0);
                let reserve = accrued_upkeep(&self.maintenance_spend_fractional, donor_id, &resource);
                for recipient_id in recipients {
                    if donor_stock <= reserve + f64::EPSILON { break; }
                    let Some(target) = self.state.entities.iter_mut().find(|e| e.id == recipient_id) else { continue; };
                    let capacity = resource_capacity(content, &target.entity_type_id, &resource);
                    let amount = (donor_stock - reserve).min((capacity - resource_amount(target, &resource)).max(0.0));
                    if amount > 0.0 {
                        set_resource_amount(target, &resource, resource_amount(target, &resource) + amount);
                        donor_stock -= amount;
                    }
                }
                if let Some(donor) = self.state.entities.iter_mut().find(|e| e.id == donor_id) { set_resource_amount(donor, &resource, donor_stock); }
            }
        }
    }

    fn share_wireless_collector_resources(&mut self, unpaid_entities: &HashMap<u64, Vec<String>>) -> HashMap<u64, u64> {
        let mut suppliers = HashMap::new();
        let Some(content) = self.content.as_ref() else {
            return suppliers;
        };
        let mut receivers: Vec<_> = self
            .state
            .entities
            .iter()
            .filter_map(|entity| {
                if entity.health <= 0.0 || !is_player_owner(&entity.owner_player_id)
                    || self.is_upgrading(entity.id) { return None; }
                let definition = content.get(&entity.entity_type_id)?;
                let sharing = definition.resource_sharing.as_ref()?;
                if !sharing.wireless_receives.iter().any(|resource| resource == "energy") {
                    return None;
                }
                let position = entity.pos.as_ref()?;
                let capacity = resource_capacity(content, &entity.entity_type_id, "energy");
                let remaining = (capacity - resource_amount(entity, "energy")).max(0.0);
                Some((
                    entity.id,
                    entity.owner_player_id.clone(),
                    position.x,
                    position.y,
                    sharing.range,
                    remaining,
                ))
            })
            .collect();
        let mut collectors: Vec<_> = self
            .state
            .entities
            .iter()
            .filter(|entity| {
                matches!(entity.entity_type_id.as_str(), "collector_solar" | "collector_solar_v2")
                    && entity.health > 0.0
                    && !unpaid_entities.contains_key(&entity.id)
                    && is_player_owner(&entity.owner_player_id)
            })
            .filter_map(|entity| {
                let position = entity.pos.as_ref()?;
                Some((
                    entity.id,
                    entity.owner_player_id.clone(),
                    position.x,
                    position.y,
                ))
            })
            .collect();
        collectors.sort_by_key(|collector| collector.0);

        for (collector_id, owner, x, y) in collectors {
            if self.is_upgrading(collector_id) {
                continue;
            }
            let recipient = receivers
                .iter()
                .enumerate()
                .filter(|(_, (_, recipient_owner, _, _, _, remaining))| {
                    recipient_owner == &owner && *remaining > f64::EPSILON
                })
                .filter_map(|(index, (id, _, rx, ry, range, _))| {
                    let distance_sq = Self::distance_sq(x, y, *rx, *ry);
                    (distance_sq <= range * range).then_some((index, *id, distance_sq))
                })
                .min_by(|a, b| a.2.total_cmp(&b.2).then_with(|| a.1.cmp(&b.1)));
            let Some((receiver_index, recipient_id, _)) = recipient else {
                continue;
            };
            let available = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == collector_id)
                .map(|entity| resource_amount(entity, "energy"))
                .unwrap_or(0.0);
            if available <= f64::EPSILON {
                continue;
            }
            let surplus = (available - accrued_upkeep(&self.maintenance_spend_fractional, collector_id, "energy")).max(0.0);
            let amount = surplus.min(receivers[receiver_index].5);
            if amount <= 0.0 {
                continue;
            }
            let Some(target) = self
                .state
                .entities
                .iter_mut()
                .find(|entity| entity.id == recipient_id)
            else {
                continue;
            };
            set_resource_amount(target, "energy", resource_amount(target, "energy") + amount);
            if let Some(source) = self
                .state
                .entities
                .iter_mut()
                .find(|entity| entity.id == collector_id)
            {
                set_resource_amount(source, "energy", available - amount);
            }
            receivers[receiver_index].5 -= amount;
            suppliers.insert(collector_id, recipient_id);
            if let Some(state) = self.collector_ui_state_by_entity.get_mut(&collector_id) {
                state.receiving_entity_id = Some(recipient_id);
            }
        }
        suppliers
    }

    /// An upgrading entity is entirely inactive: it cannot provide passive
    /// economy, collection, refinery, radiation, or autonomous combat effects.
    fn is_upgrading(&self, entity_id: u64) -> bool {
        self.intents
            .active_intents()
            .get(&entity_id)
            .is_some_and(|active| {
                matches!(
                    active.action.exec.as_ref(),
                    Some(pb::action_state::Exec::Upgrade(_))
                )
            })
    }

    /// Advance active production and upgrade channels, charging their
    /// content-defined resource rates. Builds spawn a product; upgrades
    /// transform their source entity in place.
    async fn advance_builds(&mut self, dt: f32) {
        let Some(content) = self.content.clone() else {
            return;
        };
        let mut updates = Vec::new();
        for (entity_id, active) in self.intents.active_intents() {
            let (target_entity_type_id, old_progress, is_upgrade) =
                match active.action.exec.as_ref() {
                    Some(pb::action_state::Exec::Build(build)) => {
                        (build.blueprint_id.as_str(), build.progress, false)
                    }
                    Some(pb::action_state::Exec::Upgrade(upgrade)) => (
                        upgrade.target_entity_type_id.as_str(),
                        upgrade.progress,
                        true,
                    ),
                    _ => continue,
                };
            if target_entity_type_id.is_empty() {
                continue;
            }
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
            let option = if is_upgrade {
                builder_def
                    .upgrades
                    .iter()
                    .find(|option| option.entity_type_id == target_entity_type_id)
                    .map(|option| option.spend_rates.clone())
            } else {
                builder_def
                    .builds
                    .iter()
                    .find(|option| option.entity_type_id == target_entity_type_id)
                    .map(|option| option.spend_rates.clone())
            };
            let Some(rates) = option else {
                continue;
            };
            let Some(product_def) = content.get(target_entity_type_id) else {
                continue;
            };
            let mut duration = 0.0f32;
            for (resource, cost) in &product_def.build_cost {
                if *cost <= 0.0 {
                    continue;
                }
                let rate = rates.get(resource).copied().unwrap_or(1.0);
                if rate <= 0.0 {
                    continue;
                }
                duration = duration.max(*cost / rate);
            }
            if duration > 0.0 {
                updates.push((
                    *entity_id,
                    active.metadata.player_id.clone(),
                    target_entity_type_id.to_string(),
                    old_progress,
                    duration,
                    rates,
                    product_def.build_cost.clone(),
                    is_upgrade,
                ));
            }
        }

        let mut completed = Vec::new();
        for (
            entity_id,
            player_id,
            target_entity_type_id,
            old_progress,
            duration,
            rates,
            costs,
            is_upgrade,
        ) in updates
        {
            let new_progress = (old_progress + dt / duration).min(1.0);
            let old_elapsed = old_progress * duration;
            let new_elapsed = new_progress * duration;
            let mut tick_costs = HashMap::new();
            let mut can_spend = true;
            for (resource, cost) in &costs {
                if *cost <= 0.0 {
                    continue;
                }
                let rate = rates.get(resource).copied().unwrap_or(1.0);
                let amount =
                    ((new_elapsed * rate).min(*cost) - (old_elapsed * rate).min(*cost)).max(0.0);
                if amount > 0.0 {
                    if is_upgrade {
                        can_spend &= self.spend_resource(&player_id, resource, amount);
                    } else {
                        tick_costs.insert(resource.clone(), amount);
                    }
                }
            }
            if !is_upgrade {
                can_spend &= self.spend_build_resources(entity_id, &player_id, &tick_costs);
            }
            if !can_spend {
                continue;
            }
            if let Some(active) = self.intents.active_intents_mut().get_mut(&entity_id) {
                match active.action.exec.as_mut() {
                    Some(pb::action_state::Exec::Build(build)) if !is_upgrade => {
                        build.progress = new_progress;
                    }
                    Some(pb::action_state::Exec::Upgrade(upgrade)) if is_upgrade => {
                        upgrade.progress = new_progress;
                    }
                    _ => continue,
                }
            }
            if let Err(error) = self
                .redis
                .update_construction_progress(
                    entity_id,
                    if is_upgrade { "upgrade" } else { "build" },
                    &target_entity_type_id,
                    new_progress,
                )
                .await
            {
                warn!(
                    ?error,
                    entity_id, "failed to update build progress tracking"
                );
            }
            if new_progress >= 1.0 {
                completed.push((entity_id, player_id, target_entity_type_id, is_upgrade));
            }
        }

        for (builder_id, player_id, target_entity_type_id, is_upgrade) in completed {
            if is_upgrade {
                let Some(target_def) = content.get(&target_entity_type_id) else {
                    continue;
                };
                let Some(entity) = self
                    .state
                    .entities
                    .iter_mut()
                    .find(|entity| entity.id == builder_id)
                else {
                    continue;
                };
                let source_health = content
                    .get(&entity.entity_type_id)
                    .map(|definition| definition.health.max(0.0))
                    .unwrap_or(0.0);
                let health_fraction = if source_health > 0.0 {
                    (entity.health / source_health).clamp(0.0, 1.0)
                } else {
                    0.0
                };
                entity.entity_type_id = target_entity_type_id;
                entity.health = target_def.health.max(0.0) * health_fraction;
                entity.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 });
                entity.force = Some(pb::Vec2 { x: 0.0, y: 0.0 });
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
                continue;
            }
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
            let (Some(builder_def), Some(product_def)) = (
                content.get(&builder.entity_type_id),
                content.get(&target_entity_type_id),
            ) else {
                continue;
            };
            let spawn_distance = builder_def.hull_radius + product_def.hull_radius;
            let health = product_def.health.max(0.0);
            self.state.entities.push(pb::Entity {
                id: next_id,
                entity_type_id: target_entity_type_id,
                pos: Some(pb::Vec2 {
                    x: pos.x + angle.cos() * spawn_distance,
                    y: pos.y + angle.sin() * spawn_distance,
                }),
                vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: player_id,
                health,
                resources: None,
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

    /// Advance research channels. Research shares the construction spending
    /// model but completion changes player state rather than spawning a unit.
    async fn advance_research(&mut self, dt: f32) {
        let Some(content) = self.content.clone() else {
            return;
        };
        let mut completed = Vec::new();
        let jobs: Vec<_> = self
            .intents
            .active_intents()
            .iter()
            .filter_map(|(entity_id, active)| {
                let Some(pb::action_state::Exec::Research(research)) = active.action.exec.as_ref()
                else {
                    return None;
                };
                Some((
                    *entity_id,
                    active.metadata.player_id.clone(),
                    research.technology_id.clone(),
                    research.progress,
                ))
            })
            .collect();
        for (entity_id, player_id, technology_id, old_progress) in jobs {
            let Some(technology) = content.technologies.get(&technology_id) else {
                continue;
            };
            let duration = technology
                .research_cost
                .iter()
                .filter_map(|(resource, cost)| {
                    (*cost > 0.0).then(|| {
                        *cost
                            / technology
                                .research_rates
                                .get(resource)
                                .copied()
                                .unwrap_or(1.0)
                    })
                })
                .fold(0.0f32, f32::max);
            if duration <= 0.0 {
                continue;
            }
            let new_progress = (old_progress + dt / duration).min(1.0);
            let old_elapsed = old_progress * duration;
            let new_elapsed = new_progress * duration;
            let mut affordable = true;
            for (resource, cost) in &technology.research_cost {
                let rate = technology
                    .research_rates
                    .get(resource)
                    .copied()
                    .unwrap_or(1.0);
                let amount =
                    ((new_elapsed * rate).min(*cost) - (old_elapsed * rate).min(*cost)).max(0.0);
                affordable &= self.spend_resource(&player_id, resource, amount);
            }
            if !affordable {
                continue;
            }
            if let Some(active) = self.intents.active_intents_mut().get_mut(&entity_id) {
                if let Some(pb::action_state::Exec::Research(research)) =
                    active.action.exec.as_mut()
                {
                    research.progress = new_progress;
                }
            }
            if let Err(error) = self
                .redis
                .update_construction_progress(entity_id, "research", &technology_id, new_progress)
                .await
            {
                warn!(
                    ?error,
                    entity_id, "failed to update research progress tracking"
                );
            }
            if new_progress >= 1.0 {
                completed.push((entity_id, player_id, technology_id));
            }
        }
        for (entity_id, player_id, technology_id) in completed {
            self.state
                .technologies
                .entry(player_id)
                .or_default()
                .insert(technology_id);
            if let Some(metadata) = self.intents.finish(entity_id) {
                if let Err(error) = self.redis.clear_active_intent(entity_id).await {
                    warn!(
                        ?error,
                        entity_id, "failed to clear completed research tracking"
                    );
                }
                if let Err(error) = self
                    .emit_lifecycle_event(
                        &metadata,
                        pb::LifecycleState::Finished,
                        pb::LifecycleReason::None,
                        self.state.tick,
                    )
                    .await
                {
                    warn!(
                        ?error,
                        entity_id, "failed to emit completed research lifecycle event"
                    );
                }
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
        let (assigned_resource_type, assigned_nearest_compatible) = self
            .intents
            .active_collect_assignment(entity_id)
            .unwrap_or_default();
        self.collector_ui_state_by_entity.insert(
            entity_id,
            CollectorUiState {
                activity: activity.to_string(),
                resource_type: resource_type.to_string(),
                carry_amount: carry_amount.max(0.0),
                carry_capacity: carry_capacity.max(0.0),
                effective_rate_per_second: effective_rate_per_second.max(0.0),
                assigned_resource_type,
                assigned_nearest_compatible,
                receiving_entity_id: None,
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
            if self.is_upgrading(e.id) {
                continue;
            }
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
                max_simultaneous_collectors: node.max_simultaneous_collectors,
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
            if self.is_upgrading(e.id) {
                continue;
            }
            let owner = e.owner_player_id.as_str();
            if !is_player_owner(owner) {
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
                max_capacity: entity_type.max_capacity.clone(),
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
            if self.is_upgrading(e.id) {
                continue;
            }
            let owner = e.owner_player_id.as_str();
            if !is_player_owner(owner) {
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
        Self::compute_radiation_damage_excluding_sources(state, content, &HashSet::new())
    }

    fn compute_radiation_damage_excluding_sources(
        state: &GameState,
        content: &ContentPack,
        disabled_source_ids: &HashSet<u64>,
    ) -> HashMap<u64, f32> {
        Self::compute_radiation_damage_and_sources(state, content, disabled_source_ids)
            .into_iter()
            .map(|(entity_id, (damage, _))| (entity_id, damage))
            .collect()
    }

    fn compute_radiation_damage_and_sources(
        state: &GameState,
        content: &ContentPack,
        disabled_source_ids: &HashSet<u64>,
    ) -> HashMap<u64, (f32, u64)> {
        let mut damage_by_entity = HashMap::new();
        let mut sources = Vec::new();
        for entity in &state.entities {
            if disabled_source_ids.contains(&entity.id) {
                continue;
            }
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

        let mut sources_by_cell = SpatialIndex::new();
        for (source_index, source) in sources.iter().enumerate() {
            sources_by_cell.insert_area(
                source_index,
                source.x,
                source.y,
                source.max_effective_distance,
            );
        }

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
            let contributions: Vec<(u64, f32)> = sources_by_cell
                .at(pos.x, pos.y)
                .map(|index| &sources[index])
                .filter(|source| source.entity_id != entity.id)
                .filter_map(|source| {
                    let distance_sq = Self::distance_sq(pos.x, pos.y, source.x, source.y);
                    if distance_sq > source.max_effective_distance.powi(2) {
                        return None;
                    }
                    let actual_distance = distance_sq.sqrt();
                    let damage = Self::radiation_damage_per_second(source, entity_type, actual_distance);
                    (damage > 0.0).then_some((source.entity_id, damage))
                })
                .collect();
            if let Some((source_id, _)) = contributions.iter().max_by(|a, b| {
                a.1.total_cmp(&b.1).then_with(|| b.0.cmp(&a.0))
            }) {
                let total = contributions.iter().map(|(_, damage)| damage).sum();
                damage_by_entity.insert(entity.id, (total, *source_id));
            }
        }

        damage_by_entity
    }

    fn apply_radiation_damage(&mut self, dt: f32) -> HashMap<u64, u64> {
        let mut damaged_entities = HashMap::new();
        let Some(content) = self.content.as_ref() else {
            return damaged_entities;
        };
        if dt <= 0.0 {
            return damaged_entities;
        }
        let upgrading_ids: HashSet<u64> = self
            .intents
            .active_intents()
            .iter()
            .filter_map(|(entity_id, active)| {
                matches!(
                    active.action.exec.as_ref(),
                    Some(pb::action_state::Exec::Upgrade(_))
                )
                .then_some(*entity_id)
            })
            .collect();
        let damage_by_entity =
            Self::compute_radiation_damage_and_sources(&self.state, content, &upgrading_ids);
        for entity in &mut self.state.entities {
            let Some((damage_per_second, source_id)) = damage_by_entity.get(&entity.id).copied() else {
                continue;
            };
            let health = (entity.health - damage_per_second * dt).max(0.0);
            if health < entity.health {
                damaged_entities.insert(entity.id, source_id);
                entity.health = health;
            }
        }
        damaged_entities
    }

    /// Removes every entity whose authoritative health has reached zero.
    /// Radiation resolves after autonomous combat, so it needs this separate
    /// cleanup path to produce the same removal delta as combat deaths.
    fn remove_zero_health_entities(&mut self) -> Vec<u64> {
        let dead_entity_ids = remove_zero_health_entities(&mut self.state.entities);
        for entity_id in &dead_entity_ids {
            self.clear_fractional_for_entity(*entity_id);
        }
        dead_entity_ids
    }

    fn apply_raider_ai(&mut self) -> NpcCommands {
        let Some(content) = self.content.as_ref() else {
            return NpcCommands::default();
        };
        match self.raider_script.tick_with_spatial_index(
            &mut self.state.entities,
            content,
            self.state.tick,
            self.cfg.tps,
            if self.scenario_runtime.scenario_id.is_some() { 0 } else { self.spawn_config.max_raiders },
            self.cfg
                .raider_ai_spatial_index_mode
                .enabled_at(self.state.tick),
        ) {
            Ok(commands) => commands,
            Err(error) => {
                warn!(?error, tick = self.state.tick, "raider Lua script failed");
                NpcCommands::default()
            }
        }
    }

    /// Advance autonomous combat and remove entities killed by it.
    /// Returns killed IDs so the tick loop can cancel any active player intent
    /// and update reconnect tracking before publishing the resulting delta.
    fn apply_autonomous_combat(
        &mut self,
        dt: f32,
        commands: &NpcCommands,
    ) -> crate::combat::CombatTick {
        let Some(content) = self.content.as_ref() else {
            return crate::combat::CombatTick {
                dead_entity_ids: Vec::new(),
                laser_shots: Vec::new(),
                dismantling: Vec::new(),
                destructions: Vec::new(),
            };
        };
        let commanded_entity_ids: HashSet<u64> =
            self.intents.active_intents().keys().copied().collect();
        let outcome = self.combat.tick_with_scripted_targets(
            &mut self.state.entities,
            content,
            self.state.tick,
            dt,
            &commanded_entity_ids,
            &commands.target_by_entity,
            &commands.scripted_entity_ids,
        );
        self.update_combat_effect_states(&outcome.dismantling);
        if outcome.dead_entity_ids.is_empty() {
            return outcome;
        }
        let dead_ids: HashSet<u64> = outcome.dead_entity_ids.iter().copied().collect();
        self.state
            .entities
            .retain(|entity| !dead_ids.contains(&entity.id));
        for entity_id in &outcome.dead_entity_ids {
            self.clear_fractional_for_entity(*entity_id);
        }
        outcome
    }

    fn update_combat_effect_states(&mut self, dismantling: &[crate::combat::Dismantling]) {
        let active: HashMap<u64, &crate::combat::Dismantling> = dismantling
            .iter()
            .map(|state| (state.attacker_id, state))
            .collect();
        let previous_ids: Vec<u64> = self
            .combat_effect_ui_state_by_entity
            .keys()
            .copied()
            .collect();
        for entity_id in previous_ids {
            if active.contains_key(&entity_id) {
                continue;
            }
            let previous = self.combat_effect_ui_state_by_entity.get(&entity_id);
            if !previous.is_some_and(|state| state.activity == "dismantling") {
                continue;
            }
            self.combat_effect_ui_state_by_entity.insert(
                entity_id,
                CombatEffectUiState {
                    activity: "idle".to_string(),
                    target_id: 0,
                    attack_id: String::new(),
                    updated_tick: self.state.tick,
                },
            );
        }
        for state in dismantling {
            let unchanged = self
                .combat_effect_ui_state_by_entity
                .get(&state.attacker_id)
                .is_some_and(|previous| {
                    previous.activity == "dismantling"
                        && previous.target_id == state.target_id
                        && previous.attack_id == state.attack_id
                });
            if !unchanged {
                self.combat_effect_ui_state_by_entity.insert(
                    state.attacker_id,
                    CombatEffectUiState {
                        activity: "dismantling".to_string(),
                        target_id: state.target_id,
                        attack_id: state.attack_id.clone(),
                        updated_tick: self.state.tick,
                    },
                );
            }
        }
    }

    async fn advance_resource_transport(&mut self, id: u64, delivery: &pb::DeliverState, dt: f32) {
        let actor = self.state.entities.iter().find(|entity| entity.id == id).cloned();
        let donor = self.state.entities.iter().find(|entity| entity.id == delivery.donor_id).cloned();
        let recipient = self.state.entities.iter().find(|entity| entity.id == delivery.target_id).cloned();
        let valid = actor.zip(donor).zip(recipient).and_then(|((actor, donor), recipient)| {
            let content = self.content.as_ref()?;
            let actor_def = content.get(&actor.entity_type_id)?;
            let donor_def = content.get(&donor.entity_type_id)?;
            let recipient_def = content.get(&recipient.entity_type_id)?;
            (actor.health > 0.0 && donor.health > 0.0 && recipient.health > 0.0
                && self.intents.active_intents().get(&id).is_some_and(|active| active.metadata.player_id == actor.owner_player_id)
                && actor.id != donor.id && actor.id != recipient.id && donor.id != recipient.id
                && actor.owner_player_id == donor.owner_player_id && actor.owner_player_id == recipient.owner_player_id
                && actor.pos.is_some() && donor.pos.is_some() && recipient.pos.is_some()
                && actor_def.speed > 0.0 && actor_def.collector.as_ref().is_some_and(|collector| collector.carry_capacity > 0.0)
                && delivery.resource_type_ids.iter().all(|resource|
                    actor_def.max_capacity.get(resource).copied().unwrap_or(0.0) > 0.0
                    && donor_def.max_capacity.get(resource).copied().unwrap_or(0.0) > 0.0
                    && recipient_def.max_capacity.get(resource).copied().unwrap_or(0.0) > 0.0))
                .then_some((actor, donor, recipient, actor_def.clone(), donor_def.clone(), recipient_def.clone()))
        });
        let Some((mut actor, mut donor, mut recipient, actor_def, donor_def, recipient_def)) = valid else {
            if let Some(actor) = self.state.entities.iter_mut().find(|entity| entity.id == id) {
                actor.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 });
            }
            if let Some(metadata) = self.intents.finish(id) {
                self.redis.clear_active_intent(id).await.ok();
                self.emit_lifecycle_event(&metadata, pb::LifecycleState::Canceled,
                    pb::LifecycleReason::TransferEndpointLost, self.state.tick).await.ok();
            }
            return;
        };
        if self.state.tick < delivery.retry_tick {
            if let Some(entity) = self.state.entities.iter_mut().find(|entity| entity.id == id) { entity.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 }); }
            return;
        }
        let (endpoint, endpoint_def) = if delivery.returning_to_donor { (&donor, &donor_def) } else { (&recipient, &recipient_def) };
        let pos = actor.pos.as_ref().unwrap();
        let to = endpoint.pos.as_ref().unwrap();
        let distance = Self::distance_sq(pos.x, pos.y, to.x, to.y).sqrt();
        let range = actor_def.hull_radius + endpoint_def.hull_radius + actor_def.stop_radius.max(1.0);
        let capacity = actor_def.collector.as_ref().unwrap().carry_capacity;
        if !Self::reached_contact(pos, to, range) {
            if let Some(entity) = self.state.entities.iter_mut().find(|entity| entity.id == id) {
                Self::drive_velocity_toward(entity, actor_def.speed.min((distance-range)/dt), to.x, to.y, range);
            }
            let cargo = self.carry_by_entity.get(&id).cloned();
            self.set_collector_ui_state(id, if delivery.returning_to_donor { "moving_to_donor" } else { "moving_to_recipient" },
                cargo.as_ref().map_or("", |cargo| cargo.resource_type.as_str()), cargo.as_ref().map_or(0.0, |cargo| cargo.amount), capacity, 0.0);
            return;
        }
        let cargo = self.carry_by_entity.get(&id).cloned();
        let mut returning = delivery.returning_to_donor;
        let held = |actor: &pb::Entity, cargo: Option<&CarryState>| -> f64 {
            delivery.resource_type_ids.iter().map(|resource| resource_amount(actor, resource)).sum::<f64>()
                + cargo.filter(|cargo| delivery.resource_type_ids.contains(&cargo.resource_type)).map_or(0.0, |cargo| cargo.amount as f64)
        };
        let activity;
        if returning {
            load_transfer_resources(&mut actor, &mut donor, &recipient, &actor_def, &recipient_def,
                &delivery.resource_type_ids, cargo.as_ref());
            if held(&actor, cargo.as_ref()) > f64::EPSILON { returning = false; activity = "moving_to_recipient"; }
            else if delivery.resource_type_ids.iter().all(|resource| resource_amount(&donor, resource) <= f64::EPSILON) {
                activity = "waiting_for_resources";
            } else { activity = "waiting_for_capacity"; }
        } else {
            deliver_resources(&mut actor, &mut recipient, &recipient_def, &delivery.resource_type_ids, self.carry_by_entity.get_mut(&id));
            if held(&actor, self.carry_by_entity.get(&id)) <= f64::EPSILON { returning = true; activity = "moving_to_donor"; }
            else { activity = "waiting_for_capacity"; }
        }
        for entity in &mut self.state.entities {
            if entity.id == id { entity.resources = actor.resources.clone(); entity.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 }); }
            if entity.id == donor.id { entity.resources = donor.resources.clone(); }
            if entity.id == recipient.id { entity.resources = recipient.resources.clone(); }
        }
        if let Some(active) = self.intents.active_intents_mut().get_mut(&id) {
            if let Some(pb::action_state::Exec::Deliver(state)) = active.action.exec.as_mut() {
                state.returning_to_donor = returning;
                state.retry_tick = if activity.starts_with("waiting") { self.state.tick + self.cfg.tps as u64 } else { 0 };
            }
        }
        let cargo = self.carry_by_entity.get(&id);
        // Shipment amounts are already in entity inventory; retain the separate collection-cargo view.
        let cargo_resource = cargo.map_or(String::new(), |cargo| cargo.resource_type.clone());
        let cargo_amount = cargo.map_or(0.0, |cargo| cargo.amount);
        self.set_collector_ui_state(id, activity, &cargo_resource, cargo_amount, capacity, 0.0);
    }

    /// Follow a friendly recipient and complete a single delivery trip.
    async fn advance_deliveries(&mut self, dt: f32) {
        let mut deliveries: Vec<_> = self.intents.active_intents().iter()
            .filter_map(|(id, active)| match active.action.exec.as_ref() {
                Some(pb::action_state::Exec::Deliver(delivery)) => Some((*id, delivery.clone())),
                _ => None,
            }).collect();
        deliveries.sort_by_key(|(id, _)| *id);
        for (id, delivery) in deliveries {
            if delivery.donor_id != 0 { self.advance_resource_transport(id, &delivery, dt).await; continue; }
            let actor = self.state.entities.iter().find(|e| e.id == id).cloned();
            let target = self.state.entities.iter().find(|e| e.id == delivery.target_id).cloned();
            let valid = actor.zip(target).and_then(|(actor, target)| {
                let content = self.content.as_ref()?;
                let actor_def = content.get(&actor.entity_type_id)?;
                let target_def = content.get(&target.entity_type_id)?;
                (actor.id != target.id && actor.health > 0.0 && target.health > 0.0
                    && actor.owner_player_id == target.owner_player_id)
                    .then_some((actor, target, actor_def.clone(), target_def.clone()))
            });
            let mut canceled = true;
            if let Some((mut actor, mut target, actor_def, target_def)) = valid {
                if let (Some(pos), Some(to)) = (actor.pos.as_ref(), target.pos.as_ref()) {
                    let distance = Self::distance_sq(pos.x, pos.y, to.x, to.y).sqrt();
                    let range = actor_def.hull_radius + target_def.hull_radius + actor_def.stop_radius.max(1.0);
                    if !Self::reached_contact(pos, to, range) {
                        if let Some(entity) = self.state.entities.iter_mut().find(|e| e.id == id) {
                            let speed = actor_def.speed.min((distance - range) / dt);
                            Self::drive_velocity_toward(entity, speed, to.x, to.y, range);
                        }
                        continue;
                    }
                    deliver_resources(&mut actor, &mut target, &target_def,
                        &delivery.resource_type_ids, self.carry_by_entity.get_mut(&id));
                    for entity in &mut self.state.entities {
                        if entity.id == id { entity.resources = actor.resources.clone(); }
                        if entity.id == target.id { entity.resources = target.resources.clone(); }
                    }
                    let cargo = self.carry_by_entity.get(&id).cloned();
                    if let Some(collector) = actor_def.collector.as_ref() {
                        self.set_collector_ui_state(id, COLLECTOR_ACTIVITY_IDLE,
                            cargo.as_ref().map(|c| c.resource_type.as_str()).unwrap_or(""),
                            cargo.as_ref().map(|c| c.amount).unwrap_or(0.0), collector.carry_capacity, 0.0);
                    }
                    canceled = false;
                }
            }
            if let Some(entity) = self.state.entities.iter_mut().find(|e| e.id == id) {
                entity.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 });
            }
            if let Some(metadata) = self.intents.finish(id) {
                if let Err(error) = self.redis.clear_active_intent(id).await {
                    warn!(?error, entity_id = id, "failed to clear delivery tracking");
                }
                let state = if canceled { pb::LifecycleState::Canceled } else { pb::LifecycleState::Finished };
                let reason = if canceled { pb::LifecycleReason::InvalidTarget } else { pb::LifecycleReason::None };
                if let Err(error) = self.emit_lifecycle_event(&metadata, state, reason, self.state.tick).await {
                    warn!(?error, entity_id = id, "failed to publish delivery lifecycle");
                }
            }
        }
    }

    /// Move repairers into range, charge their owner, and restore target health.
    async fn apply_repairs(&mut self, dt: f32) {
        let Some(content) = self.content.clone() else {
            return;
        };
        let repairs: Vec<(u64, u64)> = self
            .intents
            .active_intents()
            .iter()
            .filter_map(|(entity_id, active)| match active.action.exec.as_ref() {
                Some(pb::action_state::Exec::Repair(repair)) => {
                    Some((*entity_id, repair.target_id))
                }
                _ => None,
            })
            .collect();
        let mut finished = Vec::new();
        let mut active_effects = HashSet::new();

        for (entity_id, target_id) in repairs {
            let actor = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == entity_id)
                .cloned();
            let target = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == target_id)
                .cloned();
            let Some((actor, target, ability, max_health)) = actor.and_then(|actor| {
                let ability = content.get(&actor.entity_type_id)?.repair.clone()?;
                let target = target?;
                let max_health = content.get(&target.entity_type_id)?.health;
                (target.owner_player_id == actor.owner_player_id && target.health > 0.0)
                    .then_some((actor, target, ability, max_health))
            }) else {
                finished.push(entity_id);
                continue;
            };
            if target.health >= max_health {
                finished.push(entity_id);
                continue;
            }
            let (Some(actor_pos), Some(target_pos)) = (actor.pos.as_ref(), target.pos.as_ref())
            else {
                finished.push(entity_id);
                continue;
            };
            if Self::distance_sq(actor_pos.x, actor_pos.y, target_pos.x, target_pos.y)
                > ability.range * ability.range
            {
                if let Some(entity) = self
                    .state
                    .entities
                    .iter_mut()
                    .find(|entity| entity.id == entity_id)
                {
                    Self::drive_velocity_toward(
                        entity,
                        content
                            .get(&actor.entity_type_id)
                            .map(|d| d.speed)
                            .unwrap_or(0.0),
                        target_pos.x,
                        target_pos.y,
                        ability.range,
                    );
                }
                continue;
            }
            if let Some(entity) = self
                .state
                .entities
                .iter_mut()
                .find(|entity| entity.id == entity_id)
            {
                if let Some(velocity) = entity.vel.as_mut() {
                    velocity.x = 0.0;
                    velocity.y = 0.0;
                }
            }
            let (restored_health, costs) = repair_tick(&ability, dt, max_health - target.health);
            if restored_health <= 0.0 {
                finished.push(entity_id);
                continue;
            }
            if !self.spend_repair_resources(&actor.owner_player_id, &costs) {
                continue;
            }
            if let Some(entity) = self
                .state
                .entities
                .iter_mut()
                .find(|entity| entity.id == target_id)
            {
                entity.health = (entity.health + restored_health).min(max_health);
            }
            active_effects.insert(entity_id);
            let unchanged = self
                .combat_effect_ui_state_by_entity
                .get(&entity_id)
                .is_some_and(|state| state.activity == "repairing" && state.target_id == target_id);
            if !unchanged {
                self.combat_effect_ui_state_by_entity.insert(
                    entity_id,
                    CombatEffectUiState {
                        activity: "repairing".to_string(),
                        target_id,
                        attack_id: "repair".to_string(),
                        updated_tick: self.state.tick,
                    },
                );
            }
            if target.health + restored_health >= max_health {
                finished.push(entity_id);
            }
        }

        for entity_id in self
            .combat_effect_ui_state_by_entity
            .iter()
            .filter_map(|(entity_id, state)| {
                (state.activity == "repairing" && !active_effects.contains(entity_id))
                    .then_some(*entity_id)
            })
            .collect::<Vec<_>>()
        {
            self.combat_effect_ui_state_by_entity.insert(
                entity_id,
                CombatEffectUiState {
                    activity: "idle".to_string(),
                    target_id: 0,
                    attack_id: String::new(),
                    updated_tick: self.state.tick,
                },
            );
        }

        for entity_id in finished {
            let Some(metadata) = self.intents.finish(entity_id) else {
                continue;
            };
            if let Err(error) = self.redis.clear_active_intent(entity_id).await {
                warn!(
                    ?error,
                    entity_id, "failed to clear completed repair tracking"
                );
            }
            if let Err(error) = self
                .emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Finished,
                    pb::LifecycleReason::None,
                    self.state.tick,
                )
                .await
            {
                warn!(
                    ?error,
                    entity_id, "failed to emit repair FINISHED lifecycle event"
                );
            }
        }
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
                warn!(
                    ?error,
                    attacker_id = shot.attacker_id,
                    target_id = shot.target_id,
                    "failed to publish laser shot"
                );
            }
        }
    }

    async fn emit_combat_destructions(
        &mut self,
        destructions: &[crate::combat::CombatDestruction],
    ) {
        for destruction in destructions {
            let recipients = gameplay_event_recipients(
                &destruction.victim.owner_player_id,
                &destruction.attacker_owner_player_id,
            );
            if recipients.is_empty() {
                continue;
            }
            let event = GameplayEvent {
                event_type: "entity_destroyed".to_string(),
                server_tick: self.state.tick,
                occurred_at_ms: unix_time_ms(),
                victim: gameplay_entity_ref(&destruction.victim),
                attacker: Some(GameplayEntityRef {
                    entity_id: destruction.attacker_id,
                    entity_type_id: destruction.attacker_entity_type_id.clone(),
                    owner_player_id: destruction.attacker_owner_player_id.clone(),
                }),
                cause: match destruction.cause {
                    crate::content::AttackType::Laser => "laser".to_string(),
                    crate::content::AttackType::Dismantle => "dismantle".to_string(),
                },
                damage_amount: None,
                missing_resource_types: None,
                source_entity_id: None,
                position: entity_position(&destruction.victim),
                recipients,
            };
            if let Err(error) = self.redis.publish_gameplay_event(&event).await {
                warn!(
                    ?error,
                    victim_id = destruction.victim.id,
                    "failed to publish gameplay destruction event"
                );
            }
        }
    }

    async fn emit_radiation_destructions(
        &mut self,
        victims: &[pb::Entity],
        source_entity_ids: &HashMap<u64, u64>,
    ) {
        for victim in victims {
            let recipients = gameplay_event_recipients(&victim.owner_player_id, "");
            if recipients.is_empty() {
                continue;
            }
            let event = GameplayEvent {
                event_type: "entity_destroyed".to_string(),
                server_tick: self.state.tick,
                occurred_at_ms: unix_time_ms(),
                victim: gameplay_entity_ref(victim),
                attacker: None,
                cause: "radiation".to_string(),
                damage_amount: None,
                missing_resource_types: None,
                source_entity_id: source_entity_ids.get(&victim.id).copied(),
                position: entity_position(victim),
                recipients,
            };
            if let Err(error) = self.redis.publish_gameplay_event(&event).await {
                warn!(
                    ?error,
                    victim_id = victim.id,
                    "failed to publish gameplay radiation-destruction event"
                );
            }
        }
    }

    async fn emit_starvation_events(&mut self, damaged_entities: &HashMap<u64, Vec<String>>) {
        let mut victims: Vec<pb::Entity> = self
            .state
            .entities
            .iter()
            .filter(|entity| damaged_entities.contains_key(&entity.id))
            .cloned()
            .collect();
        victims.sort_by_key(|entity| entity.id);

        let mut events = Vec::with_capacity(victims.len() * 2);
        for victim in victims {
            let recipients = gameplay_event_recipients(&victim.owner_player_id, "");
            if recipients.is_empty() {
                continue;
            }
            events.push(GameplayEvent {
                event_type: "entity_damaged".to_string(),
                server_tick: self.state.tick,
                occurred_at_ms: unix_time_ms(),
                victim: gameplay_entity_ref(&victim),
                attacker: None,
                cause: "resource_starvation".to_string(),
                damage_amount: Some(1.0),
                missing_resource_types: damaged_entities.get(&victim.id).cloned(),
                source_entity_id: None,
                position: entity_position(&victim),
                recipients: recipients.clone(),
            });
            if victim.health <= 0.0 {
                events.push(GameplayEvent {
                    event_type: "entity_destroyed".to_string(),
                    server_tick: self.state.tick,
                    occurred_at_ms: unix_time_ms(),
                    victim: gameplay_entity_ref(&victim),
                    attacker: None,
                    cause: "resource_starvation".to_string(),
                    damage_amount: None,
                    missing_resource_types: damaged_entities.get(&victim.id).cloned(),
                    source_entity_id: None,
                    position: entity_position(&victim),
                    recipients,
                });
            }
        }

        if let Err(error) = self.redis.publish_gameplay_events(&events).await {
            warn!(?error, count = events.len(), "failed to publish resource starvation events");
        }
    }

    async fn cancel_destroyed_intents(&mut self, entity_ids: &[u64]) {
        for entity_id in entity_ids {
            let Some(metadata) = self.intents.finish(*entity_id) else {
                continue;
            };
            if let Err(error) = self.redis.clear_active_intent(*entity_id).await {
                warn!(
                    ?error,
                    entity_id, "failed to clear destroyed entity intent tracking"
                );
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
                warn!(
                    ?error,
                    entity_id, "failed to emit destroyed entity cancellation"
                );
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

    fn pick_transport_node<'a>(
        collector: &CollectorSnapshot,
        nodes: &'a [ResourceNodeSnapshot],
        bound_id: Option<u64>,
        preferred_resource_type: Option<&str>,
        assigned_resource_type: &str,
        nearest_compatible: bool,
        collects: &[String],
    ) -> Option<&'a ResourceNodeSnapshot> {
        let eligible = |node: &&ResourceNodeSnapshot| {
            node.mode == CollectionMode::Transport
                && if let Some(resource_type) = preferred_resource_type {
                    node.resource_type == resource_type
                } else if nearest_compatible {
                    collects.contains(&node.resource_type)
                } else {
                    node.resource_type == assigned_resource_type
                }
        };
        if let Some(node) = nodes.iter().filter(eligible).find(|node| Some(node.id) == bound_id) {
            return Some(node);
        }
        nodes.iter().filter(eligible).min_by(|a, b| {
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

    fn minimum_distance_violation(
        collector: &CollectorSnapshot,
        entities: &[pb::Entity],
        minimum_distance: &MinimumDistanceDef,
        operating_collectors: &HashSet<u64>,
    ) -> Option<pb::MinimumDistanceViolation> {
        let minimum_distance_sq = minimum_distance.value * minimum_distance.value;
        entities
            .iter()
            .filter(|entity| {
                entity.id != collector.id
                    && operating_collectors.contains(&entity.id)
                    && entity.owner_player_id == collector.owner_player_id
                    && minimum_distance
                        .entity_types
                        .iter()
                        .any(|entity_type| entity_type == &entity.entity_type_id)
            })
            .filter_map(|entity| {
                entity.pos.as_ref().map(|position| {
                    (
                        entity.id,
                        Self::distance_sq(collector.x, collector.y, position.x, position.y),
                    )
                })
            })
            .filter(|(_, distance_sq)| *distance_sq < minimum_distance_sq)
            .min_by(|(a_id, a_distance_sq), (b_id, b_distance_sq)| {
                a_distance_sq
                    .partial_cmp(b_distance_sq)
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| a_id.cmp(b_id))
            })
            .map(|(blocking_entity_id, distance_sq)| pb::MinimumDistanceViolation {
                blocking_entity_id,
                required_distance: minimum_distance.value,
                actual_distance: distance_sq.sqrt(),
            })
    }

    /// Large f32 world coordinates cannot represent the last fraction of a capped approach step.
    fn reached_contact(pos: &pb::Vec2, target: &pb::Vec2, range: f32) -> bool {
        let scale = pos.x.abs().max(pos.y.abs()).max(target.x.abs()).max(target.y.abs()).max(1.0);
        let tolerance = 2.0 * f32::EPSILON * scale;
        Self::distance_sq(pos.x, pos.y, target.x, target.y) <= (range + tolerance).powi(2)
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

    async fn apply_resource_collection(&mut self, dt: f32) {
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
        // Freeze the player-issued assignment for this tick. An empty type
        // together with nearest_compatible is the explicit legacy auto mode.
        let collection_assignments: HashMap<u64, (String, bool)> = self
            .intents
            .active_intents()
            .iter()
            .filter_map(|(id, active)| match active.action.exec.as_ref() {
                Some(pb::action_state::Exec::Collect(state)) => Some((
                    *id,
                    (state.resource_type_id.clone(), state.nearest_compatible),
                )),
                _ => None,
            })
            .collect();
        let mut collectors = self.build_collector_snapshots();
        // Existing producers keep their spot. Waiting transport collectors go
        // next in arrival order, then new arrivals in entity-ID order.
        collectors.sort_by_key(|collector| {
            let activity = self
                .collector_ui_state_by_entity
                .get(&collector.id)
                .map(|state| state.activity.as_str());
            let waiting_since = self.transport_wait_since_tick_by_entity.get(&collector.id).copied();
            collection_order_key(activity, waiting_since, collector.id)
        });
        let mut operating_collectors = HashSet::new();
        let mut gathering_by_node = HashMap::new();
        let nodes = self.build_resource_node_snapshots();
        let refineries = self.build_refinery_snapshots();
        let collector_ids: HashSet<u64> = collectors.iter().map(|c| c.id).collect();
        self.transport_node_by_entity.retain(|id, _| collector_ids.contains(id));
        self.transport_wait_since_tick_by_entity.retain(|id, _| collector_ids.contains(id));
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
            self.collection_retry_tick_by_entity.remove(&id);
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
                self.collection_retry_tick_by_entity.remove(&collector.id);
                self.transport_wait_since_tick_by_entity.remove(&collector.id);
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

            let Some((assigned_resource_type, nearest_compatible)) =
                collection_assignments.get(&collector.id)
            else {
                continue;
            };

            // Transport mode: carry->deposit has priority only when carry is full.
            if let Some(ref carry) = carry_snapshot {
                let carry_is_full =
                    carry_capacity > 0.0 && carry.amount >= (carry_capacity - f32::EPSILON);
                if carry.amount > 0.0 && carry_is_full {
                    self.transport_wait_since_tick_by_entity.remove(&collector.id);
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
                            if let Some(entity) = self.state.entities.iter_mut().find(|e| e.id == refinery.id) {
                                let current = resource_amount(entity, &carry.resource_type);
                                let capacity = refinery.max_capacity.get(&carry.resource_type).copied().unwrap_or(0.0) as f64;
                                let delivered = (carry.amount as f64).min((capacity - current).max(0.0));
                                set_resource_amount(entity, &carry.resource_type, current + delivered);
                            }
                            // Transport cargo is tracked in CarryState; depositing it must not
                            // erase the collector's separate maintenance inventory.
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
            let node = Self::pick_transport_node(
                &collector,
                &nodes,
                self.transport_node_by_entity.get(&collector.id).copied(),
                preferred_resource_type,
                assigned_resource_type,
                *nearest_compatible,
                &collector_def.collects,
            );
            if let Some(node) = node {
                if self.transport_node_by_entity.get(&collector.id) != Some(&node.id) {
                    self.transport_wait_since_tick_by_entity.remove(&collector.id);
                }
                self.transport_node_by_entity.insert(collector.id, node.id);
                let dist = Self::distance_sq(collector.x, collector.y, node.x, node.y).sqrt();
                if dist >= node.min_effective_distance && dist <= node.max_effective_distance {
                    if !claim_transport_slot(node, &mut gathering_by_node) {
                        self.transport_wait_since_tick_by_entity
                            .entry(collector.id)
                            .or_insert(self.state.tick);
                        self.set_collector_ui_state(
                            collector.id,
                            COLLECTOR_ACTIVITY_WAITING_FOR_TURN,
                            &node.resource_type,
                            carry_snapshot.as_ref().map(|c| c.amount).unwrap_or(0.0),
                            carry_capacity,
                            0.0,
                        );
                        if let Some(entity) = self.state.entities.iter_mut().find(|e| e.id == collector.id) {
                            let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                            vel.x = 0.0;
                            vel.y = 0.0;
                        }
                        continue;
                    }
                    self.transport_wait_since_tick_by_entity.remove(&collector.id);
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
                            // Keep transport cargo separate from the entity's usable inventory.
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
                    self.transport_wait_since_tick_by_entity.remove(&collector.id);
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
            } else {
                self.transport_node_by_entity.remove(&collector.id);
                self.transport_wait_since_tick_by_entity.remove(&collector.id);
            }

            // Proximity mode only when not engaged in transport mode for this tick.
            if handled_transport {
                continue;
            }
            let proximity_node = if *nearest_compatible {
                Self::pick_best_node(
                    &collector,
                    &nodes,
                    CollectionMode::Proximity,
                    &collector_def.collects,
                )
            } else {
                nodes
                    .iter()
                    .filter(|n| n.mode == CollectionMode::Proximity)
                    .filter(|n| n.resource_type == *assigned_resource_type)
                    .min_by(|a, b| {
                        let da = Self::distance_sq(collector.x, collector.y, a.x, a.y);
                        let db = Self::distance_sq(collector.x, collector.y, b.x, b.y);
                        da.partial_cmp(&db)
                            .unwrap_or(std::cmp::Ordering::Equal)
                            .then_with(|| a.id.cmp(&b.id))
                    })
            };
            if let Some(node) = proximity_node {
                let dist = Self::distance_sq(collector.x, collector.y, node.x, node.y).sqrt();
                if dist >= node.min_effective_distance && dist <= node.max_effective_distance {
                    let waiting_for_retry = self
                        .collection_retry_tick_by_entity
                        .get(&collector.id)
                        .is_some_and(|next_tick| self.state.tick < *next_tick);
                    let blocker = if waiting_for_retry {
                        None
                    } else {
                        collector_def.minimum_distance.as_ref().and_then(|rule| {
                            Self::minimum_distance_violation(
                                &collector,
                                &self.state.entities,
                                rule,
                                &operating_collectors,
                            )
                        })
                    };
                    if waiting_for_retry || blocker.is_some() {
                        if let (Some(rule), Some(_)) =
                            (collector_def.minimum_distance.as_ref(), blocker)
                        {
                            let retry_ticks = retry_delay_ticks(rule.retry_after_ms, self.cfg.tps);
                            self.collection_retry_tick_by_entity.insert(
                                collector.id,
                                self.state.tick.saturating_add(retry_ticks),
                            );
                        }
                        self.set_collector_ui_state(
                            collector.id,
                            COLLECTOR_ACTIVITY_WAITING_FOR_TURN,
                            &node.resource_type,
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
                    self.collection_retry_tick_by_entity.remove(&collector.id);
                    operating_collectors.insert(collector.id);
                    let rate = collector_def.proximity_rate_per_second.max(0.0) * dt;
                    if let Some(entity) = self.state.entities.iter_mut().find(|e| e.id == collector.id) {
                        let current = resource_amount(entity, &node.resource_type);
                        let capacity = resource_capacity(self.content.as_ref().unwrap(), &collector.entity_type_id, &node.resource_type);
                        let amount = (rate as f64).min((capacity - current).max(0.0));
                        set_resource_amount(entity, &node.resource_type, current + amount);
                    }
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
                    self.collection_retry_tick_by_entity.remove(&collector.id);
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
            }
        }
    }

    fn collector_states_for_stream(&self) -> Vec<pb::CollectorState> {
        let mut states: Vec<pb::CollectorState> = self
            .collector_ui_state_by_entity
            .iter()
            .map(|(entity_id, state)| pb::CollectorState {
                entity_id: *entity_id,
                activity: state.activity.clone(),
                resource_type: state.resource_type.clone(),
                carry_amount: state.carry_amount,
                carry_capacity: state.carry_capacity,
                effective_rate_per_second: state.effective_rate_per_second,
                assigned_resource_type: state.assigned_resource_type.clone(),
                assigned_nearest_compatible: state.assigned_nearest_compatible,
                receiving_entity_id: state.receiving_entity_id,
            })
            .collect();
        states.sort_by_key(|state| state.entity_id);
        states
    }

    fn construction_progress_for_snapshot(&self) -> HashMap<u64, f32> {
        self.intents
            .active_intents()
            .iter()
            .filter_map(|(entity_id, active)| match active.action.exec.as_ref() {
                Some(pb::action_state::Exec::Build(build)) => Some((*entity_id, build.progress)),
                _ => None,
            })
            .collect()
    }

    fn combat_effect_states_for_stream(&self) -> Vec<pb::CombatEffectState> {
        let mut states: Vec<pb::CombatEffectState> = self
            .combat_effect_ui_state_by_entity
            .iter()
            .map(|(entity_id, state)| pb::CombatEffectState {
                entity_id: *entity_id,
                activity: state.activity.clone(),
                target_id: state.target_id,
                attack_id: state.attack_id.clone(),
                updated_tick: state.updated_tick,
            })
            .collect();
        states.sort_by_key(|state| state.entity_id);
        states
    }

    /// Run one tick (for tests). Does not wait for ticker.
    pub async fn run_one_tick(&mut self) -> Result<()> {
        if !self.process_scenario_controls().await? { return Ok(()); }
        let dt = 1.0 / self.cfg.tps as f32;
        let snapshot_interval = (self.cfg.tps as u64) * self.cfg.snapshot_every_secs;

        // M6: Process pending joins (spawn on join)
        while let Ok(Some(player_id)) = self.redis.pop_next_pending_join().await {
            info!(player_id = %player_id, "processing join from pending_joins");
            if let Err(e) = self.ensure_spawned(&player_id) {
                warn!(player_id = %player_id, error = ?e, "ensure_spawned failed");
            }
        }
        self.process_pending_raider_spawns().await;

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
        let npc_commands = self.apply_raider_ai();
        let combat = self.apply_autonomous_combat(dt, &npc_commands);
        self.emit_laser_shots(&combat.laser_shots).await;
        self.emit_combat_destructions(&combat.destructions).await;
        self.cancel_destroyed_intents(&combat.dead_entity_ids).await;
        self.apply_repairs(dt).await;
        self.apply_resource_collection(dt).await;
        self.advance_deliveries(dt).await;
        let starvation_damage = self.maintain_and_share_resources(dt).await;
        self.advance_builds(dt).await;
        self.advance_research(dt).await;
        integrate(&self.cfg, &mut self.state, dt);
        let radiation_source_by_victim = self.apply_radiation_damage(dt);
        let radiation_damaged_entities: HashSet<u64> = radiation_source_by_victim.keys().copied().collect();
        let radiation_victims: Vec<pb::Entity> = self
            .state
            .entities
            .iter()
            .filter(|entity| entity.health <= 0.0 && radiation_damaged_entities.contains(&entity.id))
            .cloned()
            .collect();
        let radiation_dead_entity_ids = self.remove_zero_health_entities();
        self.emit_radiation_destructions(&radiation_victims, &radiation_source_by_victim).await;
        self.cancel_destroyed_intents(&radiation_dead_entity_ids)
            .await;
        self.publish_script_debug().await;
        self.state.tick += 1;

        let delta = compute_delta(
            &self.prev_state,
            &self.state,
            &self.prev_collector_ui_state_by_entity,
            &self.collector_ui_state_by_entity,
            &self.prev_combat_effect_ui_state_by_entity,
            &self.combat_effect_ui_state_by_entity,
            self.cfg.eps_pos,
            self.cfg.eps_vel,
            &starvation_damage,
            &radiation_damaged_entities,
        );
        if should_publish_delta(&delta) {
            if let Ok(id) = self.redis.publish_delta(&delta).await {
                self.last_delta_id = Some(id);
            }
        }
        if self.state.tick % snapshot_interval == 0 {
            let boundary = self.last_delta_id.as_deref().unwrap_or("0-0");
            let collector_states = self.collector_states_for_stream();
            let combat_effect_states = self.combat_effect_states_for_stream();
            let build_progress = self.construction_progress_for_snapshot();
            if self
                .redis
                .publish_snapshot(
                    &self.state,
                    &self.resource_spend_total,
                    &self.resource_gain_total,
                    boundary,
                    collector_states,
                    combat_effect_states,
                )
                .await
                .is_ok()
            {
                if let Err(error) = self
                    .redis
                    .checkpoint_construction_progress(&build_progress)
                    .await
                {
                    warn!(?error, "failed to checkpoint construction progress");
                }
            }
        }
        if self.state.tick % (self.cfg.tps as u64) == 0 {
            log_sample(&self.state);
        }
        self.prev_state = self.state.clone();
        self.finish_scenario_tick().await?;
        self.prev_collector_ui_state_by_entity = self.collector_ui_state_by_entity.clone();
        self.prev_combat_effect_ui_state_by_entity = self.combat_effect_ui_state_by_entity.clone();
        Ok(())
    }

    pub async fn run(&mut self) -> anyhow::Result<()> {
        let dt = 1.0 / self.cfg.tps as f32;
        let tick_budget = Duration::from_secs_f64(1.0 / self.cfg.tps as f64);
        let mut ticker = interval(Duration::from_micros(
            (1_000_000.0 / self.cfg.tps as f64) as u64,
        ));
        let snapshot_interval = (self.cfg.tps as u64) * self.cfg.snapshot_every_secs;
        let mut tick_durations = self
            .telemetry
            .as_ref()
            .map(|_| HashMap::<bool, Vec<Duration>>::new());
        let mut phase_durations = self
            .telemetry
            .as_ref()
            .map(|_| HashMap::<bool, HashMap<&'static str, Vec<Duration>>>::new());
        let mut raider_ai_work_counts = self
            .telemetry
            .as_ref()
            .map(|_| HashMap::<bool, Vec<(usize, usize)>>::new());

        loop {
            ticker.tick().await;
            if !self.process_scenario_controls().await? { continue; }
            let raider_ai_spatial_index_enabled = self
                .cfg
                .raider_ai_spatial_index_mode
                .enabled_at(self.state.tick);
            let tick_started = tick_durations.as_ref().map(|_| Instant::now());
            let mut phase_started = tick_started;

            // M6: Process pending joins (spawn on join)
            while let Ok(Some(player_id)) = self.redis.pop_next_pending_join().await {
                info!(player_id = %player_id, "processing join from pending_joins");
                if let Err(e) = self.ensure_spawned(&player_id) {
                    warn!(player_id = %player_id, error = ?e, "ensure_spawned failed");
                }
            }
            self.process_pending_raider_spawns().await;
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "joins",
                &mut phase_started,
            );

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
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "intent_ingest",
                &mut phase_started,
            );

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
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "movement",
                &mut phase_started,
            );
            let npc_commands = self.apply_raider_ai();
            if let Some(work_counts) = raider_ai_work_counts.as_mut() {
                work_counts
                    .entry(raider_ai_spatial_index_enabled)
                    .or_default()
                    .push((
                        npc_commands.processed_raiders,
                        npc_commands.deferred_raiders,
                    ));
            }
            for (phase, duration) in &npc_commands.phase_durations {
                record_tick_phase_duration(
                    phase_durations.as_mut(),
                    raider_ai_spatial_index_enabled,
                    phase,
                    *duration,
                );
            }
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "raider_ai",
                &mut phase_started,
            );
            let combat = self.apply_autonomous_combat(dt, &npc_commands);
            self.emit_laser_shots(&combat.laser_shots).await;
            self.emit_combat_destructions(&combat.destructions).await;
            self.cancel_destroyed_intents(&combat.dead_entity_ids).await;
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "combat",
                &mut phase_started,
            );
            self.apply_repairs(dt).await;
            self.apply_resource_collection(dt).await;
            self.advance_deliveries(dt).await;
            self.advance_builds(dt).await;
            self.advance_research(dt).await;
            let starvation_damage = self.maintain_and_share_resources(dt).await;
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "economy",
                &mut phase_started,
            );
            integrate(&self.cfg, &mut self.state, dt);
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "physics",
                &mut phase_started,
            );
            let radiation_source_by_victim = self.apply_radiation_damage(dt);
            let radiation_damaged_entities: HashSet<u64> = radiation_source_by_victim.keys().copied().collect();
            let radiation_victims: Vec<pb::Entity> = self
                .state
                .entities
                .iter()
                .filter(|entity| entity.health <= 0.0 && radiation_damaged_entities.contains(&entity.id))
                .cloned()
                .collect();
            let radiation_dead_entity_ids = self.remove_zero_health_entities();
            self.emit_radiation_destructions(&radiation_victims, &radiation_source_by_victim).await;
            self.cancel_destroyed_intents(&radiation_dead_entity_ids)
                .await;
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "radiation",
                &mut phase_started,
            );
            self.publish_script_debug().await;
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "debug_publish",
                &mut phase_started,
            );
            self.state.tick += 1;

            // Delta
            let delta = compute_delta(
                &self.prev_state,
                &self.state,
                &self.prev_collector_ui_state_by_entity,
                &self.collector_ui_state_by_entity,
                &self.prev_combat_effect_ui_state_by_entity,
                &self.combat_effect_ui_state_by_entity,
                self.cfg.eps_pos,
                self.cfg.eps_vel,
                &starvation_damage,
                &radiation_damaged_entities,
            );
            if should_publish_delta(&delta) {
                match self.redis.publish_delta(&delta).await {
                    Ok(id) => self.last_delta_id = Some(id),
                    Err(e) => error!(?e, "delta publish failed"),
                }
            }
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "delta_publish",
                &mut phase_started,
            );
            // Periodic snapshot
            if self.state.tick % snapshot_interval == 0 {
                let boundary = self.last_delta_id.as_deref().unwrap_or("0-0");
                let collector_states = self.collector_states_for_stream();
                let combat_effect_states = self.combat_effect_states_for_stream();
                let build_progress = self.construction_progress_for_snapshot();
                if let Err(e) = self
                    .redis
                    .publish_snapshot(
                        &self.state,
                        &self.resource_spend_total,
                        &self.resource_gain_total,
                        boundary,
                        collector_states,
                        combat_effect_states,
                    )
                    .await
                {
                    error!(?e, "snapshot publish failed");
                } else if let Err(e) = self
                    .redis
                    .checkpoint_construction_progress(&build_progress)
                    .await
                {
                    error!(?e, "construction progress checkpoint failed");
                }
            }
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "snapshot_publish",
                &mut phase_started,
            );

            // Log once per second
            if self.state.tick % (self.cfg.tps as u64) == 0 {
                log_sample(&self.state);
            }

            self.prev_state = self.state.clone();
            self.finish_scenario_tick().await?;
            self.prev_collector_ui_state_by_entity = self.collector_ui_state_by_entity.clone();
            self.prev_combat_effect_ui_state_by_entity =
                self.combat_effect_ui_state_by_entity.clone();
            record_tick_phase(
                phase_durations.as_mut(),
                raider_ai_spatial_index_enabled,
                "state_copy",
                &mut phase_started,
            );

            if let (Some(tick_started), Some(tick_durations)) =
                (tick_started, tick_durations.as_mut())
            {
                let reaches_experiment_boundary = self.cfg.raider_ai_spatial_index_mode
                    == crate::config::RaiderAiSpatialIndexMode::Alternating
                    && self
                        .cfg
                        .raider_ai_spatial_index_mode
                        .enabled_at(self.state.tick)
                        != raider_ai_spatial_index_enabled;
                let samples = tick_durations
                    .entry(raider_ai_spatial_index_enabled)
                    .or_insert_with(|| Vec::with_capacity(TICK_TIMING_WINDOW_TICKS));
                samples.push(tick_started.elapsed());
                if samples.len() == TICK_TIMING_WINDOW_TICKS || reaches_experiment_boundary {
                    let summary = summarize_tick_durations(samples, tick_budget)
                        .expect("tick timing window is non-empty");
                    samples.clear();
                    let mut phase_summaries: Vec<_> = phase_durations
                        .as_mut()
                        .expect("telemetry enabled")
                        .entry(raider_ai_spatial_index_enabled)
                        .or_default()
                        .drain()
                        .filter_map(|(phase, samples)| {
                            summarize_tick_durations(&samples, tick_budget)
                                .map(|summary| (phase, summary))
                        })
                        .collect();
                    phase_summaries.sort_by_key(|(phase, _)| *phase);
                    let work_counts = raider_ai_work_counts
                        .as_mut()
                        .expect("telemetry enabled")
                        .entry(raider_ai_spatial_index_enabled)
                        .or_default();
                    let mut processed: Vec<_> = work_counts
                        .iter()
                        .map(|(processed, _)| *processed)
                        .collect();
                    let mut deferred: Vec<_> =
                        work_counts.iter().map(|(_, deferred)| *deferred).collect();
                    let (raider_ai_processed_p50, raider_ai_processed_p95) =
                        count_percentiles(&mut processed);
                    let (raider_ai_deferred_p50, raider_ai_deferred_p95) =
                        count_percentiles(&mut deferred);
                    work_counts.clear();
                    let telemetry = self.telemetry.as_ref().expect("telemetry enabled").clone();
                    let game_id = self.cfg.game_id.clone();
                    let server_tick = self.state.tick;
                    let entity_count = self.state.entities.len();
                    tokio::spawn(async move {
                        if let Err(error) = telemetry
                            .publish_tick_timings(
                                &game_id,
                                server_tick,
                                entity_count,
                                raider_ai_spatial_index_enabled,
                                raider_ai_processed_p50,
                                raider_ai_processed_p95,
                                raider_ai_deferred_p50,
                                raider_ai_deferred_p95,
                                tick_budget,
                                summary,
                                phase_summaries,
                            )
                            .await
                        {
                            warn!(?error, "failed to publish tick timing telemetry");
                        }
                    });
                }
            }
        }
    }

    async fn process_raw_intent(&mut self, bytes: &[u8]) -> Result<()> {
        if bytes.is_empty() { return Ok(()); } // Stale world commands still advance the stream cursor.
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

        let mut payload_intent = match envelope.payload {
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
            Some(intent_envelope::Payload::Upgrade(u)) => {
                info!(entity_id = u.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, target_entity_type_id = u.target_entity_type_id, "accept intent=Upgrade");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Upgrade(u)),
                }
            }
            Some(intent_envelope::Payload::Research(r)) => {
                info!(entity_id = r.entity_id, technology_id = r.technology_id, player = %player_id, "accept intent=Research");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Research(r)),
                }
            }
            Some(intent_envelope::Payload::Collect(c)) => {
                info!(entity_id = c.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, "accept intent=Collect");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Collect(c)),
                }
            }
            Some(intent_envelope::Payload::Deliver(d)) => {
                if d.donor_id == 0 {
                    info!(entity_id = d.entity_id, target_id = d.target_id, player = %player_id, "accept intent=Deliver");
                } else {
                    info!(entity_id = d.entity_id, donor_id = d.donor_id, target_id = d.target_id, resources = ?d.resource_type_ids,
                        player = %player_id, "accept intent=Transport");
                }
                pb::Intent { kind: Some(pb::intent::Kind::Deliver(d)) }
            }
            Some(intent_envelope::Payload::Repair(r)) => {
                info!(entity_id = r.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, target_id = r.target_id, "accept intent=Repair");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Repair(r)),
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
            Some(pb::intent::Kind::Repair(r)) => r.entity_id,
            Some(pb::intent::Kind::Upgrade(u)) => u.entity_id,
            Some(pb::intent::Kind::Research(r)) => r.entity_id,
            Some(pb::intent::Kind::Deliver(d)) => d.entity_id,
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

        // Collection assignments are authoritative content IDs. Validate them
        // here, not in the web route, because intents may arrive from replay,
        // CLI, or another client. A missing source/refinery is deliberately
        // not an error: the collector retains its order and waits.
        if let Some(pb::intent::Kind::Collect(collect)) = payload_intent.kind.as_ref() {
            let content = self
                .content
                .as_ref()
                .ok_or_else(|| anyhow!("collection unavailable without content pack"))?;
            let entity = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == entity_id)
                .ok_or_else(|| anyhow!("collector entity not found"))?;
            let collector = content
                .get(&entity.entity_type_id)
                .and_then(|definition| definition.collector.as_ref())
                .ok_or_else(|| anyhow!("entity cannot collect resources"))?;
            if collect.nearest_compatible {
                if !collect.resource_type_id.is_empty() {
                    return Err(anyhow!("nearest collection must not name a resource type"));
                }
            } else if collect.resource_type_id.is_empty()
                || content
                    .get_resource_type(&collect.resource_type_id)
                    .is_none()
                || !collector
                    .collects
                    .iter()
                    .any(|id| id == &collect.resource_type_id)
            {
                return Err(anyhow!("collector cannot collect requested resource type"));
            }

            // Replacing one maintained Collect assignment with a different one
            // discards in-flight cargo. Other orders merely interrupt the
            // temporary assignment and intentionally leave cargo untouched.
            let requested = (collect.resource_type_id.clone(), collect.nearest_compatible);
            if self
                .intents
                .active_collect_assignment(entity_id)
                .is_some_and(|active| active != requested)
            {
                self.carry_by_entity.remove(&entity_id);
            }
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
            if let Some(requirement) = &product.requires_technologies {
                let owned = self
                    .state
                    .technologies
                    .get(&player_id)
                    .cloned()
                    .unwrap_or_default();
                if !requirement.is_satisfied_by(&owned) {
                    return Err(anyhow!("missing required technology for build"));
                }
            }
            if product.build_cost.is_empty() {
                return Err(anyhow!("build product has no build_cost"));
            }
            for (resource, cost) in &product.build_cost {
                let rate = option.spend_rates.get(resource).copied().unwrap_or(1.0);
                if *cost <= 0.0 || !rate.is_finite() || rate <= 0.0 {
                    return Err(anyhow!("invalid build cost or spend rate for {resource}"));
                }
                let available = self.available_build_resource(entity_id, &player_id, resource);
                if available + f64::EPSILON < *cost as f64 {
                    return Err(anyhow!("insufficient {resource} for build"));
                }
            }
        }

        if let Some(pb::intent::Kind::Upgrade(upgrade)) = payload_intent.kind.as_ref() {
            let Some(entity) = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == entity_id)
            else {
                return Err(anyhow!("upgrade source entity not found"));
            };
            let Some(content) = self.content.as_ref() else {
                return Err(anyhow!("upgrade unavailable without content pack"));
            };
            let Some(source) = content.get(&entity.entity_type_id) else {
                return Err(anyhow!("unknown upgrade source type"));
            };
            let Some(option) = source
                .upgrades
                .iter()
                .find(|option| option.entity_type_id == upgrade.target_entity_type_id)
            else {
                return Err(anyhow!("entity cannot upgrade to requested type"));
            };
            let Some(target) = content.get(&upgrade.target_entity_type_id) else {
                return Err(anyhow!("unknown upgrade target"));
            };
            if let Some(requirement) = &target.requires_technologies {
                let owned = self
                    .state
                    .technologies
                    .get(&player_id)
                    .cloned()
                    .unwrap_or_default();
                if !requirement.is_satisfied_by(&owned) {
                    return Err(anyhow!("missing required technology for upgrade"));
                }
            }
            if source.health <= 0.0 || (entity.health - source.health).abs() > f32::EPSILON {
                return Err(anyhow!("entity must be at full health to upgrade"));
            }
            if target.build_cost.is_empty() {
                return Err(anyhow!("upgrade target has no build_cost"));
            }
            let ledger = self.state.ledger.get(&player_id);
            for (resource, cost) in &target.build_cost {
                let rate = option.spend_rates.get(resource).copied().unwrap_or(1.0);
                if *cost <= 0.0 || !rate.is_finite() || rate <= 0.0 {
                    return Err(anyhow!("invalid upgrade cost or spend rate for {resource}"));
                }
                let available = ledger
                    .and_then(|resources| resources.get(resource))
                    .copied()
                    .unwrap_or(0);
                if available < cost.ceil() as i64 {
                    return Err(anyhow!("insufficient {resource} for upgrade"));
                }
            }
        }

        if let Some(pb::intent::Kind::Research(research)) = payload_intent.kind.as_ref() {
            let content = self
                .content
                .as_ref()
                .ok_or_else(|| anyhow!("research unavailable without content pack"))?;
            let researcher_type = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == entity_id)
                .map(|entity| entity.entity_type_id.as_str())
                .unwrap_or_default();
            let researcher = content
                .get(researcher_type)
                .ok_or_else(|| anyhow!("unknown researcher type"))?;
            if !researcher
                .researches
                .iter()
                .any(|id| id == &research.technology_id)
            {
                return Err(anyhow!("entity cannot research requested technology"));
            }
            let technology = content
                .technologies
                .get(&research.technology_id)
                .ok_or_else(|| anyhow!("unknown technology"))?;
            let owned = self
                .state
                .technologies
                .get(&player_id)
                .cloned()
                .unwrap_or_default();
            if owned.contains(&research.technology_id) {
                return Err(anyhow!("technology already researched"));
            }
            if technology.granted_on_spawn {
                return Err(anyhow!("spawn-granted technology cannot be researched"));
            }
            if let Some(requirement) = &technology.requires {
                if !requirement.is_satisfied_by(&owned) {
                    return Err(anyhow!("missing technology prerequisite"));
                }
            }
            if technology.research_cost.is_empty() {
                return Err(anyhow!("research technology has no research_cost"));
            }
            for (resource, cost) in &technology.research_cost {
                let rate = technology
                    .research_rates
                    .get(resource)
                    .copied()
                    .unwrap_or(1.0);
                if *cost <= 0.0 || !rate.is_finite() || rate <= 0.0 {
                    return Err(anyhow!("invalid research cost or rate for {resource}"));
                }
                let available = self
                    .state
                    .ledger
                    .get(&player_id)
                    .and_then(|ledger| ledger.get(resource))
                    .copied()
                    .unwrap_or(0);
                if available < cost.ceil() as i64 {
                    return Err(anyhow!("insufficient {resource} for research"));
                }
            }
        }

        if let Some(pb::intent::Kind::Deliver(delivery)) = payload_intent.kind.as_mut() {
            delivery.resource_type_ids.sort(); delivery.resource_type_ids.dedup();
        }
        if let Some(pb::intent::Kind::Deliver(delivery)) = payload_intent.kind.as_ref() {
            let valid = self.state.entities.iter().find(|e| e.id == entity_id)
                .zip(self.state.entities.iter().find(|e| e.id == delivery.target_id))
                .and_then(|(actor, target)| {
                    let content = self.content.as_ref()?;
                    let actor_def = content.get(&actor.entity_type_id)?;
                    content.get(&target.entity_type_id)?;
                    Some(actor.id != target.id && actor.health > 0.0 && target.health > 0.0
                        && actor.owner_player_id == target.owner_player_id && actor_def.speed > 0.0
                        && actor.pos.is_some() && target.pos.is_some()
                        && !delivery.resource_type_ids.is_empty()
                        && (if delivery.donor_id == 0 {
                            delivery.resource_type_ids.iter().any(|r| resource_capacity(content, &target.entity_type_id, r) > resource_amount(target, r))
                        } else {
                            actor_def.collector.as_ref().is_some_and(|collector| collector.carry_capacity > 0.0)
                                && self.state.entities.iter().find(|entity| entity.id == delivery.donor_id).is_some_and(|donor|
                                    donor.id != actor.id && donor.id != target.id && donor.health > 0.0
                                    && donor.owner_player_id == actor.owner_player_id && donor.pos.is_some()
                                    && delivery.resource_type_ids.iter().all(|resource| resource_capacity(content, &donor.entity_type_id, resource) > 0.0))
                        })
                        && delivery.resource_type_ids.iter().all(|resource| {
                            let cargo = self.carry_by_entity.get(&entity_id)
                                .filter(|c| c.resource_type == *resource).map(|c| c.amount).unwrap_or(0.0);
                            content.get_resource_type(resource).is_some()
                                && (if delivery.donor_id == 0 { resource_amount(actor, resource) + cargo as f64 > 0.0 }
                                    else { resource_capacity(content, &actor.entity_type_id, resource) > 0.0 && resource_capacity(content, &target.entity_type_id, resource) > 0.0 })
                        }))
                }).unwrap_or(false);
            if !valid {
                self.emit_lifecycle_event(&metadata, pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget, accept_tick).await?;
                return Err(anyhow!("invalid delivery actor, recipient, or resources"));
            }
        }

        if let Some(pb::intent::Kind::Repair(repair)) = payload_intent.kind.as_ref() {
            let actor = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == entity_id);
            let target = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == repair.target_id);
            let (Some(actor), Some(target), Some(content)) = (actor, target, self.content.as_ref())
            else {
                return Err(anyhow!("repair actor, target, or content unavailable"));
            };
            let Some(ability) = content
                .get(&actor.entity_type_id)
                .and_then(|def| def.repair.as_ref())
            else {
                return Err(anyhow!("entity cannot repair"));
            };
            let max_health = content
                .get(&target.entity_type_id)
                .map(|def| def.health)
                .unwrap_or(0.0);
            if repair.target_id == entity_id
                || target.owner_player_id != player_id
                || target.health <= 0.0
                || target.health >= max_health
            {
                return Err(anyhow!("invalid repair target"));
            }
            if !ability.range.is_finite()
                || ability.range <= 0.0
                || !ability.efficiency.is_finite()
                || ability.efficiency <= 0.0
                || ability.cost_per_min.is_empty()
                || ability
                    .cost_per_min
                    .values()
                    .any(|cost| !cost.is_finite() || *cost <= 0.0)
            {
                return Err(anyhow!("invalid repair ability"));
            }
        }

        // M4: Look up entity_type_id for per-type stat resolution.
        let entity_type_id = self.resolve_entity_type_id(&payload_intent);
        let (intent_kind, move_target, collect_assignment, construction) = match payload_intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => (
                "move",
                m.target.as_ref().map(|t| IntentPoint { x: t.x, y: t.y }),
                None,
                None,
            ),
            Some(pb::intent::Kind::Attack(_)) => ("attack", None, None, None),
            Some(pb::intent::Kind::Build(build)) => (
                "build",
                None,
                None,
                Some((
                    build.blueprint_id.clone(),
                    build.location.as_ref().map(|point| IntentPoint { x: point.x, y: point.y }),
                    0.0,
                )),
            ),
            Some(pb::intent::Kind::Collect(collect)) => (
                "collect",
                None,
                Some((collect.resource_type_id.clone(), collect.nearest_compatible)),
                None,
            ),
            Some(pb::intent::Kind::Repair(_)) => ("repair", None, None, None),
            Some(pb::intent::Kind::Upgrade(_)) => ("upgrade", None, None, None),
            Some(pb::intent::Kind::Research(_)) => ("research", None, None, None),
            Some(pb::intent::Kind::Deliver(delivery)) => (if delivery.donor_id == 0 { "deliver" } else { "transport" }, None, None, None),
            None => ("unknown", None, None, None),
        };

        let transfer = match payload_intent.kind.as_ref() {
            Some(pb::intent::Kind::Deliver(delivery)) if delivery.donor_id != 0 => Some(delivery.clone()),
            _ => None,
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
            self.collection_retry_tick_by_entity.remove(&entity_id);
            self.transport_wait_since_tick_by_entity.remove(&entity_id);
            if intent_kind == "upgrade" {
                if let Some(entity) = self
                    .state
                    .entities
                    .iter_mut()
                    .find(|entity| entity.id == entity_id)
                {
                    entity.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 });
                    entity.force = Some(pb::Vec2 { x: 0.0, y: 0.0 });
                }
            }
            // M2: persist active intent to Redis for reconnect tracking
            self.redis
                .persist_active_intent(
                    entity_id,
                    &metadata,
                    intent_kind,
                    move_target,
                    collect_assignment,
                    construction,
                    self.cfg.tracking_ttl_secs,
                )
                .await?;

            if let Some(transfer) = &transfer { self.redis.persist_transfer_route(entity_id, transfer).await?; }
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
            Some(pb::intent::Kind::Repair(r)) => intent_envelope::Payload::Repair(r),
            Some(pb::intent::Kind::Upgrade(u)) => intent_envelope::Payload::Upgrade(u),
            Some(pb::intent::Kind::Research(r)) => intent_envelope::Payload::Research(r),
            Some(pb::intent::Kind::Deliver(d)) => intent_envelope::Payload::Deliver(d),
            None => return Err(anyhow!("legacy intent missing kind")),
        };

        let legacy_client_cmd = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Attack(a)) => a.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Build(b)) => b.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Collect(c)) => c.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Repair(r)) => r.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Upgrade(_)) => "",
            Some(pb::intent::Kind::Research(_)) => "",
            Some(pb::intent::Kind::Deliver(_)) => "",
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
            Some(pb::intent::Kind::Repair(r)) => r.player_id.clone(),
            Some(pb::intent::Kind::Upgrade(_)) => String::new(),
            Some(pb::intent::Kind::Research(_)) => String::new(),
            Some(pb::intent::Kind::Deliver(_)) => String::new(),
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
        self.emit_lifecycle_event_with_details(metadata, state, reason, tick, None)
            .await
    }

    async fn emit_lifecycle_event_with_details(
        &mut self,
        metadata: &IntentMetadata,
        state: pb::LifecycleState,
        reason: pb::LifecycleReason,
        tick: u64,
        minimum_distance_violation: Option<pb::MinimumDistanceViolation>,
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
            minimum_distance_violation,
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
        minimum_distance_violation: Option<pb::MinimumDistanceViolation>,
    ) -> Result<()> {
        let event = pb::LifecycleEvent {
            intent_id: intent_id.to_vec(),
            client_cmd_id: client_cmd_id.to_vec(),
            player_id: player_id.to_string(),
            server_tick: tick,
            state: state as i32,
            reason: reason as i32,
            protocol_version,
            minimum_distance_violation,
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

#[cfg(test)]
mod delivery_tests {
    use super::*;

    #[test]
    fn delivery_preserves_excess_cargo_and_unselected_inventory() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let mut recipient_def = content.get("habitat").unwrap().clone();
        recipient_def.max_capacity = HashMap::from([("minerals".into(), 20.0), ("food".into(), 10.0)]);
        let mut actor = pb::Entity::default();
        let mut recipient = pb::Entity::default();
        set_resource_amount(&mut actor, "minerals", 5.0);
        set_resource_amount(&mut actor, "food", 8.0);
        set_resource_amount(&mut actor, "energy", 3.0);
        set_resource_amount(&mut recipient, "minerals", 18.0);
        set_resource_amount(&mut recipient, "food", 2.0);
        let mut cargo = CarryState { resource_type: "minerals".into(), amount: 7.0 };
        deliver_resources(&mut actor, &mut recipient, &recipient_def,
            &["minerals".into(), "food".into()], Some(&mut cargo));
        assert_eq!(resource_amount(&recipient, "minerals"), 20.0);
        assert_eq!(resource_amount(&actor, "minerals"), 5.0);
        assert_eq!(cargo.amount, 5.0);
        assert_eq!(resource_amount(&recipient, "food"), 10.0);
        assert_eq!(resource_amount(&actor, "food"), 0.0);
        assert_eq!(resource_amount(&actor, "energy"), 3.0);
        set_resource_amount(&mut recipient, "minerals", 0.0);
        deliver_resources(&mut actor, &mut recipient, &recipient_def,
            &["minerals".into(), "energy".into()], Some(&mut cargo));
        assert_eq!(resource_amount(&recipient, "minerals"), 10.0);
        assert_eq!(resource_amount(&actor, "minerals"), 0.0);
        assert_eq!(cargo.amount, 0.0);
        assert_eq!(resource_amount(&actor, "energy"), 3.0);
        assert_eq!(resource_amount(&recipient, "energy"), 0.0);
    }
}

#[cfg(test)]
mod sharing_upkeep_tests {
    use super::*;

    #[test]
    fn empty_habitat_reports_starvation_only_when_energy_payment_is_due() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let def = content.get("habitat").unwrap();
        let mut habitat = pb::Entity { id: 1, ..Default::default() };
        set_resource_amount(&mut habitat, "food", 100.0);
        let mut fractional = HashMap::new();
        let mut missed_payments = Vec::new();
        for tick in 1..=3601 {
            let (missing, _) = pay_entity_upkeep(&mut habitat, def, 1.0 / 60.0, &mut fractional);
            if !missing.is_empty() {
                assert_eq!(missing, vec!["energy".to_string()]);
                missed_payments.push(tick);
            }
        }
        assert_eq!(missed_payments.len(), 5);
        assert!((719..=721).contains(&missed_payments[0]));
    }


    #[test]
    fn incoming_energy_pays_habitat_upkeep_before_surplus_is_shared() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let habitat_def = content.get("habitat").unwrap();
        let solar_def = content.get("collector_solar").unwrap();
        let mut habitat = pb::Entity { id: 1, ..Default::default() };
        set_resource_amount(&mut habitat, "food", 100.0);
        let mut solar = pb::Entity { id: 2, ..Default::default() };
        let mut fractional = HashMap::new();
        let dt = 1.0 / 60.0;
        let mut paid_energy = 0.0;
        // Run beyond the habitat's first one-unit sensor payment (~12 seconds).
        for _ in 0..800 {
            let generated = solar_def.collector.as_ref().unwrap().proximity_rate_per_second * dt;
            let available = resource_amount(&solar, "energy") + generated as f64;
            set_resource_amount(&mut solar, "energy", available);
            let (missing, _) = pay_entity_upkeep(&mut solar, solar_def, dt, &mut fractional);
            assert!(missing.is_empty());
            let available = resource_amount(&solar, "energy");
            let retained = accrued_upkeep(&fractional, solar.id, "energy");
            let incoming = (available - retained).max(0.0);
            set_resource_amount(&mut solar, "energy", available - incoming);
            let available = resource_amount(&habitat, "energy") + incoming;
            set_resource_amount(&mut habitat, "energy", available);
            let (missing, paid) = pay_entity_upkeep(&mut habitat, habitat_def, dt, &mut fractional);
            assert!(missing.is_empty(), "habitat must receive supply before its upkeep check");
            paid_energy += paid.iter().filter(|(r, _)| r == "energy").map(|(_, a)| *a).sum::<f32>();
            // Even with unlimited demand, accrued upkeep stays on the donor.
            let reserve = accrued_upkeep(&fractional, habitat.id, "energy");
            let available = resource_amount(&habitat, "energy");
            assert!(available + f64::EPSILON >= reserve);
            set_resource_amount(&mut habitat, "energy", reserve);
        }
        assert_eq!(paid_energy, 1.0);
    }
}
