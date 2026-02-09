use std::collections::HashMap;

use crate::state::{SerializableVec2, WorldState};
use crate::{MotionTarget, SimEntityTypeDef};

/// Steer entities toward their motion targets and integrate positions.
///
/// For each entity with an active `MotionTarget`:
///
/// - **Already within `stop_radius`**: zero velocity, mark as arrived.
/// - **Would overshoot** the stop boundary this tick (`speed × dt ≥ effective
///   distance`): snap position to the boundary, zero velocity, mark as arrived.
///   This is the anti-oscillation mechanism — the entity either keeps moving at
///   full speed or snaps to the arrived state; there is no intermediate frame
///   where it overshoots and corrects.
/// - **Otherwise**: set velocity toward target at `speed`, then advance position
///   by `vel × dt`.
///
/// Entities without a motion target are not touched — their velocity and
/// position are left as-is.
///
/// Returns entity IDs that arrived this tick.  Their motion targets are removed
/// and velocity is zeroed.
///
/// M4: If `entity_types` contains a definition for the entity's `entity_type_id`,
/// that definition's speed is used.  Otherwise `default_speed` is used.
pub fn tick_movement(
    state: &mut WorldState,
    targets: &mut HashMap<u64, MotionTarget>,
    default_speed: f32,
    dt: f32,
    entity_types: &HashMap<String, SimEntityTypeDef>,
) -> Vec<u64> {
    let mut finished = Vec::new();

    for entity in &mut state.entities {
        let Some(target) = targets.get(&entity.id) else {
            continue;
        };

        let pos = match &mut entity.pos {
            Some(p) => p,
            None => continue,
        };
        let vel = entity.vel.get_or_insert(SerializableVec2 { x: 0.0, y: 0.0 });

        // M4: per-entity-type speed
        let speed = if entity.entity_type_id.is_empty() {
            default_speed
        } else {
            entity_types
                .get(&entity.entity_type_id)
                .map(|def| def.speed)
                .unwrap_or(default_speed)
        };

        let dx = target.x - pos.x;
        let dy = target.y - pos.y;
        let dist_sq = dx * dx + dy * dy;
        let stop_r = target.stop_radius;
        let sr_sq = stop_r * stop_r;

        if dist_sq <= sr_sq {
            // Already within stop radius — arrive immediately.
            vel.x = 0.0;
            vel.y = 0.0;
            finished.push(entity.id);
            continue;
        }

        let dist = dist_sq.sqrt();
        let dir_x = dx / dist;
        let dir_y = dy / dist;
        let effective_dist = dist - stop_r;
        let step = speed * dt;

        if step >= effective_dist {
            // Would overshoot — snap to stop boundary and arrive.
            pos.x = target.x - dir_x * stop_r;
            pos.y = target.y - dir_y * stop_r;
            vel.x = 0.0;
            vel.y = 0.0;
            finished.push(entity.id);
        } else {
            // Steer toward target and integrate.
            vel.x = dir_x * speed;
            vel.y = dir_y * speed;
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
        }
    }

    // Remove finished targets.
    for id in &finished {
        targets.remove(id);
    }

    finished
}
