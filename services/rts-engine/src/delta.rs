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
            entity_type_id: None,
            health: None,
        };

        if let Some(pe) = prev_by_id.get(&ce.id) {
            if pe.owner_player_id != ce.owner_player_id {
                ed.owner_player_id = Some(ce.owner_player_id.clone());
            }
            if pe.entity_type_id != ce.entity_type_id {
                ed.entity_type_id = Some(ce.entity_type_id.clone());
            }
            if (pe.health - ce.health).abs() > f32::EPSILON {
                ed.health = Some(ce.health);
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
            if !ce.entity_type_id.is_empty() {
                ed.entity_type_id = Some(ce.entity_type_id.clone());
            }
            if ce.pos.is_some() {
                ed.pos = ce.pos.clone();
            }
            if ce.vel.is_some() {
                ed.vel = ce.vel.clone();
            }
            if !ce.owner_player_id.is_empty() {
                ed.owner_player_id = Some(ce.owner_player_id.clone());
            }
            ed.health = Some(ce.health);
        }

        if ed.pos.is_some()
            || ed.vel.is_some()
            || ed.force.is_some()
            || ed.owner_player_id.is_some()
            || ed.entity_type_id.is_some()
            || ed.health.is_some()
        {
            updates.push(ed);
        }
    }
    let curr_ids: std::collections::HashSet<u64> = curr.entities.iter().map(|entity| entity.id).collect();
    let mut removed_entity_ids: Vec<u64> = prev_by_id
        .keys()
        .filter(|id| !curr_ids.contains(id))
        .copied()
        .collect();
    removed_entity_ids.sort_unstable();
    Delta {
        tick: curr.tick,
        updates,
        removed_entity_ids,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::state::GameState;

    fn entity(id: u64) -> Entity {
        Entity {
            id,
            entity_type_id: "worker".to_string(),
            pos: None,
            vel: None,
            force: None,
            owner_player_id: "player".to_string(),
            health: 100.0,
        }
    }

    #[test]
    fn reports_removed_entities_in_stable_id_order() {
        let previous = GameState {
            tick: 10,
            entities: vec![entity(9), entity(2), entity(5)],
            ledger: HashMap::new(),
        };
        let current = GameState {
            tick: 11,
            entities: vec![entity(5)],
            ledger: HashMap::new(),
        };

        let delta = compute_delta(&previous, &current, 0.01, 0.01);
        assert!(delta.updates.is_empty());
        assert_eq!(delta.removed_entity_ids, vec![2, 9]);
    }
}
