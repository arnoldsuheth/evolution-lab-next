import {waterwayBlocks} from './waterways';
import {biomeBlocks} from './biomes';
import {marketCounterBlocks} from "./cityMarket";
import {cityWalkable,isNewCity,trainerHouseBlocks,trainerHouses} from './kingdomCities';
import {cityWallBlocks, insideCity, type Road} from './overland';
import {insideWorld} from "./worldBounds";
import {INTERIORS, interiorBlocks, townBlocked} from "./town";
export const BUILDINGS = [{x:-35,z:7,w:2.6,d:2.5},{x:-31,z:18,w:2.6,d:2.5},{x:35,z:7,w:2.6,d:2.5},{x:31,z:18,w:2.6,d:2.5},{ x: 9, z: 4, w: 2.6, d: 2.5 }, ...INTERIORS];
/** 2.0: casas da vila (Medieval Village) em volta da Cidadela. w/d = metade do tamanho, para a colisão. */
export type VillageHouseSpot = { x: number; z: number; rot: number; cells: [2 | 3, 2 | 3 | 4]; floors: 1 | 2; brick?: boolean };
export const VILLAGE_HOUSES: VillageHouseSpot[] = [
  { x: -31, z: -5, rot: Math.PI / 2, cells: [3, 3], floors: 2, brick: true }, { x: -31, z: -16, rot: Math.PI / 2, cells: [2, 2], floors: 1 },
  { x: 31, z: -5, rot: -Math.PI / 2, cells: [2, 3], floors: 2 }, { x: 31, z: -16, rot: -Math.PI / 2, cells: [3, 3], floors: 1, brick: true },
  { x: -44, z: 1.5, rot: 0, cells: [2, 2], floors: 2 }, { x: -41, z: 21, rot: Math.PI, cells: [3, 3], floors: 1, brick: true },
  { x: 44, z: 6, rot: 0, cells: [2, 3], floors: 1 }, { x: 42, z: 22, rot: Math.PI, cells: [2, 2], floors: 2, brick: true },
];
const villageBlocks = (x: number, z: number) => VILLAGE_HOUSES.some(h => { const turned = Math.abs(Math.sin(h.rot)) > .5, hw = turned ? h.cells[1] : h.cells[0], hd = turned ? h.cells[0] : h.cells[1]; return Math.abs(x - h.x) < hw + .5 && Math.abs(z - h.z) < hd + .5; });
export const TREES = Array.from({ length: 48 }, (_, i) => { const a = i * 2.39996; const r = 7 + (i % 5) * 1.6; return { x: Math.cos(a) * r, z: -22 + Math.sin(a) * r * 0.5, size: 0.75 + (i % 4) * 0.18 }; }).filter(t => Math.abs(t.x) > 2.2 && !VILLAGE_HOUSES.some(h => Math.hypot(t.x - h.x, t.z - h.z) < h.cells[0] + 3.2));
export const REGION_PILLARS = Array.from({length:12},(_,i)=>({x:Math.cos(i*2.4)*18,z:-10+Math.sin(i*2.4)*14}));
export function walkable(x: number, z: number, region="aurora", airborne=false) {
  if (!insideWorld(x,z)) return false;
  if(region==="instance")return Math.abs(x)<=12&&z>=-23&&z<=12;
  if (!airborne && (cityWallBlocks(region,x,z) || marketCounterBlocks(region,x,z) || biomeBlocks(region,x,z) || waterwayBlocks(region,x,z))) return false;
  if(isNewCity(region))return cityWalkable(region,x,z);
  if(region!=="aurora")return airborne || !REGION_PILLARS.some(p=>Math.hypot(x-p.x,z-p.z)<1.6);
  if (BUILDINGS.some(b => "id" in b ? interiorBlocks(b, x, z) : Math.abs(x - b.x) < b.w + 0.4 && Math.abs(z - b.z) < b.d + 0.4)) return false;
  if (villageBlocks(x, z)) return false;
  if (townBlocked(x, z) || trainerHouses("aurora").some(house=>trainerHouseBlocks(house,x,z))) return false;
  if (TREES.some(t => Math.hypot(x - t.x, z - t.z) < 0.6)) return false;
  if (Math.hypot(x, z) < 1.45 || Math.hypot(x - 22, z + 20) < 2) return false;
  return true;
}
export function findPath(start: [number, number], end: [number, number], region="aurora", airborne=false): [number, number][] {
  const target: [number, number] = [Math.round(end[0]), Math.round(end[1])];
  if (!walkable(...target, region, airborne)) return [];
  const begin: [number, number] = [Math.round(start[0]), Math.round(start[1])];
  const key = (p: [number, number]) => p.join(",");
  const open = [{ p: begin, g: 0, f: 0 }]; const visited = new Set<string>(); const parents = new Map<string, [number, number]>(); const scores = new Map([[key(begin), 0]]);
  for (let count = 0; open.length && count < 10000; count++) {
    open.sort((a, b) => a.f - b.f); const current = open.shift()!; const ck = key(current.p);
    if (visited.has(ck)) continue;
    if (ck === key(target)) { const path: [number, number][] = [target]; let cursor = target; while (parents.has(key(cursor))) { cursor = parents.get(key(cursor))!; path.unshift(cursor); } return path.slice(1); }
    visited.add(ck);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const next: [number, number] = [current.p[0] + dx, current.p[1] + dz];
      if (!walkable(...next, region, airborne) || (dx && dz && (!walkable(current.p[0] + dx, current.p[1], region,airborne) || !walkable(current.p[0], current.p[1] + dz, region,airborne)))) continue;
      const g = current.g + Math.hypot(dx, dz); const nk = key(next);
      if (g >= (scores.get(nk) ?? Infinity)) continue;
      scores.set(nk, g); parents.set(nk, current.p); open.push({ p: next, g, f: g + Math.hypot(next[0] - target[0], next[1] - target[1]) });
    }
  }
  return [];
}


export function followRoadPath(start:[number,number],road:Road,region:string,airborne=false):[number,number][] {
  let first=0;
  if(!insideCity(region,...start)){
    let nearest=Infinity;
    for(const [i,[x,z]] of road.points.entries()){
      const distance=Math.hypot(start[0]-x,start[1]-z);
      if(distance<nearest){first=i;nearest=distance;}
    }
  }
  const path:[number,number][]=[];
  let previous=start;
  for(const point of road.points.slice(first)){
    const alreadyThere=Math.round(previous[0])===Math.round(point[0])&&Math.round(previous[1])===Math.round(point[1]);
    if(!alreadyThere){
      const leg=findPath(previous,point,region,airborne);
      if(!leg.length)return [];
      path.push(...leg);
    }
    previous=point;
  }
  return path;
}
