use tracing::info;

use crate::config::GameConfig;
use crate::pb::{Entity, Vec2};
use rand::Rng;
#[derive(Clone)]
pub struct GameState {
    pub tick: u64,
    pub entities: Vec<Entity>,
}

pub fn init_world(cfg: &GameConfig, rng: &mut rand::rngs::StdRng) -> GameState {
    let mut entities = Vec::with_capacity(cfg.num_entities);
    for id in 1..=cfg.num_entities as u64 {
        entities.push(Entity {
            id,
            pos: Some(Vec2 {
                x: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                y: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
            }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
        });
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
