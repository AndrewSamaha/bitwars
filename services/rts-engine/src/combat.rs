//! Deterministic, server-authoritative combat. Lasers and dismantling deal
//! damage on the firing tick; kinetic shots deal damage on swept collision.

use std::collections::{HashMap, HashSet};

use crate::content::{AttackDef, AttackType, ContentPack, NearEnemyStrategy, KINETIC_PROJECTILE_TYPE};
use crate::pb::{Entity, ProjectileState, Vec2};
use crate::spatial::{SpatialIndex, CELL_SIZE};
use crate::spawn_config::is_system_owner;

#[derive(Default)]
pub struct CombatSystem {
    next_attack_tick: HashMap<(u64, String), u64>,
    // Only idle Approach pursuits own a return position. Orders own their own movement.
    return_positions: HashMap<u64, Vec2>,
}

impl CombatSystem {
    pub fn return_positions_for_snapshot(&self) -> Vec<crate::pb::IdleCombatReturnState> {
        let mut positions: Vec<_> = self.return_positions.iter()
            .map(|(&entity_id, &position)| crate::pb::IdleCombatReturnState {
                entity_id, position: Some(position),
            }).collect();
        positions.sort_by_key(|entry| entry.entity_id);
        positions
    }

    pub fn restore_return_positions(&mut self, positions: Vec<crate::pb::IdleCombatReturnState>) {
        self.return_positions = positions.into_iter()
            .filter_map(|entry| entry.position.map(|position| (entry.entity_id, position)))
            .collect();
    }

    pub fn cancel_return(&mut self, entity_id: u64) -> bool {
        self.return_positions.remove(&entity_id).is_some()
    }
}


pub struct CombatTick {
    /// Acquired targets, including pursuit and weapon cooldown waiting.
    pub engagements: HashMap<u64, u64>,
    pub dead_entity_ids: Vec<u64>,
    pub laser_shots: Vec<LaserShot>,
    pub projectile_spawns: Vec<Entity>,
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
    pub(crate) impact: Option<Impact>,
}

#[derive(Clone, Copy)]
pub(crate) struct Impact {
    pub(crate) fraction: f64,
    pub(crate) position: (f64, f64),
}

pub(crate) struct ProjectileTick {
    pub(crate) terminations: Vec<(u64, Impact)>,
    pub(crate) destructions: Vec<CombatDestruction>,
}

/// A Move step clamped to its stop boundary before the rest of the tick.
/// `fraction` is the share of the tick spent covering the segment; the hull is
/// stationary at `stop` for the remainder.
#[derive(Clone, Copy)]
pub(crate) struct ClampedMove {
    pub(crate) start: Vec2,
    pub(crate) stop: Vec2,
    pub(crate) fraction: f64,
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
        self.tick_with_escort_leashes(entities, content, tick, dt, commanded_entity_ids,
            scripted_targets, scripted_entity_ids, &HashMap::new())
    }

    /// Escort combat stays within a content-defined radius of a moving leader.
    pub fn tick_with_escort_leashes(
        &mut self, entities: &mut [Entity], content: &ContentPack, tick: u64, dt: f32,
        commanded_entity_ids: &HashSet<u64>, scripted_targets: &HashMap<u64, u64>,
        scripted_entity_ids: &HashSet<u64>, leashes: &HashMap<u64, (Vec2, f32)>,
    ) -> CombatTick {
        self.tick_with_ordered_movement(entities, content, tick, dt, commanded_entity_ids,
            scripted_targets, scripted_entity_ids, leashes, &HashSet::new(), &HashSet::new())
    }

    /// Ordered movement owns position and velocity; combat may only fire ranged weapons.
    pub fn tick_with_ordered_movement(
        &mut self, entities: &mut [Entity], content: &ContentPack, tick: u64, dt: f32,
        commanded_entity_ids: &HashSet<u64>, scripted_targets: &HashMap<u64, u64>,
        scripted_entity_ids: &HashSet<u64>, leashes: &HashMap<u64, (Vec2, f32)>,
        moving_entity_ids: &HashSet<u64>, maintained_entity_ids: &HashSet<u64>,
    ) -> CombatTick {
        if dt <= 0.0 {
            return CombatTick {
                dead_entity_ids: Vec::new(),
                laser_shots: Vec::new(),
                projectile_spawns: Vec::new(),
                dismantling: Vec::new(),
                destructions: Vec::new(),
                engagements: HashMap::new(),
            };
        }
        // Discard anchors for entities removed by other systems (e.g. radiation).
        if !self.return_positions.is_empty() {
            let entity_ids: HashSet<_> = entities.iter().map(|entity| entity.id).collect();
            self.return_positions.retain(|id, _| entity_ids.contains(id));
        }

        let scripted_target_ids: HashSet<_> = scripted_targets.values().copied().collect();
        let targets: Vec<Target> = entities
            .iter()
            .filter_map(|entity| {
                let pos = entity.pos.as_ref()?;
                let combat_targetable = content
                    .get(&entity.entity_type_id)
                    .is_some_and(|definition| definition.combat_targetable);
                ((combat_targetable || scripted_target_ids.contains(&entity.id))
                    && !entity.owner_player_id.is_empty()
                    && entity.health > 0.0)
                    .then(|| Target {
                        id: entity.id,
                        owner_player_id: entity.owner_player_id.clone(),
                        combat_targetable,
                        x: pos.x,
                        y: pos.y,
                        hull_radius: content
                            .get(&entity.entity_type_id)
                            .map(|definition| definition.hull_radius.max(0.0))
                            .unwrap_or(0.0),
                    })
            })
            .collect();
        let target_by_id: HashMap<_, _> = targets
            .iter()
            .enumerate()
            .map(|(index, target)| (target.id, index))
            .collect();
        let mut target_grid = SpatialIndex::new();
        for (index, target) in targets.iter().enumerate() {
            target_grid.insert(index, target.x, target.y);
        }

        let mut damage_by_target: HashMap<u64, DamageContribution> = HashMap::new();
        let mut laser_shots = Vec::new();
        let mut projectile_spawns = Vec::new();
        let mut engagements = HashMap::new();
        let mut dismantling = Vec::new();
        for attacker in entities.iter_mut() {
            if attacker.projectile.is_some() {
                continue;
            }
            if commanded_entity_ids.contains(&attacker.id) {
                self.return_positions.remove(&attacker.id);
            }
            if attacker.owner_player_id.is_empty()
                || attacker.supply.as_ref().is_some_and(|s| !s.operational)
                || attacker.health <= 0.0
                || (commanded_entity_ids.contains(&attacker.id) && !moving_entity_ids.contains(&attacker.id))
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
            let idle_approach = profile.on_near_enemy_strategy == NearEnemyStrategy::Approach
                && !commanded_entity_ids.contains(&attacker.id)
                && !moving_entity_ids.contains(&attacker.id)
                && !maintained_entity_ids.contains(&attacker.id)
                && !scripted_entity_ids.contains(&attacker.id)
                && !leashes.contains_key(&attacker.id);
            if !idle_approach {
                self.return_positions.remove(&attacker.id);
            }
            let ordered_movement = moving_entity_ids.contains(&attacker.id);
            let acquisition_sq = profile.acquisition_range.max(0.0).powi(2);
            let target = if scripted_entity_ids.contains(&attacker.id) {
                scripted_targets
                    .get(&attacker.id)
                    .and_then(|target_id| target_by_id.get(target_id))
                    .map(|index| &targets[*index])
            } else {
                target_grid
                    .within(pos.x, pos.y, profile.acquisition_range.max(0.0))
                    .into_iter()
                    .map(|index| &targets[index])
                    .filter_map(|candidate| {
                        if !candidate.combat_targetable
                            || candidate.id == attacker.id
                            || candidate.owner_player_id == attacker.owner_player_id
                        {
                            return None;
                        }
                        if let Some((anchor, range)) = leashes.get(&attacker.id) {
                            if squared_distance(anchor.x, anchor.y, pos.x, pos.y) > range.powi(2)
                                || squared_distance(anchor.x, anchor.y, candidate.x, candidate.y) > range.powi(2) {
                                return None;
                            }
                        }
                        let distance_sq = squared_distance(pos.x, pos.y, candidate.x, candidate.y);
                        if ordered_movement && select_attack(&profile.attacks, distance_sq,
                            definition.hull_radius.max(0.0), candidate.hull_radius, true).is_none() {
                            return None;
                        }
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
                if idle_approach {
                    if let Some(home) = self.return_positions.get(&attacker.id).copied() {
                        let dx = home.x - pos.x;
                        let dy = home.y - pos.y;
                        let distance = (dx * dx + dy * dy).sqrt();
                        let speed = definition.speed.max(0.0);
                        if distance <= speed * dt {
                            *pos = home;
                            zero_velocity(attacker);
                            self.return_positions.remove(&attacker.id);
                        } else if speed > 0.0 {
                            let velocity = attacker.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
                            velocity.x = dx / distance * speed;
                            velocity.y = dy / distance * speed;
                        } else {
                            zero_velocity(attacker);
                        }
                        continue;
                    }
                }
                // Neutrals have no player-issued movement to preserve. Player
                // units resume their current intent after hostiles leave range.
                if is_system_owner(&attacker.owner_player_id)
                    && !ordered_movement
                    && !scripted_entity_ids.contains(&attacker.id)
                {
                    zero_velocity(attacker);
                }
                continue;
            };

            engagements.insert(attacker.id, target.id);
            let dx = target.x - pos.x;
            let dy = target.y - pos.y;
            let distance_sq = dx * dx + dy * dy;
            let attacker_hull_radius = definition.hull_radius.max(0.0);
            let max_range = profile
                .attacks
                .iter()
                .map(|attack| attack_range(attack, attacker_hull_radius, target.hull_radius))
                .fold(0.0_f32, f32::max);
            if !ordered_movement {
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
            }
            if let Some(attack) = select_attack(
                &profile.attacks,
                distance_sq,
                attacker_hull_radius,
                target.hull_radius,
                ordered_movement,
            ) {
                let origin = Vec2 { x: pos.x, y: pos.y };
                if !ordered_movement { zero_velocity(attacker); }
                let next_tick = self
                    .next_attack_tick
                    .get(&(attacker.id, attack.id.clone()))
                    .copied()
                    .unwrap_or(0);
                if tick >= next_tick && attack.damage.is_finite() && attack.damage > 0.0 {
                    if attack.attack_type == AttackType::Kinetic {
                        let Some(projectile) = attack.projectile else { continue; };
                        let distance = f64::from(dx).hypot(f64::from(dy));
                        let (ux, uy) = if distance > 0.0 {
                            (f64::from(dx) / distance, f64::from(dy) / distance)
                        } else {
                            (1.0, 0.0)
                        };
                        projectile_spawns.push(Entity {
                            entity_type_id: KINETIC_PROJECTILE_TYPE.into(),
                            pos: Some(origin),
                            vel: Some(Vec2 {
                                x: (ux * f64::from(projectile.speed)) as f32,
                                y: (uy * f64::from(projectile.speed)) as f32,
                            }),
                            health: 1.0,
                            // Ownership stays in the server checkpoint, not on the visible entity.
                            projectile: Some(ProjectileState {
                                attacker_id: attacker.id,
                                attacker_entity_type_id: attacker.entity_type_id.clone(),
                                attacker_owner_player_id: attacker.owner_player_id.clone(),
                                damage: attack.damage,
                                remaining_distance: f64::from(projectile.max_travel_distance),
                                precise_x: Some(f64::from(origin.x)),
                                precise_y: Some(f64::from(origin.y)),
                            }),
                            ..Default::default()
                        });
                    } else {
                        record_hit(&mut damage_by_target, target.id, attack.damage, attacker.id,
                            &attacker.entity_type_id, &attacker.owner_player_id, attack.attack_type);
                        if attack.attack_type == AttackType::Laser {
                            laser_shots.push(LaserShot {
                                attacker_id: attacker.id,
                                target_id: target.id,
                                origin,
                                target: Vec2 { x: target.x, y: target.y },
                            });
                        }
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

            if ordered_movement { continue; }
            if idle_approach && definition.speed > 0.0 {
                self.return_positions.entry(attacker.id).or_insert(*pos);
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
                // Rounding at large world coordinates can put this point just
                // outside weapon range, causing every tick to snap here without
                // ever attacking. If needed, inset by a few coordinate ULPs.
                if squared_distance(pos.x, pos.y, target.x, target.y) > max_range * max_range {
                    let coordinate_scale = target.x.abs().max(target.y.abs()).max(max_range);
                    let inset_range = (max_range - 4.0 * f32::EPSILON * coordinate_scale).max(0.0);
                    pos.x = target.x - direction_x * inset_range;
                    pos.y = target.y - direction_y * inset_range;
                }
                zero_velocity(attacker);
            } else {
                let velocity = attacker.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
                velocity.x = direction_x * speed;
                velocity.y = direction_y * speed;
            }
        }

        let destructions = apply_damage(entities, &damage_by_target);
        let dead: Vec<_> = destructions.iter().map(|death| death.victim.id).collect();
        self.forget_destroyed(&dead);
        CombatTick {
            engagements,
            dead_entity_ids: dead,
            laser_shots,
            projectile_spawns,
            dismantling,
            destructions,
        }
    }

    pub(crate) fn forget_destroyed(&mut self, dead: &[u64]) {
        if dead.is_empty() {
            return;
        }
        self.next_attack_tick.retain(|(id, _), _| !dead.contains(id));
        for id in dead {
            self.return_positions.remove(id);
        }
    }
}

fn record_hit(
    damage_by_target: &mut HashMap<u64, DamageContribution>,
    target_id: u64,
    damage: f32,
    attacker_id: u64,
    attacker_entity_type_id: &str,
    attacker_owner_player_id: &str,
    cause: AttackType,
) {
    damage_by_target.entry(target_id).and_modify(|contribution| {
        contribution.total += damage;
        if damage > contribution.largest_hit
            || (damage == contribution.largest_hit && attacker_id < contribution.attacker_id)
        {
            contribution.attacker_id = attacker_id;
            attacker_entity_type_id.clone_into(&mut contribution.attacker_entity_type_id);
            attacker_owner_player_id.clone_into(&mut contribution.attacker_owner_player_id);
            contribution.cause = cause;
            contribution.largest_hit = damage;
        }
    }).or_insert_with(|| DamageContribution {
        total: damage,
        attacker_id,
        attacker_entity_type_id: attacker_entity_type_id.into(),
        attacker_owner_player_id: attacker_owner_player_id.into(),
        cause,
        largest_hit: damage,
    });
}

fn apply_damage(
    entities: &mut [Entity],
    damage_by_target: &HashMap<u64, DamageContribution>,
) -> Vec<CombatDestruction> {
    if damage_by_target.is_empty() {
        return Vec::new();
    }
    let mut destructions = Vec::new();
    for entity in entities {
        let Some(damage) = damage_by_target.get(&entity.id) else { continue; };
        entity.health = (entity.health - damage.total).max(0.0);
        if entity.health <= 0.0 {
            let victim = entity.clone();
            destructions.push(CombatDestruction {
                victim,
                attacker_id: damage.attacker_id,
                attacker_entity_type_id: damage.attacker_entity_type_id.clone(),
                attacker_owner_player_id: damage.attacker_owner_player_id.clone(),
                cause: damage.cause,
                impact: None,
            });
        }
    }
    destructions
}

fn project_position((x, y): (f64, f64)) -> Vec2 {
    Vec2 { x: x as f32, y: y as f32 }
}

#[derive(Clone, Copy)]
pub(crate) struct Motion {
    pub(crate) start: Vec2,
    pub(crate) end: Vec2,
    stop_fraction: f64,
}

impl Motion {
    pub(crate) fn linear(start: Vec2, end: Vec2) -> Self {
        Self { start, end, stop_fraction: 1.0 }
    }

    pub(crate) fn clamped(start: Vec2, end: Vec2, fraction: f64) -> Self {
        Self { start, end, stop_fraction: fraction.clamp(0.0, 1.0) }
    }

    fn displacement(self) -> (f64, f64) {
        (f64::from(self.end.x) - f64::from(self.start.x), f64::from(self.end.y) - f64::from(self.start.y))
    }

    pub(crate) fn at(self, fraction: f64) -> (f64, f64) {
        let (dx, dy) = self.displacement();
        let scale = if self.stop_fraction > 0.0 {
            (fraction / self.stop_fraction).clamp(0.0, 1.0)
        } else {
            1.0
        };
        (f64::from(self.start.x) + dx * scale, f64::from(self.start.y) + dy * scale)
    }
}

/// A hull's center path over one simulation tick. Ordinary movement is a
/// single linear segment; a clamped Move covers its segment first and then
/// stays on the stop boundary for the rest of the tick.
#[derive(Clone, Copy)]
struct HullPath {
    start: (f64, f64),
    move_delta: (f64, f64),
    move_fraction: f64,
}

impl HullPath {
    fn linear(start: Vec2, end: Vec2) -> Self {
        let start = (f64::from(start.x), f64::from(start.y));
        Self {
            start,
            move_delta: (f64::from(end.x) - start.0, f64::from(end.y) - start.1),
            move_fraction: 1.0,
        }
    }

    fn clamped(motion: ClampedMove) -> Self {
        let start = (f64::from(motion.start.x), f64::from(motion.start.y));
        let stop = (f64::from(motion.stop.x), f64::from(motion.stop.y));
        Self {
            start,
            move_delta: (stop.0 - start.0, stop.1 - start.1),
            move_fraction: motion.fraction.clamp(0.0, 1.0),
        }
    }

    fn at(self, fraction: f64) -> (f64, f64) {
        let scale = if self.move_fraction > 0.0 {
            (fraction / self.move_fraction).min(1.0).max(0.0)
        } else {
            1.0
        };
        (
            self.start.0 + self.move_delta.0 * scale,
            self.start.1 + self.move_delta.1 * scale,
        )
    }
}

struct MovingTarget {
    entity_index: usize,
    path: HullPath,
    radius: f64,
}

struct KineticHit {
    fraction: f64,
    projectile_id: u64,
    victim_id: u64,
    victim_index: usize,
    damage: f32,
    attacker_id: u64,
    attacker_entity_type_id: String,
    attacker_owner_player_id: String,
    /// Victim hull center at the moment health reaches zero.
    impact: Impact,
}

/// Earliest tick fraction where a projectile reaches a moving hull. Both the
/// shot and hull are clipped to the shot's remaining travel `limit`.
fn first_projectile_contact(
    path: HullPath,
    (shot_x, shot_y): (f64, f64),
    (shot_dx, shot_dy): (f64, f64),
    limit: f64,
    radius: f64,
) -> Option<f64> {
    if limit <= 0.0 {
        return None;
    }
    let mut best: Option<f64> = None;
    let moving_end = path.move_fraction.min(limit);
    if moving_end > 0.0 && path.move_fraction > 0.0 {
        let hull_scale = moving_end / path.move_fraction;
        let shot_scale = moving_end / limit;
        let hull_delta = (path.move_delta.0 * hull_scale, path.move_delta.1 * hull_scale);
        let shot_delta = (shot_dx * shot_scale, shot_dy * shot_scale);
        let offset = (shot_x - path.start.0, shot_y - path.start.1);
        if let Some(entry) = circle_entry(
            offset,
            (shot_delta.0 - hull_delta.0, shot_delta.1 - hull_delta.1),
            radius,
        ) {
            best = Some(entry * moving_end);
        }
    }
    let stationary_from = path.move_fraction.max(0.0);
    if stationary_from < limit {
        let hull = path.at(stationary_from);
        let shot_scale = stationary_from / limit;
        let shot = (shot_x + shot_dx * shot_scale, shot_y + shot_dy * shot_scale);
        let rest = limit - stationary_from;
        let relative = (shot_dx * (rest / limit), shot_dy * (rest / limit));
        if let Some(entry) = circle_entry((shot.0 - hull.0, shot.1 - hull.1), relative, radius) {
            let fraction = stationary_from + entry * rest;
            best = Some(best.map_or(fraction, |current| current.min(fraction)));
        }
    }
    best
}

/// Resolve existing shots against the same movement interval as the hulls.
/// `starts` holds each hull's pre-integration position, which is the pre-snap
/// position for clamped Move steps. Newly spawned shots wait for the next tick.
pub(crate) fn advance_projectiles(
    entities: &mut [Entity],
    starts: &[Option<Vec2>],
    clamped_moves: &HashMap<u64, ClampedMove>,
    content: &ContentPack,
    dt: f32,
) -> ProjectileTick {
    let mut targets = Vec::new();
    let mut grid = SpatialIndex::new();
    let mut max_radius = 0.0_f64;
    let mut max_displacement = 0.0_f64;
    for (index, (entity, start)) in entities.iter().zip(starts).enumerate() {
        let (Some(start), Some(end)) = (*start, entity.pos) else { continue; };
        if entity.health <= 0.0 || entity.owner_player_id.is_empty() || entity.projectile.is_some() {
            continue;
        }
        let Some(def) = content.get(&entity.entity_type_id).filter(|def| def.combat_targetable) else { continue; };
        let path = clamped_moves.get(&entity.id)
            .map_or_else(|| HullPath::linear(start, end), |motion| HullPath::clamped(*motion));
        let radius = f64::from(def.hull_radius.max(0.0));
        max_radius = max_radius.max(radius);
        max_displacement = max_displacement
            .max(path.move_delta.0.abs())
            .max(path.move_delta.1.abs());
        grid.insert(targets.len(), path.start.0 as f32, path.start.1 as f32);
        targets.push(MovingTarget { entity_index: index, path, radius });
    }

    let mut hits = Vec::new();
    let mut terminations = Vec::new();
    for index in 0..entities.len() {
        let shot = &entities[index];
        let Some(flight) = &shot.projectile else { continue; };
        let pos = shot.pos.unwrap_or_default();
        let (x, y) = (
            flight.precise_x.unwrap_or(f64::from(pos.x)),
            flight.precise_y.unwrap_or(f64::from(pos.y)),
        );
        let vel = shot.vel.unwrap_or_default();
        let (vx, vy) = (f64::from(vel.x), f64::from(vel.y));
        let step = vx.hypot(vy) * f64::from(dt);
        let travel = step.min(flight.remaining_distance);
        let limit = if shot.pos.is_some() && step.is_finite() && step > 0.0 && travel > 0.0 {
            travel / step
        } else {
            0.0
        };
        let (dx, dy) = if limit > 0.0 {
            let elapsed = f64::from(dt) * limit;
            (vx * elapsed, vy * elapsed)
        } else {
            (0.0, 0.0)
        };
        let (end_x, end_y) = (x + dx, y + dy);
        let candidate = |target: &MovingTarget| {
            let entity = &entities[target.entity_index];
            if entity.id == flight.attacker_id || entity.owner_player_id == flight.attacker_owner_player_id {
                return None;
            }
            let entry = first_projectile_contact(target.path, (x, y), (dx, dy), limit, target.radius)?;
            Some((entry, entity.id, target.entity_index, target.path))
        };
        let compare = |a: &(f64, u64, usize, HullPath), b: &(f64, u64, usize, HullPath)| {
            a.0.total_cmp(&b.0).then_with(|| a.1.cmp(&b.1))
        };
        // Index hull start points. Full-tick displacement keeps hulls that
        // enter the projectile rectangle during the clipped interval eligible.
        let pad = max_radius + max_displacement;
        let hit = if limit == 0.0 {
            None
        } else if travel + 2.0 * pad <= f64::from(CELL_SIZE) {
            grid.in_rect(
                (x.min(end_x) - pad) as f32, (y.min(end_y) - pad) as f32,
                (x.max(end_x) + pad) as f32, (y.max(end_y) + pad) as f32,
            ).filter_map(|i| candidate(&targets[i])).min_by(compare)
        } else {
            // Wide custom-content sweeps should not visit thousands of empty cells.
            targets.iter().filter_map(candidate).min_by(compare)
        };
        let terminal = if let Some((fraction, victim_id, victim_index, path)) = hit {
            let shot_fraction = fraction / limit;
            hits.push(KineticHit {
                fraction,
                projectile_id: shot.id,
                victim_id,
                victim_index,
                damage: flight.damage,
                attacker_id: flight.attacker_id,
                attacker_entity_type_id: flight.attacker_entity_type_id.clone(),
                attacker_owner_player_id: flight.attacker_owner_player_id.clone(),
                impact: Impact { fraction, position: path.at(fraction) },
            });
            Some(Impact {
                fraction,
                position: (x + dx * shot_fraction, y + dy * shot_fraction),
            })
        } else if limit == 0.0 {
            Some(Impact { fraction: 0.0, position: (x, y) })
        } else if travel >= flight.remaining_distance {
            Some(Impact { fraction: limit, position: (end_x, end_y) })
        } else {
            None
        };
        let shot = &mut entities[index];
        if let Some(impact) = terminal {
            terminations.push((shot.id, impact));
            shot.health = 0.0;
        } else {
            let flight = shot.projectile.as_mut().unwrap();
            flight.remaining_distance -= travel;
            flight.precise_x = Some(end_x);
            flight.precise_y = Some(end_y);
            shot.pos = Some(project_position((end_x, end_y)));
        }
    }

    // Kinetic damage lands in impact order. The hit that drives health to zero
    // owns the destruction, so witnesses use that hit's time and position.
    hits.sort_by(|a, b| {
        a.fraction.total_cmp(&b.fraction)
            .then_with(|| a.projectile_id.cmp(&b.projectile_id))
            .then_with(|| a.victim_id.cmp(&b.victim_id))
    });
    let mut destructions = Vec::new();
    for hit in hits {
        let entity = &mut entities[hit.victim_index];
        if entity.health <= 0.0 {
            continue;
        }
        entity.health = (entity.health - hit.damage).max(0.0);
        if entity.health > 0.0 {
            continue;
        }
        let mut victim = entity.clone();
        victim.pos = Some(project_position(hit.impact.position));
        destructions.push(CombatDestruction {
            victim,
            attacker_id: hit.attacker_id,
            attacker_entity_type_id: hit.attacker_entity_type_id,
            attacker_owner_player_id: hit.attacker_owner_player_id,
            cause: AttackType::Kinetic,
            impact: Some(hit.impact),
        });
    }
    ProjectileTick { terminations, destructions }
}

/// Entry fraction in `[0, 1]` for a point moving by `delta` from `offset`
/// (relative to a stationary circle) that reaches the circle.
fn circle_entry((x, y): (f64, f64), (dx, dy): (f64, f64), radius: f64) -> Option<f64> {
    let outside = x * x + y * y - radius * radius;
    if outside <= 0.0 {
        return Some(0.0);
    }
    let speed_sq = dx * dx + dy * dy;
    if speed_sq == 0.0 {
        return None;
    }
    let b = x * dx + y * dy;
    let discriminant = b * b - speed_sq * outside;
    if discriminant < 0.0 {
        return None;
    }
    let entry = (-b - discriminant.sqrt()) / speed_sq;
    (0.0..=1.0).contains(&entry).then_some(entry)
}

struct Target {
    id: u64,
    owner_player_id: String,
    combat_targetable: bool,
    x: f32,
    y: f32,
    hull_radius: f32,
}

fn attack_range(attack: &AttackDef, attacker_hull_radius: f32, target_hull_radius: f32) -> f32 {
    match attack.attack_type {
        AttackType::Laser | AttackType::Kinetic => attack.range.max(0.0),
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
    ranged_only: bool,
) -> Option<&'a AttackDef> {
    attacks
        .iter()
        .filter(|attack| !ranged_only || attack.attack_type != AttackType::Dismantle)
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
    use crate::content::{
        AttackDef, AttackType, CombatDef, EntityTypeDef, NearEnemyStrategy, VisualDef,
    };
    use crate::spawn_config::RAIDERS_OWNER;

    fn content() -> ContentPack {
        let raider = EntityTypeDef {
            initial_resources: HashMap::new(),
            inventory_regeneration: HashMap::new(),
            resource_reserves: HashMap::new(),
            max_capacity: HashMap::new(),
            depot: false,
            depot_range: 0.0,
            shareable_with_hub: Vec::new(),
            resource_sharing: None,
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
                    projectile: None,
                }],
            }),
            combat_targetable: true,
            visual: VisualDef::default(),
            z_index: 0,
            suppress_hover: false,
            collector: None,
            repair: None,
            resource_node: None,
            refinery: None,
            radiation_sources: Vec::new(),
            radiation_shielding: HashMap::new(),
            build_cost: HashMap::new(),
            maintenance_cost_per_minute: HashMap::new(),
            sensor: None,
            visibility_range: None,
            builds: Vec::new(),
            upgrades: Vec::new(),
            requires_technologies: None,
            researches: Vec::new(),
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
            technologies: HashMap::new(),
            content_hash: "test".to_string(),
        }
    }

    fn entity(id: u64, kind: &str, owner: &str, x: f32, health: f32) -> Entity {
        Entity {
            supply: None,
            projectile: None,
            resource_deposit: None,
            resources: None,
            id,
            entity_type_id: kind.to_string(),
            pos: Some(Vec2 { x, y: 0.0 }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: None,
            owner_player_id: owner.to_string(),
            health,
        }
    }

    fn test_shot(x: f32, y: f32, range: f64) -> Entity {
        Entity {
            id: 10,
            entity_type_id: KINETIC_PROJECTILE_TYPE.into(),
            pos: Some(Vec2 { x, y }),
            vel: Some(Vec2 { x: 80.0, y: 0.0 }),
            health: 1.0,
            projectile: Some(ProjectileState {
                attacker_owner_player_id: "me".into(),
                damage: 12.0,
                remaining_distance: range,
                ..Default::default()
            }),
            ..Default::default()
        }
    }

    #[test]
    fn swept_hull_crosses_grid_boundary_before_or_after_range_cutoff() {
        let mut pack = content();
        pack.entity_types.get_mut("worker").unwrap().hull_radius = 50.0;
        let shot_y = CELL_SIZE - 52.0;
        let mut target = entity(2, "worker", "enemy", 40.0, 10.0);
        target.pos.as_mut().unwrap().y = shot_y + 35.0;
        let start = Vec2 { x: 40.0, y: shot_y + 55.0 };

        let mut entities = [test_shot(0.0, shot_y, 80.0), target.clone()];
        let hit = advance_projectiles(&mut entities, &[None, Some(start)], &HashMap::new(), &pack, 1.0);
        assert_eq!(hit.destructions[0].victim.id, 2);
        assert!(hit.terminations[0].1.fraction < 0.5);

        let mut entities = [test_shot(0.0, shot_y, 20.0), target];
        let expired = advance_projectiles(&mut entities, &[None, Some(start)], &HashMap::new(), &pack, 1.0);
        assert_eq!(entities[1].health, 10.0);
        assert_eq!(expired.terminations[0].1.position, (20.0, f64::from(shot_y)));
    }

    #[test]
    fn clamped_move_sweeps_pre_snap_path_before_stopping() {
        let mut pack = content();
        pack.entity_types.get_mut("worker").unwrap().hull_radius = 50.0;
        let mut target = entity(2, "worker", "enemy", 60.0, 10.0);
        target.pos.as_mut().unwrap().y = 51.0; // Post-snap stop boundary.
        let starts = [None, Some(Vec2 { x: 60.0, y: 31.0 })];
        let clamped = HashMap::from([(2, ClampedMove {
            start: Vec2 { x: 60.0, y: 31.0 },
            stop: Vec2 { x: 60.0, y: 51.0 },
            fraction: 0.8,
        })]);

        let mut entities = [test_shot(0.0, 0.0, 80.0), target.clone()];
        let hit = advance_projectiles(&mut entities, &starts, &clamped, &pack, 1.0);
        assert_eq!(hit.destructions[0].victim.id, 2);
        assert!(hit.destructions[0].impact.unwrap().fraction < 0.5);

        // Without the pre-snap trajectory the hull appears stationary at y=51
        // and the same shot expires beyond it without a hit.
        let stationary_starts = [None, Some(Vec2 { x: 60.0, y: 51.0 })];
        let mut entities = [test_shot(0.0, 0.0, 80.0), target];
        let missed = advance_projectiles(&mut entities, &stationary_starts, &HashMap::new(), &pack, 1.0);
        assert!(missed.destructions.is_empty());
        assert_eq!(entities[1].health, 10.0);
    }

    #[test]
    fn clamped_move_stays_on_its_stop_boundary_for_the_rest_of_the_tick() {
        let mut pack = content();
        pack.entity_types.get_mut("worker").unwrap().hull_radius = 8.0;
        let mut target = entity(2, "worker", "enemy", 40.0, 10.0);
        target.pos.as_mut().unwrap().y = 0.0;
        let starts = [None, Some(Vec2 { x: 40.0, y: 20.0 })];
        let clamped = HashMap::from([(2, ClampedMove {
            start: Vec2 { x: 40.0, y: 20.0 },
            stop: Vec2 { x: 40.0, y: 0.0 },
            fraction: 0.2,
        })]);

        let mut entities = [test_shot(0.0, 0.0, 80.0), target.clone()];
        let hit = advance_projectiles(&mut entities, &starts, &clamped, &pack, 1.0);
        assert_eq!(hit.destructions[0].victim.id, 2);
        assert!((hit.destructions[0].impact.unwrap().fraction - 0.4).abs() < 1e-6);

        // Linear interpolation over the whole tick would still be moving
        // upward at x=40 and would miss the 8-unit hull.
        let mut entities = [test_shot(0.0, 0.0, 80.0), target];
        let missed = advance_projectiles(&mut entities, &starts, &HashMap::new(), &pack, 1.0);
        assert!(missed.destructions.is_empty());
    }

    #[test]
    fn kinetic_destruction_uses_the_lethal_hit_not_the_largest_or_first() {
        let mut pack = content();
        pack.entity_types.get_mut("worker").unwrap().hull_radius = 20.0;
        let target = entity(2, "worker", "enemy", 40.0, 20.0);
        let mut first = test_shot(0.0, 0.0, 80.0);
        first.id = 100;
        first.projectile.as_mut().unwrap().attacker_id = 1;
        let mut second = test_shot(0.0, 10.0, 80.0);
        second.id = 101;
        second.pos.as_mut().unwrap().y = 10.0;
        second.projectile.as_mut().unwrap().attacker_id = 2;

        let mut entities = [first, second, target.clone()];
        let starts = [None, None, target.pos];
        let outcome = advance_projectiles(&mut entities, &starts, &HashMap::new(), &pack, 1.0);
        assert_eq!(outcome.terminations.len(), 2);
        assert_eq!(outcome.destructions.len(), 1);
        let death = &outcome.destructions[0];
        assert_eq!(death.victim.id, 2);
        assert_eq!(death.attacker_id, 2, "second, lethal hit owns the kill");
        let impact = death.impact.unwrap();
        assert!(impact.fraction > 0.25);
        assert_eq!(impact.position, (40.0, 0.0));
        assert_eq!(entities[2].health, 0.0);
    }

    #[test]
    fn flight_accumulates_steps_smaller_than_a_coordinate_ulp_across_checkpoint() {
        use prost::Message;

        let mut pack = content();
        pack.entity_types.get_mut("worker").unwrap().hull_radius = 50.0;
        let origin = 2_147_483_648.0_f32;
        let target = entity(2, "worker", "enemy", origin + 512.0, 10.0);
        let starts = [None, target.pos];
        let mut entities = [test_shot(origin, 0.0, 560.0), target];

        advance_projectiles(&mut entities, &starts, &HashMap::new(), &pack, 1.0);
        assert_eq!(entities[0].pos.unwrap().x, origin);
        entities[0] = Entity::decode(entities[0].encode_to_vec().as_slice()).unwrap();
        for _ in 0..4 {
            let result = advance_projectiles(&mut entities, &starts, &HashMap::new(), &pack, 1.0);
            assert!(result.terminations.is_empty());
        }
        let result = advance_projectiles(&mut entities, &starts, &HashMap::new(), &pack, 1.0);
        assert_eq!(result.terminations[0].1.position.0, f64::from(origin) + 462.0);
        assert_eq!(result.destructions[0].victim.id, 2);
    }

    #[test]
    fn pursues_to_weapon_range_then_fires_on_tick_cadence() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", RAIDERS_OWNER, 0.0, 20.0),
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

    fn advance_combat(
        combat: &mut CombatSystem,
        state: &mut crate::engine::state::GameState,
        pack: &ContentPack,
        tick: u64,
    ) -> CombatTick {
        let result = combat.tick(&mut state.entities, pack, tick, 1.0);
        crate::physics::integrate(
            &crate::config::GameConfig { friction: 0.0, ..Default::default() },
            state,
            1.0,
        );
        result
    }

    #[test]
    fn idle_approach_pursues_fights_and_returns_to_its_start() {
        let pack = content();
        let mut state = crate::engine::state::GameState {
            discovered_entities: Default::default(),
            generation: Default::default(),
            tick: 0,
            technologies: HashMap::new(),
            entities: vec![
                entity(1, "raider", "me", 0.0, 20.0),
                entity(2, "worker", "enemy", 40.0, 12.0),
            ],
        };
        let mut combat = CombatSystem::default();
        for tick in 0..3 {
            let result = advance_combat(&mut combat, &mut state, &pack, tick);
            assert_eq!(result.engagements.get(&1), Some(&2));
            assert!(result.laser_shots.is_empty());
        }
        assert_eq!(state.entities[0].pos.unwrap().x, 30.0);
        assert_eq!(combat.return_positions[&1].x, 0.0);
        assert_eq!(advance_combat(&mut combat, &mut state, &pack, 3).laser_shots.len(), 1);
        assert!(advance_combat(&mut combat, &mut state, &pack, 4).laser_shots.is_empty());
        assert_eq!(advance_combat(&mut combat, &mut state, &pack, 5).dead_entity_ids, vec![2]);
        for (tick, expected_x) in [(6, 20.0), (7, 10.0), (8, 0.0), (9, 0.0)] {
            assert!(advance_combat(&mut combat, &mut state, &pack, tick).engagements.is_empty());
            assert_eq!(state.entities[0].pos.unwrap().x, expected_x);
        }
        assert_eq!(state.entities[0].vel.unwrap().x, 0.0);
        assert!(combat.return_positions.is_empty());
    }

    #[test]
    fn snapshot_restores_anchor_mid_pursuit_and_resumes_return() {
        use prost::Message;

        let pack = content();
        let mut state = crate::engine::state::GameState {
            discovered_entities: Default::default(),
            generation: Default::default(),
            tick: 0,
            technologies: HashMap::new(),
            entities: vec![
                entity(1, "raider", "me", 0.0, 20.0),
                entity(2, "worker", "enemy", 40.0, 6.0),
            ],
        };
        let mut combat = CombatSystem::default();
        advance_combat(&mut combat, &mut state, &pack, 0);
        assert_eq!(state.entities[0].pos.unwrap().x, 10.0);
        let snapshot = crate::pb::Snapshot {
            entities: state.entities.clone(),
            idle_combat_returns: combat.return_positions_for_snapshot(),
            ..Default::default()
        };
        let restored = crate::pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        state.entities = restored.entities;
        combat = CombatSystem::default();
        combat.restore_return_positions(restored.idle_combat_returns);
        for tick in 1..3 {
            assert_eq!(advance_combat(&mut combat, &mut state, &pack, tick).engagements.get(&1), Some(&2));
        }
        assert_eq!(advance_combat(&mut combat, &mut state, &pack, 3).dead_entity_ids, vec![2]);
        for (tick, x) in [(4, 20.0), (5, 10.0), (6, 0.0)] {
            advance_combat(&mut combat, &mut state, &pack, tick);
            assert_eq!(state.entities[0].pos.unwrap().x, x);
        }
        assert!(combat.return_positions.is_empty());
    }

    #[test]
    fn new_combat_interrupts_return_without_replacing_the_start() {
        let pack = content();
        let mut state = crate::engine::state::GameState {
            discovered_entities: Default::default(),
            generation: Default::default(),
            tick: 0,
            technologies: HashMap::new(),
            entities: vec![
                entity(1, "raider", "me", 0.0, 20.0),
                entity(2, "worker", "enemy", 40.0, 6.0),
            ],
        };
        let mut combat = CombatSystem::default();
        for tick in 0..3 {
            advance_combat(&mut combat, &mut state, &pack, tick);
        }
        assert_eq!(advance_combat(&mut combat, &mut state, &pack, 3).dead_entity_ids, vec![2]);
        assert!(advance_combat(&mut combat, &mut state, &pack, 4).engagements.is_empty());
        assert_eq!(state.entities[0].pos.unwrap().x, 20.0);
        state.entities.push(entity(3, "worker", "enemy", 50.0, 6.0));
        for (tick, expected_x) in [(5, 30.0), (6, 40.0)] {
            assert_eq!(advance_combat(&mut combat, &mut state, &pack, tick).engagements.get(&1), Some(&3));
            assert_eq!(state.entities[0].pos.unwrap().x, expected_x);
            assert_eq!(combat.return_positions[&1].x, 0.0);
        }
        assert_eq!(advance_combat(&mut combat, &mut state, &pack, 7).dead_entity_ids, vec![3]);
        for (tick, expected_x) in [(8, 30.0), (9, 20.0), (10, 10.0), (11, 0.0)] {
            advance_combat(&mut combat, &mut state, &pack, tick);
            assert_eq!(state.entities[0].pos.unwrap().x, expected_x);
        }
        assert_eq!(state.entities[0].vel.unwrap().x, 0.0);
        assert!(combat.return_positions.is_empty());
    }

    #[test]
    fn an_order_takes_over_and_cancels_an_idle_return() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", "me", 0.0, 20.0),
            entity(2, "worker", "enemy", 40.0, 100.0),
        ];
        let mut combat = CombatSystem::default();
        combat.tick(&mut entities, &pack, 0, 1.0);
        assert_eq!(combat.return_positions[&1].x, 0.0);
        entities[0].pos.as_mut().unwrap().x = 10.0;
        entities[0].vel.as_mut().unwrap().x = 0.0;
        moving_tick(&mut combat, &mut entities, &pack, 1);
        assert!(combat.return_positions.is_empty());
        entities[1].health = 0.0;
        combat.tick(&mut entities, &pack, 2, 1.0);
        assert_eq!(entities[0].pos.unwrap().x, 10.0);
        assert_eq!(entities[0].vel.unwrap().x, 0.0);
    }

    #[test]
    fn completed_same_tick_order_does_not_resume_the_old_return() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", "me", 0.0, 20.0),
            entity(2, "worker", "enemy", 40.0, 100.0),
        ];
        let mut combat = CombatSystem::default();
        combat.tick(&mut entities, &pack, 0, 1.0);
        assert_eq!(combat.return_positions[&1].x, 0.0);
        // The accepted Move reaches its destination before combat checks active intents.
        combat.cancel_return(1);
        entities[0].pos.as_mut().unwrap().x = 10.0;
        entities[0].vel.as_mut().unwrap().x = 0.0;
        entities[1].health = 0.0;
        combat.tick(&mut entities, &pack, 1, 1.0);
        assert_eq!(entities[0].pos.unwrap().x, 10.0);
        assert!(combat.return_positions.is_empty());
    }

    #[test]
    fn maintained_sentry_and_escort_pursuit_does_not_capture_an_idle_return() {
        let pack = content();
        for escort in [false, true] {
            let mut entities = vec![
                entity(1, "raider", "me", 0.0, 20.0),
                entity(2, "worker", "enemy", 40.0, 100.0),
            ];
            let maintained = if escort { HashSet::new() } else { HashSet::from([1]) };
            let leashes = if escort {
                HashMap::from([(1, (Vec2 { x: 0.0, y: 0.0 }, 100.0))])
            } else {
                HashMap::new()
            };
            let mut combat = CombatSystem::default();
            let outcome = combat.tick_with_ordered_movement(
                &mut entities, &pack, 0, 1.0, &HashSet::new(),
                &HashMap::new(), &HashSet::new(), &leashes,
                &HashSet::new(), &maintained,
            );
            assert_eq!(outcome.engagements.get(&1), Some(&2));
            assert_eq!(entities[0].vel.unwrap().x, 10.0);
            assert!(combat.return_positions.is_empty());
        }
    }

    #[test]
    fn escort_leash_follows_leader_filters_targets_and_preserves_cooldown() {
        let pack = content();
        let mut entities = vec![entity(1, "raider", "me", 0.0, 20.0),
            entity(2, "worker", "enemy", 5.0, 100.0)];
        let mut combat = CombatSystem::default();
        let run = |combat: &mut CombatSystem, entities: &mut [Entity], tick, anchor_x| {
            combat.tick_with_escort_leashes(entities, &pack, tick, 1.0,
                &HashSet::new(), &HashMap::new(), &HashSet::new(),
                &HashMap::from([(1, (Vec2 { x:anchor_x, y:0.0 },20.0))]))
        };
        assert_eq!(run(&mut combat,&mut entities,0,0.0).laser_shots.len(),1);
        // A moving leader can pull the guard out of its combat boundary even
        // though the enemy remains next to it. Returning is then owned by Escort.
        assert!(run(&mut combat,&mut entities,1,100.0).engagements.is_empty());
        // Re-entry within the cooldown does not grant another shot.
        let reentered=run(&mut combat,&mut entities,1,0.0);
        assert_eq!(reentered.engagements.get(&1),Some(&2));
        assert!(reentered.laser_shots.is_empty());
        assert_eq!(run(&mut combat,&mut entities,2,0.0).laser_shots.len(),1);
        // Enemy is still inside the guard's own acquisition range, but outside
        // the leader-centered leash, so it cannot lure the guard away.
        entities[1].pos.as_mut().unwrap().x=25.0;
        assert!(run(&mut combat,&mut entities,3,0.0).engagements.is_empty());
    }

    #[test]
    fn target_ties_are_resolved_by_entity_id() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", RAIDERS_OWNER, 0.0, 20.0),
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
            entity(3, "worker", RAIDERS_OWNER, 8.0, 20.0),
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
                projectile: None,
            }],
        });
        let raider = pack.entity_types.get_mut("raider").unwrap();
        raider.hull_radius = 4.0;
        raider.combat = None;
        let mut entities = vec![
            entity(1, "worker", "player", 0.0, 20.0),
            entity(2, "raider", RAIDERS_OWNER, 9.0, 20.0),
        ];

        let outcome = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(outcome.laser_shots.is_empty());
        assert_eq!(outcome.dismantling.len(), 1);
        assert_eq!(outcome.dismantling[0].attacker_id, 1);
        assert_eq!(outcome.dismantling[0].target_id, 2);
        assert_eq!(entities[1].health, 15.0);
    }

    #[test]
    fn pursuit_reaches_attack_range_at_large_world_coordinates() {
        for attack_type in [AttackType::Dismantle, AttackType::Laser] {
            let mut pack = content();
            let worker = pack.entity_types.get_mut("worker").unwrap();
            worker.speed = 90.0;
            worker.hull_radius = 50.0;
            worker.combat = Some(CombatDef {
                acquisition_range: 250.0,
                on_near_enemy_strategy: NearEnemyStrategy::Approach,
                attacks: vec![AttackDef {
                    id: "attack".to_string(),
                    attack_type,
                    range: 102.0,
                    damage: 4.0,
                    cooldown_ticks: 20,
                    priority: 0,
                    contact_tolerance: 2.0,
                    projectile: None,
                }],
            });
            let raider = pack.entity_types.get_mut("raider").unwrap();
            raider.hull_radius = 50.0;
            raider.combat = None;

            for angle_index in 0..32 {
                let angle = angle_index as f32 * std::f32::consts::TAU / 32.0;
                let mut entities = vec![
                    entity(1, "worker", "player", 103059.65, 200.0),
                    entity(2, "raider", RAIDERS_OWNER, 103059.65 + 150.0 * angle.cos(), 40.0),
                ];
                entities[0].pos.as_mut().unwrap().y = -6904.713;
                entities[1].pos.as_mut().unwrap().y = -6904.713 + 150.0 * angle.sin();
                let mut combat = CombatSystem::default();
                // A one-second step reaches the stopping point. Subsequent ticks
                // must attack rather than repeatedly snap to an out-of-range point.
                for tick in 0..4 {
                    combat.tick(&mut entities, &pack, tick, 1.0);
                }
                assert!(entities[1].health < 40.0,
                    "{attack_type:?} never fired at angle {angle_index}: {:?}", entities[0].pos);
            }
        }
    }

    #[test]
    fn records_victim_and_attacker_for_a_combat_destruction() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", RAIDERS_OWNER, 0.0, 20.0),
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
            entity(2, "planet_blue", RAIDERS_OWNER, 20.0, 100.0),
        ];

        let result = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(result.laser_shots.is_empty());
        assert_eq!(entities[1].health, 100.0);
        assert_eq!(entities[0].vel, Some(Vec2 { x: 0.0, y: 0.0 }));
    }

    #[test]
    fn scripted_target_can_override_autonomous_targetability() {
        let mut pack = content();
        pack.entity_types
            .get_mut("worker")
            .unwrap()
            .combat_targetable = false;
        let mut entities = vec![
            entity(1, "raider", RAIDERS_OWNER, 0.0, 20.0),
            entity(2, "worker", "player", 5.0, 20.0),
        ];

        let result = CombatSystem::default().tick_with_scripted_targets(
            &mut entities,
            &pack,
            0,
            1.0,
            &HashSet::new(),
            &HashMap::from([(1, 2)]),
            &HashSet::from([1]),
        );

        assert_eq!(entities[1].health, 14.0);
        assert_eq!(result.laser_shots[0].target_id, 2);
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
            entity(2, "worker", RAIDERS_OWNER, 20.0, 20.0),
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
            entity(2, "worker", RAIDERS_OWNER, 5.0, 20.0),
        ];

        let result = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);

        assert!(result.laser_shots.is_empty());
        assert_eq!(entities[0].vel, Some(Vec2 { x: -10.0, y: 0.0 }));
    }

    fn moving_tick(combat: &mut CombatSystem, entities: &mut [Entity], pack: &ContentPack, tick: u64) -> CombatTick {
        combat.tick_with_ordered_movement(entities, pack, tick, 1.0,
            &HashSet::from([1]), &HashMap::new(), &HashSet::new(), &HashMap::new(), &HashSet::from([1]), &HashSet::new())
    }

    #[test]
    fn ordered_movement_fires_lasers_without_stopping_and_keeps_cooldowns() {
        let pack = content();
        let mut entities = vec![entity(1, "raider", "me", 0.0, 20.0), entity(2, "worker", "enemy", 5.0, 100.0)];
        entities[0].vel = Some(Vec2 { x: 0.0, y: 10.0 });
        let before = entities[0].clone();
        let mut combat = CombatSystem::default();
        assert_eq!(moving_tick(&mut combat, &mut entities, &pack, 0).laser_shots.len(), 1);
        assert_eq!(entities[1].health, 94.0);
        assert_eq!(entities[0], before);
        assert!(moving_tick(&mut combat, &mut entities, &pack, 1).laser_shots.is_empty());
        assert_eq!(entities[0], before);
        // Finishing/replacing Move cannot reset the weapon cooldown.
        assert_eq!(combat.tick(&mut entities, &pack, 2, 1.0).laser_shots.len(), 1);
        entities[0].vel = before.vel;
        assert!(moving_tick(&mut combat, &mut entities, &pack, 3).laser_shots.is_empty());
        assert_eq!(moving_tick(&mut combat, &mut entities, &pack, 4).laser_shots.len(), 1);
        assert_eq!(entities[0], before);
    }

    #[test]
    fn ordered_movement_never_pursues_or_flees_and_only_acquires_in_range_hostiles() {
        for strategy in [NearEnemyStrategy::Approach, NearEnemyStrategy::Stay, NearEnemyStrategy::Flee] {
            let mut pack = content();
            pack.entity_types.get_mut("raider").unwrap().combat.as_mut().unwrap().on_near_enemy_strategy = strategy;
            let mut entities = vec![entity(1, "raider", "me", 0.0, 20.0),
                entity(2, "worker", "enemy", 20.0, 100.0), entity(3, "worker", "me", 1.0, 100.0)];
            entities[0].vel = Some(Vec2 { x: -3.0, y: 7.0 });
            let before = entities[0].clone();
            let mut combat = CombatSystem::default();
            let result = moving_tick(&mut combat, &mut entities, &pack, 0);
            assert!(result.laser_shots.is_empty());
            assert!(result.engagements.is_empty());
            assert_eq!(entities[0], before);
            entities[1].pos.as_mut().unwrap().x = 10.0;
            let result = moving_tick(&mut combat, &mut entities, &pack, 1);
            assert_eq!(result.laser_shots[0].target_id, 2);
            assert_eq!(entities[2].health, 100.0);
            assert_eq!(entities[0], before);
        }
    }

    #[test]
    fn ordered_movement_ignores_contact_attacks_and_requires_operating_supply() {
        let mut pack = content();
        let profile = pack.entity_types.get_mut("raider").unwrap().combat.as_mut().unwrap();
        let mut contact = profile.attacks[0].clone();
        contact.id = "dismantle".into(); contact.attack_type = AttackType::Dismantle;
        contact.priority = 100; contact.contact_tolerance = 10.0;
        profile.attacks.push(contact);
        let mut entities = vec![entity(1, "raider", "me", 0.0, 20.0), entity(2, "worker", "enemy", 5.0, 100.0)];
        entities[0].vel = Some(Vec2 { x: 0.0, y: 10.0 });
        let mut combat = CombatSystem::default();
        let result = moving_tick(&mut combat, &mut entities, &pack, 0);
        assert_eq!(result.laser_shots.len(), 1);
        assert!(result.dismantling.is_empty());
        pack.entity_types.get_mut("raider").unwrap().combat.as_mut().unwrap().attacks.remove(0);
        assert!(moving_tick(&mut combat, &mut entities, &pack, 2).dismantling.is_empty());
        let before = entities[0].clone();
        pack = content();
        entities[0].supply = Some(crate::pb::DepotSupply { operational: false, ..Default::default() });
        assert!(moving_tick(&mut combat, &mut entities, &pack, 4).laser_shots.is_empty());
        assert_eq!(entities[0].vel, before.vel);
    }

    #[test]
    fn move_route_advances_while_firing() {
        use crate::engine::{intent::{IntentManager, IntentMetadata}, state::GameState};
        use crate::pb;
        let pack = content();
        let mut manager = IntentManager::new(pack.entity_types.clone(), 0.5, 10.0);
        manager.try_activate(pb::Intent { kind: Some(pb::intent::Kind::Move(pb::MoveToLocationIntent {
            entity_id: 1, target: Some(Vec2 { x: 0.0, y: 50.0 }), ..Default::default()
        })) }, IntentMetadata { entity_id: 1, intent_id: vec![1;16], client_cmd_id: vec![2;16],
            player_id: "me".into(), protocol_version: crate::engine::ENGINE_PROTOCOL_MAJOR,
            server_tick: 0, policy: pb::IntentPolicy::ReplaceActive }, "raider");
        let mut state = GameState { discovered_entities: Default::default(), generation: Default::default(), tick: 0, technologies: HashMap::new(), entities: vec![
            entity(1, "raider", "me", 0.0, 20.0), entity(2, "worker", "enemy", 5.0, 100.0)] };
        assert!(manager.follow_targets(&mut state, 10.0, 0.1).is_empty());
        let velocity = state.entities[0].vel.unwrap();
        let mut combat = CombatSystem::default();
        assert_eq!(moving_tick(&mut combat, &mut state.entities, &pack, 0).laser_shots.len(), 1);
        assert_eq!(state.entities[0].vel.unwrap(), velocity);
        let config = crate::config::GameConfig { friction: 0.0, ..Default::default() };
        crate::physics::integrate(&config, &mut state, 0.1);
        assert!(state.entities[0].pos.unwrap().y > 0.0);
        assert_eq!(state.entities[0].pos.unwrap().x, 0.0);
        assert!(manager.active_intents().contains_key(&1));
    }

    #[test]
    fn player_order_suppresses_autonomous_combat() {
        let pack = content();
        let mut entities = vec![
            entity(1, "raider", "player-a", 0.0, 20.0),
            entity(2, "worker", RAIDERS_OWNER, 5.0, 20.0),
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
