export const BUILDINGS = [{ x: -9, z: 5, w: 2.7, d: 2.7 }, { x: 9, z: 4, w: 2.6, d: 2.5 }, { x: -8, z: -6, w: 2.8, d: 2.5 }, { x: 9, z: -7, w: 2.6, d: 2.6 }];
export const TREES = Array.from({ length: 48 }, (_, i) => { const a = i * 2.39996; const r = 7 + (i % 5) * 1.6; return { x: Math.cos(a) * r, z: -22 + Math.sin(a) * r * 0.5, size: 0.75 + (i % 4) * 0.18 }; }).filter(t => Math.abs(t.x) > 2.2);
export const REGION_PILLARS = Array.from({length:12},(_,i)=>({x:Math.cos(i*2.4)*18,z:-10+Math.sin(i*2.4)*14}));
export function walkable(x: number, z: number, forest: boolean, mines: boolean, region="aurora") {
  if (![x, z].every(Number.isFinite) || Math.abs(x) > 27 || z < -28 || z > 14) return false;
  if(region!=="aurora")return !REGION_PILLARS.some(p=>Math.hypot(x-p.x,z-p.z)<1.6);
  if (z < -12 && !forest) return false;
  if (x > 15 && !mines) return false;
  if (BUILDINGS.some(b => Math.abs(x - b.x) < b.w + 0.4 && Math.abs(z - b.z) < b.d + 0.4)) return false;
  if (TREES.some(t => Math.hypot(x - t.x, z - t.z) < 0.6)) return false;
  if (Math.hypot(x, z) < 1.45 || Math.hypot(x - 22, z + 20) < 2) return false;
  return true;
}
export function findPath(start: [number, number], end: [number, number], forest: boolean, mines: boolean, region="aurora"): [number, number][] {
  const target: [number, number] = [Math.round(end[0]), Math.round(end[1])];
  if (!walkable(...target, forest, mines,region)) return [];
  const begin: [number, number] = [Math.round(start[0]), Math.round(start[1])];
  const key = (p: [number, number]) => p.join(",");
  const open = [{ p: begin, g: 0, f: 0 }]; const visited = new Set<string>(); const parents = new Map<string, [number, number]>(); const scores = new Map([[key(begin), 0]]);
  for (let count = 0; open.length && count < 4000; count++) {
    open.sort((a, b) => a.f - b.f); const current = open.shift()!; const ck = key(current.p);
    if (visited.has(ck)) continue;
    if (ck === key(target)) { const path: [number, number][] = [target]; let cursor = target; while (parents.has(key(cursor))) { cursor = parents.get(key(cursor))!; path.unshift(cursor); } return path.slice(1); }
    visited.add(ck);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const next: [number, number] = [current.p[0] + dx, current.p[1] + dz];
      if (!walkable(...next, forest, mines,region) || (dx && dz && (!walkable(current.p[0] + dx, current.p[1], forest, mines,region) || !walkable(current.p[0], current.p[1] + dz, forest, mines,region)))) continue;
      const g = current.g + Math.hypot(dx, dz); const nk = key(next);
      if (g >= (scores.get(nk) ?? Infinity)) continue;
      scores.set(nk, g); parents.set(nk, current.p); open.push({ p: next, g, f: g + Math.hypot(next[0] - target[0], next[1] - target[1]) });
    }
  }
  return [];
}
