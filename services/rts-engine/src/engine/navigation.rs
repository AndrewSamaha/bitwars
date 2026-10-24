//! Route progression without movement, formation, combat or transport decisions.
use super::{intent::IntentManager, Engine};
use crate::pb;
use anyhow::Result;

pub const MAX_ROUTE_WAYPOINTS: usize = 256;

#[derive(Debug, PartialEq)]
pub enum RouteEditError {
    Busy,
    InvalidTarget,
    Limit,
}

impl pb::NavigationRoute {
    pub fn move_to(target: pb::Vec2) -> Self {
        Self {
            waypoints: vec![target],
            next_waypoint_index: 0,
            direction: 1,
            traversal: pb::RouteTraversal::FinishAtEnd as i32,
        }
    }

    pub fn destination(&self) -> Option<pb::Vec2> {
        self.waypoints
            .get(self.next_waypoint_index as usize)
            .copied()
    }

    pub fn valid(&self) -> bool {
        !self.waypoints.is_empty()
            && self.waypoints.len() <= MAX_ROUTE_WAYPOINTS
            && self.destination().is_some()
            && self
                .waypoints
                .iter()
                .all(|point| point.x.is_finite() && point.y.is_finite())
            && (self.direction == 1 || self.direction == -1)
            && matches!(
                pb::RouteTraversal::try_from(self.traversal),
                Ok(pb::RouteTraversal::FinishAtEnd | pb::RouteTraversal::PingPong)
            )
    }

    /// Called once per leg arrival. True means another leg remains. Even equal
    /// destinations advance at most one leg per tick, preventing a busy loop.
    pub fn advance(&mut self) -> bool {
        if !self.valid() {
            return false;
        }
        let last = self.waypoints.len() - 1;
        let index = self.next_waypoint_index as usize;
        if self.traversal == pb::RouteTraversal::PingPong as i32 {
            if last == 0 {
                return true;
            }
            if index == last {
                self.direction = -1;
            } else if index == 0 {
                self.direction = 1;
            }
            self.next_waypoint_index = (index as i64 + self.direction as i64) as u32;
            true
        } else if index < last {
            self.next_waypoint_index += 1;
            true
        } else {
            false
        }
    }

    /// Preserve the active destination when clearing future waypoints. All
    /// validation happens before mutation, so rejected edits leave routes intact.
    pub fn edit(&mut self, target: pb::Vec2, clear_future: bool) -> Result<(), RouteEditError> {
        if !target.x.is_finite() || !target.y.is_finite() || !self.valid() {
            return Err(RouteEditError::InvalidTarget);
        }
        let retained = if clear_future {
            self.next_waypoint_index as usize + 1
        } else {
            self.waypoints.len()
        };
        if retained >= MAX_ROUTE_WAYPOINTS {
            return Err(RouteEditError::Limit);
        }
        self.waypoints.truncate(retained);
        self.waypoints.push(target);
        Ok(())
    }
}

impl IntentManager {
    /// None means idle: the caller should activate an ordinary new Move order.
    /// A group member or a non-Move action cannot be edited through individual Move.
    pub fn edit_move_route(
        &mut self,
        entity_id: u64,
        target: pb::Vec2,
        policy: pb::IntentPolicy,
    ) -> Option<Result<(), RouteEditError>> {
        let active = self.current_action.get(&entity_id)?;
        if active.metadata.entity_id != 0
            || !matches!(active.action.exec, Some(pb::action_state::Exec::Move(_)))
        {
            return Some(Err(RouteEditError::Busy));
        }
        let Some(route) = self.move_routes.get_mut(&entity_id) else {
            return Some(Err(RouteEditError::Busy));
        };
        let result = route.edit(target, policy == pb::IntentPolicy::ClearThenAppend);
        if result.is_ok() {
            self.changed_move_routes.insert(entity_id);
        }
        Some(result)
    }

    pub fn move_orders_for_snapshot(&self) -> Vec<pb::MoveOrderState> {
        let mut orders: Vec<_> = self
            .move_routes
            .iter()
            .filter_map(|(entity_id, route)| {
                let active = self.current_action.get(entity_id)?;
                Some(pb::MoveOrderState {
                    entity_id: *entity_id,
                    intent_id: active.metadata.intent_id.clone(),
                    client_cmd_id: active.metadata.client_cmd_id.clone(),
                    player_id: active.metadata.player_id.clone(),
                    started_tick: active.metadata.server_tick,
                    route: Some(route.clone()),
                    last_client_cmd_id: self
                        .move_route_last_cmd
                        .get(entity_id)
                        .cloned()
                        .unwrap_or_else(|| active.metadata.client_cmd_id.clone()),
                })
            })
            .collect();
        orders.sort_by_key(|order| order.entity_id);
        orders
    }
}

impl IntentManager {
    pub fn append_move_order_changes(&self, delta: &mut pb::Delta) {
        let current = self.move_orders_for_snapshot();
        delta.move_order_updates = current
            .iter()
            .filter(|order| self.published_move_orders.get(&order.entity_id) != Some(order))
            .cloned()
            .collect();
        let present: std::collections::HashMap<_, _> = current
            .iter()
            .map(|order| (order.entity_id, order))
            .collect();
        delta.move_order_removals = self
            .published_move_orders
            .values()
            .filter(|order| {
                present.get(&order.entity_id).is_none_or(|next| {
                    next.client_cmd_id != order.client_cmd_id || next.player_id != order.player_id
                })
            })
            .map(|order| pb::MoveOrderRemoval {
                entity_id: order.entity_id,
                player_id: order.player_id.clone(),
                client_cmd_id: order.client_cmd_id.clone(),
            })
            .collect();
        delta
            .move_order_removals
            .sort_by_key(|order| order.entity_id);
    }

    /// Advance publication state only after Redis acknowledges the delta. Failed
    /// publications retain updates/removals for the next tick's retry.
    pub fn acknowledge_move_order_changes(&mut self, delta: &pb::Delta) {
        for removal in &delta.move_order_removals {
            self.published_move_orders.remove(&removal.entity_id);
        }
        for order in &delta.move_order_updates {
            self.published_move_orders
                .insert(order.entity_id, order.clone());
        }
    }
}

impl Engine {
    /// Only changed routes touch Redis. Failed writes remain dirty for retry.
    pub(super) async fn persist_changed_move_routes(&mut self) -> Result<()> {
        let mut changed: Vec<_> = self.intents.changed_move_routes.iter().copied().collect();
        changed.sort_unstable();
        for id in changed {
            if let Some(route) = self.intents.move_routes.get(&id) {
                self.redis
                    .persist_move_route(
                        id,
                        route,
                        self.intents.move_route_last_cmd.get(&id).map(Vec::as_slice),
                    )
                    .await?;
            }
            self.intents.changed_move_routes.remove(&id);
        }
        Ok(())
    }

    pub(super) async fn restore_move_orders(
        &mut self,
        orders: Vec<pb::MoveOrderState>,
    ) -> Result<()> {
        for order in orders {
            let Some(route) = order.route.filter(|route| {
                route.valid()
                    && route.traversal == pb::RouteTraversal::FinishAtEnd as i32
                    && route.direction == 1
            }) else {
                self.redis.clear_active_intent(order.entity_id).await?;
                continue;
            };
            let Some(entity) = self.state.entities.iter().find(|entity| {
                entity.id == order.entity_id
                    && entity.owner_player_id == order.player_id
                    && entity.health > 0.0
            }) else {
                self.redis.clear_active_intent(order.entity_id).await?;
                continue;
            };
            if order.intent_id.len() != 16 || order.client_cmd_id.len() != 16 {
                self.redis.clear_active_intent(order.entity_id).await?;
                continue;
            }
            let metadata = super::intent::IntentMetadata {
                entity_id: 0,
                intent_id: order.intent_id,
                client_cmd_id: order.client_cmd_id,
                player_id: order.player_id,
                server_tick: order.started_tick,
                protocol_version: super::ENGINE_PROTOCOL_MAJOR,
                policy: pb::IntentPolicy::ReplaceActive,
            };
            let destination = route.destination().unwrap();
            self.intents.try_activate(
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                        entity_id: order.entity_id,
                        target: Some(destination),
                        ..Default::default()
                    })),
                },
                metadata.clone(),
                &entity.entity_type_id,
            );
            self.intents.move_route_last_cmd.insert(
                order.entity_id,
                if order.last_client_cmd_id.is_empty() {
                    metadata.client_cmd_id.clone()
                } else {
                    order.last_client_cmd_id
                },
            );
            self.intents.move_routes.insert(order.entity_id, route);
            self.redis
                .persist_active_intent(
                    order.entity_id,
                    &metadata,
                    "move",
                    Some(crate::io::redis::IntentPoint {
                        x: destination.x,
                        y: destination.y,
                    }),
                    None,
                    None,
                )
                .await?;
        }
        self.persist_changed_move_routes().await
    }
}

#[cfg(test)]
mod tests {
    use super::super::{intent::IntentMetadata, state::GameState};
    use super::*;
    use std::collections::HashMap;

    fn point(x: f32) -> pb::Vec2 {
        pb::Vec2 { x, y: 0.0 }
    }

    fn fixture() -> (IntentManager, GameState) {
        let mut manager = IntentManager::new(HashMap::new(), 0.0, 10.0);
        manager.try_activate(
            pb::Intent {
                kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                    entity_id: 1,
                    target: Some(point(10.0)),
                    ..Default::default()
                })),
            },
            IntentMetadata {
                entity_id: 0,
                intent_id: vec![1; 16],
                client_cmd_id: vec![2; 16],
                player_id: "me".into(),
                server_tick: 5,
                protocol_version: super::super::ENGINE_PROTOCOL_MAJOR,
                policy: pb::IntentPolicy::ReplaceActive,
            },
            "",
        );
        (
            manager,
            GameState { discovered_entities: Default::default(), generation: Default::default(),
                tick: 5,
                entities: vec![pb::Entity {
                    id: 1,
                    health: 10.0,
                    owner_player_id: "me".into(),
                    pos: Some(point(0.0)),
                    ..Default::default()
                }],
                technologies: HashMap::new(),
            },
        )
    }

    #[test]
    fn route_changes_retry_until_publication_is_acknowledged() {
        let (mut manager, _) = fixture();
        let mut first = pb::Delta::default();
        manager.append_move_order_changes(&mut first);
        assert_eq!(first.move_order_updates.len(), 1);
        assert!(super::super::should_publish_delta(&first));
        let mut retry = pb::Delta::default();
        manager.append_move_order_changes(&mut retry);
        assert_eq!(retry, first);
        manager.acknowledge_move_order_changes(&first);
        let mut unchanged = pb::Delta::default();
        manager.append_move_order_changes(&mut unchanged);
        assert!(!super::super::should_publish_delta(&unchanged));
        manager.finish(1);
        let mut removed = pb::Delta::default();
        manager.append_move_order_changes(&mut removed);
        assert_eq!(removed.move_order_removals.len(), 1);
        assert_eq!(removed.move_order_removals[0].player_id, "me");
        assert!(super::super::should_publish_delta(&removed));
        manager.acknowledge_move_order_changes(&removed);
        let mut done = pb::Delta::default();
        manager.append_move_order_changes(&mut done);
        assert!(!super::super::should_publish_delta(&done));
    }

    #[test]
    fn replacement_publishes_old_owner_removal_and_new_root() {
        let (mut manager, _) = fixture();
        let mut first = pb::Delta::default();
        manager.append_move_order_changes(&mut first);
        manager.acknowledge_move_order_changes(&first);
        let mut metadata = manager.active_intents()[&1].metadata.clone();
        metadata.player_id = "new-owner".into();
        metadata.client_cmd_id = vec![9; 16];
        manager.try_activate(
            pb::Intent {
                kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                    entity_id: 1,
                    target: Some(point(20.0)),
                    ..Default::default()
                })),
            },
            metadata,
            "",
        );
        let mut replaced = pb::Delta::default();
        manager.append_move_order_changes(&mut replaced);
        assert_eq!(replaced.move_order_removals[0].player_id, "me");
        assert_eq!(replaced.move_order_updates[0].player_id, "new-owner");
        assert_eq!(
            replaced.move_order_updates[0].last_client_cmd_id,
            vec![9; 16]
        );
    }

    #[test]
    fn finite_route_finishes_after_the_last_destination() {
        let mut route = pb::NavigationRoute::move_to(point(1.0));
        route.edit(point(2.0), false).unwrap();
        assert!(route.advance());
        assert_eq!(route.destination(), Some(point(2.0)));
        assert!(!route.advance());
    }

    #[test]
    fn ping_pong_reverses_without_duplicate_endpoints() {
        let mut route = pb::NavigationRoute {
            waypoints: vec![point(0.0), point(1.0), point(2.0)],
            traversal: pb::RouteTraversal::PingPong as i32,
            direction: 1,
            next_waypoint_index: 0,
        };
        let mut visited = Vec::new();
        for _ in 0..9 {
            visited.push(route.destination().unwrap().x);
            assert!(route.advance());
        }
        assert_eq!(visited, vec![0.0, 1.0, 2.0, 1.0, 0.0, 1.0, 2.0, 1.0, 0.0]);
    }

    #[test]
    fn invalid_and_over_limit_edits_leave_the_route_unchanged() {
        let mut route = pb::NavigationRoute::move_to(point(1.0));
        let before = route.clone();
        assert_eq!(
            route.edit(point(f32::NAN), true),
            Err(RouteEditError::InvalidTarget)
        );
        assert_eq!(route, before);
        route.waypoints = vec![point(1.0); MAX_ROUTE_WAYPOINTS];
        let full = route.clone();
        assert_eq!(route.edit(point(2.0), false), Err(RouteEditError::Limit));
        assert_eq!(route, full);
        route.edit(point(3.0), true).unwrap();
        assert_eq!(route.waypoints, vec![point(1.0), point(3.0)]);
    }

    #[test]
    fn server_advances_legs_without_finishing_or_replacing_root_order() {
        let (mut manager, mut state) = fixture();
        let root = manager.active_intents()[&1].metadata.intent_id.clone();
        assert_eq!(
            manager.edit_move_route(1, point(20.0), pb::IntentPolicy::Append),
            Some(Ok(()))
        );
        assert!(manager.follow_targets(&mut state, 10.0, 1.0).is_empty());
        assert_eq!(state.entities[0].pos, Some(point(10.0)));
        assert_eq!(manager.move_routes[&1].next_waypoint_index, 1);
        assert_eq!(manager.active_intents()[&1].metadata.intent_id, root);
        let finished = manager.follow_targets(&mut state, 10.0, 1.0);
        assert_eq!(finished.len(), 1);
        assert_eq!(finished[0].1.intent_id, root);
        assert!(manager.move_routes.is_empty());
    }

    #[test]
    fn clear_future_keeps_the_current_leg_and_replaces_later_destinations() {
        let (mut manager, _) = fixture();
        manager
            .edit_move_route(1, point(20.0), pb::IntentPolicy::Append)
            .unwrap()
            .unwrap();
        manager
            .edit_move_route(1, point(30.0), pb::IntentPolicy::Append)
            .unwrap()
            .unwrap();
        manager
            .edit_move_route(1, point(40.0), pb::IntentPolicy::ClearThenAppend)
            .unwrap()
            .unwrap();
        assert_eq!(
            manager.move_routes[&1].waypoints,
            vec![point(10.0), point(40.0)]
        );
        assert_eq!(manager.move_routes[&1].destination(), Some(point(10.0)));
    }

    #[test]
    fn replacement_and_death_remove_the_entire_route() {
        let (mut manager, _) = fixture();
        manager
            .edit_move_route(1, point(20.0), pb::IntentPolicy::Append)
            .unwrap()
            .unwrap();
        let metadata = manager.active_intents()[&1].metadata.clone();
        manager.try_activate(
            pb::Intent {
                kind: Some(pb::intent::Kind::Collect(pb::CollectIntent {
                    entity_id: 1,
                    nearest_compatible: true,
                    ..Default::default()
                })),
            },
            metadata,
            "",
        );
        assert!(manager.move_routes.is_empty());
        assert_eq!(
            manager.edit_move_route(1, point(30.0), pb::IntentPolicy::Append),
            Some(Err(RouteEditError::Busy))
        );
        let (mut manager, _) = fixture();
        manager.finish(1);
        assert!(manager.move_orders_for_snapshot().is_empty());
    }

    #[test]
    fn individual_append_cannot_change_a_convoy_members_order() {
        let (mut manager, _) = fixture();
        manager
            .current_action
            .get_mut(&1)
            .unwrap()
            .metadata
            .entity_id = 1;
        let before = manager.move_routes[&1].clone();
        assert_eq!(
            manager.edit_move_route(1, point(20.0), pb::IntentPolicy::Append),
            Some(Err(RouteEditError::Busy))
        );
        assert_eq!(manager.move_routes[&1], before);
    }

    #[test]
    fn duplicate_waypoints_advance_only_once_per_tick() {
        let (mut manager, mut state) = fixture();
        manager
            .edit_move_route(1, point(10.0), pb::IntentPolicy::Append)
            .unwrap()
            .unwrap();
        manager
            .edit_move_route(1, point(20.0), pb::IntentPolicy::Append)
            .unwrap()
            .unwrap();
        assert!(manager.follow_targets(&mut state, 10.0, 1.0).is_empty());
        assert_eq!(manager.move_routes[&1].next_waypoint_index, 1);
        assert!(manager.follow_targets(&mut state, 10.0, 1.0).is_empty());
        assert_eq!(manager.move_routes[&1].next_waypoint_index, 2);
    }

    #[test]
    fn checkpoint_preserves_route_identity_and_cursor() {
        use prost::Message;
        let (mut manager, mut state) = fixture();
        manager
            .edit_move_route(1, point(20.0), pb::IntentPolicy::Append)
            .unwrap()
            .unwrap();
        manager.follow_targets(&mut state, 10.0, 1.0);
        let orders = manager.move_orders_for_snapshot();
        let snapshot = pb::Snapshot {
            entities: state.entities,
            move_orders: orders.clone(),
            ..Default::default()
        };
        let decoded = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        assert_eq!(decoded.move_orders, orders);
        assert_eq!(
            decoded.move_orders[0]
                .route
                .as_ref()
                .unwrap()
                .next_waypoint_index,
            1
        );
        assert_eq!(decoded.move_orders[0].intent_id, vec![1; 16]);
    }
}
