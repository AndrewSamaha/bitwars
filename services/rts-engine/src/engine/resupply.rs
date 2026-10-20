//! One-trip loading of physical cargo to absolute inventory targets.
use super::{resource_amount, set_resource_amount, ContentPack, Engine};
use crate::pb;

pub(super) fn valid(
    entities: &[pb::Entity],
    content: &ContentPack,
    order: &pb::ResupplyIntent,
) -> bool {
    let Some(actor) = entities
        .iter()
        .find(|e| e.id == order.entity_id && e.health > 0.0 && e.pos.is_some())
    else {
        return false;
    };
    let Some(depot) = entities
        .iter()
        .find(|e| e.id == order.depot_id && e.health > 0.0 && e.pos.is_some())
    else {
        return false;
    };
    let Some(def) = content.get(&actor.entity_type_id) else {
        return false;
    };
    actor.id != depot.id
        && actor.owner_player_id == depot.owner_player_id
        && def.speed > 0.0
        && def
            .collector
            .as_ref()
            .is_some_and(|c| c.transport_rate_per_second > 0.0)
        && content.get(&depot.entity_type_id).is_some_and(|d| d.depot)
        && !order.target_amounts.is_empty()
        && order.target_amounts.len() <= 64
        && order.target_amounts.values().any(|amount| *amount > 0.0)
        && order.target_amounts.iter().all(|(resource, amount)| {
            amount.is_finite()
                && *amount >= 0.0
                && content.get_resource_type(resource).is_some()
                && def
                    .max_capacity
                    .get(resource)
                    .is_some_and(|capacity| *amount <= *capacity as f64 && *capacity > 0.0)
                && content
                    .get(&depot.entity_type_id)
                    .and_then(|d| d.max_capacity.get(resource))
                    .is_some_and(|capacity| *capacity > 0.0)
        })
}

#[derive(Debug, PartialEq)]
pub(super) enum Progress {
    Moving,
    Waiting(Vec<String>),
    Finished,
    Lost,
}

pub(super) fn advance(
    entities: &mut [pb::Entity],
    content: &ContentPack,
    order: &pb::ResupplyIntent,
    dt: f32,
) -> Progress {
    if !valid(entities, content, order) {
        return Progress::Lost;
    }
    let actor_index = entities
        .iter()
        .position(|e| e.id == order.entity_id)
        .unwrap();
    let depot_index = entities
        .iter()
        .position(|e| e.id == order.depot_id)
        .unwrap();
    let mut actor = entities[actor_index].clone();
    let mut depot = entities[depot_index].clone();
    let def = content.get(&actor.entity_type_id).unwrap();
    let depot_def = content.get(&depot.entity_type_id).unwrap();
    let pos = actor.pos.unwrap();
    let to = depot.pos.unwrap();
    let range = def.hull_radius + depot_def.hull_radius + def.stop_radius.max(1.0);
    if !Engine::reached_contact(&pos, &to, range) {
        if dt > 0.0 {
            let distance = Engine::distance_sq(pos.x, pos.y, to.x, to.y).sqrt();
            Engine::drive_velocity_toward(
                &mut entities[actor_index],
                def.speed.min((distance - range) / dt),
                to.x,
                to.y,
                range,
            );
        }
        return Progress::Moving;
    }
    let mut missing = Vec::new();
    for (resource, target) in &order.target_amounts {
        let current = resource_amount(&actor, resource);
        let available = resource_amount(&depot, resource);
        let loaded = (target - current).max(0.0).min(available);
        if loaded > 0.0 {
            set_resource_amount(&mut actor, resource, current + loaded);
            set_resource_amount(&mut depot, resource, available - loaded);
        }
        if current + loaded + 1e-9 < *target {
            missing.push(resource.clone());
        }
    }
    entities[actor_index].resources = actor.resources;
    entities[actor_index].vel = Some(pb::Vec2 { x: 0.0, y: 0.0 });
    entities[depot_index].resources = depot.resources;
    missing.sort();
    if missing.is_empty() {
        Progress::Finished
    } else {
        Progress::Waiting(missing)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn setup() -> (ContentPack, Vec<pb::Entity>, pb::ResupplyIntent) {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let entity = |id, kind: &str, x| pb::Entity {
            id,
            entity_type_id: kind.into(),
            owner_player_id: "me".into(),
            health: 100.0,
            pos: Some(pb::Vec2 { x, y: 0.0 }),
            ..Default::default()
        };
        let mut entities = vec![entity(1, "worker", 0.0), entity(2, "habitat", 100.0)];
        set_resource_amount(&mut entities[1], "energy", 100.0);
        set_resource_amount(&mut entities[1], "minerals", 100.0);
        let order = pb::ResupplyIntent {
            entity_id: 1,
            depot_id: 2,
            target_amounts: HashMap::from([("energy".into(), 50.0), ("minerals".into(), 40.0)]),
        };
        (content, entities, order)
    }

    #[test]
    fn loads_absolute_targets_conserves_stock_and_does_not_unload_existing_cargo() {
        let (content, mut entities, order) = setup();
        set_resource_amount(&mut entities[0], "minerals", 45.0);
        set_resource_amount(&mut entities[0], "energy", 10.0);
        set_resource_amount(&mut entities[0], "food", 7.0);
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Finished
        );
        assert_eq!(resource_amount(&entities[0], "energy"), 50.0);
        assert_eq!(resource_amount(&entities[1], "energy"), 60.0);
        assert_eq!(resource_amount(&entities[0], "minerals"), 45.0);
        assert_eq!(resource_amount(&entities[1], "minerals"), 100.0);
        assert_eq!(resource_amount(&entities[0], "food"), 7.0);
        let before = entities.clone();
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Finished
        );
        assert_eq!(entities, before);
    }

    #[test]
    fn follows_depot_then_waits_for_missing_stock_and_resumes() {
        let (content, mut entities, order) = setup();
        entities[1].pos.as_mut().unwrap().x = 1000.0;
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Moving
        );
        assert!(entities[0].vel.unwrap().x > 0.0);
        assert_eq!(resource_amount(&entities[0], "energy"), 0.0);
        entities[1].pos.as_mut().unwrap().x = -1000.0;
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Moving
        );
        assert!(entities[0].vel.unwrap().x < 0.0);
        entities[1].pos.as_mut().unwrap().x = 100.0;
        set_resource_amount(&mut entities[1], "energy", 12.0);
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Waiting(vec!["energy".into()])
        );
        assert_eq!(resource_amount(&entities[0], "energy"), 12.0);
        assert_eq!(resource_amount(&entities[0], "minerals"), 40.0);
        set_resource_amount(&mut entities[1], "energy", 100.0);
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Finished
        );
        assert_eq!(resource_amount(&entities[1], "energy"), 62.0);
    }

    #[test]
    fn rejects_invalid_targets_and_lost_or_hostile_depots_without_transferring() {
        let (content, entities, order) = setup();
        for (resource, amount) in [
            ("energy", -1.0),
            ("energy", 51.0),
            ("energy", f64::NAN),
            ("energy", f64::INFINITY),
            ("unknown", 5.0),
        ] {
            let mut invalid = order.clone();
            invalid.target_amounts.insert(resource.into(), amount);
            assert!(!valid(&entities, &content, &invalid));
        }
        for change in 0..4 {
            let mut es = entities.clone();
            match change {
                0 => es[1].health = 0.0,
                1 => es[1].owner_player_id = "enemy".into(),
                2 => es[1].entity_type_id = "factory".into(),
                _ => es[0].entity_type_id = "scout".into(),
            }
            let before = es.clone();
            assert_eq!(advance(&mut es, &content, &order, 0.05), Progress::Lost);
            assert_eq!(es, before);
        }
    }

    #[test]
    fn loaded_worker_can_fund_two_remote_waypoints_from_cargo() {
        let (content, mut entities, mut order) = setup();
        order.target_amounts.insert("minerals".into(), 50.0);
        assert_eq!(
            advance(&mut entities, &content, &order, 0.05),
            Progress::Finished
        );
        entities[0].pos.as_mut().unwrap().x = 50000.0;
        let source = super::super::logistics::funding_source(&entities, &content, 1, "me");
        assert_eq!(source, Some(1));
        let costs = &content.get("waypoint").unwrap().build_cost;
        assert!(super::super::logistics::pay(&mut entities, source, costs));
        assert!(super::super::logistics::pay(&mut entities, source, costs));
        let before = entities.clone();
        assert!(!super::super::logistics::pay(&mut entities, source, costs));
        assert_eq!(entities, before);
        assert_eq!(resource_amount(&entities[0], "energy"), 0.0);
        assert_eq!(resource_amount(&entities[0], "minerals"), 10.0);
    }
}
