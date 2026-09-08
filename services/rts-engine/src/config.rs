pub const RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_TICKS: u64 = 600;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum RaiderAiSpatialIndexMode {
    #[default]
    Enabled,
    Disabled,
    Alternating,
}

impl RaiderAiSpatialIndexMode {
    pub fn enabled_at(self, tick: u64) -> bool {
        match self {
            Self::Enabled => true,
            Self::Disabled => false,
            // Start with the indexed implementation and switch modes only at
            // telemetry-window boundaries so each Axiom summary is pure.
            Self::Alternating => (tick / RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_TICKS) % 2 == 0,
        }
    }
}

#[derive(Clone)]
pub struct GameConfig {
    pub game_id: String,
    pub tps: u32,
    pub force_min: f32,
    pub force_max: f32,
    pub friction: f32,
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
    /// Chooses the player-target lookup used by raider AI. Alternating mode
    /// changes implementation every telemetry window for controlled A/B runs.
    pub raider_ai_spatial_index_mode: RaiderAiSpatialIndexMode,
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
    /// M4: Path to the content pack YAML file. When set, entity type definitions
    /// are loaded from this file. Required for spawn-on-join (entity stats).
    pub content_pack_path: String,
    /// Path to spawn config YAML (procedural spawn settings, loadouts, neutrals). Required:
    /// engine uses config-based init only and exits if this is missing or invalid.
    pub spawn_config_path: String,
}

impl Default for GameConfig {
    fn default() -> Self {
        Self {
            game_id: "demo-001".into(),
            tps: 60,
            force_min: -200.0,
            force_max: 200.0,
            friction: 0.3,
            default_mass: 1.0,
            snapshot_every_secs: 2,
            eps_pos: 0.0005,
            eps_vel: 0.0005,
            redis_url: "redis://127.0.0.1/".into(),
            default_stop_radius: 0.75,
            default_entity_speed: 90.0,
            max_cmds_per_tick: 64,
            max_batch_ms: 5,
            raider_ai_spatial_index_mode: RaiderAiSpatialIndexMode::Enabled,
            restore_gamestate: false,
            tracking_ttl_secs: 3600, // 1 hour
            content_pack_path: String::new(),
            spawn_config_path: String::new(),
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
        if let Ok(v) = std::env::var("RAIDER_AI_SPATIAL_INDEX_ENABLED") {
            // Preserve the original boolean toggle while accepting `alternate`
            // from early experiment configuration. `..._MODE` below remains the
            // canonical setting and overrides this value when present.
            cfg.raider_ai_spatial_index_mode = match v.trim().to_lowercase().as_str() {
                "alternate" | "alternating" => RaiderAiSpatialIndexMode::Alternating,
                "0" | "false" | "no" | "off" => RaiderAiSpatialIndexMode::Disabled,
                _ => RaiderAiSpatialIndexMode::Enabled,
            };
        }
        if let Ok(v) = std::env::var("RAIDER_AI_SPATIAL_INDEX_MODE") {
            cfg.raider_ai_spatial_index_mode = match v.trim().to_lowercase().as_str() {
                "on" | "true" | "enabled" => RaiderAiSpatialIndexMode::Enabled,
                "off" | "false" | "disabled" => RaiderAiSpatialIndexMode::Disabled,
                "alternate" | "alternating" => RaiderAiSpatialIndexMode::Alternating,
                _ => cfg.raider_ai_spatial_index_mode,
            };
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
        if let Ok(v) = std::env::var("SPAWN_CONFIG_PATH") {
            cfg.spawn_config_path = v;
        }
        cfg
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn alternating_spatial_index_mode_changes_only_on_telemetry_boundaries() {
        assert!(RaiderAiSpatialIndexMode::Alternating.enabled_at(0));
        assert!(RaiderAiSpatialIndexMode::Alternating
            .enabled_at(RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_TICKS - 1));
        assert!(!RaiderAiSpatialIndexMode::Alternating
            .enabled_at(RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_TICKS));
        assert!(!RaiderAiSpatialIndexMode::Alternating
            .enabled_at(RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_TICKS * 2 - 1));
        assert!(RaiderAiSpatialIndexMode::Alternating
            .enabled_at(RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_TICKS * 2));
    }

    #[test]
    fn legacy_spatial_index_env_accepts_alternate() {
        // Keep the spelling used by the initial experiment configuration
        // working while callers migrate to RAIDER_AI_SPATIAL_INDEX_MODE.
        std::env::set_var("RAIDER_AI_SPATIAL_INDEX_ENABLED", "alternate");
        std::env::remove_var("RAIDER_AI_SPATIAL_INDEX_MODE");

        assert_eq!(
            GameConfig::from_env().raider_ai_spatial_index_mode,
            RaiderAiSpatialIndexMode::Alternating
        );

        std::env::remove_var("RAIDER_AI_SPATIAL_INDEX_ENABLED");
    }
}
