use rts_engine::pb;

fn main() {
    let v = pb::Vec2 { x: 1.0, y: -2.5 };
    let e = pb::Entity {
        id: 42,
        entity_type_id: String::new(),
        pos: Some(v.clone()),
        vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
        force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
        owner_player_id: String::new(),
    };
    let s = pb::Snapshot {
        tick: 0,
        entities: vec![e],
        player_ledgers: vec![],
    };
    println!("OK: {} entities", s.entities.len());
}
