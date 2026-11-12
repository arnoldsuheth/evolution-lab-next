import type { Monster } from './campaign';
import { walkable } from './navigation';

type Point = [number,number];
const patrols=new Map<string,{offset:Point;phase:number}>();
const AXES:Point[]=[[1.65,0],[0,1.65],[1.15,1.15],[1.15,-1.15]];

export function monsterPoint(monster:Monster,time:number):Point {
  if(!monster.id.startsWith('wild-'))return [monster.x,monster.z];
  let patrol=patrols.get(monster.id);
  if(!patrol){
    const seed=monster.id.split('').reduce((n,ch)=>Math.imul(31,n)+ch.charCodeAt(0)|0,0)>>>0;
    const offset=[1,.65,.35].flatMap(scale=>AXES.map((_,i):Point=>{
      const [dx,dz]=AXES[(i+seed)%AXES.length];
      return [dx*scale,dz*scale];
    })).find(([dx,dz])=>
      [-1,-.75,-.5,-.25,0,.25,.5,.75,1].every(t=>walkable(monster.x+dx*t,monster.z+dz*t,monster.region)))??[0,0];
    patrol={offset,phase:(seed%217)*.13};
    patrols.set(monster.id,patrol);
  }
  const factor=Math.sin(time/1900+patrol.phase);
  return [monster.x+patrol.offset[0]*factor,monster.z+patrol.offset[1]*factor];
}
