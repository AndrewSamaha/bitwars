use anyhow::Result;
use prost::Message;
use sim::codec::{from_snapshot_proto, to_sorted_json};
use sim::{Engine, IntentEnvelope};
use std::env;
use std::fs;
use std::io::Read;

fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: {} <snapshot_file> [intent_files...]", args[0]);
        std::process::exit(1);
    }

    let snapshot_file = &args[1];
    let intent_files = &args[2..];

    // Load snapshot
    let mut snapshot_data = Vec::new();
    fs::File::open(snapshot_file)?.read_to_end(&mut snapshot_data)?;

    let world_state = from_snapshot_proto(&snapshot_data)?;
    let mut engine = Engine::from_snapshot(world_state);

    println!(
        "Loaded snapshot with {} entities at tick {}",
        engine.state.entities.len(),
        engine.state.tick
    );

    // Process intents
    for intent_file in intent_files {
        let mut intent_data = Vec::new();
        fs::File::open(intent_file)?.read_to_end(&mut intent_data)?;

        // Decode intent envelope
        let envelope = IntentEnvelope::decode(&intent_data[..])?;

        // Apply intent
        if let Err(e) = engine.accept(&envelope) {
            eprintln!("Failed to apply intent from {}: {}", intent_file, e);
            continue;
        }

        println!("Applied intent from {}", intent_file);
    }

    // Run simulation for a few ticks
    for _i in 0..10 {
        engine.tick();
        engine.state.tick += 1;
    }

    // Generate final hash
    let json = to_sorted_json(&engine.state)?;
    let hash = xxhash_rust::xxh3::xxh3_64(json.as_bytes());

    println!("Final state hash: {:x}", hash);
    println!("Final JSON: {}", json);

    Ok(())
}
