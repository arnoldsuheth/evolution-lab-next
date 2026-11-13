import * as THREE from 'three';

/**
 * As cabeças KayKit têm peças separadas na malha: rosto+cabelo, 2 sobrancelhas, 2 orelhas, 2 olhos e o nariz.
 * Quando o jogador escolhe outra sobrancelha, nariz ou orelha, a peça original sai da malha
 * (antes a nova era desenhada por cima da antiga e as duas apareciam).
 */
export type TrimParts = { brows: boolean; nose: boolean; ears: boolean };
export type HeadIsland = { kind: 'face' | 'brow' | 'ear' | 'eye' | 'nose' | 'other'; triangles: number[] };

/** Classifica uma ilha pela caixa que a envolve (mesma escala das cabeças KayKit). */
export function classifyIsland(box: { min: [number, number, number]; max: [number, number, number] }, largest: boolean): HeadIsland['kind'] {
  if (largest) return 'face';
  const cx = (box.min[0] + box.max[0]) / 2, cy = (box.min[1] + box.max[1]) / 2, ax = Math.abs(cx);
  if (ax > .4 && box.min[1] > 1.3 && box.max[1] < 1.75 && box.max[1] - box.min[1] > .2) return 'ear';
  if (ax < .07 && cy > 1.45 && cy < 1.65) return 'nose';
  if (ax > .08 && ax < .36 && box.min[1] > 1.62 && box.max[1] < 1.86) return 'brow';
  if (ax > .1 && ax < .3 && cy > 1.55 && cy < 1.66) return 'eye';
  return 'other';
}

/** Separa a malha em ilhas (vértices na mesma posição contam como ligados, por causa das costuras de UV). */
export function headIslands(positions: ArrayLike<number>, index: ArrayLike<number>): HeadIsland[] {
  const count = positions.length / 3, key = new Map<string, number>(), rep = new Int32Array(count), parent = new Int32Array(count);
  for (let i = 0; i < count; i++) { const k = `${Math.round(positions[i * 3] * 1e4)},${Math.round(positions[i * 3 + 1] * 1e4)},${Math.round(positions[i * 3 + 2] * 1e4)}`; let r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; parent[i] = i; }
  const find = (a: number) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  for (let t = 0; t < index.length; t += 3) { const a = find(rep[index[t]]); parent[find(rep[index[t + 1]])] = a; parent[find(rep[index[t + 2]])] = a; }
  const groups = new Map<number, { tris: number[]; min: [number, number, number]; max: [number, number, number] }>();
  for (let t = 0; t < index.length; t += 3) {
    const g = find(rep[index[t]]); let entry = groups.get(g);
    if (!entry) { entry = { tris: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }; groups.set(g, entry); }
    entry.tris.push(t);
    for (let k = 0; k < 3; k++) { const v = index[t + k]; for (let a = 0; a < 3; a++) { const p = positions[v * 3 + a]; if (p < entry.min[a]) entry.min[a] = p; if (p > entry.max[a]) entry.max[a] = p; } }
  }
  const list = [...groups.values()], biggest = Math.max(...list.map(g => g.tris.length));
  return list.map(g => ({ kind: classifyIsland(g, g.tris.length === biggest), triangles: g.tris }));
}

const cache = new WeakMap<THREE.BufferGeometry, Map<string, THREE.BufferGeometry>>();
/** Mesma geometria sem as peças escolhidas (guardada para reaproveitar entre heróis iguais). */
export function trimHead(geometry: THREE.BufferGeometry, trim: TrimParts): THREE.BufferGeometry {
  if (!trim.brows && !trim.nose && !trim.ears) return geometry;
  const k = `${+trim.brows}${+trim.nose}${+trim.ears}`; let byKey = cache.get(geometry);
  if (!byKey) { byKey = new Map(); cache.set(geometry, byKey); }
  const hit = byKey.get(k); if (hit) return hit;
  const position = geometry.getAttribute('position'), index = geometry.getIndex(); if (!position || !index) return geometry;
  const drop = new Set<HeadIsland['kind']>([...(trim.brows ? ['brow' as const] : []), ...(trim.nose ? ['nose' as const] : []), ...(trim.ears ? ['ear' as const] : [])]);
  const src = index.array, keep: number[] = [];
  for (const island of headIslands(position.array, src)) if (!drop.has(island.kind)) for (const t of island.triangles) keep.push(src[t], src[t + 1], src[t + 2]);
  const out = geometry.clone(); out.setIndex(keep); byKey.set(k, out); return out;
}
