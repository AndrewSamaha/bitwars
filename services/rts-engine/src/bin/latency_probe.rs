// Latency probe CLI: send 100 Move intents, measure submit → first lifecycle event (RECEIVED/ACCEPTED),
// report p50/p95 and write JSON to ./.metrics/m0.1/
//
// We use two Redis connections: a reader blocks on XREAD "$" *before* we publish, so we don't miss
// lifecycle events that the engine emits while we're still publishing.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::Result;
use tokio::sync::{oneshot, Mutex};
use rts_engine::engine::ENGINE_PROTOCOL_MAJOR;
use rts_engine::io::env as io_env;
use rts_engine::io::redis::RedisClient;
use rts_engine::pb::events_stream_record::Record;
use rts_engine::pb::{intent_envelope, IntentEnvelope, LifecycleEvent, LifecycleState};
use rts_engine::pb::{MoveToLocationIntent, Vec2};
use uuid::Uuid;

const NUM_INTENTS: usize = 100;
const BLOCK_MS: u64 = 2000;
const DEFAULT_TIMEOUT_SECS: u64 = 30;

fn get_env(name: &str, fallback: &str) -> String {
    std::env::var(name)
        .ok()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

#[derive(serde::Serialize)]
struct LatencyMetrics {
    run_ts_iso8601: String,
    game_id: String,
    num_sent: usize,
    num_measured: usize,
    timeout_secs: u64,
    p50_ms: f64,
    p95_ms: f64,
    min_ms: f64,
    max_ms: f64,
    latencies_ms: Vec<f64>,
}

fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let idx = (p / 100.0 * (sorted.len() as f64 - 1.0)).max(0.0) as usize;
    sorted[idx.min(sorted.len() - 1)]
}

#[tokio::main]
async fn main() -> Result<()> {
    io_env::load_env();

    let args: Vec<String> = std::env::args().collect();
    // Skip leading "--" (e.g. from pnpm run latency:probe -- testgameid 1 30)
    let pos_args: Vec<&str> = args.iter().skip(1).map(String::as_str).filter(|s| *s != "--").collect();
    if pos_args.is_empty() {
        eprintln!(
            "Usage: {} <game_id> [entity_id] [timeout_secs]\n  entity_id defaults to 1, timeout_secs to {}",
            args[0], DEFAULT_TIMEOUT_SECS
        );
        eprintln!("Requires: engine running and consuming rts:match:<game_id>:intents, publishing to rts:match:<game_id>:events");
        eprintln!("Env: GAMESTATE_REDIS_URL (default redis://127.0.0.1:6379)");
        std::process::exit(1);
    }

    let game_id = pos_args[0].to_string();
    let entity_id: u64 = pos_args.get(1).and_then(|s| s.parse().ok()).unwrap_or(1);
    let timeout_secs: u64 = pos_args.get(2).and_then(|s| s.parse().ok()).unwrap_or(DEFAULT_TIMEOUT_SECS);
    let redis_url = get_env("GAMESTATE_REDIS_URL", "redis://127.0.0.1:6379");

    // Two connections: one for publishing, one for reading (reader must be blocking on XREAD before we publish)
    let mut client_pub = RedisClient::connect(&redis_url, game_id.clone()).await?;
    let client_sub = RedisClient::connect(&redis_url, game_id.clone()).await?;

    let submit_times: Arc<Mutex<HashMap<Vec<u8>, Instant>>> = Arc::new(Mutex::new(HashMap::with_capacity(NUM_INTENTS)));
    let latencies: Arc<Mutex<Vec<Duration>>> = Arc::new(Mutex::new(Vec::with_capacity(NUM_INTENTS)));
    let deadline = Instant::now() + Duration::from_secs(timeout_secs);
    let player_id = "latency-probe".to_string();

    let (ready_tx, ready_rx) = oneshot::channel::<()>();

    // Spawn reader first: block on XREAD "$" so we're listening before any lifecycle events arrive
    let reader_submit_times = submit_times.clone();
    let reader_latencies = latencies.clone();
    let reader_deadline = deadline;
    let reader_handle = tokio::spawn(async move {
        let mut last_id = "$".to_string();
        let mut reader = client_sub;
        let _ = ready_tx.send(()); // signal we're about to block on XREAD
        while reader_latencies.lock().await.len() < NUM_INTENTS && Instant::now() < reader_deadline {
            let block_ms = (reader_deadline - Instant::now()).as_millis().min(BLOCK_MS as u128) as u64;
            let block_ms = block_ms.max(100);
            match reader.read_events_blocking(&last_id, block_ms).await {
                Ok(Some((new_id, records))) => {
                    last_id = new_id;
                    let now = Instant::now();
                    for record in records {
                        if let Some(Record::Lifecycle(LifecycleEvent { client_cmd_id, state, .. })) = record.record {
                            let is_received_or_accepted = state == LifecycleState::Received as i32
                                || state == LifecycleState::Accepted as i32;
                            if !is_received_or_accepted {
                                continue;
                            }
                            let mut st = reader_submit_times.lock().await;
                            if let Some(submit_at) = st.remove(&client_cmd_id) {
                                drop(st);
                                reader_latencies.lock().await.push(now.duration_since(submit_at));
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    });

    // Wait until reader is blocking on XREAD "$" so we don't miss lifecycle events
    let _ = ready_rx.await;

    // Publish 100 Move intents, recording submit time per client_cmd_id (reader is already blocking on events).
    // Space out publishes by 1ms so UUIDv7 client_cmd_ids differ (engine dedupes by client_cmd_id).
    println!("Publishing {} Move intents (entity_id={})...", NUM_INTENTS, entity_id);
    for seq in 1..=NUM_INTENTS {
        let client_cmd_id = Uuid::now_v7().into_bytes().to_vec();
        let submit_at = Instant::now();
        submit_times.lock().await.insert(client_cmd_id.clone(), submit_at);

        let move_intent = MoveToLocationIntent {
            entity_id,
            target: Some(Vec2 { x: 1.0, y: 1.0 }),
            client_cmd_id: String::new(),
            player_id: String::new(),
        };
        let envelope = IntentEnvelope {
            client_cmd_id: client_cmd_id.clone(),
            intent_id: vec![], // server assigns
            player_id: player_id.clone(),
            client_seq: seq as u64,
            server_tick: 0,
            protocol_version: ENGINE_PROTOCOL_MAJOR,
            policy: rts_engine::pb::IntentPolicy::ReplaceActive as i32,
            payload: Some(intent_envelope::Payload::Move(move_intent)),
        };

        client_pub.publish_intent_envelope(&envelope).await?;
        tokio::time::sleep(Duration::from_millis(1)).await; // avoid duplicate UUIDv7 in same ms
    }

    // Wait for reader to collect 100 latencies or hit deadline
    while latencies.lock().await.len() < NUM_INTENTS && Instant::now() < deadline {
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    let _ = reader_handle.await; // let reader task finish

    let latencies_vec: Vec<Duration> = latencies.lock().await.clone();
    let num_measured = latencies_vec.len();
    let num_timed_out = NUM_INTENTS - num_measured;
    if num_timed_out > 0 {
        eprintln!("Warning: {} intents did not receive RECEIVED/ACCEPTED within {}s", num_timed_out, timeout_secs);
    }

    let mut sorted_ms: Vec<f64> = latencies_vec.iter().map(|d| d.as_secs_f64() * 1000.0).collect();
    sorted_ms.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let p50_ms = percentile(&sorted_ms, 50.0);
    let p95_ms = percentile(&sorted_ms, 95.0);
    let min_ms = sorted_ms.first().copied().unwrap_or(0.0);
    let max_ms = sorted_ms.last().copied().unwrap_or(0.0);

    // Write JSON to ./.metrics/m0.1/
    let metrics_dir = ".metrics/m0.1";
    std::fs::create_dir_all(metrics_dir)?;
    let run_ts = chrono::Utc::now();
    let filename = format!("{}/latency_probe_{}.json", metrics_dir, run_ts.format("%Y%m%d_%H%M%S"));
    let metrics = LatencyMetrics {
        run_ts_iso8601: run_ts.to_rfc3339(),
        game_id: game_id.clone(),
        num_sent: NUM_INTENTS,
        num_measured,
        timeout_secs,
        p50_ms,
        p95_ms,
        min_ms,
        max_ms,
        latencies_ms: sorted_ms.clone(),
    };
    let json = serde_json::to_string_pretty(&metrics)?;
    std::fs::write(&filename, json)?;
    println!("Wrote {}", filename);

    // Console summary
    println!("\nLatency (submit → first RECEIVED/ACCEPTED):");
    println!("  n = {} ({} timed out)", num_measured, num_timed_out);
    println!("  p50 = {:.2} ms", p50_ms);
    println!("  p95 = {:.2} ms", p95_ms);
    println!("  min = {:.2} ms  max = {:.2} ms", min_ms, max_ms);

    Ok(())
}
