//! Physical depot stock, stable local associations, and atomic single-source payments.
use super::{pb, resource_amount, set_resource_amount, EntityTypeDef};
use crate::content::ContentPack;
use std::collections::HashMap;

pub(super) fn eligible_depot(
    actor: &pb::Entity,
    depot: &pb::Entity,
    content: &ContentPack,
) -> bool {
    if depot.health <= 0.0 || actor.owner_player_id != depot.owner_player_id {
        return false;
    }
    let Some(def) = content.get(&depot.entity_type_id).filter(|d| d.depot) else {
        return false;
    };
    let (Some(a), Some(b)) = (actor.pos, depot.pos) else {
        return false;
    };
    (a.x - b.x).powi(2) + (a.y - b.y).powi(2) <= def.depot_range.powi(2)
}

pub(super) fn depot_id(
    entities: &[pb::Entity],
    content: &ContentPack,
    actor: &pb::Entity,
) -> Option<u64> {
    if content.get(&actor.entity_type_id).is_some_and(|d| d.depot) && actor.health > 0.0 {
        return Some(actor.id);
    }
    if let Some(id) = actor
        .supply
        .as_ref()
        .map(|s| s.depot_id)
        .filter(|id| *id != 0)
    {
        if entities
            .iter()
            .any(|d| d.id == id && eligible_depot(actor, d, content))
        {
            return Some(id);
        }
    }
    if !crate::spawn_config::is_player_owner(&actor.owner_player_id) { return None; }
    let pos = actor.pos?;
    entities
        .iter()
        .filter(|d| eligible_depot(actor, d, content))
        .min_by(|a, b| {
            let distance = |e: &pb::Entity| {
                e.pos.map_or(f32::INFINITY, |p| {
                    (p.x - pos.x).powi(2) + (p.y - pos.y).powi(2)
                })
            };
            distance(a)
                .total_cmp(&distance(b))
                .then_with(|| a.id.cmp(&b.id))
        })
        .map(|d| d.id)
}

/// Keep a funded association; otherwise choose the nearest depot that can pay
/// the entire operating bill. Depots continue to fund themselves.
fn operating_depot_id(
    entities: &[pb::Entity],
    content: &ContentPack,
    actor: &pb::Entity,
    costs: &HashMap<String, f32>,
) -> Option<u64> {
    let current = depot_id(entities, content, actor);
    if content.get(&actor.entity_type_id).is_some_and(|def| def.depot)
        || missing_resources(current.and_then(|id| entities.iter().find(|e| e.id == id)), costs).is_empty()
    {
        return current;
    }
    let pos = actor.pos?;
    entities.iter()
        .filter(|depot| eligible_depot(actor, depot, content)
            && missing_resources(Some(depot), costs).is_empty())
        .min_by(|a, b| {
            let distance = |depot: &pb::Entity| {
                let p = depot.pos.unwrap();
                (p.x - pos.x).powi(2) + (p.y - pos.y).powi(2)
            };
            distance(a).total_cmp(&distance(b)).then_with(|| a.id.cmp(&b.id))
        })
        .map(|depot| depot.id)
        .or(current)
}

pub(super) fn refresh_associations(entities: &mut [pb::Entity], content: &ContentPack) {
    let ids: Vec<_> = entities
        .iter()
        .map(|actor| depot_id(entities, content, actor).unwrap_or(0))
        .collect();
    for (actor, id) in entities.iter_mut().zip(ids) {
        if !crate::spawn_config::is_player_owner(&actor.owner_player_id) {
            continue;
        }
        let status = actor.supply.get_or_insert_with(Default::default);
        status.depot_id = id;
    }
}

pub(super) fn funding_source(
    entities: &[pb::Entity],
    content: &ContentPack,
    actor_id: u64,
    player_id: &str,
) -> Option<u64> {
    let actor = entities
        .iter()
        .find(|e| e.id == actor_id && e.owner_player_id == player_id && e.health > 0.0)?;
    depot_id(entities, content, actor).or_else(|| {
        // Only physical cargo carriers can fund remote actions from their cargo.
        content
            .get(&actor.entity_type_id)?
            .collector
            .as_ref()
            .filter(|c| c.transport_rate_per_second > 0.0)
            .map(|_| actor.id)
    })
}

pub(super) fn missing_resources(
    entity: Option<&pb::Entity>,
    costs: &HashMap<String, f32>,
) -> Vec<String> {
    let mut missing: Vec<_> = costs
        .iter()
        .filter(|(r, n)| {
            **n > 0.0 && entity.map_or(0.0, |e| resource_amount(e, r)) + 1e-9 < **n as f64
        })
        .map(|(r, _)| r.clone())
        .collect();
    missing.sort();
    missing
}

pub(super) fn pay(
    entities: &mut [pb::Entity],
    source: Option<u64>,
    costs: &HashMap<String, f32>,
) -> bool {
    if costs.values().any(|n| !n.is_finite() || *n < 0.0) {
        return false;
    }
    let index = source.and_then(|id| entities.iter().position(|e| e.id == id));
    if !missing_resources(index.map(|i| &entities[i]), costs).is_empty() {
        return false;
    }
    let Some(index) = index else {
        return costs.values().all(|n| *n == 0.0);
    };
    for (r, amount) in costs {
        let remaining = (resource_amount(&entities[index], r) - *amount as f64).max(0.0);
        set_resource_amount(&mut entities[index], r, remaining);
    }
    true
}

/// A manual collection destination never falls back to another depot.
pub(super) fn collection_depot_id(
    entities: &[pb::Entity], content: &ContentPack, actor: &pb::Entity,
) -> Option<u64> {
    let assigned = actor.supply.as_ref().map_or(0, |s| s.delivery_depot_id);
    if assigned == 0 { return depot_id(entities, content, actor); }
    entities.iter().find(|d| d.id == assigned && eligible_depot(actor, d, content)).map(|d| d.id)
}

/// Validate both the collector and destination before changing persistent state.
pub(super) fn assign_delivery_depot(
    entities: &mut [pb::Entity], content: &ContentPack, player: &str, actor_id: u64, target_id: u64,
) -> Result<(), pb::LifecycleReason> {
    let actor = entities.iter().find(|e| e.id == actor_id && e.health > 0.0)
        .ok_or(pb::LifecycleReason::InvalidTarget)?;
    if actor.owner_player_id != player { return Err(pb::LifecycleReason::NotOwned); }
    let def = content.get(&actor.entity_type_id).ok_or(pb::LifecycleReason::InvalidTarget)?;
    let collector = def.collector.as_ref().filter(|c| !c.collects.is_empty())
        .ok_or(pb::LifecycleReason::InvalidTarget)?;
    if target_id != 0 {
        let target = entities.iter().find(|e| e.id == target_id && e.health > 0.0 && e.owner_player_id == player)
            .ok_or(pb::LifecycleReason::InvalidTarget)?;
        let target_def = content.get(&target.entity_type_id).filter(|d| d.depot)
            .ok_or(pb::LifecycleReason::InvalidTarget)?;
        if !collector.collects.iter().any(|r| target_def.max_capacity.get(r).is_some_and(|v| *v > 0.0))
            || (collector.transport_rate_per_second <= 0.0 && !eligible_depot(actor, target, content)) {
            return Err(pb::LifecycleReason::InvalidTarget);
        }
    }
    entities.iter_mut().find(|e| e.id == actor_id).unwrap().supply.get_or_insert_with(Default::default).delivery_depot_id = target_id;
    Ok(())
}

/// Collection credits the one associated depot; no intermediate producer balance.
pub(super) fn collect_to_depot(
    entities: &mut [pb::Entity],
    content: &ContentPack,
    actor_id: u64,
    node_id: u64,
    resource: &str,
    requested: f64,
) -> (f64, Option<u64>) {
    let target = entities
        .iter()
        .find(|e| e.id == actor_id)
        .and_then(|actor| collection_depot_id(entities, content, actor));
    let Some(index) = target.and_then(|id| entities.iter().position(|e| e.id == id)) else {
        return (0.0, None);
    };
    let capacity = content
        .get(&entities[index].entity_type_id)
        .and_then(|d| d.max_capacity.get(resource))
        .copied()
        .unwrap_or(0.0) as f64;
    let stock = resource_amount(&entities[index], resource);
    let amount = requested.max(0.0).min((capacity - stock).max(0.0));
    let gathered = entities
        .iter_mut()
        .find(|e| e.id == node_id)
        .map(|e| super::take_from_deposit(e, amount))
        .unwrap_or(0.0);
    set_resource_amount(&mut entities[index], resource, stock + gathered);
    (gathered, target)
}

/// Returns whether this tick made the upfront payment. The checkpoint travels with stock.
pub(super) fn charge_construction(
    entities: &mut [pb::Entity],
    source: Option<u64>,
    actor_id: u64,
    costs: &HashMap<String, f32>,
    intent_id: &[u8],
    progress: f32,
) -> Option<bool> {
    let index = entities.iter().position(|e| e.id == actor_id)?;
    let already_paid = entities[index]
        .supply
        .as_ref()
        .is_some_and(|s| s.paid_intent_id == intent_id);
    if !already_paid && !pay(entities, source, costs) {
        let missing = missing_resources(
            source.and_then(|id| entities.iter().find(|e| e.id == id)),
            costs,
        );
        let status = entities[index].supply.get_or_insert_with(Default::default);
        status.missing_resources = missing;
        status.waiting_for = "construction".into();
        return None;
    }
    let status = entities[index].supply.get_or_insert_with(Default::default);
    status.paid_intent_id = intent_id.to_vec();
    status.construction_progress = progress;
    Some(!already_paid)
}

pub(super) fn operating_costs(def: &EntityTypeDef, dt: f32) -> HashMap<String, f32> {
    let mut costs = HashMap::new();
    for (r, n) in def
        .maintenance_cost_per_minute
        .iter()
        .chain(def.sensor.iter().flat_map(|s| &s.cost_per_minute))
    {
        *costs.entry(r.clone()).or_default() += n * dt / 60.0;
    }
    costs
}

/// Stable ordering makes competing operating payments deterministic.
pub(super) fn operate(
    entities: &mut [pb::Entity],
    content: &ContentPack,
    dt: f32,
    upgrading: &std::collections::HashSet<u64>,
) -> Vec<(String, String, f32)> {
    refresh_associations(entities, content);
    let mut ids: Vec<_> = entities
        .iter()
        .filter(|e| e.health > 0.0 && crate::spawn_config::is_player_owner(&e.owner_player_id))
        .map(|e| e.id)
        .collect();
    ids.sort_unstable();
    let mut spends = Vec::new();
    for id in ids {
        let index = entities.iter().position(|e| e.id == id).unwrap();
        let entity = &entities[index];
        let Some(def) = content.get(&entity.entity_type_id) else {
            continue;
        };
        let owner = entity.owner_player_id.clone();
        let costs = if upgrading.contains(&id) {
            HashMap::new()
        } else {
            operating_costs(def, dt)
        };
        let depot = operating_depot_id(entities, content, entity, &costs);
        // Preserve expedition reserves while a depot can cover the full bill.
        // Otherwise pay atomically from onboard supplies, including outside coverage.
        let source = if missing_resources(
            depot.and_then(|id| entities.iter().find(|e| e.id == id)),
            &costs,
        ).is_empty() {
            depot
        } else if depot.is_none() || missing_resources(Some(entity), &costs).is_empty() {
            Some(entity.id)
        } else {
            depot
        };
        let missing = missing_resources(
            source.and_then(|id| entities.iter().find(|e| e.id == id)),
            &costs,
        );
        let paid = pay(entities, source, &costs);
        let status = entities[index].supply.get_or_insert_with(Default::default);
        status.depot_id = depot.unwrap_or(0);
        status.operational = paid;
        status.missing_resources = missing;
        status.waiting_for = if paid {
            String::new()
        } else {
            "operation".into()
        };
        if paid {
            spends.extend(costs.into_iter().map(|(r, n)| (owner.clone(), r, n)));
        }
    }
    spends
}

#[cfg(test)]
mod tests {
    use super::*;
    fn content() -> ContentPack {
        ContentPack::load(
            &std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap()
    }
    fn entity(id: u64, kind: &str, x: f32) -> pb::Entity {
        pb::Entity {
            id,
            entity_type_id: kind.into(),
            owner_player_id: "player".into(),
            health: 100.0,
            pos: Some(pb::Vec2 { x, y: 0.0 }),
            ..Default::default()
        }
    }
    #[test]
    fn association_sticks_until_invalid_and_never_hops_for_stock() {
        let c = content();
        let mut es = vec![
            entity(1, "worker", 0.0),
            entity(2, "habitat", 100.0),
            entity(3, "habitat", 200.0),
        ];
        refresh_associations(&mut es, &c);
        assert_eq!(es[0].supply.as_ref().unwrap().depot_id, 2);
        es[2].pos.as_mut().unwrap().x = 1.0;
        refresh_associations(&mut es, &c);
        assert_eq!(funding_source(&es, &c, 1, "player"), Some(2));
        es[1].owner_player_id = "enemy".into();
        refresh_associations(&mut es, &c);
        assert_eq!(es[0].supply.as_ref().unwrap().depot_id, 3);
        es[2].pos.as_mut().unwrap().x = 5000.0;
        refresh_associations(&mut es, &c);
        assert_eq!(es[0].supply.as_ref().unwrap().depot_id, 0);
        assert_eq!(funding_source(&es, &c, 1, "player"), Some(1));
    }
    #[test]
    fn payment_cannot_combine_depots_or_cargo_and_is_atomic() {
        let c = content();
        let mut es = vec![
            entity(1, "worker", 0.0),
            entity(2, "habitat", 100.0),
            entity(3, "habitat", 200.0),
        ];
        set_resource_amount(&mut es[0], "minerals", 50.0);
        set_resource_amount(&mut es[1], "energy", 100.0);
        set_resource_amount(&mut es[2], "minerals", 1000.0);
        let costs = HashMap::from([("minerals".into(), 60.0), ("energy".into(), 10.0)]);
        let before = es.clone();
        let source = funding_source(&es, &c, 1, "player");
        assert!(!pay(&mut es, source, &costs));
        assert_eq!(es, before);
        set_resource_amount(&mut es[1], "minerals", 60.0);
        assert!(pay(&mut es, source, &costs));
        assert!(!pay(&mut es, source, &costs));
        assert_eq!(resource_amount(&es[0], "minerals"), 50.0);
    }
    #[test]
    fn association_survives_protobuf_restore_and_depot_does_not_borrow() {
        use prost::Message;
        let c = content();
        let mut es = vec![entity(1, "factory", 0.0), entity(2, "habitat", 100.0)];
        refresh_associations(&mut es, &c);
        let restored = pb::Entity::decode(es[0].encode_to_vec().as_slice()).unwrap();
        assert_eq!(restored, es[0]);
        assert_eq!(depot_id(&es, &c, &es[1]), Some(2));
        es[1].health = 0.0;
        refresh_associations(&mut es, &c);
        assert_eq!(funding_source(&es, &c, 1, "player"), None);
    }
}

#[cfg(test)]
mod operation_tests {
    use super::*;
    #[test]
    fn scout_uses_onboard_supplies_outside_coverage_and_resumes_at_hub() {
        let mut content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let hub = content.entity_types.get_mut("habitat").unwrap();
        hub.maintenance_cost_per_minute.clear();
        hub.sensor.as_mut().unwrap().cost_per_minute.clear();
        // Include a separate sensor cost in the same atomic operating payment.
        content.entity_types.get_mut("scout").unwrap().sensor.as_mut().unwrap()
            .cost_per_minute = HashMap::from([("energy".into(), 1.0)]);
        let entity = |id, kind: &str| pb::Entity {
            id, entity_type_id: kind.into(), owner_player_id: "me".into(), health: 60.0,
            pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }), ..Default::default()
        };
        let mut es = vec![entity(1, "habitat"), entity(2, "scout")];
        for resource in ["energy", "food", "minerals"] {
            set_resource_amount(&mut es[0], resource, 100.0);
            set_resource_amount(&mut es[1], resource, 50.0);
        }
        operate(&mut es, &content, 60.0, &Default::default());
        assert_eq!(resource_amount(&es[1], "energy"), 50.0);
        assert_eq!(resource_amount(&es[0], "energy"), 98.0);
        es[1].pos.as_mut().unwrap().x = 10000.0;
        operate(&mut es, &content, 60.0, &Default::default());
        let status = es[1].supply.as_ref().unwrap();
        assert!(status.operational);
        assert_eq!(status.depot_id, 0);
        assert!(status.missing_resources.is_empty());
        assert_eq!(status.waiting_for, "");
        assert_eq!(resource_amount(&es[1], "energy"), 48.0);
        assert_eq!(resource_amount(&es[1], "food"), 49.0);
        assert_eq!(resource_amount(&es[1], "minerals"), 50.0);
        assert_eq!(resource_amount(&es[0], "energy"), 98.0);
        set_resource_amount(&mut es[1], "food", 0.0);
        operate(&mut es, &content, 60.0, &Default::default());
        assert!(!es[1].supply.as_ref().unwrap().operational);
        assert_eq!(es[1].supply.as_ref().unwrap().missing_resources, vec!["food"]);
        assert_eq!(resource_amount(&es[1], "energy"), 48.0);
        es[1].pos.as_mut().unwrap().x = 0.0;
        operate(&mut es, &content, 60.0, &Default::default());
        assert!(es[1].supply.as_ref().unwrap().operational);
        assert!(es[1].supply.as_ref().unwrap().missing_resources.is_empty());
        assert_eq!(resource_amount(&es[1], "energy"), 48.0);
    }

    #[test]
    fn shortage_is_atomic_does_not_damage_and_resumes_after_delivery() {
        let mut content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let habitat = content.entity_types.get_mut("habitat").unwrap();
        habitat.maintenance_cost_per_minute.clear();
        habitat.sensor.as_mut().unwrap().cost_per_minute.clear();
        let factory = content.entity_types.get_mut("factory").unwrap();
        factory.maintenance_cost_per_minute =
            HashMap::from([("energy".into(), 60.0), ("food".into(), 60.0)]);
        factory.sensor.as_mut().unwrap().cost_per_minute.clear();
        let entity = |id, kind: &str| pb::Entity {
            id,
            entity_type_id: kind.into(),
            owner_player_id: "me".into(),
            health: 100.0,
            pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
            ..Default::default()
        };
        let mut es = vec![entity(1, "habitat"), entity(2, "factory")];
        set_resource_amount(&mut es[0], "energy", 5.0);
        operate(&mut es, &content, 1.0, &Default::default());
        assert!(!es[1].supply.as_ref().unwrap().operational);
        assert_eq!(es[1].health, 100.0);
        assert_eq!(resource_amount(&es[0], "energy"), 5.0);
        assert_eq!(
            es[1].supply.as_ref().unwrap().missing_resources,
            vec!["food"]
        );
        set_resource_amount(&mut es[0], "food", 5.0);
        operate(&mut es, &content, 1.0, &Default::default());
        assert!(es[1].supply.as_ref().unwrap().operational);
        assert_eq!(resource_amount(&es[0], "food"), 4.0);
        assert_eq!(resource_amount(&es[0], "energy"), 4.0);
        assert_eq!(resource_amount(&es[1], "energy"), 0.0);
    }
    #[test]
    fn operating_shortage_pivots_to_stocked_depot_and_keeps_new_association() {
        let mut content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        for kind in ["habitat", "food_storage_container"] {
            let def = content.entity_types.get_mut(kind).unwrap();
            def.maintenance_cost_per_minute.clear();
            def.sensor.as_mut().unwrap().cost_per_minute.clear();
        }
        let factory = content.entity_types.get_mut("military_factory").unwrap();
        factory.maintenance_cost_per_minute.clear();
        factory.sensor.as_mut().unwrap().cost_per_minute = HashMap::from([("energy".into(), 60.0)]);
        let entity = |id, kind: &str, x| pb::Entity {
            id, entity_type_id: kind.into(), owner_player_id: "me".into(), health: 100.0,
            pos: Some(pb::Vec2 { x, y: 0.0 }), ..Default::default()
        };
        let mut es = vec![entity(896, "military_factory", 0.0),
            entity(893, "food_storage_container", 392.0), entity(716, "habitat", 626.0)];
        refresh_associations(&mut es, &content);
        assert_eq!(es[0].supply.as_ref().unwrap().depot_id, 893);
        set_resource_amount(&mut es[2], "energy", 10.0);
        operate(&mut es, &content, 1.0, &Default::default());
        let status = es[0].supply.as_ref().unwrap();
        assert_eq!(status.depot_id, 716);
        assert!(status.operational);
        assert!(status.missing_resources.is_empty());
        assert_eq!(status.waiting_for, "");
        assert_eq!(resource_amount(&es[2], "energy"), 9.0);
        set_resource_amount(&mut es[1], "energy", 5.0);
        operate(&mut es, &content, 1.0, &Default::default());
        assert_eq!(es[0].supply.as_ref().unwrap().depot_id, 716);
        assert_eq!(resource_amount(&es[1], "energy"), 5.0);
    }

    #[test]
    fn operating_fallback_requires_one_eligible_depot_to_cover_all_costs() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let entity = |id, x| pb::Entity {
            id, entity_type_id: "habitat".into(), owner_player_id: "me".into(), health: 100.0,
            pos: Some(pb::Vec2 { x, y: 0.0 }), ..Default::default()
        };
        let mut es = vec![entity(1, 0.0), entity(2, 100.0), entity(3, 200.0),
            entity(4, 300.0), entity(5, 5000.0), entity(6, 250.0)];
        es[0].entity_type_id = "military_factory".into();
        es[0].supply = Some(pb::DepotSupply { depot_id: 2, ..Default::default() });
        let costs = HashMap::from([("energy".into(), 1.0), ("food".into(), 1.0)]);
        set_resource_amount(&mut es[1], "food", 10.0);
        for depot in &mut es[2..] { set_resource_amount(depot, "energy", 10.0); }
        for index in [3, 4, 5] { set_resource_amount(&mut es[index], "food", 10.0); }
        es[3].owner_player_id = "enemy".into();
        es[5].health = 0.0;
        // Partial stocks, hostile, distant, and destroyed depots cannot supply the bill.
        assert_eq!(operating_depot_id(&es, &content, &es[0], &costs), Some(2));
        set_resource_amount(&mut es[2], "food", 10.0);
        assert_eq!(operating_depot_id(&es, &content, &es[0], &costs), Some(3));
        // Storage depots still pay from their own stock.
        assert_eq!(operating_depot_id(&es, &content, &es[1], &costs), Some(2));
    }

    #[test]
    fn mobile_fleet_pauses_without_depots_or_cargo() {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let mut es: Vec<_> = [
            "worker",
            "marine_worker",
            "resource_transport",
            "fighter_v1",
            "heavy_fighter",
            "battleship",
            "scout",
            "scout_long_range",
        ]
        .iter()
        .enumerate()
        .map(|(i, kind)| pb::Entity {
            id: i as u64 + 1,
            entity_type_id: (*kind).into(),
            owner_player_id: "me".into(),
            health: 100.0,
            ..Default::default()
        })
        .collect();
        operate(&mut es, &content, 60.0, &Default::default());
        for e in es {
            assert!(!e.supply.unwrap().operational, "{}", e.entity_type_id);
            assert!(e.resources.is_none());
        }
    }
}

#[cfg(test)]
mod collection_tests {
    use super::*;
    #[test]
    fn generation_requires_local_depot_and_conserves_finite_source() {
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
        let mut es = vec![
            entity(1, "collector_solar", 0.0),
            entity(2, "habitat", 5000.0),
            entity(3, "theta", 0.0),
        ];
        es[2].resource_deposit = Some(pb::ResourceDeposit {
            amount: 10.0,
            remaining: 10.0,
        });
        assert_eq!(
            collect_to_depot(&mut es, &content, 1, 3, "energy", 8.0),
            (0.0, None)
        );
        assert_eq!(es[2].resource_deposit.unwrap().remaining, 10.0);
        es[1].pos.as_mut().unwrap().x = 1000.0;
        set_resource_amount(&mut es[1], "energy", 999.0);
        assert_eq!(
            collect_to_depot(&mut es, &content, 1, 3, "energy", 8.0),
            (1.0, Some(2))
        );
        assert_eq!(resource_amount(&es[0], "energy"), 0.0);
        assert_eq!(es[2].resource_deposit.unwrap().remaining, 9.0);
        assert_eq!(
            collect_to_depot(&mut es, &content, 1, 3, "energy", 8.0).0,
            0.0
        );
        set_resource_amount(&mut es[1], "energy", 0.0);
        assert_eq!(
            collect_to_depot(&mut es, &content, 1, 3, "energy", 50.0).0,
            9.0
        );
        assert_eq!(es[2].resource_deposit.unwrap().remaining, 0.0);
        assert_eq!(resource_amount(&es[1], "energy"), 9.0);
    }
}

#[cfg(test)]
mod construction_tests {
    use super::*;
    use prost::Message;
    #[test]
    fn upfront_payment_and_progress_restore_together_without_double_charging() {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let mut es = vec![pb::Entity {
            id: 1,
            entity_type_id: "habitat".into(),
            owner_player_id: "me".into(),
            health: 100.0,
            ..Default::default()
        }];
        set_resource_amount(&mut es[0], "minerals", 100.0);
        let costs = HashMap::from([("minerals".into(), 60.0)]);
        assert_eq!(
            charge_construction(&mut es, Some(1), 1, &costs, b"first", 0.1),
            Some(true)
        );
        let saved = pb::Snapshot {
            entities: es,
            economy_version: 1,
            ..Default::default()
        };
        let mut restored = pb::Snapshot::decode(saved.encode_to_vec().as_slice())
            .unwrap()
            .entities;
        assert_eq!(
            restored[0].supply.as_ref().unwrap().construction_progress,
            0.1
        );
        operate(&mut restored, &content, 0.01, &Default::default());
        assert_eq!(
            charge_construction(&mut restored, Some(1), 1, &costs, b"first", 0.2),
            Some(false)
        );
        assert!(resource_amount(&restored[0], "minerals") < 40.00001);
        assert_eq!(
            charge_construction(&mut restored, Some(1), 1, &costs, b"replacement", 0.1),
            None
        );
        assert_eq!(
            restored[0].supply.as_ref().unwrap().paid_intent_id,
            b"first"
        );
    }
}

#[cfg(test)]
mod assignment_tests {
    use super::*;
    use prost::Message;

    fn content() -> ContentPack {
        ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap()
    }
    fn entity(id: u64, kind: &str, x: f32) -> pb::Entity {
        pb::Entity { id, entity_type_id: kind.into(), owner_player_id: "me".into(), health: 100.0,
            pos: Some(pb::Vec2 { x, y: 0.0 }), ..Default::default() }
    }

    #[test]
    fn solar_assignment_redirects_generation_preserves_spending_and_survives_restore() {
        let c = content();
        let mut es = vec![entity(1, "collector_solar", 0.0), entity(2, "habitat", 1000.0),
            entity(3, "habitat", 2000.0), entity(4, "theta", 0.0)];
        es[3].resource_deposit = Some(pb::ResourceDeposit { amount: 100.0, remaining: 100.0 });
        refresh_associations(&mut es, &c);
        assign_delivery_depot(&mut es, &c, "me", 1, 3).unwrap();
        refresh_associations(&mut es, &c);
        assert_eq!(depot_id(&es, &c, &es[0]), Some(2));
        assert_eq!(collect_to_depot(&mut es, &c, 1, 4, "energy", 10.0), (10.0, Some(3)));
        assert_eq!(resource_amount(&es[1], "energy"), 0.0);
        es[0] = pb::Entity::decode(es[0].encode_to_vec().as_slice()).unwrap();
        assert_eq!(collection_depot_id(&es, &c, &es[0]), Some(3));
        set_resource_amount(&mut es[2], "energy", 1000.0);
        assert_eq!(collect_to_depot(&mut es, &c, 1, 4, "energy", 10.0), (0.0, Some(3)));
        es[2].pos.as_mut().unwrap().x = 5000.0;
        assert_eq!(collect_to_depot(&mut es, &c, 1, 4, "energy", 10.0), (0.0, None));
        assign_delivery_depot(&mut es, &c, "me", 1, 0).unwrap();
        assert_eq!(collection_depot_id(&es, &c, &es[0]), Some(2));
    }

    #[test]
    fn validates_ownership_capability_and_solar_range_but_allows_remote_worker_delivery() {
        let c = content();
        let mut es = vec![entity(1, "collector_solar", 0.0), entity(2, "habitat", 5000.0),
            entity(3, "worker", 0.0), entity(4, "factory", 0.0)];
        assert_eq!(assign_delivery_depot(&mut es, &c, "other", 1, 2), Err(pb::LifecycleReason::NotOwned));
        assert!(assign_delivery_depot(&mut es, &c, "me", 1, 2).is_err());
        assert!(assign_delivery_depot(&mut es, &c, "me", 3, 4).is_err());
        assert!(assign_delivery_depot(&mut es, &c, "me", 4, 0).is_err());
        assign_delivery_depot(&mut es, &c, "me", 3, 2).unwrap();
        es[1].owner_player_id = "enemy".into();
        assert!(assign_delivery_depot(&mut es, &c, "me", 3, 2).is_err());
        assert_eq!(es[2].supply.as_ref().unwrap().delivery_depot_id, 2);
    }
}
