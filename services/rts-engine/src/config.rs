#[derive(Clone)]
pub struct GameConfig {
    pub game_id: String,
    pub num_entities: usize,
    pub tps: u32,
    pub force_min: f32,
    pub force_max: f32,
    pub friction: f32,
    pub spawn_min: f32,
    pub spawn_max: f32,
    pub default_mass: f32,
    pub snapshot_every_secs: u64,
    pub eps_pos: f32,
    pub eps_vel: f32,
    pub redis_url: String,
    pub default_stop_radius: f32,
    pub default_entity_speed: f32,
    /// M1: Maximum number of intents ingested per tick (backpressure).
    pub max_cmds_per_tick: u32,
    /// M1: Maximum milliseconds spent processing intents per tick (0 = unlimited).
    pub max_batch_ms: u64,
    /// When true, attempt to restore game state from the latest Redis snapshot
    /// on startup instead of generating a fresh world. When false (default),
    /// flush all Redis streams for this game and start clean.
    pub restore_gamestate: bool,
    /// M2: TTL (in seconds) for per-entity active-intent tracking entries in
    /// Redis. These entries are written as JSON (not protobuf) because they are
    /// only read on the reconnect path, never on the hot tick loop. A generous
    /// TTL acts as a safety net so stale entries from crashed games don't linger
    /// forever; the normal lifecycle (finish / cancel) DELs them promptly.
    pub tracking_ttl_secs: u64,
    /// M4: Path to the content pack YAML file.  When set, entity type
    /// definitions are loaded from this file and used for per-entity stats
    /// (speed, stop_radius, mass).  When empty, all entities use the
    /// default_* values above.
    pub content_pack_path: String,
    /// M4: Spawn manifest — list of (entity_type_id, count) pairs.
    /// Used by `init_world` when a content pack is loaded.  When empty,
    /// falls back to `num_entities` untyped entities.
    pub spawn_manifest: Vec<(String, usize)>,
}

impl Default for GameConfig {
    fn default() -> Self {
        Self {
            game_id: "demo-001".into(),
            num_entities: 2,
            tps: 60,
            force_min: -200.0,
            force_max: 200.0,
            friction: 0.3,
            spawn_min: -500.0,
            spawn_max: 500.0,
            default_mass: 1.0,
            snapshot_every_secs: 2,
            eps_pos: 0.0005,
            eps_vel: 0.0005,
            redis_url: "redis://127.0.0.1/".into(),
            default_stop_radius: 0.75,
            default_entity_speed: 90.0,
            max_cmds_per_tick: 64,
            max_batch_ms: 5,
            restore_gamestate: false,
            tracking_ttl_secs: 3600, // 1 hour
            content_pack_path: String::new(),
            spawn_manifest: vec![
                ("worker".into(), 1),
                ("scout".into(), 1),
            ],
        }
    }
}

impl GameConfig {
    pub fn from_env() -> Self {
        let mut cfg = Self::default();
        if let Ok(v) = std::env::var("GAME_ID") {
            cfg.game_id = v;
        }
        if let Ok(v) = std::env::var("GAMESTATE_REDIS_URL") {
            cfg.redis_url = v;
        }
        if let Ok(v) = std::env::var("MAX_CMDS_PER_TICK") {
            if let Ok(n) = v.parse::<u32>() {
                cfg.max_cmds_per_tick = n;
            }
        }
        if let Ok(v) = std::env::var("MAX_BATCH_MS") {
            if let Ok(n) = v.parse::<u64>() {
                cfg.max_batch_ms = n;
            }
        }
        if let Ok(v) = std::env::var("RESTORE_GAMESTATE_ON_RESTART") {
            cfg.restore_gamestate = matches!(v.to_lowercase().as_str(), "1" | "true" | "yes");
        }
        if let Ok(v) = std::env::var("TRACKING_TTL_SECS") {
            if let Ok(n) = v.parse::<u64>() {
                cfg.tracking_ttl_secs = n;
            }
        }
        if let Ok(v) = std::env::var("CONTENT_PACK_PATH") {
            cfg.content_pack_path = v;
        }
        cfg
    }
}
