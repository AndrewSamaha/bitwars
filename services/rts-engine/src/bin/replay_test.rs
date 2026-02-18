//! Named replay test runner: `replay_test <name> [--golden]`
//!
//! Each named test is a scenario with: beginning world state, entities,
//! predefined intents (with accept ticks), and predefined number of ticks.
//! Runs against the in-memory sim engine (no Redis), asserts final world hash.
//! Use --golden to print expected hash and JSON for a new scenario.

use anyhow::{Context, Result};
use sim::codec::to_sorted_json;
use sim::pb::intent_envelope::Payload;
use sim::pb::{Entity, MoveToLocationIntent, Vec2};
use sim::state::WorldState;
use sim::{Engine, IntentEnvelope};
use std::env;
use std::process::ExitCode;

/// Fixed 16 bytes for deterministic replay (UUIDv7-sized)
const FIXED_UUID: [u8; 16] = [0x00; 16];

fn make_move_envelope(
    accept_tick: u64,
    entity_id: u64,
    target_x: f32,
    target_y: f32,
) -> IntentEnvelope {
    IntentEnvelope {
        client_cmd_id: FIXED_UUID.to_vec(),
        intent_id: FIXED_UUID.to_vec(),
        player_id: "replay_test".to_string(),
        client_seq: 1,
        server_tick: accept_tick,
        protocol_version: 1,
        policy: 0, // REPLACE_ACTIVE
        payload: Some(Payload::Move(MoveToLocationIntent {
            entity_id,
            target: Some(Vec2 {
                x: target_x,
                y: target_y,
            }),
            client_cmd_id: String::new(),
            player_id: String::new(),
        })),
    }
}

/// Scenario: beginning state + intents (tick, envelope) + total ticks + golden hash/JSON
struct ReplayScenario {
    name: &'static str,
    initial_state: WorldState,
    intents: Vec<(u64, IntentEnvelope)>,
    total_ticks: u64,
    expected_hash: u64,
    expected_json: &'static str,
}

fn scenarios() -> Vec<ReplayScenario> {
    vec![ReplayScenario {
        name: "two_entities_move",
        initial_state: WorldState::new(
            0,
            vec![
                Entity {
                    id: 1,
                    entity_type_id: String::new(),
                    pos: Some(Vec2 { x: 0.0, y: 0.0 }),
                    vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                    force: Some(Vec2 { x: 0.0, y: 0.0 }),
                },
                Entity {
                    id: 2,
                    entity_type_id: String::new(),
                    pos: Some(Vec2 { x: 5.0, y: 5.0 }),
                    vel: Some(Vec2 { x: 0.0, y: 0.0 }),
                    force: Some(Vec2 { x: 0.0, y: 0.0 }),
                },
            ],
        ),
        intents: vec![(0, make_move_envelope(0, 1, 10.0, 5.0))],
        total_ticks: 20,
        expected_hash: 0x0fa2f2a981aba7b2,
        expected_json: r#"{"entities":[{"force":{"x":0.0,"y":0.0},"id":1,"pos":{"x":10.0,"y":5.0},"vel":{"x":0.0,"y":0.0}},{"force":{"x":0.0,"y":0.0},"id":2,"pos":{"x":5.0,"y":5.0},"vel":{"x":0.0,"y":0.0}}],"tick":20}"#,
    }]
}

fn run_scenario(scenario: &ReplayScenario) -> Result<(u64, String)> {
    let mut engine = Engine::from_snapshot(scenario.initial_state.clone());

    let mut intents = scenario.intents.clone();
    intents.sort_by_key(|(tick, _)| *tick);

    for (accept_tick, envelope) in intents {
        while engine.state.tick < accept_tick {
            engine.tick();
            engine.state.tick += 1;
        }
        engine.accept(&envelope).context("accept intent")?;
    }

    while engine.state.tick < scenario.total_ticks {
        engine.tick();
        engine.state.tick += 1;
    }

    let json = to_sorted_json(&engine.state)?;
    let hash = xxhash_rust::xxh3::xxh3_64(json.as_bytes());
    Ok((hash, json))
}

/// Print first differing entity id + fields between expected and actual JSON.
fn print_minimal_diff(expected_json: &str, actual_json: &str) {
    let expected: serde_json::Value = match serde_json::from_str(expected_json) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("(expected JSON invalid; cannot diff)");
            return;
        }
    };
    let actual: serde_json::Value = match serde_json::from_str(actual_json) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("(actual JSON invalid; cannot diff)");
            return;
        }
    };

    let exp_entities = expected.get("entities").and_then(|e| e.as_array());
    let act_entities = actual.get("entities").and_then(|e| e.as_array());
    if exp_entities.is_none() || act_entities.is_none() {
        eprintln!("Minimal diff: structure differs (missing or invalid 'entities')");
        return;
    }
    let exp_entities = exp_entities.unwrap();
    let act_entities = act_entities.unwrap();

    for (i, (exp_e, act_e)) in exp_entities.iter().zip(act_entities.iter()).enumerate() {
        let exp_id = exp_e.get("id").and_then(|v| v.as_u64());
        let act_id = act_e.get("id").and_then(|v| v.as_u64());
        if exp_id != act_id {
            eprintln!(
                "Minimal diff: entity index {} id differs: expected {:?}, actual {:?}",
                i, exp_id, act_id
            );
            return;
        }
        let entity_id = exp_id.unwrap_or(0);
        for key in ["id", "pos", "vel", "force"] {
            let exp_v = exp_e.get(key);
            let act_v = act_e.get(key);
            if exp_v != act_v {
                eprintln!(
                    "Minimal diff: entity id {} field {:?}: expected {:?}, actual {:?}",
                    entity_id, key, exp_v, act_v
                );
                return;
            }
        }
    }
    if exp_entities.len() != act_entities.len() {
        eprintln!(
            "Minimal diff: entity count differs: expected {}, actual {}",
            exp_entities.len(),
            act_entities.len()
        );
    } else {
        eprintln!("Minimal diff: no per-entity difference found (tick or top-level may differ)");
    }
}

fn main() -> Result<ExitCode> {
    let args: Vec<String> = env::args().collect();
    let golden = args.iter().any(|a| a == "--golden");
    let name = args
        .iter()
        .skip(1)
        .find(|a| !a.starts_with('-'))
        .map(String::as_str);

    let name = match name {
        Some(n) => n,
        None => {
            eprintln!("Usage: replay_test <scenario_name> [--golden]");
            eprintln!("  scenario_name: e.g. two_entities_move");
            eprintln!("  --golden: print expected hash and JSON for pasting into scenario");
            eprintln!(
                "Available scenarios: {}",
                scenarios()
                    .iter()
                    .map(|s| s.name)
                    .collect::<Vec<_>>()
                    .join(", ")
            );
            return Ok(ExitCode::from(1));
        }
    };

    let scenario = scenarios()
        .into_iter()
        .find(|s| s.name == name)
        .context("unknown scenario")?;

    let (hash, json) = run_scenario(&scenario)?;

    if golden {
        println!("expected_hash: 0x{:016x}", hash);
        println!("expected_json: (paste below)");
        println!("{}", json);
        return Ok(ExitCode::SUCCESS);
    }

    if scenario.expected_json.is_empty() || scenario.expected_hash == 0 {
        eprintln!(
            "Scenario {} has no golden data. Run with --golden to generate.",
            name
        );
        return Ok(ExitCode::from(1));
    }

    if hash != scenario.expected_hash {
        eprintln!(
            "Hash mismatch: expected 0x{:016x}, got 0x{:016x}",
            scenario.expected_hash, hash
        );
        print_minimal_diff(scenario.expected_json, &json);
        return Ok(ExitCode::from(1));
    }

    Ok(ExitCode::SUCCESS)
}
