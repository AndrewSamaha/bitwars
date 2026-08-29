//! Spawn configuration: player loadouts, global neutral fields, and optional per-player neutrals.
//!
//! When present, init_world does not spawn any player entities at match start.
//! Players spawn on join near a generated planet and receive one loadout (chosen at random)
//! when they are enqueued via
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

/// Server-owned entities sampled once from a normal distribution at world creation.
#[derive(Clone, Debug, Deserialize)]
pub struct GlobalNeutralField {
    /// Entity type id from the content pack.
    #[serde(rename = "type")]
    pub entity_type_id: String,
    /// Number of entities to create in this field.
    pub count: usize,
    /// Center of this entity type's field.
    pub origin: [f32; 2],
    /// Per-axis standard deviation of this entity type's normal distribution.
    pub standard_deviation: f32,
}

/// One loadout: entity_type_id -> count. Keys are type ids, values are counts.
pub type Loadout = HashMap<String, usize>;

/// M7: Starting resources per player (resource_type_id → amount). Applied when a player spawns.
pub type StartingResources = HashMap<String, i64>;

/// Root spawn config: celestial field, global neutral fields, loadout options, and optional per-player neutrals.
#[derive(Clone, Debug, Deserialize)]
pub struct SpawnConfig {
    /// Min random distance from already placed player-owned units when spawning a new player-owned unit.
    #[serde(default)]
    pub min_entity_spawn_distance: f32,
    /// Max random distance from already placed player-owned units when spawning a new player-owned unit.
    #[serde(default = "default_max_entity_spawn_distance")]
    pub max_entity_spawn_distance: f32,
    /// Server-owned fields sampled once when the world is created.
    #[serde(default)]
    pub global_neutral_fields: Vec<GlobalNeutralField>,
    /// Pool of loadout options. When a player joins, one is chosen at random from this list.
    pub loadouts: Vec<Loadout>,
    /// Optional: server-owned entities spawned near each player's spawn (e.g. neutral creeps).
    #[serde(default)]
    pub neutrals_near_spawn: Vec<NeutralNearSpawn>,
    /// M7: Starting resources granted to each player on spawn (resource_type_id → amount).
    #[serde(default)]
    pub starting_resources: StartingResources,
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
}
