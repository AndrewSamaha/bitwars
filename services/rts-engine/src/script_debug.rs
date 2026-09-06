//! Bounded, read-only Lua inspection, reusable for any scripting owner.
use mlua::{Table, Value};
use serde_json::{json, Value as Json};
use std::collections::HashSet;

pub fn snapshot(owner: &str, tick: u64, shared: Table, private: Table) -> Json {
    let mut budget = 32_768;
    let mut truncated = false;
    let mut seen = HashSet::new();
    let shared = encode(Value::Table(shared), 0, &mut budget, &mut truncated, &mut seen);
    seen.clear();
    let private = encode(Value::Table(private), 0, &mut budget, &mut truncated, &mut seen);
    json!({"owner_id": owner, "tick": tick, "shared": shared,
        "private_by_entity": private, "truncated": truncated})
}

fn encode(value: Value, depth: usize, budget: &mut usize, truncated: &mut bool,
    seen: &mut HashSet<usize>) -> Json {
    if *budget == 0 || depth > 8 {
        *truncated = true;
        return json!({"omitted": "limit"});
    }
    *budget -= 1;
    match value {
        Value::Nil => Json::Null,
        Value::Boolean(v) => json!(v),
        Value::Integer(v) => json!(v),
        Value::Number(v) => json!(v),
        Value::String(v) => {
            let bytes = v.as_bytes();
            if bytes.len() > 256 { *truncated = true; }
            json!(String::from_utf8_lossy(&bytes[..bytes.len().min(256)]))
        }
        Value::Table(table) => {
            let pointer = table.to_pointer() as usize;
            if !seen.insert(pointer) { return json!({"omitted": "cycle"}); }
            // Entry pairs preserve Lua's distinct numeric and string keys.
            let mut entries = Vec::new();
            for pair in table.pairs::<Value, Value>() {
                if *budget < 2 { *truncated = true; break; }
                match pair {
                    Ok((key, value)) => entries.push(json!([
                        encode(key, depth + 1, budget, truncated, seen),
                        encode(value, depth + 1, budget, truncated, seen)
                    ])),
                    Err(_) => { *truncated = true; break; }
                }
            }
            seen.remove(&pointer);
            json!({"entries": entries})
        }
        other => json!({"omitted": other.type_name()}),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn handles_cycles_and_limits_without_executing_lua() {
        let lua = mlua::Lua::new();
        let table = lua.create_table().unwrap();
        table.set("self", table.clone()).unwrap();
        table.set("large", "x".repeat(1000)).unwrap();
        let result = snapshot("raiders", 12, table, lua.create_table().unwrap());
        assert_eq!(result["truncated"], true);
        assert!(result.to_string().contains("cycle"));
        assert!(result.to_string().len() < 1000);
    }
}
