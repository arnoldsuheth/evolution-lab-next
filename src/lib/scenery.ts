import { BUILDINGS, TREES } from './navigation';
import { PROPS, onRoad, townBlocked } from './town';

/** Detalhes decorativos do chão: posições fixas (mesmas em todo aparelho) e fora de caminhos e construções. */
export type Decoration = { x: number; z: number; scale: number; turn: number; tone: number };
function random(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function isClearGround(x: number, z: number) {
  if (Math.hypot(x, z) < 8.2) return false; // praça do cristal (com folga: praça limpa)
  if (Math.abs(x) < 3.2 && z > -30 && z < 21) return false; // estrada principal
  if (Math.abs(z - 9 - x * .12) < 2.2 && Math.abs(x) > 7 && Math.abs(x) < 35) return false; // estradas laterais
  if (BUILDINGS.some(b => Math.abs(x - b.x) < b.w + 1.2 && Math.abs(z - b.z) < b.d + 1.2)) return false;
  if (TREES.some(t => Math.hypot(x - t.x, z - t.z) < .9 * t.size)) return false;
  if (onRoad(x, z, .35) || townBlocked(x, z) || PROPS.some(p => Math.hypot(x - p.x, z - p.z) < Math.max(.8, p.radius + .5))) return false; // ruas e objetos da cidade
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
export const SCENERY_DENSITY = { low: { grass: 90, flowers: 34, pebbles: 8 }, medium: { grass: 170, flowers: 60, pebbles: 14 }, high: { grass: 280, flowers: 95, pebbles: 22 } } as const;
