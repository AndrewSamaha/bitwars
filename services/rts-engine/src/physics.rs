use crate::config::GameConfig;
use crate::engine::state::GameState;
use crate::pb::Vec2;
use rand::Rng;

#[inline]
fn v_add(a: &Vec2, b: &Vec2) -> Vec2 { Vec2 { x: a.x + b.x, y: a.y + b.y } }
#[inline]
fn v_scale(a: &Vec2, s: f32) -> Vec2 { Vec2 { x: a.x * s, y: a.y * s } }
#[inline]
fn v_exp_damp(v: &Vec2, friction: f32, dt: f32) -> Vec2 { v_scale(v, (-friction * dt).exp()) }

pub fn apply_random_forces(cfg: &GameConfig, state: &mut GameState, rng: &mut rand::rngs::StdRng, dt: f32) {
    for e in &mut state.entities {
        let vel = e.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
        let fx = rng.gen_range(cfg.force_min..=cfg.force_max);
        let fy = rng.gen_range(cfg.force_min..=cfg.force_max);
        let a = Vec2 { x: fx / cfg.default_mass, y: fy / cfg.default_mass };
        *vel = v_add(vel, &v_scale(&a, dt));
    }
}

pub fn integrate(cfg: &GameConfig, state: &mut GameState, dt: f32) {
    for e in &mut state.entities {
        let pos = e.pos.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
        let vel = e.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
        let damped = v_exp_damp(vel, cfg.friction, dt);
        *e.vel.as_mut().unwrap() = damped;
        *pos = v_add(pos, &v_scale(&damped, dt));
    }
}
