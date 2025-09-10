// services/rts-engine/examples/read_snapshot.rs
// Reads the latest snapshot and snapshot_meta from Redis and decodes using prost

use std::env;

use prost::Message;
use redis::AsyncCommands;

use rts_engine::io::env as io_env;
use rts_engine::pb::Snapshot;

fn get_env(name: &str, fallback: &str) -> String {
    env::var(name).ok().filter(|s| !s.is_empty()).unwrap_or_else(|| fallback.to_string())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    io_env::load_env();

    let game_id = get_env("GAME_ID", "demo-001");
    let redis_url = get_env("GAMESTATE_REDIS_URL", "redis://127.0.0.1:6379");

    let client = redis::Client::open(redis_url.clone())?;
    let mut conn = client.get_multiplexed_async_connection().await?;

    let snap_key = format!("snapshot:{}", game_id);
    let meta_key = format!("snapshot_meta:{}", game_id);

    // Read snapshot as raw bytes
    let snapshot_bytes: Option<Vec<u8>> = redis::cmd("GET")
        .arg(&snap_key)
        .query_async(&mut conn)
        .await?;

    if let Some(bytes) = snapshot_bytes {
        println!("snapshot: {} bytes", bytes.len());
        match Snapshot::decode(bytes.as_slice()) {
            Ok(snap) => {
                println!("decoded snapshot: tick={} entities={}", snap.tick, snap.entities.len());
                // print a couple of entities for sanity
                for e in snap.entities.iter().take(2) {
                    println!("  entity id={} pos={:?} vel={:?} force={:?}", e.id, e.pos, e.vel, e.force);
                }
            }
            Err(e) => {
                eprintln!("failed to decode snapshot: {e}");
            }
        }
    } else {
        println!("no snapshot found at key {snap_key}");
    }

    // Read meta
    let meta: redis::RedisResult<redis::Value> = redis::cmd("HGETALL").arg(&meta_key).query_async(&mut conn).await;
    match meta {
        Ok(val) => {
            let map: redis::Value = val;
            println!("snapshot_meta: {:?}", map);
        }
        Err(e) => eprintln!("failed to fetch snapshot_meta: {e}"),
    }

    Ok(())
}
