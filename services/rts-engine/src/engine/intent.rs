use std::collections::HashMap;

use tracing::{info, warn};

use crate::engine::state::GameState;
use crate::pb;

#[derive(Clone)]
pub struct IntentMetadata {
    pub intent_id: Vec<u8>,
    pub client_cmd_id: Vec<u8>,
    pub player_id: String,
    pub protocol_version: u32,
    pub server_tick: u64,
    pub policy: pb::IntentPolicy,
}

pub struct ActiveIntent {
    pub action: pb::ActionState,
    pub metadata: IntentMetadata,
}

/// Result of trying to activate an intent (M1: no server-side queue).
pub struct ActivationOutcome {
    /// Intents that were canceled by this activation (REPLACE_ACTIVE preemption).
    pub canceled: Vec<(u64, IntentMetadata)>,
    /// The intent was started: (entity_id, metadata). None if rejected.
    pub started: Option<(u64, IntentMetadata)>,
    /// True if the intent was rejected because the entity already has an active intent
    /// and the policy does not allow preemption (APPEND / CLEAR_THEN_APPEND when busy).
    pub rejected_busy: bool,
}

/// M1 intent manager: active-only, no server-side queue.
///
/// The client maintains per-entity FIFO queues; the server only tracks
/// one active intent per entity at a time.
///
/// Integrate with Engine by calling `try_activate` during intent ingestion,
/// then `follow_targets` before `integrate()` each tick.
pub struct IntentManager {
    current_action: HashMap<u64, ActiveIntent>,
    default_stop_radius: f32,
}

impl IntentManager {
    pub fn new(default_stop_radius: f32) -> Self {
        Self {
            current_action: HashMap::new(),
            default_stop_radius,
        }
    }

    fn intent_entity_id(intent: &pb::Intent) -> Option<u64> {
        match intent.kind.as_ref()? {
            pb::intent::Kind::Move(m) => Some(m.entity_id),
            pb::intent::Kind::Attack(a) => Some(a.entity_id),
            pb::intent::Kind::Build(b) => Some(b.entity_id),
        }
    }

    /// Try to activate an intent for the target entity.
    ///
    /// M1 rules:
    /// - `REPLACE_ACTIVE` (or unspecified): cancel current intent (if any), start new.
    /// - `APPEND` / `CLEAR_THEN_APPEND`: reject with `ENTITY_BUSY` if entity already
    ///   has an active intent. Client should not send these while entity is busy.
    /// - Any policy when entity is idle: start immediately.
    pub fn try_activate(
        &mut self,
        intent: pb::Intent,
        metadata: IntentMetadata,
    ) -> ActivationOutcome {
        let Some(entity_id) = Self::intent_entity_id(&intent) else {
            warn!("intent with no entity id, cannot activate");
            return ActivationOutcome {
                canceled: vec![],
                started: None,
                rejected_busy: false,
            };
        };

        let has_active = self.current_action.contains_key(&entity_id);
        let mut canceled = Vec::new();

        match metadata.policy {
            pb::IntentPolicy::Unspecified | pb::IntentPolicy::ReplaceActive => {
                // Cancel current if present, then start new
                if let Some(active) = self.current_action.remove(&entity_id) {
                    log_cancel(&active.metadata, entity_id, "replace_active");
                    canceled.push((entity_id, active.metadata));
                }
            }
            pb::IntentPolicy::Append | pb::IntentPolicy::ClearThenAppend => {
                if has_active {
                    // Entity is busy; client should not have sent this
                    return ActivationOutcome {
                        canceled: vec![],
                        started: None,
                        rejected_busy: true,
                    };
                }
            }
        }

        // Start the intent
        let action = make_action_state_from_intent(intent, self.default_stop_radius);
        log_start(&metadata, &action, entity_id);
        let started_meta = metadata.clone();
        self.current_action.insert(
            entity_id,
            ActiveIntent { action, metadata },
        );

        ActivationOutcome {
            canceled,
            started: Some((entity_id, started_meta)),
            rejected_busy: false,
        }
    }

    /// Advances current move actions by `dt` at a given `speed`.
    ///
    /// Applies overshoot clamping: if an entity's next step would carry it
    /// past the `stop_radius` boundary, the entity is snapped to the boundary
    /// and velocity is zeroed.  This prevents the classic oscillation pattern
    /// where a fast entity ping-pongs past the target.
    ///
    /// Returns metadata for intents that transitioned to FINISHED.
    pub fn follow_targets(
        &mut self,
        state: &mut GameState,
        speed: f32,
        dt: f32,
    ) -> Vec<(u64, IntentMetadata)> {
        let mut finished: Vec<u64> = Vec::new();

        for (eid, active) in self.current_action.iter_mut() {
            match active.action.exec.as_mut() {
                Some(pb::action_state::Exec::Move(mov)) => {
                    let Some(mt) = mov.target.as_ref() else {
                        warn!("follow_targets: missing MotionTarget for entity id {}", eid);
                        finished.push(*eid);
                        continue;
                    };
                    let Some(to) = mt.target.as_ref() else {
                        warn!("follow_targets: missing target Vec2 for entity id {}", eid);
                        finished.push(*eid);
                        continue;
                    };
                    let stop_r = mt.stop_radius;
                    if let Some(entity) = find_entity_mut(state, *eid) {
                        let pos = entity.pos.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                        let vel = entity.vel.get_or_insert(pb::Vec2 { x: 0.0, y: 0.0 });
                        let dx = to.x - pos.x;
                        let dy = to.y - pos.y;
                        let dist2 = dx * dx + dy * dy;
                        let sr2 = stop_r * stop_r;
                        if dist2 <= sr2 {
                            vel.x = 0.0;
                            vel.y = 0.0;
                            finished.push(*eid);
                        } else {
                            let dist = dist2.sqrt();
                            let dir_x = dx / dist;
                            let dir_y = dy / dist;
                            let effective_dist = dist - stop_r;
                            let step = speed * dt;
                            if step >= effective_dist {
                                // Overshoot prevention: snap to stop boundary
                                // and arrive immediately.  Without this clamp a
                                // fast entity would ping-pong past the target.
                                pos.x = to.x - dir_x * stop_r;
                                pos.y = to.y - dir_y * stop_r;
                                vel.x = 0.0;
                                vel.y = 0.0;
                                finished.push(*eid);
                            } else {
                                vel.x = dir_x * speed;
                                vel.y = dir_y * speed;
                            }
                        }
                    } else {
                        warn!("follow_targets: entity id {} not found", eid);
                        finished.push(*eid);
                    }
                }
                _ => {}
            }
        }

        let mut notifications = Vec::with_capacity(finished.len());
        for eid in finished {
            if let Some(active) = self.current_action.remove(&eid) {
                log_finish(&active.metadata, &active.action, eid);
                notifications.push((eid, active.metadata));
            }
        }
        notifications
    }

    /// Read-only view of active intents (M1: no server-side queues).
    pub fn active_intents(&self) -> &HashMap<u64, ActiveIntent> {
        &self.current_action
    }
}

fn make_action_state_from_intent(intent: pb::Intent, default_stop_radius: f32) -> pb::ActionState {
    let mut exec: Option<pb::action_state::Exec> = None;
    if let Some(kind) = intent.kind.as_ref() {
        match kind {
            pb::intent::Kind::Move(m) => {
                let move_state = pb::MoveState {
                    target: Some(pb::MotionTarget {
                        target: m.target.clone(),
                        stop_radius: default_stop_radius,
                    }),
                };
                exec = Some(pb::action_state::Exec::Move(move_state));
            }
            pb::intent::Kind::Attack(a) => {
                let attack_state = pb::AttackState {
                    target_id: a.target_id,
                    last_known_pos: None,
                };
                exec = Some(pb::action_state::Exec::Attack(attack_state));
            }
            pb::intent::Kind::Build(b) => {
                let build_state = pb::BuildState {
                    blueprint_id: b.blueprint_id.clone(),
                    location: b.location.clone(),
                    progress: 0.0,
                };
                exec = Some(pb::action_state::Exec::Build(build_state));
            }
        }
    } else {
        warn!("intent had no kind; ignoring");
    }
    pb::ActionState {
        intent: Some(intent),
        exec,
    }
}

fn find_entity_mut<'a>(state: &'a mut GameState, id: u64) -> Option<&'a mut pb::Entity> {
    state.entities.iter_mut().find(|e| e.id == id)
}

fn trace_start(metadata: &IntentMetadata, kind: &str, entity_id: u64) {
    info!(
        entity_id,
        intent_id = %format_uuid(&metadata.intent_id),
        client_cmd_id = %format_uuid(&metadata.client_cmd_id),
        player_id = %metadata.player_id,
        "start intent={kind}"
    );
}

fn log_start(metadata: &IntentMetadata, action: &pb::ActionState, entity_id: u64) {
    let kind = match action.exec.as_ref() {
        Some(pb::action_state::Exec::Move(_)) => "Move",
        Some(pb::action_state::Exec::Attack(_)) => "Attack",
        Some(pb::action_state::Exec::Build(_)) => "Build",
        None => "Unknown",
    };
    trace_start(metadata, kind, entity_id);
}

fn log_finish(metadata: &IntentMetadata, action: &pb::ActionState, entity_id: u64) {
    let kind = match action.exec.as_ref() {
        Some(pb::action_state::Exec::Move(_)) => "Move",
        Some(pb::action_state::Exec::Attack(_)) => "Attack",
        Some(pb::action_state::Exec::Build(_)) => "Build",
        None => "Unknown",
    };
    info!(
        entity_id,
        intent_id = %format_uuid(&metadata.intent_id),
        client_cmd_id = %format_uuid(&metadata.client_cmd_id),
        player_id = %metadata.player_id,
        "finish intent={kind}"
    );
}

fn log_cancel(metadata: &IntentMetadata, entity_id: u64, ctx: &str) {
    info!(
        entity_id,
        intent_id = %format_uuid(&metadata.intent_id),
        client_cmd_id = %format_uuid(&metadata.client_cmd_id),
        player_id = %metadata.player_id,
        context = %ctx,
        "cancel intent"
    );
}

pub(crate) fn format_uuid(bytes: &[u8]) -> String {
    if bytes.len() == 16 {
        if let Ok(uuid) = uuid::Uuid::from_slice(bytes) {
            return uuid.to_string();
        }
    }
    hex::encode(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::state::GameState;
    use crate::pb;

    fn make_move_intent(entity_id: u64, target: (f32, f32)) -> pb::Intent {
        pb::Intent {
            kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
                entity_id,
                target: Some(pb::Vec2 {
                    x: target.0,
                    y: target.1,
                }),
                client_cmd_id: String::new(),
                player_id: String::new(),
            })),
        }
    }

    fn make_metadata(intent_id_byte: u8, policy: pb::IntentPolicy) -> IntentMetadata {
        IntentMetadata {
            intent_id: vec![intent_id_byte; 16],
            client_cmd_id: vec![intent_id_byte + 1; 16],
            player_id: "tester".into(),
            protocol_version: 1,
            server_tick: 0,
            policy,
        }
    }

    #[test]
    fn replace_active_cancels_current_and_starts_new() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 7_u64;

        // First, activate an intent
        let first_intent = make_move_intent(entity_id, (10.0, 5.0));
        let first_meta = make_metadata(1, pb::IntentPolicy::ReplaceActive);
        let outcome = manager.try_activate(first_intent, first_meta.clone());
        assert!(outcome.started.is_some());
        assert!(outcome.canceled.is_empty());
        assert!(!outcome.rejected_busy);

        // Now replace it
        let second_intent = make_move_intent(entity_id, (20.0, -4.0));
        let second_meta = make_metadata(2, pb::IntentPolicy::ReplaceActive);
        let outcome = manager.try_activate(second_intent, second_meta);
        assert!(outcome.started.is_some());
        assert_eq!(outcome.canceled.len(), 1, "first intent should be canceled");
        assert_eq!(outcome.canceled[0].0, entity_id);
        assert_eq!(outcome.canceled[0].1.intent_id, first_meta.intent_id);
        assert!(!outcome.rejected_busy);
    }

    #[test]
    fn append_rejects_when_entity_busy() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 3_u64;

        // Activate first intent
        let first = make_move_intent(entity_id, (1.0, 1.0));
        let first_meta = make_metadata(1, pb::IntentPolicy::ReplaceActive);
        let outcome = manager.try_activate(first, first_meta);
        assert!(outcome.started.is_some());

        // Try APPEND while busy -> should be rejected
        let second = make_move_intent(entity_id, (2.0, 2.0));
        let second_meta = make_metadata(2, pb::IntentPolicy::Append);
        let outcome = manager.try_activate(second, second_meta);
        assert!(outcome.started.is_none());
        assert!(outcome.rejected_busy, "APPEND should be rejected when entity is busy");
        assert!(outcome.canceled.is_empty());
    }

    #[test]
    fn clear_then_append_rejects_when_entity_busy() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 3_u64;

        // Activate first intent
        let first = make_move_intent(entity_id, (1.0, 1.0));
        let first_meta = make_metadata(1, pb::IntentPolicy::ReplaceActive);
        manager.try_activate(first, first_meta);

        // Try CLEAR_THEN_APPEND while busy -> should be rejected
        let second = make_move_intent(entity_id, (5.0, 5.0));
        let second_meta = make_metadata(2, pb::IntentPolicy::ClearThenAppend);
        let outcome = manager.try_activate(second, second_meta);
        assert!(outcome.started.is_none());
        assert!(outcome.rejected_busy);
    }

    #[test]
    fn append_starts_when_entity_idle() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 5_u64;

        // Entity has no active intent; APPEND should start immediately
        let intent = make_move_intent(entity_id, (10.0, 10.0));
        let meta = make_metadata(1, pb::IntentPolicy::Append);
        let outcome = manager.try_activate(intent, meta);
        assert!(outcome.started.is_some());
        assert!(!outcome.rejected_busy);
        assert!(outcome.canceled.is_empty());
    }

    #[test]
    fn lifecycle_immediate_finish_at_target() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 11_u64;
        let metadata = make_metadata(3, pb::IntentPolicy::ReplaceActive);
        let move_intent = make_move_intent(entity_id, (0.0, 0.0));

        // Activate immediately (no queue)
        let outcome = manager.try_activate(move_intent, metadata.clone());
        assert!(outcome.started.is_some());
        assert_eq!(outcome.started.as_ref().unwrap().0, entity_id);

        // Entity is already at (0,0), target is (0,0) -> should finish immediately
        let mut state = GameState {
            tick: 0,
            entities: vec![pb::Entity {
                id: entity_id,
                pos: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                vel: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
                force: Some(pb::Vec2 { x: 0.0, y: 0.0 }),
            }],
        };

        let finished = manager.follow_targets(&mut state, 5.0, 0.016);
        assert_eq!(finished.len(), 1, "intent should complete immediately at target");
        assert_eq!(finished[0].0, entity_id);
        assert_eq!(finished[0].1.intent_id, metadata.intent_id);
    }
}
