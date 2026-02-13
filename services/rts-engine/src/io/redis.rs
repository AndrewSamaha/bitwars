use prost::Message;
use redis::{AsyncCommands, Value as RedisValue};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use crate::engine::intent::{format_uuid, IntentMetadata};
use crate::engine::state::GameState;
use crate::pb::events_stream_record;
use crate::pb::{self, Delta, EventsStreamRecord, LifecycleEvent, Snapshot};

// ── M2: Per-entity tracking types ───────────────────────────────────────────
//
// These structs are serialised as JSON (not protobuf) because they are only
// read on the **reconnect path**, never on the hot tick loop.  Protobuf is
// preferred for anything on the tick-critical path (deltas, snapshots,
// lifecycle events) where decode speed and wire size matter.  For reconnect
// data that is written once per intent state-change and read once per
// reconnect, JSON keeps the code simple and the data human-readable in
// redis-cli / RedisInsight without a separate decode step.

/// Snapshot of a single entity's active intent, persisted to Redis so the
/// reconnect handshake can report what the server is currently executing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityActiveIntent {
    pub entity_id: u64,
    pub intent_id: String,
    pub client_cmd_id: String,
    pub player_id: String,
    pub started_tick: u64,
}

/// Everything the reconnect handshake needs for one player.
#[derive(Debug, Clone)]
pub struct PlayerTrackingState {
    pub last_processed_client_seq: u64,
    pub active_intents: Vec<EntityActiveIntent>,
}

/// Full tracking state for all players (used on engine restore).
#[derive(Debug, Clone, Default)]
pub struct AllTrackingState {
    /// player_id → last_processed_client_seq
    pub player_seqs: Vec<(String, u64)>,
    /// All active intents across all entities
    pub active_intents: Vec<EntityActiveIntent>,
}

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

    /// M2: Hash holding per-player last-processed client_seq.
    fn player_seq_key(&self) -> String {
        format!("rts:match:{}:player_seq", self.game_id)
    }

    /// M2: Hash holding per-entity active-intent JSON blobs.
    fn active_intents_key(&self) -> String {
        format!("rts:match:{}:active_intents", self.game_id)
    }

    /// M4: Key holding the content hash (xxh3 hex string).
    fn content_version_key(&self) -> String {
        format!("rts:match:{}:content_version", self.game_id)
    }

    /// M6: List of player_ids to spawn (backend RPUSHes, engine LPOPs).
    fn pending_joins_key(&self) -> String {
        format!("rts:match:{}:pending_joins", self.game_id)
    }

    /// M6: Set of player_ids for which backend has already enqueued a join (avoid duplicate push).
    fn join_requested_key(&self) -> String {
        format!("rts:match:{}:join_requested", self.game_id)
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
    /// Returns a Vec of (stream_entry_id, payload_bytes) pairs so the caller can
    /// advance the cursor entry-by-entry (needed for tick-bounded ingress in M1).
    pub async fn read_new_intents(
        &mut self,
        last_id: &str,
        count: usize,
    ) -> anyhow::Result<Option<Vec<(String, Vec<u8>)>>> {
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
                        let mut out: Vec<(String, Vec<u8>)> = Vec::new();
                        for item in items.iter() {
                            if let RedisValue::Bulk(parts) = item {
                                if parts.len() >= 2 {
                                    let entry_id = if let RedisValue::Data(id_bytes) = &parts[0] {
                                        String::from_utf8(id_bytes.clone()).unwrap_or_default()
                                    } else {
                                        continue;
                                    };
                                    if let RedisValue::Bulk(fieldvals) = &parts[1] {
                                        let mut i = 0;
                                        while i + 1 < fieldvals.len() {
                                            let field = &fieldvals[i];
                                            let value = &fieldvals[i + 1];
                                            if let RedisValue::Data(field_name) = field {
                                                if field_name == b"data" {
                                                    if let RedisValue::Data(payload) = value {
                                                        out.push((entry_id.clone(), payload.clone()));
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
                        return Ok(Some(out));
                    }
                }
            }
            _ => {}
        }
        Ok(None)
    }

    /// Delete all Redis keys/streams associated with this game.
    /// Used on startup when RESTORE_GAMESTATE_ON_RESTART is false (clean slate).
    pub async fn flush_game_streams(&mut self) -> anyhow::Result<()> {
        let keys = vec![
            self.intents_stream(),
            self.events_stream(),
            self.snapshots_stream(),
            self.snapshot_key(),
            self.snapshot_meta_key(),
            self.player_seq_key(),
            self.active_intents_key(),
            self.pending_joins_key(),
            self.join_requested_key(),
        ];
        info!(game_id = %self.game_id, keys = ?keys, "flushing game streams (clean start)");
        for key in &keys {
            let _: () = redis::cmd("DEL")
                .arg(key)
                .query_async(&mut self.conn)
                .await?;
        }

        // Also flush dedupe keys for this game (pattern: rts:match:<game_id>:dedupe:*)
        let pattern = format!("rts:match:{}:dedupe:*", self.game_id);
        let dedupe_keys: Vec<String> = redis::cmd("KEYS")
            .arg(&pattern)
            .query_async(&mut self.conn)
            .await
            .unwrap_or_default();
        if !dedupe_keys.is_empty() {
            info!(count = dedupe_keys.len(), "flushing dedupe keys");
            for key in &dedupe_keys {
                let _: () = redis::cmd("DEL")
                    .arg(key)
                    .query_async(&mut self.conn)
                    .await?;
            }
        }
        Ok(())
    }

    /// Read the latest snapshot and its boundary stream ID from Redis.
    /// Returns (GameState, boundary_stream_id) or None if no snapshot exists.
    pub async fn read_latest_snapshot(&mut self) -> anyhow::Result<Option<(GameState, String)>> {
        let snap_key = self.snapshot_key();
        let meta_key = self.snapshot_meta_key();

        let snap_bytes: Option<Vec<u8>> = self.conn.get(&snap_key).await?;
        let snap_bytes = match snap_bytes {
            Some(b) if !b.is_empty() => b,
            _ => {
                warn!(game_id = %self.game_id, "no snapshot found in Redis");
                return Ok(None);
            }
        };

        let snapshot = Snapshot::decode(snap_bytes.as_slice())
            .map_err(|e| anyhow::anyhow!("failed to decode snapshot: {}", e))?;

        // Read boundary_stream_id from metadata hash
        let boundary: String = redis::cmd("HGET")
            .arg(&meta_key)
            .arg("boundary_stream_id")
            .query_async(&mut self.conn)
            .await
            .unwrap_or_else(|_| "0-0".to_string());

        let state = GameState {
            tick: snapshot.tick as u64,
            entities: snapshot.entities,
        };

        info!(
            game_id = %self.game_id,
            tick = state.tick,
            entities = state.entities.len(),
            boundary = %boundary,
            "restored snapshot from Redis"
        );

        Ok(Some((state, boundary)))
    }

    /// Read new entries from the events stream, blocking up to `block_ms` if no data.
    /// Returns (new_last_id, decoded EventsStreamRecords). Skips entries that fail to decode.
    pub async fn read_events_blocking(
        &mut self,
        last_id: &str,
        block_ms: u64,
    ) -> anyhow::Result<Option<(String, Vec<EventsStreamRecord>)>> {
        let stream = self.events_stream();
        let reply: RedisValue = redis::cmd("XREAD")
            .arg("BLOCK")
            .arg(block_ms as i64)
            .arg("STREAMS")
            .arg(&stream)
            .arg(last_id)
            .query_async(&mut self.conn)
            .await?;

        match reply {
            RedisValue::Nil => return Ok(None),
            RedisValue::Bulk(ref top) => {
                if top.is_empty() {
                    return Ok(None);
                }
                if let Some(RedisValue::Bulk(stream_entry)) = top.get(0) {
                    if let [RedisValue::Data(_name), RedisValue::Bulk(items)] = &stream_entry[..] {
                        let mut out: Vec<EventsStreamRecord> = Vec::new();
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
                                                        if let Ok(record) =
                                                            EventsStreamRecord::decode(payload.as_slice())
                                                        {
                                                            out.push(record);
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

    // ── M2: Per-entity last-processed tracking ─────────────────────────────
    //
    // Written as JSON (see module-level comment on serialisation strategy).
    // Writes happen on the intent hot path (2 HSET per accept, 1 HDEL per
    // finish/cancel) so they are kept minimal—single-field HSET / HDEL.
    // Reads happen only on reconnect or engine restore.

    /// Persist the last successfully-processed `client_seq` for a player.
    pub async fn persist_player_seq(
        &mut self,
        player_id: &str,
        seq: u64,
    ) -> anyhow::Result<()> {
        let key = self.player_seq_key();
        let _: () = redis::cmd("HSET")
            .arg(&key)
            .arg(player_id)
            .arg(seq)
            .query_async(&mut self.conn)
            .await?;
        Ok(())
    }

    /// Record the active intent for an entity.  Written on intent activation;
    /// cleared by `clear_active_intent` on finish / cancel.
    pub async fn persist_active_intent(
        &mut self,
        entity_id: u64,
        metadata: &IntentMetadata,
        ttl_secs: u64,
    ) -> anyhow::Result<()> {
        let entry = EntityActiveIntent {
            entity_id,
            intent_id: format_uuid(&metadata.intent_id),
            client_cmd_id: format_uuid(&metadata.client_cmd_id),
            player_id: metadata.player_id.clone(),
            started_tick: metadata.server_tick,
        };
        let json = serde_json::to_string(&entry)?;
        let key = self.active_intents_key();
        let field = entity_id.to_string();
        let _: () = redis::cmd("HSET")
            .arg(&key)
            .arg(&field)
            .arg(&json)
            .query_async(&mut self.conn)
            .await?;

        // Refresh the TTL on the whole hash each time we write, so the safety
        // net stays well ahead of the most recent activity.
        let ttl: i64 = ttl_secs.try_into().unwrap_or(i64::MAX);
        let _: () = self.conn.expire(&key, ttl).await?;
        Ok(())
    }

    /// Remove the active-intent entry for an entity (on FINISHED / CANCELED).
    pub async fn clear_active_intent(&mut self, entity_id: u64) -> anyhow::Result<()> {
        let key = self.active_intents_key();
        let field = entity_id.to_string();
        let _: () = redis::cmd("HDEL")
            .arg(&key)
            .arg(&field)
            .query_async(&mut self.conn)
            .await?;
        Ok(())
    }

    /// Read tracking state for a specific player (reconnect handshake).
    pub async fn read_tracking_for_player(
        &mut self,
        player_id: &str,
    ) -> anyhow::Result<PlayerTrackingState> {
        let seq_key = self.player_seq_key();
        let seq_val: Option<u64> = redis::cmd("HGET")
            .arg(&seq_key)
            .arg(player_id)
            .query_async(&mut self.conn)
            .await
            .unwrap_or(None);

        let active_key = self.active_intents_key();
        let all_fields: Vec<(String, String)> = redis::cmd("HGETALL")
            .arg(&active_key)
            .query_async(&mut self.conn)
            .await
            .unwrap_or_default();

        let mut active_intents = Vec::new();
        for (_field, json) in all_fields {
            if let Ok(entry) = serde_json::from_str::<EntityActiveIntent>(&json) {
                if entry.player_id == player_id {
                    active_intents.push(entry);
                }
            }
        }

        Ok(PlayerTrackingState {
            last_processed_client_seq: seq_val.unwrap_or(0),
            active_intents,
        })
    }

    /// Read full tracking state for all players (engine restore on startup).
    pub async fn read_all_tracking(&mut self) -> anyhow::Result<AllTrackingState> {
        let seq_key = self.player_seq_key();
        let seq_fields: Vec<(String, u64)> = redis::cmd("HGETALL")
            .arg(&seq_key)
            .query_async(&mut self.conn)
            .await
            .unwrap_or_default();

        let active_key = self.active_intents_key();
        let active_fields: Vec<(String, String)> = redis::cmd("HGETALL")
            .arg(&active_key)
            .query_async(&mut self.conn)
            .await
            .unwrap_or_default();

        let mut active_intents = Vec::new();
        for (_field, json) in active_fields {
            match serde_json::from_str::<EntityActiveIntent>(&json) {
                Ok(entry) => active_intents.push(entry),
                Err(e) => warn!(error = %e, "skipping malformed active_intent entry"),
            }
        }

        Ok(AllTrackingState {
            player_seqs: seq_fields,
            active_intents,
        })
    }

    // ── M4: Content version ────────────────────────────────────────────────

    /// Publish the content hash so the reconnect handshake and content
    /// endpoint can verify client-server content alignment.
    pub async fn publish_content_version(&mut self, hash: &str) -> anyhow::Result<()> {
        let key = self.content_version_key();
        self.conn.set::<_, _, ()>(&key, hash).await?;
        info!(key = %key, hash = %hash, "published content_version to Redis");
        Ok(())
    }

    /// M4: Key holding the full content definitions as canonical JSON.
    fn content_defs_key(&self) -> String {
        format!("rts:match:{}:content_defs", self.game_id)
    }

    /// Publish the full entity type definitions as canonical JSON so the
    /// `/api/v2/content` endpoint can serve them to clients.
    pub async fn publish_content_defs(&mut self, json: &str) -> anyhow::Result<()> {
        let key = self.content_defs_key();
        self.conn.set::<_, _, ()>(&key, json).await?;
        info!(key = %key, bytes = json.len(), "published content_defs to Redis");
        Ok(())
    }

    /// Read the content hash (returns empty string if not set).
    pub async fn read_content_version(&mut self) -> anyhow::Result<String> {
        let key = self.content_version_key();
        let val: Option<String> = self.conn.get(&key).await?;
        Ok(val.unwrap_or_default())
    }

    // ── M6: Spawn on join ───────────────────────────────────────────────────

    /// Pop the next pending player_id from the join queue (LPOP). Returns None when list is empty.
    pub async fn pop_next_pending_join(&mut self) -> anyhow::Result<Option<String>> {
        let key = self.pending_joins_key();
        let val: Option<String> = self.conn.lpop(&key, None).await?;
        Ok(val)
    }
}
