use anyhow::Result;
use crate::state::WorldState;
use crate::pb::IntentEnvelope;
use crate::Reject;

/// Apply a move intent to the world state
pub fn apply_move_intent(state: &mut WorldState, env: &IntentEnvelope) -> Result<(), Reject> {
    match &env.payload {
        Some(crate::pb::intent_envelope::Payload::Move(move_intent)) => {
            // Find the entity
            if let Some(entity) = state.find_entity_mut(move_intent.entity_id) {
                // For now, just set the target position directly
                // In a full implementation, this would set up movement state
                if let Some(target) = &move_intent.target {
                    if let Some(pos) = &mut entity.pos {
                        pos.x = target.x;
                        pos.y = target.y;
                    } else {
                        entity.pos = Some(crate::state::SerializableVec2 { x: target.x, y: target.y });
                    }
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