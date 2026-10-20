//! M4: Content pack loader and content hash.
//!
//! Loads entity type definitions from a YAML file at startup and computes a
//! deterministic content hash from the canonicalized JSON representation.
//! The YAML format is for human authoring only — all derived artifacts (hash,
//! API responses, client bundles) use JSON.

use std::collections::{HashMap, HashSet};
use std::path::Path;

use anyhow::{Context, Result};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// A loaded content pack with entity and resource type definitions and a content hash.
#[derive(Clone, Debug)]
pub struct ContentPack {
    pub entity_types: HashMap<String, EntityTypeDef>,
    /// M7: Resource type definitions for display (id → display_name, order).
    pub resource_types: HashMap<String, ResourceTypeDef>,
    pub technologies: HashMap<String, TechnologyDef>,
    /// Hex-encoded xxh3-64 hash of the canonicalized JSON representation.
    pub content_hash: String,
}

/// Per-entity-type definition loaded from the content YAML.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct EntityTypeDef {
    /// Client behavior when this entity leaves sensor coverage.
    pub fog_memory: FogMemory,
    /// Maximum movement speed in world units per second.
    pub speed: f32,
    /// Distance from a movement target at which this entity stops, in world units.
    pub stop_radius: f32,
    /// Mass used to convert random physics forces to acceleration (force / mass). Use a positive value.
    pub mass: f32,
    /// Hull hit points before the entity is destroyed.
    pub health: f32,
    /// Per-resource physical depot stock or carrier cargo capacity. Ordinary consumers may omit this.
    #[serde(default)]
    pub max_capacity: HashMap<String, f32>,
    /// Enables a physical stockpile that nearby friendly consumers may spend from.
    #[serde(default)]
    pub depot: bool,
    /// Service radius; required and positive when depot is true. Never links depot inventories.
    #[serde(default)]
    pub depot_range: f32,
    /// DEPRECATED: ignored by depot logistics. Cargo has no protected upkeep reserve.
    #[schemars(extend("deprecated" = true))]
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub resource_reserves: HashMap<String, f64>,
    /// DEPRECATED: ignored. Configure depot and depot_range; ship stock between depots.
    #[schemars(extend("deprecated" = true))]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_sharing: Option<ResourceSharingDef>,
    /// Physical hull radius in world units used by contact attacks. Defaults to 0.
    /// Independent of visual scale and movement-order stop radius.
    #[serde(default)]
    pub hull_radius: f32,
    /// Optional autonomous-combat profile. When present, the server acquires
    /// nearby hostile entities and drives the unit according to its strategy.
    #[serde(default)]
    pub combat: Option<CombatDef>,
    /// Whether autonomous combat may select this entity type as a target.
    /// Defaults to false so scenery and resource entities are safe by default.
    #[serde(default, skip_serializing_if = "is_false")]
    pub combat_targetable: bool,
    /// Client-only presentation settings for the entity's rendered sprite.
    #[serde(default, skip_serializing_if = "VisualDef::is_default")]
    pub visual: VisualDef,
    /// Draw order within the world layer. Higher values render in front.
    #[serde(default, skip_serializing_if = "is_default_z_index")]
    pub z_index: i32,
    /// Whether the client should suppress hover UI for this entity type.
    #[serde(default, skip_serializing_if = "is_false")]
    pub suppress_hover: bool,
    /// Optional automatic resource collection capabilities. Omit to disable collection.
    #[serde(default)]
    pub collector: Option<CollectorDef>,
    /// Optional resource-powered repair ability.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub repair: Option<RepairDef>,
    /// Optional resource source that collectors can gather from.
    #[serde(default)]
    pub resource_node: Option<ResourceNodeDef>,
    /// DEPRECATED: ignored. Depot status and positive max_capacity define collection drop-offs.
    #[schemars(extend("deprecated" = true))]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub refinery: Option<RefineryDef>,
    /// Environmental hazard emitters attached to this entity type.
    #[serde(default)]
    pub radiation_sources: Vec<RadiationSourceDef>,
    /// Shielding keyed by radiation type ID. Missing types use zero distance offset and a damage multiplier of 1.
    #[serde(default)]
    pub radiation_shielding: HashMap<String, RadiationShieldingDef>,
    /// Total construction or upgrade cost, paid upfront from one depot or remote carrier cargo.
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub build_cost: HashMap<String, f32>,
    /// Upkeep in resource units per minute, keyed by resource ID. Added to sensor operating costs.
    /// Paid atomically from the associated depot. Shortage pauses powered capabilities without damage or debt.
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub maintenance_cost_per_minute: HashMap<String, f32>,
    /// Optional area sensor. Its depot-paid operating costs are charged continuously; unpaid sensors pause.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sensor: Option<SensorDef>,
    /// Distance in world units at which this entity can be detected from an owned sensor source.
    /// Detection uses the larger of this value and the source's sensor range. Omitted means 0.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visibility_range: Option<f32>,
    /// Units this entity type can produce.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub builds: Vec<BuildOptionDef>,
    /// Entity types this entity may transform into through an upgrade channel.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub upgrades: Vec<UpgradeOptionDef>,
    /// Technologies the player must own before building or upgrading into this type.
    /// Use a technology ID or nested all/any groups; omitted means no prerequisites.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub requires_technologies: Option<TechnologyRequirement>,
    /// Technology IDs this entity can research. Omitted or empty means it cannot perform research.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub researches: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct ResourceSharingDef {
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub range: f32,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub wireless_receives: Vec<String>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub resources: HashMap<String, ResourceSharingPolicy>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct ResourceSharingPolicy {
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub priority: i32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub overflow_priority: Option<i32>,
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub refill_below: f64,
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub fill_to: f64,
    /// DEPRECATED: retained for legacy content decoding; ignored by depot logistics.
    #[schemars(extend("deprecated" = true))]
    pub reserve: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(untagged)]
pub enum TechnologyRequirement {
    /// ID of a technology the player must own.
    Technology(String),
    All {
        /// All listed prerequisites must be satisfied. Use a non-empty list of technology IDs or nested all/any groups.
        all: Vec<TechnologyRequirement>,
    },
    Any {
        /// At least one listed prerequisite must be satisfied. Use a non-empty list of technology IDs or nested all/any groups.
        any: Vec<TechnologyRequirement>,
    },
}

impl TechnologyRequirement {
    pub fn is_satisfied_by(&self, owned: &HashSet<String>) -> bool {
        match self {
            Self::Technology(id) => owned.contains(id),
            Self::All { all } => all
                .iter()
                .all(|requirement| requirement.is_satisfied_by(owned)),
            Self::Any { any } => any
                .iter()
                .any(|requirement| requirement.is_satisfied_by(owned)),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct TechnologyDef {
    /// Player-facing name shown in the research UI.
    pub display_name: String,
    /// Grant this technology to every player at spawn; it cannot have a research cost.
    #[serde(default)]
    pub granted_on_spawn: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    /// Prerequisite technology or an all/any group of prerequisites.
    pub requires: Option<TechnologyRequirement>,
    /// Total research cost, keyed by resource ID. Spent progressively at research_rates until research completes.
    /// Spawn-granted technologies must omit this; researchable technologies need a non-empty cost.
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub research_cost: HashMap<String, f32>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    /// Research spending in resource units per second, keyed by resource ID. Missing resources default to 1/s.
    /// Completion time is the largest cost/rate; insufficient resources pause progress.
    pub research_rates: HashMap<String, f32>,
    /// Ordered effects used when calculating the owning player's sensor coverage while this technology is owned,
    /// including technologies granted at spawn. Omitted means no stat changes (the technology can still unlock prerequisites).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub effects: Vec<TechnologyEffect>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct TechnologyEffect {
    /// Property modified for the owning player. Only `entity.sensor.range` is supported.
    /// Applied to every owned entity's base sensor range (0 if absent), so an additive effect can create sensor coverage.
    pub target: String,
    /// How the value changes the target: add, multiply, set, or cap.
    pub operation: TechnologyEffectOperation,
    /// Finite operand: world units for add/set/cap of sensor range, or a dimensionless factor for multiply.
    pub value: f32,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum TechnologyEffectOperation {
    /// Adds value to the current target value.
    Add,
    /// Multiplies the current target value by value.
    Multiply,
    /// Replaces the current target value with value.
    Set,
    /// Sets the target to the smaller of its current value and value (an upper limit).
    Cap,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CollectionEffect {
    /// Solar collection particle presentation. Visual only; does not select the resource collection mode.
    SolarProximity,
    /// Mineral transport particle presentation. Visual only; does not select the resource collection mode.
    MineralTransport,
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum FogMemory {
    /// Keep the last observed entity state after it leaves sensor coverage.
    RetainLastKnown,
    /// Remove the entity from the client's visible state when it leaves sensor coverage.
    #[default]
    ForgetWhenHidden,
}

/// Data needed for server-authoritative autonomous combat.
///
/// Timings are ticks, rather than seconds, so a combat replay is a pure
/// function of the content version and tick stream.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct CombatDef {
    /// Maximum distance at which this unit acquires a hostile target.
    pub acquisition_range: f32,
    /// How this unit responds after acquiring a nearby hostile.
    #[serde(default)]
    pub on_near_enemy_strategy: NearEnemyStrategy,
    /// Weapons available to this entity. Their stable IDs also key cooldowns.
    pub attacks: Vec<AttackDef>,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct AttackDef {
    /// Stable weapon ID within this entity type; identifies its cooldown and breaks equal-priority ties alphabetically.
    pub id: String,
    /// Weapon behavior: laser uses range; dismantle uses both hull radii plus contact_tolerance.
    #[serde(rename = "type")]
    pub attack_type: AttackType,
    /// Maximum center-to-center laser distance in world units. Defaults to 0; ignored for dismantle.
    #[serde(default)]
    pub range: f32,
    /// Hit points removed per successful attack, not per second.
    pub damage: f32,
    /// Simulation ticks before this weapon can fire again. Values below 1 are treated as 1.
    pub cooldown_ticks: u64,
    /// Higher numbers win among weapons in range; ties use the alphabetically first ID. Defaults to 0.
    #[serde(default)]
    pub priority: i32,
    /// Extra distance in world units beyond the sum of both hull radii for dismantle. Defaults to 0; negative values act as 0.
    #[serde(default)]
    pub contact_tolerance: f32,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum AttackType {
    /// Ranged attack using the weapon's range in world units.
    Laser,
    /// Contact attack within attacker hull radius + target hull radius + contact_tolerance.
    Dismantle,
}

/// Autonomous movement response to a nearby hostile entity.
#[derive(Clone, Copy, Debug, Default, Serialize, Deserialize, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum NearEnemyStrategy {
    /// Move into weapon range, then fire. This preserves existing NPC behavior.
    #[default]
    Approach,
    /// Move directly away from the nearest hostile without firing.
    Flee,
    /// Do not move; fire only if the hostile is already in weapon range.
    Stay,
}

/// One content-defined production option available to a builder.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct BuildOptionDef {
    /// ID of the entity type this entity can build.
    pub entity_type_id: String,
    /// DEPRECATED: legacy build-time fallback only. Use duration_seconds; construction is paid upfront.
    #[schemars(extend("deprecated" = true))]
    #[serde(default)]
    pub spend_rates: HashMap<String, f32>,
    /// Seconds to construct/upgrade after upfront payment. Required for new content.
    #[serde(default)]
    pub duration_seconds: Option<f32>,
}

/// One content-defined in-place transformation available to an entity.
///
/// The target type's build_cost is paid upfront; duration_seconds controls progress.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct UpgradeOptionDef {
    /// ID of the entity type this entity transforms into.
    pub entity_type_id: String,
    /// DEPRECATED: legacy upgrade-time fallback only. Use duration_seconds; upgrades are paid upfront.
    #[schemars(extend("deprecated" = true))]
    #[serde(default)]
    pub spend_rates: HashMap<String, f32>,
    /// Seconds to construct/upgrade after upfront payment. Required for new content.
    #[serde(default)]
    pub duration_seconds: Option<f32>,
}

/// Client-only sprite presentation settings.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct VisualDef {
    /// Multiplier for the entity's rendered size.
    #[serde(
        default = "default_visual_scale",
        skip_serializing_if = "is_default_visual_scale"
    )]
    pub scale: f32,
    /// Clockwise rotation in degrees from the asset's native right-facing direction. Defaults to 0.
    #[serde(default, skip_serializing_if = "is_default_rotate_deg")]
    pub rotate_deg: f32,
}

impl Default for VisualDef {
    fn default() -> Self {
        Self {
            scale: default_visual_scale(),
            rotate_deg: 0.0,
        }
    }
}

impl VisualDef {
    fn is_default(visual: &Self) -> bool {
        is_default_visual_scale(&visual.scale) && is_default_rotate_deg(&visual.rotate_deg)
    }
}

/// Content-defined sensor available to any entity type.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct SensorDef {
    /// Per-resource operating cost, in units per minute.
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub cost_per_minute: HashMap<String, f32>,
    /// Circular detection radius in world units. For autonomous combat units,
    /// this should be at least `combat.acquisition_range`.
    pub range: f32,
}

#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct RepairDef {
    /// Maximum center-to-center repair distance in world units.
    pub range: f32,
    /// Resource costs while actively repairing, in units per minute.
    pub cost_per_min: HashMap<String, f32>,
    /// Health restored per total resource unit consumed.
    pub efficiency: f32,
}

/// M7: Per-resource-type definition for display (name, order) in HUD.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ResourceTypeDef {
    pub display_name: String,
    #[serde(default)]
    pub order: i32,
}

fn default_visual_scale() -> f32 {
    1.0
}

fn is_default_visual_scale(scale: &f32) -> bool {
    *scale == default_visual_scale()
}

fn is_default_rotate_deg(rotate_deg: &f32) -> bool {
    *rotate_deg == 0.0
}

fn is_default_z_index(z_index: &i32) -> bool {
    *z_index == 0
}

fn is_false(value: &bool) -> bool {
    !*value
}

/// Collection mode for a resource source.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum CollectionMode {
    /// Gather into the collector's cargo, then deliver to an accepting refinery to credit the owner's resources.
    Transport,
    /// Credit the owner's resources directly while a collector remains within the source's effective distance band.
    Proximity,
}

/// Automatic resource collector capabilities and rates.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct CollectorDef {
    /// Client presentation profile for collection particle effects.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub vfx: Option<CollectionEffect>,
    /// Resource type ids this collector can gather.
    #[serde(default)]
    pub collects: Vec<String>,
    /// Units/second gathered into local inventory in transport mode while in gather band.
    /// Zero disables transport collection and maintained resource transport. Limited by max_capacity.
    #[serde(default = "default_transport_rate_per_second")]
    pub transport_rate_per_second: f32,
    /// Units/second gathered in proximity mode while in effective band.
    #[serde(default = "default_proximity_rate_per_second")]
    pub proximity_rate_per_second: f32,
    /// DEPRECATED: ignored. Collectors deliver to any compatible same-owner depot.
    #[schemars(extend("deprecated" = true))]
    #[serde(default)]
    pub deposit_entity_types: Vec<String>,
    /// Optional same-owner spacing required before proximity collection credits resources.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub minimum_distance: Option<MinimumDistanceDef>,
}

/// Same-owner entity types a collector must remain away from while collecting.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct MinimumDistanceDef {
    /// Inclusive center-to-center distance in world units.
    pub value: f32,
    /// Entity types that participate in the same-owner distance check.
    pub entity_types: Vec<String>,
    /// Delay before retrying collection after another collector blocks it.
    pub retry_after_ms: u64,
}

/// Resource source profile for entity types that can be gathered from.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct ResourceNodeDef {
    /// Initial finite resource stock. Omitted means unlimited; spawn configuration may override it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub amount: Option<f64>,
    /// Optional stock-dependent regeneration; omitted means no regrowth.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub regeneration: Option<ResourceRegenerationDef>,
    /// Replace this entity in place when its finite deposit reaches zero.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub depleted_entity_type_id: Option<String>,
    /// Resource ID produced by this source; must be included in the collector's collects list.
    pub resource_type: String,
    /// Whether gathering fills cargo for delivery (transport) or credits resources directly (proximity).
    pub collection_mode: CollectionMode,
    /// Maximum transport collectors gathering at this resource entity at once.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_simultaneous_collectors: Option<u32>,
    /// Inner center-to-center gathering distance in world units, inclusive. Defaults to 0.
    #[serde(default)]
    pub min_effective_distance: f32,
    /// Outer center-to-center gathering distance in world units, inclusive. Defaults to 120 and is clamped to at least the inner distance.
    #[serde(default = "default_max_effective_distance")]
    pub max_effective_distance: f32,
}

/// Regeneration uses x = remaining / the planet's sampled maximum stock.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "model", rename_all = "snake_case", deny_unknown_fields)]
pub enum ResourceRegenerationDef {
    Hill {
        /// Rate at full stock for the normalized Hill curve, in resource units/second.
        #[schemars(extend("exclusiveMinimum" = 0))]
        max_rate_per_second: f64,
        /// Underlying Hill half-saturation fraction; normalization makes the rate
        /// here slightly greater than half the rate at full stock.
        #[schemars(range(max = 1.0), extend("exclusiveMinimum" = 0))]
        half_saturation_fraction: f64,
        /// Positive Hill exponent controlling the steepness of the decline.
        #[schemars(extend("exclusiveMinimum" = 0))]
        exponent: f64,
    },
}

impl ResourceRegenerationDef {
    pub fn rate_per_second(&self, fraction: f64) -> f64 {
        match *self {
            Self::Hill { max_rate_per_second, half_saturation_fraction, exponent } => {
                let x = fraction.clamp(0.0, 1.0);
                if x <= 0.0 { return 0.0; }
                // Equivalent to x^n(1+a^n)/(x^n+a^n), avoiding 0/0
                // when both powers underflow for large valid exponents.
                max_rate_per_second * (1.0 + half_saturation_fraction.powf(exponent))
                    / (1.0 + (half_saturation_fraction / x).powf(exponent))
            }
        }
    }
}

/// Drop-off point for transported resources.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct RefineryDef {
    /// DEPRECATED: ignored. Positive depot max_capacity entries define accepted resources.
    #[schemars(extend("deprecated" = true))]
    #[serde(default)]
    pub accepts: Vec<String>,
}

/// Environmental radiation emitted by an entity type.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct RadiationSourceDef {
    /// Radiation type ID used to look up the target's radiation_shielding entry.
    pub radiation_type: String,
    /// Optional min-effective-distance range outline color: 3 or 6 hex digits, e.g. "#f80" or "#ff8800".
    /// Quote values beginning with # in YAML. Omitted means no outline; visual only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min_effective_distance_border_color: Option<String>,
    /// Optional min-effective-distance range fill color: 3 or 6 hex digits, e.g. "#f80" or "#ff8800".
    /// Quote values beginning with # in YAML. Omitted means no fill; visual only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min_effective_distance_fill_color: Option<String>,
    /// Optional full-damage-distance range outline color: 3 or 6 hex digits, e.g. "#f80" or "#ff8800".
    /// Quote values beginning with # in YAML. Omitted means no outline; visual only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub full_damage_distance_border_color: Option<String>,
    /// Optional full-damage-distance range fill color: 3 or 6 hex digits, e.g. "#f80" or "#ff8800".
    /// Quote values beginning with # in YAML. Omitted means no fill; visual only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub full_damage_distance_fill_color: Option<String>,
    /// Optional max-effective-distance range outline color: 3 or 6 hex digits, e.g. "#f80" or "#ff8800".
    /// Quote values beginning with # in YAML. Omitted means no outline; visual only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_effective_distance_border_color: Option<String>,
    /// Optional max-effective-distance range fill color: 3 or 6 hex digits, e.g. "#f80" or "#ff8800".
    /// Quote values beginning with # in YAML. Omitted means no fill; visual only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max_effective_distance_fill_color: Option<String>,
    /// Inner damage radius in world units; targets closer than this take no damage. Defaults to 0. Shielding adjusts distance first.
    #[serde(default)]
    pub min_effective_distance: f32,
    /// Outer damage radius in world units; targets beyond this take no damage. Defaults to 120; clamped to at least the inner radius.
    #[serde(default = "default_max_effective_distance")]
    pub max_effective_distance: f32,
    /// End of the full-strength damage band in world units. Damage then falls linearly to zero at max_effective_distance.
    /// Defaults to 0 and is clamped between the inner and outer radii.
    #[serde(default)]
    pub full_damage_distance: f32,
    /// Hit points removed per second within the full-strength band, before shielding. Defaults to 0 (no damage).
    #[serde(default)]
    pub damage_per_second: f32,
}

/// Per-radiation-type shielding profile for an entity type.
#[derive(Clone, Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct RadiationShieldingDef {
    /// World units added to actual source distance before checking radiation bands and falloff.
    /// Defaults to 0; negative values act as 0.
    #[serde(default)]
    pub distance_offset: f32,
    /// Multiplier for incoming radiation damage after distance adjustment. Defaults to 1; 0 gives immunity.
    /// Negative values act as 0.
    #[serde(default = "default_damage_multiplier")]
    pub damage_multiplier: f32,
}

fn default_transport_rate_per_second() -> f32 {
    8.0
}

fn default_proximity_rate_per_second() -> f32 {
    6.0
}

fn default_max_effective_distance() -> f32 {
    120.0
}

fn default_damage_multiplier() -> f32 {
    1.0
}

/// Raw deserialization target matching the YAML structure.
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ContentFile {
    entity_types: HashMap<String, EntityTypeDef>,
    #[serde(default)]
    resource_types: HashMap<String, ResourceTypeDef>,
    #[serde(default)]
    technologies: HashMap<String, TechnologyDef>,
}

impl ContentPack {
    /// Load a content pack from a YAML file.
    pub fn load(path: &Path) -> Result<Self> {
        let raw = std::fs::read_to_string(path)
            .with_context(|| format!("failed to read content pack: {}", path.display()))?;
        let file: ContentFile = serde_yaml::from_str(&raw)
            .with_context(|| format!("failed to parse content pack YAML: {}", path.display()))?;

        validate_resource_content(&file.entity_types, &file.resource_types)?;
        validate_upgrades(&file.entity_types)?;
        validate_technologies(&file.entity_types, &file.technologies)?;

        let content_hash =
            canonical_hash(&file.entity_types, &file.resource_types, &file.technologies)?;

        Ok(Self {
            entity_types: file.entity_types,
            resource_types: file.resource_types,
            technologies: file.technologies,
            content_hash,
        })
    }

    /// Serialize entity and resource type definitions to JSON (for API responses).
    pub fn to_json(&self) -> Result<String> {
        let wrapper = serde_json::json!({
            "entity_types": &self.entity_types,
            "resource_types": &self.resource_types,
            "technologies": &self.technologies,
        });
        Ok(serde_json::to_string_pretty(&wrapper)?)
    }

    /// Look up an entity type definition, returning `None` for unknown types.
    pub fn get(&self, entity_type_id: &str) -> Option<&EntityTypeDef> {
        self.entity_types.get(entity_type_id)
    }

    /// M7: Look up a resource type definition, returning `None` for unknown types.
    pub fn get_resource_type(&self, resource_type_id: &str) -> Option<&ResourceTypeDef> {
        self.resource_types.get(resource_type_id)
    }
}

fn validate_resource_content(
    entity_types: &HashMap<String, EntityTypeDef>,
    resource_types: &HashMap<String, ResourceTypeDef>,
) -> Result<()> {
    for (id, def) in entity_types {
        if !def.depot_range.is_finite() || def.depot_range < 0.0 || (def.depot && def.depot_range <= 0.0) {
            anyhow::bail!("entity type {id} depot requires a positive finite depot_range");
        }
        if def.max_capacity.keys().any(|resource| !resource_types.contains_key(resource)) {
            anyhow::bail!("entity type {id} max_capacity contains an unknown resource");
        }
        for duration in def.builds.iter().map(|o| o.duration_seconds).chain(def.upgrades.iter().map(|o| o.duration_seconds)) {
            if duration.is_some_and(|d| !d.is_finite() || d <= 0.0) {
                anyhow::bail!("entity type {id} duration_seconds must be positive and finite");
            }
        }
        if def.max_capacity.values().any(|capacity| !capacity.is_finite() || *capacity < 0.0) {
            anyhow::bail!("entity type {id} has an invalid max_capacity");
        }
        for (resource, reserve) in &def.resource_reserves {
            let capacity = def.max_capacity.get(resource).copied().unwrap_or(0.0) as f64;
            if !resource_types.contains_key(resource) || capacity <= 0.0
                || !reserve.is_finite() || *reserve < 0.0 || *reserve > capacity {
                anyhow::bail!("entity type {id} resource_reserves.{resource} requires a known resource, positive capacity and 0 <= reserve <= capacity");
            }
        }
        if let Some(sharing) = &def.resource_sharing {
            if !sharing.range.is_finite() || sharing.range < 0.0 {
                anyhow::bail!("entity type {id} has an invalid resource_sharing.range");
            }
            for resource in &sharing.wireless_receives {
                if !resource_types.contains_key(resource) {
                    anyhow::bail!("entity type {id} wireless_receives unknown resource {resource}");
                }
                if !def.max_capacity.contains_key(resource) {
                    anyhow::bail!("entity type {id} wireless_receives {resource} without capacity");
                }
            }
            for (resource, policy) in &sharing.resources {
                let capacity = def.max_capacity.get(resource).copied().unwrap_or(0.0) as f64;
                if !resource_types.contains_key(resource) || capacity <= 0.0 {
                    anyhow::bail!("entity type {id} sharing policy {resource} needs a known resource with positive capacity");
                }
                if !policy.refill_below.is_finite() || !policy.fill_to.is_finite() || !policy.reserve.is_finite()
                    || policy.refill_below < 0.0 || policy.refill_below > policy.fill_to || policy.fill_to > capacity
                    || policy.reserve < 0.0 || policy.reserve > capacity {
                    anyhow::bail!("entity type {id} sharing policy {resource} requires 0 <= refill_below <= fill_to <= capacity and 0 <= reserve <= capacity");
                }
            }
        }
    }
    Ok(())
}

fn validate_requirement(
    requirement: &TechnologyRequirement,
    technologies: &HashMap<String, TechnologyDef>,
) -> Result<()> {
    match requirement {
        TechnologyRequirement::Technology(id) if !technologies.contains_key(id) => {
            anyhow::bail!("technology requirement references unknown technology {id}")
        }
        TechnologyRequirement::Technology(_) => Ok(()),
        TechnologyRequirement::All { all } => {
            if all.is_empty() {
                anyhow::bail!("technology all requirement cannot be empty");
            }
            for child in all {
                validate_requirement(child, technologies)?;
            }
            Ok(())
        }
        TechnologyRequirement::Any { any } => {
            if any.is_empty() {
                anyhow::bail!("technology any requirement cannot be empty");
            }
            for child in any {
                validate_requirement(child, technologies)?;
            }
            Ok(())
        }
    }
}

fn validate_technologies(
    entity_types: &HashMap<String, EntityTypeDef>,
    technologies: &HashMap<String, TechnologyDef>,
) -> Result<()> {
    for (id, technology) in technologies {
        if technology.granted_on_spawn && !technology.research_cost.is_empty() {
            anyhow::bail!("spawn-granted technology {id} cannot have a research cost");
        }
        if let Some(requirement) = &technology.requires {
            validate_requirement(requirement, technologies)?;
        }
        for effect in &technology.effects {
            if effect.target != "entity.sensor.range" {
                anyhow::bail!(
                    "technology {id} has unsupported effect target {}",
                    effect.target
                );
            }
            if !effect.value.is_finite() {
                anyhow::bail!("technology {id} has a non-finite effect value");
            }
        }
    }
    for (entity_id, entity) in entity_types {
        if let Some(node) = entity.resource_node.as_ref() {
            if node.amount.is_some_and(|amount| !amount.is_finite() || amount < 0.0) {
                anyhow::bail!("entity type {entity_id} has an invalid resource node amount");
            }
            if let Some(ResourceRegenerationDef::Hill {
                max_rate_per_second, half_saturation_fraction, exponent,
            }) = &node.regeneration {
                if !node.amount.is_some_and(|amount| amount.is_finite() && amount > 0.0)
                    || !max_rate_per_second.is_finite() || *max_rate_per_second <= 0.0
                    || !half_saturation_fraction.is_finite()
                    || *half_saturation_fraction <= 0.0 || *half_saturation_fraction > 1.0
                    || !exponent.is_finite() || *exponent <= 0.0
                {
                    anyhow::bail!("entity type {entity_id} has invalid regeneration parameters or maximum stock");
                }
            }
            if let Some(target) = &node.depleted_entity_type_id {
                if !entity_types.contains_key(target) || target == entity_id {
                    anyhow::bail!("entity type {entity_id} has invalid depleted entity type {target}");
                }
            }
            if let Some(limit) = node.max_simultaneous_collectors {
                if limit == 0 || node.collection_mode != CollectionMode::Transport {
                    anyhow::bail!(
                        "entity type {entity_id} needs a positive transport collector limit"
                    );
                }
            }
        }
        if let Some(requirement) = &entity.requires_technologies {
            validate_requirement(requirement, technologies)?;
        }
        for technology_id in &entity.researches {
            if !technologies.contains_key(technology_id) {
                anyhow::bail!(
                    "entity type {entity_id} researches unknown technology {technology_id}"
                );
            }
        }
        if let Some(minimum_distance) = entity
            .collector
            .as_ref()
            .and_then(|collector| collector.minimum_distance.as_ref())
        {
            if !minimum_distance.value.is_finite() || minimum_distance.value <= 0.0 {
                anyhow::bail!("entity type {entity_id} has an invalid collector minimum distance");
            }
            if minimum_distance.entity_types.is_empty() {
                anyhow::bail!("entity type {entity_id} minimum distance requires entity types");
            }
            if minimum_distance.retry_after_ms == 0 {
                anyhow::bail!(
                    "entity type {entity_id} minimum distance requires a positive retry delay"
                );
            }
            for other_type in &minimum_distance.entity_types {
                if !entity_types.contains_key(other_type) {
                    anyhow::bail!(
                        "entity type {entity_id} minimum distance references unknown entity type {other_type}"
                    );
                }
            }
        }
    }
    Ok(())
}

/// Verify that upgrades form a one-way, content-valid progression graph.
fn validate_upgrades(entity_types: &HashMap<String, EntityTypeDef>) -> Result<()> {
    for (source_id, source) in entity_types {
        let mut targets = HashSet::new();
        for option in &source.upgrades {
            if option.entity_type_id == *source_id {
                anyhow::bail!("entity type {source_id} cannot upgrade to itself");
            }
            if !entity_types.contains_key(&option.entity_type_id) {
                anyhow::bail!(
                    "entity type {source_id} upgrades to unknown type {}",
                    option.entity_type_id
                );
            }
            if !targets.insert(&option.entity_type_id) {
                anyhow::bail!(
                    "entity type {source_id} declares duplicate upgrade target {}",
                    option.entity_type_id
                );
            }
            if option
                .spend_rates
                .values()
                .any(|rate| !rate.is_finite() || *rate <= 0.0)
            {
                anyhow::bail!("entity type {source_id} has an invalid upgrade spend rate");
            }
        }
    }

    fn visit(
        id: &str,
        entity_types: &HashMap<String, EntityTypeDef>,
        visiting: &mut HashSet<String>,
        visited: &mut HashSet<String>,
    ) -> Result<()> {
        if visited.contains(id) {
            return Ok(());
        }
        if !visiting.insert(id.to_string()) {
            anyhow::bail!("upgrade graph contains a cycle at entity type {id}");
        }
        let source = entity_types
            .get(id)
            .expect("upgrade targets are validated before cycle detection");
        for option in &source.upgrades {
            visit(&option.entity_type_id, entity_types, visiting, visited)?;
        }
        visiting.remove(id);
        visited.insert(id.to_string());
        Ok(())
    }

    let mut visiting = HashSet::new();
    let mut visited = HashSet::new();
    for id in entity_types.keys() {
        visit(id, entity_types, &mut visiting, &mut visited)?;
    }
    Ok(())
}

/// Compute a deterministic hash from entity and resource type definitions.
///
/// Both maps are serialized to JSON with sorted keys (via `BTreeMap` ordering)
/// and no extra whitespace, then hashed with xxh3-64.
fn canonical_hash(
    entity_types: &HashMap<String, EntityTypeDef>,
    resource_types: &HashMap<String, ResourceTypeDef>,
    technologies: &HashMap<String, TechnologyDef>,
) -> Result<String> {
    let et: std::collections::BTreeMap<&String, &EntityTypeDef> = entity_types.iter().collect();
    let rt: std::collections::BTreeMap<&String, &ResourceTypeDef> = resource_types.iter().collect();
    let tech: std::collections::BTreeMap<&String, &TechnologyDef> = technologies.iter().collect();
    let json =
        serde_json::json!({ "entity_types": et, "resource_types": rt, "technologies": tech });
    let json_str =
        serde_json::to_string(&json).context("failed to serialize content to canonical JSON")?;
    let hash = xxhash_rust::xxh3::xxh3_64(json_str.as_bytes());
    Ok(format!("{:016x}", hash))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_inventory_reserves_against_known_resources_and_capacity() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let mut def = content.get("worker").unwrap().clone();
        for (resource, amount) in [("food", -1.0), ("food", 51.0), ("food", f64::NAN), ("food", f64::INFINITY), ("unknown", 5.0)] {
            def.resource_reserves = HashMap::from([(resource.into(), amount)]);
            assert!(validate_resource_content(&HashMap::from([("worker".into(), def.clone())]), &content.resource_types).is_err());
        }
        for amount in [0.0, 5.0, 50.0] {
            def.resource_reserves = HashMap::from([("food".into(), amount)]);
            assert!(validate_resource_content(&HashMap::from([("worker".into(), def.clone())]), &content.resource_types).is_ok());
        }
        def.max_capacity.remove("food");
        assert!(validate_resource_content(&HashMap::from([("worker".into(), def)]), &content.resource_types).is_err());
    }

    #[test]
    fn sharing_policy_validation_rejects_invalid_targets_and_resources() {
        let content = ContentPack::load(&std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let mut def = content.get("habitat").unwrap().clone();
        for (refill_below, fill_to, reserve) in [(-1.0, 900.0, 900.0), (901.0, 900.0, 900.0),
            (700.0, 1001.0, 900.0), (700.0, 900.0, -1.0), (700.0, 900.0, 1001.0), (f64::NAN, 900.0, 900.0)] {
            def.resource_sharing.get_or_insert_with(|| ResourceSharingDef { range: 1000.0, wireless_receives: Vec::new(), resources: HashMap::new() }).resources.insert("energy".into(), ResourceSharingPolicy {
                priority: 10, overflow_priority: None, refill_below, fill_to, reserve,
            });
            assert!(validate_resource_content(&HashMap::from([("habitat".into(), def.clone())]), &content.resource_types).is_err());
        }
        let policy = def.resource_sharing.as_mut().unwrap().resources.remove("energy").unwrap();
        def = content.get("habitat").unwrap().clone();
        def.resource_sharing = Some(ResourceSharingDef { range: 1000.0, wireless_receives: Vec::new(), resources: HashMap::new() });
        def.resource_sharing.as_mut().unwrap().resources.insert("unknown".into(), policy);
        assert!(validate_resource_content(&HashMap::from([("habitat".into(), def)]), &content.resource_types).is_err());
    }

    #[test]
    fn rejects_unknown_entity_and_nested_combat_fields() {
        let entity_error = serde_yaml::from_str::<EntityTypeDef>(
            "fog_memory: forget_when_hidden\nspeed: 1\nstop_radius: 1\nmass: 1\nhealth: 1\nnot_a_real_field: true\n",
        )
        .unwrap_err();
        assert!(entity_error.to_string().contains("not_a_real_field"));

        let combat_error = serde_yaml::from_str::<EntityTypeDef>(
            "fog_memory: forget_when_hidden\nspeed: 1\nstop_radius: 1\nmass: 1\nhealth: 1\ncombat:\n  acquisition_range: 100\n  attacks:\n    - id: laser\n      type: laser\n      damage: 1\n      cooldown_ticks: 1\n      not_a_real_attack_field: true\n",
        )
        .unwrap_err();
        assert!(combat_error.to_string().contains("not_a_real_attack_field"));
    }

    #[test]
    fn content_hash_is_deterministic() {
        let mut types = HashMap::new();
        types.insert(
            "worker".into(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_reserves: HashMap::new(),
                depot: false,
                depot_range: 0.0,
                resource_sharing: None,
                fog_memory: FogMemory::ForgetWhenHidden,
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );
        types.insert(
            "scout".into(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_reserves: HashMap::new(),
                depot: false,
                depot_range: 0.0,
                resource_sharing: None,
                fog_memory: FogMemory::ForgetWhenHidden,
                speed: 140.0,
                stop_radius: 0.5,
                mass: 0.6,
                health: 60.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );

        let empty_resources: HashMap<String, ResourceTypeDef> = HashMap::new();
        let empty_technologies: HashMap<String, TechnologyDef> = HashMap::new();
        let h1 = canonical_hash(&types, &empty_resources, &empty_technologies).unwrap();
        let h2 = canonical_hash(&types, &empty_resources, &empty_technologies).unwrap();
        assert_eq!(h1, h2, "hash must be deterministic across calls");
        assert_eq!(h1.len(), 16, "hex xxh3-64 should be 16 chars");
    }

    #[test]
    fn content_hash_ignores_insertion_order() {
        let mut types_a = HashMap::new();
        types_a.insert(
            "worker".into(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_reserves: HashMap::new(),
                depot: false,
                depot_range: 0.0,
                resource_sharing: None,
                fog_memory: FogMemory::ForgetWhenHidden,
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );
        types_a.insert(
            "scout".into(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_reserves: HashMap::new(),
                depot: false,
                depot_range: 0.0,
                resource_sharing: None,
                fog_memory: FogMemory::ForgetWhenHidden,
                speed: 140.0,
                stop_radius: 0.5,
                mass: 0.6,
                health: 60.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );

        let mut types_b = HashMap::new();
        types_b.insert(
            "scout".into(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_reserves: HashMap::new(),
                depot: false,
                depot_range: 0.0,
                resource_sharing: None,
                fog_memory: FogMemory::ForgetWhenHidden,
                speed: 140.0,
                stop_radius: 0.5,
                mass: 0.6,
                health: 60.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );
        types_b.insert(
            "worker".into(),
            EntityTypeDef {
                max_capacity: HashMap::new(),
                resource_reserves: HashMap::new(),
                depot: false,
                depot_range: 0.0,
                resource_sharing: None,
                fog_memory: FogMemory::ForgetWhenHidden,
                speed: 90.0,
                stop_radius: 0.75,
                mass: 1.0,
                health: 100.0,
                hull_radius: 0.0,
                combat: None,
                combat_targetable: false,
                collector: None,
                repair: None,
                resource_node: None,
                refinery: None,
                radiation_sources: Vec::new(),
                radiation_shielding: HashMap::new(),
                visual: VisualDef::default(),
                z_index: 0,
                suppress_hover: false,
                build_cost: HashMap::new(),
                maintenance_cost_per_minute: HashMap::new(),
                sensor: None,
                visibility_range: None,
                builds: Vec::new(),
                upgrades: Vec::new(),
                requires_technologies: None,
                researches: Vec::new(),
            },
        );

        let empty_resources: HashMap<String, ResourceTypeDef> = HashMap::new();
        assert_eq!(
            canonical_hash(&types_a, &empty_resources, &HashMap::new()).unwrap(),
            canonical_hash(&types_b, &empty_resources, &HashMap::new()).unwrap(),
            "hash must be independent of insertion order"
        );
    }

    #[test]
    fn load_entities_yaml() {
        // Resolve the path relative to the workspace root
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let content_path = manifest_dir.join("../../packages/content/entities.yaml");
        if !content_path.exists() {
            // Skip if running in CI without the full workspace
            return;
        }
        let pack = ContentPack::load(&content_path).unwrap();
        assert!(
            pack.entity_types.contains_key("worker"),
            "should have worker type"
        );
        assert!(
            pack.resource_types.get("minerals").is_some(),
            "M7: should have minerals resource type"
        );
        assert!(
            pack.entity_types.contains_key("scout"),
            "should have scout type"
        );
        let habitat_sensor = pack.entity_types["habitat"].sensor.as_ref().unwrap();
        assert_eq!(habitat_sensor.range, 4000.0);
        assert_eq!(habitat_sensor.cost_per_minute["energy"], 5.0);
        assert_eq!(
            pack.entity_types["star_yellow"].visibility_range,
            Some(40_000.0)
        );
        assert!(
            !pack.content_hash.is_empty(),
            "content hash should be non-empty"
        );

        let worker = pack.get("worker").unwrap();
        assert_eq!(worker.speed, 90.0);
        assert_eq!(worker.stop_radius, 0.75);
        let scout = pack.get("scout").unwrap();
        assert_eq!(scout.speed, 140.0);
    }

    #[test]
    fn hill_regeneration_matches_worker_balance_and_declines_with_stock() {
        let pack = ContentPack::load(&std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        let regeneration = pack.get("planet_blue").unwrap().resource_node.as_ref().unwrap()
            .regeneration.as_ref().unwrap();
        let worker_rate = pack.get("worker").unwrap().collector.as_ref().unwrap().transport_rate_per_second as f64;
        assert!((regeneration.rate_per_second(0.5) - worker_rate / 2.0).abs() < 1e-12);
        assert!((regeneration.rate_per_second(1.0) - 128.0 / 17.0).abs() < 1e-12);
        assert!((regeneration.rate_per_second(0.25) - 8.0 / 17.0).abs() < 1e-12);
        assert_eq!(regeneration.rate_per_second(0.0), 0.0);
    }

    #[test]
    fn regeneration_schema_rejects_invalid_parameters_and_depletion_targets() {
        let pack = ContentPack::load(&std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml")).unwrap();
        for (rate, fraction, exponent, amount) in [
            (0.0, 0.5, 4.0, Some(2000.0)),
            (f64::NAN, 0.5, 4.0, Some(2000.0)),
            (8.0, 0.0, 4.0, Some(2000.0)),
            (8.0, 1.1, 4.0, Some(2000.0)),
            (8.0, 0.5, f64::INFINITY, Some(2000.0)),
            (8.0, 0.5, -1.0, Some(2000.0)),
            (8.0, 0.5, 4.0, None),
            (8.0, 0.5, 4.0, Some(0.0)),
        ] {
            let mut types = pack.entity_types.clone();
            let node = types.get_mut("planet_blue").unwrap().resource_node.as_mut().unwrap();
            node.amount = amount;
            node.regeneration = Some(ResourceRegenerationDef::Hill {
                max_rate_per_second: rate, half_saturation_fraction: fraction, exponent,
            });
            assert!(validate_technologies(&types, &pack.technologies).is_err());
        }
        let mut types = pack.entity_types.clone();
        types.get_mut("planet_blue").unwrap().resource_node.as_mut().unwrap()
            .depleted_entity_type_id = Some("missing_planet".into());
        assert!(validate_technologies(&types, &pack.technologies).is_err());
        let node = pack.get("planet_blue").unwrap().resource_node.as_ref().unwrap();
        let mut json = serde_json::to_value(node).unwrap();
        json["regeneration"]["model"] = serde_json::json!("unknown");
        assert!(serde_json::from_value::<ResourceNodeDef>(json).is_err());
    }

    #[test]
    fn loads_worker_repair_ability() {
        let path = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../packages/content/entities.yaml");
        let pack = ContentPack::load(&path).unwrap();
        let repair = pack.get("worker").unwrap().repair.as_ref().unwrap();
        assert_eq!(repair.range, 150.0);
        assert_eq!(repair.cost_per_min["energy"], 60.0);
        assert_eq!(repair.cost_per_min["minerals"], 60.0);
        assert_eq!(repair.efficiency, 1.0);
    }

    #[test]
    fn loads_explicit_fog_memory_policy() {
        let manifest_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let pack =
            ContentPack::load(&manifest_dir.join("../../packages/content/entities.yaml")).unwrap();

        assert_eq!(
            pack.entity_types["planet_blue"].fog_memory,
            FogMemory::RetainLastKnown
        );
        assert_eq!(
            pack.entity_types["raider"].fog_memory,
            FogMemory::ForgetWhenHidden
        );
    }
}
