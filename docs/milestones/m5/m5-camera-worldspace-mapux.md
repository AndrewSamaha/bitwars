# M5: Camera + World Space + Map UX — As Built

## Summary

M5 is **client-only**: it establishes a stable **world-coordinate space** and **camera + map UX** so that all future demos have a proper RTS feel. No server or simulation changes.

**Goals:**  
- Establish a stable world space and camera transform.  
- Improve demoability and “RTS feel” without expanding server scope.

**Deliverables (implemented):**  
1. Client camera (WASD/arrow pan, grid coords on screen, correct screen→world).  
2. Deterministic procedural Voronoi **borders** (screen-space sampling, edge test; no colored cell grid).  
3. Minimap v1 (camera-centered, 1 px = 100 world units, unit dots, viewport rect; full reveal).

---

## 1. Client camera (M5.1)

**As built:**

- **Camera**  
  `worldContainer` is the camera: we pan by updating its `position`. `setCamera(worldContainer)` so HUD/overlays can use the same transform. Initial position (800, 500), scale 0.5.

- **WASD / arrow pan**  
  - Keys: W, A, S, D and ArrowUp, ArrowDown, ArrowLeft, ArrowRight.  
  - W/ArrowUp move the world **up** (camera up); S/ArrowDown move world down; A/ArrowLeft move world left; D/ArrowRight move world right.  
  - Pan applied in the main ticker with delta-time (`ticker.deltaMS`) so speed is frame-rate independent (`PAN_SPEED = 400` world units/sec).  
  - Pan is **not** applied when focus is in an input or textarea (e.g. terminal), to avoid typing into the terminal.

- **Coordinates on screen**  
  - **CoordsOverlay** (bottom-left) shows **grid (cell) coordinates** at the **center of the screen**, not world coordinates.  
  - Formula: `cx = floor(centerWorld.x / CELL_SIZE)`, `cy = floor(centerWorld.y / CELL_SIZE)` with `CELL_SIZE` from the procedural background (1200). Same grid as Voronoi.  
  - Center in world is computed each tick via `camera.toLocal({ x: app.screen.width/2, y: app.screen.height/2 })`.  
  - Label: `grid cx, cy`.

- **Click targeting**  
  Move and selection still use `worldContainer.toLocal(global)`; only `worldContainer.position` changes for pan, so click-to-move and selection remain correct.

**Files:**  
- `apps/web/src/features/pixijs/components/GameStage.tsx` (pan keys, ticker, camera).  
- `apps/web/src/features/hud/components/CoordsOverlay.tsx` (grid coords at center).

---

## 2. Deterministic procedural background (M5.2)

**As built:**

- **Voronoi borders only**  
  We do **not** draw a colored cell grid. We draw only **Voronoi edge** samples in **screen space**: for each sample point on a screen-space grid, we convert to world, compute nearest and second-nearest site distances (`d1`, `d2`), and if `(d2 - d1) < EDGE_THRESHOLD_SQ` we draw a small rect (border dot). This produces visible Voronoi boundaries.

- **Spec / algorithm**  
  - Fixed `CELL_SIZE` (1200), hardcoded `SEED`. Deterministic hash from `(cellX, cellY, SEED)` → `(u, v) ∈ [0,1)²`; site = `((cellX+u)*CELL_SIZE, (cellY+v)*CELL_SIZE)`.  
  - For each **screen** sample `(sx, sy)` with step `SAMPLE_SPACING` (10 px): `pWorld = camera.toLocal({ x: sx, y: sy })`; then 3×3 neighbor cells, compute site positions, get `d1Sq` and `d2Sq` (nearest and second-nearest squared distances); `edge = d2Sq - d1Sq`; if `edge < EDGE_THRESHOLD_SQ` draw a 2×2 px rect at `(sx, sy)` with `BORDER_COLOR`.  
  - All inputs to the procedural math are world position and SEED only (no time, no random). Deterministic across clients and reloads.

- **Rendering**  
  - A single Pixi `Graphics` (**voronoiBorderGraphics**) is added to **app.stage** (screen space), so it draws on top of the world.  
  - Each update: clear, then loop over sample grid and draw border dots.  
  - **Throttling:** Updates run every **100 ms** or when the camera has moved more than **25** world units, to avoid recomputing every frame.

- **No colored grid**  
  The earlier world-space colored cell grid was removed; only the screen-space Voronoi border overlay remains.

**Files:**  
- `apps/web/src/features/pixijs/utils/proceduralBackground.ts` (hash, `getSiteForCell`, `getSectorAt`, `getVoronoiDistancesAt`, `getViewportWorldAABB`, constants).  
- `apps/web/src/features/pixijs/components/GameStage.tsx` (voronoi border Graphics on stage, sample loop, throttle).

---

## 3. Minimap v1 (M5.3)

**As built:**

- **Placement**  
  Fixed **200×200 px** widget, **bottom-right** with 10 px margin. Pixi `Container` on `app.stage` (screen space). Position updated each frame so it stays bottom-right on resize. `eventMode = 'none'`.

- **Coordinate system**  
  - Minimap is **centered on the camera** (screen center in world space), not on world origin.  
  - Each frame: `centerWorld = camera.toLocal({ x: app.screen.width/2, y: app.screen.height/2 })`.  
  - World range shown: **±10_000** world units from that center (20_000 × 20_000 world area).  
  - **Scale: 1 minimap pixel = 100 world units** (200 px → 20_000 world units).  
  - Mapping: `px = ((wx - centerX + MINIMAP_HALF_EXTENT) / (2 * MINIMAP_HALF_EXTENT)) * MINIMAP_SIZE_PX` (same for y).

- **Content**  
  - **Background:** Dark filled rect + thin border.  
  - **Viewport rect:** Visible world AABB from `getViewportWorldAABB(camera, width, height, 0)`; corners mapped to minimap pixels; stroked blue rect. Clamped to the minimap bounds.  
  - **Unit dots:** For each entity in `game.world.with("pos", "id")`, map `pos` to minimap pixels; if inside the 200×200 rect, draw a small filled circle (radius 2, light blue).

- **Full reveal**  
  No fog; all units in the shown world range are drawn.

**Files:**  
- `apps/web/src/features/pixijs/components/GameStage.tsx` (minimap container, `worldToMinimapPx`, `updateMinimap` in ticker).

---

## Implementation notes

- **Screen→world**  
  Single transform: `worldContainer`. All screen→world uses `camera.toLocal(...)` (camera is `worldContainer`). No separate camera object for hit-testing.

- **Voronoi performance**  
  Border updates are throttled (100 ms or 25 world units camera move). Sample grid step is 10 px (configurable via `SAMPLE_SPACING`).

- **Minimap scale**  
  Scale is controlled by `MINIMAP_HALF_EXTENT` (10_000 → 1 px = 100 world units). Changing it changes how much world the 200 px widget shows.

---

## Acceptance (met)

- Panning does not break click-to-move or selection; both use correct world coordinates.  
- Voronoi borders are deterministic (same world + SEED → same edges); identical for all clients at the same world coordinates.  
- Minimap tracks camera position (viewport rect) and unit positions correctly at the chosen scale (1 px = 100 world units), centered on the camera.
