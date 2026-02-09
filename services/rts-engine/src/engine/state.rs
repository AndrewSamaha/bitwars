use tracing::info;

use crate::config::GameConfig;
use crate::content::ContentPack;
use crate::pb::{Entity, Vec2};
use rand::Rng;
#[derive(Clone)]
pub struct GameState {
    pub tick: u64,
    pub entities: Vec<Entity>,
}

/// Initialise the game world.
///
/// If the config has a non-empty `spawn_manifest` and a content pack is
/// provided, entities are spawned with their `entity_type_id` set.
/// Otherwise falls back to `num_entities` untyped entities.
pub fn init_world(
    cfg: &GameConfig,
    content: Option<&ContentPack>,
    rng: &mut rand::rngs::StdRng,
) -> GameState {
    let mut entities = Vec::new();
    let mut next_id: u64 = 1;

    if !cfg.spawn_manifest.is_empty() && content.is_some() {
        for (type_id, count) in &cfg.spawn_manifest {
            for _ in 0..*count {
                entities.push(Entity {
                    id: next_id,
                    entity_type_id: type_id.clone(),
                    pos: Some(Vec2 {
                        x: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                        y: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                    }),
                    vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                    force: Some(Vec2 { x: 0.0, y: 0.0 }),
                });
                next_id += 1;
            }
        }
    } else {
        // Legacy fallback: num_entities untyped entities
        for id in 1..=cfg.num_entities as u64 {
            entities.push(Entity {
                id,
                entity_type_id: String::new(),
                pos: Some(Vec2 {
                    x: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                    y: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                }),
                vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                force: Some(Vec2 { x: 0.0, y: 0.0 }),
            });
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
