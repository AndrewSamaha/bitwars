//! Spawn configuration: procedural player spawns, loadouts, and optional neutrals.
//!
//! When present, init_world does not spawn any player entities at match start.
//! Players spawn on join: engine picks a procedural location near game_origin and one
//! loadout (chosen at random from the loadouts list) per player when they are enqueued via
//! pending_joins.

use std::collections::HashMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::Deserialize;

/// Owner id for server/neutral entities (not owned by any player).
pub const NEUTRAL_OWNER: &str = "neutral";

/// Describes entities to spawn near each player's spawn (server-owned).
#[derive(Clone, Debug, Deserialize)]
pub struct NeutralNearSpawn {
    /// Entity type id from the content pack.
    #[serde(rename = "type")]
    pub entity_type_id: String,
    /// How many to spawn per player.
    pub count: usize,
    /// Min random distance from spawn point for each entity (default 0).
    #[serde(default)]
    pub min_distance_from_spawn: f32,
    /// Max random distance from spawn point for each entity (default 0).
    #[serde(default)]
    pub max_distance_from_spawn: f32,
}

/// One loadout: entity_type_id -> count. Keys are type ids, values are counts.
pub type Loadout = HashMap<String, usize>;

/// M7: Starting resources per player (resource_type_id → amount). Applied when a player spawns.
pub type StartingResources = HashMap<String, i64>;

/// Root spawn config: optional game origin, max distance for procedural spawn,
/// list of loadout options (one chosen at random per player on join), and optional
/// neutrals near each spawn.
#[derive(Clone, Debug, Deserialize)]
pub struct SpawnConfig {
    /// Center of the world; used for procedural player spawns.
    #[serde(default)]
    pub game_origin: [f32; 2],
    /// Max distance from game_origin for procedural player spawns.
    #[serde(default = "default_max_distance_from_origin")]
    pub max_distance_from_origin: f32,
    /// Min random distance from already placed player-owned units when spawning a new player-owned unit.
    #[serde(default)]
    pub min_entity_spawn_distance: f32,
    /// Max random distance from already placed player-owned units when spawning a new player-owned unit.
    #[serde(default = "default_max_entity_spawn_distance")]
    pub max_entity_spawn_distance: f32,
    /// Pool of loadout options. When a player joins, one is chosen at random from this list.
    pub loadouts: Vec<Loadout>,
    /// Optional: server-owned entities spawned near each player's spawn (e.g. neutral creeps).
    #[serde(default)]
    pub neutrals_near_spawn: Vec<NeutralNearSpawn>,
    /// M7: Starting resources granted to each player on spawn (resource_type_id → amount).
    #[serde(default)]
    pub starting_resources: StartingResources,
}

fn default_max_distance_from_origin() -> f32 {
    10_000.0
}

fn default_max_entity_spawn_distance() -> f32 {
    25.0
}

impl SpawnConfig {
    /// Load spawn config from a YAML file.
    pub fn load(path: &Path) -> Result<Self> {
        let raw = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read spawn config: {}", path.display()))?;
        let config: SpawnConfig = serde_yaml::from_str(&raw)
            .with_context(|| format!("failed to parse spawn config YAML: {}", path.display()))?;
        Ok(config)
    }

    /// Returns true if this config is usable for on-join spawning (at least one loadout).
    pub fn is_valid(&self) -> bool {
        !self.loadouts.is_empty()
    }

    /// Origin X (for procedural spawn).
    pub fn origin_x(&self) -> f32 {
        self.game_origin.get(0).copied().unwrap_or(0.0)
    }

    /// Origin Y (for procedural spawn).
    pub fn origin_y(&self) -> f32 {
        self.game_origin.get(1).copied().unwrap_or(0.0)
    }
}
