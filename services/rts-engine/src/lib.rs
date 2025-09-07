pub mod pb {
    include!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/pb/bitwars.rs"));
}

// (Optional) quick unit test that breaks if the schema shape changes
#[cfg(test)]
mod tests {
    use super::pb;
    #[test]
    fn proto_sanity() {
        let v = pb::Vec2 { x: 1.0, y: 2.0 };
        let _e = pb::Entity { id: 1, pos: Some(v), vel: None, force: None };
    }
}
