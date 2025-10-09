pub mod intent;
pub mod state;

use std::collections::{HashMap, HashSet};

use anyhow::{anyhow, bail, Context, Result};
use rand::{rngs::StdRng, SeedableRng};
use tokio::time::{interval, Duration};
use tracing::{error, info, warn};
use uuid::{Uuid, Version};

use crate::config::GameConfig;
use crate::delta::compute_delta;
use crate::engine::intent::{format_uuid, IntentManager, IntentMetadata, QueuedIntent};
use crate::io::redis::RedisClient;
use crate::io::telemetry::Telemetry;
use crate::pb::{self, events_stream_record, intent_envelope};
use crate::physics::integrate;
use prost::Message;
use state::{init_world, log_sample, GameState};

pub const ENGINE_PROTOCOL_MAJOR: u32 = 1;
const DEDUPE_TTL_SECS: usize = 600;

fn ensure_uuid_v7(bytes: &[u8], field: &str) -> Result<()> {
    if bytes.len() != 16 {
        bail!("{field} must be 16 bytes (UUIDv7)");
    }

    let uuid = Uuid::from_slice(bytes)
        .with_context(|| format!("{field} must contain valid UUID bytes"))?;

    if uuid.get_version() != Some(Version::SortRand) {
        let version = uuid
            .get_version()
            .map(|v| format!("{:?}", v))
            .unwrap_or_else(|| "unknown".to_string());
        bail!("{field} must be a UUIDv7 (found version {version})");
    }

    Ok(())
}

#[cfg(test)]
mod uuid_tests {
    use super::*;

    #[test]
    fn ensure_uuid_v7_accepts_valid_uuid() {
        let uuid = Uuid::now_v7();
        ensure_uuid_v7(uuid.as_bytes(), "test-field").expect("valid UUIDv7 should pass");
    }

    #[test]
    fn ensure_uuid_v7_rejects_wrong_length() {
        let err = ensure_uuid_v7(&[0u8; 15], "test-field").expect_err("length mismatch should fail");
        assert!(err.to_string().contains("16 bytes"));
    }

    #[test]
    fn ensure_uuid_v7_rejects_wrong_version() {
        let uuid_nil = Uuid::nil();
        let err = ensure_uuid_v7(uuid_nil.as_bytes(), "test-field").expect_err("wrong version should fail");
        assert!(err.to_string().contains("UUIDv7"));
    }
}

pub struct Engine {
    cfg: GameConfig,
    state: GameState,
    prev_state: GameState,
    last_delta_id: Option<String>,
    redis: RedisClient,
    intents: IntentManager,
    last_intent_id: String,
    player_last_seq: HashMap<String, u64>,
    lifecycle_emitted: HashSet<(Vec<u8>, pb::LifecycleState)>,
    telemetry: Option<Telemetry>,
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    use prost::Message;
    use redis::Value as RedisValue;
    use uuid::Uuid;

    fn test_redis_url() -> String {
        std::env::var("TEST_REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string())
    }

    #[tokio::test]
    #[ignore = "requires Redis server (set TEST_REDIS_URL)"]
    #[allow(deprecated)]
    async fn lifecycle_sequence_for_move_intent() -> Result<()> {
        let redis_url = test_redis_url();
        let game_id = format!("itest-{}", Uuid::now_v7());
        let events_stream = format!("rts:match:{}:events", game_id);
        let intents_stream = format!("rts:match:{}:intents", game_id);

        let client = redis::Client::open(redis_url.clone())?;
        let mut conn = client.get_multiplexed_async_connection().await?;
        redis::cmd("DEL")
            .arg(&events_stream)
            .arg(&intents_stream)
            .query_async::<_, ()>(&mut conn)
            .await?;
        drop(conn);

        let mut cfg = GameConfig::default();
        cfg.game_id = game_id.clone();
        cfg.redis_url = redis_url.clone();
        cfg.num_entities = 1;

        let mut engine = Engine::new(cfg).await?;
        let entity = engine
            .state
            .entities
            .first()
            .cloned()
            .expect("world should have at least one entity");

        let move_intent = pb::MoveToLocationIntent {
            entity_id: entity.id,
            target: entity.pos.clone(),
            client_cmd_id: String::new(),
            player_id: String::new(),
        };

        let intent_id_bytes = Uuid::now_v7().into_bytes();
        let intent_id_vec = intent_id_bytes.to_vec();
        let envelope = pb::IntentEnvelope {
            client_cmd_id: Uuid::now_v7().into_bytes().to_vec(),
            intent_id: intent_id_vec.clone(),
            player_id: "player-1".to_string(),
            client_seq: 1,
            server_tick: 0,
            protocol_version: ENGINE_PROTOCOL_MAJOR,
            policy: pb::IntentPolicy::ReplaceActive as i32,
            payload: Some(intent_envelope::Payload::Move(move_intent)),
        };

        engine.handle_envelope(envelope).await?;

        let started = engine.intents.process_pending();
        for (_, metadata) in started {
            engine
                .emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::InProgress,
                    pb::LifecycleReason::None,
                    engine.state.tick,
                )
                .await?;
        }

        let finished = engine.intents.follow_targets(
            &mut engine.state,
            engine.cfg.default_entity_speed,
            0.0,
        );
        for (_, metadata) in finished {
            engine
                .emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Finished,
                    pb::LifecycleReason::None,
                    engine.state.tick,
                )
                .await?;
        }

        engine.state.tick += 1;

        let mut read_conn = redis::Client::open(redis_url.clone())?
            .get_multiplexed_async_connection()
            .await?;
        let reply: RedisValue = redis::cmd("XRANGE")
            .arg(&events_stream)
            .arg("-")
            .arg("+")
            .query_async(&mut read_conn)
            .await?;

        let mut states = Vec::new();
        if let RedisValue::Bulk(entries) = reply {
            for entry in entries {
                if let RedisValue::Bulk(parts) = entry {
                    if let Some(RedisValue::Bulk(fieldvals)) = parts.get(1) {
                        let mut i = 0;
                        while i + 1 < fieldvals.len() {
                            if let (RedisValue::Data(field), RedisValue::Data(value)) =
                                (&fieldvals[i], &fieldvals[i + 1])
                            {
                                if field == b"data" {
                                    if let Ok(record) =
                                        pb::EventsStreamRecord::decode(value.as_slice())
                                    {
                                        if let Some(events_stream_record::Record::Lifecycle(event)) =
                                            record.record
                                        {
                                            if event.intent_id == intent_id_vec {
                                                if let Some(state) =
                                                    pb::LifecycleState::from_i32(event.state)
                                                {
                                                    states.push(state);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            i += 2;
                        }
                    }
                }
            }
        }

        assert_eq!(
            states,
            vec![
                pb::LifecycleState::Received,
                pb::LifecycleState::Accepted,
                pb::LifecycleState::InProgress,
                pb::LifecycleState::Finished,
            ]
        );

        Ok(())
    }
}


impl Engine {
    pub async fn new(cfg: GameConfig) -> anyhow::Result<Self> {
        let mut rng = StdRng::seed_from_u64(42);
        let state = init_world(&cfg, &mut rng);
        info!(
            "Initialized world: entities={}, tps={}, friction={}",
            cfg.num_entities, cfg.tps, cfg.friction
        );

        let redis = RedisClient::connect(&cfg.redis_url, cfg.game_id.clone()).await?;
        let telemetry = Telemetry::from_env()?;
        if let Some(ref t) = telemetry {
            info!(dataset = t.dataset(), "axiom telemetry enabled");
        }

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
            player_last_seq: HashMap::new(),
            lifecycle_emitted: HashSet::new(),
            telemetry,
        };
        engine.redis.publish_snapshot(&engine.state, "0-0").await?;
        Ok(engine)
    }

    pub async fn run(&mut self) -> anyhow::Result<()> {
        let dt = 1.0 / self.cfg.tps as f32;
        let mut ticker = interval(Duration::from_micros(
            (1_000_000.0 / self.cfg.tps as f64) as u64,
        ));
        let snapshot_interval = (self.cfg.tps as u64) * self.cfg.snapshot_every_secs;

        loop {
            ticker.tick().await;

            // Phase B: Ingest intents from Redis stream (non-blocking)
            if let Ok(Some((new_last_id, payloads))) =
                self.redis.read_new_intents(&self.last_intent_id, 100).await
            {
                for bytes in payloads {
                    if let Err(err) = self.process_raw_intent(bytes.as_slice()).await {
                        warn!(error = ?err, "failed to handle intent payload from Redis");
                    }
                }
                self.last_intent_id = new_last_id;
            }

            // Start any pending intents for entities without a current action
            let started = self.intents.process_pending();
            for (_entity, metadata) in started {
                if let Err(err) = self
                    .emit_lifecycle_event(
                        &metadata,
                        pb::LifecycleState::InProgress,
                        pb::LifecycleReason::None,
                        self.state.tick,
                    )
                    .await
                {
                    warn!(error = ?err, intent_id = %format_uuid(&metadata.intent_id), "failed to emit IN_PROGRESS lifecycle event");
                }
            }

            // Advance currently executing actions (e.g., Move) toward targets
            let finished =
                self.intents
                    .follow_targets(&mut self.state, self.cfg.default_entity_speed, dt);
            for (_entity, metadata) in finished {
                if let Err(err) = self
                    .emit_lifecycle_event(
                        &metadata,
                        pb::LifecycleState::Finished,
                        pb::LifecycleReason::None,
                        self.state.tick,
                    )
                    .await
                {
                    warn!(error = ?err, intent_id = %format_uuid(&metadata.intent_id), "failed to emit FINISHED lifecycle event");
                }
            }
            integrate(&self.cfg, &mut self.state, dt);
            self.state.tick += 1;

            // Delta
            let delta = compute_delta(
                &self.prev_state,
                &self.state,
                self.cfg.eps_pos,
                self.cfg.eps_vel,
            );
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

    async fn process_raw_intent(&mut self, bytes: &[u8]) -> Result<()> {
        match pb::IntentEnvelope::decode(bytes) {
            Ok(envelope) => self.handle_envelope(envelope).await,
            Err(_) => {
                // Legacy fallback to bare Intent
                let intent = pb::Intent::decode(bytes)?;
                self.handle_legacy_intent(intent).await
            }
        }
    }

    async fn handle_envelope(&mut self, envelope: pb::IntentEnvelope) -> Result<()> {
        let accept_tick = self.state.tick;
        let player_id = envelope.player_id.clone();
        let client_seq = envelope.client_seq;
        let protocol_version = envelope.protocol_version;
        let intent_id = if envelope.intent_id.is_empty() {
            Uuid::now_v7().into_bytes().to_vec()
        } else {
            envelope.intent_id.clone()
        };
        let client_cmd_id = envelope.client_cmd_id.clone();

        let policy =
            pb::IntentPolicy::try_from(envelope.policy).unwrap_or(pb::IntentPolicy::ReplaceActive);

        let metadata = IntentMetadata {
            intent_id: intent_id.clone(),
            client_cmd_id: client_cmd_id.clone(),
            player_id: player_id.clone(),
            protocol_version,
            server_tick: accept_tick,
            policy,
        };

        self.emit_lifecycle_event(
            &metadata,
            pb::LifecycleState::Received,
            pb::LifecycleReason::None,
            accept_tick,
        )
        .await?;

        if let Err(validation_err) = ensure_uuid_v7(&client_cmd_id, "client_cmd_id") {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::InvalidTarget,
                accept_tick,
            )
            .await?;
            warn!(
                player_id = %player_id,
                error = ?validation_err,
                "invalid client_cmd_id (expected UUIDv7)"
            );
            return Err(validation_err);
        }

        if !envelope.intent_id.is_empty() {
            if let Err(validation_err) = ensure_uuid_v7(&intent_id, "intent_id") {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                    accept_tick,
                )
                .await?;
                warn!(
                    player_id = %player_id,
                    error = ?validation_err,
                    "invalid intent_id (expected UUIDv7)"
                );
                return Err(validation_err);
            }
        }

        if protocol_version != ENGINE_PROTOCOL_MAJOR {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::ProtocolMismatch,
                accept_tick,
            )
            .await?;
            warn!(player_id = %player_id, expected = ENGINE_PROTOCOL_MAJOR, got = protocol_version, "protocol mismatch");
            return Err(anyhow!("protocol mismatch"));
        }

        if let Some(last_seq) = self.player_last_seq.get(&player_id).copied() {
            if client_seq <= last_seq {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::OutOfOrder,
                    accept_tick,
                )
                .await?;
                warn!(player_id = %player_id, client_seq, last_seq, "dropping out-of-order intent");
                return Err(anyhow!("out of order"));
            }
        }

        if let Some(existing_intent_id) = self
            .redis
            .existing_intent_for_cmd(&player_id, &client_cmd_id)
            .await?
        {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::Duplicate,
                accept_tick,
            )
            .await?;
            warn!(player_id = %player_id, existing_intent_id = %format_uuid(&existing_intent_id), "duplicate client_cmd_id received");
            return Err(anyhow!("duplicate command"));
        }

        self.player_last_seq.insert(player_id.clone(), client_seq);
        self.redis
            .store_client_cmd(&player_id, &client_cmd_id, &intent_id, DEDUPE_TTL_SECS)
            .await?;

        let payload_intent = match envelope.payload {
            Some(intent_envelope::Payload::Move(m)) => {
                info!(entity_id = m.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, "accept intent=Move");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(m)),
                }
            }
            Some(intent_envelope::Payload::Attack(a)) => {
                info!(entity_id = a.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, target_id = a.target_id, "accept intent=Attack");
                pb::Intent {
                    kind: Some(pb::intent::Kind::Attack(a)),
                }
            }
            Some(intent_envelope::Payload::Build(b)) => {
                if let Some(loc) = b.location.as_ref() {
                    info!(entity_id = b.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, blueprint_id = b.blueprint_id, loc_x = loc.x, loc_y = loc.y, "accept intent=Build");
                } else {
                    info!(entity_id = b.entity_id, intent_id = %format_uuid(&intent_id), player = %player_id, blueprint_id = b.blueprint_id, "accept intent=Build (missing location)");
                }
                pb::Intent {
                    kind: Some(pb::intent::Kind::Build(b)),
                }
            }
            None => {
                warn!(player_id = %player_id, "envelope missing payload");
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                    accept_tick,
                )
                .await?;
                return Err(anyhow!("envelope missing payload"));
            }
        };

        let policy_outcome = self
            .intents
            .apply_policy_before_enqueue(&payload_intent, metadata.policy);

        for (_, canceled_metadata) in policy_outcome.canceled.iter() {
            self.emit_lifecycle_event(
                canceled_metadata,
                pb::LifecycleState::Canceled,
                pb::LifecycleReason::Interrupted,
                self.state.tick,
            )
            .await?;
        }

        self.emit_lifecycle_event(
            &metadata,
            pb::LifecycleState::Accepted,
            pb::LifecycleReason::None,
            accept_tick,
        )
        .await?;

        if policy_outcome.blocked {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Blocked,
                pb::LifecycleReason::None,
                self.state.tick,
            )
            .await?;
        }

        self.intents.enqueue(QueuedIntent {
            intent: payload_intent,
            metadata,
        });

        Ok(())
    }

    async fn handle_legacy_intent(&mut self, intent: pb::Intent) -> Result<()> {
        let payload = match intent.kind.clone() {
            Some(pb::intent::Kind::Move(m)) => intent_envelope::Payload::Move(m),
            Some(pb::intent::Kind::Attack(a)) => intent_envelope::Payload::Attack(a),
            Some(pb::intent::Kind::Build(b)) => intent_envelope::Payload::Build(b),
            None => return Err(anyhow!("legacy intent missing kind")),
        };

        let legacy_client_cmd = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Attack(a)) => a.client_cmd_id.as_str(),
            Some(pb::intent::Kind::Build(b)) => b.client_cmd_id.as_str(),
            None => "",
        };

        let client_cmd_bytes = match Uuid::parse_str(legacy_client_cmd) {
            Ok(uuid) if uuid.get_version() == Some(Version::SortRand) => {
                uuid.into_bytes().to_vec()
            }
            Ok(uuid) => {
                warn!(
                    client_cmd_id = %uuid,
                    "legacy client_cmd_id not UUIDv7; generating replacement"
                );
                Uuid::now_v7().into_bytes().to_vec()
            }
            Err(_) => Uuid::now_v7().into_bytes().to_vec(),
        };

        let player_id = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => m.player_id.clone(),
            Some(pb::intent::Kind::Attack(a)) => a.player_id.clone(),
            Some(pb::intent::Kind::Build(b)) => b.player_id.clone(),
            None => String::new(),
        };

        let envelope = pb::IntentEnvelope {
            client_cmd_id: client_cmd_bytes,
            intent_id: Vec::new(),
            player_id: if player_id.is_empty() {
                "legacy".into()
            } else {
                player_id
            },
            client_seq: 0,
            server_tick: 0,
            protocol_version: ENGINE_PROTOCOL_MAJOR,
            policy: pb::IntentPolicy::ReplaceActive as i32,
            payload: Some(payload),
        };

        self.handle_envelope(envelope).await
    }

    async fn emit_lifecycle_event(
        &mut self,
        metadata: &IntentMetadata,
        state: pb::LifecycleState,
        reason: pb::LifecycleReason,
        tick: u64,
    ) -> Result<()> {
        if !self
            .lifecycle_emitted
            .insert((metadata.intent_id.clone(), state))
        {
            return Ok(());
        }
        self.emit_lifecycle_event_raw(
            &metadata.intent_id,
            &metadata.client_cmd_id,
            &metadata.player_id,
            state,
            reason,
            tick,
            metadata.protocol_version,
        )
        .await
    }

    async fn emit_lifecycle_event_raw(
        &mut self,
        intent_id: &[u8],
        client_cmd_id: &[u8],
        player_id: &str,
        state: pb::LifecycleState,
        reason: pb::LifecycleReason,
        tick: u64,
        protocol_version: u32,
    ) -> Result<()> {
        let event = pb::LifecycleEvent {
            intent_id: intent_id.to_vec(),
            client_cmd_id: client_cmd_id.to_vec(),
            player_id: player_id.to_string(),
            server_tick: tick,
            state: state as i32,
            reason: reason as i32,
            protocol_version,
        };
        self.redis
            .publish_lifecycle_event(&event)
            .await
            .context("publish lifecycle event")?;

        if let Some(telemetry) = self.telemetry.as_ref() {
            let intent_id_str = format_uuid(intent_id);
            let client_cmd_id_str = format_uuid(client_cmd_id);
            let state_str = state.as_str_name();
            let reason_str = reason.as_str_name();
            if let Err(err) = telemetry
                .publish_lifecycle_event(
                    &self.cfg.game_id,
                    player_id,
                    &intent_id_str,
                    &client_cmd_id_str,
                    state_str,
                    reason_str,
                    tick,
                    protocol_version,
                )
                .await
            {
                warn!(error = ?err, "failed to publish lifecycle telemetry");
            }
        }

        Ok(())
    }
}
