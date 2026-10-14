//! Temporary, authoritative formation orders. Members retain ordinary active
//! action slots for interruption/lifecycle handling; movement belongs to the order.
#[cfg(test)]
use super::formation::formation_slots;
use super::formation::{formation_layout, FormationCommand, FormationMover, FormationProgress};
use super::{
    intent::{IntentManager, IntentMetadata},
    state::GameState,
    Engine,
};
use crate::{io::redis::IntentPoint, pb};
use anyhow::{bail, Result};
use std::collections::HashSet;

impl IntentManager {
    pub fn detach_convoy_member(&mut self, entity_id: u64) {
        for order in &mut self.convoys {
            order.slots.retain(|slot| slot.entity_id != entity_id);
        }
        self.convoys.retain(|order| !order.slots.is_empty());
    }

    pub fn prune_convoys(&mut self) {
        let actions = &self.current_action;
        for order in &mut self.convoys {
            order.slots.retain(|slot| {
                actions
                    .get(&slot.entity_id)
                    .is_some_and(|active| active.metadata.intent_id == order.intent_id)
            });
        }
        self.convoys.retain(|order| !order.slots.is_empty());
    }

    /// Integrate directly after ordinary physics so damping cannot distort the
    /// shared displacement. Assembly reaches exact slots without stop-radius error.
    pub fn tick_convoys(&mut self, state: &mut GameState, dt: f32) -> Vec<(u64, IntentMetadata)> {
        self.prune_convoys();
        let mut finished = Vec::new();
        let types = &self.entity_types;
        let default_speed = self.default_speed;
        let speed_for = |entity: &pb::Entity| {
            types
                .get(&entity.entity_type_id)
                .map(|def| def.speed)
                .unwrap_or(default_speed)
                .max(0.0)
        };
        for order in &mut self.convoys {
            order.slots.retain(|slot| {
                state.entities.iter().any(|entity| {
                    entity.id == slot.entity_id && entity.owner_player_id == order.player_id
                })
            });
            let (Some(anchor), Some(destination)) = (&mut order.anchor, &order.destination) else {
                continue;
            };
            let command = if order.traveling {
                FormationCommand::TravelTo(*destination)
            } else {
                FormationCommand::Assemble
            };
            let progress = FormationMover {
                anchor,
                slots: &order.slots,
            }
            .step(&mut state.entities, command, speed_for, dt);
            match progress {
                // Preserve the assembly barrier: depart on the following tick.
                FormationProgress::Ready => order.traveling = true,
                FormationProgress::Arrived => {
                    finished.extend(order.slots.iter().map(|slot| slot.entity_id))
                }
                _ => {}
            }
        }

        let notifications = finished
            .into_iter()
            .filter_map(|id| {
                self.current_action
                    .remove(&id)
                    .map(|active| (id, active.metadata))
            })
            .collect();
        self.prune_convoys();
        notifications
    }
}

impl Engine {
    pub(super) async fn activate_convoy(
        &mut self,
        command: pb::ConvoyIntent,
        metadata: IntentMetadata,
    ) -> Result<()> {
        // Validate the entire order before preempting any member.
        let mut ids = command.entity_ids;
        ids.sort_unstable();
        let unique: HashSet<_> = ids.iter().copied().collect();
        let destination = command.destination;
        let reason = if ids.len() < 2
            || ids.len() > 256
            || unique.len() != ids.len()
            || !destination
                .as_ref()
                .is_some_and(|point| point.x.is_finite() && point.y.is_finite())
        {
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
                    && entity
                        .pos
                        .is_some_and(|point| point.x.is_finite() && point.y.is_finite())
                    && entity.health > 0.0
                    && self
                        .content
                        .as_ref()
                        .and_then(|pack| pack.get(&entity.entity_type_id))
                        .is_some_and(|def| def.speed.is_finite() && def.speed > 0.0)
            })
        }) {
            Some(pb::LifecycleReason::InvalidTarget)
        } else if metadata.policy != pb::IntentPolicy::ReplaceActive
            && metadata.policy != pb::IntentPolicy::Unspecified
        {
            Some(pb::LifecycleReason::EntityBusy)
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
            bail!("invalid convoy order: {reason:?}");
        }
        let destination = destination.unwrap();
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
            bail!("invalid convoy formation geometry");
        };
        let anchor = layout.anchor;
        let slots = layout.slots;
        let mut canceled = Vec::new();
        let mut members = Vec::new();
        for slot in &slots {
            let id = slot.entity_id;
            let mut member_metadata = metadata.clone();
            member_metadata.entity_id = id;
            let entity_type = self
                .state
                .entities
                .iter()
                .find(|entity| entity.id == id)
                .unwrap()
                .entity_type_id
                .clone();
            let offset = slot.offset.unwrap();
            let target = pb::Vec2 {
                x: destination.x + offset.x,
                y: destination.y + offset.y,
            };
            let outcome = self.intents.try_activate(
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                        entity_id: id,
                        target: Some(target),
                        ..Default::default()
                    })),
                },
                member_metadata.clone(),
                &entity_type,
            );
            self.intents.detach_convoy_member(id);
            self.intents.detach_sentry_member(id);
            canceled.extend(outcome.canceled);
            self.collection_retry_tick_by_entity.remove(&id);
            self.transport_wait_since_tick_by_entity.remove(&id);
            members.push((id, member_metadata, target));
        }
        self.intents.convoys.push(pb::ConvoyOrderState {
            intent_id: metadata.intent_id,
            client_cmd_id: metadata.client_cmd_id,
            player_id: metadata.player_id,
            started_tick: metadata.server_tick,
            anchor: Some(anchor),
            destination: Some(destination),
            slots,
            traveling: false,
        });
        // Commit all in-memory membership before I/O, and expose the new member
        // tracking rows in one Redis transaction for reconnect readers.
        self.redis.persist_formation_members(&members, "convoy", None).await?;
        for (_, old_metadata) in canceled {
            self.emit_lifecycle_event(
                &old_metadata,
                pb::LifecycleState::Canceled,
                pb::LifecycleReason::Interrupted,
                self.state.tick,
            )
            .await?;
        }
        for (_, member_metadata, _) in members {
            self.emit_lifecycle_event(
                &member_metadata,
                pb::LifecycleState::Accepted,
                pb::LifecycleReason::None,
                self.state.tick,
            )
            .await?;
            self.emit_lifecycle_event(
                &member_metadata,
                pb::LifecycleState::InProgress,
                pb::LifecycleReason::None,
                self.state.tick,
            )
            .await?;
        }
        Ok(())
    }

    pub(super) async fn advance_convoys(&mut self, dt: f32) -> Result<()> {
        for (id, metadata) in self.intents.tick_convoys(&mut self.state, dt) {
            self.redis.clear_active_intent(id).await?;
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Finished,
                pb::LifecycleReason::None,
                self.state.tick,
            )
            .await?;
        }
        Ok(())
    }
}

impl Engine {
    pub(super) async fn restore_convoys(
        &mut self,
        orders: Vec<pb::ConvoyOrderState>,
    ) -> Result<()> {
        for mut order in orders {
            let finite = |point: &Option<pb::Vec2>| {
                point.is_some_and(|p| p.x.is_finite() && p.y.is_finite())
            };
            if !finite(&order.anchor)
                || !finite(&order.destination)
                || order.intent_id.len() != 16
                || order.client_cmd_id.len() != 16
            {
                continue;
            }
            order.slots.retain(|slot| {
                finite(&slot.offset)
                    && self.state.entities.iter().any(|entity| {
                        entity.id == slot.entity_id && entity.owner_player_id == order.player_id
                    })
            });
            for slot in &order.slots {
                let entity = self
                    .state
                    .entities
                    .iter()
                    .find(|entity| entity.id == slot.entity_id)
                    .unwrap();
                let offset = slot.offset.unwrap();
                let destination = order.destination.unwrap();
                let target = pb::Vec2 {
                    x: destination.x + offset.x,
                    y: destination.y + offset.y,
                };
                let metadata = IntentMetadata {
                    entity_id: slot.entity_id,
                    intent_id: order.intent_id.clone(),
                    client_cmd_id: order.client_cmd_id.clone(),
                    player_id: order.player_id.clone(),
                    server_tick: order.started_tick,
                    protocol_version: super::ENGINE_PROTOCOL_MAJOR,
                    policy: pb::IntentPolicy::ReplaceActive,
                };
                self.intents.try_activate(
                    pb::Intent {
                        kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                            entity_id: slot.entity_id,
                            target: Some(target),
                            ..Default::default()
                        })),
                    },
                    metadata.clone(),
                    &entity.entity_type_id,
                );
                self.redis
                    .persist_active_intent(
                        slot.entity_id,
                        &metadata,
                        "convoy",
                        Some(IntentPoint {
                            x: target.x,
                            y: target.y,
                        }),
                        None,
                        None,
                    )
                    .await?;
            }
            if !order.slots.is_empty() {
                self.intents.convoys.push(order);
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::content::EntityTypeDef;
    use std::collections::HashMap;

    fn fixture() -> (IntentManager, GameState) {
        let mut types = HashMap::new();
        for (name, speed) in [("slow", 2.0), ("fast", 8.0)] {
            let def: EntityTypeDef = serde_json::from_value(serde_json::json!({
                "fog_memory": "forget_when_hidden", "speed": speed, "stop_radius": 5.0,
                "mass": 1.0, "health": 10.0, "max_capacity": {}
            }))
            .unwrap();
            types.insert(name.to_string(), def);
        }
        let mut manager = IntentManager::new(types, 5.0, 1.0);
        let mut state = GameState {
            tick: 0,
            entities: Vec::new(),
            technologies: HashMap::new(),
        };
        for (id, name, x) in [(1, "slow", -1.0), (2, "fast", 1.0)] {
            state.entities.push(pb::Entity {
                id,
                entity_type_id: name.into(),
                owner_player_id: "me".into(),
                health: 10.0,
                pos: Some(pb::Vec2 { x, y: 0.0 }),
                ..Default::default()
            });
            manager.try_activate(
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                        entity_id: id,
                        target: Some(pb::Vec2 { x: 20.0, y: 0.0 }),
                        ..Default::default()
                    })),
                },
                IntentMetadata {
                    entity_id: id,
                    intent_id: vec![1; 16],
                    client_cmd_id: vec![2; 16],
                    player_id: "me".into(),
                    protocol_version: super::super::ENGINE_PROTOCOL_MAJOR,
                    server_tick: 0,
                    policy: pb::IntentPolicy::ReplaceActive,
                },
                name,
            );
        }
        manager.convoys.push(pb::ConvoyOrderState {
            intent_id: vec![1; 16],
            client_cmd_id: vec![2; 16],
            player_id: "me".into(),
            anchor: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
            destination: Some(pb::Vec2 { x: 20.0, y: 0.0 }),
            slots: formation_slots(vec![2, 1], 2.0),
            ..Default::default()
        });
        (manager, state)
    }

    #[test]
    fn convoy_formation_is_centered_spaced_and_independent_of_selection_order() {
        let a = formation_slots(vec![7, 2, 9, 1, 6], 21.0);
        assert_eq!(a, formation_slots(vec![1, 2, 6, 7, 9], 21.0));
        assert!(a.iter().map(|s| s.offset.unwrap().x).sum::<f32>().abs() < 0.001);
        assert!(a.iter().map(|s| s.offset.unwrap().y).sum::<f32>().abs() < 0.001);
        for (i, left) in a.iter().enumerate() {
            for right in &a[i + 1..] {
                let (l, r) = (left.offset.unwrap(), right.offset.unwrap());
                assert!((l.x - r.x).hypot(l.y - r.y) >= 21.0);
            }
        }
    }

    #[test]
    fn convoy_waits_for_every_member_then_moves_at_the_slowest_speed() {
        let (mut manager, mut state) = fixture();
        state.entities[0].pos.as_mut().unwrap().x = -7.0;
        manager.tick_convoys(&mut state, 1.0);
        assert!(!manager.convoys[0].traveling);
        assert_eq!(manager.convoys[0].anchor.unwrap().x, 0.0);
        assert_eq!(state.entities[1].pos.unwrap().x, 1.0);
        manager.tick_convoys(&mut state, 1.0);
        manager.tick_convoys(&mut state, 1.0);
        assert!(manager.convoys[0].traveling);
        assert_eq!(manager.convoys[0].anchor.unwrap().x, 0.0);
        manager.tick_convoys(&mut state, 1.0);
        assert_eq!(manager.convoys[0].anchor.unwrap().x, 2.0);
        assert_eq!(state.entities[0].pos.unwrap().x, 1.0);
        assert_eq!(state.entities[1].pos.unwrap().x, 3.0);
        assert_eq!(state.entities[0].vel, state.entities[1].vel);
    }

    #[test]
    fn convoy_replacement_detaches_one_member_and_preserves_remaining_slots() {
        let (mut manager, mut state) = fixture();
        manager.tick_convoys(&mut state, 1.0);
        let offset = manager.convoys[0].slots[1].offset;
        let mut replacement = manager.current_action[&1].metadata.clone();
        replacement.intent_id = vec![3; 16];
        manager.try_activate(
            pb::Intent {
                kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                    entity_id: 1,
                    target: Some(pb::Vec2 { x: -20.0, y: 0.0 }),
                    ..Default::default()
                })),
            },
            replacement,
            "slow",
        );
        manager.prune_convoys();
        assert_eq!(manager.convoys[0].slots.len(), 1);
        assert_eq!(manager.convoys[0].slots[0].offset, offset);
        manager.tick_convoys(&mut state, 1.0);
        assert_eq!(manager.convoys[0].anchor.unwrap().x, 8.0);
        assert_eq!(state.entities[0].pos.unwrap().x, -1.0);
    }

    #[test]
    fn convoy_death_removes_a_member_and_recalculates_speed() {
        let (mut manager, mut state) = fixture();
        manager.tick_convoys(&mut state, 1.0);
        state.entities.retain(|entity| entity.id != 1);
        manager.finish(1);
        manager.tick_convoys(&mut state, 1.0);
        assert_eq!(manager.convoys[0].slots.len(), 1);
        assert_eq!(manager.convoys[0].anchor.unwrap().x, 8.0);
        manager.finish(2);
        manager.prune_convoys();
        assert!(manager.convoys.is_empty());
    }

    #[test]
    fn convoy_checkpoint_preserves_travel_phase_and_offsets() {
        use prost::Message;
        let (mut original, mut state) = fixture();
        original.tick_convoys(&mut state, 1.0);
        original.tick_convoys(&mut state, 1.0);
        let snapshot = pb::Snapshot {
            tick: 2,
            entities: state.entities.clone(),
            convoys: original.convoys.clone(),
            ..Default::default()
        };
        let decoded = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        let (mut recovered, mut recovered_state) = fixture();
        recovered.convoys = decoded.convoys;
        recovered_state.entities = decoded.entities;
        original.tick_convoys(&mut state, 0.5);
        recovered.tick_convoys(&mut recovered_state, 0.5);
        assert_eq!(state.entities, recovered_state.entities);
        assert_eq!(original.convoys, recovered.convoys);
    }

    #[test]
    fn convoy_shared_motion_is_not_distorted_by_ordinary_physics_damping() {
        let (mut manager, mut state) = fixture();
        manager.tick_convoys(&mut state, 1.0);
        let cfg = crate::config::GameConfig {
            friction: 100.0,
            ..Default::default()
        };
        for step in 1..=3 {
            assert!(manager.follow_targets(&mut state, 1.0, 1.0).is_empty());
            crate::physics::integrate(&cfg, &mut state, 1.0);
            assert!(manager.tick_convoys(&mut state, 1.0).is_empty());
            let anchor_x = step as f32 * 2.0;
            assert_eq!(manager.convoys[0].anchor.unwrap().x, anchor_x);
            assert_eq!(state.entities[0].pos.unwrap().x, anchor_x - 1.0);
            assert_eq!(state.entities[1].pos.unwrap().x, anchor_x + 1.0);
            assert_eq!(state.entities[0].vel.unwrap().x, 2.0);
            assert_eq!(state.entities[0].vel, state.entities[1].vel);
        }
    }

    #[test]
    fn convoy_arrives_exactly_and_finishes_all_members() {
        let (mut manager, mut state) = fixture();
        manager.tick_convoys(&mut state, 1.0);
        // Ordinary move processing must not complete convoy member actions.
        assert!(manager.follow_targets(&mut state, 1.0, 50.0).is_empty());
        let finished = manager.tick_convoys(&mut state, 50.0);
        assert_eq!(finished.len(), 2);
        assert!(manager.convoys.is_empty());
        assert!(manager.active_intents().is_empty());
        assert_eq!(state.entities[0].pos.unwrap().x, 19.0);
        assert_eq!(state.entities[1].pos.unwrap().x, 21.0);
        assert_eq!(state.entities[0].vel.unwrap().x, 0.0);
    }
}
