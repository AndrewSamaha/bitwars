pub mod state;
pub mod intent;
pub mod systems;
pub mod codec;
pub mod pb;

use anyhow::Result;
use crate::state::WorldState;

/// Core simulation engine that can run without Redis or network
pub struct Engine {
    pub state: WorldState,
}

impl Engine {
    /// Create a new engine from a world state snapshot
    pub fn from_snapshot(state: WorldState) -> Self {
        Self { state }
    }

    /// Accept an intent envelope and apply it to the world state
    pub fn accept(&mut self, env: &IntentEnvelope) -> Result<(), Reject> {
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