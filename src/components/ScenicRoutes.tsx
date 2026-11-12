"use client";

import { useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { BoxGeometry } from 'three';
import type { RegionId } from '@/lib/campaign';
import { scenicTrail } from '@/lib/scenicTrails';
import { BRIDGE_WIDTH, waterwayOf, waterwaySegments } from '@/lib/waterways';
import { useGame } from '@/lib/store';
import { MergedParts, type Part } from './MergedParts';

export default function ScenicRoutes({region,ground}:{region:RegionId;ground:(e:ThreeEvent<MouseEvent>)=>void}){
  const river=waterwayOf(region),trail=scenicTrail(region);
  const end=trail?.points.at(-1);
  const near=useGame(s=>!!end&&Math.hypot(s.hero.position[0]-end[0],s.hero.position[1]-end[1])<11);
  const segments=river?waterwaySegments(river):[];
  const bridges=useCallback(():Part[]=>{
    const river=waterwayOf(region);
    if(!river)return [];
    return waterwaySegments(river).flatMap(segment=>{
      if(!segment.bridge)return [];
      const {cx,cz,ux,uz}=segment;
      const rotation=Math.atan2(-uz,ux),length=river.width+2.2;
      const planks=Array.from({length:Math.ceil(length/.38)},(_,i):Part=>{
        const distance=(i-(Math.ceil(length/.38)-1)/2)*.38;
        return {g:new BoxGeometry(BRIDGE_WIDTH,.15,.365),p:[cx-uz*distance,.105,cz+ux*distance],
          r:[0,rotation,0],c:i%2?'#8c6650':'#a38262'};
      });
      const rails=[-1,1].flatMap((side):Part[]=>{
        const x=cx+ux*side*BRIDGE_WIDTH/2,z=cz+uz*side*BRIDGE_WIDTH/2;
        return [{g:new BoxGeometry(.16,.15,length),p:[x,.76,z],r:[0,rotation,0],c:'#685243'},
          ...[-1,0,1].map((n):Part=>({g:new BoxGeometry(.2,.74,.2),p:[x-uz*n*length*.44,.48,z+ux*n*length*.44],c:'#725744'}))
        ];
      });
      return [...planks,...rails];
    });
  },[region]);
  return <group>
    {trail?.points.slice(1).map(([x,z],i)=>{
      const [a,b]=trail.points[i],dx=x-a,dz=z-b;
      return <mesh key={i} position={[(x+a)/2,.028,(z+b)/2]} rotation={[-Math.PI/2,0,Math.atan2(-dz,dx)]} onClick={ground} receiveShadow>
        <planeGeometry args={[Math.hypot(dx,dz)+.4,1.28]}/><meshStandardMaterial color="#b8a37c" roughness={.99}/>
      </mesh>;
    })}
    {river&&<>
      {segments.map(({cx,cz,ux,uz,length},i)=><mesh key={i} position={[cx,.057,cz]} rotation={[-Math.PI/2,0,Math.atan2(-uz,ux)]}>
        <planeGeometry args={[length+.32,river.width]}/><meshStandardMaterial color={river.type==='lava'?'#cb5930':river.type==='ice'?'#78b4c1':'#4d8799'}
          emissive={river.type==='lava'?'#af3517':'#26545f'} emissiveIntensity={river.type==='lava'?.65:.18} roughness={.45}/>
      </mesh>)}
      {river.points.map(([x,z],i)=><mesh key={i} position={[x,.056,z]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[river.width/2,16]}/><meshStandardMaterial color={river.type==='lava'?'#cb5930':river.type==='ice'?'#78b4c1':'#4d8799'}/>
      </mesh>)}
      <MergedParts parts={bridges} receiveShadow/>
    </>}
    {trail&&end&&<group position={[end[0]+.8,0,end[1]+.8]}>
      <mesh position={[0,.65,0]}><boxGeometry args={[.16,1.3,.16]}/><meshStandardMaterial color="#725745"/></mesh>
      <mesh position={[0,1.32,0]}><boxGeometry args={[1.25,.36,.18]}/><meshStandardMaterial color="#96745b"/></mesh>
      {near&&<Html position={[0,1.95,0]} center style={{pointerEvents:'none'}}><span className="town-sign">{trail.name}</span></Html>}
    </group>}
  </group>;
}
