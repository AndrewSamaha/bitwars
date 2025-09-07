pub mod state;

use rand::{rngs::StdRng, SeedableRng};
use tokio::time::{interval, Duration};
use tracing::{error, info};

use crate::config::GameConfig;
use crate::delta::compute_delta;
use crate::io::redis::RedisClient;
use crate::physics::{apply_random_forces, integrate};
use state::{GameState, init_world, log_sample};

pub struct Engine {
    cfg: GameConfig,
    rng: StdRng,
    state: GameState,
    prev_state: GameState,
    last_delta_id: Option<String>,
    redis: RedisClient,
}

impl Engine {
    pub async fn new(cfg: GameConfig) -> anyhow::Result<Self> {
        let mut rng = StdRng::seed_from_u64(42);
        let state = init_world(&cfg, &mut rng);
        info!("Initialized world: entities={}, tps={}, friction={}", cfg.num_entities, cfg.tps, cfg.friction);

        let redis = RedisClient::connect(&cfg.redis_url, cfg.game_id.clone()).await?;

        // Initial snapshot with boundary "0-0"
        let mut engine = Self {
            prev_state: state.clone(),
            state,
            rng,
            last_delta_id: None,
            cfg,
            redis,
        };
        engine.redis.publish_snapshot(&engine.state, "0-0").await?;
        Ok(engine)
    }

    pub async fn run(&mut self) -> anyhow::Result<()> {
        let dt = 1.0 / self.cfg.tps as f32;
        let mut ticker = interval(Duration::from_micros((1_000_000.0 / self.cfg.tps as f64) as u64));
        let snapshot_interval = (self.cfg.tps as u64) * self.cfg.snapshot_every_secs;

        loop {
            ticker.tick().await;

            apply_random_forces(&self.cfg, &mut self.state, &mut self.rng, dt);
            integrate(&self.cfg, &mut self.state, dt);
            self.state.tick += 1;

            // Delta
            let delta = compute_delta(&self.prev_state, &self.state, self.cfg.eps_pos, self.cfg.eps_vel);
            if !delta.updates.is_empty() {
                match self.redis.publish_delta(&delta).await {
                    Ok(id) => self.last_delta_id = Some(id),
                    Err(e) => error!(?e, "delta publish failed"),
                }
            }

            // Periodic snapshot
            if self.state.tick % snapshot_interval == 0 {
                let boundary = self.last_delta_id.as_deref().unwrap_or("0-0");
                if let Err(e) = self.redis.publish_snapshot(&self.state, boundary).await {
                    error!(?e, "snapshot publish failed");
                }
            }

            // Log once per second
            if self.state.tick % (self.cfg.tps as u64) == 0 {
                log_sample(&self.state);
            }

            self.prev_state = self.state.clone();
        }
    }
}
