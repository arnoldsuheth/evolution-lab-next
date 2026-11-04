export const WORLD_LIMIT = 12;
export const HERO_RADIUS = 0.55;

export const HOUSES = [
  { x: -7, z: -6 },
  { x: 7, z: -6 },
  { x: -7, z: 6 },
  { x: 7, z: 6 },
] as const;

export const NPCS = [
  { id: "shop", x: -3, z: -3 },
  { id: "mentor", x: 3, z: -3 },
] as const;

export const INTERACTION_DISTANCE = 2.5;

export function nearNpc(
  x: number,
  z: number,
  npc: { x: number; z: number }
): boolean {
  if (![x, z, npc.x, npc.z].every(Number.isFinite)) return false;
  return Math.hypot(x - npc.x, z - npc.z) <= INTERACTION_DISTANCE;
}

export function canMoveTo(x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;

  if (Math.abs(x) > WORLD_LIMIT || Math.abs(z) > WORLD_LIMIT) {
    return false;
  }

  const houseClearance = 1.5 + HERO_RADIUS;

  const clearHouses = HOUSES.every(h =>
    Math.abs(x - h.x) >= houseClearance ||
    Math.abs(z - h.z) >= houseClearance
  );

  const clearNpc = NPCS.every(n =>
    Math.hypot(x - n.x, z - n.z) >= HERO_RADIUS + 0.5
  );

  return clearHouses && clearNpc;
}