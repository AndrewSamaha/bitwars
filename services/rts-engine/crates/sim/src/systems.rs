use crate::state::WorldState;

/// Movement system that advances entities toward their targets
pub fn movement(state: &mut WorldState) {
    // This is a simplified movement system
    // In a full implementation, this would read from action states
    // and move entities based on their current movement targets
    
    for entity in &mut state.entities {
        if let (Some(pos), Some(vel)) = (&mut entity.pos, &mut entity.vel) {
            // Apply velocity to position
            pos.x += vel.x * (1.0 / 60.0); // Assuming 60 TPS
            pos.y += vel.y * (1.0 / 60.0);
            
            // Apply friction to velocity
            let friction = 0.95; // Simple friction
            vel.x *= friction;
            vel.y *= friction;
        }
    }
}

/// Physics integration system
pub fn integrate(state: &mut WorldState, dt: f32) {
    for entity in &mut state.entities {
        if let (Some(pos), Some(vel)) = (&mut entity.pos, &mut entity.vel) {
            // Apply velocity to position
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
        }
    }
}