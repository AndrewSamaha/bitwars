# Procedural solar systems and player starts

Date: 2026-10-20
Status: Implemented for fresh procedural worlds. Existing worlds require start-reservation migration before new joins.

## Purpose

Generate varied solar systems around `star_yellow`, with planets selected by the
combined exposure from all stars and theta. Nearby sources must influence one
another's systems. Systems may contain repeated planet types, omit any type, or
have no planets. Player starts must provide safe, resource-supported locations
without making every ordinary system suitable for settlement.

Exposure is a dimensionless world-generation measure. It is separate from the
collectable `energy` resource and from runtime radiation damage.

## Existing behavior and migration

The current configuration is `services/rts-engine/config/spawn.yaml`. Rust reads
it through `services/rts-engine/src/spawn_config.rs`; the Spawn editor validates
it through `apps/web/src/lib/content/spawnConfig.ts`.

Currently, stars, theta, minerals, and asteroids use independent Gaussian fields.
The engine additionally creates one blue planet around a shuffled 75% of stars,
at a radius of 3,000–4,500 units. Replace that hardcoded planet count and placement
with the rules below.

| Existing setting | Decision |
| --- | --- |
| `global_neutral_fields` | Keep `type`, `count`, `origin`, and per-axis `standard_deviation`. Use for initial sources and independent background populations. |
| `resource_amounts` | Keep the existing clamped normal deposit distributions, keyed by entity type. |
| `loadouts` | Keep random selection from the configured loadout pool. |
| `starting_resources`, `starting_resources_recipient_type` | Keep inventory grants and existing capacity checks. |
| `min_entity_spawn_distance`, `max_entity_spawn_distance` | Keep player-unit spacing semantics. These do not control planets. |
| `max_raiders` | Keep unchanged. |
| `neutrals_near_spawn` | Keep as an optional per-player population; leave empty initially. |

No existing schema fields need removal. Remove the implicit 75% planet rule and
the hardcoded planet-distance limits when the new generator is enabled. Review
and reduce global asteroid/mineral counts as system populations are introduced;
background and system counts are additive. The proposed population values below
are tuning defaults, not a requirement to preserve the old total entity count.

Replace the web validator's requirement for at least two yellow stars as a proxy
for a viable player start. Random systems require actual start eligibility and
bounded fallback generation instead. Validate that the system anchor has at
least one configured initial instance and that all generation references exist.

## Combined exposure

At position p, calculate:

    E(p) = sum over sources s of:
           strength(s.type) * (reference_distance /
             max(distance(p, s), minimum_distance))^2

A source is an existing entity whose type appears in `exposure.sources`.
Distances are Euclidean center-to-center game units. Use every source, including
sources belonging to other systems and theta without planets. Sum in stable
entity-ID order using double precision. Do not introduce a distance cutoff in
the initial implementation; the current source population is small.

With reference distance 3,750 and strength 1, a single source produces exposure 1
at 3,750 units. Two sources contributing 0.5 each also produce exposure 1. Stars
and theta have identical effects at identical configured strength. The positive
minimum distance caps each contribution and prevents singularities.

Exposure selects a planet's type once at generation. Existing planets do not
change type as sources are added, destroyed, or moved. Player-start eligibility
uses the sources present when the start is considered. Exposure does not alter
runtime radiation or collection rules.

## Generation sequence

1. Sample all initial exposure sources from their global Gaussian fields.
2. Place other global neutral populations. Check their overlap and radiation
   constraints where applicable; source placement itself remains Gaussian and
   permits nearby stars/theta.
3. Process system anchors in stable entity-ID order. Generate planets, then each
   configured local population in configuration order.
4. Initialize finite deposits using `resource_amounts`, falling back to the
   deprecated entity content amount for legacy packs, exactly once per newly created deposit.
5. Identify eligible starts as players join. Run fallback only if ordinary
   candidates cannot produce a valid complete start.

Do not create a configured global source again as a system-local object. Reject
configuration that places an exposure-source type in planets, local populations,
or per-player neutrals; sources must be placed before classification. An expansion
system is the explicit exception described below.

All randomness must use the supplied generator. A fixed RNG seed, content,
configuration, and starting state must reproduce generation in tests; no new
public seed field is required initially.

## Planets

For each anchor, independently draw the target planet count from `count_weights`.
For each target planet, sample an angle uniformly over a full circle and a radius
from the configured placement range. `uniform_radius` samples the radius uniformly;
`uniform_area` samples sqrt(uniform(min_radius^2, max_radius^2)).

Reject candidate positions that violate minimum separation or damaging-radiation
exclusions. Calculate combined exposure at an accepted candidate and sample its
planet type from the interpolated weights. Check the selected type's hull against
existing objects before accepting it. A failed placement retries the complete
candidate, including type selection. Stop after `max_attempts_per_object` and skip
that object; target counts are not guarantees.

The exposure table contains strictly increasing numeric control points. Linearly
interpolate each type's weight between neighboring points, then normalize the
result for sampling. Below or above the table, use the nearest endpoint. Missing
types have weight zero. Weights are relative and need not sum to 100.

Every planet draw is independent. Do not reserve one slot per type or guarantee
a blue planet in an ordinary system. Geometry remains star-centered, while type
selection accounts for all sources. Theta influences planets but does not itself
anchor systems in the initial configuration.

## Asteroids, minerals, and placement safety

For each local population, roll its occurrence probability once per anchor.
On success, choose an inclusive uniform integer count from `count.min` through
`count.max`. Position objects independently using that population's placement
rules; neither counts nor types depend on exposure initially.

Global asteroid/mineral fields remain an independent interstellar population.
Belts and correlated clusters are outside the initial scope; local populations
are scattered across their annuli.

`min_separation` is a center-to-center minimum against all previously placed
objects, including objects in other systems. Hull overlap is also prohibited:
the required clearance is the greater of minimum separation and the sum of hull
radii. Initial exposure sources are exempt from separation from each other.

When `avoid_damaging_radiation` is true, reject a candidate whose hull intersects
any positive-damage radiation zone, using content-defined distance ranges. This
is a separate constraint from exposure: low combined exposure is not proof of
radiation safety. Apply this exclusion to background asteroids/minerals too.
Radiation checks do not prevent planet types with names such as inhospitable;
those names describe classification, not permission to overlap a damage zone.

## Configuration

These sections accompany the retained fields. All numbers below are initial
tuning values. Changing them affects newly generated objects and future start
selection, not the types or positions of existing objects.

```yaml
exposure:
  reference_distance: 3750
  minimum_distance: 300
  sources:
    star_yellow: 1
    theta: 1

solar_systems:
  anchor_type: star_yellow
  planets:
    count_weights:
      0: 15
      1: 25
      2: 30
      3: 20
      4: 10
    placement:
      min_distance: 1800
      max_distance: 8000
      sampling: uniform_radius
      min_separation: 700
      max_attempts_per_object: 64
      avoid_damaging_radiation: true
    type_weights:
      interpolation: linear
      points:
        - exposure: 0.2
          weights: { planet_inhospitable: 20, planet_blue: 0, planet_ice: 80 }
        - exposure: 0.7
          weights: { planet_inhospitable: 20, planet_blue: 10, planet_ice: 70 }
        - exposure: 1
          weights: { planet_inhospitable: 15, planet_blue: 75, planet_ice: 10 }
        - exposure: 1.6
          weights: { planet_inhospitable: 90, planet_blue: 10, planet_ice: 0 }
        - exposure: 4.3
          weights: { planet_inhospitable: 100, planet_blue: 0, planet_ice: 0 }
  populations:
    - type: asteroid
      probability: 0.65
      count: { min: 3, max: 10 }
      placement:
        min_distance: 1800
        max_distance: 9000
        sampling: uniform_area
        min_separation: 200
        max_attempts_per_object: 64
        avoid_damaging_radiation: true
    - type: minerals
      probability: 0.7
      count: { min: 1, max: 4 }
      placement:
        min_distance: 1800
        max_distance: 9000
        sampling: uniform_area
        min_separation: 200
        max_attempts_per_object: 64
        avoid_damaging_radiation: true

player_starts:
  planet_type: planet_blue
  exposure: { min: 0.7, max: 1.6 }
  min_planet_food_fraction: 0.5
  max_starts_per_planet: 1
  placement:
    min_distance_from_planet: 300
    max_distance_from_planet: 800
    max_attempts_per_planet: 64
    radiation_clearance_multiplier: 1.5
  min_distance_between_starts: 8000
  enemy_clearance: 4000
  minerals:
    search_radius: 4000
    min_remaining: 1000
    create_if_missing: true
  fallback:
    generate_additional_systems: true
    max_additional_systems: 10
```

The curve makes blue planets most likely around exposure 1. The start interval
0.7–1.6 is a separate eligibility constraint, not a claim that blue planets have
equal generation probability throughout that interval. Blue planets can also
occur outside that interval and be ineligible for starts.

## Player-start selection

Select a loadout once per join attempt, then evaluate complete candidate starts.
A valid start must satisfy all of the following:

- The associated planet has `player_starts.planet_type`, positive health, and a
  finite food deposit with positive remaining stock. Its remaining/initial stock
  fraction meets `min_planet_food_fraction`. The sampled initial amount is the
  denominator, not the content default.
- Both planet and start origin have combined exposure within the configured
  inclusive interval.
- The planet has fewer historical committed starts than `max_starts_per_planet`.
- The origin lies within the configured planet-distance annulus and is at least
  `min_distance_between_starts` from every previously committed start origin.
- The complete loadout can be placed without hull overlaps and while preserving
  the existing player-unit spacing rules. Every unit is outside each damaging
  source's maximum effective radius multiplied by the start safety multiplier,
  plus the unit's hull radius. This conservative clearance deliberately covers
  sources with a nonzero inner radiation boundary too.
- Every unit and the origin clear hostile entities by `enemy_clearance`, using
  the engine's hostility rules, including hostile NPCs. Measure hull clearance
  for placed units. The planet itself does not count as hostile.
- A usable mineral node is within `minerals.search_radius` of the origin, has
  positive health and at least `min_remaining` stock, is outside damaging
  radiation, and has a safe harvesting approach from the starting location.

For the initial harvesting-approach check, require at least one collector docking
position in the content-defined collection range that fits the collector hull against other objects,
with an unobstructed, radiation-free straight path from the start. The target
mineral node permits harvesting contact: its existing center-to-center collection
range may overlap its own hull. Other objects remain obstacles. This is a
conservative eligibility test; a later route-aware implementation may admit more
locations without relaxing safety.

Sample candidate origins uniformly by angle and radius. Randomly shuffle eligible
planets and examine each at most once, trying up to `max_attempts_per_planet`
origins. The first complete valid candidate wins. This gives equal priority to
planets rather than weighting them by their number of candidate positions.

If suitable minerals are absent and creation is enabled, try at most 256
uniform-area samples within the search disk. Use the same hull, radiation, and
approach checks. Sample the deposit using existing `resource_amounts` and reject
stock below the configured minimum; never silently increase its stock. Failure
rejects the start candidate.

Prepare the loadout, generated minerals, resource grants, and start reservation
as one candidate. Commit them together only after every check succeeds. Failed
candidates leave no entities or reservations behind. Recheck current world state
at commit, and serialize joins so two players cannot reserve the same planet.

Persist the associated planet ID and origin for each committed player start in
authoritative state and snapshots. Historical reservations survive disconnects,
planet depletion, and destruction; reconnects do not generate another start.
Existing worlds must not infer an unclaimed planet merely because reservation
metadata is absent; migration behavior is specified below.

## No eligible start: bounded expansion

Never relax exposure, radiation, enemy, spacing, food, or mineral requirements.
If expansion is disabled or exhausts its attempt budget, leave the join pending
and expose the reason to operators. Do not create a partial loadout. Avoid
retrying expansion every tick: at most one bounded expansion batch per pending
join per world-state revision relevant to eligibility, or an explicit operator
retry. Failed attempts must not themselves trigger another batch.
The initial eligibility revision includes source/planet/mineral/hostile membership,
alive and eligibility thresholds, configuration, reservations, and quantized
1,000-unit position cells. Tick changes and stock changes that remain on the same
side of a threshold do not trigger expansion. Small movements within one cell may
therefore defer a retry until a threshold or cell changes. Pending diagnostics are
available in the authoritative game-query snapshot checkpoint.

For each expansion attempt:

1. Propose an anchor in unoccupied space outside the current occupied extent.
   Initially, use the bounding box of existing entities and committed starts,
   padded by `min_distance_between_starts + largest system placement radius`;
   sample a point on its perimeter, uniformly by perimeter length. Rejected
   proposals consume an attempt, so failure is bounded.
2. Tentatively add one anchor of `solar_systems.anchor_type`. Include its exposure
   when evaluating its system and every protected existing start.
3. Generate its ordinary system, and ensure at least one additional blue-planet
   candidate if its random planets cannot provide a start. Sample that guaranteed
   candidate within the configured planet-placement annulus, using the same
   attempt cap; explicitly require Goldilocks exposure rather than sampling its
   type from the table. A zero random planet count does not prevent this exception.
4. Apply all normal player-start checks, including food and mineral rules. The
   guaranteed blue planet must still pass exposure, stock, geometry, and safety
   checks; creating its type is not a guarantee that placement succeeds.
5. Reject the proposal if the new source pushes any previously committed start
   origin or its recorded planet position outside the start exposure interval,
   or exposes existing player-owned units to new damaging radiation. Use recorded
   planet positions even if a planet has since been destroyed. Do not reclassify
   existing planets.
6. Commit the new system and player start together on success. Otherwise discard
   all tentative changes and try another anchor, up to `max_additional_systems`.

`max_additional_systems` is an attempt cap, not permission to accumulate unused
systems on failed joins. Successful expansion deliberately guarantees a viable
start; ordinary systems retain their random planet counts and types.

## Schema and validation

Extend Rust deserialization, the web Zod schema, editor help/completions, and
reference-renaming behavior together. Reject unknown fields consistently in both
validators. The YAML above must parse in both implementations without losing
count-weight keys to YAML integer/string differences.

Require finite numeric values throughout. Validate:

- Positive reference/minimum exposure distances; nonnegative source strengths
  with at least one positive strength.
- Valid content entity references for sources, anchors, planet choices,
  populations, and starting planets. The start type must provide finite food;
  configured loadouts must retain existing resource-recipient/capacity validity.
- Nonnegative integer counts, nonempty count-weight maps with positive total
  weight, and nonnegative finite weights.
- A nonempty, strictly increasing exposure table with nonnegative exposures and
  positive total weight at every point. Only `linear` interpolation initially.
- Probabilities and minimum food fraction in [0, 1]. Ordered nonnegative distance,
  exposure, and count bounds; recognized sampling modes; positive integer retry
  caps and start-per-planet limits; radiation safety multiplier at least 1.
- Positive mineral search radius and minimum remaining stock. When mineral
  creation is enabled, its configured/content deposit distribution must be able
  to produce the required minimum stock.
- Positive planet-count weight for some count above zero, and positive generation
  weight for the starting planet type somewhere inside the allowed start exposure
  interval. Expansion does not replace a usable ordinary generation configuration.

Treat `exposure`, `solar_systems`, and `player_starts` as one required feature set:
all three must be supplied together. Update the checked-in config in the same
implementation change. Do not silently interpret partially upgraded config as
legacy behavior.

Fresh generated worlds use these rules. Loading existing worlds must preserve
entities and deposits rather than regenerate them. Existing players retain their
entities. If historical start metadata is absent, disable new joins with a clear
migration diagnostic until starts are explicitly backfilled or the world is reset;
do not guess start ownership from proximity alone. Authored scenarios retain their
explicit entities and deposits; procedural generation does not modify them unless
explicitly enabled by a later scenario feature.

## Acceptance criteria

- Exposure sums contributions from yellow stars and theta; two equal half-strength
  contributions classify identically to one unit-strength contribution.
- Exposure is finite at a source position. Distant-source contributions remain
  included. Stable seeds reproduce generation.
- Interpolation and endpoint clamping produce expected weights, including omitted
  types, zero weights, and relative weights that do not total 100.
- Deterministic fixtures exhibit empty systems, repeated planet types, and systems
  missing each possible type; no ordinary system is forced to contain a blue planet.
- Neighboring sources can change a candidate from cold to Goldilocks or from
  Goldilocks to hot; theta and stars are interchangeable at equal strength.
- Placement respects separation, hulls, radiation, and retry caps across systems.
  Deposit initialization never refills existing finite sources.
- Both validators accept the proposed config and reject invalid bounds, weights,
  references, incomplete feature sets, and unknown fields.
- Player starts reject depleted/low-food planets, unsuitable exposure, occupied
  planets, insufficient spacing, hostile proximity, and unsafe loadout placements.
- Existing valid minerals are reused. Missing minerals are created only when
  enabled and only if stock and safe approach checks pass.
- Concurrent joins cannot share a reserved planet. Reservations survive reloads
  and reconnects. Failed candidate checks make no persistent world changes.
- Expansion can provide a valid start from a world with no eligible planets,
  protects prior starts, and leaves no partial systems on failure.
- Exhausted fallback leaves the join pending with a useful diagnostic and does
  not repeatedly expand on every tick.

## Deferred work

Orbital motion, runtime climate/type changes, varying individual stellar strength,
asteroid belts, planet-specific atmospheric properties, and a general-purpose
procedural-generation scripting language are outside this specification. Initial
numeric weights, spacing, and exposure thresholds require playtesting; tune them
through spawn configuration rather than new engine constants.
