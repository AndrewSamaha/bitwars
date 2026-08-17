//! Deterministic, server-authoritative neutral NPC combat.
//!
//! Damage is resolved at the firing tick.  Projectile/tracer rendering can use
//! the same firing decision later, without making client animation authoritative.

use std::collections::HashMap;

use crate::content::ContentPack;
use crate::pb::{Entity, Vec2};
use crate::spawn_config::NEUTRAL_OWNER;

#[derive(Default)]
pub struct CombatSystem {
    next_attack_tick: HashMap<u64, u64>,
}

pub struct CombatTick {
    pub dead_entity_ids: Vec<u64>,
    pub laser_shots: Vec<LaserShot>,
}

pub struct LaserShot {
    pub attacker_id: u64,
    pub target_id: u64,
    pub origin: Vec2,
    pub target: Vec2,
}

impl CombatSystem {
    /// Drives neutral entities with combat profiles and returns entity IDs that
    /// died this tick. Target ties are intentionally resolved by entity ID.
    pub fn tick(
        &mut self,
        entities: &mut [Entity],
        content: &ContentPack,
        tick: u64,
        dt: f32,
    ) -> CombatTick {
        if dt <= 0.0 {
            return CombatTick {
                dead_entity_ids: Vec::new(),
                laser_shots: Vec::new(),
            };
        }

        let targets: Vec<Target> = entities
            .iter()
            .filter_map(|entity| {
                let pos = entity.pos.as_ref()?;
                (entity.owner_player_id != NEUTRAL_OWNER
                    && !entity.owner_player_id.is_empty()
                    && entity.health > 0.0)
                    .then(|| Target {
                        id: entity.id,
                        x: pos.x,
                        y: pos.y,
                    })
            })
            .collect();

        let mut damage_by_target: HashMap<u64, f32> = HashMap::new();
        let mut laser_shots = Vec::new();
        for attacker in entities.iter_mut() {
            if attacker.owner_player_id != NEUTRAL_OWNER || attacker.health <= 0.0 {
                continue;
            }
            let Some(profile) = content
                .get(&attacker.entity_type_id)
                .and_then(|definition| definition.combat.as_ref())
            else {
                continue;
            };
            let Some(pos) = attacker.pos.as_mut() else {
                continue;
            };
            let acquisition_sq = profile.acquisition_range.max(0.0).powi(2);
            let target = targets
                .iter()
                .filter_map(|candidate| {
                    let distance_sq = squared_distance(pos.x, pos.y, candidate.x, candidate.y);
                    (distance_sq <= acquisition_sq).then_some((distance_sq, candidate))
                })
                .min_by(|(distance_a, target_a), (distance_b, target_b)| {
                    distance_a
                        .partial_cmp(distance_b)
                        .unwrap_or(std::cmp::Ordering::Equal)
                        .then_with(|| target_a.id.cmp(&target_b.id))
                })
                .map(|(_, target)| target);
            let Some(target) = target else {
                zero_velocity(attacker);
                continue;
            };

            let dx = target.x - pos.x;
            let dy = target.y - pos.y;
            let distance_sq = dx * dx + dy * dy;
            let range = profile.attack_range.max(0.0);
            if distance_sq <= range * range {
                let origin = Vec2 { x: pos.x, y: pos.y };
                zero_velocity(attacker);
                let next_tick = self
                    .next_attack_tick
                    .get(&attacker.id)
                    .copied()
                    .unwrap_or(0);
                if tick >= next_tick && profile.damage.is_finite() && profile.damage > 0.0 {
                    *damage_by_target.entry(target.id).or_insert(0.0) += profile.damage;
                    laser_shots.push(LaserShot {
                        attacker_id: attacker.id,
                        target_id: target.id,
                        origin,
                        target: Vec2 { x: target.x, y: target.y },
                    });
                    self.next_attack_tick.insert(
                        attacker.id,
                        tick.saturating_add(profile.cooldown_ticks.max(1)),
                    );
                }
                continue;
            }

            let distance = distance_sq.sqrt();
            let direction_x = dx / distance;
            let direction_y = dy / distance;
            let speed = content
                .get(&attacker.entity_type_id)
                .map(|definition| definition.speed.max(0.0))
                .unwrap_or(0.0);
            let remaining = distance - range;
            if speed * dt >= remaining {
                pos.x = target.x - direction_x * range;
                pos.y = target.y - direction_y * range;
                zero_velocity(attacker);
            } else {
                let velocity = attacker.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
                velocity.x = direction_x * speed;
                velocity.y = direction_y * speed;
            }
        }

        let mut dead = Vec::new();
        for entity in entities.iter_mut() {
            let damage = damage_by_target.get(&entity.id).copied().unwrap_or(0.0);
            if damage > 0.0 {
                entity.health = (entity.health - damage).max(0.0);
                if entity.health <= 0.0 {
                    dead.push(entity.id);
                }
            }
        }
        self.next_attack_tick.retain(|id, _| !dead.contains(id));
        CombatTick {
            dead_entity_ids: dead,
            laser_shots,
        }
    }
}

struct Target {
    id: u64,
    x: f32,
    y: f32,
}

fn squared_distance(ax: f32, ay: f32, bx: f32, by: f32) -> f32 {
    let dx = ax - bx;
    let dy = ay - by;
    dx * dx + dy * dy
}

fn zero_velocity(entity: &mut Entity) {
    let velocity = entity.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
    velocity.x = 0.0;
    velocity.y = 0.0;
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use crate::content::{CombatDef, EntityTypeDef};

    fn content() -> ContentPack {
        let raider = EntityTypeDef {
            speed: 10.0,
            stop_radius: 0.5,
            mass: 1.0,
            health: 20.0,
            combat: Some(CombatDef {
                attack_range: 10.0,
                damage: 6.0,
                cooldown_ticks: 2,
                acquisition_range: 100.0,
            }),
            visual_scale: 1.0,
            z_index: 0,
            suppress_hover: false,
            collector: None,
            resource_node: None,
            refinery: None,
            radiation_sources: Vec::new(),
            radiation_shielding: HashMap::new(),
            build_cost: HashMap::new(),
            maintenance_cost_per_minute: HashMap::new(),
            builds: Vec::new(),
        };
        ContentPack {
            entity_types: HashMap::from([("raider".to_string(), raider)]),
            resource_types: HashMap::new(),
            content_hash: "test".to_string(),
        }
    }

    fn entity(id: u64, kind: &str, owner: &str, x: f32, health: f32) -> Entity {
        Entity {
            id,
            entity_type_id: kind.to_string(),
            pos: Some(Vec2 { x, y: 0.0 }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: None,
            owner_player_id: owner.to_string(),
            health,
        }
    }

    #[test]
    fn pursues_to_weapon_range_then_fires_on_tick_cadence() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", NEUTRAL_OWNER, 0.0, 20.0),
            entity(2, "worker", "player", 20.0, 12.0),
        ];
        let mut combat = CombatSystem::default();

        assert!(combat
            .tick(&mut entities, &pack, 0, 1.0)
            .dead_entity_ids
            .is_empty());
        assert_eq!(entities[0].pos.as_ref().unwrap().x, 10.0);
        assert_eq!(
            entities[1].health, 12.0,
            "movement tick does not deal damage"
        );

        let fired = combat.tick(&mut entities, &pack, 1, 1.0);
        assert!(fired.dead_entity_ids.is_empty());
        assert_eq!(fired.laser_shots.len(), 1);
        assert_eq!(fired.laser_shots[0].attacker_id, 1);
        assert_eq!(fired.laser_shots[0].target_id, 2);
        assert_eq!(entities[1].health, 6.0);
        assert!(combat
            .tick(&mut entities, &pack, 2, 1.0)
            .dead_entity_ids
            .is_empty());
        assert_eq!(
            entities[1].health, 6.0,
            "cooldown blocks an early second shot"
        );

        assert_eq!(
            combat.tick(&mut entities, &pack, 3, 1.0).dead_entity_ids,
            vec![2]
        );
        assert_eq!(entities[1].health, 0.0);
    }

    #[test]
    fn target_ties_are_resolved_by_entity_id() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", NEUTRAL_OWNER, 0.0, 20.0),
            entity(8, "worker", "player-b", 5.0, 20.0),
            entity(3, "worker", "player-a", -5.0, 20.0),
        ];

        CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);
        assert_eq!(entities[1].health, 20.0);
        assert_eq!(entities[2].health, 14.0);
    }
}
