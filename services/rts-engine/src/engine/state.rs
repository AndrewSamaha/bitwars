use tracing::info;

use crate::config::GameConfig;
use crate::content::ContentPack;
use crate::pb::{Entity, Vec2};
use crate::spawn_config::{Loadout, NeutralNearSpawn, SpawnConfig, NEUTRAL_OWNER};
use rand::Rng;

/// World-space radius for random jitter when spawning multiple units at one spawn point (so they don't stack).
const SPAWN_JITTER_RADIUS: f32 = 25.0;
/// Jitter for neutral entities near spawn (when offset is zero, or in addition to offset).
const NEUTRAL_JITTER_RADIUS: f32 = 15.0;

#[derive(Clone)]
pub struct GameState {
    pub tick: u64,
    pub entities: Vec<Entity>,
}

/// Initialise the game world.
///
/// When `spawn_config` is present and valid for the number of players, uses onPlayerSpawn-style
/// flow: for each player slot, spawns that player's loadout at their spawn point and optional
/// server-owned neutrals nearby. Otherwise falls back to legacy spawn_manifest round-robin or
/// num_entities untyped entities.
fn owner_for_index(player_ids: &[String], entity_index: usize) -> String {
    if player_ids.is_empty() {
        return String::new();
    }
    player_ids[entity_index % player_ids.len()].clone()
}

/// Spawns all entities for one player at their spawn location (player-owned units + optional neutrals nearby).
/// Returns the next free entity id after spawning.
fn on_player_spawn(
    entities: &mut Vec<Entity>,
    next_id: u64,
    player_id: &str,
    spawn_x: f32,
    spawn_y: f32,
    loadout: &Loadout,
    neutrals_near_spawn: &[NeutralNearSpawn],
    rng: &mut rand::rngs::StdRng,
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

pub fn init_world(
    cfg: &GameConfig,
    content: Option<&ContentPack>,
    spawn_config: Option<&SpawnConfig>,
    rng: &mut rand::rngs::StdRng,
) -> GameState {
    let mut entities = Vec::new();
    let mut next_id: u64 = 1;
    let num_players = cfg.player_ids.len();

    if let Some(sc) = spawn_config {
        if sc.is_valid_for_players(num_players) && content.is_some() {
            for slot in 0..num_players {
                let player_id = &cfg.player_ids[slot];
                let point = &sc.spawn_points[slot];
                let loadout = &sc.loadouts[slot];
                next_id = on_player_spawn(
                    &mut entities,
                    next_id,
                    player_id,
                    point.x(),
                    point.y(),
                    loadout,
                    &sc.neutrals_near_spawn,
                    rng,
                );
            }
            return GameState { tick: 0, entities };
        }
    }

    // Legacy: spawn_manifest with round-robin ownership
    let mut entity_index: usize = 0;
    if !cfg.spawn_manifest.is_empty() && content.is_some() {
        for (type_id, count) in &cfg.spawn_manifest {
            for _ in 0..*count {
                let owner = owner_for_index(&cfg.player_ids, entity_index);
                entities.push(Entity {
                    id: next_id,
                    entity_type_id: type_id.clone(),
                    pos: Some(Vec2 {
                        x: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                        y: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                    }),
                    vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                    force: Some(Vec2 { x: 0.0, y: 0.0 }),
                    owner_player_id: owner,
                });
                next_id += 1;
                entity_index += 1;
            }
        }
    } else {
        for id in 1..=cfg.num_entities as u64 {
            let owner = owner_for_index(&cfg.player_ids, entity_index);
            entities.push(Entity {
                id,
                entity_type_id: String::new(),
                pos: Some(Vec2 {
                    x: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                    y: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                }),
                vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                force: Some(Vec2 { x: 0.0, y: 0.0 }),
                owner_player_id: owner,
            });
            entity_index += 1;
        }
    }

    GameState { tick: 0, entities }
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
    info!("tick={} | {}", state.tick, out);
}
