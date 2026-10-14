//! Maintained group routes. Combat owns individual motion while engaged;
//! formation movement owns assembly, patrol travel and return to the frozen anchor.
use super::{
    formation::{formation_layout, FormationCommand, FormationMover, FormationProgress},
    intent::{IntentManager, IntentMetadata},
    navigation::MAX_ROUTE_WAYPOINTS,
    state::GameState,
    Engine,
};
use crate::pb;
use anyhow::{bail, Result};
use std::collections::{HashMap, HashSet};

pub(super) fn edit_sentry_route(
    route: &mut pb::NavigationRoute,
    destination: pb::Vec2,
    clear: bool,
) -> bool {
    if !route.valid() || !destination.x.is_finite() || !destination.y.is_finite() {
        return false;
    }
    if !clear {
        if route.waypoints.len() >= MAX_ROUTE_WAYPOINTS {
            return false;
        }
        route.waypoints.push(destination);
    } else {
        let origin = route.waypoints[0];
        let current = route.destination().unwrap();
        if route.next_waypoint_index == 0 {
            route.waypoints = vec![origin, destination];
        } else {
            route.waypoints = vec![origin, current, destination];
            route.next_waypoint_index = 1;
        }
    }
    true
}

fn new_sentry_order(
    layout: super::formation::FormationLayout,
    metadata: &IntentMetadata,
    destination: pb::Vec2,
) -> pb::SentryOrderState {
    let single = layout.slots.len() == 1;
    pb::SentryOrderState {
        intent_id: metadata.intent_id.clone(),
        client_cmd_id: metadata.client_cmd_id.clone(),
        player_id: metadata.player_id.clone(),
        started_tick: metadata.server_tick,
        route: Some(pb::NavigationRoute {
            waypoints: vec![layout.anchor, destination],
            next_waypoint_index: 1,
            direction: 1,
            traversal: pb::RouteTraversal::PingPong as i32,
        }),
        anchor: Some(layout.anchor),
        phase: if single {
            pb::SentryPhase::Patrolling
        } else {
            pb::SentryPhase::Assembling
        } as i32,
        slots: layout.slots,
        last_client_cmd_id: metadata.client_cmd_id.clone(),
    }
}

fn recover_sentry_order(
    mut order: pb::SentryOrderState,
    entities: &[pb::Entity],
    types: &HashMap<String, crate::content::EntityTypeDef>,
) -> Option<pb::SentryOrderState> {
    let finite = |point: pb::Vec2| point.x.is_finite() && point.y.is_finite();
    if !order.route.as_ref().is_some_and(|route| {
        route.valid()
            && route.waypoints.len() >= 2
            && route.traversal == pb::RouteTraversal::PingPong as i32
    }) || !order.anchor.is_some_and(finite)
        || order.intent_id.len() != 16
        || order.client_cmd_id.len() != 16
        || order.slots.is_empty()
        || order.slots.len() > 256
        || order
            .slots
            .iter()
            .map(|slot| slot.entity_id)
            .collect::<HashSet<_>>()
            .len()
            != order.slots.len()
        || !matches!(
            pb::SentryPhase::try_from(order.phase),
            Ok(pb::SentryPhase::Assembling
                | pb::SentryPhase::Patrolling
                | pb::SentryPhase::Engaged
                | pb::SentryPhase::Regrouping)
        )
    {
        return None;
    }
    order.slots.retain(|slot| {
        slot.offset.is_some_and(finite)
            && entities.iter().any(|entity| {
                entity.id == slot.entity_id
                    && entity.owner_player_id == order.player_id
                    && entity.health > 0.0
                    && entity.pos.is_some_and(finite)
                    && types
                        .get(&entity.entity_type_id)
                        .is_some_and(|def| def.speed.is_finite() && def.speed > 0.0)
            })
    });
    if order.slots.is_empty() {
        return None;
    }
    // Re-evaluate live targets on the first tick; never restore stale pursuit velocity.
    if order.phase == pb::SentryPhase::Engaged as i32 {
        order.phase = pb::SentryPhase::Regrouping as i32;
    }
    Some(order)
}

impl IntentManager {
    pub fn sentry_member_ids(&self) -> HashSet<u64> {
        self.sentries
            .iter()
            .flat_map(|order| order.slots.iter().map(|slot| slot.entity_id))
            .collect()
    }
    pub fn detach_sentry_member(&mut self, id: u64) {
        for order in &mut self.sentries {
            order.slots.retain(|slot| slot.entity_id != id);
        }
        self.sentries.retain(|order| !order.slots.is_empty());
    }
    pub fn prune_sentries(&mut self) {
        let actions = &self.current_action;
        for order in &mut self.sentries {
            order.slots.retain(|slot| {
                actions
                    .get(&slot.entity_id)
                    .is_some_and(|action| action.metadata.intent_id == order.intent_id)
            });
        }
        self.sentries.retain(|order| !order.slots.is_empty());
    }
    pub fn prepare_sentries(&mut self, engagements: &HashMap<u64, u64>, dt: f32) {
        if dt <= 0.0 {
            return;
        }
        self.prune_sentries();
        for order in &mut self.sentries {
            if order
                .slots
                .iter()
                .any(|slot| engagements.contains_key(&slot.entity_id))
            {
                // The anchor and route cursor remain frozen through combat and
                // regrouping, including repeated interruptions during regrouping.
                order.phase = pb::SentryPhase::Engaged as i32;
            } else if order.phase == pb::SentryPhase::Engaged as i32 {
                order.phase = pb::SentryPhase::Regrouping as i32;
            }
        }
    }
    pub fn tick_sentries(&mut self, state: &mut GameState, dt: f32) {
        if dt <= 0.0 {
            return;
        }
        self.prune_sentries();
        let types = &self.entity_types;
        let fallback = self.default_speed;
        for order in &mut self.sentries {
            order.slots.retain(|slot| {
                state.entities.iter().any(|entity| {
                    entity.id == slot.entity_id
                        && entity.owner_player_id == order.player_id
                        && entity.health > 0.0
                })
            });
            let (Some(anchor), Some(route)) = (&mut order.anchor, &mut order.route) else {
                continue;
            };
            let Some(destination) = route.destination() else {
                continue;
            };
            let command = match pb::SentryPhase::try_from(order.phase) {
                Ok(pb::SentryPhase::Engaged) => FormationCommand::Suspended,
                Ok(pb::SentryPhase::Patrolling) => FormationCommand::TravelTo(destination),
                _ => FormationCommand::Assemble,
            };
            let progress = FormationMover {
                anchor,
                slots: &order.slots,
            }
            .step(
                &mut state.entities,
                command,
                |entity| {
                    types
                        .get(&entity.entity_type_id)
                        .map(|def| def.speed)
                        .unwrap_or(fallback)
                        .max(0.0)
                },
                dt,
            );
            match progress {
                FormationProgress::Ready => order.phase = pb::SentryPhase::Patrolling as i32,
                FormationProgress::Arrived => {
                    route.advance();
                }
                _ => {}
            }
            if let Some(target) = route.destination() {
                for slot in &order.slots {
                    if let Some(active) = self.current_action.get_mut(&slot.entity_id) {
                        if let Some(pb::action_state::Exec::Move(mov)) = active.action.exec.as_mut()
                        {
                            if let (Some(motion), Some(offset)) = (&mut mov.target, slot.offset) {
                                motion.target = Some(pb::Vec2 {
                                    x: target.x + offset.x,
                                    y: target.y + offset.y,
                                });
                            }
                        }
                    }
                }
            }
        }
        self.sentries.retain(|order| !order.slots.is_empty());
    }
    pub fn append_sentry_changes(&self, delta: &mut pb::Delta) {
        delta.sentry_order_updates = self
            .sentries
            .iter()
            .filter(|order| self.published_sentries.get(&order.client_cmd_id) != Some(order))
            .cloned()
            .collect();
        delta.sentry_order_removals = self
            .published_sentries
            .values()
            .filter(|old| {
                !self
                    .sentries
                    .iter()
                    .any(|order| order.client_cmd_id == old.client_cmd_id)
            })
            .map(|order| pb::SentryOrderRemoval {
                client_cmd_id: order.client_cmd_id.clone(),
                player_id: order.player_id.clone(),
            })
            .collect();
        delta
            .sentry_order_removals
            .sort_by(|a, b| a.client_cmd_id.cmp(&b.client_cmd_id));
    }
    pub fn acknowledge_sentry_changes(&mut self, delta: &pb::Delta) {
        for order in &delta.sentry_order_updates {
            self.published_sentries
                .insert(order.client_cmd_id.clone(), order.clone());
        }
        for order in &delta.sentry_order_removals {
            self.published_sentries.remove(&order.client_cmd_id);
        }
    }
}

impl Engine {
    pub(super) async fn persist_sentry_changes(&mut self) -> Result<()> {
        let updates: Vec<_> = self
            .intents
            .sentries
            .iter()
            .filter(|order| {
                self.intents.persisted_sentries.get(&order.client_cmd_id) != Some(order)
            })
            .cloned()
            .collect();
        let removed: Vec<_> = self
            .intents
            .persisted_sentries
            .keys()
            .filter(|id| {
                !self
                    .intents
                    .sentries
                    .iter()
                    .any(|order| &order.client_cmd_id == *id)
            })
            .cloned()
            .collect();
        if updates.is_empty() && removed.is_empty() {
            return Ok(());
        }
        self.redis
            .persist_sentry_changes(&updates, &removed)
            .await?;
        for order in updates {
            self.intents
                .persisted_sentries
                .insert(order.client_cmd_id.clone(), order);
        }
        for id in removed {
            self.intents.persisted_sentries.remove(&id);
        }
        Ok(())
    }

    pub(super) async fn activate_sentry(
        &mut self,
        command: pb::SentryIntent,
        metadata: IntentMetadata,
    ) -> Result<()> {
        let destination = command.destination;
        if !destination.is_some_and(|point| point.x.is_finite() && point.y.is_finite()) {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::InvalidTarget,
                self.state.tick,
            )
            .await?;
            bail!("invalid Sentry destination");
        }
        let destination = destination.unwrap();
        if matches!(
            metadata.policy,
            pb::IntentPolicy::Append | pb::IntentPolicy::ClearThenAppend
        ) {
            let Some(index) = self
                .intents
                .sentries
                .iter()
                .position(|order| order.client_cmd_id == command.order_client_cmd_id)
            else {
                self.emit_route_edit_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                )
                .await?;
                bail!("Sentry order no longer exists");
            };
            if self.intents.sentries[index].player_id != metadata.player_id {
                self.emit_route_edit_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::NotOwned,
                )
                .await?;
                bail!("Sentry order not owned");
            }
            let order = &mut self.intents.sentries[index];
            if !order.route.as_mut().is_some_and(|route| {
                edit_sentry_route(
                    route,
                    destination,
                    metadata.policy == pb::IntentPolicy::ClearThenAppend,
                )
            }) {
                self.emit_route_edit_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    pb::LifecycleReason::InvalidTarget,
                )
                .await?;
                bail!("invalid Sentry route edit");
            }
            order.last_client_cmd_id = metadata.client_cmd_id.clone();
            self.persist_sentry_changes().await?;
            self.emit_route_edit_event(
                &metadata,
                pb::LifecycleState::Accepted,
                pb::LifecycleReason::None,
            )
            .await?;
            self.emit_route_edit_event(
                &metadata,
                pb::LifecycleState::Finished,
                pb::LifecycleReason::None,
            )
            .await?;
            return Ok(());
        }
        let mut ids = command.entity_ids;
        ids.sort_unstable();
        let reason =
            if ids.is_empty() || ids.len() > 256 || ids.windows(2).any(|pair| pair[0] == pair[1]) {
                Some(pb::LifecycleReason::InvalidTarget)
            } else if ids.iter().any(|id| {
                self.state
                    .entities
                    .iter()
                    .any(|entity| entity.id == *id && entity.owner_player_id != metadata.player_id)
            }) {
                Some(pb::LifecycleReason::NotOwned)
            } else if ids.iter().any(|id| {
                !self.state.entities.iter().any(|entity| {
                    entity.id == *id
                        && entity.owner_player_id == metadata.player_id
                        && entity.health > 0.0
                        && entity
                            .pos
                            .is_some_and(|point| point.x.is_finite() && point.y.is_finite())
                        && self
                            .content
                            .as_ref()
                            .and_then(|pack| pack.get(&entity.entity_type_id))
                            .is_some_and(|def| def.speed.is_finite() && def.speed > 0.0)
                })
            }) {
                Some(pb::LifecycleReason::InvalidTarget)
            } else {
                None
            };
        if let Some(reason) = reason {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                reason,
                self.state.tick,
            )
            .await?;
            bail!("invalid Sentry membership");
        }
        let Some(layout) = formation_layout(&self.state.entities, &ids, |entity| {
            self.content
                .as_ref()
                .unwrap()
                .get(&entity.entity_type_id)
                .unwrap()
                .hull_radius
        }) else {
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Rejected,
                pb::LifecycleReason::InvalidTarget,
                self.state.tick,
            )
            .await?;
            bail!("invalid Sentry formation");
        };
        let order = new_sentry_order(layout, &metadata, destination);
        let mut canceled = Vec::new();
        let mut members = Vec::new();
        for slot in &order.slots {
            let mut member_metadata = metadata.clone();
            member_metadata.entity_id = slot.entity_id;
            let offset = slot.offset.unwrap();
            let target = pb::Vec2 {
                x: destination.x + offset.x,
                y: destination.y + offset.y,
            };
            let entity_type = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == slot.entity_id)
                .unwrap()
                .entity_type_id
                .clone();
            let outcome = self.intents.try_activate(
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                        entity_id: slot.entity_id,
                        target: Some(target),
                        ..Default::default()
                    })),
                },
                member_metadata.clone(),
                &entity_type,
            );
            canceled.extend(outcome.canceled);
            self.intents.detach_convoy_member(slot.entity_id);
            self.intents.detach_sentry_member(slot.entity_id);
            self.collection_retry_tick_by_entity.remove(&slot.entity_id);
            self.transport_wait_since_tick_by_entity
                .remove(&slot.entity_id);
            members.push((slot.entity_id, member_metadata, target));
        }
        self.intents.sentries.push(order.clone());
        self.redis
            .persist_formation_members(&members, "sentry", Some(&order))
            .await?;
        self.intents
            .persisted_sentries
            .insert(order.client_cmd_id.clone(), order);
        for (_, previous) in canceled {
            self.emit_lifecycle_event(
                &previous,
                pb::LifecycleState::Canceled,
                pb::LifecycleReason::Interrupted,
                self.state.tick,
            )
            .await?;
        }
        for (_, member, _) in members {
            self.emit_lifecycle_event(
                &member,
                pb::LifecycleState::Accepted,
                pb::LifecycleReason::None,
                self.state.tick,
            )
            .await?;
            self.emit_lifecycle_event(
                &member,
                pb::LifecycleState::InProgress,
                pb::LifecycleReason::None,
                self.state.tick,
            )
            .await?;
        }
        Ok(())
    }

    pub(super) async fn restore_sentries(
        &mut self,
        orders: Vec<pb::SentryOrderState>,
    ) -> Result<()> {
        self.redis.clear_sentry_orders().await?;
        for saved in orders {
            let saved_ids: Vec<_> = saved.slots.iter().map(|slot| slot.entity_id).collect();
            let Some(order) =
                recover_sentry_order(saved, &self.state.entities, &self.intents.entity_types)
            else {
                for id in saved_ids {
                    self.redis.clear_active_intent(id).await?;
                }
                continue;
            };
            for id in saved_ids {
                if !order.slots.iter().any(|slot| slot.entity_id == id) {
                    self.redis.clear_active_intent(id).await?;
                }
            }
            for slot in &order.slots {
                let entity_type = self
                    .state
                    .entities
                    .iter()
                    .find(|entity| entity.id == slot.entity_id)
                    .unwrap()
                    .entity_type_id
                    .clone();
                let target = order.route.as_ref().unwrap().destination().unwrap();
                let offset = slot.offset.unwrap();
                self.intents.try_activate(
                    pb::Intent {
                        kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                            entity_id: slot.entity_id,
                            target: Some(pb::Vec2 {
                                x: target.x + offset.x,
                                y: target.y + offset.y,
                            }),
                            ..Default::default()
                        })),
                    },
                    IntentMetadata {
                        entity_id: slot.entity_id,
                        intent_id: order.intent_id.clone(),
                        client_cmd_id: order.client_cmd_id.clone(),
                        player_id: order.player_id.clone(),
                        server_tick: order.started_tick,
                        policy: pb::IntentPolicy::ReplaceActive,
                        protocol_version: super::ENGINE_PROTOCOL_MAJOR,
                    },
                    &entity_type,
                );
            }
            if !order.slots.is_empty() {
                self.intents.sentries.push(order);
            }
        }
        self.persist_sentry_changes().await
    }
}
