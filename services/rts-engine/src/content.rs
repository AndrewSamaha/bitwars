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

/// A loaded content pack with entity type definitions and a content hash.
#[derive(Clone, Debug)]
pub struct ContentPack {
    pub entity_types: HashMap<String, EntityTypeDef>,
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
}

/// Raw deserialization target matching the YAML structure.
#[derive(Deserialize)]
struct ContentFile {
    entity_types: HashMap<String, EntityTypeDef>,
}

impl ContentPack {
    /// Load a content pack from a YAML file.
    pub fn load(path: &Path) -> Result<Self> {
        let raw = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read content pack: {}", path.display()))?;
        let file: ContentFile = serde_yaml::from_str(&raw)
            .with_context(|| format!("failed to parse content pack YAML: {}", path.display()))?;

        let content_hash = canonical_hash(&file.entity_types)?;

        Ok(Self {
            entity_types: file.entity_types,
            content_hash,
        })
    }

    /// Serialize the entity type definitions to JSON (for API responses).
    pub fn to_json(&self) -> Result<String> {
        let wrapper = serde_json::json!({ "entity_types": &self.entity_types });
        Ok(serde_json::to_string_pretty(&wrapper)?)
    }

    /// Look up an entity type definition, returning `None` for unknown types.
    pub fn get(&self, entity_type_id: &str) -> Option<&EntityTypeDef> {
        self.entity_types.get(entity_type_id)
    }
}

/// Compute a deterministic hash from entity type definitions.
///
/// The definitions are serialized to JSON with sorted keys (via
/// `BTreeMap` ordering) and no extra whitespace, then hashed with xxh3-64.
/// This means two YAML files with different formatting but identical data
/// produce the same hash.
fn canonical_hash(entity_types: &HashMap<String, EntityTypeDef>) -> Result<String> {
    // BTreeMap sorts keys deterministically.
    let sorted: std::collections::BTreeMap<&String, &EntityTypeDef> =
        entity_types.iter().collect();
    let json = serde_json::to_string(&sorted)
        .context("failed to serialize entity types to canonical JSON")?;
    let hash = xxhash_rust::xxh3::xxh3_64(json.as_bytes());
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
            EntityTypeDef { speed: 90.0, stop_radius: 0.75, mass: 1.0, health: 100.0 },
        );
        types.insert(
            "scout".into(),
            EntityTypeDef { speed: 140.0, stop_radius: 0.5, mass: 0.6, health: 60.0 },
        );

        let h1 = canonical_hash(&types).unwrap();
        let h2 = canonical_hash(&types).unwrap();
        assert_eq!(h1, h2, "hash must be deterministic across calls");
        assert_eq!(h1.len(), 16, "hex xxh3-64 should be 16 chars");
    }

    #[test]
    fn content_hash_ignores_insertion_order() {
        let mut types_a = HashMap::new();
        types_a.insert(
            "worker".into(),
            EntityTypeDef { speed: 90.0, stop_radius: 0.75, mass: 1.0, health: 100.0 },
        );
        types_a.insert(
            "scout".into(),
            EntityTypeDef { speed: 140.0, stop_radius: 0.5, mass: 0.6, health: 60.0 },
        );

        let mut types_b = HashMap::new();
        types_b.insert(
            "scout".into(),
            EntityTypeDef { speed: 140.0, stop_radius: 0.5, mass: 0.6, health: 60.0 },
        );
        types_b.insert(
            "worker".into(),
            EntityTypeDef { speed: 90.0, stop_radius: 0.75, mass: 1.0, health: 100.0 },
        );

        assert_eq!(
            canonical_hash(&types_a).unwrap(),
            canonical_hash(&types_b).unwrap(),
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
        assert!(pack.entity_types.contains_key("worker"), "should have worker type");
        assert!(pack.entity_types.contains_key("scout"), "should have scout type");
        assert!(!pack.content_hash.is_empty(), "content hash should be non-empty");

        let worker = pack.get("worker").unwrap();
        assert_eq!(worker.speed, 90.0);
        assert_eq!(worker.stop_radius, 0.75);

        let scout = pack.get("scout").unwrap();
        assert_eq!(scout.speed, 140.0);
    }
}
