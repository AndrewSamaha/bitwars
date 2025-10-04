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

pub(crate) fn format_uuid(bytes: &[u8]) -> String {
    if bytes.len() == 16 {
        if let Ok(uuid) = uuid::Uuid::from_slice(bytes) {
            return uuid.to_string();
        }
    }
    hex::encode(bytes)
}
