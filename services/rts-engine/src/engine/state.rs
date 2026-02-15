use std::collections::HashMap;

use tracing::debug;

use crate::pb::{Entity, Vec2};
use crate::spawn_config::{Loadout, NeutralNearSpawn, SpawnConfig, NEUTRAL_OWNER};

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
            });
            placed_player_positions.push(Vec2 { x, y });
            id += 1;
        }
    }

    // Server-owned neutrals near this spawn point
    for neutral in neutrals_near_spawn {
        for _ in 0..neutral.count {
            let angle = rng.gen_range(0.0..std::f32::consts::TAU);
            let min_distance = neutral.min_distance_from_spawn.max(0.0);
            let max_distance = neutral.max_distance_from_spawn.max(min_distance);
            let distance = if max_distance > min_distance {
                rng.gen_range(min_distance..=max_distance)
            } else {
                min_distance
            };
            entities.push(Entity {
                id,
                entity_type_id: neutral.entity_type_id.clone(),
                pos: Some(Vec2 {
                    x: spawn_x + angle.cos() * distance,
                    y: spawn_y + angle.sin() * distance,
                }),
                vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                force: Some(Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: NEUTRAL_OWNER.to_string(),
            });
            id += 1;
        }
    }

    id
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
    (anchor.x + angle.cos() * distance, anchor.y + angle.sin() * distance)
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
