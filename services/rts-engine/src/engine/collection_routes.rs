//! Execution of client-planned collection routes. Legality is not a safety verdict.
use super::{
    collection_entity, collection_entity_mut, deposit_collection_inventory,
    gather_transport_inventory, resource_amount, CollectionMode, ContentPack, Engine,
    COLLECTOR_ACTIVITY_DELIVERING, COLLECTOR_ACTIVITY_GATHERING,
    COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF, COLLECTOR_ACTIVITY_MOVING_TO_SOURCE,
    COLLECTOR_ACTIVITY_WAITING_FOR_TURN, DEPOSIT_DISTANCE,
};
use crate::pb;
use std::collections::{BTreeSet, HashMap, HashSet};

const MAX_WAYPOINTS: usize = 256;
const BLOCKED: &str = "routing_blocked";

fn positioned(entity: &pb::Entity) -> bool {
    entity.health > 0.0
        && entity.pos.is_some_and(|p| p.x.is_finite() && p.y.is_finite())
}

fn within_hub(hub: &pb::Entity, container: &pb::Entity, range: f32) -> bool {
    let (Some(h), Some(c)) = (hub.pos, container.pos) else { return false; };
    range > 0.0 && range.is_finite()
        && Engine::distance_sq(h.x, h.y, c.x, c.y) <= range * range
}

fn assigned_group_allows(
    entities: &[pb::Entity], content: &ContentPack, actor: &pb::Entity,
    anchor: &pb::Entity, depot: &pb::Entity, resource: &str,
) -> bool {
    if anchor.id == depot.id { return true; }
    let Some(anchor_def) = content.get(&anchor.entity_type_id) else { return false; };
    let hub = if anchor_def.shareable_with_hub.is_empty() {
        anchor
    } else {
        let hubs = entities.iter().filter(|entity| entity.owner_player_id == actor.owner_player_id
            && positioned(entity))
            .filter_map(|entity| content.get(&entity.entity_type_id)
                .filter(|def| def.depot && def.shareable_with_hub.is_empty()
                    && within_hub(entity, anchor, def.depot_range))
                .map(|_| entity));
        let preferred = actor.supply.as_ref().map_or(0, |supply| supply.depot_id);
        let anchor_pos = anchor.pos.unwrap();
        let Some(hub) = hubs.min_by(|a, b| {
            (a.id != preferred).cmp(&(b.id != preferred))
                .then_with(|| {
                    let a_pos = a.pos.unwrap();
                    let b_pos = b.pos.unwrap();
                    Engine::distance_sq(a_pos.x, a_pos.y, anchor_pos.x, anchor_pos.y)
                        .total_cmp(&Engine::distance_sq(b_pos.x, b_pos.y, anchor_pos.x, anchor_pos.y))
                })
                .then_with(|| a.id.cmp(&b.id))
        }) else { return false; };
        hub
    };
    if depot.id == hub.id { return true; }
    content.get(&depot.entity_type_id).is_some_and(|def|
        def.shareable_with_hub.iter().any(|shared| shared == resource)
            && within_hub(hub, depot, content.get(&hub.entity_type_id).unwrap().depot_range))
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) struct RouteRejection {
    pub code: &'static str,
    pub source_entity_id: u64,
    pub depot_entity_id: u64,
}

impl RouteRejection {
    fn new(code: &'static str, source_entity_id: u64, depot_entity_id: u64) -> Self {
        Self { code, source_entity_id, depot_entity_id }
    }
}

/// Checks ownership, discovery, content compatibility and bounded waypoint IDs only.
/// Deliberately does not inspect radiation, enemies, segment geometry or hazards.
pub(super) fn valid(
    entities: &[pb::Entity],
    by_id: &HashMap<u64, usize>,
    content: &ContentPack,
    known: &BTreeSet<u64>,
    upgrading: &HashSet<u64>,
    entity_id: u64,
    resource_type_id: &str,
    nearest_compatible: bool,
    plan: &pb::CollectionTravelPlan,
) -> bool {
    diagnose(entities, by_id, content, known, upgrading, entity_id, resource_type_id, nearest_compatible, plan).is_ok()
}

pub(super) fn diagnose(
    entities: &[pb::Entity],
    by_id: &HashMap<u64, usize>,
    content: &ContentPack,
    known: &BTreeSet<u64>,
    upgrading: &HashSet<u64>,
    entity_id: u64,
    resource_type_id: &str,
    nearest_compatible: bool,
    plan: &pb::CollectionTravelPlan,
) -> Result<(), RouteRejection> {
    let source_id = if known.contains(&plan.source_entity_id) { plan.source_entity_id } else { 0 };
    let actor = collection_entity(entities, entity_id, by_id);
    let depot_id = actor.and_then(|actor| collection_entity(entities, plan.depot_entity_id, by_id)
        .filter(|depot| depot.owner_player_id == actor.owner_player_id)).map_or(0, |depot| depot.id);
    let reject = |code| RouteRejection::new(code, source_id, depot_id);
    if plan.waypoint_ids.len() > MAX_WAYPOINTS || plan.initial_waypoint_ids.len() > MAX_WAYPOINTS {
        return Err(reject("invalid_waypoint"));
    }
    let Some(actor) = actor.filter(|entity| positioned(entity)) else { return Err(reject("collector_unavailable")); };
    let Some(actor_def) = content.get(&actor.entity_type_id) else { return Err(reject("collector_unavailable")); };
    let Some(collector) = actor_def.collector.as_ref().filter(|c| c.transport_rate_per_second > 0.0) else {
        return Err(reject("collector_incompatible"));
    };
    if source_id == 0 { return Err(reject("source_undiscovered")); }
    let Some(source) = collection_entity(entities, source_id, by_id).filter(|e| positioned(e)) else {
        return Err(reject("source_unavailable"));
    };
    let Some(node) = content.get(&source.entity_type_id).and_then(|d| d.resource_node.as_ref()) else {
        return Err(reject("source_incompatible"));
    };
    let Some(depot) = collection_entity(entities, plan.depot_entity_id, by_id)
        .filter(|entity| entity.owner_player_id == actor.owner_player_id) else { return Err(reject("depot_unavailable")); };
    if !positioned(depot) || upgrading.contains(&depot.id) {
        return Err(reject("depot_unavailable"));
    }
    let Some(depot_def) = content.get(&depot.entity_type_id) else { return Err(reject("depot_incompatible")); };
    if let Some(anchor_id) = actor.supply.as_ref().map(|supply| supply.delivery_depot_id).filter(|id| *id != 0) {
        let Some(anchor) = collection_entity(entities, anchor_id, by_id)
            .filter(|entity| entity.owner_player_id == actor.owner_player_id && positioned(entity))
            .filter(|entity| content.get(&entity.entity_type_id).is_some_and(|def| def.depot))
        else { return Err(reject("depot_unavailable")); };
        if !assigned_group_allows(entities, content, actor, anchor, depot, &node.resource_type) {
            return Err(reject("depot_outside_assignment"));
        }
    }
    if actor.id == source.id || actor.id == depot.id || source.id == depot.id {
        return Err(reject("invalid_route"));
    }
    if actor_def.speed <= 0.0 { return Err(reject("collector_incompatible")); }
    if upgrading.contains(&source.id) { return Err(reject("source_unavailable")); }
    if node.collection_mode != CollectionMode::Transport { return Err(reject("source_incompatible")); }
    if !source.resource_deposit.is_none_or(|deposit| deposit.remaining > f64::EPSILON) {
        return Err(reject("source_depleted"));
    }
    if !collector.collects.contains(&node.resource_type)
        || !actor_def.max_capacity.get(&node.resource_type).is_some_and(|n| *n > 0.0)
        || !((nearest_compatible && resource_type_id.is_empty())
            || (!nearest_compatible && resource_type_id == node.resource_type)) {
        return Err(reject("resource_incompatible"));
    }
    if !depot_def.depot || !depot_def.max_capacity.get(&node.resource_type).is_some_and(|n| *n > 0.0) {
        return Err(reject("depot_incompatible"));
    }
    if !plan.waypoint_ids.iter().chain(&plan.initial_waypoint_ids).all(|id| {
        collection_entity(entities, *id, by_id).is_some_and(|waypoint| {
            positioned(waypoint) && waypoint.entity_type_id == "waypoint"
                && waypoint.owner_player_id == actor.owner_player_id
        })
    }) {
        return Err(reject("invalid_waypoint"));
    }
    Ok(())
}

fn hold(entity: &mut pb::Entity) {
    entity.vel = Some(pb::Vec2 { x: 0.0, y: 0.0 });
}

/// Cap each physics step at the target; waypoint traversal never uses hull contact
/// or an entity stop radius, so turns cannot skip a corner of the supplied route.
fn approach(entity: &mut pb::Entity, speed: f32, target: pb::Vec2, range: f32, dt: f32) -> bool {
    let position = entity.pos.unwrap();
    if Engine::reached_contact(&position, &target, range) {
        if range == 0.0 { entity.pos = Some(target); }
        hold(entity);
        return true;
    }
    if dt <= 0.0 { hold(entity); return false; }
    let distance = Engine::distance_sq(position.x, position.y, target.x, target.y).sqrt();
    Engine::drive_velocity_toward(entity, speed.min((distance - range).max(0.0) / dt), target.x, target.y, range);
    false
}

fn next_leg(state: &mut pb::CollectState, to_depot: bool) {
    state.initial_leg_complete = true;
    state.returning_to_depot = to_depot;
    state.next_waypoint_index = 0;
}

/// Advance a maintained planned order without selecting replacement endpoints.
/// All route entities are revalidated, including waypoints not currently targeted.
pub(super) fn advance(
    entities: &mut [pb::Entity],
    by_id: &HashMap<u64, usize>,
    content: &ContentPack,
    known: &BTreeSet<u64>,
    upgrading: &HashSet<u64>,
    state: &mut pb::CollectState,
    gathering_by_node: &mut HashMap<u64, u32>,
    dt: f32,
) -> (&'static str, f32) {
    let valid_route = state.travel_plan.as_ref().is_some_and(|plan| valid(entities, by_id, content, known, upgrading,
        state.entity_id, &state.resource_type_id, state.nearest_compatible, plan));
    if state.route_checkpoint_missing || !valid_route {
        if let Some(actor) = collection_entity_mut(entities, state.entity_id, by_id) { hold(actor); }
        return (BLOCKED, 0.0);
    }
    let plan = state.travel_plan.as_ref().unwrap();
    let actor_index = by_id[&state.entity_id];
    let source_index = by_id[&plan.source_entity_id];
    let depot_index = by_id[&plan.depot_entity_id];
    let actor_def = content.get(&entities[actor_index].entity_type_id).unwrap();
    let collector = actor_def.collector.as_ref().unwrap();
    let node = content.get(&entities[source_index].entity_type_id).unwrap().resource_node.as_ref().unwrap();
    let to_depot = if state.initial_leg_complete { state.returning_to_depot } else { plan.initial_to_depot };
    let waypoints = if state.initial_leg_complete { &plan.waypoint_ids } else { &plan.initial_waypoint_ids };
    let moving = if to_depot { COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF } else { COLLECTOR_ACTIVITY_MOVING_TO_SOURCE };
    if state.next_waypoint_index as usize > waypoints.len() {
        hold(&mut entities[actor_index]);
        return (BLOCKED, 0.0);
    }
    while (state.next_waypoint_index as usize) < waypoints.len() {
        let index = state.next_waypoint_index as usize;
        let id = if state.initial_leg_complete && to_depot { waypoints[waypoints.len() - index - 1] } else { waypoints[index] };
        let target = entities[by_id[&id]].pos.unwrap();
        if !approach(&mut entities[actor_index], actor_def.speed, target, 0.0, dt) { return (moving, 0.0); }
        state.next_waypoint_index += 1;
    }
    if to_depot {
        let destination = entities[depot_index].pos.unwrap();
        if !approach(&mut entities[actor_index], actor_def.speed, destination, DEPOSIT_DISTANCE, dt) { return (moving, 0.0); }
        // Split borrows instead of cloning the actor inventory every delivery tick.
        let (actor, depot) = if actor_index < depot_index {
            let (left, right) = entities.split_at_mut(depot_index);
            (&mut left[actor_index], &mut right[0])
        } else {
            let (left, right) = entities.split_at_mut(actor_index);
            (&mut right[0], &mut left[depot_index])
        };
        let depot_def = content.get(&depot.entity_type_id).unwrap();
        deposit_collection_inventory(actor, actor_def, depot, depot_def, &node.resource_type);
        if resource_amount(actor, &node.resource_type) > f64::EPSILON {
            return ("waiting_for_dropoff", 0.0);
        }
        next_leg(state, false);
        return (COLLECTOR_ACTIVITY_DELIVERING, 0.0);
    }
    let source_position = entities[source_index].pos.unwrap();
    let position = entities[actor_index].pos.unwrap();
    let distance = Engine::distance_sq(position.x, position.y, source_position.x, source_position.y).sqrt();
    if distance < node.min_effective_distance {
        // A legal route may end inside the source band; retreat only along its
        // radial final segment, with the same capped-step behavior as approach.
        if dt > 0.0 {
            Engine::drive_velocity_to_band(&mut entities[actor_index], actor_def.speed.min((node.min_effective_distance - distance) / dt),
                source_position.x, source_position.y, node.min_effective_distance, node.max_effective_distance);
        } else { hold(&mut entities[actor_index]); }
        return (moving, 0.0);
    }
    if !approach(&mut entities[actor_index], actor_def.speed, source_position, node.max_effective_distance, dt) { return (moving, 0.0); }
    let current = resource_amount(&entities[actor_index], &node.resource_type);
    let capacity = actor_def.max_capacity[&node.resource_type] as f64;
    if current >= capacity - f64::EPSILON {
        next_leg(state, true);
        return (COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF, 0.0);
    }
    let gathering = gathering_by_node.entry(plan.source_entity_id).or_default();
    if node.max_simultaneous_collectors.is_some_and(|limit| *gathering >= limit) {
        return (COLLECTOR_ACTIVITY_WAITING_FOR_TURN, 0.0);
    }
    *gathering += 1;
    let gathered = gather_transport_inventory(entities, state.entity_id, plan.source_entity_id, actor_def, &node.resource_type,
        collector.transport_rate_per_second.max(0.0) as f64 * dt.max(0.0) as f64, by_id);
    if resource_amount(&entities[actor_index], &node.resource_type) >= capacity - f64::EPSILON { next_leg(state, true); }
    (COLLECTOR_ACTIVITY_GATHERING, if dt > 0.0 { (gathered / dt as f64) as f32 } else { 0.0 })
}

/// Pair the cursor with the exact position/cargo checkpoint, not a newer Redis
/// tracking write. A missing checkpoint holds the accepted plan rather than
/// driving its initial segment from an unrelated rolled-back worker position.
pub(super) fn restore_order(
    entry: &crate::io::redis::EntityActiveIntent,
    snapshots: &[pb::CollectionOrderState],
) -> Option<pb::CollectState> {
    let plan = entry.collect_travel_plan.as_ref()?.to_proto();
    let command = uuid::Uuid::parse_str(&entry.client_cmd_id).ok()?;
    if let Some(saved) = snapshots.iter().find_map(|snapshot| {
        let state = snapshot.state.as_ref()?;
        (snapshot.client_cmd_id.as_slice() == command.as_bytes()
            && state.entity_id == entry.entity_id && state.travel_plan.as_ref() == Some(&plan))
            .then_some(state)
    }) {
        return Some(saved.clone());
    }
    Some(pb::CollectState {
        entity_id: entry.entity_id,
        resource_type_id: entry.collect_resource_type_id.clone().unwrap_or_default(),
        nearest_compatible: entry.collect_nearest_compatible.unwrap_or(false),
        travel_plan: Some(plan),
        route_checkpoint_missing: true,
        ..Default::default()
    })
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::{collection_entity_index, intent::{IntentManager, IntentMetadata}, set_resource_amount};
    use crate::io::redis::{CollectionTravelPlan, EntityActiveIntent};
    use prost::Message;

    fn fixture() -> (ContentPack, Vec<pb::Entity>, pb::CollectState, BTreeSet<u64>) {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let entity = |id, kind: &str, x, y| pb::Entity {
            id, entity_type_id: kind.into(), owner_player_id: "alice".into(), health: 100.0,
            pos: Some(pb::Vec2 { x, y }), ..Default::default()
        };
        let entities = vec![entity(1, "worker", -400.0, 0.0), entity(2, "minerals", 1000.0, 0.0),
            entity(3, "habitat", 0.0, 0.0), entity(4, "waypoint", 200.0, 300.0),
            entity(5, "waypoint", 800.0, 300.0), entity(6, "waypoint", -200.0, 300.0)];
        let state = pb::CollectState {
            entity_id: 1, resource_type_id: "minerals".into(),
            travel_plan: Some(pb::CollectionTravelPlan { source_entity_id: 2, depot_entity_id: 3,
                waypoint_ids: vec![4, 5], initial_waypoint_ids: vec![6, 5], initial_to_depot: false }),
            ..Default::default()
        };
        (content, entities, state, [2].into())
    }

    fn assigned_fixture() -> (ContentPack, Vec<pb::Entity>, pb::CollectState, BTreeSet<u64>) {
        let (content, mut entities, state, known) = fixture();
        let depot = |id, kind: &str, x| pb::Entity {
            id, entity_type_id: kind.into(), owner_player_id: "alice".into(), health: 100.0,
            pos: Some(pb::Vec2 { x, y: 0.0 }), ..Default::default()
        };
        entities.extend([
            depot(7, "food_storage_container", 500.0),
            depot(8, "mineral_storage_container", 600.0),
            depot(9, "habitat", 8000.0),
            depot(10, "mineral_storage_container", 8200.0),
            depot(11, "food_storage_container", 700.0),
        ]);
        entities[0].supply = Some(pb::DepotSupply {
            depot_id: 3, delivery_depot_id: 7, ..Default::default()
        });
        (content, entities, state, known)
    }

    fn route_error(
        content: &ContentPack, entities: &[pb::Entity], state: &pb::CollectState, known: &BTreeSet<u64>,
    ) -> &'static str {
        diagnose(entities, &collection_entity_index(entities), content, known, &HashSet::new(),
            state.entity_id, &state.resource_type_id, state.nearest_compatible,
            state.travel_plan.as_ref().unwrap()).unwrap_err().code
    }

    #[test]
    fn explicit_hub_and_container_assignments_allow_only_local_resource_sharing() {
        let (content, mut entities, mut state, known) = assigned_fixture();
        for anchor in [3, 7] {
            entities[0].supply.as_mut().unwrap().delivery_depot_id = anchor;
            for id in [3, 7, 8] {
                state.travel_plan.as_mut().unwrap().depot_entity_id = id;
                if id == 7 && anchor == 3 {
                    assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
                } else {
                    assert!(legal(&content, &entities, &state, &known), "anchor {anchor}, depot {id}");
                }
            }
            for id in [9, 10, 11] {
                state.travel_plan.as_mut().unwrap().depot_entity_id = id;
                assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
            }
            state.travel_plan.as_mut().unwrap().depot_entity_id = 8;
            entities[7].pos.as_mut().unwrap().x = 4100.0;
            assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
            entities[7].pos.as_mut().unwrap().x = 600.0;
        }
        entities[0].supply.as_mut().unwrap().delivery_depot_id = 7;
        entities[7].owner_player_id = "bob".into();
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[7].owner_player_id = "alice".into();
        entities[7].health = 0.0;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[7].health = 100.0;
        entities[7].pos = None;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[7].pos = Some(pb::Vec2 { x: 600.0, y: 0.0 });
        entities[6].entity_type_id = "factory".into();
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[6].entity_type_id = "food_storage_container".into();
        entities[0].supply.as_mut().unwrap().delivery_depot_id = 999;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[0].supply.as_mut().unwrap().delivery_depot_id = 0;
        state.travel_plan.as_mut().unwrap().depot_entity_id = 10;
        assert!(legal(&content, &entities, &state, &known));
        entities[9].owner_player_id = "bob".into();
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[9].owner_player_id = "alice".into();
        entities[0].supply.as_mut().unwrap().delivery_depot_id = 3;
        entities[2].owner_player_id = "bob".into();
        state.travel_plan.as_mut().unwrap().depot_entity_id = 8;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
        entities[2].owner_player_id = "alice".into();
        entities[2].pos = None;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_unavailable");
    }

    #[test]
    fn container_anchor_uses_preferred_covering_hub_then_nearest_with_id_tie_break() {
        let (content, mut entities, mut state, known) = assigned_fixture();
        // The second hub covers the anchor at 500, but its linked container is
        // outside the preferred hub's radius.
        entities[8].pos.as_mut().unwrap().x = 3500.0;
        entities[9].pos.as_mut().unwrap().x = 6500.0;
        state.travel_plan.as_mut().unwrap().depot_entity_id = 10;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
        entities[0].supply.as_mut().unwrap().depot_id = 9;
        assert!(legal(&content, &entities, &state, &known));
        entities[0].supply.as_mut().unwrap().depot_id = 999;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
        // Move the anchor closer to the second hub, so nearest is chosen.
        entities[6].pos.as_mut().unwrap().x = 2800.0;
        assert!(legal(&content, &entities, &state, &known));
        entities[6].pos.as_mut().unwrap().x = 500.0;
        entities[2].health = 0.0;
        assert!(legal(&content, &entities, &state, &known));
        entities[8].health = 0.0;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
        entities[2].health = 100.0;
        entities[8].health = 100.0;
        entities[8].pos.as_mut().unwrap().x = 1000.0;
        entities[9].pos.as_mut().unwrap().x = 4500.0;
        // Both hubs cover the anchor equally; the lower ID wins.
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
        entities[0].supply.as_mut().unwrap().depot_id = 9;
        assert!(legal(&content, &entities, &state, &known));
        // Without any covering hub a container assignment stays pinned.
        entities[6].pos.as_mut().unwrap().x = 18000.0;
        assert_eq!(route_error(&content, &entities, &state, &known), "depot_outside_assignment");
        state.travel_plan.as_mut().unwrap().depot_entity_id = 7;
        assert!(legal(&content, &entities, &state, &known));
    }

    #[test]
    fn switched_route_restores_and_waits_for_capacity_without_changing_assignment() {
        let (content, mut entities, mut state, known) = assigned_fixture();
        let plan = state.travel_plan.as_mut().unwrap();
        plan.depot_entity_id = 8;
        plan.initial_to_depot = true;
        plan.initial_waypoint_ids.clear();
        plan.waypoint_ids.clear();
        state.returning_to_depot = true;
        set_resource_amount(&mut entities[0], "minerals", 10.0);
        let food = content.get("food_storage_container").unwrap();
        let mineral = content.get("mineral_storage_container").unwrap();
        set_resource_amount(&mut entities[6], "minerals", food.max_capacity["minerals"] as f64);
        set_resource_amount(&mut entities[7], "minerals", mineral.max_capacity["minerals"] as f64);
        entities[0].pos = entities[7].pos;
        assert!(legal(&content, &entities, &state, &known));
        state.travel_plan.as_mut().unwrap().depot_entity_id = 7;
        assert!(legal(&content, &entities, &state, &known));
        state.travel_plan.as_mut().unwrap().depot_entity_id = 8;
        let entry = tracking(&state);
        let snapshot = pb::Snapshot { entities, collection_orders: vec![pb::CollectionOrderState {
            client_cmd_id: vec![7; 16], state: Some(state.clone()) }], ..Default::default() };
        let saved = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        let mut resumed = restore_order(&entry, &saved.collection_orders).unwrap();
        let mut entities = saved.entities;
        assert_eq!(resumed.travel_plan.as_ref().unwrap().depot_entity_id, 8);
        assert_eq!(entities[0].supply.as_ref().unwrap().delivery_depot_id, 7);
        assert_eq!(step(&content, &mut entities, &mut resumed, &known), "waiting_for_dropoff");
        set_resource_amount(&mut entities[7], "minerals", mineral.max_capacity["minerals"] as f64 - 10.0);
        assert_eq!(step(&content, &mut entities, &mut resumed, &known), COLLECTOR_ACTIVITY_DELIVERING);
        assert_eq!(resource_amount(&entities[7], "minerals"), mineral.max_capacity["minerals"] as f64);
        assert_eq!(resource_amount(&entities[6], "minerals"), food.max_capacity["minerals"] as f64);
        assert_eq!(entities[0].supply.as_ref().unwrap().delivery_depot_id, 7);
        assert_eq!(resumed.travel_plan.as_ref().unwrap().depot_entity_id, 8);
    }

    fn legal(content: &ContentPack, entities: &[pb::Entity], state: &pb::CollectState, known: &BTreeSet<u64>) -> bool {
        state.travel_plan.as_ref().is_some_and(|plan| valid(entities, &collection_entity_index(entities), content, known,
            &HashSet::new(), state.entity_id, &state.resource_type_id, state.nearest_compatible, plan))
    }

    fn step(content: &ContentPack, entities: &mut [pb::Entity], state: &mut pb::CollectState, known: &BTreeSet<u64>) -> &'static str {
        let indexes = collection_entity_index(entities);
        let activity = advance(entities, &indexes, content, known, &HashSet::new(), state,
            &mut HashMap::new(), 1.0).0;
        let velocity = entities[0].vel.unwrap_or_default();
        let position = entities[0].pos.as_mut().unwrap();
        position.x += velocity.x;
        position.y += velocity.y;
        activity
    }

    fn tracking(state: &pb::CollectState) -> EntityActiveIntent {
        let plan = state.travel_plan.as_ref().unwrap();
        EntityActiveIntent {
            entity_id: state.entity_id, client_cmd_id: uuid::Uuid::from_bytes([7; 16]).to_string(),
            collect_resource_type_id: Some(state.resource_type_id.clone()),
            collect_nearest_compatible: Some(state.nearest_compatible),
            collect_travel_plan: Some(CollectionTravelPlan {
                source_entity_id: plan.source_entity_id, depot_entity_id: plan.depot_entity_id,
                waypoint_ids: plan.waypoint_ids.clone(), initial_waypoint_ids: plan.initial_waypoint_ids.clone(),
                initial_to_depot: plan.initial_to_depot,
            }), ..Default::default()
        }
    }

    #[test]
    fn legal_route_is_accepted_without_server_hazard_or_geometry_checks() {
        let (content, mut entities, state, known) = fixture();
        entities.push(pb::Entity { id: 99, entity_type_id: "star_yellow".into(), health: 100.0,
            pos: Some(pb::Vec2 { x: -200.0, y: 150.0 }), ..Default::default() });
        assert!(legal(&content, &entities, &state, &known));
        let mut direct = state.clone();
        direct.travel_plan.as_mut().unwrap().waypoint_ids.clear();
        direct.travel_plan.as_mut().unwrap().initial_waypoint_ids.clear();
        assert!(legal(&content, &entities, &direct, &known));
        let mut manager = IntentManager::new(content.entity_types.clone(), 0.75, 90.0);
        let metadata = IntentMetadata { entity_id: 0, intent_id: vec![1; 16], client_cmd_id: vec![7; 16],
            player_id: "alice".into(), protocol_version: 3, server_tick: 0, policy: pb::IntentPolicy::ReplaceActive };
        let order = pb::Intent { kind: Some(pb::intent::Kind::Collect(pb::CollectIntent {
            entity_id: 1, resource_type_id: state.resource_type_id.clone(), travel_plan: state.travel_plan.clone(),
            ..Default::default()
        })) };
        assert!(manager.try_activate(order, metadata, "worker").started.is_some());
        assert_eq!(manager.collection_orders_for_snapshot()[0].state.as_ref().unwrap().travel_plan, state.travel_plan);
    }

    #[test]
    fn invalid_waypoints_sources_depots_and_oversized_lists_are_rejected() {
        let (content, entities, state, known) = fixture();
        assert!(!legal(&content, &entities, &state, &BTreeSet::new()));
        for index in [1, 2, 3, 4, 5] {
            let mut changed = entities.clone();
            changed[index].health = 0.0;
            assert!(!legal(&content, &changed, &state, &known));
            changed[index].health = 100.0;
            changed[index].pos = None;
            assert!(!legal(&content, &changed, &state, &known));
        }
        for index in [2, 3, 4, 5] {
            let mut changed = entities.clone();
            changed[index].owner_player_id = "bob".into();
            assert!(!legal(&content, &changed, &state, &known));
        }
        let mut changed = entities.clone();
        changed[3].entity_type_id = "habitat".into();
        assert!(!legal(&content, &changed, &state, &known));
        changed = entities.clone();
        changed[1].entity_type_id = "star_yellow".into();
        assert!(!legal(&content, &changed, &state, &known));
        changed = entities.clone();
        changed[2].entity_type_id = "factory".into();
        assert!(!legal(&content, &changed, &state, &known));
        let mut wrong_resource = state.clone();
        wrong_resource.resource_type_id = "food".into();
        assert!(!legal(&content, &entities, &wrong_resource, &known));
        let mut missing = state.clone();
        missing.travel_plan.as_mut().unwrap().waypoint_ids = vec![999];
        assert!(!legal(&content, &entities, &missing, &known));
        let mut bounded = state.clone();
        bounded.travel_plan.as_mut().unwrap().waypoint_ids = vec![4; 256];
        bounded.travel_plan.as_mut().unwrap().initial_waypoint_ids = vec![6; 256];
        assert!(legal(&content, &entities, &bounded, &known));
        bounded.travel_plan.as_mut().unwrap().waypoint_ids.push(4);
        assert!(!legal(&content, &entities, &bounded, &known));
        bounded.travel_plan.as_mut().unwrap().waypoint_ids.pop();
        bounded.travel_plan.as_mut().unwrap().initial_waypoint_ids.push(6);
        assert!(!legal(&content, &entities, &bounded, &known));
        assert!(!valid(&entities, &collection_entity_index(&entities), &content, &known, &[3].into(),
            state.entity_id, &state.resource_type_id, state.nearest_compatible, state.travel_plan.as_ref().unwrap()));
    }

    #[test]
    fn route_rejection_identifies_actionable_failures_without_exposing_unknown_ids() {
        let (content, mut entities, state, known) = fixture();
        let plan = state.travel_plan.as_ref().unwrap();
        let diagnose_route = |entities: &[pb::Entity], known: &BTreeSet<u64>, plan: &pb::CollectionTravelPlan| {
            diagnose(entities, &collection_entity_index(entities), &content, known, &HashSet::new(),
                state.entity_id, &state.resource_type_id, state.nearest_compatible, plan).unwrap_err()
        };
        let hidden = diagnose_route(&entities, &BTreeSet::new(), plan);
        assert_eq!(hidden.code, "source_undiscovered");
        assert_eq!(hidden.source_entity_id, 0);
        assert_eq!(hidden.depot_entity_id, 3);
        entities[1].resource_deposit = Some(pb::ResourceDeposit { amount: 10.0, remaining: 0.0 });
        let depleted = diagnose_route(&entities, &known, plan);
        assert_eq!(depleted.code, "source_depleted");
        assert_eq!(depleted.source_entity_id, 2);
        entities[1].resource_deposit = None;
        entities[2].owner_player_id = "bob".into();
        let unavailable = diagnose_route(&entities, &known, plan);
        assert_eq!(unavailable.code, "depot_unavailable");
        assert_eq!(unavailable.depot_entity_id, 0);
        entities[2].owner_player_id = "alice".into();
        let mut invalid_plan = plan.clone();
        invalid_plan.waypoint_ids.push(999);
        assert_eq!(diagnose_route(&entities, &known, &invalid_plan).code, "invalid_waypoint");
        let mut wrong_resource = state.clone();
        wrong_resource.resource_type_id = "food".into();
        assert_eq!(diagnose(&entities, &collection_entity_index(&entities), &content, &known, &HashSet::new(),
            wrong_resource.entity_id, &wrong_resource.resource_type_id, false, plan).unwrap_err().code, "resource_incompatible");
    }

    #[test]
    fn initial_route_then_return_and_recurring_outbound_visit_centers_in_order() {
        let (content, mut entities, mut state, known) = fixture();
        let mut centers = Vec::new();
        let mut delivered = false;
        let mut collected = false;
        for _ in 0..1000 {
            let activity = step(&content, &mut entities, &mut state, &known);
            let position = entities[0].pos.unwrap();
            for id in [4, 5, 6] {
                if position == entities[(id - 1) as usize].pos.unwrap() && centers.last() != Some(&id) { centers.push(id); }
            }
            collected |= activity == COLLECTOR_ACTIVITY_GATHERING;
            delivered |= activity == COLLECTOR_ACTIVITY_DELIVERING;
            if delivered && centers.len() >= 6 { break; }
        }
        assert!(collected && delivered);
        assert_eq!(centers, [6, 5, 4, 5, 4, 5]);
        assert!(resource_amount(&entities[2], "minerals") > 0.0);
        assert!(state.initial_leg_complete);
    }

    #[test]
    fn initial_depot_leg_finishes_cargo_then_uses_forward_recurring_route() {
        let (content, mut entities, mut state, known) = fixture();
        state.travel_plan.as_mut().unwrap().initial_to_depot = true;
        state.travel_plan.as_mut().unwrap().initial_waypoint_ids = vec![6];
        set_resource_amount(&mut entities[0], "minerals", 10.0);
        let mut delivered = false;
        for _ in 0..300 {
            if step(&content, &mut entities, &mut state, &known) == COLLECTOR_ACTIVITY_DELIVERING { delivered = true; break; }
        }
        assert!(delivered);
        assert_eq!(resource_amount(&entities[2], "minerals"), 10.0);
        assert!(state.initial_leg_complete && !state.returning_to_depot);
        assert_eq!(state.next_waypoint_index, 0);
        step(&content, &mut entities, &mut state, &known);
        assert!(entities[0].vel.unwrap().y > 0.0);
    }

    #[test]
    fn planned_mineral_collection_preserves_full_unrelated_resources() {
        for nearest_compatible in [false, true] {
            let (content, mut entities, mut state, known) = fixture();
            if nearest_compatible {
                state.nearest_compatible = true;
                state.resource_type_id.clear();
            }
            let plan = state.travel_plan.as_mut().unwrap();
            plan.initial_waypoint_ids.clear();
            plan.waypoint_ids.clear();
            let node = content.get("minerals").unwrap().resource_node.as_ref().unwrap();
            let source = entities[1].pos.unwrap();
            entities[0].pos = Some(pb::Vec2 {
                x: source.x - (node.min_effective_distance + node.max_effective_distance) / 2.0, y: source.y,
            });
            let worker = content.get("worker").unwrap();
            for resource in ["food", "energy"] {
                set_resource_amount(&mut entities[0], resource, worker.max_capacity[resource] as f64);
            }
            assert_eq!(step(&content, &mut entities, &mut state, &known), COLLECTOR_ACTIVITY_GATHERING);
            assert_eq!(resource_amount(&entities[0], "minerals"), 8.0);
            assert!(!state.returning_to_depot);
            set_resource_amount(&mut entities[0], "minerals", worker.max_capacity["minerals"] as f64);
            assert_eq!(step(&content, &mut entities, &mut state, &known), COLLECTOR_ACTIVITY_MOVING_TO_DROPOFF);
            assert!(state.returning_to_depot);
            entities[0].pos = entities[2].pos;
            assert_eq!(step(&content, &mut entities, &mut state, &known), COLLECTOR_ACTIVITY_DELIVERING);
            assert_eq!(resource_amount(&entities[0], "minerals"), 0.0);
            assert_eq!(resource_amount(&entities[2], "minerals"), worker.max_capacity["minerals"] as f64);
            assert!(!state.returning_to_depot);
            for resource in ["food", "energy"] {
                assert_eq!(resource_amount(&entities[0], resource), worker.max_capacity[resource] as f64);
                assert_eq!(resource_amount(&entities[2], resource), 0.0);
            }
        }
    }

    #[test]
    fn planned_initial_and_recurring_dropoff_wait_only_for_route_resource() {
        for initial_leg_complete in [false, true] {
            let (content, mut entities, mut state, known) = fixture();
            let plan = state.travel_plan.as_mut().unwrap();
            plan.initial_waypoint_ids.clear();
            plan.waypoint_ids.clear();
            plan.initial_to_depot = true;
            state.initial_leg_complete = initial_leg_complete;
            state.returning_to_depot = true;
            entities[0].pos = entities[2].pos;
            let worker = content.get("worker").unwrap();
            let depot = content.get("habitat").unwrap();
            for resource in ["food", "energy"] {
                set_resource_amount(&mut entities[0], resource, worker.max_capacity[resource] as f64);
                set_resource_amount(&mut entities[2], resource, depot.max_capacity[resource] as f64);
            }
            set_resource_amount(&mut entities[0], "minerals", 10.0);
            set_resource_amount(&mut entities[2], "minerals", depot.max_capacity["minerals"] as f64 - 3.0);
            assert_eq!(step(&content, &mut entities, &mut state, &known), "waiting_for_dropoff");
            assert_eq!(resource_amount(&entities[0], "minerals"), 7.0);
            set_resource_amount(&mut entities[2], "minerals", 0.0);
            assert_eq!(step(&content, &mut entities, &mut state, &known), COLLECTOR_ACTIVITY_DELIVERING);
            assert_eq!(resource_amount(&entities[0], "minerals"), 0.0);
            assert_eq!(resource_amount(&entities[2], "minerals"), 7.0);
            assert!(state.initial_leg_complete && !state.returning_to_depot);
            for resource in ["food", "energy"] {
                assert_eq!(resource_amount(&entities[0], resource), worker.max_capacity[resource] as f64);
                assert_eq!(resource_amount(&entities[2], resource), depot.max_capacity[resource] as f64);
            }
        }
    }

    #[test]
    fn planned_collection_rejects_zero_route_resource_capacity() {
        let (mut content, mut entities, mut state, known) = fixture();
        content.entity_types.get_mut("worker").unwrap().max_capacity.insert("minerals".into(), 0.0);
        let before = entities[0].resources.clone();
        assert!(!legal(&content, &entities, &state, &known));
        assert_eq!(step(&content, &mut entities, &mut state, &known), BLOCKED);
        assert_eq!(entities[0].resources, before);
        assert_eq!(entities[0].vel, Some(pb::Vec2 { x: 0.0, y: 0.0 }));
    }

    #[test]
    fn route_invalidation_holds_even_with_cargo_and_nearby_replacement_endpoints() {
        let (content, entities, state, known) = fixture();
        for missing_id in [2, 3, 4, 5, 6] {
            let mut changed = entities.clone();
            changed.retain(|entity| entity.id != missing_id);
            changed.push(pb::Entity { id: 100, ..entities[1].clone() });
            changed.push(pb::Entity { id: 101, ..entities[2].clone() });
            let mut order = state.clone();
            order.initial_leg_complete = true;
            order.returning_to_depot = true;
            set_resource_amount(&mut changed[0], "minerals", 50.0);
            let before = changed[0].pos;
            assert_eq!(step(&content, &mut changed, &mut order, &known), BLOCKED);
            assert_eq!(changed[0].vel, Some(pb::Vec2 { x: 0.0, y: 0.0 }));
            assert_eq!(changed[0].pos, before);
            assert_eq!(order.travel_plan, state.travel_plan);
        }
    }

    #[test]
    fn persisted_initial_forward_and_reverse_legs_continue_at_the_saved_cursor() {
        for (initial_complete, returning, previous_waypoint, next_waypoint) in [
            (false, false, 6, 5), (true, false, 4, 5), (true, true, 5, 4),
        ] {
            let (content, mut entities, mut state, known) = fixture();
            state.initial_leg_complete = initial_complete;
            state.returning_to_depot = returning;
            state.next_waypoint_index = 1;
            entities[0].pos = entities[(previous_waypoint - 1) as usize].pos;
            let entry = tracking(&state);
            let snapshot = pb::Snapshot { entities, collection_orders: vec![pb::CollectionOrderState {
                client_cmd_id: vec![7; 16], state: Some(state.clone()) }], ..Default::default() };
            let saved = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
            let mut resumed = restore_order(&entry, &saved.collection_orders).unwrap();
            assert_eq!(resumed, state);
            let mut entities = saved.entities;
            let before = entities[0].pos.unwrap();
            let target = entities[(next_waypoint - 1) as usize].pos.unwrap();
            step(&content, &mut entities, &mut resumed, &known);
            let velocity = entities[0].vel.unwrap();
            assert!(velocity.x * (target.x - before.x) > 0.0);
            assert_eq!(resumed.next_waypoint_index, 1);
        }
    }

    #[test]
    fn snapshot_roundtrip_preserves_route_cursor_and_direction_without_replanning() {
        let (content, mut entities, mut state, known) = fixture();
        for _ in 0..20 { step(&content, &mut entities, &mut state, &known); }
        let entry = tracking(&state);
        let snapshot = pb::Snapshot { entities: entities.clone(), collection_orders: vec![pb::CollectionOrderState {
            client_cmd_id: vec![7; 16], state: Some(state.clone()) }], ..Default::default() };
        let saved = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        let mut resumed_entities = saved.entities;
        let mut resumed = restore_order(&entry, &saved.collection_orders).unwrap();
        assert_eq!(resumed, state);
        for _ in 0..100 {
            assert_eq!(step(&content, &mut resumed_entities, &mut resumed, &known),
                step(&content, &mut entities, &mut state, &known));
            assert_eq!(resumed_entities, entities);
            assert_eq!(resumed, state);
        }
        let mut missing_checkpoint = restore_order(&entry, &[]).unwrap();
        assert!(missing_checkpoint.route_checkpoint_missing);
        assert_eq!(step(&content, &mut resumed_entities, &mut missing_checkpoint, &known), BLOCKED);
        let mut newer = entry;
        newer.client_cmd_id = uuid::Uuid::from_bytes([8; 16]).to_string();
        assert!(restore_order(&newer, &saved.collection_orders).unwrap().route_checkpoint_missing);
    }
}
