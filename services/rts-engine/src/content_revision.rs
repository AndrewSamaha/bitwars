//! Immutable authored manifests shared with the editor publisher.
use std::{collections::BTreeMap, path::{Path, PathBuf}};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use crate::content::ContentPack;

pub const ASSET_FILES: &[&str] = &["idle.png", "gray.png", "primary.png", "invariants.png", "invariant-colors.png", "player-colors.json"];

pub fn valid_id(id: &str) -> bool {
    id.as_bytes().first().is_some_and(u8::is_ascii_lowercase)
        && id.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_')
}
pub fn valid_hash(hash: &str) -> bool {
    hash.len() == 64 && hash.bytes().all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
}
pub fn hash_bytes(bytes: &[u8]) -> String { hex::encode(Sha256::digest(bytes)) }

/// ECMAScript number spelling matters: serde otherwise writes 1.0 where JS writes 1.
pub fn canonical_json(value: &Value) -> Result<String> {
    fn append(value: &Value, out: &mut String) -> Result<()> {
        match value {
            Value::Object(map) => {
                out.push('{');
                let mut sorted: Vec<_> = map.iter().collect();
                sorted.sort_unstable_by(|(left, _), (right, _)| left.encode_utf16().cmp(right.encode_utf16()));
                for (index, (key, value)) in sorted.into_iter().enumerate() {
                    if index > 0 { out.push(','); }
                    out.push_str(&serde_json::to_string(key)?); out.push(':'); append(value, out)?;
                }
                out.push('}');
            }
            Value::Array(values) => {
                out.push('[');
                for (index, value) in values.iter().enumerate() {
                    if index > 0 { out.push(','); } append(value, out)?;
                }
                out.push(']');
            }
            Value::Number(number) => {
                let value = number.as_f64().context("non-finite manifest number")?;
                anyhow::ensure!(value.is_finite(), "non-finite manifest number");
                out.push_str(ryu_js::Buffer::new().format(value));
            }
            _ => out.push_str(&serde_json::to_string(value)?),
        }
        Ok(())
    }
    let mut out = String::new(); append(value, &mut out)?; Ok(out)
}
pub fn hash_json(value: &Value) -> Result<String> { Ok(hash_bytes(canonical_json(value)?.as_bytes())) }

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EntityManifest {
    pub definition_hash: String,
    pub asset_hash: Option<String>,
    pub files: BTreeMap<String, String>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Manifest {
    pub format_version: u32,
    pub definitions: Value,
    pub entities: BTreeMap<String, EntityManifest>,
}
#[derive(Clone, Debug)]
pub struct Revision {
    pub manifest: Manifest,
    pub pack: ContentPack,
}

fn immutable_write(path: &Path, bytes: &[u8]) -> Result<()> {
    use std::io::Write;
    if path.exists() {
        anyhow::ensure!(std::fs::read(path)? == bytes, "immutable content collision: {}", path.display());
        return Ok(());
    }
    std::fs::create_dir_all(path.parent().context("missing immutable parent")?)?;
    let temp = path.with_extension(format!("tmp-{}", uuid::Uuid::now_v7()));
    let result = (|| -> Result<()> {
        let mut file = std::fs::OpenOptions::new().write(true).create_new(true).open(&temp)?;
        file.write_all(bytes)?; file.sync_all()?; drop(file);
        match std::fs::hard_link(&temp, path) {
            Ok(()) => Ok(()),
            Err(error) if path.exists() => {
                anyhow::ensure!(std::fs::read(path)? == bytes, "immutable content collision: {error}"); Ok(())
            }
            Err(error) => Err(error.into()),
        }
    })();
    let _ = std::fs::remove_file(temp);
    result
}

pub fn revision_root(content_path: &Path) -> PathBuf {
    content_path.parent().unwrap_or(Path::new(".")).join(".revisions")
}
impl Revision {
    /// Snapshot authored YAML and allowed asset bytes before computing any hashes.
    pub fn bootstrap(content_path: &Path) -> Result<Self> {
        let yaml = std::fs::read(content_path)?;
        let mut definitions: Value = serde_yaml::from_slice(&yaml)?;
        let map = definitions.as_object_mut().context("content definitions must be an object")?;
        for key in ["resource_types", "technologies"] { map.entry(key).or_insert_with(|| serde_json::json!({})); }
        let pack = ContentPack::from_definitions(definitions.clone())?;
        let root = revision_root(content_path);
        let assets = content_path.parent().unwrap_or(Path::new(".")).join("assets");
        let fallback = content_path.parent().unwrap_or(Path::new("."))
            .join("../../apps/web/public/assets/corvette");
        let mut ids: Vec<String> = pack.entity_types.keys().cloned().collect();
        if !ids.iter().any(|id| id == "corvette") { ids.push("corvette".into()); }
        let mut entities = BTreeMap::new();
        let mut originals = vec![(content_path.to_path_buf(), Some(hash_bytes(&yaml)))];
        for id in ids {
            anyhow::ensure!(valid_id(&id), "invalid entity ID {id}");
            let mut files = BTreeMap::new();
            let mut contents = Vec::new();
            let entity_assets = if id == "corvette" && !assets.join(&id).join("idle.png").is_file() {
                fallback.clone()
            } else { assets.join(&id) };
            for filename in ASSET_FILES {
                let path = entity_assets.join(filename);
                match std::fs::read(&path) {
                    // Assets must be regular files confined to the authored bundle root.
                    Ok(bytes) => {
                        let resolved = std::fs::canonicalize(&path)?;
                        let allowed_root = if id == "corvette" && entity_assets == fallback {
                            fallback.parent().context("missing fallback asset root")?
                        } else { assets.as_path() };
                        let resolved_root = std::fs::canonicalize(allowed_root)?;
                        anyhow::ensure!(resolved.starts_with(&resolved_root) && resolved.is_file(),
                            "asset escapes bundle root: {}", path.display());
                        validate_asset(filename, &bytes)?;
                        let file_hash = hash_bytes(&bytes);
                        files.insert((*filename).to_string(), file_hash.clone());
                        originals.push((path, Some(file_hash))); contents.push((*filename, bytes));
                    }
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => { originals.push((path, None)); }
                    Err(error) => return Err(error.into()),
                }
            }
            if !pack.entity_types.contains_key(&id) && files.is_empty() { continue; }
            let asset_hash = if files.is_empty() { None } else { Some(hash_json(&serde_json::to_value(&files)?)?) };
            if let Some(hash) = &asset_hash {
                for (filename, bytes) in contents { immutable_write(&root.join("bundles").join(&id).join(hash).join(filename), &bytes)?; }
            }
            let definition_hash = definitions["entity_types"].get(&id).map(hash_json).transpose()?.unwrap_or_default();
            entities.insert(id, EntityManifest { definition_hash, asset_hash, files });
        }
        for (path, expected) in originals {
            let current = match std::fs::read(&path) {
                Ok(bytes) => Some(hash_bytes(&bytes)),
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
                Err(error) => return Err(error.into()),
            };
            anyhow::ensure!(current == expected, "source changed while staging: {}", path.display());
        }
        let manifest = Manifest { format_version: 1, definitions, entities };
        let value = serde_json::to_value(&manifest)?;
        let revision = hash_json(&value)?;
        immutable_write(&root.join(&revision).join("manifest.json"), canonical_json(&value)?.as_bytes())?;
        Self::load(&root, &revision)
    }

    pub fn load(root: &Path, revision: &str) -> Result<Self> {
        anyhow::ensure!(valid_hash(revision), "invalid candidate revision");
        let bytes = std::fs::read(root.join(revision).join("manifest.json")).context("retained manifest unavailable")?;
        let value: Value = serde_json::from_slice(&bytes)?;
        anyhow::ensure!(hash_json(&value)? == revision, "manifest revision hash mismatch");
        let manifest: Manifest = serde_json::from_value(value)?;
        anyhow::ensure!(manifest.format_version == 1, "unsupported manifest format");
        let mut pack = ContentPack::from_definitions(manifest.definitions.clone())?;
        for id in pack.entity_types.keys() { anyhow::ensure!(manifest.entities.contains_key(id), "missing manifest entity {id}"); }
        for (id, entry) in &manifest.entities {
            anyhow::ensure!(valid_id(id), "invalid entity ID {id}");
            let expected = manifest.definitions["entity_types"].get(id).map(hash_json).transpose()?;
            anyhow::ensure!(expected.as_deref() == Some(entry.definition_hash.as_str())
                || (id == "corvette" && expected.is_none() && entry.definition_hash.is_empty()), "definition hash mismatch for {id}");
            match &entry.asset_hash {
                None => anyhow::ensure!(entry.files.is_empty(), "unhashed assets for {id}"),
                Some(hash) => {
                    anyhow::ensure!(valid_hash(hash) && !entry.files.is_empty() && hash_json(&serde_json::to_value(&entry.files)?)? == *hash,
                        "asset bundle hash mismatch for {id}");
                    for (filename, expected) in &entry.files {
                        anyhow::ensure!(ASSET_FILES.contains(&filename.as_str()) && valid_hash(expected), "invalid asset entry {id}/{filename}");
                        let bytes = std::fs::read(root.join("bundles").join(id).join(hash).join(filename))
                            .with_context(|| format!("missing immutable asset {id}/{filename}"))?;
                        anyhow::ensure!(hash_bytes(&bytes) == *expected, "asset hash mismatch for {id}/{filename}");
                        validate_asset(filename, &bytes)?;
                    }
                }
            }
        }
        pack.content_hash = revision.into();
        Ok(Self { manifest, pack })
    }
    pub fn payload(&self, reload_id: &str, tick: u64) -> Value {
        serde_json::json!({"content_version": self.pack.content_hash, "content_revision": self.pack.content_hash,
            "entity_types": self.pack.entity_types, "resource_types": self.pack.resource_types,
            "technologies": self.pack.technologies, "entities": self.manifest.entities,
            "reload_id": reload_id, "activated_tick": tick})
    }
}

fn validate_asset(filename: &str, bytes: &[u8]) -> Result<()> {
    if filename == "player-colors.json" {
        let value: Value = serde_json::from_slice(bytes).context("invalid player-colors.json")?;
        anyhow::ensure!(value.is_object(), "player-colors.json must contain a mapping");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn canonical_hash_matches_javascript_numbers_and_sorted_objects() {
        let value: Value = serde_json::from_str(r#"{"z":1.0,"a":{"b":1e-7,"a":1e21},"n":-0.0}"#).unwrap();
        assert_eq!(canonical_json(&value).unwrap(), r#"{"a":{"a":1e+21,"b":1e-7},"n":0,"z":1}"#);
        assert_eq!(hash_bytes(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }
    #[test]
    fn bootstrap_is_repeatable_and_retained_revision_ignores_disk_changes() {
        let source = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../packages/content/entities.yaml");
        let temp = std::env::temp_dir().join(format!("bitwars-revision-{}", uuid::Uuid::now_v7()));
        std::fs::create_dir_all(&temp).unwrap();
        let path = temp.join("entities.yaml");
        std::fs::copy(&source, &path).unwrap();
        std::fs::create_dir_all(temp.join("assets/worker")).unwrap();
        std::fs::copy(source.parent().unwrap().join("assets/worker/primary.png"), temp.join("assets/worker/primary.png")).unwrap();
        let first = Revision::bootstrap(&path).unwrap();
        let second = Revision::bootstrap(&path).unwrap();
        assert_eq!(first.pack.content_hash, second.pack.content_hash);
        std::fs::write(&path, "invalid: content").unwrap();
        let restored = Revision::load(&revision_root(&path), &first.pack.content_hash).unwrap();
        assert_eq!(restored.pack.entity_types.len(), first.pack.entity_types.len());
        let bundle = first.manifest.entities["worker"].asset_hash.as_ref().unwrap();
        let immutable_asset = revision_root(&path).join("bundles/worker").join(bundle).join("primary.png");
        let original_asset = std::fs::read(&immutable_asset).unwrap();
        std::fs::write(&immutable_asset, b"corrupted").unwrap();
        assert!(Revision::load(&revision_root(&path), &first.pack.content_hash).is_err());
        std::fs::write(immutable_asset, original_asset).unwrap();
        let manifest = revision_root(&path).join(&first.pack.content_hash).join("manifest.json");
        std::fs::write(manifest, "{}").unwrap();
        assert!(Revision::load(&revision_root(&path), &first.pack.content_hash).is_err());
        std::fs::remove_dir_all(temp).unwrap();
    }
}
