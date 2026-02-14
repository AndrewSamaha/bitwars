use std::collections::HashMap;

use tracing::debug;

use crate::pb::{Entity, Vec2};
use crate::spawn_config::{Loadout, NeutralNearSpawn, SpawnConfig, NEUTRAL_OWNER};

/// World-space radius for random jitter when spawning multiple units at one spawn point (so they don't stack).
const SPAWN_JITTER_RADIUS: f32 = 25.0;
/// Jitter for neutral entities near spawn (when offset is zero, or in addition to offset).
const NEUTRAL_JITTER_RADIUS: f32 = 15.0;

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
    neutrals_near_spawn: &[NeutralNearSpawn],
    rng: &mut impl rand::Rng,
) -> u64 {
    let mut id = next_id;

    // Player-owned units: each (type_id, count) at spawn with jitter
    for (type_id, count) in loadout {
        for _ in 0..*count {
            let jx = rng.gen_range(-SPAWN_JITTER_RADIUS..=SPAWN_JITTER_RADIUS);
            let jy = rng.gen_range(-SPAWN_JITTER_RADIUS..=SPAWN_JITTER_RADIUS);
            entities.push(Entity {
                id,
                entity_type_id: type_id.clone(),
                pos: Some(Vec2 {
                    x: spawn_x + jx,
                    y: spawn_y + jy,
                }),
                vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                force: Some(Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: player_id.to_string(),
            });
            id += 1;
        }
    }

    // Server-owned neutrals near this spawn point
    for neutral in neutrals_near_spawn {
        for _ in 0..neutral.count {
            let jx = rng.gen_range(-NEUTRAL_JITTER_RADIUS..=NEUTRAL_JITTER_RADIUS);
            let jy = rng.gen_range(-NEUTRAL_JITTER_RADIUS..=NEUTRAL_JITTER_RADIUS);
            entities.push(Entity {
                id,
                entity_type_id: neutral.entity_type_id.clone(),
                pos: Some(Vec2 {
                    x: spawn_x + neutral.offset_x + jx,
                    y: spawn_y + neutral.offset_y + jy,
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
