use std::time::{Duration, Instant};

use rand::{rngs::StdRng, Rng, SeedableRng};
use tokio::time::interval;
use tracing::{info, Level};
use tracing_subscriber::EnvFilter;

mod pb {
    // Adjust these includes if your generated filenames differ.
    // They live in services/rts-engine/src/pb/ after build.rs runs.
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.vec2.rs"));
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.entity.rs"));
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.delta.rs"));
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.snapshot.rs"));
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.world.rs"));
}

use pb::{Entity, Vec2, World};

#[derive(Clone)]
struct GameConfig {
    num_entities: usize,
    // target ticks per second
    tps: u32,
    // random force magnitude range applied each tick
    force_min: f32,
    force_max: f32,
    // friction coefficient (per second) for exponential damping
    // vel *= exp(-friction * dt)
    friction: f32,
    // spawn bounds for initial positions
    spawn_min: f32,
    spawn_max: f32,
    // (optional) mass if you later vary per-entity; for now, 1.0
    default_mass: f32,
}

#[derive(Clone)]
struct GameState {
    tick: u64,
    entities: Vec<Entity>,
}

#[tokio::main]
async fn main() {
    init_tracing();

    let cfg = GameConfig {
        num_entities: 20,
        tps: 60,
        force_min: -20.0,
        force_max: 20.0,
        friction: 1.2, // higher -> slows faster; try 0.6–2.0
        spawn_min: -500.0,
        spawn_max: 500.0,
        default_mass: 1.0,
    };

    let mut rng = StdRng::seed_from_u64(42);
    let mut state = init_world(&cfg, &mut rng);

    info!(
        "Initialized world: entities={}, tps={}, friction={}",
        cfg.num_entities, cfg.tps, cfg.friction
    );

    // --- Game loop ---
    let dt = 1.0 / cfg.tps as f32;
    let mut ticker = interval(Duration::from_micros((1_000_000.0 / cfg.tps as f64) as u64));
    let mut last = Instant::now();

    loop {
        ticker.tick().await;

        // (Optional) measure real frame time; we integrate using fixed dt for stability
        let _frame_time = last.elapsed();
        last = Instant::now();

        apply_random_forces(&cfg, &mut state, &mut rng, dt);
        integrate(&cfg, &mut state, dt);

        state.tick += 1;

        if state.tick % (cfg.tps as u64) == 0 {
            // Once per second, log a tiny summary of a few entities
            log_sample(&state);
        }

        // If you want: emit deltas/snapshots to Redis here.
        // publish_delta(...); publish_snapshot(...);
    }
}

// ---------------------------
// Initialization & Utilities
// ---------------------------

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::default().add_directive(Level::INFO.into()));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}

fn init_world(cfg: &GameConfig, rng: &mut StdRng) -> GameState {
    let mut entities = Vec::with_capacity(cfg.num_entities);
    for id in 1..=cfg.num_entities as u64 {
        entities.push(Entity {
            id,
            pos: Some(Vec2 {
                x: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
                y: rng.gen_range(cfg.spawn_min..=cfg.spawn_max),
            }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            // If your proto also has force/mass, you could initialize them here.
        });
    }
    GameState { tick: 0, entities }
}

// ---------------------------
// Physics helpers
// ---------------------------

#[inline]
fn v_add(a: &Vec2, b: &Vec2) -> Vec2 {
    Vec2 {
        x: a.x + b.x,
        y: a.y + b.y,
    }
}

#[inline]
fn v_scale(a: &Vec2, s: f32) -> Vec2 {
    Vec2 { x: a.x * s, y: a.y * s }
}

#[inline]
fn v_exp_damp(v: &Vec2, friction: f32, dt: f32) -> Vec2 {
    // Exponential damping: v *= e^(-k * dt)
    let k = (-friction * dt).exp();
    v_scale(v, k)
}

// ---------------------------
// Per-tick simulation steps
// ---------------------------

fn apply_random_forces(cfg: &GameConfig, state: &mut GameState, rng: &mut StdRng, dt: f32) {
    // For this sketch: apply a single random force vector per entity each tick
    // Convert force to acceleration: a = F / m  (m=1 => a=F)
    for e in &mut state.entities {
        let vel = e.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });

        let fx = rng.gen_range(cfg.force_min..=cfg.force_max);
        let fy = rng.gen_range(cfg.force_min..=cfg.force_max);
        let force = Vec2 { x: fx, y: fy };

        let a = v_scale(&force, 1.0 / cfg.default_mass);

        // Integrate velocity from acceleration
        *vel = v_add(vel, &v_scale(&a, dt));
    }
}

fn integrate(cfg: &GameConfig, state: &mut GameState, dt: f32) {
    for e in &mut state.entities {
        let pos = e.pos.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
        let vel = e.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });

        // Apply friction (damping) to velocity first
        let damped = v_exp_damp(vel, cfg.friction, dt);
        *e.vel.as_mut().unwrap() = damped;

        // Integrate position
        *pos = v_add(pos, &v_scale(&damped, dt));
    }
}

// ---------------------------
// Logging
// ---------------------------

fn log_sample(state: &GameState) {
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
