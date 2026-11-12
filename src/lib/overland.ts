import { isRacialCity, type RacialCity } from './kingdomCities';

type Point = [number, number];
export type CityGate = { point: Point; outward: Point; name: string };
type Wall = { a: Point; b: Point };
export const GATE_HALF_WIDTH = 2.1;
export const ROAD_EXIT_RADIUS = 4;

const GROUND_CITIES = {
  aurora: { halfWidth: 23, north: -12, south: 22 },
  'iron-forge': { halfWidth: 25, north: -22, south: 18 },
  gnomolandia: { halfWidth: 25, north: -22, south: 18 },
  bosque: { halfWidth: 27, north: -22, south: 18 },
  ogrimmar: { halfWidth: 25, north: -22, south: 18 },
} as const;

export function cityDefences(region: string): { walls: Wall[]; gates: CityGate[] } {
  if (!isRacialCity(region) && region !== 'goddard') return { walls: [], gates: [] };
  const airborne = region === 'goddard';
  const { halfWidth: x, north, south } = airborne ? { halfWidth: 17, north: -20, south: 8 } : GROUND_CITIES[region];
  const sideZ = region === 'aurora' ? 12 : 3;
  const gates: CityGate[] = [
    { point: [0, north], outward: [0,-1], name: 'Portão Norte' },
    { point: [0, south], outward: [0,1], name: 'Portão Sul' },
    { point: [-x, sideZ], outward: [-1,0], name: 'Portão Oeste' },
    { point: [x, sideZ], outward: [1,0], name: 'Portão Leste' },
  ];
  const gap = GATE_HALF_WIDTH;
  const huntersGate = -3.5;
  const orchardGate=12.3;
  if(region==='aurora')gates.push(
    {point:[-x,huntersGate],outward:[-1,0],name:'Portão das Colinas'},
    {point:[orchardGate,south],outward:[0,1],name:'Portão do Pomar'},
  );
  const west = region==='aurora'
    ? [{a:[-x,north],b:[-x,huntersGate-gap]}, {a:[-x,huntersGate+gap],b:[-x,sideZ-gap]}] satisfies Wall[]
    : [{a:[-x,north],b:[-x,sideZ-gap]}] satisfies Wall[];
  const southEast=region==='aurora'
    ? [{a:[gap,south],b:[orchardGate-gap,south]},{a:[orchardGate+gap,south],b:[x,south]}] satisfies Wall[]
    : [{a:[gap,south],b:[x,south]}] satisfies Wall[];
  if (airborne) return { walls: [
    {a:[-x,north],b:[x,north]}, {a:[-x,north],b:[-x,south]}, {a:[x,north],b:[x,south]},
    {a:[-x,south],b:[-gap,south]}, {a:[gap,south],b:[x,south]},
  ], gates:[gates[1]] };
  return { walls: [
    {a:[-x,north],b:[-gap,north]}, {a:[gap,north],b:[x,north]},
    {a:[-x,south],b:[-gap,south]}, ...southEast,
    ...west, {a:[-x,sideZ+gap],b:[-x,south]},
    {a:[x,north],b:[x,sideZ-gap]}, {a:[x,sideZ+gap],b:[x,south]},
  ], gates };
}

const DEFENCES = Object.fromEntries([...Object.keys(GROUND_CITIES),'goddard'].map(id=>[id,cityDefences(id)]));
export function cityWallBlocks(region: string, x: number, z: number) {
  return DEFENCES[region]?.walls.some(({a,b})=>x>=Math.min(a[0],b[0])-.62&&x<=Math.max(a[0],b[0])+.62
    &&z>=Math.min(a[1],b[1])-.62&&z<=Math.max(a[1],b[1])+.62) ?? false;
}

export function insideCity(region:string,x:number,z:number){
  if(region==='goddard')return true;
  if(!isRacialCity(region))return false;
  const {halfWidth,north,south}=GROUND_CITIES[region];
  return Math.abs(x)<=halfWidth && z>=north && z<=south;
}

export type Road = { to: RacialCity; end: Point; points: Point[] };

function road(region:RacialCity,to:RacialCity,gateName:string,waypoints:Point[]):Road {
  const gate=DEFENCES[region].gates.find(entry=>entry.name===gateName)!;
  return { to, end:waypoints[waypoints.length-1], points:[gate.point,...waypoints] };
}

const ROADS: Record<RacialCity, Road[]> = {
  aurora: [
    road('aurora','iron-forge','Portão Oeste',[[-34,12],[-49,7],[-74,6]]),
    road('aurora','gnomolandia','Portão Leste',[[34,12],[52,14],[74,14]]),
    road('aurora','bosque','Portão Sul',[[0,29],[-11,39],[-24,55],[-29,63]]),
    road('aurora','ogrimmar','Portão do Pomar',[[14,31],[26,45],[38,63]]),
  ],
  'iron-forge': [road('iron-forge','aurora','Portão Leste',[[37,4],[52,6],[74,9]])],
  gnomolandia: [road('gnomolandia','aurora','Portão Oeste',[[-38,4],[-54,6],[-74,9]])],
  bosque: [road('bosque','aurora','Portão Norte',[[0,-35],[-6,-52],[-8,-77]])],
  ogrimmar: [road('ogrimmar','aurora','Portão Norte',[[0,-35],[7,-52],[10,-77]])],
};

export const overlandRoads = (region: string): Road[] => isRacialCity(region) ? ROADS[region] : [];
export const roadTo = (region: string, to: string) => overlandRoads(region).find(entry=>entry.to===to);
export function roadItinerary(from:string,to:string):RacialCity[] {
  if(!isRacialCity(from)||!isRacialCity(to)||from===to)return [];
  const visited=new Set<RacialCity>([from]);
  const queue:RacialCity[][]=[[from]];
  while(queue.length){
    const route=queue.shift()!;
    for(const road of overlandRoads(route[route.length-1])){
      if(visited.has(road.to))continue;
      const next=[...route,road.to];
      if(road.to===to)return next;
      visited.add(road.to);
      queue.push(next);
    }
  }
  return [];
}
export const roadAt = (region: string, x: number, z: number) =>
  overlandRoads(region).find(entry=>Math.hypot(entry.end[0]-x,entry.end[1]-z)<=ROAD_EXIT_RADIUS);

export function roadArrival(from: RacialCity, to: RacialCity): Point | undefined {
  const back = roadTo(to,from);
  if (!back) return;
  const [x,z] = back.end, [previousX,previousZ] = back.points[back.points.length-2];
  const length = Math.hypot(previousX-x,previousZ-z);
  return [x+(previousX-x)*8/length,z+(previousZ-z)*8/length];
}

export function oppositeGateSide(gate: CityGate, current: Point): Point {
  const [x,z] = gate.point, [dx,dz] = gate.outward;
  const inside = (current[0]-x)*dx+(current[1]-z)*dz<=0;
  const distance = inside ? 2 : -2;
  return [x+dx*distance,z+dz*distance];
}
