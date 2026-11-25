//! Deterministic, server-authoritative combat. Lasers and dismantling resolve
//! when fired; kinetic shots resolve separately as their projectiles travel.

use std::collections::{BTreeSet, HashMap, HashSet};

use crate::content::{AttackDef, AttackType, ContentPack, NearEnemyStrategy, KINETIC_PROJECTILE_TYPE};
use crate::engine::{discovery::sensor_range, state::PlayerTechnologies};
use crate::pb::{Entity, FlightPosition, ProjectileFlight, ProjectileTrail, Vec2};
use crate::spatial::{SpatialIndex, CELL_SIZE};
use crate::spawn_config::{is_player_owner, is_system_owner};

// Scenario IDs are limited to safe JavaScript integers. Projectiles use the
// uint64 range above them so transient shots don't affect unit IDs.
const FIRST_PROJECTILE_ID: u64 = 1 << 63;

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
    pub(crate) projectile_launches: Vec<Entity>,
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
    pub(crate) kinetic_witnesses: Option<Vec<String>>,
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

    /// Ordered movement owns position and velocity; combat may only fire in-range ranged weapons.
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
                projectile_launches: Vec::new(),
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
        let mut projectile_launches = Vec::new();
        let mut engagements = HashMap::new();
        let mut dismantling = Vec::new();
        for attacker in entities.iter_mut() {
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
                        let Some(projectile_type) = content.get(KINETIC_PROJECTILE_TYPE) else { continue; };
                        let distance = distance_sq.sqrt();
                        let (dir_x, dir_y) = if distance > 0.0 {
                            (dx / distance, dy / distance)
                        } else {
                            (1.0, 0.0)
                        };
                        projectile_launches.push(Entity {
                            entity_type_id: KINETIC_PROJECTILE_TYPE.to_string(),
                            pos: Some(origin),
                            vel: Some(Vec2 {
                                x: dir_x * projectile.speed,
                                y: dir_y * projectile.speed,
                            }),
                            // Unowned in player projections: only sensors can see the shot.
                            health: projectile_type.health,
                            projectile: Some(ProjectileFlight {
                                attacker_id: attacker.id,
                                attacker_entity_type_id: attacker.entity_type_id.clone(),
                                attacker_owner_player_id: attacker.owner_player_id.clone(),
                                damage: attack.damage,
                                remaining_distance: f64::from(projectile.max_travel_distance),
                                position: Some(flight_position(origin)),
                            }),
                            ..Default::default()
                        });
                    } else {
                        record_hit(&mut damage_by_target, target.id, attack.damage, attacker.id,
                            &attacker.entity_type_id, &attacker.owner_player_id, attack.attack_type);
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

        let (dead, destructions) = apply_damage(entities, damage_by_target);
        self.clear_destroyed(&dead);
        CombatTick {
            engagements,
            dead_entity_ids: dead,
            laser_shots,
            projectile_launches,
            dismantling,
            destructions,
        }
    }

    pub(crate) fn clear_destroyed(&mut self, dead: &[u64]) {
        if dead.is_empty() {
            return;
        }
        self.next_attack_tick.retain(|(id, _), _| !dead.contains(id));
        for id in dead {
            self.return_positions.remove(id);
        }
    }
}

/// Sweep existing flights against hulls moving between simulation samples,
/// then insert new shots at their recorded launch positions for the next tick.
pub(crate) fn advance_projectiles(
    entities: &mut Vec<Entity>,
    previous_entities: &[Entity],
    trails: &mut Vec<ProjectileTrail>,
    technologies: &PlayerTechnologies,
    content: &ContentPack,
    dt: f32,
    launches: Vec<Entity>,
) -> (Vec<u64>, Vec<CombatDestruction>) {
    let in_flight = entities.iter().any(|entity| entity.projectile.is_some());
    if dt <= 0.0 {
        return (Vec::new(), Vec::new());
    }

    // Reserve IDs still in authoritative or projected flight, including those
    // expiring this tick, so removal and a new launch never share an ID.
    let mut next_id = if launches.is_empty() {
        0
    } else {
        entities.iter().chain(previous_entities)
            .filter(|entity| entity.projectile.is_some())
            .map(|entity| entity.id)
            .chain(trails.iter().map(|trail| trail.projectile_id))
            .max()
            .unwrap_or(FIRST_PROJECTILE_ID - 1)
    };
    let dt = f64::from(dt);
    trails.retain_mut(|trail| {
        let (Some(position), Some(velocity)) = (trail.position, trail.velocity) else { return false; };
        let Some(step) = FlightStep::new(velocity, trail.remaining_distance, dt) else { return false; };
        trail.remaining_distance -= step.distance;
        trail.position = Some(step.end(position));
        trail.remaining_distance > 0.0
    });
    let outcome = if in_flight {
        sweep_projectiles(entities, previous_entities, trails, technologies, content, dt)
    } else {
        (Vec::new(), Vec::new())
    };
    entities.extend(launches.into_iter().map(|mut shot| {
        next_id += 1;
        shot.id = next_id;
        shot
    }));
    outcome
}

fn flight_position(pos: Vec2) -> FlightPosition {
    FlightPosition { x: f64::from(pos.x), y: f64::from(pos.y) }
}

fn projected_position(pos: FlightPosition) -> Vec2 {
    Vec2 { x: pos.x as f32, y: pos.y as f32 }
}

struct FlightStep {
    dx: f64,
    dy: f64,
    distance: f64,
    tick_fraction: f64,
}

impl FlightStep {
    fn new(velocity: Vec2, remaining: f64, dt: f64) -> Option<Self> {
        let (vx, vy) = (f64::from(velocity.x), f64::from(velocity.y));
        let full_step = vx.hypot(vy) * dt;
        if full_step <= 0.0 || remaining <= 0.0 {
            return None;
        }
        let distance = full_step.min(remaining);
        let tick_fraction = distance / full_step;
        Some(Self { dx: vx * dt * tick_fraction, dy: vy * dt * tick_fraction, distance, tick_fraction })
    }

    fn end(&self, start: FlightPosition) -> FlightPosition {
        FlightPosition { x: start.x + self.dx, y: start.y + self.dy }
    }
}

struct Motion {
    start: FlightPosition,
    dx: f64,
    dy: f64,
}

impl Motion {
    fn new(previous: Option<&Vec2>, current: Vec2) -> Self {
        let start = flight_position(previous.copied().unwrap_or(current));
        Self { start, dx: f64::from(current.x) - start.x, dy: f64::from(current.y) - start.y }
    }

    fn at(&self, fraction: f64) -> FlightPosition {
        FlightPosition { x: self.start.x + self.dx * fraction, y: self.start.y + self.dy * fraction }
    }
}

struct SweptHull {
    entity_index: usize,
    motion: Motion,
    radius: f64,
}

struct Contact {
    time: f64,
    shot: usize,
    hull: usize,
}

fn sweep_projectiles(
    entities: &mut Vec<Entity>,
    previous_entities: &[Entity],
    trails: &mut Vec<ProjectileTrail>,
    technologies: &PlayerTechnologies,
    content: &ContentPack,
    dt: f64,
) -> (Vec<u64>, Vec<CombatDestruction>) {
    let previous_positions: HashMap<_, _> = previous_entities.iter()
        .filter(|entity| !entity.owner_player_id.is_empty())
        .filter_map(|entity| entity.pos.map(|pos| (entity.id, pos)))
        .collect();
    let mut target_grid = SpatialIndex::new();
    let mut targets = Vec::new();
    let mut max_extent = 0.0_f64;
    for (index, entity) in entities.iter().enumerate() {
        let Some(pos) = entity.pos else { continue; };
        if entity.owner_player_id.is_empty() || entity.health <= 0.0 {
            continue;
        }
        let Some(definition) = content.get(&entity.entity_type_id) else { continue; };
        if definition.combat_targetable {
            let motion = Motion::new(previous_positions.get(&entity.id), pos);
            let radius = f64::from(definition.hull_radius.max(0.0));
            max_extent = max_extent.max(radius + motion.dx.hypot(motion.dy));
            target_grid.insert(targets.len(), pos.x, pos.y);
            targets.push(SweptHull { entity_index: index, motion, radius });
        }
    }

    let mut contacts = Vec::new();
    let mut expired = false;
    for index in 0..entities.len() {
        let shot = &entities[index];
        let Some(flight) = &shot.projectile else { continue; };
        let Some((start, step)) = flight.position.or_else(|| shot.pos.map(flight_position))
            .zip(shot.vel.and_then(|vel| FlightStep::new(vel, flight.remaining_distance, dt)))
        else {
            entities[index].health = 0.0;
            expired = true;
            continue;
        };
        let search_radius = step.distance * 0.5 + max_extent;
        let mut check = |hull_index: usize| {
            let hull = &targets[hull_index];
            let target = &entities[hull.entity_index];
            if target.owner_player_id == flight.attacker_owner_player_id {
                return;
            }
            // Clip hull movement at expiry, then sweep in the hull's frame.
            if let Some(entry) = segment_hit_fraction(
                hull.motion.start.x - start.x,
                hull.motion.start.y - start.y,
                step.dx - hull.motion.dx * step.tick_fraction,
                step.dy - hull.motion.dy * step.tick_fraction,
                hull.radius,
            ) {
                contacts.push(Contact { time: entry * step.tick_fraction, shot: index, hull: hull_index });
            }
        };
        if search_radius > f64::from(CELL_SIZE) {
            // Wide steps are cheaper to scan than to enumerate empty cells.
            (0..targets.len()).for_each(check);
        } else {
            target_grid.in_area(start.x + step.dx * 0.5, start.y + step.dy * 0.5, search_radius)
                .for_each(&mut check);
        }

        // Save the collision-free endpoint. If an impact occurs, this becomes
        // the first sample of the non-damaging trail for non-witnesses.
        let shot = &mut entities[index];
        let flight = shot.projectile.as_mut().unwrap();
        let end = step.end(start);
        flight.position = Some(end);
        flight.remaining_distance -= step.distance;
        shot.pos = Some(projected_position(end));
        expired |= flight.remaining_distance <= 0.0;
    }

    contacts.sort_unstable_by(|a, b| {
        a.time.total_cmp(&b.time)
            .then_with(|| entities[a.shot].id.cmp(&entities[b.shot].id))
            .then_with(|| entities[targets[a.hull].entity_index].id.cmp(&entities[targets[b.hull].entity_index].id))
    });
    let sensors = if contacts.is_empty() { Vec::new() } else {
        entities.iter().enumerate().filter_map(|(index, entity)| {
            if !is_player_owner(&entity.owner_player_id) || entity.health <= 0.0
                || entity.supply.as_ref().is_some_and(|supply| !supply.operational)
            {
                return None;
            }
            let range = sensor_range(entity, technologies, content);
            let pos = entity.pos?;
            (range.is_finite() && range > 0.0)
                .then(|| (index, Motion::new(previous_positions.get(&entity.id), pos), f64::from(range)))
        }).collect()
    };
    let mut dead = Vec::new();
    let mut destructions = Vec::new();
    for Contact { time, shot, hull } in contacts {
        let hull = &targets[hull];
        let target = &entities[hull.entity_index];
        // Earlier contacts can consume the shot or destroy the hull. In the
        // latter case the shot can still hit its next contact.
        if entities[shot].health <= 0.0 || target.health <= 0.0 {
            continue;
        }
        let target_pos = hull.motion.at(time);
        let target_range = f64::from(content.get(&target.entity_type_id)
            .and_then(|def| def.visibility_range).unwrap_or(0.0));
        let mut witnesses = BTreeSet::new();
        if is_player_owner(&target.owner_player_id) {
            witnesses.insert(target.owner_player_id.as_str());
        }
        for (index, motion, range) in &sensors {
            let sensor = &entities[*index];
            if sensor.health <= 0.0 || witnesses.contains(sensor.owner_player_id.as_str()) {
                continue;
            }
            let pos = motion.at(time);
            if (pos.x - target_pos.x).powi(2) + (pos.y - target_pos.y).powi(2) <= range.max(target_range).powi(2) {
                witnesses.insert(sensor.owner_player_id.as_str());
            }
        }
        let mut witnesses: Vec<_> = witnesses.into_iter().map(str::to_owned).collect();

        let projectile = &mut entities[shot];
        let flight = std::mem::take(projectile.projectile.as_mut().unwrap());
        let trail = (flight.remaining_distance > 0.0).then(|| ProjectileTrail {
            projectile_id: projectile.id,
            position: flight.position,
            velocity: projectile.vel,
            remaining_distance: flight.remaining_distance,
            impact_witnesses: Vec::new(),
            health: projectile.health,
        });
        projectile.health = 0.0;
        expired = true;

        let target = &mut entities[hull.entity_index];
        target.health = (target.health - flight.damage).max(0.0);
        let lethal = target.health <= 0.0;
        if let Some(mut trail) = trail {
            trail.impact_witnesses = if lethal { witnesses.clone() } else { std::mem::take(&mut witnesses) };
            trails.push(trail);
        }
        if lethal {
            dead.push(target.id);
            let mut victim = target.clone();
            victim.pos = Some(projected_position(target_pos));
            destructions.push(CombatDestruction {
                victim,
                attacker_id: flight.attacker_id,
                attacker_entity_type_id: flight.attacker_entity_type_id,
                attacker_owner_player_id: flight.attacker_owner_player_id,
                cause: AttackType::Kinetic,
                kinetic_witnesses: Some(witnesses),
            });
        }
    }

    if expired {
        entities.retain(|entity| entity.projectile.as_ref()
            .is_none_or(|flight| entity.health > 0.0 && flight.remaining_distance > 0.0));
    }
    (dead, destructions)
}

fn segment_hit_fraction(x: f64, y: f64, dx: f64, dy: f64, radius: f64) -> Option<f64> {
    let radius_sq = radius * radius;
    let outside_sq = x * x + y * y - radius_sq;
    if outside_sq <= 0.0 {
        return Some(0.0);
    }
    let projected = x * dx + y * dy;
    if projected <= 0.0 {
        return None;
    }
    let perpendicular = x * dy - y * dx;
    let discriminant = (dx * dx + dy * dy) * radius_sq - perpendicular * perpendicular;
    if discriminant < 0.0 {
        return None;
    }
    let entry = outside_sq / (projected + discriminant.sqrt());
    (entry <= 1.0).then_some(entry)
}

fn record_hit(
    hits: &mut HashMap<u64, DamageContribution>,
    target_id: u64,
    damage: f32,
    attacker_id: u64,
    attacker_type: &str,
    attacker_owner: &str,
    cause: AttackType,
) {
    use std::collections::hash_map::Entry;
    match hits.entry(target_id) {
        Entry::Vacant(entry) => {
            entry.insert(DamageContribution {
                total: damage,
                attacker_id,
                attacker_entity_type_id: attacker_type.to_string(),
                attacker_owner_player_id: attacker_owner.to_string(),
                cause,
                largest_hit: damage,
            });
        }
        Entry::Occupied(mut entry) => {
            let contribution = entry.get_mut();
            contribution.total += damage;
            if damage > contribution.largest_hit
                || (damage == contribution.largest_hit && attacker_id < contribution.attacker_id)
            {
                contribution.attacker_id = attacker_id;
                contribution.attacker_entity_type_id.clear();
                contribution.attacker_entity_type_id.push_str(attacker_type);
                contribution.attacker_owner_player_id.clear();
                contribution.attacker_owner_player_id.push_str(attacker_owner);
                contribution.cause = cause;
                contribution.largest_hit = damage;
            }
        }
    }
}

fn apply_damage(
    entities: &mut [Entity],
    mut hits: HashMap<u64, DamageContribution>,
) -> (Vec<u64>, Vec<CombatDestruction>) {
    let mut dead = Vec::new();
    let mut destructions = Vec::new();
    if !hits.is_empty() {
        for entity in entities {
            let Some(hit) = hits.remove(&entity.id) else { continue; };
            entity.health = (entity.health - hit.total).max(0.0);
            if entity.health <= 0.0 {
                dead.push(entity.id);
                destructions.push(CombatDestruction {
                    victim: entity.clone(),
                    attacker_id: hit.attacker_id,
                    attacker_entity_type_id: hit.attacker_entity_type_id,
                    attacker_owner_player_id: hit.attacker_owner_player_id,
                    cause: hit.cause,
                    kinetic_witnesses: None,
                });
            }
        }
    }
    (dead, destructions)
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
            resource_deposit: None,
            resources: None,
            projectile: None,
            id,
            entity_type_id: kind.to_string(),
            pos: Some(Vec2 { x, y: 0.0 }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: None,
            owner_player_id: owner.to_string(),
            health,
        }
    }

    fn packaged_content() -> ContentPack {
        ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        ).unwrap()
    }

    #[test]
    fn kinetic_shot_travels_past_firing_range_and_hits_the_first_hostile_once() {
        let pack = packaged_content();
        let mut combat = CombatSystem::default();
        let mut entities = vec![
            entity(1, "kinetic_fighter", "alice", 0.0, 80.0),
            entity(2, "worker", "bob", 801.0, 100.0),
        ];
        let moving = HashSet::from([1]);
        let fire = |combat: &mut CombatSystem, entities: &mut [Entity], tick| {
            combat.tick_with_ordered_movement(
                entities, &pack, tick, 0.25, &moving, &HashMap::new(),
                &HashSet::new(), &HashMap::new(), &moving, &HashSet::new(),
            )
        };
        assert!(fire(&mut combat, &mut entities, 0).projectile_launches.is_empty());
        entities[1].pos.as_mut().unwrap().x = 800.0;
        let fired = fire(&mut combat, &mut entities, 1);
        assert!(fired.laser_shots.is_empty());
        let mut trails = Vec::new();
        let technologies = PlayerTechnologies::new();
        advance_projectiles(&mut entities, &[], &mut trails, &technologies, &pack, 0.25, fired.projectile_launches);
        assert_eq!(entities[1].health, 100.0);
        let shot = &entities[2];
        assert_eq!(shot.pos.unwrap().x, 0.0);
        assert_eq!(shot.vel.unwrap().x, 1600.0);
        let shot_id = shot.id;

        // The aimed-at target leaves the flight path. The shot flies straight.
        entities[1].pos.as_mut().unwrap().y = 200.0;
        entities.extend([
            entity(4, "worker", "alice", 650.0, 100.0),
            entity(5, "worker", "bob", 1100.0, 100.0),
            entity(6, "worker", "bob", 1300.0, 100.0),
        ]);
        advance_projectiles(&mut entities, &[], &mut trails, &technologies, &pack, 0.25, Vec::new());
        assert_eq!(entities[2].pos.unwrap().x, 400.0);
        advance_projectiles(&mut entities, &[], &mut trails, &technologies, &pack, 1.0, Vec::new());
        assert!(entities.iter().all(|entity| entity.id != shot_id));
        assert_eq!(entities[1].health, 100.0);
        assert_eq!(entities[2].health, 100.0);
        assert_eq!(entities[3].health, 88.0);
        assert_eq!(entities[4].health, 100.0);
        advance_projectiles(&mut entities, &[], &mut trails, &technologies, &pack, 1.0, Vec::new());
        assert_eq!(entities[3].health, 88.0);
    }

    #[test]
    fn kinetic_sweep_hits_a_crossing_hull_only_before_expiry() {
        let pack = packaged_content();
        let mut entities = vec![
            entity(1, "kinetic_fighter", "alice", 0.0, 80.0),
            entity(2, "worker", "bob", 800.0, 12.0),
        ];
        let fired = CombatSystem::default().tick(&mut entities, &pack, 0, 1.0);
        let mut trails = Vec::new();
        let technologies = PlayerTechnologies::new();
        advance_projectiles(&mut entities, &[], &mut trails, &technologies, &pack, 1.0, fired.projectile_launches);

        for (crossing_x, expected_dead) in [(800.0, vec![2]), (1500.0, Vec::new())] {
            let mut before = entities.clone();
            before[1].pos = Some(Vec2 { x: crossing_x, y: -crossing_x });
            let mut after = before.clone();
            after[1].pos.as_mut().unwrap().y = 1600.0 - crossing_x;
            let (dead, destructions) = advance_projectiles(&mut after, &before, &mut trails, &technologies, &pack, 1.0, Vec::new());
            assert_eq!(dead, expected_dead);
            assert!(after.iter().all(|entity| entity.projectile.is_none()));
            if let Some(hit) = destructions.first() {
                assert_eq!(hit.cause, AttackType::Kinetic);
                assert_eq!(hit.attacker_id, 1);
            } else {
                assert_eq!(after[1].health, 12.0);
            }
        }
    }

    fn kinetic_shot(id: u64, attacker_id: u64, x: f32, remaining_distance: f64) -> Entity {
        let mut shot = entity(id, KINETIC_PROJECTILE_TYPE, "", x, 1.0);
        shot.vel = Some(Vec2 { x: 1600.0, y: 0.0 });
        shot.projectile = Some(ProjectileFlight {
            attacker_id,
            attacker_entity_type_id: "kinetic_fighter".into(),
            attacker_owner_player_id: "alice".into(),
            damage: 12.0,
            remaining_distance,
            position: shot.pos.map(flight_position),
        });
        shot
    }

    #[test]
    fn kinetic_contacts_resolve_in_tick_order_and_skip_destroyed_hulls() {
        let pack = packaged_content();
        // The late shot is stored first and has the lower ID. It must pass
        // the first hull once the other shot has destroyed it.
        let mut entities = vec![
            kinetic_shot(FIRST_PROJECTILE_ID, 11, 0.0, 1400.0),
            entity(1, "worker", "bob", 150.0, 12.0),
            kinetic_shot(FIRST_PROJECTILE_ID + 1, 22, 80.0, 1400.0),
            entity(2, "worker", "bob", 300.0, 12.0),
        ];
        let (dead, destructions) = advance_projectiles(
            &mut entities, &[], &mut Vec::new(), &PlayerTechnologies::new(), &pack, 0.25, Vec::new(),
        );
        assert_eq!(dead, vec![1, 2]);
        assert_eq!(destructions.iter().map(|hit| hit.attacker_id).collect::<Vec<_>>(), vec![22, 11]);
        assert!(entities.iter().all(|entity| entity.projectile.is_none()));
    }

    #[test]
    fn kinetic_impact_samples_both_the_victim_and_moving_sensors() {
        let pack = packaged_content();
        let before = vec![
            entity(1, "kinetic_fighter", "alice", 0.0, 80.0),
            entity(2, "worker", "bob", 990.0, 12.0),
            entity(3, "kinetic_fighter", "carol", 1800.0, 80.0),
            kinetic_shot(FIRST_PROJECTILE_ID, 1, 880.0, 520.0),
        ];
        let mut entities = before.clone();
        entities[1].pos.as_mut().unwrap().x = 1190.0;
        entities[2].pos.as_mut().unwrap().x = 2250.0;
        let mut trails = Vec::new();
        let (dead, destructions) = advance_projectiles(
            &mut entities, &before, &mut trails, &PlayerTechnologies::new(), &pack, 0.2, Vec::new(),
        );
        assert_eq!(dead, vec![2]);
        // Alice saw Bob at the previous sample but not at impact. Carol's
        // moving sensor saw the impact, even though it misses the end point.
        let witnesses = vec!["bob".to_string(), "carol".to_string()];
        assert_eq!(destructions[0].kinetic_witnesses.as_ref(), Some(&witnesses));
        assert_eq!(destructions[0].victim.pos.unwrap().x, 1090.0);
        assert_eq!(trails[0].impact_witnesses, witnesses);
        assert_eq!(projected_position(trails[0].position.unwrap()).x, 1200.0);
        assert!(entities.iter().all(|entity| entity.projectile.is_none()));

        advance_projectiles(&mut entities, &[], &mut trails, &PlayerTechnologies::new(), &pack, 0.05, Vec::new());
        assert_eq!(projected_position(trails[0].position.unwrap()).x, 1280.0);
        advance_projectiles(&mut entities, &[], &mut trails, &PlayerTechnologies::new(), &pack, 0.1, Vec::new());
        assert!(trails.is_empty());
    }

    #[test]
    fn kinetic_flight_survives_projection_rounding_and_checkpoint_restore() {
        use prost::Message;

        let pack = packaged_content();
        let origin = (1u64 << 31) as f32;
        let mut entities = vec![
            kinetic_shot(FIRST_PROJECTILE_ID, 1, origin, 1400.0),
            entity(2, "worker", "bob", origin + 512.0, 12.0),
        ];
        let mut trails = Vec::new();
        let technologies = PlayerTechnologies::new();
        let step = |entities: &mut Vec<Entity>, trails: &mut Vec<ProjectileTrail>| {
            advance_projectiles(entities, &[], trails, &technologies, &pack, 0.05, Vec::new()).0
        };
        assert!(step(&mut entities, &mut trails).is_empty());
        assert_eq!(entities[0].pos.unwrap().x, origin);
        let checkpoint = crate::pb::Snapshot { entities, ..Default::default() };
        let mut entities = crate::pb::Snapshot::decode(checkpoint.encode_to_vec().as_slice()).unwrap().entities;
        for _ in 0..4 {
            assert!(step(&mut entities, &mut trails).is_empty());
        }
        assert_eq!(step(&mut entities, &mut trails), vec![2]);
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
            projectile_trails: Vec::new(),
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
            projectile_trails: Vec::new(),
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
            projectile_trails: Vec::new(),
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
        let mut state = GameState { discovered_entities: Default::default(), generation: Default::default(), tick: 0, technologies: HashMap::new(), projectile_trails: Vec::new(), entities: vec![
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
