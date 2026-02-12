/**
 * M5.2: Deterministic procedural Voronoi-style background.
 * Pure functions of world position + SEED only. No Date, no Math.random().
 * Same (x, y) + SEED → same sector and color on all clients and reloads.
 */

export const CELL_SIZE = 1200;
export const SEED = 0xb1_74_75_35;

/** Screen-space sample grid step (pixels). Bigger = faster, more low-fi. */
export const SAMPLE_SPACING = 10;

/** Squared-distance gap below which we treat sample as on a Voronoi edge (draw border). */
export const EDGE_THRESHOLD_SQ = 80_000;

/** Color for Voronoi border dots (screen-space overlay). */
export const BORDER_COLOR = 0x4a_55_66;

/** Fixed palette (hex). Sector color = palette[hash(sectorId) % palette.length]. */
export const DEFAULT_PALETTE = [
  0x2d_3a_4a,
  0x3d_4e_5e,
  0x1a_2a_3a,
  0x25_35_45,
  0x34_44_54,
  0x22_32_42,
  0x2e_3e_4e,
  0x28_38_48,
] as const;

/** Deterministic 32-bit mix from (cellX, cellY, seed). Integer-only. */
function cellHash(cellX: number, cellY: number, seed: number): number {
  const x = (cellX | 0) >>> 0;
  const y = (cellY | 0) >>> 0;
  const s = (seed | 0) >>> 0;
  let h = (x * 73856093) ^ (y * 19349663) ^ (s * 83492791);
  return (h >>> 0) & 0x7fff_ffff;
}

/**
 * Deterministic offset (u, v) in [0, 1) for cell (cellX, cellY).
 * Derived from integer hash only.
 */
function cellOffset(cellX: number, cellY: number, seed: number): { u: number; v: number } {
  const h = cellHash(cellX, cellY, seed);
  const u = (h & 0xffff) / 65536;
  const v = ((h >>> 16) & 0xffff) / 65536;
  return { u, v };
}

/**
 * World position of the Voronoi site for cell (cellX, cellY).
 * site = ((cellX + u) * S, (cellY + v) * S).
 */
export function getSiteForCell(
  cellX: number,
  cellY: number,
  cellSize: number,
  seed: number,
): { x: number; y: number } {
  const { u, v } = cellOffset(cellX, cellY, seed);
  return {
    x: (cellX + u) * cellSize,
    y: (cellY + v) * cellSize,
  };
}

export type SectorId = { cx: number; cy: number };

/**
 * Sector at world point (x, y): the cell that owns the nearest site in the 3×3 neighborhood.
 * Returns the winning (cellX, cellY).
 */
export function getSectorAt(
  x: number,
  y: number,
  cellSize: number,
  seed: number,
): SectorId {
  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  let bestCell = { cx: cx - 1, cy: cy - 1 };
  let bestDistSq = Infinity;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cellX = cx + dx;
      const cellY = cy + dy;
      const site = getSiteForCell(cellX, cellY, cellSize, seed);
      const dx2 = x - site.x;
      const dy2 = y - site.y;
      const distSq = dx2 * dx2 + dy2 * dy2;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestCell = { cx: cellX, cy: cellY };
      }
    }
  }

  return bestCell;
}

/**
 * Nearest and second-nearest squared distances from world point to Voronoi sites.
 * Used for edge test: (d2 - d1) small → near boundary.
 */
export function getVoronoiDistancesAt(
  xWorld: number,
  yWorld: number,
  cellSize: number,
  seed: number,
  neighborhoodSize: number = 1,
): { d1Sq: number; d2Sq: number } {
  const cx = Math.floor(xWorld / cellSize);
  const cy = Math.floor(yWorld / cellSize);
  const radius = neighborhoodSize;
  let d1Sq = Infinity;
  let d2Sq = Infinity;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const cellX = cx + dx;
      const cellY = cy + dy;
      const site = getSiteForCell(cellX, cellY, cellSize, seed);
      const ddx = xWorld - site.x;
      const ddy = yWorld - site.y;
      const distSq = ddx * ddx + ddy * ddy;
      if (distSq < d1Sq) {
        d2Sq = d1Sq;
        d1Sq = distSq;
      } else if (distSq < d2Sq) {
        d2Sq = distSq;
      }
    }
  }

  return { d1Sq, d2Sq };
}

/** Deterministic numeric hash for sector ID (for palette index). Integer-only. */
function sectorIdHash(cx: number, cy: number): number {
  const x = (cx | 0) >>> 0;
  const y = (cy | 0) >>> 0;
  return ((x * 31 + y) * 127 + SEED) >>> 0;
}

/**
 * Hex color for a sector. palette[hash(sectorId) % palette.length].
 */
export function getSectorColor(
  sector: SectorId,
  palette: readonly number[],
): number {
  if (palette.length === 0) return 0x333333;
  const h = sectorIdHash(sector.cx, sector.cy);
  return palette[h % palette.length]!;
}

export type WorldAABB = { minX: number; minY: number; maxX: number; maxY: number };

type PointLike = { x: number; y: number };

/**
 * Visible world AABB from camera transform and screen size.
 * Transforms four screen corners with camera.toLocal and takes min/max.
 * Adds margin so panning doesn't reveal empty edges.
 */
export function getViewportWorldAABB(
  camera: { toLocal: (p: PointLike) => PointLike },
  screenWidth: number,
  screenHeight: number,
  marginWorld: number = CELL_SIZE,
): WorldAABB {
  const corners = [
    camera.toLocal({ x: 0, y: 0 }),
    camera.toLocal({ x: screenWidth, y: 0 }),
    camera.toLocal({ x: screenWidth, y: screenHeight }),
    camera.toLocal({ x: 0, y: screenHeight }),
  ];
  let minX = corners[0]!.x;
  let minY = corners[0]!.y;
  let maxX = minX;
  let maxY = minY;
  for (let i = 1; i < corners.length; i++) {
    const c = corners[i]!;
    if (c.x < minX) minX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.x > maxX) maxX = c.x;
    if (c.y > maxY) maxY = c.y;
  }
  return {
    minX: minX - marginWorld,
    minY: minY - marginWorld,
    maxX: maxX + marginWorld,
    maxY: maxY + marginWorld,
  };
}

/**
 * Cell range (inclusive) that covers the given world AABB, with optional extra margin in cells.
 */
export function getVisibleCellRange(
  aabb: WorldAABB,
  cellSize: number,
  marginCells: number = 1,
): { minCx: number; maxCx: number; minCy: number; maxCy: number } {
  const minCx = Math.floor(aabb.minX / cellSize) - marginCells;
  const maxCx = Math.floor(aabb.maxX / cellSize) + marginCells;
  const minCy = Math.floor(aabb.minY / cellSize) - marginCells;
  const maxCy = Math.floor(aabb.maxY / cellSize) + marginCells;
  return { minCx, maxCx, minCy, maxCy };
}
