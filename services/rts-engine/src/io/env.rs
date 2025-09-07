pub fn load_env() {
    let _ = dotenvy::dotenv(); // local .env if present
    let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../.env");
    let _ = dotenvy::from_path(root);
}
