//! Authoritative discovery survives sensor loss, disconnections and checkpoints.
use std::collections::{BTreeMap, BTreeSet};

use super::state::GameState;
use crate::{
    content::{ContentPack, TechnologyEffectOperation},
    spatial::{SpatialIndex, CELL_SIZE},
    spawn_config::is_player_owner,
};

pub type Discoveries = BTreeMap<String, BTreeSet<u64>>;

pub fn update(state: &mut GameState, content: &ContentPack) {
    let mut points = SpatialIndex::new();
    let mut extended = SpatialIndex::new();
    // Large visibility radii (e.g. stars) would replicate one entity into thousands
    // of cells. Keep these sparse exceptions in a small overflow list instead.
    let mut wide_visibility = Vec::new();
    for (i, entity) in state.entities.iter().enumerate() {
        let Some(pos) = entity.pos.as_ref() else {
            continue;
        };
        points.insert(i, pos.x, pos.y);
        let range = content
            .get(&entity.entity_type_id)
            .and_then(|d| d.visibility_range)
            .unwrap_or(0.0);
        if range > CELL_SIZE {
            wide_visibility.push(i);
        } else if range > 0.0 {
            extended.insert_area(i, pos.x, pos.y, range);
        }
    }
    for source in &state.entities {
        if !is_player_owner(&source.owner_player_id) {
            continue;
        }
        let known = state
            .discovered_entities
            .entry(source.owner_player_id.clone())
            .or_default();
        known.insert(source.id);
        if source.supply.as_ref().is_some_and(|s| !s.operational) {
            continue;
        }
        let Some(pos) = source.pos.as_ref() else {
            continue;
        };
        let mut range = content
            .get(&source.entity_type_id)
            .and_then(|d| d.sensor.as_ref())
            .map_or(0.0, |s| s.range);
        // Match the deterministic technology ordering in published snapshots.
        if let Some(owned) = state.technologies.get(&source.owner_player_id) {
            let mut ids: Vec<_> = owned.iter().collect();
            ids.sort();
            for id in ids {
                let Some(technology) = content.technology(id) else {
                    continue;
                };
                for effect in &technology.effects {
                    if effect.target != "entity.sensor.range" {
                        continue;
                    }
                    range = match effect.operation {
                        TechnologyEffectOperation::Add => range + effect.value,
                        TechnologyEffectOperation::Multiply => range * effect.value,
                        TechnologyEffectOperation::Set => effect.value,
                        TechnologyEffectOperation::Cap => range.min(effect.value),
                    };
                }
            }
        }
        if !range.is_finite() || range <= 0.0 {
            continue;
        }
        let mut candidates = points.within(pos.x, pos.y, range);
        candidates.extend(extended.at(pos.x, pos.y));
        candidates.extend(wide_visibility.iter().copied());
        candidates.sort_unstable();
        candidates.dedup();
        for i in candidates {
            let target = &state.entities[i];
            if known.contains(&target.id) {
                continue;
            }
            let target_pos = target.pos.as_ref().unwrap();
            let target_range = content
                .get(&target.entity_type_id)
                .and_then(|d| d.visibility_range)
                .unwrap_or(0.0);
            let radius = range.max(target_range);
            if (pos.x - target_pos.x).powi(2) + (pos.y - target_pos.y).powi(2) <= radius * radius {
                known.insert(target.id);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pb::{DepotSupply, Entity, Vec2};

    fn entity(id: u64, kind: &str, owner: &str, x: f32) -> Entity {
        Entity {
            id,
            entity_type_id: kind.into(),
            owner_player_id: owner.into(),
            pos: Some(Vec2 { x, y: 0.0 }),
            health: 100.0,
            ..Default::default()
        }
    }

    fn setup(entities: Vec<Entity>) -> (ContentPack, GameState) {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let state = GameState {
            entities,
            tick: 0,
            technologies: Default::default(),
            generation: Default::default(),
            discovered_entities: Default::default(),
        };
        (content, state)
    }

    #[test]
    fn discovery_is_per_player_and_survives_sensor_loss_and_disconnect() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 950.0),
            entity(2, "minerals", "universe", 1050.0),
            entity(3, "minerals", "universe", 2000.0),
            entity(4, "worker", "bob", 2400.0),
        ]);
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
        assert!(!state.discovered_entities["alice"].contains(&3));
        assert!(state.discovered_entities["bob"].contains(&3));
        state.entities.retain(|e| e.owner_player_id == "universe");
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
        assert!(!state.discovered_entities["alice"].contains(&3));
    }

    #[test]
    fn extended_target_visibility_uses_exact_distance_and_requires_operational_sensor() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "star_yellow", "universe", 39999.0),
            entity(3, "star_yellow", "universe", 40001.0),
        ]);
        state.entities[0].supply = Some(DepotSupply {
            operational: false,
            ..Default::default()
        });
        update(&mut state, &content);
        assert!(!state.discovered_entities["alice"].contains(&2));
        state.entities[0].supply.as_mut().unwrap().operational = true;
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
        assert!(!state.discovered_entities["alice"].contains(&3));
    }

    #[test]
    fn researched_sensor_range_discovers_additional_sources() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "planet_blue", "universe", 450.0),
        ]);
        update(&mut state, &content);
        assert!(!state.discovered_entities["alice"].contains(&2));
        state
            .technologies
            .insert("alice".into(), ["neutrino_sensors".into()].into());
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
    }
}

#[cfg(test)]
mod index_comparison_tests {
    use super::*;
    use crate::pb::{Entity, Vec2};

    #[test]
    fn indexed_discovery_matches_full_world_visibility_scan() {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let entities = (0..600)
            .map(|i| Entity {
                id: i + 1,
                owner_player_id: if i < 12 {
                    format!("player{}", i % 3)
                } else {
                    "universe".into()
                },
                entity_type_id: if i < 12 {
                    "habitat"
                } else {
                    ["minerals", "star_yellow", "planet_blue"][i as usize % 3]
                }
                .into(),
                pos: Some(Vec2 {
                    x: ((i * 7919) % 100003) as f32 - 50000.0,
                    y: ((i * 3571) % 100003) as f32 - 50000.0,
                }),
                health: 100.0,
                ..Default::default()
            })
            .collect::<Vec<_>>();
        let mut expected = Discoveries::new();
        for player in ["player0", "player1", "player2"] {
            let sensors: Vec<_> = entities
                .iter()
                .filter(|e| e.owner_player_id == player)
                .collect();
            for target in &entities {
                let target_range = content
                    .get(&target.entity_type_id)
                    .unwrap()
                    .visibility_range
                    .unwrap_or(0.0);
                if target.owner_player_id == player
                    || sensors.iter().any(|sensor| {
                        let a = sensor.pos.as_ref().unwrap();
                        let b = target.pos.as_ref().unwrap();
                        let radius = content
                            .get(&sensor.entity_type_id)
                            .unwrap()
                            .sensor
                            .as_ref()
                            .unwrap()
                            .range
                            .max(target_range);
                        (a.x - b.x).hypot(a.y - b.y) <= radius
                    })
                {
                    expected.entry(player.into()).or_default().insert(target.id);
                }
            }
        }
        let mut state = GameState {
            entities,
            tick: 0,
            technologies: Default::default(),
            generation: Default::default(),
            discovered_entities: Default::default(),
        };
        update(&mut state, &content);
        assert_eq!(state.discovered_entities, expected);
    }
}
