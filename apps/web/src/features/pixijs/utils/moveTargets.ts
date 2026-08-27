export type MoveTarget = { x: number; y: number };

/** Assign nearby grid slots far enough apart for every selected hull. */
export function spreadMoveTargets(target: MoveTarget, hullRadii: number[]): MoveTarget[] {
  const largestRadius = Math.max(0, ...hullRadii.map((radius) => Number.isFinite(radius) ? radius : 0));
  if (hullRadii.length < 2 || largestRadius === 0) return hullRadii.map(() => target);

  const spacing = largestRadius * 2 + 1;
  const slots: MoveTarget[] = [{ ...target }];
  for (let ring = 1; slots.length < hullRadii.length; ring++) {
    for (let y = -ring; y <= ring && slots.length < hullRadii.length; y++) {
      for (let x = -ring; x <= ring && slots.length < hullRadii.length; x++) {
        if (Math.max(Math.abs(x), Math.abs(y)) === ring) {
          slots.push({ x: target.x + x * spacing, y: target.y + y * spacing });
        }
      }
    }
  }
  return slots;
}
