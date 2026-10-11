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

/// Server-controlled owners. Add new NPC factions here.
pub const UNIVERSE_OWNER: &str = "universe";
pub const RAIDERS_OWNER: &str = "raiders";

pub fn is_system_owner(owner: &str) -> bool {
    matches!(owner, UNIVERSE_OWNER | RAIDERS_OWNER)
}

pub fn is_player_owner(owner: &str) -> bool {
    !owner.is_empty() && !is_system_owner(owner)
}

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

/// Normal distribution clamped to inclusive bounds for a source's initial stock.
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ResourceAmountDistribution {
    pub average: f64,
    pub sd: f64,
    pub min: f64,
    pub max: f64,
}

impl ResourceAmountDistribution {
    pub fn sample(&self, rng: &mut impl rand::Rng) -> f64 {
        let u1 = rng.gen_range(f64::MIN_POSITIVE..1.0);
        let u2 = rng.gen_range(0.0..1.0);
        let normal = (-2.0 * u1.ln()).sqrt() * (std::f64::consts::TAU * u2).cos();
        (self.average + self.sd * normal).clamp(self.min, self.max)
    }

    fn is_valid(&self) -> bool {
        [self.average, self.sd, self.min, self.max].iter().all(|v| v.is_finite())
            && self.sd >= 0.0 && self.min >= 0.0
            && self.min <= self.average && self.average <= self.max
    }
}

fn default_starting_resources_recipient_type() -> String {
    "habitat".to_string()
}

/// Root spawn config: celestial field, global neutral fields, loadout options, and optional per-player neutrals.
#[derive(Clone, Debug, Deserialize)]
pub struct SpawnConfig {
    /// Initial resource stock distributions, keyed by source entity type ID.
    #[serde(default)]
    pub resource_amounts: HashMap<String, ResourceAmountDistribution>,
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
    /// Entity type that receives the player's starting resource stock.
    #[serde(default = "default_starting_resources_recipient_type")]
    pub starting_resources_recipient_type: String,
    /// Maximum number of living raiders. Defaults to unlimited for existing configs.
    #[serde(default = "default_max_raiders")]
    pub max_raiders: usize,
}

fn default_max_entity_spawn_distance() -> f32 {
    25.0
}

fn default_max_raiders() -> usize {
    usize::MAX
}

impl SpawnConfig {
    /// Load spawn config from a YAML file.
    pub fn load(path: &Path) -> Result<Self> {
        let raw = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read spawn config: {}", path.display()))?;
        let config: SpawnConfig = serde_yaml::from_str(&raw)
            .with_context(|| format!("failed to parse spawn config YAML: {}", path.display()))?;
        for (entity_type, distribution) in &config.resource_amounts {
            anyhow::ensure!(distribution.is_valid(), "invalid resource amount distribution for {entity_type}");
        }
        Ok(config)
    }

    /// Returns true if this config is usable for on-join spawning (at least one loadout).
    pub fn is_valid(&self) -> bool {
        !self.loadouts.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resource_amount_distribution_validates_and_clamps_samples() {
        use rand::SeedableRng;
        let mut rng = rand::rngs::StdRng::seed_from_u64(7);
        let mut distribution = ResourceAmountDistribution { average: 10.0, sd: 100.0, min: 5.0, max: 15.0 };
        assert!(distribution.is_valid());
        let samples: Vec<_> = (0..100).map(|_| distribution.sample(&mut rng)).collect();
        assert!(samples.iter().all(|amount| (5.0..=15.0).contains(amount)));
        assert!(samples.contains(&5.0) && samples.contains(&15.0));
        distribution.sd = 0.0;
        assert_eq!(distribution.sample(&mut rng), 10.0);
        distribution.sd = -1.0;
        assert!(!distribution.is_valid());
        distribution.sd = 1.0;
        distribution.min = 11.0;
        assert!(!distribution.is_valid());
        distribution.min = f64::NAN;
        assert!(!distribution.is_valid());
    }

    #[test]
    fn separates_players_from_registered_system_owners() {
        assert!(is_system_owner(UNIVERSE_OWNER));
        assert!(is_system_owner(RAIDERS_OWNER));
        assert!(is_player_owner("player-1"));
        assert!(!is_player_owner(UNIVERSE_OWNER));
    }
}
