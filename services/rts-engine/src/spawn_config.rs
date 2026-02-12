//! Spawn configuration: per-player spawn points, loadouts, and optional neutrals.
//!
//! When present, init_world uses this instead of the legacy spawn_manifest:
//! for each player slot it invokes an onPlayerSpawn-style flow (spawn point + loadout + neutrals).

use std::collections::HashMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::Deserialize;

/// Owner id for server/neutral entities (not owned by any player).
pub const NEUTRAL_OWNER: &str = "neutral";

/// One spawn position (x, y) in world space. Deserializes from YAML array [x, y] or object { x, y }.
#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum SpawnPoint {
    Array([f32; 2]),
    Struct { x: f32, y: f32 },
}

impl SpawnPoint {
    pub fn x(&self) -> f32 {
        match self {
            SpawnPoint::Array(a) => a[0],
            SpawnPoint::Struct { x, .. } => *x,
        }
    }
    pub fn y(&self) -> f32 {
        match self {
            SpawnPoint::Array(a) => a[1],
            SpawnPoint::Struct { y, .. } => *y,
        }
    }
}

/// Describes entities to spawn at a fixed offset from each player's spawn (server-owned).
#[derive(Clone, Debug, Deserialize)]
pub struct NeutralNearSpawn {
    /// Entity type id from the content pack.
    #[serde(rename = "type")]
    pub entity_type_id: String,
    /// How many to spawn per player.
    pub count: usize,
    /// Offset from spawn point (default 0). One entity per count at this offset (or random jitter if both 0).
    #[serde(default)]
    pub offset_x: f32,
    #[serde(default)]
    pub offset_y: f32,
}

/// Per-slot loadout: entity_type_id -> count. Keys are type ids, values are counts.
pub type Loadout = HashMap<String, usize>;

/// Root spawn config: spawn points, one loadout per slot, optional neutrals near each spawn.
#[derive(Clone, Debug, Deserialize)]
pub struct SpawnConfig {
    /// Spawn positions in world space; index matches player slot.
    pub spawn_points: Vec<SpawnPoint>,
    /// One loadout per slot (same order as spawn_points). Each loadout is type_id -> count.
    pub loadouts: Vec<Loadout>,
    /// Optional: server-owned entities spawned near each player's spawn (e.g. neutral creeps).
    #[serde(default)]
    pub neutrals_near_spawn: Vec<NeutralNearSpawn>,
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

    /// Returns true if this config is usable (has points and loadouts, and counts match).
    pub fn is_valid_for_players(&self, num_players: usize) -> bool {
        num_players > 0
            && self.spawn_points.len() >= num_players
            && self.loadouts.len() >= num_players
    }
}
