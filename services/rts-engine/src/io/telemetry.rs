use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use chrono::{SecondsFormat, Utc};
use reqwest::Client;
use serde_json::json;
use tokio::sync::mpsc;
use tracing::warn;

use crate::io::host_metrics::{hostname, HostMetrics};

const LIFECYCLE_QUEUE_CAPACITY: usize = 1_024;
const LIFECYCLE_BATCH_SIZE: usize = 64;
const LIFECYCLE_BATCH_WAIT: Duration = Duration::from_millis(20);
const LIFECYCLE_RETRY_WAIT: Duration = Duration::from_millis(100);

#[derive(Debug, PartialEq)]
pub struct TickTimingSummary {
    pub samples: usize,
    pub p50_ms: f64,
    pub p95_ms: f64,
    pub max_ms: f64,
    pub over_budget_samples: usize,
}

pub fn summarize_tick_durations(
    samples: &[Duration],
    budget: Duration,
) -> Option<TickTimingSummary> {
    if samples.is_empty() {
        return None;
    }

    let mut millis: Vec<f64> = samples
        .iter()
        .map(|sample| sample.as_secs_f64() * 1_000.0)
        .collect();
    millis.sort_by(f64::total_cmp);
    let percentile =
        |percent: usize| millis[((millis.len() * percent + 99) / 100).saturating_sub(1)];
    Some(TickTimingSummary {
        samples: millis.len(),
        p50_ms: percentile(50),
        p95_ms: percentile(95),
        max_ms: *millis.last().expect("non-empty samples"),
        over_budget_samples: samples.iter().filter(|sample| **sample > budget).count(),
    })
}

#[derive(Clone)]
pub struct Telemetry {
    client: Client,
    ingest_url: String,
    token: String,
    dataset: String,
    org_id: Option<String>,
    service_name: String,
    hostname: String,
    lifecycle_tx: mpsc::Sender<serde_json::Value>,
    lifecycle_dropped: Arc<AtomicU64>,
}

impl Telemetry {
    pub fn from_env() -> Result<Option<Self>> {
        let token = std::env::var("AXIOM_TOKEN")
            .ok()
            .filter(|v| !v.trim().is_empty());
        let dataset = std::env::var("AXIOM_DATASET")
            .ok()
            .filter(|v| !v.trim().is_empty());

        let (token, dataset) = match (token, dataset) {
            (Some(token), Some(dataset)) => (token, dataset),
            (Some(_), None) => {
                warn!("AXIOM_TOKEN set but AXIOM_DATASET missing; disabling telemetry");
                return Ok(None);
            }
            (None, Some(_)) => {
                warn!("AXIOM_DATASET set but AXIOM_TOKEN missing; disabling telemetry");
                return Ok(None);
            }
            (None, None) => return Ok(None),
        };

        let service_name = std::env::var("AXIOM_SERVICE_NAME")
            .ok()
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| "rts-engine".to_string());
        let org_id = std::env::var("AXIOM_ORG_ID")
            .ok()
            .filter(|v| !v.trim().is_empty());

        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .connect_timeout(Duration::from_secs(2))
            .build()
            .context("build telemetry HTTP client")?;

        let ingest_url = format!("https://api.axiom.co/v1/datasets/{dataset}/ingest");

        let (lifecycle_tx, lifecycle_rx) = mpsc::channel(LIFECYCLE_QUEUE_CAPACITY);
        let lifecycle_dropped = Arc::new(AtomicU64::new(0));
        tokio::spawn(run_lifecycle_worker(
            lifecycle_rx,
            client.clone(),
            ingest_url.clone(),
            token.clone(),
            org_id.clone(),
            lifecycle_dropped.clone(),
        ));

        Ok(Some(Self {
            client,
            ingest_url,
            token,
            dataset,
            org_id,
            service_name,
            hostname: hostname().unwrap_or_else(|| "unknown".to_string()),
            lifecycle_tx,
            lifecycle_dropped,
        }))
    }

    pub fn dataset(&self) -> &str {
        &self.dataset
    }

    /// Queue best-effort Axiom telemetry without waiting for the HTTP request.
    pub fn enqueue_lifecycle_event(
        &self,
        game_id: &str,
        player_id: &str,
        intent_id: &str,
        client_cmd_id: &str,
        state: &str,
        reason: &str,
        server_tick: u64,
        protocol_version: u32,
    ) {
        let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
        let record = json!({
            "timestamp": timestamp,
            "event_type": "intent_lifecycle",
            "service": self.service_name,
            "hostname": self.hostname,
            "dataset": self.dataset,
            "game_id": game_id,
            "player_id": player_id,
            "intent_id": intent_id,
            "client_cmd_id": client_cmd_id,
            "state": state,
            "reason": reason,
            "server_tick": server_tick,
            "protocol_version": protocol_version,
        });

        if let Err(error) = self.lifecycle_tx.try_send(record) {
            let dropped = self.lifecycle_dropped.fetch_add(1, Ordering::Relaxed) + 1;
            if dropped == 1 || dropped % 100 == 0 {
                let reason = match error {
                    mpsc::error::TrySendError::Full(_) => "queue full",
                    mpsc::error::TrySendError::Closed(_) => "worker closed",
                };
                warn!(dropped, reason, "axiom lifecycle telemetry dropped");
            }
        }
    }

    pub async fn publish_tick_timings(
        &self,
        game_id: &str,
        server_tick: u64,
        entity_count: usize,
        raider_entity_count: usize,
        player_entity_count: usize,
        connected_player_count: Option<usize>,
        host_metrics: HostMetrics,
        raider_ai_spatial_index_enabled: bool,
        raider_ai_processed_p50: f64,
        raider_ai_processed_p95: f64,
        raider_ai_deferred_p50: f64,
        raider_ai_deferred_p95: f64,
        tick_budget: Duration,
        summary: TickTimingSummary,
        phase_summaries: Vec<(&'static str, TickTimingSummary)>,
    ) -> Result<()> {
        let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
        let mut records = vec![json!({
            "timestamp": timestamp,
            "event_type": "engine_tick_timing",
            "service": self.service_name,
            "dataset": self.dataset,
            "game_id": game_id,
            "server_tick": server_tick,
            "entity_count": entity_count,
            "raider_entity_count": raider_entity_count,
            "player_entity_count": player_entity_count,
            "connected_player_count": connected_player_count,
            "raider_ai_spatial_index_enabled": raider_ai_spatial_index_enabled,
            "raider_ai_processed_p50": raider_ai_processed_p50,
            "raider_ai_processed_p95": raider_ai_processed_p95,
            "raider_ai_deferred_p50": raider_ai_deferred_p50,
            "raider_ai_deferred_p95": raider_ai_deferred_p95,
            "samples": summary.samples,
            "tick_budget_ms": tick_budget.as_secs_f64() * 1_000.0,
            "tick_p50_ms": summary.p50_ms,
            "tick_p95_ms": summary.p95_ms,
            "tick_max_ms": summary.max_ms,
            "over_budget_samples": summary.over_budget_samples,
            "lifecycle_telemetry_queue_depth": LIFECYCLE_QUEUE_CAPACITY - self.lifecycle_tx.capacity(),
            "lifecycle_telemetry_dropped": self.lifecycle_dropped.load(Ordering::Relaxed),
        })];

        records.extend(phase_summaries.into_iter().map(|(phase, summary)| {
            json!({
                "timestamp": timestamp,
                "event_type": "engine_tick_phase_timing",
                "service": self.service_name,
                "dataset": self.dataset,
                "game_id": game_id,
                "server_tick": server_tick,
                "entity_count": entity_count,
                "raider_entity_count": raider_entity_count,
                "player_entity_count": player_entity_count,
                "connected_player_count": connected_player_count,
                "raider_ai_spatial_index_enabled": raider_ai_spatial_index_enabled,
                "phase": phase,
                "samples": summary.samples,
                "p50_ms": summary.p50_ms,
                "p95_ms": summary.p95_ms,
                "max_ms": summary.max_ms,
            })
        }));

        let host_fields = serde_json::to_value(host_metrics)?;
        if let (Some(fields), Some(host)) = (records[0].as_object_mut(), host_fields.as_object()) {
            fields.extend(host.clone());
        }
        for record in records.iter_mut().skip(1) {
            record["hostname"] = json!(self.hostname);
        }
        self.send_many(records).await
    }

    async fn send_many(&self, records: Vec<serde_json::Value>) -> Result<()> {
        send_many_to_axiom(
            &self.client,
            &self.ingest_url,
            &self.token,
            self.org_id.as_deref(),
            &records,
        )
        .await
    }
}

async fn run_lifecycle_worker(
    mut rx: mpsc::Receiver<serde_json::Value>,
    client: Client,
    ingest_url: String,
    token: String,
    org_id: Option<String>,
    dropped: Arc<AtomicU64>,
) {
    while let Some(first) = rx.recv().await {
        let mut batch = Vec::with_capacity(LIFECYCLE_BATCH_SIZE);
        batch.push(first);
        let deadline = tokio::time::Instant::now() + LIFECYCLE_BATCH_WAIT;
        while batch.len() < LIFECYCLE_BATCH_SIZE {
            match tokio::time::timeout_at(deadline, rx.recv()).await {
                Ok(Some(record)) => batch.push(record),
                Ok(None) | Err(_) => break,
            }
        }

        let mut result =
            send_many_to_axiom(&client, &ingest_url, &token, org_id.as_deref(), &batch).await;
        if result.is_err() {
            tokio::time::sleep(LIFECYCLE_RETRY_WAIT).await;
            result =
                send_many_to_axiom(&client, &ingest_url, &token, org_id.as_deref(), &batch).await;
        }
        if let Err(error) = result {
            let total =
                dropped.fetch_add(batch.len() as u64, Ordering::Relaxed) + batch.len() as u64;
            warn!(
                ?error,
                events = batch.len(),
                dropped = total,
                "axiom lifecycle telemetry batch failed"
            );
        }
    }
}

async fn send_many_to_axiom(
    client: &Client,
    ingest_url: &str,
    token: &str,
    org_id: Option<&str>,
    records: &[serde_json::Value],
) -> Result<()> {
    let body = serde_json::to_vec(records)?;
    let mut request = client
        .post(ingest_url)
        .bearer_auth(token)
        .header("Content-Type", "application/json");
    if let Some(org_id) = org_id {
        request = request.header("X-AXIOM-ORG-ID", org_id);
    }
    let response = request
        .body(body)
        .send()
        .await
        .context("send telemetry payload")?;
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(anyhow!("axiom ingest failed: {status} {text}"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    #[test]
    fn summarizes_tick_durations() {
        let samples = [1, 2, 3, 4, 5].map(Duration::from_millis);
        let summary = summarize_tick_durations(&samples, Duration::from_millis(3)).unwrap();

        assert_eq!(summary.samples, 5);
        assert_eq!(summary.p50_ms, 3.0);
        assert_eq!(summary.p95_ms, 5.0);
        assert_eq!(summary.max_ms, 5.0);
        assert_eq!(summary.over_budget_samples, 2);
    }

    #[test]
    fn lifecycle_queue_drops_immediately_when_full() {
        let (lifecycle_tx, mut rx) = mpsc::channel(1);
        let lifecycle_dropped = Arc::new(AtomicU64::new(0));
        let telemetry = Telemetry {
            client: Client::new(),
            ingest_url: String::new(),
            token: String::new(),
            dataset: "test".into(),
            org_id: None,
            service_name: "rts-engine".into(),
            hostname: "test".into(),
            lifecycle_tx,
            lifecycle_dropped: lifecycle_dropped.clone(),
        };

        for tick in [1, 2] {
            telemetry.enqueue_lifecycle_event(
                "game", "player", "intent", "command", "RECEIVED", "NONE", tick, 13,
            );
        }

        assert_eq!(rx.try_recv().unwrap()["server_tick"], 1);
        assert_eq!(lifecycle_dropped.load(Ordering::Relaxed), 1);
    }

    #[tokio::test]
    async fn lifecycle_worker_batches_events() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut bytes = Vec::new();
            let mut buffer = [0u8; 4096];
            let (body_start, body_len) = loop {
                let read = socket.read(&mut buffer).await.unwrap();
                assert!(read > 0, "request ended before its body arrived");
                bytes.extend_from_slice(&buffer[..read]);
                if let Some(header_end) = bytes.windows(4).position(|part| part == b"\r\n\r\n") {
                    let body_start = header_end + 4;
                    let headers = String::from_utf8_lossy(&bytes[..header_end]);
                    let body_len = headers
                        .lines()
                        .find_map(|line| {
                            line.to_ascii_lowercase()
                                .strip_prefix("content-length:")
                                .and_then(|length| length.trim().parse::<usize>().ok())
                        })
                        .unwrap();
                    if bytes.len() >= body_start + body_len {
                        break (body_start, body_len);
                    }
                }
            };
            let records: Vec<serde_json::Value> =
                serde_json::from_slice(&bytes[body_start..body_start + body_len]).unwrap();
            socket
                .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
                .await
                .unwrap();
            records
        });

        let (tx, rx) = mpsc::channel(8);
        let dropped = Arc::new(AtomicU64::new(0));
        let worker = tokio::spawn(run_lifecycle_worker(
            rx,
            Client::new(),
            format!("http://{address}/ingest"),
            "token".into(),
            None,
            dropped.clone(),
        ));
        for tick in 1..=3 {
            tx.try_send(json!({ "server_tick": tick })).unwrap();
        }
        drop(tx);

        let records = tokio::time::timeout(Duration::from_secs(2), server)
            .await
            .unwrap()
            .unwrap();
        tokio::time::timeout(Duration::from_secs(2), worker)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(records.len(), 3);
        assert_eq!(dropped.load(Ordering::Relaxed), 0);
    }
}
