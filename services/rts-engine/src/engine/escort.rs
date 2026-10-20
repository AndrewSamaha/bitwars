//! Maintained leader-relative following. The leader's own action is never claimed.
use super::{
    formation::approach,
    intent::{IntentManager, IntentMetadata},
    state::GameState,
    Engine,
};
use crate::{content::EntityTypeDef, pb};
use anyhow::{bail, Result};
use std::collections::{HashMap, HashSet};

fn finite(p: pb::Vec2) -> bool {
    p.x.is_finite() && p.y.is_finite()
}
fn eligible(entity: &pb::Entity, types: &HashMap<String, EntityTypeDef>) -> bool {
    entity.health > 0.0
        && entity.pos.is_some_and(finite)
        && types.get(&entity.entity_type_id).is_some_and(|def| {
            def.speed.is_finite()
                && def.speed > 0.0
                && def.hull_radius.is_finite()
                && def.hull_radius >= 0.0
        })
}

// Square rings reserve the center for the leader. Indices are shared by all
// orders on a leader; deletion never shifts a survivor into a different cell.
fn cell(index: u32) -> (i32, i32) {
    let mut remaining = index;
    for ring in 1_i32.. {
        let width = (ring * 2) as u32;
        if remaining < width * 4 {
            let side = remaining / width;
            let step = (remaining % width) as i32;
            return match side {
                0 => (ring, -ring + step),
                1 => (ring - step, ring),
                2 => (-ring, ring - step),
                _ => (-ring + step, -ring),
            };
        }
        remaining -= width * 4;
    }
    unreachable!()
}
fn offset(index: u32, spacing: f32) -> pb::Vec2 {
    let (x, y) = cell(index);
    pb::Vec2 {
        x: x as f32 * spacing,
        y: y as f32 * spacing,
    }
}
fn translated(anchor: pb::Vec2, offset: pb::Vec2) -> pb::Vec2 {
    pb::Vec2 {
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
    }
}

impl IntentManager {
    fn recover_escorts(&mut self, orders: Vec<pb::EscortOrderState>, state: &GameState) {
        let mut reserved: HashSet<(u64, u32)> = HashSet::new();
        let mut members = HashSet::new();
        let leaders: HashSet<_> = orders.iter().map(|o| o.target_entity_id).collect();
        for mut order in orders {
            let valid = order.intent_id.len() == 16
                && order.client_cmd_id.len() == 16
                && order.slots.len() <= 256
                && state.entities.iter().any(|e| {
                    e.id == order.target_entity_id
                        && e.owner_player_id == order.player_id
                        && eligible(e, &self.entity_types)
                });
            order.slots.retain_mut(|slot| {
                let keep = valid
                    && slot.slot_index < 256
                    && slot.offset.is_some_and(finite)
                    && !leaders.contains(&slot.entity_id)
                    && !members.contains(&slot.entity_id)
                    && !reserved.contains(&(order.target_entity_id, slot.slot_index))
                    && state.entities.iter().any(|e| {
                        e.id == slot.entity_id
                            && e.owner_player_id == order.player_id
                            && eligible(e, &self.entity_types)
                    });
                if keep {
                    members.insert(slot.entity_id);
                    reserved.insert((order.target_entity_id, slot.slot_index));
                    slot.status = "returning".into();
                }
                keep
            });
            let Some(anchor) = state
                .entities
                .iter()
                .find(|e| e.id == order.target_entity_id)
                .and_then(|e| e.pos)
            else {
                continue;
            };
            for slot in &order.slots {
                let entity_type = state
                    .entities
                    .iter()
                    .find(|e| e.id == slot.entity_id)
                    .unwrap()
                    .entity_type_id
                    .clone();
                self.try_activate(
                    pb::Intent {
                        kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                            entity_id: slot.entity_id,
                            target: Some(translated(anchor, slot.offset.unwrap())),
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
                self.escorts.push(order);
            }
        }
    }

    fn cancel_invalid_escort_members(
        &mut self,
        state: &mut GameState,
    ) -> Vec<(u64, IntentMetadata)> {
        self.prune_escorts();
        let mut canceled = Vec::new();
        for order in &mut self.escorts {
            let valid_leader = state.entities.iter().any(|e| {
                e.id == order.target_entity_id
                    && e.owner_player_id == order.player_id
                    && eligible(e, &self.entity_types)
            });
            order.slots.retain(|slot| {
                let valid = valid_leader
                    && state.entities.iter().any(|e| {
                        e.id == slot.entity_id
                            && e.owner_player_id == order.player_id
                            && eligible(e, &self.entity_types)
                    });
                if !valid {
                    canceled.push(slot.entity_id);
                }
                valid
            });
        }
        let result = canceled
            .into_iter()
            .filter_map(|id| {
                if let Some(entity) = state.entities.iter_mut().find(|e| e.id == id) {
                    entity.vel = Some(pb::Vec2::default());
                }
                self.current_action
                    .remove(&id)
                    .map(|active| (id, active.metadata))
            })
            .collect();
        self.prune_escorts();
        result
    }

    fn plan_escort(
        &self,
        command: pb::EscortIntent,
        metadata: &IntentMetadata,
        state: &GameState,
    ) -> std::result::Result<pb::EscortOrderState, pb::LifecycleReason> {
        let mut ids = command.entity_ids;
        ids.sort_unstable();
        let leader_id = command.target_entity_id;
        let reason = if ids.is_empty()
            || ids.len() > 256
            || ids.contains(&leader_id)
            || ids.windows(2).any(|p| p[0] == p[1])
        {
            Some(pb::LifecycleReason::InvalidTarget)
        } else if ids.iter().chain(std::iter::once(&leader_id)).any(|id| {
            state
                .entities
                .iter()
                .any(|e| e.id == *id && e.owner_player_id != metadata.player_id)
        }) {
            Some(pb::LifecycleReason::NotOwned)
        } else if ids.iter().chain(std::iter::once(&leader_id)).any(|id| {
            !state
                .entities
                .iter()
                .any(|e| e.id == *id && eligible(e, &self.entity_types))
        }) {
            Some(pb::LifecycleReason::InvalidTarget)
        } else if !matches!(
            metadata.policy,
            pb::IntentPolicy::ReplaceActive | pb::IntentPolicy::Unspecified
        ) || self.escorts.iter().any(|o| {
            o.slots.iter().any(|s| s.entity_id == leader_id) || ids.contains(&o.target_entity_id)
        }) {
            Some(pb::LifecycleReason::EntityBusy)
        } else {
            None
        };
        let existing: Vec<_> = self
            .escorts
            .iter()
            .filter(|o| o.target_entity_id == leader_id)
            .flat_map(|o| o.slots.iter())
            .filter(|s| !ids.contains(&s.entity_id))
            .collect();
        let reason = reason.or_else(|| {
            (existing.len() + ids.len() > 256).then_some(pb::LifecycleReason::InvalidTarget)
        });
        if let Some(reason) = reason {
            return Err(reason);
        }
        let anchor = state
            .entities
            .iter()
            .find(|e| e.id == leader_id)
            .unwrap()
            .pos
            .unwrap();
        let mut used: HashSet<_> = existing.iter().map(|s| s.slot_index).collect();
        let radius = state
            .entities
            .iter()
            .filter(|e| {
                e.id == leader_id
                    || ids.contains(&e.id)
                    || existing.iter().any(|s| s.entity_id == e.id)
            })
            .filter_map(|e| self.entity_types.get(&e.entity_type_id))
            .map(|d| d.hull_radius)
            .fold(0.0_f32, f32::max);
        let spacing = radius * 2.0 + 1.0;
        if !spacing.is_finite() || !finite(translated(anchor, offset(255, spacing))) {
            return Err(pb::LifecycleReason::InvalidTarget);
        }
        let slots = ids
            .iter()
            .map(|id| {
                let index = (0..256).find(|i| !used.contains(i)).unwrap();
                used.insert(index);
                pb::EscortSlot {
                    entity_id: *id,
                    slot_index: index,
                    offset: Some(offset(index, spacing)),
                    status: "forming".into(),
                }
            })
            .collect();
        Ok(pb::EscortOrderState {
            intent_id: metadata.intent_id.clone(),
            client_cmd_id: metadata.client_cmd_id.clone(),
            player_id: metadata.player_id.clone(),
            started_tick: metadata.server_tick,
            target_entity_id: leader_id,
            slots,
        })
    }

    pub fn escort_member_ids(&self) -> HashSet<u64> {
        self.escorts
            .iter()
            .flat_map(|order| order.slots.iter().map(|slot| slot.entity_id))
            .collect()
    }
    pub fn detach_escort_member(&mut self, id: u64) {
        for order in &mut self.escorts {
            order.slots.retain(|slot| slot.entity_id != id);
        }
        self.escorts.retain(|order| !order.slots.is_empty());
    }
    pub fn prune_escorts(&mut self) {
        let actions = &self.current_action;
        for order in &mut self.escorts {
            order.slots.retain(|slot| {
                actions
                    .get(&slot.entity_id)
                    .is_some_and(|active| active.metadata.intent_id == order.intent_id)
            });
        }
        self.escorts.retain(|order| !order.slots.is_empty());
    }
    /// Acquisition range also bounds target selection and pursuit around the
    /// moving leader. No combat profile means a ship only follows.
    pub fn escort_combat_leashes(&self, state: &GameState) -> HashMap<u64, (pb::Vec2, f32)> {
        let mut leashes = HashMap::new();
        for order in &self.escorts {
            let Some(leader) = state.entities.iter().find(|e| {
                e.id == order.target_entity_id
                    && e.owner_player_id == order.player_id
                    && eligible(e, &self.entity_types)
            }) else {
                continue;
            };
            for slot in &order.slots {
                let range = state
                    .entities
                    .iter()
                    .find(|e| e.id == slot.entity_id)
                    .and_then(|e| self.entity_types.get(&e.entity_type_id))
                    .and_then(|def| def.combat.as_ref())
                    .map(|profile| profile.acquisition_range)
                    .filter(|r| r.is_finite() && *r > 0.0)
                    .unwrap_or(0.0);
                leashes.insert(slot.entity_id, (leader.pos.unwrap(), range));
            }
        }
        leashes
    }
    pub fn prepare_escorts(&mut self, engagements: &HashMap<u64, u64>) {
        for order in &mut self.escorts {
            for slot in &mut order.slots {
                if engagements.contains_key(&slot.entity_id) {
                    slot.status = "engaging".into();
                } else if slot.status == "engaging" {
                    slot.status = "returning".into();
                }
            }
        }
    }
    /// Called after physics AND other formation orders, so leaders in a Convoy
    /// or Sentry have their resolved positions before followers move.
    pub fn tick_escorts(&mut self, state: &mut GameState, dt: f32) {
        if !dt.is_finite() || dt <= 0.0 {
            return;
        }
        self.prune_escorts();
        // Preserve previous spacing on removal; only grow when new hulls need it.
        let mut spacing_by_leader: HashMap<u64, f32> = HashMap::new();
        for order in &self.escorts {
            let mut radius = state
                .entities
                .iter()
                .filter(|e| {
                    e.id == order.target_entity_id
                        || order.slots.iter().any(|s| s.entity_id == e.id)
                })
                .filter_map(|e| self.entity_types.get(&e.entity_type_id))
                .map(|d| d.hull_radius)
                .fold(0.0_f32, f32::max);
            for slot in &order.slots {
                let (x, y) = cell(slot.slot_index);
                if let Some(p) = slot.offset {
                    let divisor = x.abs().max(y.abs()) as f32;
                    radius = radius.max((p.x.abs().max(p.y.abs()) / divisor - 1.0) / 2.0);
                }
            }
            let spacing = radius * 2.0 + 1.0;
            spacing_by_leader
                .entry(order.target_entity_id)
                .and_modify(|s| *s = s.max(spacing))
                .or_insert(spacing);
        }
        for order in &mut self.escorts {
            let Some(anchor) = state
                .entities
                .iter()
                .find(|e| e.id == order.target_entity_id)
                .and_then(|e| e.pos)
            else {
                continue;
            };
            for slot in &mut order.slots {
                let desired_offset =
                    offset(slot.slot_index, spacing_by_leader[&order.target_entity_id]);
                slot.offset = Some(desired_offset);
                if slot.status == "engaging" {
                    continue;
                }
                let Some(entity) = state.entities.iter_mut().find(|e| e.id == slot.entity_id)
                else {
                    continue;
                };
                let speed = self
                    .entity_types
                    .get(&entity.entity_type_id)
                    .map(|d| d.speed)
                    .unwrap_or(self.default_speed);
                let Some(from) = entity.pos else { continue };
                let target = translated(anchor, desired_offset);
                let (next, arrived) = approach(from, target, speed * dt);
                // Unlike assembly, arriving at a moving slot must retain its
                // actual displacement velocity, rather than reporting a stop.
                entity.vel = Some(pb::Vec2 {
                    x: (next.x - from.x) / dt,
                    y: (next.y - from.y) / dt,
                });
                entity.pos = Some(next);
                if let Some(active) = self.current_action.get_mut(&slot.entity_id) {
                    if let Some(pb::action_state::Exec::Move(mov)) = active.action.exec.as_mut() {
                        if let Some(motion) = &mut mov.target {
                            motion.target = Some(target);
                        }
                    }
                }
                let error = (target.x - next.x).hypot(target.y - next.y);
                let settled = arrived
                    || error
                        <= if slot.status == "in_formation" {
                            0.5
                        } else {
                            0.1
                        };
                if settled {
                    slot.status = "in_formation".into();
                } else if slot.status != "returning" {
                    slot.status = "catching_up".into();
                }
            }
        }
    }
    pub fn append_escort_changes(&self, delta: &mut pb::Delta) {
        delta.escort_order_updates = self
            .escorts
            .iter()
            .filter(|o| self.published_escorts.get(&o.client_cmd_id) != Some(o))
            .cloned()
            .collect();
        delta.escort_order_removals = self
            .published_escorts
            .values()
            .filter(|old| {
                !self
                    .escorts
                    .iter()
                    .any(|o| o.client_cmd_id == old.client_cmd_id)
            })
            .map(|o| pb::EscortOrderRemoval {
                client_cmd_id: o.client_cmd_id.clone(),
                player_id: o.player_id.clone(),
            })
            .collect();
        delta
            .escort_order_updates
            .sort_by(|a, b| a.client_cmd_id.cmp(&b.client_cmd_id));
        delta
            .escort_order_removals
            .sort_by(|a, b| a.client_cmd_id.cmp(&b.client_cmd_id));
    }
    pub fn acknowledge_escort_changes(&mut self, delta: &pb::Delta) {
        for o in &delta.escort_order_removals {
            self.published_escorts.remove(&o.client_cmd_id);
        }
        for o in &delta.escort_order_updates {
            self.published_escorts
                .insert(o.client_cmd_id.clone(), o.clone());
        }
    }
}

impl Engine {
    pub(super) async fn persist_escort_changes(&mut self) -> Result<()> {
        self.intents.prune_escorts();
        let updates: Vec<_> = self
            .intents
            .escorts
            .iter()
            .filter(|o| self.intents.persisted_escorts.get(&o.client_cmd_id) != Some(o))
            .cloned()
            .collect();
        let removed: Vec<_> = self
            .intents
            .persisted_escorts
            .keys()
            .filter(|id| !self.intents.escorts.iter().any(|o| &o.client_cmd_id == *id))
            .cloned()
            .collect();
        if updates.is_empty() && removed.is_empty() {
            return Ok(());
        }
        self.redis
            .persist_escort_changes(&updates, &removed)
            .await?;
        for o in updates {
            self.intents
                .persisted_escorts
                .insert(o.client_cmd_id.clone(), o);
        }
        for id in removed {
            self.intents.persisted_escorts.remove(&id);
        }
        Ok(())
    }
    pub(super) async fn cancel_invalid_escorts(&mut self) -> Result<()> {
        for (id, metadata) in self.intents.cancel_invalid_escort_members(&mut self.state) {
            self.redis.clear_active_intent(id).await?;
            self.emit_lifecycle_event(
                &metadata,
                pb::LifecycleState::Canceled,
                pb::LifecycleReason::EscortTargetLost,
                self.state.tick,
            )
            .await?;
        }
        Ok(())
    }
    pub(super) async fn activate_escort(
        &mut self,
        command: pb::EscortIntent,
        metadata: IntentMetadata,
    ) -> Result<()> {
        self.intents.prune_escorts();
        let order = match self.intents.plan_escort(command, &metadata, &self.state) {
            Ok(order) => order,
            Err(reason) => {
                self.emit_lifecycle_event(
                    &metadata,
                    pb::LifecycleState::Rejected,
                    reason,
                    self.state.tick,
                )
                .await?;
                bail!("invalid Escort order: {reason:?}");
            }
        };
        let anchor = self
            .state
            .entities
            .iter()
            .find(|e| e.id == order.target_entity_id)
            .unwrap()
            .pos
            .unwrap();
        let mut canceled = Vec::new();
        for slot in &order.slots {
            let entity_type = self
                .state
                .entities
                .iter()
                .find(|e| e.id == slot.entity_id)
                .unwrap()
                .entity_type_id
                .clone();
            let mut member = metadata.clone();
            member.entity_id = slot.entity_id;
            let outcome = self.intents.try_activate(
                pb::Intent {
                    kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                        entity_id: slot.entity_id,
                        target: Some(translated(anchor, slot.offset.unwrap())),
                        ..Default::default()
                    })),
                },
                member,
                &entity_type,
            );
            canceled.extend(outcome.canceled);
            self.intents.detach_convoy_member(slot.entity_id);
            self.intents.detach_sentry_member(slot.entity_id);
            self.intents.detach_escort_member(slot.entity_id);
            self.collection_retry_tick_by_entity.remove(&slot.entity_id);
            self.transport_wait_since_tick_by_entity
                .remove(&slot.entity_id);
        }
        self.intents.escorts.push(order.clone());
        self.persist_escort_changes().await?;
        for (_, old) in canceled {
            self.emit_lifecycle_event(
                &old,
                pb::LifecycleState::Canceled,
                pb::LifecycleReason::Interrupted,
                self.state.tick,
            )
            .await?;
        }
        for slot in order.slots {
            let mut member = metadata.clone();
            member.entity_id = slot.entity_id;
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
    pub(super) async fn restore_escorts(
        &mut self,
        orders: Vec<pb::EscortOrderState>,
    ) -> Result<()> {
        self.redis.clear_escort_orders().await?;
        let saved_ids: HashSet<_> = orders
            .iter()
            .flat_map(|o| o.slots.iter().map(|s| s.entity_id))
            .collect();
        self.intents.recover_escorts(orders, &self.state);
        let restored_ids = self.intents.escort_member_ids();
        for id in saved_ids.difference(&restored_ids) {
            if !self.intents.current_action.contains_key(id) {
                self.redis.clear_active_intent(*id).await?;
            }
        }
        self.persist_escort_changes().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pb::intent::Kind;

    fn fixture() -> (IntentManager, GameState) {
        let types = [("worker", 2.0), ("guard", 8.0)]
            .into_iter()
            .map(|(name, speed)| {
                let def = serde_json::from_value(serde_json::json!({
                    "fog_memory": "forget_when_hidden", "speed": speed, "stop_radius": 5.0,
                    "hull_radius": 1.0, "mass": 1.0, "health": 100.0, "max_capacity": {}
                }))
                .unwrap();
                (name.into(), def)
            })
            .collect();
        let mut manager = IntentManager::new(types, 5.0, 1.0);
        let mut state = GameState { generation: Default::default(),
            tick: 0,
            entities: vec![],
            technologies: HashMap::new(),
        };
        for (id, name, x, y) in [
            (1, "worker", 0.0, 0.0),
            (2, "guard", -20.0, 0.0),
            (3, "guard", 3.0, 0.0),
        ] {
            state.entities.push(pb::Entity {
                id,
                entity_type_id: name.into(),
                owner_player_id: "me".into(),
                health: 100.0,
                pos: Some(pb::Vec2 { x, y }),
                ..Default::default()
            });
            let metadata = IntentMetadata {
                entity_id: if id == 1 { 0 } else { id },
                intent_id: vec![id as u8; 16],
                client_cmd_id: vec![id as u8; 16],
                player_id: "me".into(),
                server_tick: 0,
                protocol_version: super::super::ENGINE_PROTOCOL_MAJOR,
                policy: pb::IntentPolicy::ReplaceActive,
            };
            manager.try_activate(
                pb::Intent {
                    kind: Some(if id == 1 {
                        Kind::Collect(pb::CollectIntent {
                            entity_id: id,
                            resource_type_id: "food".into(),
                            ..Default::default()
                        })
                    } else {
                        Kind::Move(pb::MoveToLocationIntent {
                            entity_id: id,
                            target: Some(pb::Vec2 { x: 100.0, y: 0.0 }),
                            ..Default::default()
                        })
                    }),
                },
                metadata,
                name,
            );
        }
        for (id, index) in [(2, 0), (3, 1)] {
            manager.escorts.push(pb::EscortOrderState {
                intent_id: vec![id as u8; 16],
                client_cmd_id: vec![id as u8; 16],
                player_id: "me".into(),
                target_entity_id: 1,
                slots: vec![pb::EscortSlot {
                    entity_id: id,
                    slot_index: index,
                    offset: Some(offset(index, 3.0)),
                    status: "forming".into(),
                }],
                ..Default::default()
            });
        }
        (manager, state)
    }
    fn pos(state: &GameState, id: u64) -> pb::Vec2 {
        state
            .entities
            .iter()
            .find(|e| e.id == id)
            .unwrap()
            .pos
            .unwrap()
    }

    fn metadata() -> IntentMetadata {
        IntentMetadata {
            entity_id: 0,
            intent_id: vec![9; 16],
            client_cmd_id: vec![9; 16],
            player_id: "me".into(),
            server_tick: 1,
            protocol_version: super::super::ENGINE_PROTOCOL_MAJOR,
            policy: pb::IntentPolicy::ReplaceActive,
        }
    }

    #[test]
    fn validation_is_atomic_for_invalid_members_targets_policies_and_chains() {
        let (manager, state) = fixture();
        let original: Vec<_> = manager
            .current_action
            .iter()
            .map(|(id, a)| (*id, a.action.clone()))
            .collect();
        for (ids, leader, reason) in [
            (vec![], 1, pb::LifecycleReason::InvalidTarget),
            (vec![2, 2], 1, pb::LifecycleReason::InvalidTarget),
            (vec![1, 2], 1, pb::LifecycleReason::InvalidTarget),
            (vec![2, 999], 1, pb::LifecycleReason::InvalidTarget),
            (vec![2], 999, pb::LifecycleReason::InvalidTarget),
            (vec![3], 2, pb::LifecycleReason::EntityBusy),
            (vec![1], 3, pb::LifecycleReason::EntityBusy),
        ] {
            assert_eq!(
                manager.plan_escort(
                    pb::EscortIntent {
                        entity_ids: ids,
                        target_entity_id: leader
                    },
                    &metadata(),
                    &state
                ),
                Err(reason)
            );
        }
        let mut append = metadata();
        append.policy = pb::IntentPolicy::Append;
        assert_eq!(
            manager.plan_escort(
                pb::EscortIntent {
                    entity_ids: vec![2],
                    target_entity_id: 1
                },
                &append,
                &state
            ),
            Err(pb::LifecycleReason::EntityBusy)
        );
        let mut foreign = state.clone();
        foreign.entities[0].owner_player_id = "other".into();
        assert_eq!(
            manager.plan_escort(
                pb::EscortIntent {
                    entity_ids: vec![2],
                    target_entity_id: 1
                },
                &metadata(),
                &foreign
            ),
            Err(pb::LifecycleReason::NotOwned)
        );
        for (id, action) in original {
            assert_eq!(manager.current_action[&id].action, action);
        }
    }

    #[test]
    fn new_batches_reserve_free_slots_and_count_the_total_per_leader() {
        let (mut manager, mut state) = fixture();
        let mut new_guard = state.entities[1].clone();
        new_guard.id = 4;
        state.entities.push(new_guard);
        let plan = manager
            .plan_escort(
                pb::EscortIntent {
                    entity_ids: vec![4],
                    target_entity_id: 1,
                },
                &metadata(),
                &state,
            )
            .unwrap();
        assert_eq!(plan.slots[0].slot_index, 2);
        assert_eq!(manager.escorts[0].slots[0].slot_index, 0);
        assert_eq!(manager.escorts[1].slots[0].slot_index, 1);
        for index in 2..256 {
            manager.escorts[0].slots.push(pb::EscortSlot {
                entity_id: 1000 + index as u64,
                slot_index: index,
                ..Default::default()
            });
        }
        assert_eq!(
            manager.plan_escort(
                pb::EscortIntent {
                    entity_ids: vec![4],
                    target_entity_id: 1
                },
                &metadata(),
                &state
            ),
            Err(pb::LifecycleReason::InvalidTarget)
        );
    }

    #[test]
    fn target_loss_cancels_followers_and_owner_change_does_not_retarget() {
        for change_owner in [false, true] {
            let (mut manager, mut state) = fixture();
            if change_owner {
                state.entities[0].owner_player_id = "other".into();
            } else {
                state.entities.remove(0);
            }
            let canceled = manager.cancel_invalid_escort_members(&mut state);
            assert_eq!(canceled.len(), 2);
            assert!(manager.escorts.is_empty());
            assert!(manager.current_action.contains_key(&1)); // never replace the worker task
            assert!(!manager.current_action.contains_key(&2));
            assert_eq!(
                state.entities.iter().find(|e| e.id == 2).unwrap().vel,
                Some(pb::Vec2::default())
            );
        }
    }

    #[test]
    fn recovery_reforms_at_current_leader_and_rejects_lost_leaders_or_duplicate_cells() {
        let (mut manager, mut state) = fixture();
        manager.escorts[0].slots[0].status = "engaging".into();
        let saved = manager.escorts.clone();
        manager.escorts.clear();
        manager.current_action.remove(&2);
        manager.current_action.remove(&3);
        state.entities[0].pos.as_mut().unwrap().x = 100.0;
        manager.recover_escorts(saved.clone(), &state);
        assert_eq!(manager.escorts[0].slots[0].status, "returning");
        assert_eq!(manager.escorts[0].slots[0].offset, saved[0].slots[0].offset);
        assert_eq!(
            manager.current_action[&2].metadata.intent_id,
            saved[0].intent_id
        );
        manager.tick_escorts(&mut state, 1.0);
        assert!(pos(&state, 2).x > -20.0);
        manager.escorts.clear();
        manager.current_action.remove(&2);
        manager.current_action.remove(&3);
        let mut duplicates = saved.clone();
        duplicates[1].slots[0].slot_index = 0;
        manager.recover_escorts(duplicates, &state);
        assert_eq!(manager.escort_member_ids().len(), 1);
        manager.escorts.clear();
        manager.current_action.remove(&2);
        state.entities.remove(0);
        manager.recover_escorts(saved, &state);
        assert!(manager.escorts.is_empty());
    }

    #[test]
    fn slots_reserve_center_and_do_not_overlap_across_batches() {
        let cells: HashSet<_> = (0..256).map(cell).collect();
        assert_eq!(cells.len(), 256);
        assert!(!cells.contains(&(0, 0)));
        for i in 0..256 {
            assert!(offset(i, 3.0).x.abs().max(offset(i, 3.0).y.abs()) >= 3.0);
        }
    }

    #[test]
    fn catches_up_then_matches_worker_and_stops_without_overshoot() {
        let (mut manager, mut state) = fixture();
        let worker_action = manager.current_action[&1].action.clone();
        let mut settled = false;
        for _ in 0..30 {
            state.entities[0].pos.as_mut().unwrap().x += 2.0;
            let before = pos(&state, 2);
            let leader = state.entities[0].clone();
            manager.tick_escorts(&mut state, 1.0);
            assert_eq!(state.entities[0], leader);
            let after = pos(&state, 2);
            assert!((after.x - before.x).hypot(after.y - before.y) <= 8.0001);
            if manager.escorts[0].slots[0].status == "in_formation" {
                if settled {
                    assert!((state.entities[1].vel.unwrap().x - 2.0).abs() < 0.001);
                }
                settled = true;
                assert_eq!(
                    after,
                    translated(pos(&state, 1), manager.escorts[0].slots[0].offset.unwrap())
                );
            }
        }
        assert!(settled);
        assert_eq!(manager.current_action[&1].action, worker_action);
        let before = pos(&state, 2);
        manager.tick_escorts(&mut state, 1.0);
        assert_eq!(pos(&state, 2), before);
        assert_eq!(state.entities[1].vel.unwrap(), pb::Vec2::default());
        // Restart and reverse direction without a high-speed oscillation.
        state.entities[0].pos.as_mut().unwrap().x -= 2.0;
        manager.tick_escorts(&mut state, 1.0);
        assert_eq!(state.entities[1].vel.unwrap().x, -2.0);
    }

    #[test]
    fn slow_guards_fall_behind_without_slowing_worker() {
        let (mut manager, mut state) = fixture();
        manager.entity_types.get_mut("guard").unwrap().speed = 1.0;
        manager.escorts[0].slots[0].status = "in_formation".into();
        for _ in 0..5 {
            state.entities[0].pos.as_mut().unwrap().x += 2.0;
            manager.tick_escorts(&mut state, 1.0);
        }
        assert_eq!(pos(&state, 1).x, 10.0);
        assert_eq!(manager.escorts[0].slots[0].status, "catching_up");
    }

    #[test]
    fn combat_keeps_slot_and_other_members_follow_then_guard_returns_to_moving_leader() {
        let (mut manager, mut state) = fixture();
        let original = manager.escorts[0].clone();
        manager.prepare_escorts(&HashMap::from([(2, 99)]));
        let before = state.entities[1].clone();
        state.entities[0].pos.as_mut().unwrap().x = 10.0;
        manager.tick_escorts(&mut state, 1.0);
        assert_eq!(state.entities[1], before); // combat owns position AND velocity
        assert_ne!(pos(&state, 3).x, 3.0);
        assert_eq!(manager.escorts[0].slots[0].status, "engaging");
        manager.prepare_escorts(&HashMap::new());
        assert_eq!(manager.escorts[0].slots[0].status, "returning");
        for _ in 0..12 {
            state.entities[0].pos.as_mut().unwrap().x += 2.0;
            manager.tick_escorts(&mut state, 1.0);
        }
        assert_eq!(manager.escorts[0].slots[0].status, "in_formation");
        assert_eq!(manager.escorts[0].client_cmd_id, original.client_cmd_id);
        assert_eq!(manager.escorts[0].slots[0].offset, original.slots[0].offset);
        assert_eq!(
            pos(&state, 2),
            translated(pos(&state, 1), original.slots[0].offset.unwrap())
        );
        assert_eq!(state.entities[1].vel.unwrap().x, 2.0);
    }

    #[test]
    fn individual_replacement_preserves_other_slots_and_publishes_removal_without_motion() {
        let (mut manager, mut state) = fixture();
        let mut delta = pb::Delta::default();
        manager.append_escort_changes(&mut delta);
        manager.acknowledge_escort_changes(&delta);
        let survivor = manager.escorts[1].slots[0].offset;
        manager.current_action.remove(&2);
        manager.prune_escorts();
        manager.append_escort_changes(&mut delta);
        assert_eq!(delta.escort_order_removals.len(), 1);
        assert_eq!(delta.escort_order_removals[0].client_cmd_id, vec![2; 16]);
        manager.tick_escorts(&mut state, 1.0);
        assert_eq!(manager.escorts[0].slots[0].offset, survivor);
    }

    #[test]
    fn formation_following_is_independent_of_physics_damping() {
        let (mut manager, mut state) = fixture();
        let cfg = crate::config::GameConfig {
            friction: 100.0,
            ..Default::default()
        };
        for _ in 0..20 {
            manager.follow_targets(&mut state, 1.0, 1.0);
            crate::physics::integrate(&cfg, &mut state, 1.0);
            state.entities[0].pos.as_mut().unwrap().x += 2.0;
            manager.tick_escorts(&mut state, 1.0);
        }
        assert_eq!(
            pos(&state, 2),
            translated(pos(&state, 1), manager.escorts[0].slots[0].offset.unwrap())
        );
        assert_eq!(state.entities[1].vel.unwrap().x, 2.0);
        assert!(manager.current_action.contains_key(&2));
    }

    #[test]
    fn checkpoints_preserve_entity_reference_slots_and_member_status() {
        use prost::Message;
        let (manager, state) = fixture();
        let snapshot = pb::Snapshot {
            entities: state.entities,
            escort_orders: manager.escorts.clone(),
            ..Default::default()
        };
        let decoded = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        assert_eq!(decoded.escort_orders, manager.escorts);
        assert_eq!(decoded.escort_orders[0].target_entity_id, 1);
    }
}
