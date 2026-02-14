use anyhow::Result;
use serde_json::{Map, Value};
use crate::state::WorldState;
use crate::pb::Snapshot;
use prost::Message;

/// Convert a protobuf snapshot to a WorldState
pub fn from_snapshot_proto(snapshot: &[u8]) -> Result<WorldState> {
    let snapshot = Snapshot::decode(snapshot)?;
    let ledger = snapshot
        .player_ledgers
        .iter()
        .map(|pl| {
            let resources = pl
                .resources
                .iter()
                .map(|e| (e.resource_type.clone(), e.amount))
                .collect();
            (pl.player_id.clone(), resources)
        })
        .collect();
    Ok(WorldState::new_with_ledger(
        snapshot.tick as u64,
        snapshot.entities,
        ledger,
    ))
}

/// Convert a WorldState to sorted JSON for stable hashing
pub fn to_sorted_json(state: &WorldState) -> Result<String> {
    let mut json = serde_json::to_value(state)?;
    
    // Sort entities by ID for deterministic output
    if let Some(entities) = json.get_mut("entities").and_then(|e| e.as_array_mut()) {
        entities.sort_by(|a, b| {
            let a_id = a.get("id").and_then(|v| v.as_u64()).unwrap_or(0);
            let b_id = b.get("id").and_then(|v| v.as_u64()).unwrap_or(0);
            a_id.cmp(&b_id)
        });
    }
    
    // Sort all object keys recursively
    sort_json_values(&mut json);
    
    Ok(serde_json::to_string(&json)?)
}

/// Recursively sort all object keys in a JSON value
fn sort_json_values(value: &mut Value) {
    match value {
        Value::Object(map) => {
            // Convert to sorted map
            let mut sorted_map = Map::new();
            let mut keys: Vec<String> = map.keys().cloned().collect();
            keys.sort();
            
            for key in keys {
                if let Some(val) = map.remove(&key) {
                    let mut sorted_val = val;
                    sort_json_values(&mut sorted_val);
                    sorted_map.insert(key, sorted_val);
                }
            }
            
            *value = Value::Object(sorted_map);
        }
        Value::Array(arr) => {
            for item in arr.iter_mut() {
                sort_json_values(item);
            }
        }
        _ => {}
    }
}