//! Deterministic, server-authoritative neutral NPC combat.
//!
//! Damage is resolved at the firing tick.  Projectile/tracer rendering can use
//! the same firing decision later, without making client animation authoritative.

use std::collections::{HashMap, HashSet};

use crate::content::{AttackDef, AttackType, ContentPack, NearEnemyStrategy};
use crate::pb::{Entity, Vec2};
use crate::spawn_config::NEUTRAL_OWNER;

#[derive(Default)]
pub struct CombatSystem {
    next_attack_tick: HashMap<(u64, String), u64>,
}

pub struct CombatTick {
    pub dead_entity_ids: Vec<u64>,
    pub laser_shots: Vec<LaserShot>,
    pub dismantling: Vec<Dismantling>,
    pub destructions: Vec<CombatDestruction>,
}

pub struct LaserShot {
    pub attacker_id: u64,
    pub target_id: u64,
    pub origin: Vec2,
    pub target: Vec2,
}

pub struct Dismantling {
    pub attacker_id: u64,
    pub target_id: u64,
    pub attack_id: String,
}

/// Attribution for a combat death. When simultaneous attacks destroy a
/// target, the highest-damage contributor wins; ties use the lower ID.
pub struct CombatDestruction {
    pub victim: Entity,
    pub attacker_id: u64,
    pub attacker_entity_type_id: String,
    pub attacker_owner_player_id: String,
    pub cause: AttackType,
}

struct DamageContribution {
    total: f32,
    attacker_id: u64,
    attacker_entity_type_id: String,
    attacker_owner_player_id: String,
    cause: AttackType,
    largest_hit: f32,
}

impl CombatSystem {
    /// Drives entities with combat profiles and returns entity IDs that died
    /// this tick. Target ties are intentionally resolved by entity ID.
    pub fn tick(
        &mut self,
        entities: &mut [Entity],
        content: &ContentPack,
        tick: u64,
        dt: f32,
    ) -> CombatTick {
        self.tick_with_player_orders(entities, content, tick, dt, &HashSet::new())
    }

    /// As [`Self::tick`], except that active player orders suppress autonomous
    /// combat for the commanded entity until its intent completes or is replaced.
    pub fn tick_with_player_orders(
        &mut self,
        entities: &mut [Entity],
        content: &ContentPack,
        tick: u64,
        dt: f32,
        commanded_entity_ids: &HashSet<u64>,
    ) -> CombatTick {
        self.tick_with_scripted_targets(
            entities,
            content,
            tick,
            dt,
            commanded_entity_ids,
            &HashMap::new(),
            &HashSet::new(),
        )
    }

    pub fn tick_with_scripted_targets(
        &mut self,
        entities: &mut [Entity],
        content: &ContentPack,
        tick: u64,
        dt: f32,
        commanded_entity_ids: &HashSet<u64>,
        scripted_targets: &HashMap<u64, u64>,
        scripted_entity_ids: &HashSet<u64>,
    ) -> CombatTick {
        if dt <= 0.0 {
            return CombatTick {
                dead_entity_ids: Vec::new(),
                laser_shots: Vec::new(),
                dismantling: Vec::new(),
                destructions: Vec::new(),
            };
        }

        let targets: Vec<Target> = entities
            .iter()
            .filter_map(|entity| {
                let pos = entity.pos.as_ref()?;
                (content
                    .get(&entity.entity_type_id)
                    .is_some_and(|definition| definition.combat_targetable)
                    && !entity.owner_player_id.is_empty()
                    && entity.health > 0.0)
                    .then(|| Target {
                        id: entity.id,
                        owner_player_id: entity.owner_player_id.clone(),
                        x: pos.x,
                        y: pos.y,
                        hull_radius: content
                            .get(&entity.entity_type_id)
                            .map(|definition| definition.hull_radius.max(0.0))
                            .unwrap_or(0.0),
                    })
            })
            .collect();

        let mut damage_by_target: HashMap<u64, DamageContribution> = HashMap::new();
        let mut laser_shots = Vec::new();
        let mut dismantling = Vec::new();
        for attacker in entities.iter_mut() {
            if attacker.owner_player_id.is_empty()
                || attacker.health <= 0.0
                || commanded_entity_ids.contains(&attacker.id)
            {
                continue;
            }
            let Some(definition) = content.get(&attacker.entity_type_id) else {
                continue;
            };
            let Some(profile) = definition.combat.as_ref() else {
                continue;
            };
            if profile.attacks.is_empty() {
                continue;
            }
            let Some(pos) = attacker.pos.as_mut() else {
                continue;
            };
            let acquisition_sq = profile.acquisition_range.max(0.0).powi(2);
            let target = if scripted_entity_ids.contains(&attacker.id) {
                scripted_targets.get(&attacker.id).and_then(|target_id| {
                    targets.iter().find(|candidate| candidate.id == *target_id)
                })
            } else {
                targets
                    .iter()
                    .filter_map(|candidate| {
                        if candidate.id == attacker.id
                            || candidate.owner_player_id == attacker.owner_player_id
                        {
                            return None;
                        }
                        let distance_sq = squared_distance(pos.x, pos.y, candidate.x, candidate.y);
                        (distance_sq <= acquisition_sq).then_some((distance_sq, candidate))
                    })
                    .min_by(|(distance_a, target_a), (distance_b, target_b)| {
                        distance_a
                            .partial_cmp(distance_b)
                            .unwrap_or(std::cmp::Ordering::Equal)
                            .then_with(|| target_a.id.cmp(&target_b.id))
                    })
                    .map(|(_, target)| target)
            };
            let Some(target) = target else {
                // Neutrals have no player-issued movement to preserve. Player
                // units resume their current intent after hostiles leave range.
                if attacker.owner_player_id == NEUTRAL_OWNER
                    && !scripted_entity_ids.contains(&attacker.id)
                {
                    zero_velocity(attacker);
                }
                continue;
            };

            let dx = target.x - pos.x;
            let dy = target.y - pos.y;
            let distance_sq = dx * dx + dy * dy;
            let attacker_hull_radius = definition.hull_radius.max(0.0);
            let max_range = profile
                .attacks
                .iter()
                .map(|attack| attack_range(attack, attacker_hull_radius, target.hull_radius))
                .fold(0.0_f32, f32::max);
            match profile.on_near_enemy_strategy {
                NearEnemyStrategy::Flee => {
                    if distance_sq > f32::EPSILON {
                        let distance = distance_sq.sqrt();
                        let speed = content
                            .get(&attacker.entity_type_id)
                            .map(|definition| definition.speed.max(0.0))
                            .unwrap_or(0.0);
                        let velocity = attacker.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
                        velocity.x = -dx / distance * speed;
                        velocity.y = -dy / distance * speed;
                    } else {
                        zero_velocity(attacker);
                    }
                    continue;
                }
                NearEnemyStrategy::Stay if distance_sq > max_range * max_range => {
                    zero_velocity(attacker);
                    continue;
                }
                NearEnemyStrategy::Approach | NearEnemyStrategy::Stay => {}
            }
            if let Some(attack) = select_attack(
                &profile.attacks,
                distance_sq,
                attacker_hull_radius,
                target.hull_radius,
            ) {
                let origin = Vec2 { x: pos.x, y: pos.y };
                zero_velocity(attacker);
                let next_tick = self
                    .next_attack_tick
                    .get(&(attacker.id, attack.id.clone()))
                    .copied()
                    .unwrap_or(0);
                if tick >= next_tick && attack.damage.is_finite() && attack.damage > 0.0 {
                    let contribution =
                        damage_by_target
                            .entry(target.id)
                            .or_insert_with(|| DamageContribution {
                                total: 0.0,
                                attacker_id: attacker.id,
                                attacker_entity_type_id: attacker.entity_type_id.clone(),
                                attacker_owner_player_id: attacker.owner_player_id.clone(),
                                cause: attack.attack_type,
                                largest_hit: 0.0,
                            });
                    contribution.total += attack.damage;
                    if attack.damage > contribution.largest_hit
                        || (attack.damage == contribution.largest_hit
                            && attacker.id < contribution.attacker_id)
                    {
                        contribution.attacker_id = attacker.id;
                        contribution.attacker_entity_type_id = attacker.entity_type_id.clone();
                        contribution.attacker_owner_player_id = attacker.owner_player_id.clone();
                        contribution.cause = attack.attack_type;
                        contribution.largest_hit = attack.damage;
                    }
                    if attack.attack_type == AttackType::Laser {
                        laser_shots.push(LaserShot {
                            attacker_id: attacker.id,
                            target_id: target.id,
                            origin,
                            target: Vec2 {
                                x: target.x,
                                y: target.y,
                            },
                        });
                    }
                    self.next_attack_tick.insert(
                        (attacker.id, attack.id.clone()),
                        tick.saturating_add(attack.cooldown_ticks.max(1)),
                    );
                }
                if attack.attack_type == AttackType::Dismantle {
                    dismantling.push(Dismantling {
                        attacker_id: attacker.id,
                        target_id: target.id,
                        attack_id: attack.id.clone(),
                    });
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
            let remaining = distance - max_range;
            if speed * dt >= remaining {
                pos.x = target.x - direction_x * max_range;
                pos.y = target.y - direction_y * max_range;
                zero_velocity(attacker);
            } else {
                let velocity = attacker.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
                velocity.x = direction_x * speed;
                velocity.y = direction_y * speed;
            }
        }

        let mut dead = Vec::new();
        let mut destructions = Vec::new();
        for entity in entities.iter_mut() {
            let Some(damage) = damage_by_target.get(&entity.id) else {
                continue;
            };
            if damage.total > 0.0 {
                entity.health = (entity.health - damage.total).max(0.0);
                if entity.health <= 0.0 {
                    dead.push(entity.id);
                    destructions.push(CombatDestruction {
                        victim: entity.clone(),
                        attacker_id: damage.attacker_id,
                        attacker_entity_type_id: damage.attacker_entity_type_id.clone(),
                        attacker_owner_player_id: damage.attacker_owner_player_id.clone(),
                        cause: damage.cause,
                    });
                }
            }
        }
        self.next_attack_tick
            .retain(|(id, _), _| !dead.contains(id));
        CombatTick {
            dead_entity_ids: dead,
            laser_shots,
            dismantling,
            destructions,
        }
    }
}

struct Target {
    id: u64,
    owner_player_id: String,
    x: f32,
    y: f32,
    hull_radius: f32,
}

fn attack_range(attack: &AttackDef, attacker_hull_radius: f32, target_hull_radius: f32) -> f32 {
    match attack.attack_type {
        AttackType::Laser => attack.range.max(0.0),
        AttackType::Dismantle => {
            attacker_hull_radius + target_hull_radius + attack.contact_tolerance.max(0.0)
        }
    }
}

fn select_attack<'a>(
    attacks: &'a [AttackDef],
    distance_sq: f32,
    attacker_hull_radius: f32,
    target_hull_radius: f32,
) -> Option<&'a AttackDef> {
    attacks
        .iter()
        .filter(|attack| {
            distance_sq <= attack_range(attack, attacker_hull_radius, target_hull_radius).powi(2)
        })
        .max_by(|left, right| {
            left.priority
                .cmp(&right.priority)
                .then_with(|| right.id.cmp(&left.id))
        })
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
    use crate::content::{AttackDef, AttackType, CombatDef, EntityTypeDef, NearEnemyStrategy};

    fn content() -> ContentPack {
        let raider = EntityTypeDef {
            fog_memory: Default::default(),
            speed: 10.0,
            stop_radius: 0.5,
            mass: 1.0,
            health: 20.0,
            hull_radius: 0.0,
            combat: Some(CombatDef {
                acquisition_range: 100.0,
                on_near_enemy_strategy: NearEnemyStrategy::Approach,
                attacks: vec![AttackDef {
                    id: "laser".to_string(),
                    attack_type: AttackType::Laser,
                    range: 10.0,
                    damage: 6.0,
                    cooldown_ticks: 2,
                    priority: 0,
                    contact_tolerance: 0.0,
                }],
            }),
            combat_targetable: true,
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
            sensor: None,
            visibility_range: None,
            builds: Vec::new(),
        };
        let mut worker = raider.clone();
        worker.combat = None;
        worker.combat_targetable = true;
        ContentPack {
            entity_types: HashMap::from([
                ("raider".to_string(), raider),
                ("worker".to_string(), worker),
            ]),
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

    #[test]
    fn player_combatant_attacks_neutrals_and_other_players_but_not_allies() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", "player-a", 0.0, 20.0),
            entity(2, "worker", "player-a", 5.0, 20.0),
            entity(3, "worker", NEUTRAL_OWNER, 8.0, 20.0),
            entity(4, "worker", "player-b", 9.0, 20.0),
        ];

        let result = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert_eq!(entities[1].health, 20.0, "allies are never hostile");
        assert_eq!(entities[2].health, 14.0, "neutral is the nearest hostile");
        assert_eq!(entities[3].health, 20.0);
        assert_eq!(result.laser_shots[0].attacker_id, 1);
        assert_eq!(result.laser_shots[0].target_id, 3);
    }

    #[test]
    fn player_combatant_preserves_velocity_when_no_hostile_is_nearby() {
        let pack = content();
        let mut entities = vec![entity(1, "raider", "player-a", 0.0, 20.0)];
        entities[0].vel = Some(Vec2 { x: 7.0, y: -3.0 });

        CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert_eq!(entities[0].vel, Some(Vec2 { x: 7.0, y: -3.0 }));
    }

    #[test]
    fn dismantle_requires_hull_contact_and_emits_continuous_effect_state() {
        let mut pack = content();
        let worker = pack.entity_types.get_mut("worker").unwrap();
        worker.hull_radius = 3.0;
        worker.combat = Some(CombatDef {
            acquisition_range: 100.0,
            on_near_enemy_strategy: NearEnemyStrategy::Approach,
            attacks: vec![AttackDef {
                id: "dismantle".to_string(),
                attack_type: AttackType::Dismantle,
                range: 0.0,
                damage: 5.0,
                cooldown_ticks: 2,
                priority: 0,
                contact_tolerance: 2.0,
            }],
        });
        let raider = pack.entity_types.get_mut("raider").unwrap();
        raider.hull_radius = 4.0;
        raider.combat = None;
        let mut entities = vec![
            entity(1, "worker", "player", 0.0, 20.0),
            entity(2, "raider", NEUTRAL_OWNER, 9.0, 20.0),
        ];

        let outcome = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(outcome.laser_shots.is_empty());
        assert_eq!(outcome.dismantling.len(), 1);
        assert_eq!(outcome.dismantling[0].attacker_id, 1);
        assert_eq!(outcome.dismantling[0].target_id, 2);
        assert_eq!(entities[1].health, 15.0);
    }

    #[test]
    fn records_victim_and_attacker_for_a_combat_destruction() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", NEUTRAL_OWNER, 0.0, 20.0),
            entity(2, "worker", "player", 5.0, 5.0),
        ];

        let outcome = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert_eq!(outcome.dead_entity_ids, vec![2]);
        assert_eq!(outcome.destructions.len(), 1);
        let destruction = &outcome.destructions[0];
        assert_eq!(destruction.victim.id, 2);
        assert_eq!(destruction.attacker_id, 1);
        assert_eq!(destruction.attacker_entity_type_id, "raider");
        assert_eq!(destruction.cause, AttackType::Laser);
    }

    #[test]
    fn non_targetable_celestial_bodies_are_ignored() {
        let mut pack = content();
        let mut planet = pack.entity_types["worker"].clone();
        planet.combat_targetable = false;
        pack.entity_types.insert("planet_blue".to_string(), planet);
        let mut entities = vec![
            entity(1, "raider", "player-a", 0.0, 20.0),
            entity(2, "planet_blue", NEUTRAL_OWNER, 20.0, 100.0),
        ];

        let result = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(result.laser_shots.is_empty());
        assert_eq!(entities[1].health, 100.0);
        assert_eq!(entities[0].vel, Some(Vec2 { x: 0.0, y: 0.0 }));
    }

    #[test]
    fn stay_strategy_does_not_approach_an_out_of_range_hostile() {
        let mut pack = content();
        pack.entity_types
            .get_mut("raider")
            .unwrap()
            .combat
            .as_mut()
            .unwrap()
            .on_near_enemy_strategy = NearEnemyStrategy::Stay;
        let mut entities = vec![
            entity(1, "raider", "player-a", 0.0, 20.0),
            entity(2, "worker", NEUTRAL_OWNER, 20.0, 20.0),
        ];

        let result = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(result.laser_shots.is_empty());
        assert_eq!(entities[0].pos.as_ref().unwrap().x, 0.0);
        assert_eq!(entities[0].vel, Some(Vec2 { x: 0.0, y: 0.0 }));
    }

    #[test]
    fn flee_strategy_moves_away_without_firing() {
        let mut pack = content();
        pack.entity_types
            .get_mut("raider")
            .unwrap()
            .combat
            .as_mut()
            .unwrap()
            .on_near_enemy_strategy = NearEnemyStrategy::Flee;
        let mut entities = vec![
            entity(1, "raider", "player-a", 0.0, 20.0),
            entity(2, "worker", NEUTRAL_OWNER, 5.0, 20.0),
        ];

        let result = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(result.laser_shots.is_empty());
        assert_eq!(entities[0].vel, Some(Vec2 { x: -10.0, y: 0.0 }));
    }

    #[test]
    fn player_order_suppresses_autonomous_combat() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", "player-a", 0.0, 20.0),
            entity(2, "worker", NEUTRAL_OWNER, 5.0, 20.0),
        ];
        let commanded = HashSet::from([1]);

        let result = CombatSystem::default().tick_with_player_orders(
            &mut entities,
            &pack,
            0,
            1.0,
            &commanded,
        );

        assert!(result.laser_shots.is_empty());
        assert_eq!(entities[1].health, 20.0);
    }
}
