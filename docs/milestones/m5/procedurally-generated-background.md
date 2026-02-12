### Deterministic Voronoi sectors with a hardcoded seed (no shared cell data)

We can generate “Voronoi sectors” over an infinite, continuous world coordinate plane by making the sector layout a **pure function of world position** plus a **hardcoded seed**. No per-cell data needs to be stored or synchronized between clients.

**Core idea**

1. Choose a fixed **cell size** `S` (sector scale, e.g. 1200 world units).
2. For any world position `p = (x, y)`, compute its integer cell coordinate:

   * `cx = floor(x / S)`, `cy = floor(y / S)`
3. For each neighbor cell around `(cx, cy)` (usually a 3×3 neighborhood):

   * Generate a pseudo-random site offset `(u, v) ∈ [0,1)²` using a deterministic hash of:

     * `(cellX, cellY, SEED)`
   * Convert that into a site position in world space:

     * `site = ((cellX + u) * S, (cellY + v) * S)`
4. The sector containing `p` is defined by the **nearest site** among those candidates.

**Sector ID / color**

* The winning site’s owning cell `(cellX, cellY)` (or a hash of it) becomes the **sector ID**.
* Sector color is chosen deterministically from the sector ID (e.g., `palette[hash(sectorID) % palette.length]`).

**Sector borders**

* Track both the nearest and second-nearest site distances (`d1`, `d2`).
* Where `d2 - d1` is small, the point is near a boundary; use this to draw faint border lines.

**Determinism guarantee**
Because site placement is computed from integer cell coordinates and a **hardcoded `SEED`**, every client will generate identical sector shapes and colors for the same world coordinates—without any networked cell metadata.
