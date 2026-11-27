use std::collections::{BTreeMap, HashSet};
use std::path::Path;

use anyhow::{bail, ensure, Context, Result};
use serde::{Deserialize, Serialize};

use crate::combat::CombatRect;
use crate::content::{AttackType, ContentPack, EntityTypeDef};
use crate::content_revision::{valid_hash, Revision};
use crate::pb::{Entity, Vec2};

pub(super) const MAX_UNITS: usize = 64;
const MAX_WEAPONS: usize = 16;
const MAX_RANGE: f32 = 20_000.0;
const MAX_SPEED: f32 = 20_000.0;
const MAX_HP: f32 = 1_000_000.0;
const MAX_COOLDOWN: u64 = 2_400;

#[derive(Clone, Copy, Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct Bounds {
    pub(crate) width: f32,
    pub(crate) height: f32,
}

impl Bounds {
    pub(super) fn rect(self) -> CombatRect {
        CombatRect { x: f64::from(self.width) / 2.0, y: f64::from(self.height) / 2.0 }
    }
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub(super) enum Team { A, B }

impl Team {
    pub(super) fn owner(self) -> &'static str {
        match self { Self::A => "battle-a", Self::B => "battle-b" }
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Placement {
    pub(super) id: String,
    pub(super) team: Team,
    pub(super) type_id: String,
    pub(super) x: f32,
    pub(super) y: f32,
    pub(super) variant_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct WeaponOverride {
    id: String,
    damage: Option<f32>,
    range: Option<f32>,
    cooldown_ticks: Option<u64>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Variant {
    id: String,
    name: String,
    type_id: String,
    health: Option<f32>,
    speed: Option<f32>,
    acquisition_range: Option<f32>,
    weapons: Vec<WeaponOverride>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Draft {
    version: u32,
    pub(super) revision: String,
    pub(super) bounds: Bounds,
    placements: Vec<Placement>,
    variants: Vec<Variant>,
}

fn valid_key(s: &str) -> bool {
    !s.is_empty() && s.len() <= 64 && s.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

fn stat(label: &str, n: f32, min: f32, max: f32) -> Result<()> {
    ensure!(n.is_finite() && (min..=max).contains(&n), "{label} must be between {min} and {max}.");
    Ok(())
}

fn validate_definition(def: &EntityTypeDef) -> Result<()> {
    stat("Health (HP)", def.health, 0.01, MAX_HP)?;
    stat("Speed (world units/sec)", def.speed, 0.0, MAX_SPEED)?;
    stat("Hull radius", def.hull_radius, 0.0, 2_000.0)?;
    if let Some(profile) = &def.combat {
        stat("Acquisition range", profile.acquisition_range, 0.0, MAX_RANGE)?;
        ensure!(profile.attacks.len() <= MAX_WEAPONS, "At most {MAX_WEAPONS} weapons per unit.");
        for attack in &profile.attacks {
            ensure!(valid_key(&attack.id), "Invalid weapon ID {}.", attack.id);
            stat("Weapon damage", attack.damage, if attack.attack_type == AttackType::Kinetic { 0.01 } else { 0.0 }, MAX_HP)?;
            ensure!(attack.cooldown_ticks <= MAX_COOLDOWN, "Weapon cooldown cannot exceed {MAX_COOLDOWN} ticks.");
            if attack.attack_type == AttackType::Dismantle {
                stat("Contact tolerance", attack.contact_tolerance.max(0.0), 0.0, 2_000.0)?;
            } else {
                stat("Weapon range", attack.range, if attack.attack_type == AttackType::Kinetic { 0.01 } else { 0.0 }, MAX_RANGE)?;
            }
            if let Some(projectile) = &attack.projectile {
                stat("Projectile speed", projectile.speed, 0.01, 40_000.0)?;
                stat("Projectile travel", projectile.max_travel_distance, 0.01, MAX_RANGE)?;
                stat("Projectile spread", projectile.error_radians, 0.0, std::f32::consts::TAU)?;
            }
        }
    }
    Ok(())
}

fn placeable(def: &EntityTypeDef) -> bool {
    def.combat_targetable || def.combat.as_ref().is_some_and(|profile| !profile.attacks.is_empty())
}

fn base<'a>(pack: &'a ContentPack, id: &str) -> Result<&'a EntityTypeDef> {
    ensure!(crate::content_revision::valid_id(id), "'{id}' is not an authored type ID.");
    pack.get(id).filter(|def| placeable(def)).with_context(|| format!("'{id}' is not a combat unit in this revision."))
}

impl Variant {
    fn apply(&self, pack: &ContentPack) -> Result<EntityTypeDef> {
        let mut def = base(pack, &self.type_id)?.clone();
        if let Some(health) = self.health { def.health = health; }
        if let Some(speed) = self.speed { def.speed = speed; }
        if let Some(range) = self.acquisition_range {
            def.combat.as_mut().context("This unit has no acquisition range.")?.acquisition_range = range;
        }
        ensure!(self.weapons.len() <= MAX_WEAPONS, "At most {MAX_WEAPONS} weapon overrides per variant.");
        let mut seen = HashSet::new();
        for overrides in &self.weapons {
            ensure!(seen.insert(&overrides.id), "Duplicate weapon override '{}'.", overrides.id);
            let attack = def.combat.as_mut().and_then(|p| p.attacks.iter_mut().find(|a| a.id == overrides.id))
                .with_context(|| format!("Weapon '{}' is not part of {}.", overrides.id, self.type_id))?;
            if let Some(n) = overrides.damage { attack.damage = n; }
            if let Some(n) = overrides.cooldown_ticks {
                ensure!(n >= 1, "Cooldown must be at least one tick.");
                attack.cooldown_ticks = n;
            }
            if let Some(n) = overrides.range {
                ensure!(attack.attack_type != AttackType::Dismantle, "Dismantle uses hull contact, not a ranged override.");
                attack.range = n;
            }
        }
        validate_definition(&def)?;
        Ok(def)
    }
}

impl Draft {
    pub(super) fn validate_shape(&self) -> Result<()> {
        ensure!(self.version == 1, "Unsupported draft version. Recreate the setup in this build.");
        ensure!(valid_hash(&self.revision), "Pin a valid SHA-256 content revision first.");
        stat("Arena width", self.bounds.width, 1.0, MAX_RANGE)?;
        stat("Arena height", self.bounds.height, 1.0, MAX_RANGE)?;
        ensure!(self.placements.len() <= MAX_UNITS && self.variants.len() <= MAX_UNITS,
            "Use at most {MAX_UNITS} placements and {MAX_UNITS} variants.");
        for team in [Team::A, Team::B] {
            ensure!(self.placements.iter().any(|p| p.team.owner() == team.owner()), "Place at least one unit on each team.");
        }
        Ok(())
    }

    pub(super) fn materialize(self, pack: &mut ContentPack) -> Result<Vec<Entity>> {
        let mut variants = BTreeMap::new();
        for (index, variant) in self.variants.iter().enumerate() {
            ensure!(valid_key(&variant.id) && !variants.contains_key(&variant.id), "Invalid or duplicate variant ID '{}'.", variant.id);
            ensure!(!variant.name.trim().is_empty() && variant.name.chars().count() <= 64 && !variant.name.chars().any(char::is_control),
                "Variant names must be 1–64 characters without control characters.");
            let def = variant.apply(pack).with_context(|| format!("Variant '{}':", variant.name))?;
            // Authored keys cannot contain a colon. Keep the stable weapon IDs unchanged.
            let key = format!("battle:{index}");
            pack.entity_types.insert(key.clone(), def);
            variants.insert(&variant.id, (&variant.type_id, key));
        }
        let mut seen = HashSet::new();
        let mut entities = Vec::with_capacity(self.placements.len());
        let rect = self.bounds.rect();
        for (index, placement) in self.placements.iter().enumerate() {
            ensure!(valid_key(&placement.id) && seen.insert(&placement.id), "Invalid or duplicate placement ID '{}'.", placement.id);
            ensure!(crate::content_revision::valid_id(&placement.type_id), "Unknown unit type for '{}'.", placement.id);
            let (key, def) = if let Some(id) = &placement.variant_id {
                let Some((base_id, key)) = variants.get(id) else { bail!("Unit '{}': unknown variant '{id}'.", placement.id); };
                ensure!(**base_id == placement.type_id, "Unit '{}': variant belongs to a different base type.", placement.id);
                (key, &pack.entity_types[key])
            } else {
                let def = base(pack, &placement.type_id)?;
                validate_definition(def).with_context(|| format!("Unit '{}':", placement.id))?;
                (&placement.type_id, def)
            };
            let r = f64::from(def.hull_radius);
            ensure!(f64::from(placement.x).abs() <= rect.x - r && f64::from(placement.y).abs() <= rect.y - r,
                "Unit '{}' ({}) must fit entirely inside the arena. Move it or enlarge the arena.", placement.id, placement.type_id);
            entities.push(Entity {
                id: index as u64 + 1,
                entity_type_id: key.clone(),
                owner_player_id: placement.team.owner().into(),
                health: def.health,
                pos: Some(Vec2 { x: placement.x, y: placement.y }),
                ..Default::default()
            });
        }
        Ok(entities)
    }
}

pub(super) fn load_revision(root: &Path, revision: &str) -> Result<Revision> {
    // Keep in sync with Next's BATTLE_REVISION_LIMITS.
    const MIB: usize = 1024 * 1024;
    Revision::load_bounded(root, revision, MIB / 2, 2 * MIB, 16 * MIB).map_err(|error| anyhow::anyhow!(
        "Revision {revision} is unavailable: {error:#}. Restore its manifest and bundles in the sandbox revision directory, or open another setup."
    ))
}

#[derive(Serialize)]
struct Unit<'a> {
    id: &'a str,
    health: f32,
    speed: f32,
    hull_radius: f32,
    targetable: bool,
    combat: &'a Option<crate::content::CombatDef>,
    sprite: bool,
    unavailable: Option<String>,
}

pub(super) fn catalog(root: &Path, revision: &str) -> Result<Vec<u8>> {
    let revision = load_revision(root, revision)?;
    let units: Vec<_> = revision.manifest.entities.iter().filter_map(|(id, entry)| {
        let def = revision.pack.get(id).filter(|def| placeable(def))?;
        Some(Unit {
            id, health: def.health, speed: def.speed, hull_radius: def.hull_radius, targetable: def.combat_targetable,
            combat: &def.combat, sprite: entry.files.contains_key("idle.png"),
            unavailable: validate_definition(def).err().map(|e| e.to_string()),
        })
    }).collect();
    Ok(serde_json::to_vec(&serde_json::json!({"revision": revision.pack.content_hash, "units": units}))?)
}
