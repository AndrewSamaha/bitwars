pub mod state;
pub mod intent;

use rand::{rngs::StdRng, SeedableRng};
use tokio::time::{interval, Duration};
use tracing::{error, info};

use crate::config::GameConfig;
use crate::delta::compute_delta;
use crate::io::redis::RedisClient;
use crate::physics::{integrate};
use crate::engine::intent::IntentManager;
use state::{GameState, init_world, log_sample};
use crate::pb; // protobuf types for decoding intents
use prost::Message;

pub struct Engine {
    cfg: GameConfig,
    state: GameState,
    prev_state: GameState,
    last_delta_id: Option<String>,
    redis: RedisClient,
    intents: IntentManager,
    last_intent_id: String,
}

impl Engine {
    pub async fn new(cfg: GameConfig) -> anyhow::Result<Self> {
        let mut rng = StdRng::seed_from_u64(42);
        let state = init_world(&cfg, &mut rng);
        info!("Initialized world: entities={}, tps={}, friction={}", cfg.num_entities, cfg.tps, cfg.friction);

        let redis = RedisClient::connect(&cfg.redis_url, cfg.game_id.clone()).await?;

        // Initial snapshot with boundary "0-0"
        // Capture needed config values before moving `cfg` into the struct
        let default_stop_radius = cfg.default_stop_radius;
        let mut engine = Self {
            prev_state: state.clone(),
            state,
            last_delta_id: None,
            cfg,
            redis,
            // Initialize with captured value to avoid use-after-move of `cfg`
            intents: IntentManager::new(default_stop_radius),
            // Start reading intents from the beginning (change to "$" to only read new ones)
            last_intent_id: "0-0".to_string(),
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

            // Phase B: Ingest intents from Redis stream (non-blocking)
            if let Ok(Some((new_last_id, payloads))) = self.redis.read_new_intents(&self.last_intent_id, 100).await {
                for bytes in payloads {
                    match pb::Intent::decode(bytes.as_slice()) {
                        Ok(intent) => {
                            // Log accept
                            match intent.kind.as_ref() {
                                Some(pb::intent::Kind::Move(m)) => {
                                    if let Some(t) = m.target.as_ref() {
                                        info!(entity_id = m.entity_id, client_cmd_id = %m.client_cmd_id, player_id = %m.player_id, target_x = t.x, target_y = t.y, "accept intent=Move");
                                    } else {
                                        info!(entity_id = m.entity_id, client_cmd_id = %m.client_cmd_id, player_id = %m.player_id, "accept intent=Move (missing target)");
                                    }
                                }
                                Some(pb::intent::Kind::Attack(a)) => {
                                    info!(entity_id = a.entity_id, client_cmd_id = %a.client_cmd_id, player_id = %a.player_id, target_id = a.target_id, "accept intent=Attack");
                                }
                                Some(pb::intent::Kind::Build(b)) => {
                                    if let Some(loc) = b.location.as_ref() {
                                        info!(entity_id = b.entity_id, client_cmd_id = %b.client_cmd_id, player_id = %b.player_id, blueprint_id = %b.blueprint_id, loc_x = loc.x, loc_y = loc.y, "accept intent=Build");
                                    } else {
                                        info!(entity_id = b.entity_id, client_cmd_id = %b.client_cmd_id, player_id = %b.player_id, blueprint_id = %b.blueprint_id, "accept intent=Build (missing location)");
                                    }
                                }
                                None => {}
                            }
                            // Enqueue into manager
                            self.intents.enqueue(intent);
                        }
                        Err(e) => {
                            // Skip invalid payloads
                            tracing::warn!(error = ?e, "failed to decode intent payload from Redis");
                        }
                    }
                }
                self.last_intent_id = new_last_id;
            }

            // Start any pending intents for entities without a current action
            let _started = self.intents.process_pending();

            // Advance currently executing actions (e.g., Move) toward targets
            self.intents.follow_targets(&mut self.state, self.cfg.default_entity_speed, dt);
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
