// services/rts-engine/examples/generate_examples.rs
// Generates example prost-encoded binaries for Snapshot and Delta
// Output: ../../packages/schemas/testdata/{snapshot.bin, delta.bin}

use std::{fs, io::Write, path::PathBuf};

use prost::Message;
use rts_engine::pb::{Delta, Entity, EntityDelta, Snapshot, Vec2};

fn main() -> anyhow::Result<()> {
    // Resolve repo root relative to this file: services/rts-engine/examples/ -> repo root
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let repo_root = manifest_dir
        .parent() // services/rts-engine
        .and_then(|p| p.parent()) // services -> repo root
        .expect("could not resolve repo root from CARGO_MANIFEST_DIR")
        .to_path_buf();

    let out_dir = repo_root.join("packages").join("schemas").join("testdata");
    fs::create_dir_all(&out_dir)?;

    // Example snapshot: tick=42, two entities with positions/velocities
    let e1 = Entity {
        id: 1,
        pos: Some(Vec2 { x: 10.0, y: 20.0 }),
        vel: Some(Vec2 { x: 1.5, y: -0.5 }),
        force: None,
    };
    let e2 = Entity {
        id: 2,
        pos: Some(Vec2 { x: -3.0, y: 7.25 }),
        vel: None,
        force: Some(Vec2 { x: 0.0, y: 0.2 }),
    };
    let snapshot = Snapshot {
        tick: 42,
        entities: vec![e1, e2],
    };

    // Encode with prost::Message
    let mut snapshot_buf = Vec::new();
    snapshot.encode(&mut snapshot_buf)?;

    // Example delta: tick=43, update e1 pos and e2 vel
    let d1 = EntityDelta {
        id: 1,
        pos: Some(Vec2 { x: 11.0, y: 19.5 }),
        vel: None,
        force: None,
    };
    let d2 = EntityDelta {
        id: 2,
        pos: None,
        vel: Some(Vec2 { x: 0.05, y: 0.0 }),
        force: None,
    };
    let delta = Delta {
        tick: 43,
        updates: vec![d1, d2],
    };

    let mut delta_buf = Vec::new();
    delta.encode(&mut delta_buf)?;

    // Write files
    let snapshot_path = out_dir.join("snapshot.bin");
    let delta_path = out_dir.join("delta.bin");

    {
        let mut f = fs::File::create(&snapshot_path)?;
        f.write_all(&snapshot_buf)?;
    }
    {
        let mut f = fs::File::create(&delta_path)?;
        f.write_all(&delta_buf)?;
    }

    println!(
        "Wrote files:\n  {} ({} bytes)\n  {} ({} bytes)",
        snapshot_path.display(),
        snapshot_buf.len(),
        delta_path.display(),
        delta_buf.len()
    );

    Ok(())
}
