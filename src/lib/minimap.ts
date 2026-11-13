type Point = [number, number];

export const MINIMAP_RADIUS = 13;

export function minimapViewBox([x, z]: Point) {
  return `${x - MINIMAP_RADIUS} ${z - MINIMAP_RADIUS} ${MINIMAP_RADIUS * 2} ${MINIMAP_RADIUS * 2}`;
}

export function minimapBearing([x, z]: Point, [targetX, targetZ]: Point) {
  const dx = targetX - x, dz = targetZ - z;
  const distance = Math.hypot(dx, dz);
  if (distance <= MINIMAP_RADIUS - 2) return;

  // Keep the entire arrow inside the circular mask, even on diagonals.
  const inset = (MINIMAP_RADIUS - 3.5) / distance;
  return {
    point: [x + dx * inset, z + dz * inset] as Point,
    angle: Math.atan2(dx, -dz) * 180 / Math.PI,
  };
}
