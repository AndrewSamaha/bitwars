use tracing::info;
use tracing_subscriber::EnvFilter;

mod pb {
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.rs"));
}

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into());
    tracing_subscriber::fmt().with_env_filter(filter).with_target(false).compact().init();
}

fn main() {
    init_tracing();
    let v = pb::Vec2 { x: 1.0, y: -2.5 };
    let e = pb::Entity { id: 42, pos: Some(v.clone()), vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }), force: Some(pb::Vec2 { x: 0.0, y: 0.0 }) };
    let d = pb::EntityDelta { id: 42, pos: Some(v.clone()), vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }), force: Some(pb::Vec2 { x: 0.0, y: 0.0 }) };
    let w = pb::Snapshot { tick: 0, entities: vec![e] };
    let mut delta = pb::Delta { tick: 0, updates: vec![d] };
    delta.tick = 1;
    info!("Protobuf types linked. Example world with {} entity.", w.entities.len());
}
