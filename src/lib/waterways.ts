import type { RegionId } from './campaign';

type Point = [number,number];
export type Waterway = { name:string; type:'water'|'ice'|'lava'; width:number; points:Point[]; crossings:number[] };
const WATERWAYS: Partial<Record<RegionId,Waterway>> = {
  aurora:{name:'Rio das Nascentes',type:'water',width:3.6,points:[[-75,32],[-58,34],[-43,30],[-33,37]],crossings:[0,2]},
  bosque:{name:'Rio das Folhas',type:'water',width:3.8,points:[[33,8],[31,20],[34,33],[45,43],[56,38]],crossings:[0,2]},
  'iron-forge':{name:'Rio do Degelo',type:'ice',width:3.6,points:[[-65,28],[-49,22],[-38,30],[-27,36]],crossings:[1]},
  gnomolandia:{name:'Canal da Névoa',type:'ice',width:3.5,points:[[28,22],[41,26],[50,33],[58,36]],crossings:[0]},
  ogrimmar:{name:'Corrente do Vulcão Rubro',type:'lava',width:4,points:[[61,-28],[63,-14],[70,-4],[77,7]],crossings:[1]},
  ruins:{name:'Rio do Claustro',type:'water',width:3.7,points:[[-30,28],[-14,32],[-2,29],[12,39]],crossings:[1]},
  frontier:{name:'Rio de Arenito',type:'water',width:3.5,points:[[21,16],[33,21],[43,24],[57,28]],crossings:[1]},
  heart:{name:'Corrente de Nullarion',type:'lava',width:4,points:[[51,-40],[55,-24],[63,-14],[75,-9]],crossings:[1]},
};

export const waterwayOf=(region:string)=>WATERWAYS[region as RegionId];
export const BRIDGE_WIDTH=4.5;
export function waterwaySegments(waterway:Waterway){
  return waterway.points.slice(1).map(([x,z],i)=>{
    const [ax,az]=waterway.points[i],dx=x-ax,dz=z-az,length=Math.hypot(dx,dz);
    return {ax,az,x,z,length,ux:dx/length,uz:dz/length,cx:(x+ax)/2,cz:(z+az)/2,bridge:waterway.crossings.includes(i)};
  });
}
const SEGMENTS = Object.fromEntries(Object.entries(WATERWAYS).map(([region,river])=>[region,waterwaySegments(river)]));

export function waterwayBlocks(region:string,x:number,z:number){
  const waterway=waterwayOf(region);
  if(!waterway)return false;
  return SEGMENTS[region].some(segment=>{
    const vx=x-segment.ax,vz=z-segment.az,along=vx*segment.ux+vz*segment.uz;
    const t=Math.max(0,Math.min(segment.length,along));
    if(Math.hypot(vx-t*segment.ux,vz-t*segment.uz)>waterway.width/2)return false;
    return !(segment.bridge&&Math.abs(along-segment.length/2)<=BRIDGE_WIDTH/2);
  });
}
