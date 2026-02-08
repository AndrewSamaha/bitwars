use std::collections::HashMap;

use crate::pb::IntentEnvelope;
use crate::state::WorldState;
use crate::{MotionTarget, Reject};

/// Apply an intent envelope to the world state.
///
/// For Move intents, this sets up a `MotionTarget` that the movement system
/// (`tick_movement`) will steer toward over subsequent ticks.  If the entity
/// already has an active motion target (REPLACE_ACTIVE), the old target is
/// overwritten and velocity is zeroed to prevent residual drift from the
/// previous direction.
pub fn apply_intent(
    state: &mut WorldState,
    targets: &mut HashMap<u64, MotionTarget>,
    stop_radius: f32,
    env: &IntentEnvelope,
) -> Result<(), Reject> {
    match &env.payload {
        Some(crate::pb::intent_envelope::Payload::Move(move_intent)) => {
            if let Some(entity) = state.find_entity_mut(move_intent.entity_id) {
                if let Some(target) = &move_intent.target {
                    // Zero velocity when setting/replacing a motion target to
                    // prevent one tick of residual drift from the old direction.
                    if let Some(vel) = &mut entity.vel {
                        vel.x = 0.0;
                        vel.y = 0.0;
                    }
                    targets.insert(
                        move_intent.entity_id,
                        MotionTarget {
                            x: target.x,
                            y: target.y,
                            stop_radius,
                        },
                    );
                }
            } else {
                return Err(Reject::InvalidTarget);
            }
            Ok(())
        }
        Some(crate::pb::intent_envelope::Payload::Attack(_)) => {
            // Attack logic would go here
            Ok(())
        }
        Some(crate::pb::intent_envelope::Payload::Build(_)) => {
            // Build logic would go here
            Ok(())
        }
        None => Err(Reject::InvalidTarget),
    }
}
