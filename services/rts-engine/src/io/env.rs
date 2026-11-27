pub fn load_env() {
    // The engine package's .env is the supported per-service override. Load it
    // before any cwd-relative file so the live engine and the battle runner
    // resolve GAME_TPS identically even when launched from the repository root.
    let package = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let _ = dotenvy::from_path(package.join(".env"));
    let _ = dotenvy::dotenv(); // local .env if present
    let _ = dotenvy::from_path(package.join("../../.env"));
}
