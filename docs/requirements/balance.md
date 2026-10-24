# Balance visualization editor

Status: agreed v1 scope; implementation pending. YAML field names below define
the proposed configuration contract.

## Purpose and layout

Add a **Balance** tab to the navigation at `/content/`, served at
`/content/balance`. Follow the Entities tab's split layout: a visualization on
the left and a Monaco YAML configuration editor on the right. Include an
examples dropdown, saved-visualization selection, and save controls.

Scatter plots represent each entity type with its sprite. Sprite positions are
determined by the configured numeric expressions. Overlapping sprites are
acceptable for v1; no collision avoidance or position offsets are required.
Bar charts show one numeric value per entity, with entity IDs identifying bars.

## Data source

Read entity definitions explicitly from `packages/content/entities.yaml`, using
the existing content API pattern. Use authored values, without runtime state,
technology modifiers, or inferred engine defaults. Include all entity types by
default. V1 has no entity filtering.

Any entity field or supported field expression that resolves to a finite number
can be graphed. Maintenance is an example, not a special-purpose feature. The
existing field is `maintenance_cost_per_minute` (singular `cost`). Do not
implicitly add sensor operating costs or assign weights to resources.

## YAML configuration

Scatter example:

```yaml
version: 1
id: maintenance-vs-speed
name: Maintenance vs speed
visualization_type: scatter_plot
x:
  expression: sum(maintenance_cost_per_minute.*)
  label: Maintenance per minute
y:
  expression: speed
  label: Speed
```

Bar chart example:

```yaml
version: 1
id: maintenance-by-entity
name: Maintenance by entity
visualization_type: bar_chart
value:
  expression: sum(maintenance_cost_per_minute.*)
  label: Maintenance per minute
order: descending
```

- `version: 1` and `id` are required. `id` is a nonempty string without
  whitespace; do not inherit the scenarios' lowercase-only ID restriction.
- `name` is an optional display name, defaulting to `id`.
- `visualization_type` is required: `scatter_plot` or `bar_chart`.
- Scatter plots require `x.expression` and `y.expression`.
- Bar charts require `value.expression`. `order` accepts `descending` or
  `ascending`, defaulting to `descending`: largest to smallest, left to right.
  Use entity ID as a deterministic tie-breaker.
- Axis/value labels are optional and default to the expression text.
- Expressions are strings; YAML quoting may be needed for some expressions.

## Expressions and completion

Support numeric literals, numeric field paths, wildcard paths, `sum(...)`,
`max(...)`, binary `+`, `-`, `*`, `/`, unary signs, and parentheses. Multiplication
and division bind more tightly than addition and subtraction; parentheses
override precedence. Distinguish multiplication from a wildcard path segment.

Examples:

```text
speed
maintenance_cost_per_minute.energy
sum(maintenance_cost_per_minute.*)
max(maintenance_cost_per_minute.*)
sum(maintenance_cost_per_minute.*) * 2
health / (sum(maintenance_cost_per_minute.*) + 1)
```

Wildcards select values from maps or arrays and must be reduced to a single
number with `sum` or `max` before use as a coordinate or bar value. Neither
function supplies a fallback for a missing field or an empty selection. Do not
coerce strings, booleans, or nulls into numbers. Division by zero and other
non-finite results are evaluation failures.

Use a restricted expression parser, not JavaScript evaluation. Functions beyond
`sum` and `max` are outside v1 scope.

Provide Monaco completion for configuration keys, visualization types, bar
ordering, functions, and entity field paths within expressions. Derive field
suggestions from the entity schema and authored data, including resource map
keys and wildcard paths. Offer nested suggestions after a dot. Existing YAML
validation and custom completion infrastructure can be extended for Balance.

## Missing values and diagnostics

Omit an entity when any required expression cannot resolve to a finite number.
For scatter plots, both coordinates must succeed. Missing fields must not
silently become zero, including a missing maintenance map inside `sum`.

At the bottom of the screen, list every omitted entity by ID and explain the
reason, identifying the affected axis/value and field or expression. Reasons
include missing fields, empty wildcard selections, nonnumeric values, and
division by zero. Display explicitly authored zero values normally.

Malformed YAML, an invalid visualization configuration, or invalid expression
syntax is a configuration error and should be reported as such, rather than
appearing only as a list of omitted entities. A valid plot with no eligible
entities should show an empty state and omission details.

## Examples, editing, and persistence

Provide example configurations in a dropdown, including maintenance versus
speed and a maintenance bar chart. Selecting one replaces both the editor
configuration and its visualization. If the current YAML has unsaved changes,
warn before replacement and allow the user to cancel without losing the draft.

Render valid configuration edits in the visualization without requiring a save.
Track unsaved changes against the last loaded or successfully saved YAML.

Saving preserves the visualization YAML, not an image or a snapshot of entity
values. Loading a saved visualization evaluates its expressions against the
current `entities.yaml`. Provide saved configuration listing and loading, using
file-backed persistence similar to scenarios/bookmarks. A proposed storage
directory is `packages/content/balance/`.

Validate configurations before saving and preserve YAML text, including comments.
Use atomic file replacement as in scenario saves. IDs must never be interpreted
as unchecked filesystem paths: encode IDs safely for storage or use a manifest
mapping IDs to safe filenames, while preserving the public no-whitespace ID
contract. A failed save must retain the user's draft and display the error.

## Existing implementation references

- `apps/web/src/features/content/components/ContentGraph.tsx`: split layout,
  entity loading, and sprites.
- `apps/web/src/features/content/components/YamlEditor.tsx`: Monaco YAML setup
  and custom completion/validation providers.
- `apps/web/src/app/api/content/entities/route.ts`: reads authored entity YAML.
- `apps/web/src/lib/content/scenarios.ts`: file listing, validated identifiers,
  and atomic saves. Balance persistence does not need scenario engine commands.

Content navigation is currently repeated across components. Prefer extracting
a shared navigation component when adding Balance so every content page exposes
the new tab consistently.

## Implementation notes

### Existing patterns to follow

- Keep the route thin: add `apps/web/src/app/content/balance/page.tsx` mounting
  a client `BalanceEditor` component under `features/content/components`.
  `/content/` should continue redirecting to Entities.
- Follow `ContentGraph.tsx` for the dark styling, loading states, left
  visualization/right editor split, and `/assets/{id}/idle.png` sprites.
  Its force simulation and draggable positions do not apply to numeric plots.
- Load authored definitions through `/api/content/entities`, which reads
  `packages/content/entities.yaml` and returns each entity's YAML `definition`.
  Parse those definitions without adding engine defaults. Do not use the runtime
  `contentManager` or copy Entities' fallback to bundled `ENTITY_CONTENT`:
  report a failed fresh-data load instead of silently showing bundled values.
- Extend `YamlEditor.tsx` with an explicit Balance kind, schema, model suffix,
  and diagnostics. Its existing provider dispatch falls through to entity help
  for unrecognized kinds, so update that dispatch deliberately. Keep the existing
  Monaco worker setup and custom completion infrastructure.
- Reuse the schema traversal patterns in `lib/content/editorHelp.ts` for
  references, unions, maps, and arrays. Expression completion also needs cursor
  context within expression strings and authored map keys, including suggestions
  after a dot and wildcard paths.
- Follow `lib/content/spawnConfig.ts` for validation separated from UI and file
  access. Share Balance configuration validation and the restricted expression
  parser between preview, editor diagnostics, and save validation. No reusable
  expression parser was found in the inspected content code.
- Follow `lib/content/scenarios.ts` for file-backed listing and atomic saves:
  write the original YAML text to a temporary file, then rename it. Do not
  import its Redis/engine commands or scenario ID restrictions into Balance.
- Follow `SpawnEditor.tsx` for exact-text dirty tracking and capturing submitted
  YAML before an asynchronous save. A successful save updates the baseline to
  that submitted text, preserving any newer edits made while saving.
- Extract the repeated content navigation into a shared component, preserving
  the existing tabs and exposing Balance consistently, with `aria-current` for
  the active page. Navigation is currently repeated across six components.
- Use the existing Vitest approach for focused configuration/parser/evaluator,
  completion, and persistence tests. Existing editor-help and spawn configuration
  tests provide useful examples.

### Recommended behavior and remaining decisions

The following defaults were identified during code review. Items explicitly
marked open still need a decision before implementing the affected behavior.

- **Save identity:** Save updates the configuration with the YAML's current ID.
  Changing the ID creates another saved visualization and leaves the original.
  Confirm before overwriting a different existing configuration.
- **Draft replacement:** Warn before either an example or a saved selection
  replaces a dirty draft; cancellation preserves the draft. Whether to protect
  navigation away and browser reload is still open for v1. Existing editors do
  not provide a complete precedent for this protection.
- **Expression grammar:** Define indexed array path syntax, such as
  `combat.attacks.0.damage`, wildcard traversal such as
  `combat.attacks.*.damage`, and whether reductions accept only one argument.
  These grammar details remain open. For wildcard branches with missing or
  nonnumeric values, prefer failing evaluation for that entity rather than
  silently skipping branches; document the final semantics in the parser tests.
- **Chart presentation:** Prefer linear axes, scatter domains fitted to eligible
  values with padding, and bars anchored at zero with support for negative
  values. Prefer consistent sprite sizes with authored rotation and hover details
  containing entity IDs and evaluated values. Handle single-value/constant
  domains without collapsing the axis.
- **Invalid edits:** Show configuration errors and suppress the visualization
  until the draft is valid again, avoiding an unlabeled stale plot.
- **Entity refresh:** Fetch definitions on entry and when loading a saved
  visualization so it evaluates against current `entities.yaml`, including
  changes made in another tab. Live polling is outside v1.
- **Storage:** Use `packages/content/balance/`. Safe filename encoding or a
  manifest mapping is an implementation choice, provided IDs retain their public
  no-whitespace contract and are never interpreted as unchecked paths.

### Authentication explicitly deferred

Do not add authentication, authorization, or a Balance-specific production
feature gate in this implementation. Existing content APIs have inconsistent
access patterns; a later app-wide pass will establish consistent authentication.
Do not copy scenario authentication or its production flag into Balance.

## Deferred work

- Editing entity field values from this screen and saving to `entities.yaml`.
- Entity filtering.
- Resolving sprite overlap.
- Additional expression functions or chart types, image export, and frozen
  entity-data snapshots.
- Authentication and authorization, deferred to the later app-wide auth pass.

## Acceptance criteria

1. Balance is reachable from content navigation and shows the split layout.
2. A scatter configuration places entity sprites according to authored numeric
   values and supports the maintenance-versus-speed example.
3. Bar charts show one value per eligible entity, descending by default, with
   ascending order configurable in YAML.
4. Completion assists YAML configuration and numeric field expressions.
5. Expressions support `sum`, `max`, arithmetic, and grouping as specified.
6. Missing or invalid entity values omit the entity and produce an ID and reason
   at the bottom; explicit zero values remain visible.
7. Configurations require a string ID without whitespace, save as YAML, and can
   be listed and loaded against current entity definitions.
8. Selecting an example warns before discarding unsaved changes; cancel keeps
   the draft intact.
