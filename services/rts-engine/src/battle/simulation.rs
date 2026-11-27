use std::collections::HashMap;
use std::sync::Arc;

use anyhow::{ensure, Result};
use serde::Serialize;

use super::draft::{Bounds, Team, MAX_UNITS};
use crate::combat::{self, ClampedMove, CombatDestruction, CombatRect, CombatSystem, ShotEnd};
use crate::config::GameConfig;
use crate::content::{AttackType, ContentPack};
use crate::pb::{Entity, Vec2};

pub(super) const MAX_TICKS: u32 = 2_400;
const MAX_SHOTS: usize = 256;
pub(super) const MAX_REPLAY_BYTES: usize = 12 * 1024 * 1024;
const PAGE_BYTES: usize = 256 * 1024 - 128;
const PAGE_FRAMES: usize = 64;
const SHOT_FLAG: u64 = 1 << 63;

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub(super) enum Outcome { A, B, Draw, TickLimit }

#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
enum Event {
    Laser { attacker: u64, target: u64, from: [f32; 2], to: [f32; 2] },
    Launch { shot: u64, attacker: u64, x: f32, y: f32, vx: f32, vy: f32 },
    ShotEnd { shot: u64, reason: &'static str, target: Option<u64>, x: f64, y: f64, fraction: f64 },
    Casualty { victim: u64, attacker: u64, cause: AttackType, x: f32, y: f32, fraction: f64 },
}

/// (Hull ID, post-pursuit start, integrated stop, moving fraction).
#[derive(Serialize)]
struct HullMotion(u64, [f32; 2], [f32; 2], f64);

#[derive(Serialize)]
struct Frame<'a> {
    tick: u32,
    // Small numeric IDs never encode the reserved high bit on the wire.
    hulls: Vec<(u64, f32, f32, f32)>,
    shots: Vec<(u64, f32, f32)>,
    #[serde(skip_serializing_if = "<[HullMotion]>::is_empty")]
    hull_motion: &'a [HullMotion],
    events: &'a [Event],
}

pub(super) struct Replay {
    pub(super) tps: u32,
    pub(super) last_tick: u32,
    pub(super) outcome: Outcome,
    pub(super) pages: Vec<Arc<Box<[u8]>>>,
    pub(super) bytes: usize,
}

#[derive(Default)]
struct Capture {
    pages: Vec<Arc<Box<[u8]>>>,
    page: Vec<u8>,
    frame: Vec<u8>,
    frames: usize,
    bytes: usize,
}

impl Capture {
    fn flush(&mut self) {
        if self.frames == 0 { return; }
        self.page.push(b']');
        self.bytes += self.page.len();
        self.pages.push(Arc::new(std::mem::take(&mut self.page).into_boxed_slice()));
        self.frames = 0;
    }

    fn push(&mut self, tick: u32, entities: &[Entity], events: &[Event], hull_motion: &[HullMotion]) -> Result<()> {
        let mut frame = Frame { tick, hulls: Vec::new(), shots: Vec::new(), hull_motion, events };
        for e in entities {
            let p = e.pos.unwrap_or_default();
            if e.projectile.is_some() {
                frame.shots.push((e.id & !SHOT_FLAG, p.x, p.y));
            } else {
                frame.hulls.push((e.id, p.x, p.y, e.health));
            }
        }
        self.frame.clear();
        serde_json::to_writer(&mut self.frame, &frame)?;
        ensure!(self.frame.len() + 2 <= PAGE_BYTES, "One replay tick exceeded the replay page limit.");
        if self.frames == PAGE_FRAMES || self.page.len() + self.frame.len() + 2 > PAGE_BYTES {
            self.flush();
        }
        ensure!(self.bytes + self.page.len() + self.frame.len() + 2 <= MAX_REPLAY_BYTES,
            "Replay exceeded 12 MiB. Reduce units, firing rate, or projectile travel.");
        self.page.push(if self.frames == 0 { b'[' } else { b',' });
        self.page.extend_from_slice(&self.frame);
        self.frames += 1;
        Ok(())
    }

    fn finish(mut self, tps: u32, last_tick: u32, outcome: Outcome) -> Replay {
        self.flush();
        Replay { tps, last_tick, outcome, pages: self.pages, bytes: self.bytes }
    }
}

fn inset(arena: CombatRect, r: f32) -> CombatRect {
    // Round the permitted center position inward, not the hull through the wall.
    fn representable(n: f64) -> f64 {
        let f = n as f32;
        f64::from(if f64::from(f) > n { f.next_down() } else { f })
    }
    CombatRect { x: representable(arena.x - f64::from(r)), y: representable(arena.y - f64::from(r)) }
}

fn contain(entity: &mut Entity, start: Vec2, rect: CombatRect) -> Option<ClampedMove> {
    let end = entity.pos.as_mut().unwrap();
    let x = f64::from(start.x);
    let y = f64::from(start.y);
    let dx = f64::from(end.x) - x;
    let dy = f64::from(end.y) - y;
    let fraction = rect.exit((x, y), (dx, dy));
    if fraction > 1.0 { return None; }
    end.x = (x + dx * fraction).clamp(-rect.x, rect.x) as f32;
    end.y = (y + dy * fraction).clamp(-rect.y, rect.y) as f32;
    entity.vel = Some(Vec2::default());
    Some(ClampedMove { start, stop: *end, fraction })
}

fn casualty(death: CombatDestruction) -> Event {
    let pos = death.victim.pos.unwrap_or_default();
    Event::Casualty {
        victim: death.victim.id, attacker: death.attacker_id, cause: death.cause,
        x: pos.x, y: pos.y, fraction: death.impact.map_or(0.0, |impact| impact.fraction),
    }
}

pub(super) fn simulate(pack: &ContentPack, bounds: Bounds, entities: Vec<Entity>, cfg: &GameConfig) -> Result<Replay> {
    let mut capture = Capture::default();
    let mut battle = Battle::new(pack, bounds, entities, cfg);
    capture.push(0, &battle.entities, &[], &[])?;
    for tick in 1..=MAX_TICKS {
        battle.step(tick)?;
        capture.push(tick, &battle.entities, &battle.events, &battle.hull_motion)?;
        if let Some(outcome) = battle.outcome() {
            return Ok(capture.finish(cfg.tps, tick, outcome));
        }
    }
    Ok(capture.finish(cfg.tps, MAX_TICKS, Outcome::TickLimit))
}

pub(crate) struct Battle<'a> {
    pack: &'a ContentPack,
    arena: CombatRect,
    hull_bounds: [CombatRect; MAX_UNITS],
    dt: f32,
    friction: f32,
    combat: CombatSystem,
    sequence: u64,
    pub(crate) entities: Vec<Entity>,
    starts: HashMap<u64, Vec2>,
    clamped: HashMap<u64, ClampedMove>,
    hull_motion: Vec<HullMotion>,
    events: Vec<Event>,
}

impl<'a> Battle<'a> {
    pub(crate) fn new(pack: &'a ContentPack, bounds: Bounds, entities: Vec<Entity>, cfg: &GameConfig) -> Self {
        let arena = bounds.rect();
        let mut hull_bounds = [arena; MAX_UNITS];
        for entity in &entities {
            let radius = pack.get(&entity.entity_type_id).expect("validated unit").hull_radius;
            hull_bounds[entity.id as usize - 1] = inset(arena, radius);
        }
        Self { pack, arena, hull_bounds, dt: 1.0 / cfg.tps as f32, friction: cfg.friction, combat: CombatSystem::default(),
            sequence: 0, entities, starts: HashMap::new(), clamped: HashMap::new(), hull_motion: Vec::new(), events: Vec::new() }
    }

    #[cfg(test)]
    pub(crate) fn events_json(&self) -> serde_json::Value {
        serde_json::to_value(&self.events).unwrap()
    }

    pub(crate) fn step(&mut self, replay_tick: u32) -> Result<()> {
        self.events.clear();
        self.starts.clear();
        self.clamped.clear();
        self.hull_motion.clear();
        let mut before = [Vec2::default(); MAX_UNITS];
        for e in self.entities.iter().take_while(|e| e.projectile.is_none()) {
            before[e.id as usize - 1] = e.pos.unwrap();
        }
        // Frame 0 is the pre-Go setup; production's first combat tick is numbered 0.
        let combat = self.combat.tick(&mut self.entities, self.pack, u64::from(replay_tick - 1), self.dt);
        self.events.extend(combat.laser_shots.into_iter().map(|s| Event::Laser {
            attacker: s.attacker_id, target: s.target_id, from: [s.origin.x, s.origin.y], to: [s.target.x, s.target.y],
        }));
        for mut death in combat.destructions {
            let i = death.victim.id as usize - 1;
            // Instant damage is attributed by production after any pursuit snap.
            contain(&mut death.victim, before[i], self.hull_bounds[i]);
            self.events.push(casualty(death));
        }
        self.entities.retain(|e| e.health > 0.0);
        for e in self.entities.iter_mut().take_while(|e| e.projectile.is_none()) {
            // Production pursuit can snap into firing range before physics. A
            // snap is still instantaneous here, but cannot cross the inset wall.
            let i = e.id as usize - 1;
            contain(e, before[i], self.hull_bounds[i]);
            self.starts.insert(e.id, e.pos.unwrap());
        }
        crate::physics::integrate_entities(self.friction, &mut self.entities, self.dt);
        for e in self.entities.iter_mut().take_while(|e| e.projectile.is_none()) {
            let i = e.id as usize - 1;
            let start = self.starts[&e.id];
            let mut fraction = 1.0;
            if let Some(clamped) = contain(e, start, self.hull_bounds[i]) {
                fraction = clamped.fraction;
                self.clamped.insert(e.id, clamped);
            }
            // Record before the sweep, which can replace a casualty's pose with
            // its impact position. Ordinary paths use the two frame poses; a
            // hull already pinned at the wall needs no repeated override.
            let stop = e.pos.unwrap();
            if (fraction < 1.0 && start != stop) || start != before[i] {
                self.hull_motion.push(HullMotion(e.id, [start.x, start.y], [stop.x, stop.y], fraction));
            }
        }
        let hulls = self.starts.len();
        let mut active = self.entities.len() - hulls;
        if active != 0 {
            let result = combat::advance_bounded_projectiles(&mut self.entities, &self.starts, &self.clamped, self.pack, self.dt, self.arena,
                |shot, impact, end| {
                    let (reason, target) = match end {
                        ShotEnd::Contact(id) => ("contact", Some(id)), ShotEnd::Range => ("range", None), ShotEnd::Wall => ("wall", None),
                    };
                    active -= 1;
                    self.events.push(Event::ShotEnd { shot: shot & !SHOT_FLAG, reason, target,
                        x: impact.position.0, y: impact.position.1, fraction: impact.fraction });
                });
            let dead: Vec<_> = result.destructions.iter().map(|d| d.victim.id).collect();
            self.combat.forget_destroyed(&dead);
            self.events.extend(result.destructions.into_iter().map(casualty));
            self.entities.retain(|e| e.health > 0.0);
        }
        for mut shot in combat.projectile_spawns {
            shot.id = SHOT_FLAG | self.sequence;
            let p = shot.pos.unwrap();
            let v = shot.vel.unwrap();
            self.events.push(Event::Launch { shot: self.sequence, attacker: shot.projectile.as_ref().unwrap().attacker_id,
                x: p.x, y: p.y, vx: v.x, vy: v.y });
            if self.arena.exit((f64::from(p.x), f64::from(p.y)), (f64::from(v.x), f64::from(v.y))) == 0.0 {
                self.events.push(Event::ShotEnd { shot: self.sequence, reason: "wall", target: None,
                    x: f64::from(p.x), y: f64::from(p.y), fraction: 1.0 });
            } else {
                active += 1;
                ensure!(active <= MAX_SHOTS, "More than {MAX_SHOTS} shots in flight. Increase cooldowns or reduce kinetic units.");
                self.entities.push(shot);
            }
            self.sequence += 1;
        }
        Ok(())
    }

    fn outcome(&self) -> Option<Outcome> {
        if self.entities.last().is_some_and(|e| e.projectile.is_some()) { return None; }
        let (mut a, mut b) = (false, false);
        for e in &self.entities {
            a |= e.owner_player_id == Team::A.owner();
            b |= e.owner_player_id == Team::B.owner();
        }
        match (a, b) { (true, true) => None, (true, false) => Some(Outcome::A), (false, true) => Some(Outcome::B), (false, false) => Some(Outcome::Draw) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn unit(id: u64, kind: &str, team: Team, x: f32, health: f32) -> Entity {
        Entity { id, entity_type_id: kind.into(), owner_player_id: team.owner().into(),
            health, pos: Some(Vec2 { x, y: 0.0 }), ..Default::default() }
    }

    #[test]
    fn run_waits_for_the_eliminated_teams_shot_and_replays_deterministically() {
        let pack = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let bounds = Bounds { width: 12_000.0, height: 8_000.0 };
        let cfg = GameConfig::default();
        let duel = vec![
            unit(1, "kinetic_fighter", Team::A, -125.0, 1.0),
            unit(2, "fighter_v1", Team::B, 125.0, 20.0),
        ];
        let distant = vec![
            unit(1, "fighter_v1", Team::A, -3_000.0, 60.0),
            unit(2, "fighter_v1", Team::B, 3_000.0, 60.0),
        ];
        let first = simulate(&pack, bounds, duel.clone(), &cfg).unwrap();
        let second = std::thread::scope(|scope| {
            let unrelated = scope.spawn(|| simulate(&pack, bounds, distant, &cfg).unwrap());
            let same = simulate(&pack, bounds, duel, &cfg).unwrap();
            let unrelated = unrelated.join().unwrap();
            assert_eq!(unrelated.last_tick, MAX_TICKS);
            assert_eq!(unrelated.outcome, Outcome::TickLimit);
            same
        });
        assert_eq!(first.outcome, Outcome::Draw);
        assert!(first.last_tick > 1);
        assert_eq!(first.last_tick, second.last_tick);
        assert_eq!(first.outcome, second.outcome);
        assert_eq!(first.pages, second.pages);
        let page: serde_json::Value = serde_json::from_slice(&first.pages[0]).unwrap();
        assert_eq!(page[1]["hulls"][0][0], 2);
        assert_eq!(page[1]["shots"].as_array().unwrap().len(), 1);
        assert!(page[first.last_tick as usize]["hulls"].as_array().unwrap().is_empty());
    }

    #[test]
    fn high_rate_kinetic_draft_fails_instead_of_dropping_shots() {
        let mut pack = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        pack.entity_types.get_mut("kinetic_fighter").unwrap().combat.as_mut().unwrap().attacks[0].cooldown_ticks = 1;
        let entities = (1..=64).map(|id| {
            let (team, x) = if id <= 32 { (Team::A, -5_000.0) } else { (Team::B, 5_000.0) };
            unit(id, "kinetic_fighter", team, x, 80.0)
        }).collect();
        let result = simulate(&pack, Bounds { width: 20_000.0, height: 8_000.0 }, entities, &GameConfig::default());
        assert!(result.err().expect("shot overflow must fail the run").to_string().contains("256 shots in flight"));
    }

    #[test]
    fn hull_stops_at_first_inset_wall_instead_of_sliding_or_bouncing() {
        let start = Vec2 { x: 30.0, y: 20.0 };
        let mut entity = Entity { pos: Some(Vec2 { x: 50.0, y: 0.0 }),
            vel: Some(Vec2 { x: 20.0, y: -20.0 }), ..Default::default() };
        let clamped = contain(&mut entity, start, inset(CombatRect { x: 50.0, y: 50.0 }, 10.0)).unwrap();
        assert_eq!(clamped.fraction, 0.5);
        assert_eq!(clamped.stop, Vec2 { x: 40.0, y: 10.0 });
        assert_eq!(entity.vel, Some(Vec2::default()));
    }

    #[test]
    fn replay_records_the_wall_stop_before_a_nonlethal_kinetic_hit() {
        let mut pack = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        pack.entity_types.get_mut("fighter_v1").unwrap().combat.as_mut().unwrap().on_near_enemy_strategy =
            crate::content::NearEnemyStrategy::Flee;
        pack.entity_types.get_mut("kinetic_fighter").unwrap().combat.as_mut().unwrap()
            .attacks[0].projectile.as_mut().unwrap().error_radians = 0.0;
        let entities = vec![
            unit(1, "kinetic_fighter", Team::A, 18.0, 80.0),
            unit(2, "fighter_v1", Team::B, 137.0, 200.0),
        ];
        let cfg = GameConfig { tps: 37, ..GameConfig::default() };
        let replay = simulate(&pack, Bounds { width: 500.0, height: 500.0 }, entities, &cfg).unwrap();
        let frames: serde_json::Value = serde_json::from_slice(&replay.pages[0]).unwrap();
        assert!(frames[1].get("hull_motion").is_none()); // Full-step movement.
        let frame = &frames[2];
        let motion = &frame["hull_motion"][0];
        let stop_fraction = motion[3].as_f64().unwrap();
        assert_eq!(motion[0], 2);
        assert_eq!(motion[1][0], frames[1]["hulls"][1][1]);
        assert_eq!(motion[2][0].as_f64(), Some(150.0));
        let contact = frame["events"].as_array().unwrap().iter().find(|e| e["reason"] == "contact").unwrap();
        assert!(stop_fraction > 0.0 && stop_fraction < contact["fraction"].as_f64().unwrap());
        assert!((contact["x"].as_f64().unwrap() - 50.0).abs() < 1e-6);
        assert_eq!(contact["target"], 2);
        assert_eq!(frame["hulls"][1][3].as_f64(), Some(100.0));
    }

    #[test]
    fn replay_records_a_pursuit_snap_before_integration() {
        let pack = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let entities = vec![
            unit(1, "fighter_v1", Team::A, 0.0, 60.0),
            unit(2, "fighter_v1", Team::B, 305.0, 60.0),
        ];
        let replay = simulate(&pack, Bounds { width: 1_000.0, height: 500.0 }, entities, &GameConfig::default()).unwrap();
        let frames: serde_json::Value = serde_json::from_slice(&replay.pages[0]).unwrap();
        assert_eq!(frames[0]["hulls"][0][1].as_f64(), Some(0.0));
        assert_eq!(frames[1]["hull_motion"][0], serde_json::json!([1, [5.0, 0.0], [5.0, 0.0], 1.0]));
    }

    #[test]
    fn instant_casualty_after_a_pursuit_snap_is_recorded_inside_the_wall() {
        let mut pack = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        pack.entity_types.get_mut("fighter_v1").unwrap().combat.as_mut().unwrap().attacks[0].range = 1.0;
        let entities = vec![
            unit(1, "fighter_v1", Team::A, 150.0, 1.0),
            unit(2, "worker", Team::B, 160.0, 200.0),
        ];
        let mut battle = Battle::new(&pack, Bounds { width: 500.0, height: 500.0 }, entities, &GameConfig::default());
        battle.step(1).unwrap();
        let death = battle.events.iter().find(|e| matches!(e, Event::Casualty { victim: 1, .. })).unwrap();
        assert!(matches!(death, Event::Casualty {
            attacker: 2, cause: AttackType::Dismantle, x: 150.0, y: 0.0, fraction: 0.0, ..
        }));
    }
}
