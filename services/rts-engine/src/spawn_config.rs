//! Spawn configuration: player loadouts, global neutral fields, and optional per-player neutrals.
//!
//! When present, init_world does not spawn any player entities at match start.
//! Players spawn on join near a generated planet and receive one loadout (chosen at random)
//! when they are enqueued via
//! pending_joins.

use std::collections::{BTreeMap, HashMap};
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
#[serde(deny_unknown_fields)]
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
#[serde(deny_unknown_fields)]
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
        [self.average, self.sd, self.min, self.max]
            .iter()
            .all(|v| v.is_finite())
            && self.sd >= 0.0
            && self.min >= 0.0
            && self.min <= self.average
            && self.average <= self.max
    }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExposureConfig {
    pub reference_distance: f64,
    pub minimum_distance: f64,
    pub sources: BTreeMap<String, f64>,
}
#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Sampling {
    UniformRadius,
    UniformArea,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Placement {
    pub min_distance: f32,
    pub max_distance: f32,
    pub sampling: Sampling,
    pub min_separation: f32,
    pub max_attempts_per_object: usize,
    pub avoid_damaging_radiation: bool,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExposurePoint {
    pub exposure: f64,
    pub weights: BTreeMap<String, f64>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Interpolation {
    Linear,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TypeWeights {
    pub interpolation: Interpolation,
    pub points: Vec<ExposurePoint>,
}
// YAML editors stringify numeric map keys as strings. Accept either spelling,
// while rejecting ambiguous duplicates such as numeric 0 plus quoted "0".
fn deserialize_count_weights<'de, D: serde::Deserializer<'de>>(
    deserializer: D,
) -> std::result::Result<BTreeMap<usize, f64>, D::Error> {
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum Key {
        Number(usize),
        Text(String),
    }
    struct Counts;
    impl<'de> serde::de::Visitor<'de> for Counts {
        type Value = BTreeMap<usize, f64>;
        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("planet-count weights")
        }
        fn visit_map<M: serde::de::MapAccess<'de>>(
            self,
            mut map: M,
        ) -> std::result::Result<Self::Value, M::Error> {
            use serde::de::Error;
            let mut result = BTreeMap::new();
            while let Some((key, weight)) = map.next_entry::<Key, f64>()? {
                let key = match key {
                    Key::Number(n) => n,
                    Key::Text(text) => {
                        let n = text
                            .parse::<usize>()
                            .map_err(|_| M::Error::custom("invalid planet count key"))?;
                        if text != n.to_string() {
                            return Err(M::Error::custom("noncanonical planet count key"));
                        }
                        n
                    }
                };
                if result.insert(key, weight).is_some() {
                    return Err(M::Error::custom("duplicate planet count key"));
                }
            }
            Ok(result)
        }
    }
    deserializer.deserialize_map(Counts)
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Planets {
    #[serde(deserialize_with = "deserialize_count_weights")]
    pub count_weights: BTreeMap<usize, f64>,
    pub placement: Placement,
    pub type_weights: TypeWeights,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CountRange {
    pub min: usize,
    pub max: usize,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Population {
    #[serde(rename = "type")]
    pub entity_type_id: String,
    pub probability: f64,
    pub count: CountRange,
    pub placement: Placement,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SolarSystemsConfig {
    pub anchor_type: String,
    pub planets: Planets,
    pub populations: Vec<Population>,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExposureRange {
    pub min: f64,
    pub max: f64,
}
impl ExposureRange {
    pub fn contains(&self, value: f64) -> bool {
        value >= self.min && value <= self.max
    }
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartPlacement {
    pub min_distance_from_planet: f32,
    pub max_distance_from_planet: f32,
    pub max_attempts_per_planet: usize,
    pub radiation_clearance_multiplier: f32,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartMinerals {
    pub search_radius: f32,
    pub min_remaining: f64,
    pub create_if_missing: bool,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartFallback {
    pub generate_additional_systems: bool,
    pub max_additional_systems: usize,
}
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlayerStartsConfig {
    pub planet_type: String,
    pub exposure: ExposureRange,
    pub min_planet_food_fraction: f64,
    pub max_starts_per_planet: usize,
    pub placement: StartPlacement,
    pub min_distance_between_starts: f32,
    pub enemy_clearance: f32,
    pub minerals: StartMinerals,
    pub fallback: StartFallback,
}

fn nonnegative(v: f64) -> bool {
    v.is_finite() && v >= 0.0
}
fn range(min: f64, max: f64) -> bool {
    nonnegative(min) && max.is_finite() && max >= min
}
fn weights<'a>(values: impl Iterator<Item = &'a f64>) -> bool {
    let values: Vec<_> = values.copied().collect();
    !values.is_empty()
        && values.iter().all(|v| nonnegative(*v))
        && values.iter().sum::<f64>().is_finite()
        && values.iter().sum::<f64>() > 0.0
}
impl Placement {
    fn validate(&self) -> Result<()> {
        anyhow::ensure!(
            range(self.min_distance as f64, self.max_distance as f64)
                && nonnegative(self.min_separation as f64)
                && self.max_attempts_per_object > 0,
            "invalid placement bounds or retry cap"
        );
        Ok(())
    }
}
impl SpawnConfig {
    pub fn validate(&self) -> Result<()> {
        anyhow::ensure!(
            !self.loadouts.is_empty() && self.loadouts.iter().all(|l| l.values().any(|n| *n > 0)),
            "loadouts must contain units"
        );
        anyhow::ensure!(
            range(
                self.min_entity_spawn_distance as f64,
                self.max_entity_spawn_distance as f64
            ),
            "invalid player unit spacing"
        );
        anyhow::ensure!(
            self.starting_resources.values().all(|v| *v >= 0),
            "negative starting resource"
        );
        for (id, distribution) in &self.resource_amounts {
            anyhow::ensure!(
                distribution.is_valid(),
                "invalid resource amount distribution for {id}"
            );
        }
        for field in &self.global_neutral_fields {
            anyhow::ensure!(
                field.origin.iter().all(|v| v.is_finite())
                    && nonnegative(field.standard_deviation as f64),
                "invalid global field"
            );
        }
        for field in &self.neutrals_near_spawn {
            anyhow::ensure!(
                range(
                    field.min_distance_from_spawn as f64,
                    field.max_distance_from_spawn as f64
                ),
                "invalid nearby field"
            );
            anyhow::ensure!(
                !self.exposure.sources.contains_key(&field.entity_type_id),
                "exposure sources cannot be per-player neutrals"
            );
        }
        let e = &self.exposure;
        anyhow::ensure!(
            nonnegative(e.reference_distance)
                && e.reference_distance > 0.0
                && nonnegative(e.minimum_distance)
                && e.minimum_distance > 0.0
                && weights(e.sources.values()),
            "invalid exposure parameters"
        );
        anyhow::ensure!(
            (e.sources.values().sum::<f64>() * (e.reference_distance / e.minimum_distance).powi(2))
                .is_finite(),
            "exposure strengths and distance ratio overflow"
        );
        let systems = &self.solar_systems;
        anyhow::ensure!(
            e.sources
                .get(&systems.anchor_type)
                .is_some_and(|v| *v > 0.0),
            "anchor must be a positive exposure source"
        );
        anyhow::ensure!(
            self.global_neutral_fields
                .iter()
                .any(|f| f.entity_type_id == systems.anchor_type && f.count > 0),
            "include an initial {} field",
            systems.anchor_type
        );
        anyhow::ensure!(
            weights(systems.planets.count_weights.values())
                && systems
                    .planets
                    .count_weights
                    .iter()
                    .any(|(n, w)| *n > 0 && *w > 0.0),
            "invalid planet count weights"
        );
        systems.planets.placement.validate()?;
        let points = &systems.planets.type_weights.points;
        anyhow::ensure!(
            !points.is_empty()
                && points
                    .iter()
                    .all(|p| nonnegative(p.exposure) && weights(p.weights.values()))
                && points.windows(2).all(|p| p[0].exposure < p[1].exposure),
            "invalid exposure table"
        );
        for point in points {
            for id in point.weights.keys() {
                anyhow::ensure!(
                    !e.sources.contains_key(id),
                    "planets cannot be exposure sources"
                );
            }
        }
        for population in &systems.populations {
            anyhow::ensure!(
                range(0.0, population.probability)
                    && population.probability <= 1.0
                    && population.count.min <= population.count.max
                    && !e.sources.contains_key(&population.entity_type_id),
                "invalid population"
            );
            population.placement.validate()?;
        }
        let start = &self.player_starts;
        anyhow::ensure!(
            range(start.exposure.min, start.exposure.max)
                && range(0.0, start.min_planet_food_fraction)
                && start.min_planet_food_fraction <= 1.0
                && start.max_starts_per_planet > 0,
            "invalid start eligibility"
        );
        let p = &start.placement;
        anyhow::ensure!(
            range(
                p.min_distance_from_planet as f64,
                p.max_distance_from_planet as f64
            ) && p.max_attempts_per_planet > 0
                && p.radiation_clearance_multiplier.is_finite()
                && p.radiation_clearance_multiplier >= 1.0,
            "invalid start placement"
        );
        anyhow::ensure!(
            nonnegative(start.min_distance_between_starts as f64)
                && nonnegative(start.enemy_clearance as f64)
                && start.minerals.search_radius.is_finite()
                && start.minerals.search_radius > 0.0
                && start.minerals.min_remaining.is_finite()
                && start.minerals.min_remaining > 0.0
                && start.fallback.max_additional_systems > 0,
            "invalid start safety or fallback"
        );
        let has_weight = |x| {
            crate::engine::generation::planet_weights(&systems.planets.type_weights, x)
                .get(&start.planet_type)
                .is_some_and(|w| *w > 0.0)
        };
        anyhow::ensure!(
            has_weight(start.exposure.min)
                || has_weight(start.exposure.max)
                || points
                    .iter()
                    .any(|p| start.exposure.contains(p.exposure) && has_weight(p.exposure)),
            "starting planet has no weight in start exposure interval"
        );
        Ok(())
    }

    /// Deterministic stock for scenarios, restored missing deposits and replacements.
    /// Procedural generation samples the distribution instead.
    pub fn initial_resource_amount(&self, id: &str, node: &crate::content::ResourceNodeDef) -> Option<f64> {
        self.resource_amounts.get(id).map(|d| d.average).or(node.amount)
    }

    pub fn validate_content(&self, content: &crate::content::ContentPack) -> Result<()> {
        self.validate()?;
        let mut ids: Vec<&str> = self.exposure.sources.keys().map(String::as_str).collect();
        ids.push(&self.solar_systems.anchor_type);
        ids.push(&self.player_starts.planet_type);
        ids.extend(
            self.global_neutral_fields
                .iter()
                .map(|f| f.entity_type_id.as_str()),
        );
        ids.extend(
            self.neutrals_near_spawn
                .iter()
                .map(|f| f.entity_type_id.as_str()),
        );
        ids.extend(
            self.solar_systems
                .populations
                .iter()
                .map(|f| f.entity_type_id.as_str()),
        );
        ids.extend(
            self.solar_systems
                .planets
                .type_weights
                .points
                .iter()
                .flat_map(|p| p.weights.keys().map(String::as_str)),
        );
        ids.extend(self.resource_amounts.keys().map(String::as_str));
        ids.extend(
            self.loadouts
                .iter()
                .flat_map(|l| l.keys().map(String::as_str)),
        );
        for id in ids {
            anyhow::ensure!(content.get(id).is_some(), "unknown spawn entity {id}");
        }
        for id in self.resource_amounts.keys() {
            anyhow::ensure!(content.get(id).and_then(|d| d.resource_node.as_ref()).is_some(),
                "resource amount distribution requires a resource node: {id}");
        }
        for (id, def) in &content.entity_types {
            if let Some(node) = def.resource_node.as_ref().filter(|n| n.regeneration.is_some()) {
                let minimum = self.resource_amounts.get(id)
                    .map(|d| if d.sd == 0.0 { d.average } else { d.min }).or(node.amount);
                anyhow::ensure!(minimum.is_some_and(|a| a > 0.0),
                    "renewable resource {id} requires positive finite stock in resource_amounts");
            }
        }
        let node = content
            .get(&self.player_starts.planet_type)
            .and_then(|d| d.resource_node.as_ref());
        anyhow::ensure!(
            node.is_some_and(|n| n.resource_type == "food" && self.initial_resource_amount(&self.player_starts.planet_type, n).is_some_and(|a| a > 0.0)),
            "starting planet requires finite food"
        );
        for resource in self.starting_resources.keys() {
            anyhow::ensure!(
                content.get_resource_type(resource).is_some(),
                "unknown starting resource {resource}"
            );
        }
        for loadout in &self.loadouts {
            if !self.starting_resources.is_empty() {
                anyhow::ensure!(
                    loadout.get(&self.starting_resources_recipient_type) == Some(&1),
                    "starting resource recipient must appear exactly once"
                );
                let def = content
                    .get(&self.starting_resources_recipient_type)
                    .unwrap();
                for (resource, amount) in &self.starting_resources {
                    anyhow::ensure!(
                        *amount as f64
                            <= def.max_capacity.get(resource).copied().unwrap_or(0.0) as f64,
                        "starting {resource} exceeds capacity"
                    );
                }
            }
            anyhow::ensure!(
                loadout.iter().any(|(id, n)| *n > 0
                    && content.get(id).is_some_and(|d| d.speed > 0.0
                        && d.collector
                            .as_ref()
                            .is_some_and(|c| c.collects.iter().any(|r| r == "minerals")))),
                "loadout needs a mobile mineral collector"
            );
        }
        if self.player_starts.minerals.create_if_missing {
            let node = content
                .get("minerals")
                .and_then(|d| d.resource_node.as_ref());
            anyhow::ensure!(
                node.is_some_and(|n| n.resource_type == "minerals" && self.initial_resource_amount("minerals", n).is_some()),
                "minerals requires finite mineral stock"
            );
            let max = self
                .resource_amounts
                .get("minerals")
                .map(|d| if d.sd == 0.0 { d.average } else { d.max })
                .or_else(|| node.and_then(|n| n.amount))
                .unwrap_or(0.0);
            anyhow::ensure!(
                max >= self.player_starts.minerals.min_remaining,
                "mineral stock cannot meet start minimum"
            );
        }
        Ok(())
    }
}

fn default_starting_resources_recipient_type() -> String {
    "habitat".to_string()
}

/// Root spawn config: celestial field, global neutral fields, loadout options, and optional per-player neutrals.
#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SpawnConfig {
    pub exposure: ExposureConfig,
    pub solar_systems: SolarSystemsConfig,
    pub player_starts: PlayerStartsConfig,
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
        config.validate()?;
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
    fn resource_stock_comes_from_spawn_config_with_legacy_fallback() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let mut content = crate::content::ContentPack::load(&root.join("../../packages/content/entities.yaml")).unwrap();
        let mut config = SpawnConfig::load(&root.join("config/spawn.yaml")).unwrap();
        config.validate_content(&content).unwrap();
        for (id, expected) in [("minerals", 10000.0), ("planet_blue", 10000.0), ("dead_planet_blue", 1000.0)] {
            let node = content.get(id).unwrap().resource_node.as_ref().unwrap();
            assert_eq!(node.amount, None);
            assert_eq!(config.initial_resource_amount(id, node), Some(expected));
        }
        config.resource_amounts.get_mut("planet_blue").unwrap().min = 0.0;
        assert!(config.validate_content(&content).is_err());
        config.resource_amounts.remove("planet_blue");
        assert!(config.validate_content(&content).is_err());
        let node = content.entity_types.get_mut("planet_blue").unwrap().resource_node.as_mut().unwrap();
        node.amount = Some(2000.0);
        assert_eq!(config.initial_resource_amount("planet_blue", node), Some(2000.0));
        config.validate_content(&content).unwrap();
        config.resource_amounts.insert("worker".into(), config.resource_amounts["minerals"].clone());
        assert!(config.validate_content(&content).is_err());
    }

    #[test]
    fn resource_amount_distribution_validates_and_clamps_samples() {
        use rand::SeedableRng;
        let mut rng = rand::rngs::StdRng::seed_from_u64(7);
        let mut distribution = ResourceAmountDistribution {
            average: 10.0,
            sd: 100.0,
            min: 5.0,
            max: 15.0,
        };
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
    fn procedural_configuration_validates_and_rejects_partial_or_invalid_rules() {
        let source = include_str!("../config/spawn.yaml");
        let config: SpawnConfig = serde_yaml::from_str(source).unwrap();
        config.validate().unwrap();
        let quoted = source.replace("      0: 15", "      \"0\": 15");
        let quoted: SpawnConfig = serde_yaml::from_str(&quoted).unwrap();
        assert_eq!(
            quoted.solar_systems.planets.count_weights,
            config.solar_systems.planets.count_weights
        );
        let duplicate = source.replace("      0: 15", "      0: 15\n      \"0\": 10");
        assert!(serde_yaml::from_str::<SpawnConfig>(&duplicate).is_err());
        let mut value: serde_yaml::Value = serde_yaml::from_str(source).unwrap();
        value
            .as_mapping_mut()
            .unwrap()
            .remove(serde_yaml::Value::String("exposure".into()));
        assert!(serde_yaml::from_value::<SpawnConfig>(value).is_err());
        let mut config = config.clone();
        config.exposure.minimum_distance = 0.0;
        assert!(config.validate().is_err());
        let mut config: SpawnConfig = serde_yaml::from_str(source).unwrap();
        config.solar_systems.planets.type_weights.points[1].exposure = 0.1;
        assert!(config.validate().is_err());
        let mut config: SpawnConfig = serde_yaml::from_str(source).unwrap();
        config.solar_systems.populations[0].entity_type_id = "theta".into();
        assert!(config.validate().is_err());
        let invalid = source.replace(
            "reference_distance: 3750",
            "reference_distance: 3750\n  unexpected: true",
        );
        assert!(serde_yaml::from_str::<SpawnConfig>(&invalid).is_err());
    }

    #[test]
    fn separates_players_from_registered_system_owners() {
        assert!(is_system_owner(UNIVERSE_OWNER));
        assert!(is_system_owner(RAIDERS_OWNER));
        assert!(is_player_owner("player-1"));
        assert!(!is_player_owner(UNIVERSE_OWNER));
    }
}
