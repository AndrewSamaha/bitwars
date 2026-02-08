pub mod state;
pub mod intent;
pub mod systems;
pub mod codec;
pub mod pb;

use std::collections::HashSet;
use crate::state::WorldState;

/// Core simulation engine that can run without Redis or network.
///
/// Includes in-memory dedupe by `client_cmd_id`, mirroring the Redis-backed
/// dedupe in the full rts-engine.  Envelopes with an empty `client_cmd_id`
/// bypass dedupe (legacy / test convenience).
pub struct Engine {
    pub state: WorldState,
    seen_cmds: HashSet<Vec<u8>>,
}

impl Engine {
    /// Create a new engine from a world state snapshot
    pub fn from_snapshot(state: WorldState) -> Self {
        Self {
            state,
            seen_cmds: HashSet::new(),
        }
    }

    /// Accept an intent envelope and apply it to the world state.
    ///
    /// Returns `Err(Reject::Duplicate)` if the same `client_cmd_id` has
    /// already been accepted (idempotent reject — state is unchanged).
    /// Empty `client_cmd_id` skips dedupe for backward compatibility.
    pub fn accept(&mut self, env: &IntentEnvelope) -> Result<(), Reject> {
        // Dedupe by client_cmd_id (skip if empty for legacy/test envelopes)
        if !env.client_cmd_id.is_empty() {
            if !self.seen_cmds.insert(env.client_cmd_id.clone()) {
                return Err(Reject::Duplicate);
            }
        }
        crate::intent::apply_move_intent(&mut self.state, env)
    }

    /// Advance the simulation by one tick
    pub fn tick(&mut self) {
        crate::systems::movement(&mut self.state);
    }
}

/// Error type for intent rejection
#[derive(Debug, thiserror::Error)]
pub enum Reject {
    #[error("Invalid target")]
    InvalidTarget,
    #[error("Protocol mismatch")]
    ProtocolMismatch,
    #[error("Out of order")]
    OutOfOrder,
    #[error("Duplicate")]
    Duplicate,
}

// Re-export the IntentEnvelope type for convenience
pub use crate::pb::IntentEnvelope;