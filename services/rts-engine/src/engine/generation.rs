//! Procedural neutral populations and transactional player starts.
use super::state::{
    initialize_resource_deposits, neutral_entity, on_player_spawn, sample_normal_position,
    set_resource_amount, GameState,
};
use crate::{
    content::ContentPack,
    pb::Entity,
    spawn_config::{
        ExposureConfig, Loadout, Placement, Sampling, SpawnConfig, TypeWeights, UNIVERSE_OWNER,
    },
};
use anyhow::{bail, Result};
use rand::{seq::SliceRandom, Rng};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct GenerationState {
    pub version: u32,
    pub starts: BTreeMap<String, StartReservation>,
    pub pending: BTreeMap<String, PendingStart>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartReservation {
    pub planet_id: u64,
    pub origin: [f32; 2],
    pub planet_position: [f32; 2],
}
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PendingStart {
    pub loadout_index: usize,
    pub last_revision: Option<u64>,
    pub error: Option<String>,
}

pub fn exposure(entities: &[Entity], config: &ExposureConfig, p: [f32; 2]) -> f64 {
    let mut sources: Vec<_> = entities
        .iter()
        .filter(|e| e.health > 0.0 && config.sources.contains_key(&e.entity_type_id))
        .collect();
    sources.sort_by_key(|e| e.id);
    sources
        .into_iter()
        .filter_map(|e| {
            let pos = e.pos.as_ref()?;
            let d = ((p[0] as f64 - pos.x as f64).hypot(p[1] as f64 - pos.y as f64))
                .max(config.minimum_distance);
            Some(config.sources[&e.entity_type_id] * (config.reference_distance / d).powi(2))
        })
        .sum()
}

pub fn planet_weights(table: &TypeWeights, energy: f64) -> BTreeMap<String, f64> {
    let points = &table.points;
    if energy <= points[0].exposure {
        return points[0].weights.clone();
    }
    for pair in points.windows(2) {
        if energy <= pair[1].exposure {
            let t = (energy - pair[0].exposure) / (pair[1].exposure - pair[0].exposure);
            let ids: BTreeSet<_> = pair.iter().flat_map(|p| p.weights.keys()).collect();
            return ids
                .into_iter()
                .map(|id| {
                    let a = pair[0].weights.get(id).copied().unwrap_or(0.0);
                    let b = pair[1].weights.get(id).copied().unwrap_or(0.0);
                    (id.clone(), a + (b - a) * t)
                })
                .collect();
        }
    }
    points.last().unwrap().weights.clone()
}
fn weighted<K: Clone + Ord>(weights: &BTreeMap<K, f64>, rng: &mut impl Rng) -> K {
    let mut roll = rng.gen::<f64>() * weights.values().sum::<f64>();
    for (key, weight) in weights {
        if roll < *weight {
            return key.clone();
        }
        roll -= weight;
    }
    weights
        .iter()
        .rev()
        .find(|(_, w)| **w > 0.0)
        .unwrap()
        .0
        .clone()
}
fn position(
    origin: [f32; 2],
    min: f32,
    max: f32,
    sampling: Sampling,
    rng: &mut impl Rng,
) -> [f32; 2] {
    let angle = rng.gen_range(0.0..std::f32::consts::TAU);
    let u = rng.gen::<f32>();
    let r = match sampling {
        Sampling::UniformRadius => min + (max - min) * u,
        Sampling::UniformArea => (min * min + (max * max - min * min) * u).sqrt(),
    };
    [origin[0] + angle.cos() * r, origin[1] + angle.sin() * r]
}
fn distance(a: [f32; 2], b: [f32; 2]) -> f32 {
    (a[0] - b[0]).hypot(a[1] - b[1])
}
fn pos(e: &Entity) -> [f32; 2] {
    e.pos.as_ref().map(|p| [p.x, p.y]).unwrap_or([0.0, 0.0])
}
fn hull(content: &ContentPack, id: &str) -> f32 {
    content.get(id).map_or(0.0, |d| d.hull_radius.max(0.0))
}
fn next_id(entities: &[Entity]) -> u64 {
    entities.iter().map(|e| e.id).max().unwrap_or(0) + 1
}
fn radiation_safe(
    entities: &[Entity],
    content: &ContentPack,
    p: [f32; 2],
    radius: f32,
    multiplier: f32,
) -> bool {
    entities.iter().filter(|e| e.health > 0.0).all(|e| {
        let d = distance(p, pos(e));
        content.get(&e.entity_type_id).is_none_or(|def| {
            def.radiation_sources.iter().all(|s| {
                s.damage_per_second <= 0.0
                    || if multiplier > 1.0 {
                        d > s.max_effective_distance.max(0.0) * multiplier + radius
                    } else {
                        d + radius < s.min_effective_distance.max(0.0)
                            || d - radius > s.max_effective_distance.max(0.0)
                    }
            })
        })
    })
}
fn clear(
    entities: &[Entity],
    content: &ContentPack,
    p: [f32; 2],
    radius: f32,
    separation: f32,
) -> bool {
    entities
        .iter()
        .filter(|e| e.health > 0.0)
        .all(|e| distance(p, pos(e)) >= separation.max(radius + hull(content, &e.entity_type_id)))
}
fn add_object(
    entities: &mut Vec<Entity>,
    content: &ContentPack,
    config: &SpawnConfig,
    id: &str,
    p: [f32; 2],
    rng: &mut impl Rng,
) {
    let mut entity = neutral_entity(next_id(entities), id, p[0], p[1], content);
    initialize_resource_deposits(
        std::slice::from_mut(&mut entity),
        content,
        Some(config),
        rng,
    );
    entities.push(entity);
}
fn place_object(
    entities: &mut Vec<Entity>,
    content: &ContentPack,
    config: &SpawnConfig,
    origin: [f32; 2],
    placement: &Placement,
    fixed_type: Option<&str>,
    required_exposure: bool,
    rng: &mut impl Rng,
) -> bool {
    for _ in 0..placement.max_attempts_per_object {
        let p = position(
            origin,
            placement.min_distance,
            placement.max_distance,
            placement.sampling,
            rng,
        );
        let energy = exposure(entities, &config.exposure, p);
        if required_exposure && !config.player_starts.exposure.contains(energy) {
            continue;
        }
        let id = fixed_type.map(str::to_string).unwrap_or_else(|| {
            weighted(
                &planet_weights(&config.solar_systems.planets.type_weights, energy),
                rng,
            )
        });
        let radius = hull(content, &id);
        if !clear(entities, content, p, radius, placement.min_separation)
            || (placement.avoid_damaging_radiation
                && !radiation_safe(entities, content, p, radius, 1.0))
        {
            continue;
        }
        add_object(entities, content, config, &id, p, rng);
        return true;
    }
    false
}
fn system(
    entities: &mut Vec<Entity>,
    content: &ContentPack,
    config: &SpawnConfig,
    origin: [f32; 2],
    rng: &mut impl Rng,
) {
    let planets = &config.solar_systems.planets;
    for _ in 0..weighted(&planets.count_weights, rng) {
        place_object(
            entities,
            content,
            config,
            origin,
            &planets.placement,
            None,
            false,
            rng,
        );
    }
    for pop in &config.solar_systems.populations {
        if rng.gen::<f64>() >= pop.probability {
            continue;
        }
        for _ in 0..rng.gen_range(pop.count.min..=pop.count.max) {
            place_object(
                entities,
                content,
                config,
                origin,
                &pop.placement,
                Some(&pop.entity_type_id),
                false,
                rng,
            );
        }
    }
}
pub fn generate_world(
    entities: &mut Vec<Entity>,
    content: &ContentPack,
    config: &SpawnConfig,
    rng: &mut impl Rng,
) {
    // Sources precede every classified body; fields retain configuration order.
    for sources in [true, false] {
        for field in &config.global_neutral_fields {
            if config.exposure.sources.contains_key(&field.entity_type_id) != sources {
                continue;
            }
            for _ in 0..field.count {
                for _ in 0..if sources {
                    1
                } else {
                    config
                        .solar_systems
                        .planets
                        .placement
                        .max_attempts_per_object
                } {
                    let (x, y) = sample_normal_position(
                        field.origin[0],
                        field.origin[1],
                        field.standard_deviation,
                        rng,
                    );
                    let p = [x, y];
                    let radius = hull(content, &field.entity_type_id);
                    if !sources
                        && (!clear(entities, content, p, radius, 0.0)
                            || !radiation_safe(entities, content, p, radius, 1.0))
                    {
                        continue;
                    }
                    add_object(entities, content, config, &field.entity_type_id, p, rng);
                    break;
                }
            }
        }
    }
    let mut anchors: Vec<_> = entities
        .iter()
        .filter(|e| e.entity_type_id == config.solar_systems.anchor_type)
        .map(|e| (e.id, pos(e)))
        .collect();
    anchors.sort_by_key(|e| e.0);
    for (_, origin) in anchors {
        system(entities, content, config, origin, rng);
    }
}
fn eligible_planet(
    e: &Entity,
    entities: &[Entity],
    generation: &GenerationState,
    config: &SpawnConfig,
) -> bool {
    let start = &config.player_starts;
    e.entity_type_id == start.planet_type
        && e.health > 0.0
        && e.pos.is_some()
        && e.resource_deposit.as_ref().is_some_and(|d| {
            d.amount > 0.0
                && d.remaining > 0.0
                && d.remaining / d.amount >= start.min_planet_food_fraction
        })
        && start
            .exposure
            .contains(exposure(entities, &config.exposure, pos(e)))
        && generation
            .starts
            .values()
            .filter(|s| s.planet_id == e.id)
            .count()
            < start.max_starts_per_planet
}
fn enemy_clear(
    entities: &[Entity],
    content: &ContentPack,
    owner: &str,
    p: [f32; 2],
    radius: f32,
    clearance: f32,
) -> bool {
    entities
        .iter()
        .filter(|e| {
            e.health > 0.0
                && !e.owner_player_id.is_empty()
                && e.owner_player_id != owner
                && e.owner_player_id != UNIVERSE_OWNER
        })
        .all(|e| distance(p, pos(e)) >= clearance + radius + hull(content, &e.entity_type_id))
}
fn segment_distance(p: [f32; 2], a: [f32; 2], b: [f32; 2]) -> f32 {
    let d = [b[0] - a[0], b[1] - a[1]];
    let len = d[0] * d[0] + d[1] * d[1];
    let t = if len == 0.0 {
        0.0
    } else {
        (((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / len).clamp(0.0, 1.0)
    };
    distance(p, [a[0] + t * d[0], a[1] + t * d[1]])
}
fn usable_mineral(
    node: &Entity,
    entities: &[Entity],
    content: &ContentPack,
    config: &SpawnConfig,
    origin: [f32; 2],
    collector_radius: f32,
) -> bool {
    if node.entity_type_id != "minerals"
        || node.health <= 0.0
        || distance(pos(node), origin) > config.player_starts.minerals.search_radius
        || !node
            .resource_deposit
            .as_ref()
            .is_some_and(|d| d.remaining >= config.player_starts.minerals.min_remaining)
        || !radiation_safe(
            entities,
            content,
            pos(node),
            hull(content, &node.entity_type_id),
            1.0,
        )
    {
        return false;
    }
    let Some(source) = content
        .get(&node.entity_type_id)
        .and_then(|d| d.resource_node.as_ref())
    else {
        return false;
    };
    // Collection uses center distances; the destination node permits harvesting contact.
    (0..16).any(|i| {
        let angle = i as f32 * std::f32::consts::TAU / 16.0;
        let r = source
            .max_effective_distance
            .max(source.min_effective_distance);
        let end = [
            pos(node)[0] + angle.cos() * r,
            pos(node)[1] + angle.sin() * r,
        ];
        entities
            .iter()
            .filter(|e| e.id != node.id && e.health > 0.0)
            .all(|e| {
                let near = segment_distance(pos(e), origin, end);
                if near < collector_radius + hull(content, &e.entity_type_id) {
                    return false;
                }
                content.get(&e.entity_type_id).is_none_or(|d| {
                    d.radiation_sources.iter().all(|s| {
                        s.damage_per_second <= 0.0
                            || near > s.max_effective_distance + collector_radius
                    })
                })
            })
    })
}
fn candidate(
    entities: &[Entity],
    generation: &GenerationState,
    content: &ContentPack,
    config: &SpawnConfig,
    owner: &str,
    loadout: &Loadout,
    min_planet_id: u64,
    rng: &mut impl Rng,
) -> Option<(Vec<Entity>, StartReservation)> {
    let start = &config.player_starts;
    let mut planets: Vec<_> = entities
        .iter()
        .filter(|e| e.id >= min_planet_id && eligible_planet(e, entities, generation, config))
        .collect();
    planets.sort_by_key(|e| e.id);
    planets.shuffle(rng);
    let collector_radius = loadout
        .iter()
        .filter(|(_, n)| **n > 0)
        .filter_map(|(id, _)| content.get(id))
        .filter(|d| {
            d.speed > 0.0
                && d.collector
                    .as_ref()
                    .is_some_and(|c| c.collects.iter().any(|r| r == "minerals"))
        })
        .map(|d| d.hull_radius)
        .min_by(f32::total_cmp)?;
    for planet in planets {
        for _ in 0..start.placement.max_attempts_per_planet {
            let origin = position(
                pos(planet),
                start.placement.min_distance_from_planet,
                start.placement.max_distance_from_planet,
                Sampling::UniformRadius,
                rng,
            );
            if !start
                .exposure
                .contains(exposure(entities, &config.exposure, origin))
                || generation
                    .starts
                    .values()
                    .any(|s| distance(origin, s.origin) < start.min_distance_between_starts)
                || !enemy_clear(entities, content, owner, origin, 0.0, start.enemy_clearance)
            {
                continue;
            }
            let mut trial = entities.to_vec();
            if !trial
                .iter()
                .any(|e| usable_mineral(e, entities, content, config, origin, collector_radius))
            {
                if !start.minerals.create_if_missing {
                    continue;
                }
                let mut found = false;
                for _ in 0..256 {
                    let p = position(
                        origin,
                        0.0,
                        start.minerals.search_radius,
                        Sampling::UniformArea,
                        rng,
                    );
                    if !clear(&trial, content, p, hull(content, "minerals"), 0.0) {
                        continue;
                    }
                    add_object(&mut trial, content, config, "minerals", p, rng);
                    if usable_mineral(
                        trial.last().unwrap(),
                        &trial,
                        content,
                        config,
                        origin,
                        collector_radius,
                    ) {
                        found = true;
                        break;
                    }
                    trial.pop();
                }
                if !found {
                    continue;
                }
            }
            let before = trial.len();
            let next = next_id(&trial);
            on_player_spawn(
                &mut trial,
                next,
                owner,
                origin[0],
                origin[1],
                loadout,
                config.min_entity_spawn_distance,
                config.max_entity_spawn_distance,
                &config.neutrals_near_spawn,
                content,
                rng,
            );
            let mut valid = true;
            for i in before..trial.len() {
                let e = &trial[i];
                let p = pos(e);
                let radius = hull(content, &e.entity_type_id);
                // The legacy sampler has a bounded fallback; reject rather than
                // accepting that fallback if it breaks the configured spacing.
                let spacing_safe = e.owner_player_id != owner
                    || trial[before..i]
                        .iter()
                        .filter(|other| other.owner_player_id == owner)
                        .all(|other| distance(p, pos(other)) >= config.min_entity_spawn_distance);
                if !spacing_safe
                    || !clear(&trial[..i], content, p, radius, 0.0)
                    || !radiation_safe(
                        &trial,
                        content,
                        p,
                        radius,
                        start.placement.radiation_clearance_multiplier,
                    )
                    || !enemy_clear(&trial, content, owner, p, radius, start.enemy_clearance)
                {
                    valid = false;
                    break;
                }
            }
            if !valid {
                continue;
            }
            // The staged loadout must not block the promised mineral approach.
            let has_approach = trial[before..]
                .iter()
                .filter(|e| {
                    e.owner_player_id == owner
                        && content.get(&e.entity_type_id).is_some_and(|d| {
                            d.speed > 0.0
                                && d.collector
                                    .as_ref()
                                    .is_some_and(|c| c.collects.iter().any(|r| r == "minerals"))
                        })
                })
                .any(|collector| {
                    let approach_world: Vec<_> = trial
                        .iter()
                        .filter(|e| e.id != collector.id)
                        .cloned()
                        .collect();
                    approach_world.iter().any(|e| {
                        distance(pos(e), origin) <= start.minerals.search_radius
                            && usable_mineral(
                                e,
                                &approach_world,
                                content,
                                config,
                                pos(collector),
                                hull(content, &collector.entity_type_id),
                            )
                    })
                });
            if !has_approach {
                continue;
            }
            initialize_resource_deposits(&mut trial[before..], content, Some(config), rng);
            if !config.starting_resources.is_empty() {
                let recipient = trial[before..].iter_mut().find(|e| {
                    e.entity_type_id == config.starting_resources_recipient_type
                        && e.owner_player_id == owner
                })?;
                for (resource, amount) in &config.starting_resources {
                    set_resource_amount(recipient, resource, *amount as f64);
                }
            }
            return Some((
                trial,
                StartReservation {
                    planet_id: planet.id,
                    origin,
                    planet_position: pos(planet),
                },
            ));
        }
    }
    None
}
fn protected(
    entities: &[Entity],
    generation: &GenerationState,
    content: &ContentPack,
    config: &SpawnConfig,
    anchor: &Entity,
) -> bool {
    generation.starts.values().all(|s| {
        [s.origin, s.planet_position].iter().all(|p| {
            config
                .player_starts
                .exposure
                .contains(exposure(entities, &config.exposure, *p))
        })
    }) && entities
        .iter()
        .filter(|e| crate::spawn_config::is_player_owner(&e.owner_player_id) && e.health > 0.0)
        .all(|e| {
            radiation_safe(
                std::slice::from_ref(anchor),
                content,
                pos(e),
                hull(content, &e.entity_type_id),
                1.0,
            )
        })
}
fn expansion_origin(
    entities: &[Entity],
    generation: &GenerationState,
    config: &SpawnConfig,
    rng: &mut impl Rng,
) -> [f32; 2] {
    let mut lo = [0.0_f32; 2];
    let mut hi = [0.0_f32; 2];
    for p in entities
        .iter()
        .map(pos)
        .chain(generation.starts.values().map(|s| s.origin))
    {
        for i in 0..2 {
            lo[i] = lo[i].min(p[i]);
            hi[i] = hi[i].max(p[i]);
        }
    }
    let radius = config
        .solar_systems
        .populations
        .iter()
        .map(|p| p.placement.max_distance)
        .fold(
            config.solar_systems.planets.placement.max_distance,
            f32::max,
        );
    for i in 0..2 {
        lo[i] -= radius + config.player_starts.min_distance_between_starts;
        hi[i] += radius + config.player_starts.min_distance_between_starts;
    }
    let w = hi[0] - lo[0];
    let h = hi[1] - lo[1];
    let mut along = rng.gen_range(0.0..2.0 * (w + h));
    if along < w {
        return [lo[0] + along, lo[1]];
    }
    along -= w;
    if along < h {
        return [hi[0], lo[1] + along];
    }
    along -= h;
    if along < w {
        return [hi[0] - along, hi[1]];
    }
    along -= w;
    [lo[0], hi[1] - along]
}
/// Transactional: failed attempts leave the supplied state completely unchanged.
pub fn spawn_player(
    state: &mut GameState,
    content: &ContentPack,
    config: &SpawnConfig,
    owner: &str,
    loadout_index: usize,
    rng: &mut impl Rng,
) -> Result<()> {
    if state.generation.starts.contains_key(owner) {
        return Ok(());
    }
    if state.generation.version != 1 {
        bail!("start reservations missing: backfill historical starts or reset the world before admitting new players");
    }
    let Some(loadout) = config.loadouts.get(loadout_index) else {
        bail!("pending loadout no longer exists");
    };
    let mut result = candidate(
        &state.entities,
        &state.generation,
        content,
        config,
        owner,
        loadout,
        0,
        rng,
    );
    if result.is_none() && config.player_starts.fallback.generate_additional_systems {
        for _ in 0..config.player_starts.fallback.max_additional_systems {
            let mut trial = state.entities.clone();
            let origin = expansion_origin(&trial, &state.generation, config, rng);
            add_object(
                &mut trial,
                content,
                config,
                &config.solar_systems.anchor_type,
                origin,
                rng,
            );
            let anchor = trial.last().unwrap().clone();
            if !protected(&trial, &state.generation, content, config, &anchor) {
                continue;
            }
            system(&mut trial, content, config, origin, rng);
            result = candidate(
                &trial,
                &state.generation,
                content,
                config,
                owner,
                loadout,
                anchor.id + 1,
                rng,
            );
            if result.is_none() {
                place_object(
                    &mut trial,
                    content,
                    config,
                    origin,
                    &config.solar_systems.planets.placement,
                    Some(&config.player_starts.planet_type),
                    true,
                    rng,
                );
                result = candidate(
                    &trial,
                    &state.generation,
                    content,
                    config,
                    owner,
                    loadout,
                    anchor.id + 1,
                    rng,
                );
            }
            if result.is_some() {
                break;
            }
        }
    }
    let Some((entities, reservation)) = result else {
        bail!("no eligible start: exposure, food, spacing, hostile clearance, loadout geometry or mineral approach failed; bounded expansion exhausted or disabled");
    };
    state.entities = entities;
    state
        .generation
        .starts
        .insert(owner.to_string(), reservation);
    state.generation.pending.remove(owner);
    state
        .technologies
        .entry(owner.to_string())
        .or_default()
        .extend(
            content
                .technologies
                .iter()
                .filter_map(|(id, d)| d.granted_on_spawn.then_some(id.clone())),
        );
    Ok(())
}
/// Quantized eligibility revision prevents ordinary ticks/food regeneration from
/// continuously retrying failed expansion. Relevant threshold/cell changes retry.
pub fn start_revision(state: &GameState, config: &SpawnConfig) -> u64 {
    use std::hash::{Hash, Hasher};
    let mut hash = std::collections::hash_map::DefaultHasher::new();
    state.generation.version.hash(&mut hash);
    format!(
        "{:?}{:?}{:?}",
        config.exposure, config.solar_systems, config.player_starts
    )
    .hash(&mut hash);
    for loadout in &config.loadouts {
        let sorted: BTreeMap<_, _> = loadout.iter().collect();
        sorted.hash(&mut hash);
    }
    for (owner, start) in &state.generation.starts {
        owner.hash(&mut hash);
        start.planet_id.hash(&mut hash);
    }
    let mut entities: Vec<_> = state.entities.iter().collect();
    entities.sort_by_key(|e| e.id);
    for e in entities {
        if config.exposure.sources.contains_key(&e.entity_type_id)
            || e.entity_type_id == config.player_starts.planet_type
            || e.entity_type_id == "minerals"
            || e.owner_player_id != UNIVERSE_OWNER
        {
            e.id.hash(&mut hash);
            e.entity_type_id.hash(&mut hash);
            (e.health > 0.0).hash(&mut hash);
            ((pos(e)[0] / 1000.0).floor() as i64).hash(&mut hash);
            ((pos(e)[1] / 1000.0).floor() as i64).hash(&mut hash);
            if e.entity_type_id == config.player_starts.planet_type {
                eligible_planet(e, &state.entities, &state.generation, config).hash(&mut hash);
            }
            if e.entity_type_id == "minerals" {
                e.resource_deposit
                    .as_ref()
                    .is_some_and(|d| d.remaining >= config.player_starts.minerals.min_remaining)
                    .hash(&mut hash);
            }
        }
    }
    hash.finish()
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::{rngs::StdRng, SeedableRng};
    fn fixture() -> (ContentPack, SpawnConfig) {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let content = ContentPack::load(&root.join("packages/content/entities.yaml")).unwrap();
        let config =
            SpawnConfig::load(&root.join("services/rts-engine/config/spawn.yaml")).unwrap();
        config.validate_content(&content).unwrap();
        (content, config)
    }
    fn entity(content: &ContentPack, id: u64, kind: &str, p: [f32; 2]) -> Entity {
        neutral_entity(id, kind, p[0], p[1], content)
    }
    #[test]
    fn exposure_combines_theta_and_stars_and_is_finite_at_source() {
        let (content, mut config) = fixture();
        config.exposure.sources.insert("star_yellow".into(), 0.5);
        config.exposure.sources.insert("theta".into(), 0.5);
        let entities = vec![
            entity(&content, 2, "theta", [3750.0, 0.0]),
            entity(&content, 1, "star_yellow", [-3750.0, 0.0]),
        ];
        assert_eq!(exposure(&entities, &config.exposure, [0.0, 0.0]), 1.0);
        assert!(exposure(&entities, &config.exposure, [3750.0, 0.0]).is_finite());
        assert_eq!(
            exposure(&entities, &config.exposure, [0.0, 0.0]),
            exposure(
                &entities.iter().rev().cloned().collect::<Vec<_>>(),
                &config.exposure,
                [0.0, 0.0]
            )
        );
        let isolated = vec![entity(&content, 3, "star_yellow", [0.0, 0.0])];
        assert!(
            exposure(&entities, &config.exposure, [3750.0, 0.0])
                > exposure(&isolated, &config.exposure, [3750.0, 0.0])
        );
    }
    #[test]
    fn weights_interpolate_missing_types_and_clamp_endpoints() {
        let (_, mut config) = fixture();
        let table = &mut config.solar_systems.planets.type_weights;
        table.points = vec![
            crate::spawn_config::ExposurePoint {
                exposure: 1.0,
                weights: BTreeMap::from([("planet_ice".into(), 10.0)]),
            },
            crate::spawn_config::ExposurePoint {
                exposure: 3.0,
                weights: BTreeMap::from([("planet_blue".into(), 30.0)]),
            },
        ];
        let mid = planet_weights(table, 2.0);
        assert_eq!(mid["planet_ice"], 5.0);
        assert_eq!(mid["planet_blue"], 15.0);
        assert_eq!(planet_weights(table, 0.0), table.points[0].weights);
        assert_eq!(planet_weights(table, 9.0), table.points[1].weights);
    }
    #[test]
    fn generation_is_repeatable_and_places_all_source_fields_first() {
        let (content, config) = fixture();
        let mut a = Vec::new();
        let mut b = Vec::new();
        generate_world(&mut a, &content, &config, &mut StdRng::seed_from_u64(17));
        generate_world(&mut b, &content, &config, &mut StdRng::seed_from_u64(17));
        assert_eq!(a, b);
        let sources = config
            .global_neutral_fields
            .iter()
            .filter(|f| config.exposure.sources.contains_key(&f.entity_type_id))
            .map(|f| f.count)
            .sum::<usize>();
        assert!(a[..sources]
            .iter()
            .all(|e| config.exposure.sources.contains_key(&e.entity_type_id)));
        assert!(a[sources..]
            .iter()
            .all(|e| !config.exposure.sources.contains_key(&e.entity_type_id)));
        for i in sources..a.len() {
            let e = &a[i];
            assert!(clear(
                &a[..i],
                &content,
                pos(e),
                hull(&content, &e.entity_type_id),
                0.0
            ));
            assert!(radiation_safe(
                &a[..i],
                &content,
                pos(e),
                hull(&content, &e.entity_type_id),
                1.0
            ));
        }
    }
    #[test]
    fn systems_can_be_empty_or_repeat_one_planet_type() {
        let (content, mut config) = fixture();
        config.solar_systems.populations.clear();
        config.solar_systems.planets.count_weights = BTreeMap::from([(0, 1.0)]);
        let mut entities = vec![entity(&content, 1, "star_yellow", [0.0, 0.0])];
        system(
            &mut entities,
            &content,
            &config,
            [0.0, 0.0],
            &mut StdRng::seed_from_u64(1),
        );
        assert_eq!(entities.len(), 1);
        config.solar_systems.planets.count_weights = BTreeMap::from([(4, 1.0)]);
        for p in &mut config.solar_systems.planets.type_weights.points {
            p.weights = BTreeMap::from([("planet_ice".into(), 1.0)]);
        }
        system(
            &mut entities,
            &content,
            &config,
            [0.0, 0.0],
            &mut StdRng::seed_from_u64(2),
        );
        assert_eq!(entities.len(), 5);
        assert!(entities[1..]
            .iter()
            .all(|e| e.entity_type_id == "planet_ice"));
    }
    #[test]
    fn checked_in_world_supports_atomic_starts_and_unique_reservations() {
        let (content, config) = fixture();
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(21);
        generate_world(&mut state.entities, &content, &config, &mut rng);
        for owner in ["alice", "bob", "carol"] {
            spawn_player(&mut state, &content, &config, owner, 0, &mut rng).unwrap();
        }
        let starts: Vec<_> = state.generation.starts.values().collect();
        for (i, start) in starts.iter().enumerate() {
            assert!(config.player_starts.exposure.contains(exposure(
                &state.entities,
                &config.exposure,
                start.origin
            )));
            for other in &starts[..i] {
                assert_ne!(start.planet_id, other.planet_id);
                assert!(
                    distance(start.origin, other.origin)
                        >= config.player_starts.min_distance_between_starts
                );
            }
        }
        for owner in ["alice", "bob", "carol"] {
            let units: Vec<_> = state
                .entities
                .iter()
                .filter(|e| e.owner_player_id == owner)
                .collect();
            for (i, unit) in units.iter().enumerate() {
                for other in &units[..i] {
                    assert!(distance(pos(unit), pos(other)) >= config.min_entity_spawn_distance);
                }
            }
        }
        let before = state.entities.clone();
        spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).unwrap();
        assert_eq!(before, state.entities);
        for owner in ["alice", "bob", "carol"] {
            let habitat = state
                .entities
                .iter()
                .find(|e| e.owner_player_id == owner && e.entity_type_id == "habitat")
                .unwrap();
            assert_eq!(
                super::super::state::resource_amount(habitat, "food"),
                config.starting_resources["food"] as f64
            );
        }
    }
    #[test]
    fn expansion_supplies_a_start_without_leaving_failed_systems() {
        let (content, mut config) = fixture();
        config.solar_systems.planets.count_weights = BTreeMap::from([(0, 1.0)]);
        config.solar_systems.populations.clear();
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(13);
        spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).unwrap();
        assert_eq!(
            state
                .entities
                .iter()
                .filter(|e| e.entity_type_id == "star_yellow")
                .count(),
            1
        );
        let before = state.entities.clone();
        config.player_starts.exposure.min = 1000.0;
        config.player_starts.exposure.max = 1001.0;
        let reservations = serde_json::to_string(&state.generation).unwrap();
        assert!(spawn_player(&mut state, &content, &config, "bob", 0, &mut rng).is_err());
        assert_eq!(state.entities, before);
        assert_eq!(
            serde_json::to_string(&state.generation).unwrap(),
            reservations
        );
    }
    #[test]
    fn depleted_planets_unsafe_starts_and_legacy_worlds_are_rejected() {
        let (content, mut config) = fixture();
        config.player_starts.fallback.generate_additional_systems = false;
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(3);
        add_object(
            &mut state.entities,
            &content,
            &config,
            "star_yellow",
            [0.0, 0.0],
            &mut rng,
        );
        add_object(
            &mut state.entities,
            &content,
            &config,
            "planet_blue",
            [3750.0, 0.0],
            &mut rng,
        );
        let planet = state.entities.last_mut().unwrap();
        planet.resource_deposit.as_mut().unwrap().remaining = 0.0;
        assert!(spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).is_err());
        state
            .entities
            .last_mut()
            .unwrap()
            .resource_deposit
            .as_mut()
            .unwrap()
            .remaining = 10000.0;
        assert!(spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).is_ok());
        let reserved = &state.generation.starts["alice"];
        assert!(!eligible_planet(
            &state
                .entities
                .iter()
                .find(|e| e.id == reserved.planet_id)
                .unwrap(),
            &state.entities,
            &state.generation,
            &config
        ));
        state.generation.version = 0;
        assert!(
            spawn_player(&mut state, &content, &config, "bob", 0, &mut rng)
                .unwrap_err()
                .to_string()
                .contains("backfill")
        );
    }
    #[test]
    fn starts_reuse_minerals_and_missing_minerals_are_transactional() {
        let (content, mut config) = fixture();
        config.player_starts.fallback.generate_additional_systems = false;
        config.player_starts.minerals.create_if_missing = false;
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(42);
        add_object(
            &mut state.entities,
            &content,
            &config,
            "star_yellow",
            [0.0, 0.0],
            &mut rng,
        );
        add_object(
            &mut state.entities,
            &content,
            &config,
            "planet_blue",
            [3750.0, 0.0],
            &mut rng,
        );
        let initial = state.entities.clone();
        assert!(spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).is_err());
        assert_eq!(state.entities, initial);
        add_object(
            &mut state.entities,
            &content,
            &config,
            "minerals",
            [5000.0, 0.0],
            &mut rng,
        );
        spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).unwrap();
        assert_eq!(
            state
                .entities
                .iter()
                .filter(|e| e.entity_type_id == "minerals")
                .count(),
            1
        );
    }

    #[test]
    fn hostile_clearance_and_impossible_loadouts_reject_without_mutation() {
        let (content, mut config) = fixture();
        config.player_starts.fallback.generate_additional_systems = false;
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(31);
        add_object(
            &mut state.entities,
            &content,
            &config,
            "star_yellow",
            [0.0, 0.0],
            &mut rng,
        );
        add_object(
            &mut state.entities,
            &content,
            &config,
            "planet_blue",
            [3750.0, 0.0],
            &mut rng,
        );
        let mut enemy = entity(&content, next_id(&state.entities), "raider", [3750.0, 0.0]);
        enemy.owner_player_id = crate::spawn_config::RAIDERS_OWNER.into();
        state.entities.push(enemy);
        let initial = state.entities.clone();
        assert!(spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).is_err());
        assert_eq!(state.entities, initial);
        state.entities.pop();
        config.min_entity_spawn_distance = 0.0;
        config.max_entity_spawn_distance = 0.0;
        let initial = state.entities.clone();
        assert!(spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).is_err());
        assert_eq!(state.entities, initial);
    }

    #[test]
    fn added_sources_cannot_invalidate_reserved_starts() {
        let (content, config) = fixture();
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(19);
        spawn_player(&mut state, &content, &config, "alice", 0, &mut rng).unwrap();
        let p = state.generation.starts["alice"].origin;
        let anchor = entity(&content, next_id(&state.entities), "star_yellow", p);
        let mut trial = state.entities.clone();
        trial.push(anchor.clone());
        assert!(!protected(
            &trial,
            &state.generation,
            &content,
            &config,
            &anchor
        ));
    }
    #[test]
    fn revisions_ignore_tick_and_stock_changes_that_do_not_cross_thresholds() {
        let (content, config) = fixture();
        let mut state = super::super::state::init_world(&config);
        let mut rng = StdRng::seed_from_u64(4);
        add_object(
            &mut state.entities,
            &content,
            &config,
            "star_yellow",
            [0.0, 0.0],
            &mut rng,
        );
        add_object(
            &mut state.entities,
            &content,
            &config,
            "planet_blue",
            [3750.0, 0.0],
            &mut rng,
        );
        let revision = start_revision(&state, &config);
        state.tick += 1;
        state
            .entities
            .last_mut()
            .unwrap()
            .resource_deposit
            .as_mut()
            .unwrap()
            .remaining -= 1.0;
        assert_eq!(revision, start_revision(&state, &config));
        state
            .entities
            .last_mut()
            .unwrap()
            .resource_deposit
            .as_mut()
            .unwrap()
            .remaining = 0.0;
        assert_ne!(revision, start_revision(&state, &config));
    }
}
