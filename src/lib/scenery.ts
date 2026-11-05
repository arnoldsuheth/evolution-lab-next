import { BUILDINGS, TREES } from './navigation';

/** Detalhes decorativos do chão: posições fixas (mesmas em todo aparelho) e fora de caminhos e construções. */
export type Decoration = { x: number; z: number; scale: number; turn: number; tone: number };
function random(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function isClearGround(x: number, z: number) {
  if (Math.hypot(x, z) < 6.6) return false; // praça do cristal
  if (Math.abs(x) < 3.2 && z > -30 && z < 21) return false; // estrada principal
  if (Math.abs(z - 9 - x * .12) < 2.2 && Math.abs(x) > 7 && Math.abs(x) < 35) return false; // estradas laterais
  if (BUILDINGS.some(b => Math.abs(x - b.x) < b.w + 1.2 && Math.abs(z - b.z) < b.d + 1.2)) return false;
  if (TREES.some(t => Math.hypot(x - t.x, z - t.z) < .9 * t.size)) return false;
  return true;
}
export function scatter(count: number, seed: number, radius = 34, cluster = 6): Decoration[] {
  const next = random(seed), result: Decoration[] = [];
  for (let tries = 0; result.length < count && tries < count * 6; tries++) {
    const angle = next() * Math.PI * 2, distance = 6 + Math.sqrt(next()) * radius, cx = Math.cos(angle) * distance, cz = Math.sin(angle) * distance * .85 - 4;
    for (let k = 0; k < cluster && result.length < count; k++) {
      const x = cx + (next() - .5) * 2.6, z = cz + (next() - .5) * 2.2;
      if (!isClearGround(x, z)) continue;
      result.push({ x, z, scale: .7 + next() * .8, turn: next() * Math.PI * 2, tone: next() });
    }
  }
  return result;
}
export const SCENERY_DENSITY = { low: { grass: 260, flowers: 60, pebbles: 30 }, medium: { grass: 520, flowers: 120, pebbles: 50 }, high: { grass: 900, flowers: 200, pebbles: 80 } } as const;
