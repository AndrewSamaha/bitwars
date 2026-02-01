use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use chrono::{SecondsFormat, Utc};
use reqwest::Client;
use serde_json::json;
use tracing::warn;

#[derive(Clone)]
pub struct Telemetry {
    client: Client,
    ingest_url: String,
    token: String,
    dataset: String,
    service_name: String,
}

impl Telemetry {
    pub fn from_env() -> Result<Option<Self>> {
        let token = std::env::var("AXIOM_TOKEN").ok().filter(|v| !v.trim().is_empty());
        let dataset = std::env::var("AXIOM_DATASET").ok().filter(|v| !v.trim().is_empty());

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

    async fn send(&self, record: serde_json::Value) -> Result<()> {
        let body = serde_json::to_vec(&[record])?;

        let response = self
            .client
            .post(&self.ingest_url)
            .bearer_auth(&self.token)
            .header("Content-Type", "application/json")
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
