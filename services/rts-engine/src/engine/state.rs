use std::collections::HashMap;

use tracing::debug;

use crate::pb::{Entity, Vec2};
use crate::content::ContentPack;
use crate::spawn_config::{Loadout, NeutralNearSpawn, SpawnConfig, NEUTRAL_OWNER};

const RADIATION_SPAWN_SAFETY_MULTIPLIER: f32 = 1.5;
const MAX_RADIATION_SOURCE_SPAWN_ATTEMPTS: usize = 64;

/// M7: Per-player resource totals. Outer key = player_id, inner key = resource_type_id.
pub type ResourceLedger = HashMap<String, HashMap<String, i64>>;

#[derive(Clone)]
pub struct GameState {
    pub tick: u64,
    pub entities: Vec<Entity>,
    /// M7: Authoritative per-player resource ledger (player_id → resource_type → amount).
    pub ledger: ResourceLedger,
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
                owner_player_id: NEUTRAL_OWNER.to_string(),
                health: content
                    .get(&neutral.entity_type_id)
                    .map(|def| def.health.max(0.0))
                    .unwrap_or(0.0),
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
                .map(|source| source.max_effective_distance.max(0.0) * RADIATION_SPAWN_SAFETY_MULTIPLIER)
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
            if entity.owner_player_id == NEUTRAL_OWNER {
                return true;
            }
            entity
                .pos
                .as_ref()
                .is_none_or(|position| squared_distance(x, y, position.x, position.y) >= clearance_sq)
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
    (origin_x + angle.cos() * distance, origin_y + angle.sin() * distance)
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
