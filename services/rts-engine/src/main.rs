use rts_engine::{config::GameConfig, io::{env::load_env, tracing::init_tracing}, engine::Engine};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    load_env();
    init_tracing();

    let cfg = GameConfig::from_env();
    let mut engine = Engine::new(cfg).await?;
    engine.run().await?; // Ctrl+C to stop
    Ok(())
}
