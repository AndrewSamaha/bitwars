//! Sandboxed Lua behavior for the raider NPC faction.

use std::collections::{HashMap, HashSet};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

use anyhow::{Context, Result};
use mlua::{Error as LuaError, Function, HookTriggers, Lua, RegistryKey, Table, VmState};

use crate::content::ContentPack;
use crate::pb::{Entity, Vec2};
use crate::spawn_config::{is_player_owner, RAIDERS_OWNER, UNIVERSE_OWNER};

const RAIDER_TYPE: &str = "raider";
const STAR_TYPE: &str = "star_yellow";
const SPAWN_INTERVAL_SECS: u64 = 150;
const ORBIT_CLEARANCE: f32 = 100.0;
// The universe map currently has 400 landmarks; its first world_tick needs room
// for the read-only context and the script's retained waypoint list.
const MAX_SCRIPT_BYTES: usize = 512 * 1024;
const MAX_SCRIPT_HOOKS: usize = 20;
const INSTRUCTIONS_PER_HOOK: u32 = 1_000;

pub struct NpcCommands {
    pub scripted_entity_ids: HashSet<u64>,
    pub target_by_entity: HashMap<u64, u64>,
}

struct ScriptTarget {
    id: u64,
    owner_id: String,
    entity_type_id: String,
    x: f32,
    y: f32,
    health: f32,
}

pub struct RaiderScript {
    lua: Lua,
    hook_count: Arc<AtomicUsize>,
    /// State owned by the raider scripting owner, shared by all of its entities.
    shared: RegistryKey,
    /// State owned by each raider, keyed by entity ID.
    private_by_entity: RegistryKey,
}

impl RaiderScript {
    pub fn debug_snapshot(&self, tick: u64) -> Result<serde_json::Value> {
        Ok(crate::script_debug::snapshot(
            RAIDERS_OWNER, tick,
            self.lua.registry_value::<Table>(&self.shared)?,
            self.lua.registry_value::<Table>(&self.private_by_entity)?,
        ))
    }

    pub fn new() -> Result<Self> {
        Self::from_source(include_str!("../scripts/raider.lua"))
    }

    fn from_source(source: &str) -> Result<Self> {
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
        lua.load(source)
            .exec()
            .context("failed to load raider Lua script")?;
        Ok(Self {
            shared: lua.create_registry_value(lua.create_table()?)?,
            private_by_entity: lua.create_registry_value(lua.create_table()?)?,
            lua,
            hook_count,
        })
    }

    pub fn tick(
        &self,
        entities: &mut Vec<Entity>,
        content: &ContentPack,
        tick: u64,
        ticks_per_second: u32,
    ) -> Result<NpcCommands> {
        self.spawn_raider(entities, content, tick, ticks_per_second);

        let player_targets: Vec<ScriptTarget> = entities
            .iter()
            .filter_map(|entity| {
                let pos = entity.pos.as_ref()?;
                (is_player_owner(&entity.owner_player_id)
                    && entity.health > 0.0
                    && content
                        .get(&entity.entity_type_id)
                        .is_some_and(|def| def.combat_targetable))
                .then_some(ScriptTarget {
                    id: entity.id,
                    owner_id: entity.owner_player_id.clone(),
                    entity_type_id: entity.entity_type_id.clone(),
                    x: pos.x,
                    y: pos.y,
                    health: entity.health,
                })
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
        let world_entities = world_entities(entities, content);
        self.call_world_tick(tick, ticks_per_second, &world_entities)?;

        let mut commands = NpcCommands {
            scripted_entity_ids: HashSet::new(),
            target_by_entity: HashMap::new(),
        };
        for entity in entities.iter_mut().filter(|entity| {
            entity.entity_type_id == RAIDER_TYPE
                && entity.owner_player_id == RAIDERS_OWNER
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
                .filter(|target| {
                    distance_sq(position.x, position.y, target.x, target.y)
                        <= acquisition_range * acquisition_range
                })
                .collect();
            self.hook_count.store(0, Ordering::Relaxed);
            let result = self.call(
                entity,
                speed,
                star.map(|star| (star.1, star.2, star.3 + ORBIT_CLEARANCE)),
                &nearby_targets,
                tick,
                ticks_per_second,
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
        self.remove_stale_private_state(entities)?;
        Ok(commands)
    }

    fn call_world_tick(
        &self,
        tick: u64,
        ticks_per_second: u32,
        entities: &[(u64, String, String, f32, f32, f32, f32)],
    ) -> Result<()> {
        let Some(world_tick) = self.lua.globals().get::<Option<Function>>("world_tick")? else {
            return Ok(());
        };
        let ctx = self.lua.create_table()?;
        ctx.set("owner_id", RAIDERS_OWNER)?;
        ctx.set("tick", tick)?;
        ctx.set("ticks_per_second", ticks_per_second)?;
        ctx.set("shared", self.lua.registry_value::<Table>(&self.shared)?)?;
        ctx.set("entities", lua_entities_table(&self.lua, entities)?)?;
        self.hook_count.store(0, Ordering::Relaxed);
        world_tick.call::<()>(ctx)?;
        self.lua.gc_collect()?;
        Ok(())
    }

    fn call(
        &self,
        entity: &Entity,
        speed: f32,
        star: Option<(f32, f32, f32)>,
        targets: &[&ScriptTarget],
        tick: u64,
        ticks_per_second: u32,
    ) -> Result<ScriptResult> {
        let position = entity.pos.as_ref().expect("scripted entity has a position");
        let ctx = self.lua.create_table()?;
        // Keep these top-level fields while scripts migrate to ctx.self.
        ctx.set("x", position.x)?;
        ctx.set("y", position.y)?;
        ctx.set("speed", speed)?;
        ctx.set("tick", tick)?;
        ctx.set("ticks_per_second", ticks_per_second)?;
        let self_table = self.lua.create_table()?;
        self_table.set("id", entity.id)?;
        self_table.set("owner_id", entity.owner_player_id.as_str())?;
        self_table.set("entity_type_id", entity.entity_type_id.as_str())?;
        self_table.set("x", position.x)?;
        self_table.set("y", position.y)?;
        self_table.set("health", entity.health)?;
        self_table.set("speed", speed)?;
        ctx.set("self", self_table)?;
        ctx.set("shared", self.lua.registry_value::<Table>(&self.shared)?)?;
        ctx.set("private", self.private_state(entity.id)?)?;
        ctx.set("orbit_radius", star.map(|star| star.2).unwrap_or(0.0))?;
        if let Some((star_x, star_y, _)) = star {
            let star_table = self.lua.create_table()?;
            star_table.set("x", star_x)?;
            star_table.set("y", star_y)?;
            ctx.set("star", star_table)?;
        }
        let target_table = self.lua.create_table()?;
        for (index, target_data) in targets.iter().enumerate() {
            let target = self.lua.create_table()?;
            target.set("id", target_data.id)?;
            target.set("owner_id", target_data.owner_id.as_str())?;
            target.set("entity_type_id", target_data.entity_type_id.as_str())?;
            target.set("x", target_data.x)?;
            target.set("y", target_data.y)?;
            target.set("health", target_data.health)?;
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

    fn private_state(&self, entity_id: u64) -> Result<Table> {
        let private_by_entity = self.lua.registry_value::<Table>(&self.private_by_entity)?;
        if let Some(state) = private_by_entity.get::<Option<Table>>(entity_id)? {
            return Ok(state);
        }
        let state = self.lua.create_table()?;
        private_by_entity.set(entity_id, state.clone())?;
        Ok(state)
    }

    fn remove_stale_private_state(&self, entities: &[Entity]) -> Result<()> {
        let live_ids: HashSet<u64> = entities
            .iter()
            .filter(|entity| {
                entity.entity_type_id == RAIDER_TYPE
                    && entity.owner_player_id == RAIDERS_OWNER
                    && entity.health > 0.0
            })
            .map(|entity| entity.id)
            .collect();
        let private_by_entity = self.lua.registry_value::<Table>(&self.private_by_entity)?;
        let stale_ids: Vec<u64> = private_by_entity
            .pairs::<u64, Table>()
            .filter_map(Result::ok)
            .map(|(id, _)| id)
            .filter(|id| !live_ids.contains(id))
            .collect();
        for id in stale_ids {
            private_by_entity.set(id, mlua::Value::Nil)?;
        }
        Ok(())
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
            owner_player_id: RAIDERS_OWNER.into(),
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

/// Universe entities are common knowledge for the raider scripting owner.
/// Player-owned entities are deliberately excluded; a raider only receives those in `targets`
/// when they are within its acquisition range.
fn world_entities(
    entities: &[Entity],
    content: &ContentPack,
) -> Vec<(u64, String, String, f32, f32, f32, f32)> {
    let mut result: Vec<_> = entities
        .iter()
        .filter_map(|entity| {
            let position = entity.pos.as_ref()?;
            (entity.owner_player_id == UNIVERSE_OWNER || entity.owner_player_id.is_empty())
                .then_some((
                    entity.id,
                    entity.owner_player_id.clone(),
                    entity.entity_type_id.clone(),
                    position.x,
                    position.y,
                    entity.health,
                    content
                        .get(&entity.entity_type_id)
                        .map(|definition| {
                            definition
                                .radiation_sources
                                .iter()
                                .map(|source| source.max_effective_distance.max(0.0))
                                .fold(0.0, f32::max)
                        })
                        .unwrap_or(0.0),
                ))
        })
        .collect();
    result.sort_by_key(|entity| entity.0);
    result
}

fn lua_entities_table(
    lua: &Lua,
    entities: &[(u64, String, String, f32, f32, f32, f32)],
) -> Result<Table> {
    let result = lua.create_table()?;
    for (index, (id, owner_id, entity_type_id, x, y, health, radiation_radius)) in
        entities.iter().enumerate()
    {
        let entity = lua.create_table()?;
        entity.set("id", *id)?;
        entity.set("owner_id", owner_id.as_str())?;
        entity.set("entity_type_id", entity_type_id.as_str())?;
        entity.set("x", *x)?;
        entity.set("y", *y)?;
        entity.set("health", *health)?;
        entity.set("radiation_radius", *radiation_radius)?;
        result.set(index + 1, entity)?;
    }
    Ok(result)
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
    fn raider_script_patrols_targets_and_shares_sightings() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::new().unwrap();
        let mut entities = vec![
            entity(1, STAR_TYPE, UNIVERSE_OWNER, 0.0, 0.0),
            entity(2, RAIDER_TYPE, RAIDERS_OWNER, 1600.0, 0.0),
        ];
        let commands = script.tick(&mut entities, &content, 1, 60).unwrap();
        assert!(commands.target_by_entity.is_empty());
        assert!(entities[1].vel.as_ref().unwrap().x < 0.0);

        entities.push(entity(3, "worker", "player-1", 1800.0, 0.0));
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
        assert!(entities[3]
            .vel
            .as_ref()
            .is_some_and(|velocity| velocity.x > 0.0));
    }

    #[test]
    fn raider_script_escapes_theta_radiation() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::new().unwrap();
        let mut entities = vec![
            entity(1, "theta", UNIVERSE_OWNER, 0.0, 0.0),
            entity(2, RAIDER_TYPE, RAIDERS_OWNER, 1_100.0, 0.0),
        ];

        script.tick(&mut entities, &content, 1, 60).unwrap();

        assert!(entities[1].vel.as_ref().unwrap().x > 0.0);
    }

    #[test]
    fn raider_script_stops_at_a_safe_waypoint_perimeter() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::new().unwrap();
        let mut entities = vec![
            entity(1, STAR_TYPE, UNIVERSE_OWNER, 0.0, 0.0),
            entity(2, RAIDER_TYPE, RAIDERS_OWNER, 1_550.0, 0.0),
        ];

        script.tick(&mut entities, &content, 1, 60).unwrap();

        assert_eq!(entities[1].vel, Some(Vec2 { x: 0.0, y: 0.0 }));
    }

    #[test]
    fn raider_script_detours_around_an_intervening_star() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::new().unwrap();
        let mut entities = vec![
            entity(1, STAR_TYPE, UNIVERSE_OWNER, 0.0, 0.0),
            // 1550 * 0.95 was the stable chord-orbit radius observed in Redis.
            entity(2, RAIDER_TYPE, RAIDERS_OWNER, 1_472.5, 0.0),
            entity(3, "theta", UNIVERSE_OWNER, -4_000.0, 0.0),
        ];

        script.tick(&mut entities, &content, 1, 60).unwrap();

        let velocity = entities[1].vel.as_ref().unwrap();
        assert!(velocity.x > 10.0, "detour must leave the chord-orbit radius");
        assert_ne!(velocity.y, 0.0);
    }

    #[test]
    fn raider_script_loads_the_full_neutral_map_within_its_memory_limit() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::new().unwrap();
        let mut entities = Vec::new();
        for id in 1..=100 {
            entities.push(entity(
                id,
                STAR_TYPE,
                UNIVERSE_OWNER,
                id as f32 * 1_000.0,
                0.0,
            ));
        }
        for id in 101..=175 {
            entities.push(entity(id, "theta", UNIVERSE_OWNER, id as f32 * 1_000.0, 0.0));
        }
        for id in 176..=400 {
            entities.push(entity(
                id,
                "minerals",
                UNIVERSE_OWNER,
                id as f32 * 1_000.0,
                0.0,
            ));
        }
        entities.push(entity(401, RAIDER_TYPE, RAIDERS_OWNER, 0.0, 0.0));

        script.tick(&mut entities, &content, 1, 60).unwrap();
    }

    #[test]
    fn exposes_owner_shared_state_and_entity_private_state() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::from_source(
            r#"
                function world_tick(ctx)
                  assert(ctx.owner_id == "raiders")
                  assert(ctx.entities[1].id == 1)
                  assert(ctx.entities[1].entity_type_id == "star_yellow")
                  assert(ctx.entities[1].radiation_radius == 1200)
                  ctx.shared.world_ticks = (ctx.shared.world_ticks or 0) + 1
                end

                function tick(ctx)
                  assert(ctx.self.id == 2)
                  assert(ctx.self.owner_id == "raiders")
                  assert(ctx.self.entity_type_id == "raider")
                  assert(ctx.tick == ctx.shared.world_ticks)
                  ctx.private.calls = (ctx.private.calls or 0) + 1
                  return { vx = ctx.private.calls, vy = 0 }
                end
            "#,
        )
        .unwrap();
        let mut entities = vec![
            entity(1, STAR_TYPE, UNIVERSE_OWNER, 0.0, 0.0),
            entity(2, RAIDER_TYPE, RAIDERS_OWNER, 1300.0, 0.0),
        ];

        script.tick(&mut entities, &content, 1, 60).unwrap();
        assert_eq!(entities[1].vel.as_ref().unwrap().x, 1.0);
        script.tick(&mut entities, &content, 2, 60).unwrap();
        assert_eq!(entities[1].vel.as_ref().unwrap().x, 2.0);
    }

    #[test]
    fn exposes_target_owner_type_and_health() {
        let content = ContentPack::load(Path::new("../../packages/content/entities.yaml")).unwrap();
        let script = RaiderScript::from_source(
            r#"
                function tick(ctx)
                  local target = ctx.targets[1]
                  assert(target.id == 3)
                  assert(target.owner_id == "player-1")
                  assert(target.entity_type_id == "worker")
                  assert(target.health == 100)
                  return { target_id = target.id }
                end
            "#,
        )
        .unwrap();
        let mut entities = vec![
            entity(1, STAR_TYPE, UNIVERSE_OWNER, 0.0, 0.0),
            entity(2, RAIDER_TYPE, RAIDERS_OWNER, 1300.0, 0.0),
            entity(3, "worker", "player-1", 1400.0, 0.0),
        ];

        let commands = script.tick(&mut entities, &content, 1, 60).unwrap();
        assert_eq!(commands.target_by_entity.get(&2), Some(&3));
    }
}
