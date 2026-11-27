fn main() -> anyhow::Result<()> {
    // Pin to the engine package like the live dev task so workspace discovery
    // and the worktree-scoped socket do not depend on the launch directory.
    // `load_env` resolves the service-local .env explicitly, so GAME_TPS also
    // matches production when the runner is launched from the workspace root.
    std::env::set_current_dir(env!("CARGO_MANIFEST_DIR"))?;
    rts_engine::io::env::load_env();
    serve()
}

#[tokio::main(flavor = "multi_thread", worker_threads = 2)]
async fn serve() -> anyhow::Result<()> {
    rts_engine::battle::run().await
}
