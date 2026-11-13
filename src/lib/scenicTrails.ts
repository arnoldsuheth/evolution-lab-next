import type { RegionId } from './campaign';
import { findPath } from './navigation';
import { insideCity } from './overland';

type Point = [number,number];
type Trail = { name:string; from:Point; to:Point };
const TRAILS:Partial<Record<RegionId,Trail>>={
  aurora:{name:'Trilha das Nascentes',from:[0,26],to:[-39,43]},
  bosque:{name:'Mirante do Mar das Folhas',from:[27,3],to:[47,28]},
  'iron-forge':{name:'Mirante do Degelo',from:[-25,3],to:[-44,39]},
  gnomolandia:{name:'Trilha da Costa da Névoa',from:[25,3],to:[43,18]},
  ogrimmar:{name:'Mirante do Vulcão Rubro',from:[25,3],to:[57,-14]},
  ruins:{name:'Trilha do Rio do Claustro',from:[1,12],to:[-20,39]},
  frontier:{name:'Trilha do Arenito',from:[11,13],to:[44,36]},
  heart:{name:'Trilha da Obsidiana',from:[1,13],to:[-39,35]},
};

const paths=new Map<string,{name:string;points:Point[];route:Point[];end:Point}>();
export function scenicTrail(region:string){
  const trail=TRAILS[region as RegionId];
  if(!trail)return;
  const saved=paths.get(region);
  if(saved)return saved;
  const route=[trail.from,...findPath(trail.from,trail.to,region)];
  if(route.length<2)return;
  const points=route.filter(([x,z],i)=>{
    if(i===0||i===route.length-1)return true;
    return x-route[i-1][0]!==route[i+1][0]-x||z-route[i-1][1]!==route[i+1][1]-z;
  });
  const result={name:trail.name,points,route,end:trail.to};
  paths.set(region,result);
  return result;
}

export function scenicTrailPath(position:Point,region:string,airborne=false):Point[] {
  const trail=scenicTrail(region);
  if(!trail)return [];
  if(airborne)return findPath(position,trail.end,region,true);

  let entry=0;
  if(!insideCity(region,...position)){
    let closest=Infinity;
    for(const [i,[x,z]] of trail.route.entries()){
      const distance=Math.hypot(position[0]-x,position[1]-z);
      if(distance<=closest){entry=i;closest=distance;}
    }
  }
  // The nearest section can lie on the opposite bank. Reach it through normal navigation.
  const [x,z]=trail.route[entry];
  const approach=findPath(position,[x,z],region);
  if(!approach.length&&(Math.round(position[0])!==x||Math.round(position[1])!==z))return [];
  return [...approach,...trail.route.slice(entry+1)];
}
