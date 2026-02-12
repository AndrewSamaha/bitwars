# M5: Camera + World Space + Map UX — Approach

## Summary

M5 is **client-only**: it establishes a stable **world-coordinate space** and **camera + map UX** so that all future demos have a proper RTS feel. No server or simulation changes.

**Goals:**  
- Establish a stable world space and camera transform.  
- Improve demoability and “RTS feel” without expanding server scope.

**Deliverables:**  
1. Client camera (WASD pan, world coords on screen, correct screen→world).  
2. Deterministic procedural background from world coordinates.  
3. Minimap v1 (1/10 scale, unit dots, viewport rect; full reveal).

---

## 1. Client camera

**Current state (from `GameStage.tsx`):**  
- `worldContainer` is fixed at `(800, 500)` with `scale 0.5`.  
- “Camera” is effectively this fixed offset/scale; `setCamera(app.stage)` stores the stage, not a pannable camera.  
- Click-to-move already uses **world** space: `worldContainer.toLocal(global)` → `{ x, y }` passed to move intent. So the pipeline is “screen → world → server” and is correct as long as all view transforms live on the same container we call `toLocal` on.

**Approach:**

- **Single source of view transform**  
  Treat `worldContainer` (or a parent of it) as the “camera”: the only thing that moves/scales the world on screen. All pan/zoom changes go there so that `worldContainer.toLocal(global)` stays the single way to get world coords from a pointer.

- **WASD panning**  
  - Add a key listener (e.g. in `GameStage` or a small input hook) for W/A/S/D (and optionally arrow keys).  
  - Each key drives a pan velocity or a fixed pan step per keydown/repeat.  
  - Apply pan by updating `worldContainer.position` (or the camera parent) each frame.  
  - Tune pan speed so the world feels responsive but not jarring; consider making speed configurable (e.g. constant or scaled by delta time).

- **World coordinates on screen**  
  - Add a small HUD element (e.g. corner text) that shows “world (x, y)”.  
  - Compute (x, y) from the current pointer position using the same path as click-to-move: `worldContainer.toLocal(global)` (or from a “cursor in world” position updated on pointer move).  
  - Optionally also show coordinates at a fixed screen point (e.g. center) so players see “world at center” when not moving the mouse.

- **Preserving click targeting**  
  - Do **not** change how move/selection work: they already use `worldContainer.toLocal(global)`.  
  - Ensure any new camera logic only changes `worldContainer` (or its parent) position/scale; do not add a second transform path for clicks.  
  - After implementing pan, sanity-check: pan away, click somewhere, and confirm the unit moves to the correct world position (and that selection still hits the right entity).

**Acceptance:**  
Panning does not break click-to-move or selection; both still use correct world coordinates.

---

## 2. Deterministic procedural background

**Spec (from `docs/milestones/m5/procedurally-generated-background.md`):**  
- Infinite background from **world coordinates** and a **hardcoded seed** (no shared cell data).  
- Voronoi-like sectors: fixed cell size `S`, integer cell `(cx, cy)` from `floor(x/S)`, `floor(y/S)`; for each point, consider a small neighborhood (e.g. 3×3), generate site offsets with a deterministic hash of `(cellX, cellY, SEED)`; sector = nearest site; sector ID/color from sector ID.  
- Optional: use nearest and second-nearest site to draw faint borders where `d2 - d1` is small.

**Approach:**

- **Rendering layer**  
  - Add a background layer **under** the existing ground (so entities and ground clicks stay on top).  
  - Background is drawn from **world space** (same coordinate system as entities).  
  - Options: Pixi `Graphics` drawn in world space (e.g. in a container that shares the same transform as the world), or a tiled/canvas texture generated from world coords.  
  - Ensure this layer is a child of the same container that receives the camera transform (so it pans/zooms with the world).

- **Determinism**  
  - Single hardcoded `SEED` (e.g. constant in one place).  
  - All inputs to the procedural math: world position and `SEED` only (no time, no random).  
  - Same `(x, y)` + `SEED` → same sector ID and color on every client and every run.

- **Performance**  
  - Only generate/draw what’s visible (viewport in world space).  
  - Compute viewport bounds from camera transform and screen size (inverse of screen→world), then generate sectors/cells that intersect that bounds (with optional margin).  
  - If using tiles/cells, cache by cell key so the same cell doesn’t recompute every frame.

- **Sector ID and color**  
  - Sector ID = winning cell `(cellX, cellY)` or `hash(cellX, cellY, SEED)`.  
  - Color: e.g. `palette[hash(sectorID) % palette.length]` with a fixed palette.

**Acceptance:**  
Background is identical for all clients at the same world coordinates (and deterministic across reloads).

---

## 3. Minimap v1

**Requirements:**  
- 1/10 scale.  
- Shows unit dots and viewport rectangle.  
- Full reveal (no fog).

**Approach:**

- **Coordinate system**  
  - Minimap has its own “minimap world” space: `minimapWorld = world / 10` (or equivalently scale world by 0.1 when drawing).  
  - Define a fixed “minimap world extent” (e.g. symmetric around origin or based on initial entity positions + margin) so the minimap has a fixed size in pixels and a known world range.

- **Rendering**  
  - Separate Pixi container or canvas (e.g. in the HUD layer, not inside the pannable world container).  
  - **Units:** For each entity with a position, draw a dot at `(pos.x/10, pos.y/10)` in minimap space, then map that to minimap pixel rect (scale + offset so the chosen world extent fits in the minimap widget).  
  - **Viewport rect:** From camera transform and screen size, compute the visible world AABB in world coordinates. Scale that AABB by 0.1 and draw a rectangle in the same minimap space so the rect shows “what the main view is showing”.

- **Data flow**  
  - Unit positions: same source as main view (e.g. `game.world.with("pos", "id")` or equivalent).  
  - Viewport: derive from the same `worldContainer` (or camera) position/scale and app/canvas size so the rect stays in sync when the user pans.

- **Placement**  
  - Fixed corner (e.g. bottom-right), fixed size, above or below other HUD (terminal, entity panel).  
  - Ensure it doesn’t block critical clicks; optionally make it non-interactive or use it later for “click to move camera”.

**Acceptance:**  
Minimap tracks camera position (viewport rect) and unit positions correctly at 1/10 scale.

---

## Implementation order (suggested)

1. **Camera (pan + coords)**  
   - Implement WASD pan and world-coord display; verify click-to-move and selection still use correct world coords.  
   - Establishes the single transform and the viewport-in-world concept needed for background and minimap.

2. **Procedural background**  
   - Add the deterministic Voronoi layer in world space; hook it to viewport bounds so only visible region is generated.  
   - Validates world-space rendering and determinism without depending on the minimap.

3. **Minimap**  
   - Add minimap with unit dots and viewport rect, using the same camera/world data.  
   - Depends on having a stable camera and world extent.

---

## Risks and notes

- **Screen→world after pan:** As long as the only moving part is `worldContainer` (or its parent), `toLocal(global)` remains correct. Avoid introducing a separate camera object that isn’t the same transform used for hit-testing.
- **Background cost:** If the procedural pass is heavy, keep it to viewport + small margin and cache by cell; consider a simple tile/cell grid first, then add Voronoi styling per cell.
- **Minimap extent:** “Full reveal” means we don’t hide anything, but we still need a chosen world extent for the minimap so the 1/10 scale maps to a fixed pixel size; define that extent (e.g. from config or from current world bounds + padding) and document it.

This order and structure should cover the M5 deliverables and acceptance criteria without touching server or simulation code.
