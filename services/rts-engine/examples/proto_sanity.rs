use rts_engine::pb;

fn main() {
    let v = pb::Vec2 { x: 1.0, y: -2.5 };
    let e = pb::Entity {
        id: 42,
        pos: Some(v.clone()),
        vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
        force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
    };
    let s = pb::Snapshot { tick: 0, entities: vec![e] };
    println!("OK: {} entities", s.entities.len());
}
