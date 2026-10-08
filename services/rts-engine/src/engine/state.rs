use std::collections::HashMap;

use anyhow::{bail, Result};
use rand::seq::SliceRandom;
use tracing::debug;

use crate::content::ContentPack;
use crate::pb::{Entity, Vec2};
use crate::spawn_config::{
    is_system_owner, Loadout, NeutralNearSpawn, SpawnConfig, UNIVERSE_OWNER,
};

pub fn resource_amount(entity: &Entity, resource_type: &str) -> f64 {
    entity
        .resources
        .as_ref()
        .and_then(|inventory| inventory.resources.iter().find(|entry| entry.resource_type == resource_type))
        .map(|entry| entry.amount)
        .unwrap_or(0.0)
}

pub fn set_resource_amount(entity: &mut Entity, resource_type: &str, amount: f64) {
    let inventory = entity.resources.get_or_insert_with(Default::default);
    inventory.resources.retain(|entry| entry.resource_type != resource_type);
    if amount > f64::EPSILON {
        inventory.resources.push(crate::pb::ResourceAmount {
            resource_type: resource_type.to_string(),
            amount,
        });
        inventory.resources.sort_by(|left, right| left.resource_type.cmp(&right.resource_type));
    }
}

pub fn resource_capacity(content: &ContentPack, entity_type_id: &str, resource_type: &str) -> f64 {
    content
        .get(entity_type_id)
        .and_then(|definition| definition.max_capacity.get(resource_type))
        .copied()
        .unwrap_or(0.0) as f64
}

/// Initialize each finite deposit once; zero stock must never be refilled.
pub fn initialize_resource_deposits(
    entities: &mut [Entity],
    content: &ContentPack,
    spawn_config: Option<&SpawnConfig>,
    rng: &mut impl rand::Rng,
) {
    for entity in entities {
        if entity.resource_deposit.is_some() { continue; }
        let Some(node) = content.get(&entity.entity_type_id).and_then(|def| def.resource_node.as_ref()) else { continue; };
        let amount = spawn_config
            .and_then(|config| config.resource_amounts.get(&entity.entity_type_id))
            .map(|distribution| distribution.sample(rng))
            .or(node.amount);
        if let Some(amount) = amount {
            entity.resource_deposit = Some(crate::pb::ResourceDeposit { amount, remaining: amount });
        }
    }
}

/// Unlimited sources have no deposit. Finite sources debit exactly the amount granted.
pub fn take_from_deposit(entity: &mut Entity, requested: f64) -> f64 {
    let requested = requested.max(0.0);
    let Some(deposit) = entity.resource_deposit.as_mut() else { return requested; };
    let taken = requested.min(deposit.remaining.max(0.0));
    deposit.remaining = (deposit.remaining - taken).max(0.0);
    taken
}

const RADIATION_SPAWN_SAFETY_MULTIPLIER: f32 = 1.5;
const MAX_RADIATION_SOURCE_SPAWN_ATTEMPTS: usize = 64;
const MAX_MINERAL_SPAWN_ATTEMPTS: usize = 256;
const PLAYER_MINERAL_SEARCH_RADIUS: f32 = 4_000.0;
// Keep planets well outside a star's 1,200-unit radiation range while leaving
// room for a player loadout to spawn 200–800 units from the planet.
const PLANET_MIN_DISTANCE_FROM_STAR: f32 = 3_000.0;
const PLANET_MAX_DISTANCE_FROM_STAR: f32 = 4_500.0;

/// M7: Per-player resource totals. Outer key = player_id, inner key = resource_type_id.
pub type ResourceLedger = HashMap<String, HashMap<String, i64>>;
pub type PlayerTechnologies = HashMap<String, std::collections::HashSet<String>>;

#[derive(Clone)]
pub struct GameState {
    pub tick: u64,
    pub entities: Vec<Entity>,
    /// M7: Authoritative per-player resource ledger (player_id → resource_type → amount).
    pub ledger: ResourceLedger,
    /// Completed, player-owned technologies. Definitions remain immutable content.
    pub technologies: PlayerTechnologies,
}

/// Initialise the game world (config-based only). No player entities at init; they spawn on join.
/// Caller must ensure spawn_config is valid; panics if not.
pub fn init_world(spawn_config: &SpawnConfig) -> GameState {
    assert!(
        spawn_config.is_valid(),
        "init_world requires valid spawn config (at least one loadout)"
    );
    GameState {
        tick: 0,
        entities: Vec::new(),
        ledger: ResourceLedger::new(),
        technologies: PlayerTechnologies::new(),
    }
}

/// Creates the fixed neutral celestial field once, before any players join.
pub fn spawn_celestial_field(
    entities: &mut Vec<Entity>,
    content: &ContentPack,
    spawn_config: &SpawnConfig,
    rng: &mut impl rand::Rng,
) {
    let mut next_id = entities.iter().map(|entity| entity.id).max().unwrap_or(0) + 1;
    let star_field = spawn_config
        .global_neutral_fields
        .iter()
        .find(|field| field.entity_type_id == "star_yellow")
        .expect("spawn config must define a global star_yellow field");
    let mut star_positions = Vec::with_capacity(star_field.count);
    for _ in 0..star_field.count {
        let (x, y) = sample_normal_position(
            star_field.origin[0],
            star_field.origin[1],
            star_field.standard_deviation.max(0.0),
            rng,
        );
        star_positions.push((x, y));
        entities.push(neutral_entity(next_id, "star_yellow", x, y, content));
        next_id += 1;
    }

    star_positions.shuffle(rng);
    let planet_count = star_positions.len() * 3 / 4;
    for (star_x, star_y) in star_positions.into_iter().take(planet_count) {
        let (x, y) = sample_position_in_annulus(
            star_x,
            star_y,
            PLANET_MIN_DISTANCE_FROM_STAR,
            PLANET_MAX_DISTANCE_FROM_STAR,
            rng,
        );
        entities.push(neutral_entity(next_id, "planet_blue", x, y, content));
        next_id += 1;
    }

    for field in spawn_config
        .global_neutral_fields
        .iter()
        .filter(|field| field.entity_type_id != "star_yellow")
    {
        for _ in 0..field.count {
            let (x, y) = sample_normal_position(
                field.origin[0],
                field.origin[1],
                field.standard_deviation.max(0.0),
                rng,
            );
            entities.push(neutral_entity(
                next_id,
                &field.entity_type_id,
                x,
                y,
                content,
            ));
            next_id += 1;
        }
    }
    initialize_resource_deposits(entities, content, Some(spawn_config), rng);
}

/// Ensures a player spawn has a mineral node within 4,000 units.
/// Returns the next free entity ID.
pub fn ensure_minerals_near_spawn(
    entities: &mut Vec<Entity>,
    next_id: u64,
    spawn_x: f32,
    spawn_y: f32,
    content: &ContentPack,
    rng: &mut impl rand::Rng,
) -> Result<u64> {
    if entities.iter().any(|entity| {
        entity.entity_type_id == "minerals"
            && entity.resource_deposit.as_ref().is_none_or(|deposit| deposit.remaining > 0.0)
            && entity.pos.as_ref().is_some_and(|pos| {
                squared_distance(spawn_x, spawn_y, pos.x, pos.y)
                    <= PLAYER_MINERAL_SEARCH_RADIUS.powi(2)
            })
    }) {
        return Ok(next_id);
    }

    let Some(mineral_type) = content.get("minerals") else {
        bail!("cannot ensure nearby minerals: content pack has no minerals entity type");
    };
    if !mineral_type.resource_node.as_ref().is_some_and(|node| node.resource_type == "minerals") {
        bail!("cannot ensure nearby minerals: minerals entity type is not a mineral resource node");
    }

    for _ in 0..MAX_MINERAL_SPAWN_ATTEMPTS {
        let angle = rng.gen_range(0.0..std::f32::consts::TAU);
        let distance = rng.gen_range(0.0_f32..1.0).sqrt() * PLAYER_MINERAL_SEARCH_RADIUS;
        let (x, y) = (spawn_x + angle.cos() * distance, spawn_y + angle.sin() * distance);
        let in_radiation = entities.iter().any(|entity| {
            let Some(pos) = entity.pos.as_ref() else { return false };
            content.get(&entity.entity_type_id).is_some_and(|definition| {
                definition.radiation_sources.iter().any(|source| {
                    if source.damage_per_second <= 0.0 { return false }
                    let d = squared_distance(x, y, pos.x, pos.y).sqrt();
                    d >= source.min_effective_distance.max(0.0)
                        && d <= source.max_effective_distance.max(0.0)
                })
            })
        });
        if !in_radiation {
            entities.push(neutral_entity(next_id, "minerals", x, y, content));
            return Ok(next_id + 1);
        }
    }

    bail!("cannot ensure nearby minerals: no radiation-free spawn point found within 4,000 units")
}

/// Samples independent normal X/Y coordinates around an origin using Box-Muller.
fn sample_normal_position(
    origin_x: f32,
    origin_y: f32,
    standard_deviation: f32,
    rng: &mut impl rand::Rng,
) -> (f32, f32) {
    // Never let u1 be zero: ln(0) would produce an infinite sample.
    let u1 = rng.gen_range(f32::MIN_POSITIVE..1.0);
    let u2 = rng.gen_range(0.0..1.0);
    let radius = (-2.0 * u1.ln()).sqrt() * standard_deviation;
    let angle = std::f32::consts::TAU * u2;
    (
        origin_x + radius * angle.cos(),
        origin_y + radius * angle.sin(),
    )
}

fn neutral_entity(id: u64, entity_type_id: &str, x: f32, y: f32, content: &ContentPack) -> Entity {
    Entity {
        id,
        entity_type_id: entity_type_id.to_string(),
        pos: Some(Vec2 { x, y }),
        vel: Some(Vec2 { x: 0.0, y: 0.0 }),
        force: Some(Vec2 { x: 0.0, y: 0.0 }),
        owner_player_id: UNIVERSE_OWNER.to_string(),
        health: content
            .get(entity_type_id)
            .map(|def| def.health.max(0.0))
            .unwrap_or(0.0),
        resource_deposit: None,
        resources: None,
    }
}

/// Spawns all entities for one player at their spawn location (player-owned units + optional neutrals nearby).
/// Returns the next free entity id after spawning.
pub fn on_player_spawn(
    entities: &mut Vec<Entity>,
    next_id: u64,
    player_id: &str,
    spawn_x: f32,
    spawn_y: f32,
    loadout: &Loadout,
    min_entity_spawn_distance: f32,
    max_entity_spawn_distance: f32,
    neutrals_near_spawn: &[NeutralNearSpawn],
    content: &ContentPack,
    rng: &mut impl rand::Rng,
) -> u64 {
    let mut id = next_id;
    let min_entity_distance = min_entity_spawn_distance.max(0.0);
    let max_entity_distance = max_entity_spawn_distance.max(min_entity_distance);
    let mut placed_player_positions: Vec<Vec2> = Vec::new();

    // Player-owned units: each new unit is placed at a random distance from already placed units.
    for (type_id, count) in loadout {
        for _ in 0..*count {
            let (x, y) = if placed_player_positions.is_empty() {
                (spawn_x, spawn_y)
            } else {
                sample_player_unit_spawn_position(
                    &placed_player_positions,
                    min_entity_distance,
                    max_entity_distance,
                    rng,
                )
            };
            entities.push(Entity {
                id,
                entity_type_id: type_id.clone(),
                pos: Some(Vec2 { x, y }),
                vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                force: Some(Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: player_id.to_string(),
                health: content
                    .get(type_id)
                    .map(|def| def.health.max(0.0))
                    .unwrap_or(0.0),
                resource_deposit: None,
                resources: Some(Default::default()),
            });
            placed_player_positions.push(Vec2 { x, y });
            id += 1;
        }
    }

    // Server-owned neutrals near this spawn point
    for neutral in neutrals_near_spawn {
        for _ in 0..neutral.count {
            let min_distance = neutral.min_distance_from_spawn.max(0.0);
            let max_distance = neutral.max_distance_from_spawn.max(min_distance);
            let (x, y) = if radiation_spawn_clearance(&neutral.entity_type_id, content) > 0.0 {
                let Some(position) = sample_radiation_source_spawn_position(
                    spawn_x,
                    spawn_y,
                    min_distance,
                    max_distance,
                    &neutral.entity_type_id,
                    entities,
                    content,
                    rng,
                ) else {
                    // The configured annulus cannot satisfy the radiation
                    // exclusion zone; do not violate the spawn rule.
                    continue;
                };
                position
            } else {
                sample_position_in_annulus(spawn_x, spawn_y, min_distance, max_distance, rng)
            };
            entities.push(Entity {
                id,
                entity_type_id: neutral.entity_type_id.clone(),
                pos: Some(Vec2 { x, y }),
                vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                force: Some(Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: UNIVERSE_OWNER.to_string(),
                health: content
                    .get(&neutral.entity_type_id)
                    .map(|def| def.health.max(0.0))
                    .unwrap_or(0.0),
                resource_deposit: None,
                resources: None,
            });
            id += 1;
        }
    }

    id
}

/// Largest player-exclusion radius of this type's radiation sources.
fn radiation_spawn_clearance(entity_type_id: &str, content: &ContentPack) -> f32 {
    content
        .get(entity_type_id)
        .map(|definition| {
            definition
                .radiation_sources
                .iter()
                .map(|source| {
                    source.max_effective_distance.max(0.0) * RADIATION_SPAWN_SAFETY_MULTIPLIER
                })
                .fold(0.0, f32::max)
        })
        .unwrap_or(0.0)
}

/// Samples a radiation source position that stays outside the source's safety
/// radius from every player-owned entity. Player loadout spacing is unchanged.
fn sample_radiation_source_spawn_position(
    spawn_x: f32,
    spawn_y: f32,
    min_distance: f32,
    max_distance: f32,
    entity_type_id: &str,
    entities: &[Entity],
    content: &ContentPack,
    rng: &mut impl rand::Rng,
) -> Option<(f32, f32)> {
    let clearance = radiation_spawn_clearance(entity_type_id, content);
    let clearance_sq = clearance * clearance;

    for _ in 0..MAX_RADIATION_SOURCE_SPAWN_ATTEMPTS {
        let (x, y) = sample_position_in_annulus(spawn_x, spawn_y, min_distance, max_distance, rng);
        let is_clear = entities.iter().all(|entity| {
            if is_system_owner(&entity.owner_player_id) {
                return true;
            }
            entity.pos.as_ref().is_none_or(|position| {
                squared_distance(x, y, position.x, position.y) >= clearance_sq
            })
        });
        if is_clear {
            return Some((x, y));
        }
    }

    None
}

fn sample_position_in_annulus(
    origin_x: f32,
    origin_y: f32,
    min_distance: f32,
    max_distance: f32,
    rng: &mut impl rand::Rng,
) -> (f32, f32) {
    let angle = rng.gen_range(0.0..std::f32::consts::TAU);
    let distance = if max_distance > min_distance {
        rng.gen_range(min_distance..=max_distance)
    } else {
        min_distance
    };
    (
        origin_x + angle.cos() * distance,
        origin_y + angle.sin() * distance,
    )
}

fn sample_player_unit_spawn_position(
    placed_positions: &[Vec2],
    min_distance: f32,
    max_distance: f32,
    rng: &mut impl rand::Rng,
) -> (f32, f32) {
    let min_sq = min_distance * min_distance;
    const MAX_ATTEMPTS: usize = 24;

    for _ in 0..MAX_ATTEMPTS {
        let anchor = &placed_positions[rng.gen_range(0..placed_positions.len())];
        let angle = rng.gen_range(0.0..std::f32::consts::TAU);
        let distance = if max_distance > min_distance {
            rng.gen_range(min_distance..=max_distance)
        } else {
            min_distance
        };
        let x = anchor.x + angle.cos() * distance;
        let y = anchor.y + angle.sin() * distance;
        if min_distance <= 0.0
            || placed_positions
                .iter()
                .all(|p| squared_distance(x, y, p.x, p.y) >= min_sq)
        {
            return (x, y);
        }
    }

    let anchor = &placed_positions[rng.gen_range(0..placed_positions.len())];
    let angle = rng.gen_range(0.0..std::f32::consts::TAU);
    let distance = if max_distance > min_distance {
        rng.gen_range(min_distance..=max_distance)
    } else {
        min_distance
    };
    (
        anchor.x + angle.cos() * distance,
        anchor.y + angle.sin() * distance,
    )
}

#[inline]
fn squared_distance(x1: f32, y1: f32, x2: f32, y2: f32) -> f32 {
    let dx = x1 - x2;
    let dy = y1 - y2;
    dx * dx + dy * dy
}

pub fn log_sample(state: &GameState) {
    let mut out = String::new();
    for e in state.entities.iter().take(3) {
        if let (Some(p), Some(v)) = (&e.pos, &e.vel) {
            out.push_str(&format!(
                "id:{} pos=({:.1},{:.1}) vel=({:.1},{:.1}); ",
                e.id, p.x, p.y, v.x, v.y
            ));
        }
    }
    debug!("tick={} | {}", state.tick, out);
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;

    #[test]
    fn finite_deposits_are_sampled_once_and_cannot_be_overdrawn_or_refilled() {
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
        let content = ContentPack::load(&root.join("packages/content/entities.yaml")).unwrap();
        let config = SpawnConfig::load(&root.join("services/rts-engine/config/spawn.yaml")).unwrap();
        let mut rng = rand::rngs::StdRng::seed_from_u64(42);
        let mut entities = vec![neutral_entity(1, "minerals", 0.0, 0.0, &content), neutral_entity(2, "star_yellow", 0.0, 0.0, &content)];
        initialize_resource_deposits(&mut entities, &content, Some(&config), &mut rng);
        let initial = entities[0].resource_deposit.clone().unwrap();
        assert!((2000.0..=20000.0).contains(&initial.amount));
        assert_eq!(initial.amount, initial.remaining);
        assert_eq!(take_from_deposit(&mut entities[0], 3.5), 3.5);
        assert_eq!(take_from_deposit(&mut entities[0], initial.amount), initial.amount - 3.5);
        assert_eq!(take_from_deposit(&mut entities[0], 1.0), 0.0);
        initialize_resource_deposits(&mut entities, &content, Some(&config), &mut rng);
        assert_eq!(entities[0].resource_deposit.as_ref().unwrap().remaining, 0.0);
        assert_eq!(entities[0].resource_deposit.as_ref().unwrap().amount, initial.amount);
        assert!(entities[1].resource_deposit.is_none());
        assert_eq!(take_from_deposit(&mut entities[1], 100.0), 100.0);

        let mut fixed = vec![neutral_entity(3, "planet_blue", 0.0, 0.0, &content)];
        initialize_resource_deposits(&mut fixed, &content, None, &mut rng);
        assert_eq!(fixed[0].resource_deposit.as_ref().unwrap().amount, 2000.0);
    }

    #[test]
    fn celestial_field_has_one_hundred_stars_and_seventy_five_planets() {
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
        let content = ContentPack::load(&root.join("packages/content/entities.yaml")).unwrap();
        let config =
            SpawnConfig::load(&root.join("services/rts-engine/config/spawn.yaml")).unwrap();
        let star_count = config
            .global_neutral_fields
            .iter()
            .find(|field| field.entity_type_id == "star_yellow")
            .unwrap()
            .count;
        let mut entities = Vec::new();
        spawn_celestial_field(
            &mut entities,
            &content,
            &config,
            &mut rand::rngs::StdRng::seed_from_u64(1),
        );

        assert_eq!(
            entities
                .iter()
                .filter(|entity| entity.entity_type_id == "star_yellow")
                .count(),
            star_count
        );
        assert_eq!(
            entities
                .iter()
                .filter(|entity| entity.entity_type_id == "planet_blue")
                .count(),
            star_count * 3 / 4
        );
        assert_eq!(
            entities
                .iter()
                .filter(|entity| entity.entity_type_id == "theta")
                .count(),
            1
        );
        assert_eq!(
            entities
                .iter()
                .filter(|entity| entity.entity_type_id == "minerals")
                .count(),
            1
        );
    }

    #[test]
    fn normal_star_position_sampler_is_centered_with_requested_standard_deviation() {
        const SAMPLE_COUNT: usize = 10_000;
        let mut rng = rand::rngs::StdRng::seed_from_u64(2);
        let positions: Vec<_> = (0..SAMPLE_COUNT)
            .map(|_| sample_normal_position(0.0, 0.0, 50_000.0, &mut rng))
            .collect();
        let mean_x = positions.iter().map(|(x, _)| x).sum::<f32>() / SAMPLE_COUNT as f32;
        let mean_y = positions.iter().map(|(_, y)| y).sum::<f32>() / SAMPLE_COUNT as f32;
        let standard_deviation_x = (positions
            .iter()
            .map(|(x, _)| (x - mean_x).powi(2))
            .sum::<f32>()
            / SAMPLE_COUNT as f32)
            .sqrt();
        let standard_deviation_y = (positions
            .iter()
            .map(|(_, y)| (y - mean_y).powi(2))
            .sum::<f32>()
            / SAMPLE_COUNT as f32)
            .sqrt();

        assert!(mean_x.abs() < 2_000.0);
        assert!(mean_y.abs() < 2_000.0);
        assert!((48_000.0..=52_000.0).contains(&standard_deviation_x));
        assert!((48_000.0..=52_000.0).contains(&standard_deviation_y));
    }
}
