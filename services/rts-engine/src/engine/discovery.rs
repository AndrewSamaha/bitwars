//! Authoritative discovery and last-seen values survive sensor loss and checkpoints.
use std::collections::{BTreeMap, BTreeSet};
use std::ops::{Deref, DerefMut};

use super::state::{GameState, PlayerTechnologies};
use crate::{
    content::{ContentPack, TechnologyEffectOperation},
    pb,
    spatial::{SpatialIndex, CELL_SIZE},
    spawn_config::is_player_owner,
};

/// Keep collection's monotonic discovery API and legacy JSON independently of
/// observations, which may legitimately be forgotten.
#[derive(Clone, Debug, Default, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct Discoveries {
    history: BTreeMap<String, BTreeSet<u64>>,
    #[serde(skip)]
    players: BTreeMap<String, Knowledge>,
}

#[derive(Clone, Debug, Default, PartialEq)]
struct Knowledge {
    observations: BTreeMap<u64, pb::EntityObservation>,
    visible: BTreeSet<u64>,
    dirty: BTreeSet<u64>,
    removed: BTreeSet<u64>,
}

impl Deref for Discoveries {
    type Target = BTreeMap<String, BTreeSet<u64>>;
    fn deref(&self) -> &Self::Target { &self.history }
}

impl DerefMut for Discoveries {
    fn deref_mut(&mut self) -> &mut Self::Target { &mut self.history }
}

impl Discoveries {
    pub fn new() -> Self { Self::default() }

    pub fn knowledge_for_snapshot(&self) -> Vec<pb::PlayerKnowledge> {
        self.players.iter().map(|(player_id, knowledge)| pb::PlayerKnowledge {
            player_id: player_id.clone(),
            observations: knowledge.observations.values().cloned().collect(),
        }).collect()
    }

    /// Restoring never consults live entities, including hidden survivors.
    pub fn restore_knowledge(&mut self, players: Vec<pb::PlayerKnowledge>, checkpoint_tick: u64) {
        self.players.clear();
        for player in players {
            if !is_player_owner(&player.player_id) { continue; }
            let history = self.history.entry(player.player_id.clone()).or_default();
            let knowledge = self.players.entry(player.player_id).or_default();
            for observation in player.observations {
                history.insert(observation.entity_id);
                if observation.last_seen_tick == checkpoint_tick {
                    knowledge.visible.insert(observation.entity_id);
                }
                knowledge.observations.insert(observation.entity_id, observation);
            }
        }
    }

    pub fn append_changes(&self, delta: &mut pb::Delta) {
        delta.player_knowledge_updates.extend(self.players.iter().filter_map(|(player_id, knowledge)| {
            if knowledge.dirty.is_empty() && knowledge.removed.is_empty() { return None; }
            Some(pb::PlayerKnowledgeUpdate {
                player_id: player_id.clone(),
                upserts: knowledge.dirty.iter().filter_map(|id| knowledge.observations.get(id)).cloned().collect(),
                removed_entity_ids: knowledge.removed.iter().copied().collect(),
            })
        }));
    }

    /// Called only after successful delta publication; failed writes retain dirt.
    pub fn acknowledge_changes(&mut self) {
        for knowledge in self.players.values_mut() {
            knowledge.dirty.clear();
            knowledge.removed.clear();
        }
    }
}

impl Knowledge {
    fn observe(&mut self, entity: &pb::Entity, tick: u64) {
        let acquired = self.visible.insert(entity.id);
        let observation = self.observations.entry(entity.id).or_insert_with(|| pb::EntityObservation {
            entity_id: entity.id, ..Default::default()
        });
        let type_changed = observation.entity_type_id != entity.entity_type_id;
        let owner_changed = observation.owner_player_id != entity.owner_player_id;
        if acquired || type_changed || owner_changed || observation.pos != entity.pos {
            if type_changed { observation.entity_type_id.clone_from(&entity.entity_type_id); }
            if owner_changed { observation.owner_player_id.clone_from(&entity.owner_player_id); }
            observation.pos = entity.pos;
            self.dirty.insert(entity.id);
        }
        // Exact for checkpoints, without publishing unchanged visible entities.
        observation.last_seen_tick = tick;
        self.removed.remove(&entity.id);
    }

    fn forget(&mut self, id: u64) {
        if self.observations.remove(&id).is_some() {
            self.dirty.remove(&id);
            self.removed.insert(id);
        }
        self.visible.remove(&id);
    }
}

fn sensor_range(source: &pb::Entity, technologies: &PlayerTechnologies, content: &ContentPack) -> f32 {
    let mut range = content.get(&source.entity_type_id)
        .and_then(|d| d.sensor.as_ref()).map_or(0.0, |sensor| sensor.range);
    if let Some(owned) = technologies.get(&source.owner_player_id) {
        let mut ids: Vec<_> = owned.iter().collect();
        ids.sort();
        for id in ids {
            let Some(technology) = content.technology(id) else { continue; };
            for effect in &technology.effects {
                if effect.target != "entity.sensor.range" { continue; }
                range = match effect.operation {
                    TechnologyEffectOperation::Add => range + effect.value,
                    TechnologyEffectOperation::Multiply => range * effect.value,
                    TechnologyEffectOperation::Set => effect.value,
                    TechnologyEffectOperation::Cap => range.min(effect.value),
                };
            }
        }
    }
    range
}

struct Visibility {
    seen: BTreeSet<usize>,
    sensors: Vec<(pb::Vec2, f32)>,
    points: SpatialIndex,
    coverage: SpatialIndex,
    wide: Vec<usize>,
}

impl Default for Visibility {
    fn default() -> Self {
        Self { seen: BTreeSet::new(), sensors: Vec::new(), points: SpatialIndex::new(),
            coverage: SpatialIndex::new(), wide: Vec::new() }
    }
}

impl Visibility {
    /// Test only the remembered position/type, never the hidden entity's values.
    fn covers(&self, observation: &pb::EntityObservation, content: &ContentPack) -> bool {
        let Some(pos) = observation.pos.as_ref() else { return false; };
        let target_range = content.get(&observation.entity_type_id)
            .and_then(|d| d.visibility_range).unwrap_or(0.0);
        let contains = |index: usize| {
            let (sensor, range) = &self.sensors[index];
            let radius = range.max(target_range);
            (sensor.x - pos.x).powi(2) + (sensor.y - pos.y).powi(2) <= radius * radius
        };
        if target_range > CELL_SIZE {
            // Sparse wide targets avoid enumerating thousands of empty cells.
            (0..self.sensors.len()).any(contains)
        } else {
            if self.coverage.at(pos.x, pos.y).chain(self.wide.iter().copied()).any(&contains) {
                return true;
            }
            target_range > 0.0 && self.points.within(pos.x, pos.y, target_range).into_iter().any(contains)
        }
    }
}

/// One spatial discovery pass includes already-discovered targets. Borrow world
/// data; only visible indices and compact sensor positions are materialized.
fn visibility<'a>(state: &'a GameState, content: &ContentPack) -> BTreeMap<&'a str, Visibility> {
    let mut points = SpatialIndex::new();
    let mut extended = SpatialIndex::new();
    let mut wide_visibility = Vec::new();
    for (i, entity) in state.entities.iter().enumerate() {
        let Some(pos) = entity.pos.as_ref() else { continue; };
        points.insert(i, pos.x, pos.y);
        let range = content.get(&entity.entity_type_id).and_then(|d| d.visibility_range).unwrap_or(0.0);
        if range > CELL_SIZE {
            wide_visibility.push(i);
        } else if range > 0.0 {
            extended.insert_area(i, pos.x, pos.y, range);
        }
    }
    let mut players = BTreeMap::<&str, Visibility>::new();
    for (source_index, source) in state.entities.iter().enumerate() {
        if !is_player_owner(&source.owner_player_id) { continue; }
        let player = players.entry(&source.owner_player_id).or_default();
        player.seen.insert(source_index);
        if source.supply.as_ref().is_some_and(|s| !s.operational) { continue; }
        let Some(pos) = source.pos.as_ref() else { continue; };
        let range = sensor_range(source, &state.technologies, content);
        if !range.is_finite() || range <= 0.0 { continue; }
        let index = player.sensors.len();
        player.sensors.push((*pos, range));
        player.points.insert(index, pos.x, pos.y);
        if range > CELL_SIZE {
            player.wide.push(index);
        } else {
            player.coverage.insert_area(index, pos.x, pos.y, range);
        }
        let mut candidates = points.within(pos.x, pos.y, range);
        candidates.extend(extended.at(pos.x, pos.y));
        candidates.extend(wide_visibility.iter().copied());
        candidates.sort_unstable();
        candidates.dedup();
        for i in candidates {
            let target = &state.entities[i];
            let target_pos = target.pos.as_ref().unwrap();
            let target_range = content.get(&target.entity_type_id).and_then(|d| d.visibility_range).unwrap_or(0.0);
            let radius = range.max(target_range);
            if (pos.x - target_pos.x).powi(2) + (pos.y - target_pos.y).powi(2) <= radius * radius {
                player.seen.insert(i);
            }
        }
    }
    players
}

/// Collection may refresh monotonic discovery before accepting a route, without
/// advancing last-seen values in the middle of a simulation tick.
pub fn update(state: &mut GameState, content: &ContentPack) {
    let players = visibility(state, content);
    let discovered: Vec<_> = players.into_iter().map(|(owner, player)| {
        (owner.to_owned(), player.seen.into_iter().map(|i| state.entities[i].id).collect::<BTreeSet<_>>())
    }).collect();
    for (owner, ids) in discovered {
        state.discovered_entities.history.entry(owner).or_default().extend(ids);
    }
}

/// Run after movement and destruction, once per simulation tick, even offline.
pub fn observe(state: &mut GameState, content: &ContentPack) {
    // Split the borrow so visibility can borrow immutable world data while
    // knowledge is updated in-place, without cloning historic observations.
    let mut discoveries = std::mem::take(&mut state.discovered_entities);
    let players = visibility(state, content);
    for (owner, player) in &players {
        let history = discoveries.history.entry((*owner).to_owned()).or_default();
        let knowledge = discoveries.players.entry((*owner).to_owned()).or_default();
        let previous_visible = std::mem::take(&mut knowledge.visible);
        for i in &player.seen {
            let entity = &state.entities[*i];
            history.insert(entity.id);
            // Acquisition uses the previous tick's visibility, not source order.
            if previous_visible.contains(&entity.id) { knowledge.visible.insert(entity.id); }
            knowledge.observe(entity, state.tick);
        }
        let mut forgotten = Vec::new();
        for (id, observation) in &knowledge.observations {
            if knowledge.visible.contains(id) { continue; }
            if player.covers(observation, content) {
                forgotten.push(*id);
            } else if previous_visible.contains(id) {
                // Final visible tick is needed when this sighting becomes hidden.
                knowledge.dirty.insert(*id);
            }
        }
        for id in forgotten { knowledge.forget(id); }
    }
    // Players with no remaining units retain hidden memories, including unseen
    // destruction; losing all sensors is not evidence of absence.
    for (owner, knowledge) in &mut discoveries.players {
        if !players.contains_key(owner.as_str()) {
            knowledge.dirty.append(&mut knowledge.visible);
        }
    }
    state.discovered_entities = discoveries;
}

/// Rare destruction paths can invalidate a moved victim at its witnessed death
/// position rather than guessing from the previous tick's remembered location.
fn destruction_witnesses(state: &GameState, content: &ContentPack, victim: &pb::Entity) -> BTreeSet<String> {
    let mut witnesses = BTreeSet::new();
    if is_player_owner(&victim.owner_player_id) { witnesses.insert(victim.owner_player_id.clone()); }
    // Previous published visibility still witnesses a destruction when the
    // observing sensor is itself destroyed during this same simulation tick.
    for (owner, knowledge) in &state.discovered_entities.players {
        if knowledge.visible.contains(&victim.id) { witnesses.insert(owner.clone()); }
    }
    if let Some(pos) = victim.pos.as_ref() {
        let target_range = content.get(&victim.entity_type_id).and_then(|d| d.visibility_range).unwrap_or(0.0);
        for sensor in &state.entities {
            if !is_player_owner(&sensor.owner_player_id) || sensor.supply.as_ref().is_some_and(|s| !s.operational) { continue; }
            let Some(sensor_pos) = sensor.pos.as_ref() else { continue; };
            let range = sensor_range(sensor, &state.technologies, content);
            if !range.is_finite() || range <= 0.0 { continue; }
            let radius = range.max(target_range);
            if (sensor_pos.x - pos.x).powi(2) + (sensor_pos.y - pos.y).powi(2) <= radius * radius {
                witnesses.insert(sensor.owner_player_id.clone());
            }
        }
    }
    witnesses
}

pub fn forget_destroyed(state: &mut GameState, content: &ContentPack, victim: &pb::Entity) {
    for owner in destruction_witnesses(state, content, victim) {
        if let Some(knowledge) = state.discovered_entities.players.get_mut(&owner) {
            knowledge.forget(victim.id);
        }
    }
}

/// Before removal, borrow the target and its sensors rather than cloning it.
pub fn forget_self_destruct(state: &mut GameState, content: &ContentPack, owner: &str, id: u64) {
    let Some(victim) = state.entities.iter()
        .find(|entity| entity.id == id && entity.owner_player_id == owner && entity.health > 0.0) else { return; };
    let witnesses = destruction_witnesses(state, content, victim);
    for owner in witnesses {
        if let Some(knowledge) = state.discovered_entities.players.get_mut(&owner) {
            knowledge.forget(id);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pb::{DepotSupply, Entity, Vec2};

    fn entity(id: u64, kind: &str, owner: &str, x: f32) -> Entity {
        Entity {
            id,
            entity_type_id: kind.into(),
            owner_player_id: owner.into(),
            pos: Some(Vec2 { x, y: 0.0 }),
            health: 100.0,
            ..Default::default()
        }
    }

    fn setup(entities: Vec<Entity>) -> (ContentPack, GameState) {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let state = GameState {
            entities,
            tick: 0,
            technologies: Default::default(),
            generation: Default::default(),
            discovered_entities: Default::default(),
        };
        (content, state)
    }

    #[test]
    fn discovery_is_per_player_and_survives_sensor_loss_and_disconnect() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 950.0),
            entity(2, "minerals", "universe", 1050.0),
            entity(3, "minerals", "universe", 2000.0),
            entity(4, "worker", "bob", 2400.0),
        ]);
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
        assert!(!state.discovered_entities["alice"].contains(&3));
        assert!(state.discovered_entities["bob"].contains(&3));
        state.entities.retain(|e| e.owner_player_id == "universe");
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
        assert!(!state.discovered_entities["alice"].contains(&3));
    }

    #[test]
    fn extended_target_visibility_uses_exact_distance_and_requires_operational_sensor() {
        let (mut content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "star_yellow", "universe", 39999.0),
            entity(3, "star_yellow", "universe", 40001.0),
        ]);
        content.entity_types.get_mut("star_yellow").unwrap().visibility_range = Some(40_000.0);
        state.entities[0].supply = Some(DepotSupply {
            operational: false,
            ..Default::default()
        });
        update(&mut state, &content);
        assert!(!state.discovered_entities["alice"].contains(&2));
        state.entities[0].supply.as_mut().unwrap().operational = true;
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
        assert!(!state.discovered_entities["alice"].contains(&3));
    }

    #[test]
    fn researched_sensor_range_discovers_additional_sources() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "planet_blue", "universe", 450.0),
        ]);
        update(&mut state, &content);
        assert!(!state.discovered_entities["alice"].contains(&2));
        state
            .technologies
            .insert("alice".into(), ["neutrino_sensors".into()].into());
        update(&mut state, &content);
        assert!(state.discovered_entities["alice"].contains(&2));
    }

    fn observation<'a>(state: &'a GameState, owner: &str, id: u64) -> &'a pb::EntityObservation {
        &state.discovered_entities.players[owner].observations[&id]
    }

    fn changes(state: &GameState) -> pb::Delta {
        let mut delta = pb::Delta::default();
        state.discovered_entities.append_changes(&mut delta);
        delta
    }

    fn hide_target(state: &mut GameState) {
        state.entities[0].pos.as_mut().unwrap().x = 10_000.0;
        state.entities[1].pos.as_mut().unwrap().x = 20_000.0;
        state.tick += 1;
    }

    #[test]
    fn unchanged_visible_ticks_are_checkpointed_without_delta_spam() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        state.tick = 10;
        observe(&mut state, &content);
        assert_eq!(changes(&state).player_knowledge_updates[0].upserts.len(), 2);
        state.discovered_entities.acknowledge_changes();
        state.tick = 11;
        observe(&mut state, &content);
        assert!(changes(&state).player_knowledge_updates.is_empty());
        assert_eq!(observation(&state, "alice", 2).last_seen_tick, 11);
        assert_eq!(state.discovered_entities.knowledge_for_snapshot()[0].observations[1].last_seen_tick, 11);
        hide_target(&mut state);
        observe(&mut state, &content);
        let delta = changes(&state);
        let last = delta.player_knowledge_updates[0].upserts.iter().find(|o| o.entity_id == 2).unwrap();
        assert_eq!(last.last_seen_tick, 11);
        state.discovered_entities.acknowledge_changes();
        state.tick += 1;
        observe(&mut state, &content);
        assert!(changes(&state).player_knowledge_updates.is_empty());
    }

    #[test]
    fn hidden_values_freeze_and_reacquisition_replaces_them_per_player() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "worker", "bob", 100.0),
        ]);
        state.tick = 5;
        observe(&mut state, &content);
        let remembered = observation(&state, "alice", 2).clone();
        state.discovered_entities.acknowledge_changes();
        hide_target(&mut state);
        state.entities[1].owner_player_id = "carol".into();
        state.entities[1].entity_type_id = "minerals".into();
        observe(&mut state, &content);
        assert_eq!(observation(&state, "alice", 2), &remembered);
        assert_eq!(observation(&state, "bob", 2).owner_player_id, "bob");
        state.discovered_entities.acknowledge_changes();
        state.entities[0].pos.as_mut().unwrap().x = 20_000.0;
        state.tick += 1;
        observe(&mut state, &content);
        let reacquired = observation(&state, "alice", 2);
        assert_eq!(reacquired.owner_player_id, "carol");
        assert_eq!(reacquired.entity_type_id, "minerals");
        assert_eq!(reacquired.pos.unwrap().x, 20_000.0);
        assert_eq!(reacquired.last_seen_tick, state.tick);
        assert!(changes(&state).player_knowledge_updates.iter()
            .find(|update| update.player_id == "alice").unwrap().upserts.iter().any(|o| o.entity_id == 2));
    }

    #[test]
    fn unseen_destruction_stays_remembered_until_old_position_is_observed_empty() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        state.tick = 10;
        observe(&mut state, &content);
        hide_target(&mut state);
        observe(&mut state, &content);
        state.discovered_entities.acknowledge_changes();
        let victim = state.entities.pop().unwrap();
        forget_destroyed(&mut state, &content, &victim);
        state.tick += 1;
        observe(&mut state, &content);
        assert_eq!(observation(&state, "alice", 2).pos.unwrap().x, 100.0);
        assert!(changes(&state).player_knowledge_updates.is_empty());
        state.entities[0].pos.as_mut().unwrap().x = 0.0;
        state.tick += 1;
        observe(&mut state, &content);
        assert!(!state.discovered_entities.players["alice"].observations.contains_key(&2));
        assert_eq!(changes(&state).player_knowledge_updates[0].removed_entity_ids, vec![2]);
        // Collection discovery remains monotonic even after a sighting is disproven.
        assert!(state.discovered_entities["alice"].contains(&2));
    }

    #[test]
    fn observing_empty_old_location_forgets_a_target_that_still_exists_elsewhere() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        observe(&mut state, &content);
        hide_target(&mut state);
        observe(&mut state, &content);
        state.discovered_entities.acknowledge_changes();
        state.entities[0].pos.as_mut().unwrap().x = 0.0;
        state.tick += 1;
        observe(&mut state, &content);
        assert_eq!(state.entities[1].pos.unwrap().x, 20_000.0);
        assert!(!state.discovered_entities.players["alice"].observations.contains_key(&2));
        assert_eq!(changes(&state).player_knowledge_updates[0].removed_entity_ids, vec![2]);
    }

    #[test]
    fn witnessed_destruction_clears_memory_even_when_sensor_dies_same_tick() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        state.tick = 8;
        observe(&mut state, &content);
        state.discovered_entities.acknowledge_changes();
        let victim = state.entities.pop().unwrap();
        state.entities.clear();
        forget_destroyed(&mut state, &content, &victim);
        state.tick += 1;
        observe(&mut state, &content);
        assert!(!state.discovered_entities.players["alice"].observations.contains_key(&2));
        assert!(changes(&state).player_knowledge_updates[0].removed_entity_ids.contains(&2));
    }

    #[test]
    fn missing_location_requires_operational_sensor_and_remembered_target_visibility() {
        let (mut content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "star_yellow", "universe", 39_999.0),
        ]);
        content.entity_types.get_mut("star_yellow").unwrap().visibility_range = Some(40_000.0);
        observe(&mut state, &content);
        state.entities.pop();
        state.entities[0].supply = Some(DepotSupply { operational: false, ..Default::default() });
        state.tick += 1;
        observe(&mut state, &content);
        assert!(state.discovered_entities.players["alice"].observations.contains_key(&2));
        state.entities[0].supply.as_mut().unwrap().operational = true;
        state.tick += 1;
        observe(&mut state, &content);
        assert!(!state.discovered_entities.players["alice"].observations.contains_key(&2));
    }

    #[test]
    fn failed_publication_retains_latest_dirty_values_and_removal_supersedes_upsert() {
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        observe(&mut state, &content);
        let first = changes(&state);
        assert_eq!(first, changes(&state));
        state.entities[1].pos.as_mut().unwrap().x = 110.0;
        state.tick += 1;
        observe(&mut state, &content);
        let retry = changes(&state);
        assert_eq!(retry.player_knowledge_updates[0].upserts[1].pos.unwrap().x, 110.0);
        let victim = state.entities.pop().unwrap();
        forget_destroyed(&mut state, &content, &victim);
        let removed = changes(&state);
        assert_eq!(removed.player_knowledge_updates[0].removed_entity_ids, vec![2]);
        assert!(!removed.player_knowledge_updates[0].upserts.iter().any(|o| o.entity_id == 2));
        state.discovered_entities.acknowledge_changes();
        assert!(changes(&state).player_knowledge_updates.is_empty());
    }

    #[test]
    fn checkpoint_roundtrip_preserves_hidden_values_ticks_and_match_reset() {
        use prost::Message;
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        state.tick = 100;
        observe(&mut state, &content);
        hide_target(&mut state);
        observe(&mut state, &content);
        let snapshot = pb::Snapshot {
            tick: state.tick as i64,
            entities: state.entities.clone(),
            player_knowledge: state.discovered_entities.knowledge_for_snapshot(),
            discovered_entities_json: serde_json::to_string(&state.discovered_entities).unwrap(),
            ..Default::default()
        };
        let saved = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        let mut restored = GameState {
            entities: saved.entities, tick: saved.tick as u64,
            technologies: Default::default(), generation: Default::default(),
            discovered_entities: serde_json::from_str(&saved.discovered_entities_json).unwrap(),
        };
        restored.discovered_entities.restore_knowledge(saved.player_knowledge, restored.tick);
        assert_eq!(observation(&restored, "alice", 2), observation(&state, "alice", 2));
        assert!(changes(&restored).player_knowledge_updates.is_empty());
        restored.entities[1].pos.as_mut().unwrap().x = 30_000.0;
        restored.tick += 1;
        observe(&mut restored, &content);
        assert_eq!(observation(&restored, "alice", 2).pos.unwrap().x, 100.0);
        assert_eq!(observation(&restored, "alice", 2).last_seen_tick, 100);
        // Fresh match state carries neither discoveries nor private sightings.
        let (_, fresh) = setup(Vec::new());
        assert!(fresh.discovered_entities.knowledge_for_snapshot().is_empty());
        assert!(fresh.discovered_entities.is_empty());
        assert!(state.clone_for_delta().discovered_entities.knowledge_for_snapshot().is_empty());
    }

    #[test]
    fn checkpoint_reconstructs_visibility_for_first_tick_witnessed_destruction() {
        use prost::Message;
        let (content, mut state) = setup(vec![
            entity(1, "worker", "alice", 0.0),
            entity(2, "minerals", "universe", 100.0),
        ]);
        state.tick = 20;
        observe(&mut state, &content);
        let snapshot = pb::Snapshot {
            tick: 20, player_knowledge: state.discovered_entities.knowledge_for_snapshot(),
            ..Default::default()
        };
        let saved = pb::Snapshot::decode(snapshot.encode_to_vec().as_slice()).unwrap();
        state.discovered_entities.restore_knowledge(saved.player_knowledge, saved.tick as u64);
        assert!(changes(&state).player_knowledge_updates.is_empty());
        let victim = state.entities.pop().unwrap();
        state.entities.clear();
        forget_destroyed(&mut state, &content, &victim);
        assert_eq!(changes(&state).player_knowledge_updates[0].removed_entity_ids, vec![2]);
    }
}

#[cfg(test)]
mod index_comparison_tests {
    use super::*;
    use crate::pb::{Entity, Vec2};

    #[test]
    fn indexed_discovery_matches_full_world_visibility_scan() {
        let content = ContentPack::load(
            &std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../packages/content/entities.yaml"),
        )
        .unwrap();
        let entities = (0..600)
            .map(|i| Entity {
                id: i + 1,
                owner_player_id: if i < 12 {
                    format!("player{}", i % 3)
                } else {
                    "universe".into()
                },
                entity_type_id: if i < 12 {
                    "habitat"
                } else {
                    ["minerals", "star_yellow", "planet_blue"][i as usize % 3]
                }
                .into(),
                pos: Some(Vec2 {
                    x: ((i * 7919) % 100003) as f32 - 50000.0,
                    y: ((i * 3571) % 100003) as f32 - 50000.0,
                }),
                health: 100.0,
                ..Default::default()
            })
            .collect::<Vec<_>>();
        let mut expected = Discoveries::new();
        for player in ["player0", "player1", "player2"] {
            let sensors: Vec<_> = entities
                .iter()
                .filter(|e| e.owner_player_id == player)
                .collect();
            for target in &entities {
                let target_range = content
                    .get(&target.entity_type_id)
                    .unwrap()
                    .visibility_range
                    .unwrap_or(0.0);
                if target.owner_player_id == player
                    || sensors.iter().any(|sensor| {
                        let a = sensor.pos.as_ref().unwrap();
                        let b = target.pos.as_ref().unwrap();
                        let radius = content
                            .get(&sensor.entity_type_id)
                            .unwrap()
                            .sensor
                            .as_ref()
                            .unwrap()
                            .range
                            .max(target_range);
                        (a.x - b.x).hypot(a.y - b.y) <= radius
                    })
                {
                    expected.entry(player.into()).or_default().insert(target.id);
                }
            }
        }
        let mut state = GameState {
            entities,
            tick: 0,
            technologies: Default::default(),
            generation: Default::default(),
            discovered_entities: Default::default(),
        };
        update(&mut state, &content);
        assert_eq!(state.discovered_entities, expected);
    }
}
