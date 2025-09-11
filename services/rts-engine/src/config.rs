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
}

impl Default for GameConfig {
    fn default() -> Self {
        Self {
            game_id: "demo-001".into(),
            num_entities: 20,
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
        }
    }
}

impl GameConfig {
    pub fn from_env() -> Self {
        let mut cfg = Self::default();
        if let Ok(v) = std::env::var("GAME_ID") { cfg.game_id = v; }
        if let Ok(v) = std::env::var("GAMESTATE_REDIS_URL") { cfg.redis_url = v; }
        // (add more env overrides if you like)
        cfg
    }
}
