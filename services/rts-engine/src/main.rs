use rts_engine::{
    config::GameConfig,
    engine::{Engine, ENGINE_PROTOCOL_MAJOR},
    io::{env::load_env, tracing::init_tracing},
};
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    load_env();
    init_tracing();

    let cfg = GameConfig::from_env();
    let content_version = std::env::var("CONTENT_VERSION").unwrap_or_else(|_| "dev".to_string());
    info!(
        protocol_version = ENGINE_PROTOCOL_MAJOR,
        %content_version,
        "protocol header"
    );
    let mut engine = Engine::new(cfg).await?;
    engine.run().await?; // Ctrl+C to stop
    Ok(())
}
