import type { RegionId } from './campaign';
import { findPath } from './navigation';

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

const paths=new Map<string,{name:string;points:Point[]}>();
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
  const result={name:trail.name,points};
  paths.set(region,result);
  return result;
}
