//! M4: Content pack loader and content hash.
//!
//! Loads entity type definitions from a YAML file at startup and computes a
//! deterministic content hash from the canonicalized JSON representation.
//! The YAML format is for human authoring only — all derived artifacts (hash,
//! API responses, client bundles) use JSON.

use std::collections::HashMap;
use std::path::Path;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// A loaded content pack with entity and resource type definitions and a content hash.
#[derive(Clone, Debug)]
pub struct ContentPack {
    pub entity_types: HashMap<String, EntityTypeDef>,
    /// M7: Resource type definitions for display (id → display_name, order).
    pub resource_types: HashMap<String, ResourceTypeDef>,
    /// Hex-encoded xxh3-64 hash of the canonicalized JSON representation.
    pub content_hash: String,
}

/// Per-entity-type definition loaded from the content YAML.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EntityTypeDef {
    pub speed: f32,
    pub stop_radius: f32,
    pub mass: f32,
    pub health: f32,
    /// M8: Optional collection profile for collector-capable entities.
    #[serde(default)]
    pub collector: Option<CollectorDef>,
    /// M8: Optional resource-node profile for collectible source entities.
    #[serde(default)]
    pub resource_node: Option<ResourceNodeDef>,
    /// M8: Optional refinery/processor profile for transport deposits.
    #[serde(default)]
    pub refinery: Option<RefineryDef>,
}

/// M7: Per-resource-type definition for display (name, order) in HUD.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ResourceTypeDef {
    pub display_name: String,
    #[serde(default)]
    pub order: i32,
}

/// M8: Collection mode for a resource source.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CollectionMode {
    Transport,
    Proximity,
}

/// M8: Collector capabilities and rates.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CollectorDef {
    /// Resource type ids this collector can gather.
    #[serde(default)]
    pub collects: Vec<String>,
    /// Units/second gathered in transport mode while in gather band.
    #[serde(default = "default_transport_rate_per_second")]
    pub transport_rate_per_second: f32,
    /// Units/second gathered in proximity mode while in effective band.
    #[serde(default = "default_proximity_rate_per_second")]
    pub proximity_rate_per_second: f32,
    /// Max carried amount for transport mode before deposit run.
    #[serde(default = "default_carry_capacity")]
    pub carry_capacity: f32,
    /// Optional allowed refinery entity type ids for transport deposits.
    /// Empty means any refinery that accepts the resource.
    #[serde(default)]
    pub deposit_entity_types: Vec<String>,
}

/// M8: Resource source profile for entity types that can be gathered from.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ResourceNodeDef {
    pub resource_type: String,
    pub collection_mode: CollectionMode,
    #[serde(default)]
    pub min_effective_distance: f32,
    #[serde(default = "default_max_effective_distance")]
    pub max_effective_distance: f32,
}

/// M8: Refinery/processor profile.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RefineryDef {
    /// Resource type ids this structure accepts for deposit.
    #[serde(default)]
    pub accepts: Vec<String>,
}

fn default_transport_rate_per_second() -> f32 {
    8.0
}

fn default_proximity_rate_per_second() -> f32 {
    6.0
}

fn default_carry_capacity() -> f32 {
    100.0
}

fn default_max_effective_distance() -> f32 {
    120.0
}

/// Raw deserialization target matching the YAML structure.
#[derive(Deserialize)]
struct ContentFile {
    entity_types: HashMap<String, EntityTypeDef>,
    #[serde(default)]
    resource_types: HashMap<String, ResourceTypeDef>,
}

impl ContentPack {
    /// Load a content pack from a YAML file.
    pub fn load(path: &Path) -> Result<Self> {
        let raw = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read content pack: {}", path.display()))?;
        let file: ContentFile = serde_yaml::from_str(&raw)
            .with_context(|| format!("failed to parse content pack YAML: {}", path.display()))?;

        let content_hash = canonical_hash(&file.entity_types, &file.resource_types)?;

        Ok(Self {
            entity_types: file.entity_types,
            resource_types: file.resource_types,
            content_hash,
        })
    }

    /// Serialize entity and resource type definitions to JSON (for API responses).
    pub fn to_json(&self) -> Result<String> {
        let wrapper = serde_json::json!({
            "entity_types": &self.entity_types,
            "resource_types": &self.resource_types,
        });
        Ok(serde_json::to_string_pretty(&wrapper)?)
    }

    /// Look up an entity type definition, returning `None` for unknown types.
    pub fn get(&self, entity_type_id: &str) -> Option<&EntityTypeDef> {
        self.entity_types.get(entity_type_id)
    }

    /// M7: Look up a resource type definition, returning `None` for unknown types.
    pub fn get_resource_type(&self, resource_type_id: &str) -> Option<&ResourceTypeDef> {
        self.resource_types.get(resource_type_id)
    }
}

/// Compute a deterministic hash from entity and resource type definitions.
///
/// Both maps are serialized to JSON with sorted keys (via `BTreeMap` ordering)
/// and no extra whitespace, then hashed with xxh3-64.
fn canonical_hash(
    entity_types: &HashMap<String, EntityTypeDef>,
    resource_types: &HashMap<String, ResourceTypeDef>,
) -> Result<String> {
    let et: std::collections::BTreeMap<&String, &EntityTypeDef> = entity_types.iter().collect();
    let rt: std::collections::BTreeMap<&String, &ResourceTypeDef> = resource_types.iter().collect();
    let json = serde_json::json!({ "entity_types": et, "resource_types": rt });
    let json_str =
        serde_json::to_string(&json).context("failed to serialize content to canonical JSON")?;
    let hash = xxhash_rust::xxh3::xxh3_64(json_str.as_bytes());
    Ok(format!("{:016x}", hash))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn content_hash_is_deterministic() {
        let mut types = HashMap::new();
        types.insert(
            "worker".into(),
            EntityTypeDef {
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                collector: None,
                resource_node: None,
                refinery: None,
            },
        );
        types.insert(
            "scout".into(),
            EntityTypeDef {
                speed: 140.0,
                stop_radius: 0.5,
                mass: 0.6,
                health: 60.0,
                collector: None,
                resource_node: None,
                refinery: None,
            },
        );

        let empty_resources: HashMap<String, ResourceTypeDef> = HashMap::new();
        let h1 = canonical_hash(&types, &empty_resources).unwrap();
        let h2 = canonical_hash(&types, &empty_resources).unwrap();
        assert_eq!(h1, h2, "hash must be deterministic across calls");
        assert_eq!(h1.len(), 16, "hex xxh3-64 should be 16 chars");
    }

    #[test]
    fn content_hash_ignores_insertion_order() {
        let mut types_a = HashMap::new();
        types_a.insert(
            "worker".into(),
            EntityTypeDef {
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                collector: None,
                resource_node: None,
                refinery: None,
            },
        );
        types_a.insert(
            "scout".into(),
            EntityTypeDef {
                speed: 140.0,
                stop_radius: 0.5,
                mass: 0.6,
                health: 60.0,
                collector: None,
                resource_node: None,
                refinery: None,
            },
        );

        let mut types_b = HashMap::new();
        types_b.insert(
            "scout".into(),
            EntityTypeDef {
                speed: 140.0,
                stop_radius: 0.5,
                mass: 0.6,
                health: 60.0,
                collector: None,
                resource_node: None,
                refinery: None,
            },
        );
        types_b.insert(
            "worker".into(),
            EntityTypeDef {
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                collector: None,
                resource_node: None,
                refinery: None,
            },
        );

        let empty_resources: HashMap<String, ResourceTypeDef> = HashMap::new();
        assert_eq!(
            canonical_hash(&types_a, &empty_resources).unwrap(),
            canonical_hash(&types_b, &empty_resources).unwrap(),
            "hash must be independent of insertion order"
        );
    }

    #[test]
    fn load_entities_yaml() {
        // Resolve the path relative to the workspace root
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let content_path = manifest_dir.join("../../packages/content/entities.yaml");
        if !content_path.exists() {
            // Skip if running in CI without the full workspace
            return;
        }
        let pack = ContentPack::load(&content_path).unwrap();
        assert!(
            pack.entity_types.contains_key("worker"),
            "should have worker type"
        );
        assert!(
            pack.resource_types.get("minerals").is_some(),
            "M7: should have minerals resource type"
        );
        assert!(
            pack.entity_types.contains_key("scout"),
            "should have scout type"
        );
        assert!(
            !pack.content_hash.is_empty(),
            "content hash should be non-empty"
        );

        let worker = pack.get("worker").unwrap();
        assert_eq!(worker.speed, 90.0);
        assert_eq!(worker.stop_radius, 0.75);

        let scout = pack.get("scout").unwrap();
        assert_eq!(scout.speed, 140.0);
    }
}
