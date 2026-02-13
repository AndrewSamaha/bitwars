use std::collections::HashMap;

use crate::pb::{Delta, Entity, EntityDelta};

pub fn compute_delta(
    prev: &crate::engine::state::GameState,
    curr: &crate::engine::state::GameState,
    eps_pos: f32,
    eps_vel: f32,
) -> Delta {
    let mut prev_by_id: HashMap<u64, &Entity> = HashMap::with_capacity(prev.entities.len());
    for e in &prev.entities {
        prev_by_id.insert(e.id, e);
    }

    let mut updates: Vec<EntityDelta> = Vec::new();
    for ce in &curr.entities {
        let mut ed = EntityDelta {
            id: ce.id,
            pos: None,
            vel: None,
            force: None,
            owner_player_id: None,
        };

        if let Some(pe) = prev_by_id.get(&ce.id) {
            if pe.owner_player_id != ce.owner_player_id {
                ed.owner_player_id = Some(ce.owner_player_id.clone());
            }
            if let (Some(cp), Some(pp)) = (&ce.pos, &pe.pos) {
                if (cp.x - pp.x).abs() > eps_pos || (cp.y - pp.y).abs() > eps_pos {
                    ed.pos = Some(cp.clone());
                }
            } else if ce.pos.is_some() {
                ed.pos = ce.pos.clone();
            }

            if let (Some(cv), Some(pv)) = (&ce.vel, &pe.vel) {
                if (cv.x - pv.x).abs() > eps_vel || (cv.y - pv.y).abs() > eps_vel {
                    ed.vel = Some(cv.clone());
                }
            } else if ce.vel.is_some() {
                ed.vel = ce.vel.clone();
            }
        } else {
            if ce.pos.is_some() {
                ed.pos = ce.pos.clone();
            }
            if ce.vel.is_some() {
                ed.vel = ce.vel.clone();
            }
            if !ce.owner_player_id.is_empty() {
                ed.owner_player_id = Some(ce.owner_player_id.clone());
            }
        }

        if ed.pos.is_some() || ed.vel.is_some() || ed.force.is_some() || ed.owner_player_id.is_some() {
            updates.push(ed);
        }
    }
    Delta {
        tick: curr.tick,
        updates,
    }
}
