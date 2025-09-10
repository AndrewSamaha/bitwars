// services/rts-engine/examples/read_deltas.rs
// Reads recent entries from the Redis delta stream and decodes using prost

use std::env;

use prost::Message;

use rts_engine::io::env as io_env;
use rts_engine::pb::Delta;

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

    let stream = format!("deltas:{}", game_id);

    // XRANGE latest N by doing XRANGE key - + COUNT N then take the last N
    let count: isize = 10;
    let res: redis::Value = redis::cmd("XRANGE")
        .arg(&stream)
        .arg("-")
        .arg("+")
        .arg("COUNT")
        .arg(count)
        .query_async(&mut conn)
        .await?;

    println!("stream {} entries (up to {}):", stream, count);

    // Parse response: [[id, [field, value, ...]], ...]
    if let redis::Value::Bulk(entries) = res {
        for entry in entries {
            if let redis::Value::Bulk(pair) = entry {
                if pair.len() != 2 { continue; }
                let id = match &pair[0] { redis::Value::Data(b) => String::from_utf8_lossy(b).to_string(), _ => continue };
                let mut data_bytes: Option<&[u8]> = None;
                if let redis::Value::Bulk(fields) = &pair[1] {
                    let mut i = 0;
                    while i + 1 < fields.len() {
                        let f = &fields[i];
                        let v = &fields[i + 1];
                        if let redis::Value::Data(name) = f {
                            if name == b"data" {
                                if let redis::Value::Data(b) = v { data_bytes = Some(b); }
                                break;
                            }
                        }
                        i += 2;
                    }
                }
                if let Some(b) = data_bytes {
                    match Delta::decode(b) {
                        Ok(d) => {
                            println!("  id={} tick={} updates={}", id, d.tick, d.updates.len());
                        }
                        Err(e) => {
                            eprintln!("  id={} failed to decode delta: {e}", id);
                        }
                    }
                } else {
                    println!("  id={} (no data field)", id);
                }
            }
        }
    } else {
        println!("no entries or unexpected response for XRANGE {}", stream);
    }

    Ok(())
}
