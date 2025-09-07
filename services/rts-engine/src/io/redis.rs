use prost::Message;
use redis::AsyncCommands;
use tracing::info;

use crate::engine::state::GameState;
use crate::pb::{Delta, Snapshot};

pub struct RedisClient {
    pub game_id: String,
    conn: redis::aio::MultiplexedConnection,
}

impl RedisClient {
    pub async fn connect(url: &str, game_id: String) -> anyhow::Result<Self> {
        let client = redis::Client::open(url.to_string())?;
        let conn = client.get_multiplexed_async_connection().await?;
        info!("Connected to Redis at {}", url);
        Ok(Self { game_id, conn })
    }

    pub async fn publish_delta(&mut self, delta: &Delta) -> anyhow::Result<String> {
        let bytes = delta.encode_to_vec();
        let stream = format!("deltas:{}", self.game_id);
        let id: String = redis::cmd("XADD")
            .arg(&stream).arg("MAXLEN").arg("~").arg(10_000)
            .arg("*").arg("data").arg(bytes)
            .query_async(&mut self.conn).await?;
        info!("XADD {} id={} (tick={}, updates={})", stream, id, delta.tick, delta.updates.len());
        Ok(id)
    }

    pub async fn publish_snapshot(&mut self, state: &GameState, boundary_stream_id: &str) -> anyhow::Result<()> {
        let snap = Snapshot { tick: state.tick as i64, entities: state.entities.clone() };
        let bytes = snap.encode_to_vec();

        let snap_key = format!("snapshot:{}", self.game_id);
        let meta_key = format!("snapshot_meta:{}", self.game_id);

        let _: () = self.conn.set(&snap_key, bytes).await?;
        let now_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;

        let _: () = redis::cmd("HSET")
            .arg(&meta_key)
            .arg("tick").arg(state.tick as i64)
            .arg("boundary_stream_id").arg(boundary_stream_id)
            .arg("updated_at_ms").arg(now_ms)
            .query_async(&mut self.conn).await?;

        info!("SET {} (tick={}), HSET {} boundary_stream_id={}", snap_key, state.tick, meta_key, boundary_stream_id);
        Ok(())
    }
}
