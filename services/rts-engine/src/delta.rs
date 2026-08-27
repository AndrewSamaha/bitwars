use std::collections::HashMap;

use crate::{
    io::redis::{CollectorUiState, CombatEffectUiState},
    pb::{CollectorState, CombatEffectState, Delta, Entity, EntityDelta},
};

pub fn compute_delta(
    prev: &crate::engine::state::GameState,
    curr: &crate::engine::state::GameState,
    prev_collector_states: &HashMap<u64, CollectorUiState>,
    curr_collector_states: &HashMap<u64, CollectorUiState>,
    prev_combat_effect_states: &HashMap<u64, CombatEffectUiState>,
    curr_combat_effect_states: &HashMap<u64, CombatEffectUiState>,
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
    let curr_ids: std::collections::HashSet<u64> =
        curr.entities.iter().map(|entity| entity.id).collect();
    let mut removed_entity_ids: Vec<u64> = prev_by_id
        .keys()
        .filter(|id| !curr_ids.contains(id))
        .copied()
        .collect();
    removed_entity_ids.sort_unstable();
    let mut collector_state_updates: Vec<CollectorState> = curr_collector_states
        .iter()
        .filter(|(entity_id, state)| {
            prev_collector_states
                .get(entity_id)
                .map(|previous| {
                    previous.activity != state.activity
                        || previous.resource_type != state.resource_type
                        || previous.carry_amount != state.carry_amount
                        || previous.carry_capacity != state.carry_capacity
                        || previous.effective_rate_per_second != state.effective_rate_per_second
                })
                .unwrap_or(true)
        })
        .map(|(entity_id, state)| CollectorState {
            entity_id: *entity_id,
            activity: state.activity.clone(),
            resource_type: state.resource_type.clone(),
            carry_amount: state.carry_amount,
            carry_capacity: state.carry_capacity,
            effective_rate_per_second: state.effective_rate_per_second,
        })
        .collect();
    collector_state_updates.sort_by_key(|state| state.entity_id);
    let mut combat_effect_state_updates: Vec<CombatEffectState> = curr_combat_effect_states
        .iter()
        .filter(|(entity_id, state)| prev_combat_effect_states.get(entity_id) != Some(*state))
        .map(|(entity_id, state)| CombatEffectState {
            entity_id: *entity_id,
            activity: state.activity.clone(),
            target_id: state.target_id,
            attack_id: state.attack_id.clone(),
            updated_tick: state.updated_tick,
        })
        .collect();
    combat_effect_state_updates.sort_by_key(|state| state.entity_id);
    Delta {
        tick: curr.tick,
        updates,
        removed_entity_ids,
        collector_state_updates,
        combat_effect_state_updates,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::state::GameState;
    use crate::io::redis::CollectorUiState;

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

        let delta = compute_delta(
            &previous,
            &current,
            &HashMap::new(),
            &HashMap::new(),
            &HashMap::new(),
            &HashMap::new(),
            0.01,
            0.01,
        );
        assert!(delta.updates.is_empty());
        assert_eq!(delta.removed_entity_ids, vec![2, 9]);
    }

    #[test]
    fn reports_collector_telemetry_only_when_displayed_values_change() {
        let state = GameState {
            tick: 10,
            entities: vec![entity(4)],
            ledger: HashMap::new(),
        };
        let collector = CollectorUiState {
            activity: "gathering".to_string(),
            resource_type: "minerals".to_string(),
            carry_amount: 2.0,
            carry_capacity: 10.0,
            effective_rate_per_second: 0.0,
            updated_tick: 10,
        };
        let previous = HashMap::from([(4, collector.clone())]);
        let mut current = previous.clone();

        let combat_states = HashMap::new();
        let unchanged = compute_delta(
            &state,
            &state,
            &previous,
            &current,
            &combat_states,
            &combat_states,
            0.01,
            0.01,
        );
        assert!(unchanged.collector_state_updates.is_empty());

        current.get_mut(&4).unwrap().carry_amount = 3.0;
        let changed = compute_delta(
            &state,
            &state,
            &previous,
            &current,
            &combat_states,
            &combat_states,
            0.01,
            0.01,
        );
        assert_eq!(changed.collector_state_updates.len(), 1);
        assert_eq!(changed.collector_state_updates[0].entity_id, 4);
        assert_eq!(changed.collector_state_updates[0].carry_amount, 3.0);
    }
}
