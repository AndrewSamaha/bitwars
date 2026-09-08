use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use chrono::{SecondsFormat, Utc};
use reqwest::Client;
use serde_json::json;
use tracing::warn;

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

        Ok(Some(Self {
            client,
            ingest_url,
            token,
            dataset,
            org_id,
            service_name,
        }))
    }

    pub fn dataset(&self) -> &str {
        &self.dataset
    }

    pub async fn publish_lifecycle_event(
        &self,
        game_id: &str,
        player_id: &str,
        intent_id: &str,
        client_cmd_id: &str,
        state: &str,
        reason: &str,
        server_tick: u64,
        protocol_version: u32,
    ) -> Result<()> {
        let timestamp = Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true);
        let record = json!({
            "timestamp": timestamp,
            "event_type": "intent_lifecycle",
            "service": self.service_name,
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

        self.send(record).await
    }

    pub async fn publish_tick_timings(
        &self,
        game_id: &str,
        server_tick: u64,
        entity_count: usize,
        raider_ai_spatial_index_enabled: bool,
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
            "raider_ai_spatial_index_enabled": raider_ai_spatial_index_enabled,
            "samples": summary.samples,
            "tick_budget_ms": tick_budget.as_secs_f64() * 1_000.0,
            "tick_p50_ms": summary.p50_ms,
            "tick_p95_ms": summary.p95_ms,
            "tick_max_ms": summary.max_ms,
            "over_budget_samples": summary.over_budget_samples,
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
                "raider_ai_spatial_index_enabled": raider_ai_spatial_index_enabled,
                "phase": phase,
                "samples": summary.samples,
                "p50_ms": summary.p50_ms,
                "p95_ms": summary.p95_ms,
                "max_ms": summary.max_ms,
            })
        }));

        self.send_many(records).await
    }

    async fn send(&self, record: serde_json::Value) -> Result<()> {
        self.send_many(vec![record]).await
    }

    async fn send_many(&self, records: Vec<serde_json::Value>) -> Result<()> {
        let body = serde_json::to_vec(&records)?;

        let mut request = self
            .client
            .post(&self.ingest_url)
            .bearer_auth(&self.token)
            .header("Content-Type", "application/json");
        if let Some(org_id) = &self.org_id {
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
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
