import type { Monster } from './campaign';
import { walkable } from './navigation';

type Point = [number,number];
const patrols=new Map<string,{offset:Point;phase:number}>();
const AXES:Point[]=[[1.65,0],[0,1.65],[1.15,1.15],[1.15,-1.15]];

export function monsterPoint(monster:Monster,time:number,hero?:Point):Point {
  if(!monster.id.startsWith('wild-'))return [monster.x,monster.z];
  const pack=monster.kind==='wolf'&&monster.hostile;
  const group=pack?monster.id.replace(/-\d+$/,''):monster.id;
  let patrol=patrols.get(monster.id);
  if(!patrol){
    const seed=group.split('').reduce((n,ch)=>Math.imul(31,n)+ch.charCodeAt(0)|0,0)>>>0;
    const offset=[1,.65,.35].flatMap(scale=>AXES.map((_,i):Point=>{
      const [dx,dz]=AXES[(i+seed)%AXES.length];
      return [dx*scale,dz*scale];
    })).find(([dx,dz])=>
      [-1,-.75,-.5,-.25,0,.25,.5,.75,1].every(t=>walkable(monster.x+dx*t,monster.z+dz*t,monster.region)))??[0,0];
    patrol={offset,phase:(seed%217)*.13};
    patrols.set(monster.id,patrol);
  }
  const pace=pack?1400:monster.kind==='golem'?2900:monster.kind==='frostcat'?1200:1900;
  const factor=Math.sin(time/pace+patrol.phase);
  const x=monster.x+patrol.offset[0]*factor,z=monster.z+patrol.offset[1]*factor;
  if(hero&&monster.kind==='stag'){
    const dx=x-hero[0],dz=z-hero[1],distance=Math.hypot(dx,dz);
    if(distance>.01&&distance<6){
      const step=(6-distance)*.45;
      // Tenta fugir menos quando rio ou parede bloqueiam: evita o cervo "pular" de volta.
      for(const scale of [1,.75,.5,.25]){
        const moveX=dx/distance*step*scale,moveZ=dz/distance*step*scale;
        if([.25,.5,.75,1].every(t=>walkable(x+moveX*t,z+moveZ*t,monster.region)))return [x+moveX,z+moveZ];
      }
    }
  }
  return [x,z];
}
