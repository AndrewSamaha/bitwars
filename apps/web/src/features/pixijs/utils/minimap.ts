export function worldToMinimapOffset(
  worldX: number,
  worldY: number,
  centerX: number,
  centerY: number,
  radiusPx: number,
  distanceScale: number,
) {
  const dx = worldX - centerX;
  const dy = worldY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance === 0 ? 0 : radiusPx * Math.tanh(distance / distanceScale) / distance;
  return { x: dx * scale, y: dy * scale };
}

export function minimapOffsetToWorld(
  offsetX: number,
  offsetY: number,
  radiusPx: number,
  distanceScale: number,
) {
  const radius = Math.min(Math.hypot(offsetX, offsetY), radiusPx * (1 - 1e-6));
  const distance = distanceScale * Math.atanh(radius / radiusPx);
  const scale = radius === 0 ? 0 : distance / radius;
  return { x: offsetX * scale, y: offsetY * scale };
}
