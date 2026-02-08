pub mod state;
pub mod intent;
pub mod systems;
pub mod codec;
pub mod pb;

use std::collections::{HashMap, HashSet};
use crate::state::WorldState;

/// Default movement speed (world units per second), matching rts-engine config.
pub const DEFAULT_SPEED: f32 = 90.0;
/// Default tick duration at 60 TPS.
pub const DEFAULT_DT: f32 = 1.0 / 60.0;
/// Default stop radius (world units), matching rts-engine config.
pub const DEFAULT_STOP_RADIUS: f32 = 0.75;

/// In-flight motion target for an entity.
#[derive(Clone, Debug)]
pub struct MotionTarget {
    pub x: f32,
    pub y: f32,
    pub stop_radius: f32,
}

/// Core simulation engine that can run without Redis or network.
///
/// Includes in-memory dedupe by `client_cmd_id`, mirroring the Redis-backed
/// dedupe in the full rts-engine.  Envelopes with an empty `client_cmd_id`
/// bypass dedupe (legacy / test convenience).
///
/// Movement is target-based: `accept()` sets a `MotionTarget` for the entity,
/// and `tick()` steers it toward the target with overshoot clamping to prevent
/// oscillation.  Entities arrive when they reach the `stop_radius` boundary.
pub struct Engine {
    pub state: WorldState,
    seen_cmds: HashSet<Vec<u8>>,
    motion_targets: HashMap<u64, MotionTarget>,
    speed: f32,
    dt: f32,
    stop_radius: f32,
}

impl Engine {
    /// Create a new engine from a world state snapshot.
    pub fn from_snapshot(state: WorldState) -> Self {
        Self {
            state,
            seen_cmds: HashSet::new(),
            motion_targets: HashMap::new(),
            speed: DEFAULT_SPEED,
            dt: DEFAULT_DT,
            stop_radius: DEFAULT_STOP_RADIUS,
        }
    }

    /// Set movement speed (world units per second).
    pub fn with_speed(mut self, speed: f32) -> Self {
        self.speed = speed;
        self
    }

    /// Set tick duration (seconds).
    pub fn with_dt(mut self, dt: f32) -> Self {
        self.dt = dt;
        self
    }

    /// Set the default stop radius for motion targets.
    pub fn with_stop_radius(mut self, stop_radius: f32) -> Self {
        self.stop_radius = stop_radius;
        self
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
        crate::intent::apply_intent(
            &mut self.state,
            &mut self.motion_targets,
            self.stop_radius,
            env,
        )
    }

    /// Advance the simulation by one tick.
    ///
    /// Steers entities toward their motion targets, applies overshoot
    /// clamping to prevent oscillation, integrates positions, and returns
    /// entity IDs that arrived this tick.
    pub fn tick(&mut self) -> Vec<u64> {
        crate::systems::tick_movement(
            &mut self.state,
            &mut self.motion_targets,
            self.speed,
            self.dt,
        )
    }

    /// Read-only view of active motion targets.
    pub fn motion_targets(&self) -> &HashMap<u64, MotionTarget> {
        &self.motion_targets
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
