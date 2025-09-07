use std::collections::HashMap;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use rand::{rngs::StdRng, Rng, SeedableRng};
use tokio::time::interval;
use tracing::{error, info, Level};
use tracing_subscriber::EnvFilter;

use prost::Message;                 // for encode_to_vec()
use redis::AsyncCommands;           // for SET

use rts_engine::pb;
use pb::{Delta, Entity, EntityDelta, Snapshot, Vec2};

#[derive(Clone)]
struct GameConfig {
    game_id: String,
    num_entities: usize,
    tps: u32,
    force_min: f32,
    force_max: f32,
    friction: f32,
    spawn_min: f32,
    spawn_max: f32,
    default_mass: f32,
    // publishing
    snapshot_every_secs: u64,
    eps_pos: f32,  // movement threshold for deltas
    eps_vel: f32,  // velocity threshold for deltas
}

#[derive(Clone)]
struct GameState {
    tick: u64,
    entities: Vec<Entity>,
}

#[tokio::main]
async fn main() {
    load_env();
    init_tracing();

    let cfg = GameConfig {
        game_id: std::env::var("GAME_ID").unwrap_or_else(|_| "demo-001".into()),
        num_entities: 20,
        tps: 60,
        force_min: -20.0,
        force_max: 20.0,
        friction: 1.2,
        spawn_min: -500.0,
        spawn_max: 500.0,
        default_mass: 1.0,
        snapshot_every_secs: 2,
        eps_pos: 0.0005,
        eps_vel: 0.0005,
    };

    // --- Redis connection ---
    let redis_url = std::env::var("GAMESTATE_REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".into());
    let client = redis::Client::open(redis_url.clone()).expect("bad REDIS_URL");
    let mut conn = client.get_async_connection().await.expect("cannot connect to redis");
    info!("Connected to Redis at {}", redis_url);

    // --- World init ---
    let mut rng = StdRng::seed_from_u64(42);
    let mut state = init_world(&cfg, &mut rng);
    info!(
        "Initialized world: entities={}, tps={}, friction={}",
        cfg.num_entities, cfg.tps, cfg.friction
    );

    // Track the last delta stream ID we published (for snapshot boundary)
    let mut last_delta_id: Option<String> = None;

    // Publish an initial snapshot (boundary is "0-0" because no deltas yet)
    if let Err(e) = publish_snapshot(&cfg, &mut conn, &state, "0-0").await {
        error!(?e, "initial snapshot publish failed");
    }

    // Keep previous state for delta calc
    let mut prev_state = state.clone();

    // --- Game loop ---
    let dt = 1.0 / cfg.tps as f32;
    let mut ticker = interval(Duration::from_micros((1_000_000.0 / cfg.tps as f64) as u64));
    let mut last = Instant::now();
    let snapshot_interval = (cfg.tps as u64) * cfg.snapshot_every_secs;

    loop {
        ticker.tick().await;

        // (Optional) real frame time
        let _frame_time = last.elapsed();
        last = Instant::now();

        apply_random_forces(&cfg, &mut state, &mut rng, dt);
        integrate(&cfg, &mut state, dt);

        state.tick += 1;

        // Compute + publish delta (sparse)
        let delta = compute_delta(&prev_state, &state, cfg.eps_pos, cfg.eps_vel);
        if !delta.updates.is_empty() {
            match publish_delta(&cfg, &mut conn, &delta).await {
                Ok(id) => last_delta_id = Some(id),
                Err(e) => error!(?e, "delta publish failed"),
            }
        }

        // Periodic snapshot (use boundary of last published delta, or "0-0" if none)
        if state.tick % snapshot_interval == 0 {
            let boundary = last_delta_id.as_deref().unwrap_or("0-0");
            if let Err(e) = publish_snapshot(&cfg, &mut conn, &state, boundary).await {
                error!(?e, "snapshot publish failed");
            }
        }

        // Log once per second
        if state.tick % (cfg.tps as u64) == 0 {
            log_sample(&state);
        }

        prev_state = state.clone();
    }
}

// ---------------------------
// Redis publish helpers
// ---------------------------

async fn publish_snapshot(
    cfg: &GameConfig,
    conn: &mut redis::aio::Connection,
    state: &GameState,
    boundary_stream_id: &str, // last delta included in this snapshot
) -> Result<(), redis::RedisError> {
    let snap = Snapshot { tick: state.tick as i64, entities: state.entities.clone() };
    let bytes = snap.encode_to_vec();

    let snap_key = format!("snapshot:{}", cfg.game_id);
    let meta_key = format!("snapshot_meta:{}", cfg.game_id);

    // SET snapshot bytes
    let _: () = conn.set(&snap_key, bytes).await?;

    // HSET metadata (tick, boundary_stream_id, updated_at_ms)
    let now_ms = now_millis();
    let _: () = redis::cmd("HSET")
        .arg(&meta_key)
        .arg("tick").arg(state.tick as i64)
        .arg("boundary_stream_id").arg(boundary_stream_id)
        .arg("updated_at_ms").arg(now_ms as i64)
        .query_async(conn)
        .await?;

    info!(
        "SET {} (tick={}), HSET {} boundary_stream_id={}",
        snap_key, state.tick, meta_key, boundary_stream_id
    );
    Ok(())
}

async fn publish_delta(
    cfg: &GameConfig,
    conn: &mut redis::aio::Connection,
    delta: &Delta,
) -> Result<String, redis::RedisError> {
    let bytes = delta.encode_to_vec();
    let stream = format!("deltas:{}", cfg.game_id);

    // XADD deltas:<game_id> MAXLEN ~ 10000 * data <bytes>
    let id: String = redis::cmd("XADD")
        .arg(&stream)
        .arg("MAXLEN").arg("~").arg(10_000) // tune retention
        .arg("*")
        .arg("data")
        .arg(bytes)
        .query_async(conn)
        .await?;

    info!(
        "XADD {} id={} (tick={}, updates={})",
        stream, id, delta.tick, delta.updates.len()
    );
    Ok(id)
}

fn now_millis() -> u128 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis()
}

// ---------------------------
// Env + Tracing
// ---------------------------

fn load_env() {
    let _ = dotenvy::dotenv(); // local .env
    let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../.env");
    let _ = dotenvy::from_path(root); // repo-root .env
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::default().add_directive(Level::INFO.into()));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}

// ---------------------------
// Initialization & Physics
// ---------------------------

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
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
        });
    }
    GameState { tick: 0, entities }
}

#[inline]
fn v_add(a: &Vec2, b: &Vec2) -> Vec2 {
    Vec2 { x: a.x + b.x, y: a.y + b.y }
}
#[inline]
fn v_scale(a: &Vec2, s: f32) -> Vec2 {
    Vec2 { x: a.x * s, y: a.y * s }
}
#[inline]
fn v_exp_damp(v: &Vec2, friction: f32, dt: f32) -> Vec2 {
    let k = (-friction * dt).exp();
    v_scale(v, k)
}

fn apply_random_forces(cfg: &GameConfig, state: &mut GameState, rng: &mut StdRng, dt: f32) {
    for e in &mut state.entities {
        let vel = e.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });

        let fx = rng.gen_range(cfg.force_min..=cfg.force_max);
        let fy = rng.gen_range(cfg.force_min..=cfg.force_max);
        let a = Vec2 { x: fx / cfg.default_mass, y: fy / cfg.default_mass };

        *vel = v_add(vel, &v_scale(&a, dt));
    }
}

fn integrate(cfg: &GameConfig, state: &mut GameState, dt: f32) {
    for e in &mut state.entities {
        let pos = e.pos.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
        let vel = e.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });

        let damped = v_exp_damp(vel, cfg.friction, dt);
        *e.vel.as_mut().unwrap() = damped;

        *pos = v_add(pos, &v_scale(&damped, dt));
    }
}

// ---------------------------
// Delta / Snapshot
// ---------------------------

fn compute_delta(prev: &GameState, curr: &GameState, eps_pos: f32, eps_vel: f32) -> Delta {
    // Map prev entities by id for O(1) lookups
    let mut prev_by_id: HashMap<u64, &Entity> = HashMap::with_capacity(prev.entities.len());
    for e in &prev.entities {
        prev_by_id.insert(e.id, e);
    }

    let mut updates: Vec<EntityDelta> = Vec::new();
    for ce in &curr.entities {
        let mut ed = EntityDelta { id: ce.id, pos: None, vel: None, force: None };

        if let Some(pe) = prev_by_id.get(&ce.id) {
            // pos change?
            if let (Some(cp), Some(pp)) = (&ce.pos, &pe.pos) {
                if (cp.x - pp.x).abs() > eps_pos || (cp.y - pp.y).abs() > eps_pos {
                    ed.pos = Some(cp.clone());
                }
            } else if ce.pos.is_some() {
                ed.pos = ce.pos.clone();
            }
            // vel change?
            if let (Some(cv), Some(pv)) = (&ce.vel, &pe.vel) {
                if (cv.x - pv.x).abs() > eps_vel || (cv.y - pv.y).abs() > eps_vel {
                    ed.vel = Some(cv.clone());
                }
            } else if ce.vel.is_some() {
                ed.vel = ce.vel.clone();
            }
        } else {
            // New entity: include pos/vel so clients can create it
            if ce.pos.is_some() { ed.pos = ce.pos.clone(); }
            if ce.vel.is_some() { ed.vel = ce.vel.clone(); }
        }

        if ed.pos.is_some() || ed.vel.is_some() || ed.force.is_some() {
            updates.push(ed);
        }
    }

    Delta { tick: curr.tick, updates }
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
