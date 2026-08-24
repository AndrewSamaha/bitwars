//! Sandboxed Lua behavior for the first neutral NPC: the raider.

use std::collections::{HashMap, HashSet};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

use anyhow::{Context, Result};
use mlua::{Error as LuaError, HookTriggers, Lua, Table, VmState};

use crate::content::ContentPack;
use crate::pb::{Entity, Vec2};
use crate::spawn_config::NEUTRAL_OWNER;

const RAIDER_TYPE: &str = "raider";
const STAR_TYPE: &str = "star_yellow";
const SPAWN_INTERVAL_SECS: u64 = 4 * 60;
const ORBIT_CLEARANCE: f32 = 100.0;
const MAX_SCRIPT_BYTES: usize = 128 * 1024;
const MAX_SCRIPT_HOOKS: usize = 20;
const INSTRUCTIONS_PER_HOOK: u32 = 1_000;

pub struct NpcCommands {
    pub scripted_entity_ids: HashSet<u64>,
    pub target_by_entity: HashMap<u64, u64>,
}

pub struct RaiderScript {
    lua: Lua,
    hook_count: Arc<AtomicUsize>,
}

impl RaiderScript {
    pub fn new() -> Result<Self> {
        let lua = Lua::new(); // safe stdlib only: no filesystem, OS, network, or debug APIs
        lua.set_memory_limit(MAX_SCRIPT_BYTES)?;
        let hook_count = Arc::new(AtomicUsize::new(0));
        let hook_counter = Arc::clone(&hook_count);
        lua.set_hook(
            HookTriggers::new().every_nth_instruction(INSTRUCTIONS_PER_HOOK),
            move |_, _| {
                if hook_counter.fetch_add(1, Ordering::Relaxed) >= MAX_SCRIPT_HOOKS {
                    Err(LuaError::RuntimeError(
                        "raider script instruction limit exceeded".into(),
                    ))
                } else {
                    Ok(VmState::Continue)
                }
            },
        );
        lua.load(include_str!("../scripts/raider.lua"))
            .exec()
            .context("failed to load raider Lua script")?;
        Ok(Self { lua, hook_count })
    }

    pub fn tick(
        &self,
        entities: &mut Vec<Entity>,
        content: &ContentPack,
        tick: u64,
        ticks_per_second: u32,
    ) -> Result<NpcCommands> {
        self.spawn_raider(entities, content, tick, ticks_per_second);

        let player_targets: Vec<(u64, f32, f32)> = entities
            .iter()
            .filter_map(|entity| {
                let pos = entity.pos.as_ref()?;
                (entity.owner_player_id != NEUTRAL_OWNER
                    && !entity.owner_player_id.is_empty()
                    && entity.health > 0.0
                    && content
                        .get(&entity.entity_type_id)
                        .is_some_and(|def| def.combat_targetable))
                .then_some((entity.id, pos.x, pos.y))
            })
            .collect();
        let stars: Vec<(u64, f32, f32, f32)> = entities
            .iter()
            .filter_map(|entity| {
                let pos = entity.pos.as_ref()?;
                (entity.entity_type_id == STAR_TYPE).then_some((
                    entity.id,
                    pos.x,
                    pos.y,
                    content
                        .get(STAR_TYPE)
                        .map(|def| {
                            def.radiation_sources
                                .iter()
                                .map(|source| source.max_effective_distance)
                                .fold(0.0, f32::max)
                        })
                        .unwrap_or(0.0),
                ))
            })
            .collect();

        let mut commands = NpcCommands {
            scripted_entity_ids: HashSet::new(),
            target_by_entity: HashMap::new(),
        };
        for entity in entities.iter_mut().filter(|entity| {
            entity.entity_type_id == RAIDER_TYPE
                && entity.owner_player_id == NEUTRAL_OWNER
                && entity.health > 0.0
        }) {
            let Some(position) = entity.pos.as_ref() else {
                continue;
            };
            let definition = content.get(RAIDER_TYPE);
            let speed = definition.map(|def| def.speed.max(0.0)).unwrap_or(0.0);
            let acquisition_range = definition
                .and_then(|def| def.combat.as_ref())
                .map(|combat| combat.acquisition_range.max(0.0))
                .unwrap_or(0.0);
            let star = stars.iter().min_by(|a, b| {
                distance_sq(position.x, position.y, a.1, a.2)
                    .partial_cmp(&distance_sq(position.x, position.y, b.1, b.2))
                    .unwrap_or(std::cmp::Ordering::Equal)
                    .then_with(|| a.0.cmp(&b.0))
            });
            let nearby_targets: Vec<_> = player_targets
                .iter()
                .copied()
                .filter(|(_, target_x, target_y)| {
                    distance_sq(position.x, position.y, *target_x, *target_y)
                        <= acquisition_range * acquisition_range
                })
                .collect();
            self.hook_count.store(0, Ordering::Relaxed);
            let result = self.call(
                position.x,
                position.y,
                speed,
                star.map(|star| (star.1, star.2, star.3 + ORBIT_CLEARANCE)),
                &nearby_targets,
            )?;
            commands.scripted_entity_ids.insert(entity.id);
            if let Some(target_id) = result.target_id {
                commands.target_by_entity.insert(entity.id, target_id);
            } else {
                let velocity = entity.vel.get_or_insert(Vec2 { x: 0.0, y: 0.0 });
                velocity.x = result.vx;
                velocity.y = result.vy;
            }
        }
        Ok(commands)
    }

    fn call(
        &self,
        x: f32,
        y: f32,
        speed: f32,
        star: Option<(f32, f32, f32)>,
        targets: &[(u64, f32, f32)],
    ) -> Result<ScriptResult> {
        let ctx = self.lua.create_table()?;
        ctx.set("x", x)?;
        ctx.set("y", y)?;
        ctx.set("speed", speed)?;
        ctx.set("orbit_radius", star.map(|star| star.2).unwrap_or(0.0))?;
        if let Some((star_x, star_y, _)) = star {
            let star_table = self.lua.create_table()?;
            star_table.set("x", star_x)?;
            star_table.set("y", star_y)?;
            ctx.set("star", star_table)?;
        }
        let target_table = self.lua.create_table()?;
        for (index, (id, target_x, target_y)) in targets.iter().enumerate() {
            let target = self.lua.create_table()?;
            target.set("id", *id)?;
            target.set("x", *target_x)?;
            target.set("y", *target_y)?;
            target_table.set(index + 1, target)?;
        }
        ctx.set("targets", target_table)?;
        let tick = self.lua.globals().get::<mlua::Function>("tick")?;
        let result: Table = tick.call(ctx)?;
        Ok(ScriptResult {
            target_id: result.get("target_id").ok(),
            vx: result.get("vx").unwrap_or(0.0),
            vy: result.get("vy").unwrap_or(0.0),
        })
    }

    fn spawn_raider(
        &self,
        entities: &mut Vec<Entity>,
        content: &ContentPack,
        tick: u64,
        ticks_per_second: u32,
    ) {
        let interval = SPAWN_INTERVAL_SECS.saturating_mul(u64::from(ticks_per_second.max(1)));
        if tick == 0 || tick % interval != 0 || content.get(RAIDER_TYPE).is_none() {
            return;
        }
        let id = entities
            .iter()
            .map(|entity| entity.id)
            .max()
            .unwrap_or(0)
            .saturating_add(1);
        let health = content
            .get(RAIDER_TYPE)
            .map(|def| def.health.max(0.0))
            .unwrap_or(0.0);
        entities.push(Entity {
            id,
            entity_type_id: RAIDER_TYPE.into(),
            pos: Some(Vec2 { x: 0.0, y: 0.0 }),
            vel: Some(Vec2 { x: 0.0, y: 0.0 }),
            force: Some(Vec2 { x: 0.0, y: 0.0 }),
            owner_player_id: NEUTRAL_OWNER.into(),
            health,
        });
    }
}

struct ScriptResult {
    target_id: Option<u64>,
    vx: f32,
    vy: f32,
}

fn distance_sq(ax: f32, ay: f32, bx: f32, by: f32) -> f32 {
    let dx = ax - bx;
    let dy = ay - by;
    dx * dx + dy * dy
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    fn entity(id: u64, entity_type_id: &str, owner: &str, x: f32, y: f32) -> Entity {
        Entity {
            id,
            entity_type_id: entity_type_id.into(),
            pos: Some(Vec2 { x, y }),
            vel: None,
            force: None,
            owner_player_id: owner.into(),
            health: 100.0,
        }
    }

    #[test]
    fn raider_script_spawns_orbits_and_targets_players() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::new().unwrap();
        let mut entities = vec![
            entity(1, STAR_TYPE, NEUTRAL_OWNER, 0.0, 0.0),
            entity(2, RAIDER_TYPE, NEUTRAL_OWNER, 1300.0, 0.0),
        ];
        let commands = script.tick(&mut entities, &content, 1, 60).unwrap();
        assert!(commands.target_by_entity.is_empty());
        assert!(entities[1].vel.as_ref().unwrap().y.abs() > 0.0);

        entities.push(entity(3, "worker", "player-1", 1400.0, 0.0));
        let commands = script.tick(&mut entities, &content, 2, 60).unwrap();
        assert_eq!(commands.target_by_entity.get(&2), Some(&3));

        script
            .tick(&mut entities, &content, SPAWN_INTERVAL_SECS * 60, 60)
            .unwrap();
        assert!(entities.iter().any(|entity| entity.id == 4
            && entity.entity_type_id == RAIDER_TYPE
            && entity
                .pos
                .as_ref()
                .is_some_and(|pos| pos.x == 0.0 && pos.y == 0.0)));
    }
}
