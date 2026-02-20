// services/rts-engine/src/bin/redis_to_files.rs
// Generic tool that reads gamestate from Redis at two points in time and outputs them to files
// for ingestion by the offline replay engine

use anyhow::Result;
use prost::Message;
use redis::AsyncCommands;
use std::env;
use std::fs;
use std::io::Write;
use std::time::{SystemTime, UNIX_EPOCH};

use rts_engine::io::env as io_env;
use rts_engine::pb::{events_stream_record::Record, Delta, EventsStreamRecord, Snapshot};

#[derive(Debug)]
struct TimePoint {
    timestamp_ms: i64,
    snapshot: Option<Snapshot>,
    deltas: Vec<Delta>,
    intents: Vec<Vec<u8>>,
}

fn get_env(name: &str, fallback: &str) -> String {
    env::var(name)
        .ok()
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

fn parse_timestamp(timestamp_str: &str) -> Result<i64> {
    // Try parsing as Unix timestamp (seconds)
    if let Ok(ts) = timestamp_str.parse::<i64>() {
        return Ok(ts * 1000); // Convert to milliseconds
    }

    // Try parsing as Unix timestamp (milliseconds)
    if let Ok(ts) = timestamp_str.parse::<i64>() {
        return Ok(ts);
    }

    // Try parsing as "now" or "current"
    if timestamp_str == "now" || timestamp_str == "current" {
        return Ok(SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64);
    }

    Err(anyhow::anyhow!(
        "Invalid timestamp format: {}. Use Unix timestamp (seconds or ms), 'now', or 'current'",
        timestamp_str
    ))
}

async fn read_snapshot_at_time(
    conn: &mut redis::aio::MultiplexedConnection,
    game_id: &str,
    timestamp_ms: i64,
) -> Result<Option<Snapshot>> {
    let snap_key = format!("snapshot:{}", game_id);
    let meta_key = format!("snapshot_meta:{}", game_id);

    // Read snapshot metadata to check if it's recent enough
    let meta: redis::RedisResult<redis::Value> =
        redis::cmd("HGETALL").arg(&meta_key).query_async(conn).await;

    if let Ok(redis::Value::Bulk(meta_fields)) = meta {
        let mut _snapshot_tick: Option<i64> = None;
        let mut updated_at_ms: Option<i64> = None;

        // Parse metadata fields
        let mut i = 0;
        while i + 1 < meta_fields.len() {
            if let (redis::Value::Data(key), redis::Value::Data(value)) =
                (&meta_fields[i], &meta_fields[i + 1])
            {
                match key.as_slice() {
                    b"tick" => {
                        if let Ok(tick) = String::from_utf8_lossy(value).parse::<i64>() {
                            _snapshot_tick = Some(tick);
                        }
                    }
                    b"updated_at_ms" => {
                        if let Ok(ms) = String::from_utf8_lossy(value).parse::<i64>() {
                            updated_at_ms = Some(ms);
                        }
                    }
                    _ => {}
                }
            }
            i += 2;
        }

        // Check if snapshot is recent enough (within 1 hour of target time)
        if let Some(snap_updated_at) = updated_at_ms {
            let time_diff = (timestamp_ms - snap_updated_at).abs();
            if time_diff > 3600_000 {
                // 1 hour in milliseconds
                println!("Warning: Snapshot is {}ms away from target time", time_diff);
            }
        }
    }

    // Read snapshot data
    let snapshot_bytes: Option<Vec<u8>> =
        redis::cmd("GET").arg(&snap_key).query_async(conn).await?;

    if let Some(bytes) = snapshot_bytes {
        let snapshot = Snapshot::decode(bytes.as_slice())?;
        Ok(Some(snapshot))
    } else {
        Ok(None)
    }
}

async fn read_events_stream_range(
    conn: &mut redis::aio::MultiplexedConnection,
    game_id: &str,
    start_timestamp_ms: i64,
    end_timestamp_ms: i64,
) -> Result<(Vec<Delta>, Vec<Vec<u8>>)> {
    let events_stream = format!("rts:match:{}:events", game_id);
    let intents_stream = format!("rts:match:{}:intents", game_id);

    let mut deltas = Vec::new();
    let mut intents = Vec::new();

    // Read events stream
    let events_res: redis::Value = redis::cmd("XRANGE")
        .arg(&events_stream)
        .arg("-")
        .arg("+")
        .query_async(conn)
        .await?;

    if let redis::Value::Bulk(entries) = events_res {
        for entry in entries {
            if let redis::Value::Bulk(pair) = entry {
                if pair.len() != 2 {
                    continue;
                }

                let id = match &pair[0] {
                    redis::Value::Data(b) => String::from_utf8_lossy(b).to_string(),
                    _ => continue,
                };

                // Parse timestamp from stream ID (format: timestamp-sequence)
                let stream_timestamp = if let Some(dash_pos) = id.find('-') {
                    if let Ok(ts) = id[..dash_pos].parse::<i64>() {
                        ts
                    } else {
                        continue;
                    }
                } else {
                    continue;
                };

                // Check if this entry is within our time range
                if stream_timestamp < start_timestamp_ms || stream_timestamp > end_timestamp_ms {
                    continue;
                }

                // Extract data field
                if let redis::Value::Bulk(fields) = &pair[1] {
                    let mut i = 0;
                    while i + 1 < fields.len() {
                        if let (redis::Value::Data(name), redis::Value::Data(data)) =
                            (&fields[i], &fields[i + 1])
                        {
                            if name == b"data" {
                                if let Ok(record) = EventsStreamRecord::decode(data.as_slice()) {
                                    match record.record {
                                        Some(Record::Delta(delta)) => {
                                            deltas.push(delta);
                                        }
                                        Some(Record::Lifecycle(_)) => {
                                            // Skip lifecycle events for now
                                        }
                                        None => {}
                                    }
                                }
                                break;
                            }
                        }
                        i += 2;
                    }
                }
            }
        }
    }

    // Read intents stream
    let intents_res: redis::Value = redis::cmd("XRANGE")
        .arg(&intents_stream)
        .arg("-")
        .arg("+")
        .query_async(conn)
        .await?;

    if let redis::Value::Bulk(entries) = intents_res {
        for entry in entries {
            if let redis::Value::Bulk(pair) = entry {
                if pair.len() != 2 {
                    continue;
                }

                let id = match &pair[0] {
                    redis::Value::Data(b) => String::from_utf8_lossy(b).to_string(),
                    _ => continue,
                };

                // Parse timestamp from stream ID
                let stream_timestamp = if let Some(dash_pos) = id.find('-') {
                    if let Ok(ts) = id[..dash_pos].parse::<i64>() {
                        ts
                    } else {
                        continue;
                    }
                } else {
                    continue;
                };

                // Check if this entry is within our time range
                if stream_timestamp < start_timestamp_ms || stream_timestamp > end_timestamp_ms {
                    continue;
                }

                // Extract data field
                if let redis::Value::Bulk(fields) = &pair[1] {
                    let mut i = 0;
                    while i + 1 < fields.len() {
                        if let (redis::Value::Data(name), redis::Value::Data(data)) =
                            (&fields[i], &fields[i + 1])
                        {
                            if name == b"data" {
                                intents.push(data.clone());
                                break;
                            }
                        }
                        i += 2;
                    }
                }
            }
        }
    }

    Ok((deltas, intents))
}

async fn read_gamestate_at_time(
    conn: &mut redis::aio::MultiplexedConnection,
    game_id: &str,
    timestamp_ms: i64,
    time_window_ms: i64,
) -> Result<TimePoint> {
    let start_time = timestamp_ms - time_window_ms;
    let end_time = timestamp_ms + time_window_ms;

    println!(
        "Reading gamestate at time {} (window: {} to {})",
        timestamp_ms, start_time, end_time
    );

    // Read snapshot
    let snapshot = read_snapshot_at_time(conn, game_id, timestamp_ms).await?;

    // Read events and intents in time window
    let (deltas, intents) = read_events_stream_range(conn, game_id, start_time, end_time).await?;

    Ok(TimePoint {
        timestamp_ms,
        snapshot,
        deltas,
        intents,
    })
}

fn write_timepoint_to_files(timepoint: &TimePoint, output_dir: &str, prefix: &str) -> Result<()> {
    fs::create_dir_all(output_dir)?;

    // Write snapshot
    if let Some(snapshot) = &timepoint.snapshot {
        let snapshot_path = format!("{}/{}_snapshot.bin", output_dir, prefix);
        let mut file = fs::File::create(&snapshot_path)?;
        file.write_all(&snapshot.encode_to_vec())?;
        println!("Wrote snapshot to {}", snapshot_path);
    }

    // Write deltas
    if !timepoint.deltas.is_empty() {
        let deltas_path = format!("{}/{}_deltas.bin", output_dir, prefix);
        let mut file = fs::File::create(&deltas_path)?;
        for delta in &timepoint.deltas {
            file.write_all(&delta.encode_to_vec())?;
        }
        println!("Wrote {} deltas to {}", timepoint.deltas.len(), deltas_path);
    }

    // Write intents
    if !timepoint.intents.is_empty() {
        let intents_path = format!("{}/{}_intents.bin", output_dir, prefix);
        let mut file = fs::File::create(&intents_path)?;
        for intent in &timepoint.intents {
            file.write_all(intent)?;
        }
        println!(
            "Wrote {} intents to {}",
            timepoint.intents.len(),
            intents_path
        );
    }

    // Write summary
    let summary_path = format!("{}/{}_summary.txt", output_dir, prefix);
    let mut file = fs::File::create(&summary_path)?;
    writeln!(file, "TimePoint Summary for {}", prefix)?;
    writeln!(file, "Timestamp: {}", timepoint.timestamp_ms)?;
    writeln!(file, "Snapshot: {}", timepoint.snapshot.is_some())?;
    if let Some(snap) = &timepoint.snapshot {
        writeln!(file, "  Tick: {}", snap.tick)?;
        writeln!(file, "  Entities: {}", snap.entities.len())?;
    }
    writeln!(file, "Deltas: {}", timepoint.deltas.len())?;
    writeln!(file, "Intents: {}", timepoint.intents.len())?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    io_env::load_env();

    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!(
            "Usage: {} <game_id> <time1> <time2> [output_dir] [time_window_seconds]",
            args[0]
        );
        eprintln!("  game_id: Redis game ID");
        eprintln!("  time1: First timestamp (Unix timestamp, 'now', or 'current')");
        eprintln!("  time2: Second timestamp (Unix timestamp, 'now', or 'current')");
        eprintln!("  output_dir: Output directory (default: ./redis_data)");
        eprintln!("  time_window_seconds: Time window around each timestamp (default: 60)");
        eprintln!("");
        eprintln!("Examples:");
        eprintln!("  {} demo-001 now 1640995200", args[0]);
        eprintln!("  {} demo-001 1640995200 1640995800 ./output 30", args[0]);
        std::process::exit(1);
    }

    let game_id = &args[1];
    let time1_str = &args[2];
    let time2_str = &args[3];
    let output_dir = args.get(4).map(|s| s.as_str()).unwrap_or("./redis_data");
    let time_window_secs: i64 = args.get(5).and_then(|s| s.parse().ok()).unwrap_or(60);

    let time1 = parse_timestamp(time1_str)?;
    let time2 = parse_timestamp(time2_str)?;
    let time_window_ms = time_window_secs * 1000;

    let redis_url = get_env("GAMESTATE_REDIS_URL", "redis://127.0.0.1:6379");

    println!("Connecting to Redis at {}", redis_url);
    let client = redis::Client::open(redis_url)?;
    let mut conn = client.get_multiplexed_async_connection().await?;

    println!("Reading gamestate at time 1: {}", time1);
    let timepoint1 = read_gamestate_at_time(&mut conn, game_id, time1, time_window_ms).await?;
    write_timepoint_to_files(&timepoint1, output_dir, "time1")?;

    println!("Reading gamestate at time 2: {}", time2);
    let timepoint2 = read_gamestate_at_time(&mut conn, game_id, time2, time_window_ms).await?;
    write_timepoint_to_files(&timepoint2, output_dir, "time2")?;

    println!("Data extraction complete!");
    println!("Output directory: {}", output_dir);
    println!("Files created:");
    println!("  time1_snapshot.bin, time1_deltas.bin, time1_intents.bin, time1_summary.txt");
    println!("  time2_snapshot.bin, time2_deltas.bin, time2_intents.bin, time2_summary.txt");

    Ok(())
}
