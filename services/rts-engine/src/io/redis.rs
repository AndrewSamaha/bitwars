use prost::Message;
use redis::{AsyncCommands, Value as RedisValue};
use tracing::info;

use crate::engine::state::GameState;
use crate::pb::events_stream_record;
use crate::pb::{self, Delta, EventsStreamRecord, LifecycleEvent, Snapshot};

pub struct RedisClient {
    pub game_id: String,
    conn: redis::aio::MultiplexedConnection,
}

impl RedisClient {
    fn intents_stream(&self) -> String {
        format!("rts:match:{}:intents", self.game_id)
    }

    fn events_stream(&self) -> String {
        format!("rts:match:{}:events", self.game_id)
    }

    fn snapshots_stream(&self) -> String {
        format!("rts:match:{}:snapshots", self.game_id)
    }

    fn dedupe_key(&self, player_id: &str, client_cmd_id: &[u8]) -> String {
        format!(
            "rts:match:{}:dedupe:{}:{}",
            self.game_id,
            player_id,
            hex::encode(client_cmd_id)
        )
    }

    fn snapshot_key(&self) -> String {
        format!("snapshot:{}", self.game_id)
    }

    fn snapshot_meta_key(&self) -> String {
        format!("snapshot_meta:{}", self.game_id)
    }

    pub async fn connect(url: &str, game_id: String) -> anyhow::Result<Self> {
        let client = redis::Client::open(url.to_string())?;
        let conn = client.get_multiplexed_async_connection().await?;
        info!("Connected to Redis at {}", url);
        Ok(Self { game_id, conn })
    }

    pub async fn publish_delta(&mut self, delta: &Delta) -> anyhow::Result<String> {
        let record = EventsStreamRecord {
            record: Some(events_stream_record::Record::Delta(delta.clone())),
        };
        self.publish_event_record(&record).await
    }

    pub async fn publish_lifecycle_event(
        &mut self,
        event: &LifecycleEvent,
    ) -> anyhow::Result<String> {
        let record = EventsStreamRecord {
            record: Some(events_stream_record::Record::Lifecycle(event.clone())),
        };
        self.publish_event_record(&record).await
    }

    pub async fn publish_event_record(
        &mut self,
        record: &EventsStreamRecord,
    ) -> anyhow::Result<String> {
        let bytes = record.encode_to_vec();
        let stream = self.events_stream();
        let id: String = redis::cmd("XADD")
            .arg(&stream)
            .arg("MAXLEN")
            .arg("~")
            .arg(10_000)
            .arg("*")
            .arg("data")
            .arg(bytes)
            .query_async(&mut self.conn)
            .await?;
        Ok(id)
    }

    pub async fn publish_snapshot(
        &mut self,
        state: &GameState,
        boundary_stream_id: &str,
    ) -> anyhow::Result<()> {
        let snap = Snapshot {
            tick: state.tick as i64,
            entities: state.entities.clone(),
        };
        let bytes = snap.encode_to_vec();

        let snap_key = self.snapshot_key();
        let meta_key = self.snapshot_meta_key();

        let _: () = self.conn.set(&snap_key, bytes.clone()).await?;
        let now_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64;

        let _: () = redis::cmd("HSET")
            .arg(&meta_key)
            .arg("tick")
            .arg(state.tick as i64)
            .arg("boundary_stream_id")
            .arg(boundary_stream_id)
            .arg("updated_at_ms")
            .arg(now_ms)
            .query_async(&mut self.conn)
            .await?;

        info!(
            "SET {} (tick={}), HSET {} boundary_stream_id={}",
            snap_key, state.tick, meta_key, boundary_stream_id
        );

        let stream = self.snapshots_stream();
        let stream_id: String = redis::cmd("XADD")
            .arg(&stream)
            .arg("MAXLEN")
            .arg("~")
            .arg(10_000)
            .arg("*")
            .arg("data")
            .arg(bytes)
            .query_async(&mut self.conn)
            .await?;

        info!(
            stream = %stream,
            stream_id = %stream_id,
            tick = state.tick,
            "XADD snapshot"
        );
        Ok(())
    }

    pub async fn publish_intent_envelope(
        &mut self,
        envelope: &pb::IntentEnvelope,
    ) -> anyhow::Result<String> {
        let bytes = envelope.encode_to_vec();
        let stream = self.intents_stream();
        let id: String = redis::cmd("XADD")
            .arg(&stream)
            .arg("MAXLEN")
            .arg("~")
            .arg(10_000)
            .arg("*")
            .arg("data")
            .arg(bytes)
            .query_async(&mut self.conn)
            .await?;
        Ok(id)
    }

    pub async fn existing_intent_for_cmd(
        &mut self,
        player_id: &str,
        client_cmd_id: &[u8],
    ) -> anyhow::Result<Option<Vec<u8>>> {
        let key = self.dedupe_key(player_id, client_cmd_id);
        let existing: Option<String> = self.conn.get(&key).await?;
        if let Some(existing_val) = existing {
            if let Ok(bytes) = hex::decode(existing_val) {
                return Ok(Some(bytes));
            }
        }
        Ok(None)
    }

    pub async fn store_client_cmd(
        &mut self,
        player_id: &str,
        client_cmd_id: &[u8],
        intent_id: &[u8],
        ttl_secs: usize,
    ) -> anyhow::Result<()> {
        let key = self.dedupe_key(player_id, client_cmd_id);
        let value = hex::encode(intent_id);
        let _: () = self.conn.set(&key, value).await?;
        let ttl: i64 = ttl_secs.try_into().unwrap_or(i64::MAX);
        let _: () = self.conn.expire(&key, ttl).await?;
        Ok(())
    }

    /// Read new intent entries from the intents stream without blocking the caller.
    /// Returns (last_id, payloads) where last_id is the id of the last entry read, and payloads are raw bytes of 'data' fields.
    pub async fn read_new_intents(
        &mut self,
        last_id: &str,
        count: usize,
    ) -> anyhow::Result<Option<(String, Vec<Vec<u8>>)>> {
        let stream = self.intents_stream();
        let mut cmd = redis::cmd("XREAD");
        if count > 0 {
            cmd.arg("COUNT").arg(count as i64);
        }
        cmd.arg("STREAMS").arg(&stream).arg(last_id);
        let reply: RedisValue = cmd.query_async(&mut self.conn).await?;

        // Expected reply shape from redis-rs for XREAD:
        // Bulk([
        //   Bulk([
        //     Data(stream_name),
        //     Bulk([
        //       Bulk([ Data(id), Bulk([ Data(field), Data(value), ... ]) ]),
        //       ...
        //     ])
        //   ])
        // ])
        match reply {
            RedisValue::Nil => return Ok(None),
            RedisValue::Bulk(ref top) => {
                if top.is_empty() {
                    return Ok(None);
                }
                if let Some(RedisValue::Bulk(stream_entry)) = top.get(0) {
                    if let [RedisValue::Data(_name), RedisValue::Bulk(items)] = &stream_entry[..] {
                        let mut out: Vec<Vec<u8>> = Vec::new();
                        let mut new_last_id = String::from(last_id);
                        for item in items.iter() {
                            if let RedisValue::Bulk(parts) = item {
                                if parts.len() >= 2 {
                                    if let RedisValue::Data(id_bytes) = &parts[0] {
                                        if let Ok(id_str) = String::from_utf8(id_bytes.clone()) {
                                            new_last_id = id_str;
                                        }
                                    }
                                    if let RedisValue::Bulk(fieldvals) = &parts[1] {
                                        let mut i = 0;
                                        while i + 1 < fieldvals.len() {
                                            let field = &fieldvals[i];
                                            let value = &fieldvals[i + 1];
                                            if let RedisValue::Data(field_name) = field {
                                                if field_name == b"data" {
                                                    if let RedisValue::Data(payload) = value {
                                                        out.push(payload.clone());
                                                    }
                                                }
                                            }
                                            i += 2;
                                        }
                                    }
                                }
                            }
                        }
                        if out.is_empty() {
                            return Ok(None);
                        }
                        return Ok(Some((new_last_id, out)));
                    }
                }
            }
            _ => {}
        }
        Ok(None)
    }
}
