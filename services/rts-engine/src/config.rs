pub const DEFAULT_TPS: u32 = 20;
pub const RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_SECS: u64 = 10;
const DEFAULT_MAX_CMDS_PER_SECOND: u32 = 3_840;
const DEFAULT_MAX_BATCH_MS_PER_SECOND: u64 = 300;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub enum RaiderAiSpatialIndexMode {
    #[default]
    Enabled,
    Disabled,
    Alternating,
}

impl RaiderAiSpatialIndexMode {
    pub fn enabled_at(self, tick: u64, tps: u32) -> bool {
        match self {
            Self::Enabled => true,
            Self::Disabled => false,
            // Start with the indexed implementation and switch modes only at
            // telemetry-window boundaries so each Axiom summary is pure.
            Self::Alternating => {
                let block_ticks = RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_SECS
                    * u64::from(tps.max(1));
                (tick / block_ticks) % 2 == 0
            }
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
    /// The default preserves the previous per-second allowance at 20 TPS.
    pub max_cmds_per_tick: u32,
    /// M1: Maximum milliseconds spent processing intents per tick (0 = unlimited).
    /// The default preserves the previous per-second allowance at 20 TPS.
    pub max_batch_ms: u64,
    /// Chooses the player-target lookup used by raider AI. Alternating mode
    /// changes implementation every telemetry window for controlled A/B runs.
    pub raider_ai_spatial_index_mode: RaiderAiSpatialIndexMode,
    /// When true, attempt to restore game state from the latest Redis snapshot
    /// on startup instead of generating a fresh world. When false (default),
    /// flush all Redis streams for this game and start clean.
    pub restore_gamestate: bool,
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
            tps: DEFAULT_TPS,
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
            max_cmds_per_tick: 192,
            max_batch_ms: 15,
            raider_ai_spatial_index_mode: RaiderAiSpatialIndexMode::Enabled,
            restore_gamestate: false,
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
        if let Ok(v) = std::env::var("GAME_TPS") {
            if let Ok(n) = v.parse::<u32>() {
                if n > 0 {
                    cfg.tps = n;
                }
            }
        }
        cfg.max_cmds_per_tick = DEFAULT_MAX_CMDS_PER_SECOND.div_ceil(cfg.tps);
        cfg.max_batch_ms = DEFAULT_MAX_BATCH_MS_PER_SECOND.div_ceil(u64::from(cfg.tps));
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
    fn default_tick_rate_and_ingress_budget_match_twenty_hertz() {
        let cfg = GameConfig::default();
        assert_eq!(cfg.tps, 20);
        assert_eq!(cfg.max_cmds_per_tick * cfg.tps, DEFAULT_MAX_CMDS_PER_SECOND);
        assert_eq!(cfg.max_batch_ms * u64::from(cfg.tps), DEFAULT_MAX_BATCH_MS_PER_SECOND);
    }

    #[test]
    fn alternating_spatial_index_mode_changes_only_on_telemetry_boundaries() {
        let block_ticks = RAIDER_AI_SPATIAL_INDEX_EXPERIMENT_BLOCK_SECS * u64::from(DEFAULT_TPS);
        assert!(RaiderAiSpatialIndexMode::Alternating.enabled_at(0, DEFAULT_TPS));
        assert!(RaiderAiSpatialIndexMode::Alternating
            .enabled_at(block_ticks - 1, DEFAULT_TPS));
        assert!(!RaiderAiSpatialIndexMode::Alternating
            .enabled_at(block_ticks, DEFAULT_TPS));
        assert!(!RaiderAiSpatialIndexMode::Alternating
            .enabled_at(block_ticks * 2 - 1, DEFAULT_TPS));
        assert!(RaiderAiSpatialIndexMode::Alternating
            .enabled_at(block_ticks * 2, DEFAULT_TPS));
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
