use tracing::Level;
use tracing_subscriber::EnvFilter;

pub fn init_tracing() {
    let filter = EnvFilter::try_from_env("RTS_ENGINE_LOG_LEVEL")
        .unwrap_or_else(|_| EnvFilter::default().add_directive(Level::INFO.into()));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .init();
}
