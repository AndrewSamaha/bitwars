use std::collections::{HashMap, VecDeque};

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

#[derive(Clone)]
pub struct QueuedIntent {
    pub intent: pb::Intent,
    pub metadata: IntentMetadata,
}

pub struct ActiveIntent {
    pub action: pb::ActionState,
    pub metadata: IntentMetadata,
}

#[derive(Default)]
pub struct PolicyOutcome {
    pub canceled: Vec<(u64, IntentMetadata)>,
    pub blocked: bool,
}

/// Minimal intent manager that holds per-entity queues and current action state.
///
/// Notes:
/// - This is framework-agnostic and does not require adopting an ECS.
/// - Integrate with Engine by calling `ingest`, then `process_pending`, then `follow_targets` before `integrate()`.
pub struct IntentManager {
    intent_queues: HashMap<u64, VecDeque<QueuedIntent>>, // entity_id -> FIFO queue
    current_action: HashMap<u64, ActiveIntent>,          // entity_id -> executing action
    default_stop_radius: f32,
}

impl IntentManager {
    pub fn new(default_stop_radius: f32) -> Self {
        Self {
            intent_queues: HashMap::new(),
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

    pub fn enqueue(&mut self, intent: QueuedIntent) {
        if let Some(eid) = Self::intent_entity_id(&intent.intent) {
            let q = self.intent_queues.entry(eid).or_insert_with(VecDeque::new);
            q.push_back(intent);
        } else {
            warn!("dropping intent with no kind");
        }
    }

    /// If an entity has no current action, start the next one from its queue.
    /// Returns metadata for intents that transitioned to IN_PROGRESS.
    pub fn process_pending(&mut self) -> Vec<(u64, IntentMetadata)> {
        let mut started: Vec<(u64, IntentMetadata)> = Vec::new();
        let entity_ids: Vec<u64> = self.intent_queues.keys().cloned().collect();
        for eid in entity_ids {
            if self.current_action.contains_key(&eid) {
                continue;
            }
            let maybe_next = self.intent_queues.get_mut(&eid).and_then(|q| q.pop_front());
            if let Some(QueuedIntent { intent, metadata }) = maybe_next {
                let action = make_action_state_from_intent(intent, self.default_stop_radius);
                log_start(&metadata, &action, eid);
                self.current_action.insert(
                    eid,
                    ActiveIntent {
                        action,
                        metadata: metadata.clone(),
                    },
                );
                started.push((eid, metadata));
            }
        }
        started
    }

    /// Advances current move actions by `dt` at a given `speed`.
    /// Returns metadata for intents that transitioned to FINISHED.
    pub fn follow_targets(
        &mut self,
        state: &mut GameState,
        speed: f32,
        _dt: f32,
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
                            vel.x = dir_x * speed;
                            vel.y = dir_y * speed;
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

    pub fn apply_policy_before_enqueue(
        &mut self,
        intent: &pb::Intent,
        policy: pb::IntentPolicy,
    ) -> PolicyOutcome {
        let Some(entity_id) = Self::intent_entity_id(intent) else {
            warn!("policy application skipped for intent with no entity id");
            return PolicyOutcome::default();
        };

        let mut outcome = PolicyOutcome::default();

        match policy {
            pb::IntentPolicy::Unspecified | pb::IntentPolicy::ReplaceActive => {
                if let Some(active) = self.current_action.remove(&entity_id) {
                    log_cancel(&active.metadata, entity_id, "replace_active");
                    outcome.canceled.push((entity_id, active.metadata));
                }
            }
            pb::IntentPolicy::ClearThenAppend => {
                if let Some(active) = self.current_action.remove(&entity_id) {
                    log_cancel(&active.metadata, entity_id, "clear_then_append");
                    outcome.canceled.push((entity_id, active.metadata));
                }
                if let Some(queue) = self.intent_queues.get_mut(&entity_id) {
                    while let Some(QueuedIntent { metadata, .. }) = queue.pop_front() {
                        log_cancel(&metadata, entity_id, "clear_then_append_queue");
                        outcome.canceled.push((entity_id, metadata));
                    }
                }
            }
            pb::IntentPolicy::Append => {}
        }

        let still_active = self.current_action.contains_key(&entity_id);
        let queue_blocked = self
            .intent_queues
            .get(&entity_id)
            .map(|q| !q.is_empty())
            .unwrap_or(false);
        outcome.blocked = still_active || queue_blocked;

        outcome
    }

    pub fn snapshot(
        &self,
    ) -> (
        &HashMap<u64, VecDeque<QueuedIntent>>,
        &HashMap<u64, ActiveIntent>,
    ) {
        (&self.intent_queues, &self.current_action)
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

    fn make_action_state(intent: &pb::Intent) -> pb::ActionState {
        let exec = match intent.kind.as_ref() {
            Some(pb::intent::Kind::Move(m)) => Some(pb::action_state::Exec::Move(pb::MoveState {
                target: Some(pb::MotionTarget {
                    target: m.target.clone(),
                    stop_radius: 0.75,
                }),
            })),
            Some(pb::intent::Kind::Attack(a)) => Some(pb::action_state::Exec::Attack(pb::AttackState {
                target_id: a.target_id,
                last_known_pos: None,
            })),
            Some(pb::intent::Kind::Build(b)) => Some(pb::action_state::Exec::Build(pb::BuildState {
                blueprint_id: b.blueprint_id.clone(),
                location: b.location.clone(),
                progress: 0.0,
            })),
            None => None,
        };
        pb::ActionState {
            intent: Some(intent.clone()),
            exec,
        }
    }

    #[test]
    fn replace_active_cancels_current_intent() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 7_u64;
        let existing_intent = make_move_intent(entity_id, (10.0, 5.0));
        let existing_meta = make_metadata(1, pb::IntentPolicy::ReplaceActive);

        manager.current_action.insert(
            entity_id,
            ActiveIntent {
                action: make_action_state(&existing_intent),
                metadata: existing_meta.clone(),
            },
        );

        let incoming_intent = make_move_intent(entity_id, (20.0, -4.0));
        let outcome = manager.apply_policy_before_enqueue(
            &incoming_intent,
            pb::IntentPolicy::ReplaceActive,
        );

        assert_eq!(outcome.canceled.len(), 1, "active intent should be canceled");
        assert_eq!(outcome.canceled[0].0, entity_id);
        assert_eq!(outcome.canceled[0].1.intent_id, existing_meta.intent_id);
        assert!(!outcome.blocked, "no active or queued intents remain after replace");
    }

    #[test]
    fn append_policy_flags_blocked_when_queue_not_empty() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 3_u64;
        let queued_intent = QueuedIntent {
            intent: make_move_intent(entity_id, (1.0, 1.0)),
            metadata: make_metadata(2, pb::IntentPolicy::Append),
        };

        let mut queue = VecDeque::new();
        queue.push_back(queued_intent);
        manager.intent_queues.insert(entity_id, queue);

        let new_intent = make_move_intent(entity_id, (2.0, 2.0));
        let outcome = manager.apply_policy_before_enqueue(&new_intent, pb::IntentPolicy::Append);

        assert!(outcome.canceled.is_empty());
        assert!(outcome.blocked, "existing queue should mark blocked=true");
    }

    #[test]
    fn lifecycle_progression_moves_from_pending_to_finished() {
        let mut manager = IntentManager::new(0.75);
        let entity_id = 11_u64;
        let metadata = make_metadata(3, pb::IntentPolicy::ReplaceActive);
        let move_intent = make_move_intent(entity_id, (0.0, 0.0));

        manager.enqueue(QueuedIntent {
            intent: move_intent.clone(),
            metadata: metadata.clone(),
        });

        let started = manager.process_pending();
        assert_eq!(started.len(), 1, "intent should transition to in-progress");
        assert_eq!(started[0].0, entity_id);
        assert_eq!(started[0].1.intent_id, metadata.intent_id);

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
