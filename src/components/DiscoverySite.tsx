"use client";

import { Html } from '@react-three/drei';
import { cursorOn } from '@/lib/cursor';
import { DISCOVERY_REVEAL_RANGE, discoveryDistance, discoveryIn } from '@/lib/discoveries';
import { useGame } from '@/lib/store';
import { findPath } from '@/lib/navigation';
import type { RegionId } from '@/lib/campaign';

const camp=discoveryIn('bosque')!;
const branch=camp.branch?[camp.branch,...findPath(camp.branch,camp.point,camp.region)]:[];

export default function DiscoverySite({region,paused,approach}:{region:RegionId;paused:boolean;approach:(x:number,z:number,open:()=>void)=>void}){
  const site=discoveryIn(region);
  const status=useGame(s=>site&&s.hero.adventure?.discoveries?.[site.id]);
  const near=useGame(s=>!!site&&discoveryDistance(site,s.hero.position)<=DISCOVERY_REVEAL_RANGE);
  if(!site)return null;
  const [x,z]=site.point,claimed=status==='claimed';
  return <>
    {region==='bosque'&&branch.slice(1).map(([endX,endZ],i)=>{
      const [startX,startZ]=branch[i],dx=endX-startX,dz=endZ-startZ;
      return <mesh key={i} position={[(startX+endX)/2,.03,(startZ+endZ)/2]} rotation={[-Math.PI/2,0,Math.atan2(-dz,dx)]} receiveShadow>
        <planeGeometry args={[Math.hypot(dx,dz)+.22,.78]}/><meshStandardMaterial color="#9e8969" roughness={1}/>
      </mesh>;
    })}
    <group position={[x,0,z]}>
      {region==='bosque'&&<>
        <mesh position={[2,1.1,.7]} rotation={[0,Math.PI/3,0]}><cylinderGeometry args={[0,1.4,2.2,4]}/><meshStandardMaterial color="#847660"/></mesh>
        <mesh position={[-1.5,.14,.9]}><cylinderGeometry args={[.64,.78,.27,9]}/><meshStandardMaterial color="#5f6056"/></mesh>
        <mesh position={[-1.5,.28,.9]}><coneGeometry args={[.24,.35,5]}/><meshStandardMaterial color="#d38036" emissive="#b44615" emissiveIntensity={.7}/></mesh>
      </>}
      <group {...cursorOn('point')} onClick={event=>{
        if(paused||claimed||event.button!==0||event.delta>6)return;
        event.stopPropagation();
        approach(x,z,()=>useGame.getState().openDiscovery());
      }}>
        <mesh position={[0,.24,0]}><boxGeometry args={[1,.48,.65]}/><meshStandardMaterial color="#72472e"/></mesh>
        <mesh position={[0,.51,claimed?-.27:0]} rotation={[claimed?-1.05:0,0,0]}><boxGeometry args={[1.04,.16,.66]}/><meshStandardMaterial color="#ad7850"/></mesh>
        <mesh position={[0,.4,.34]}><boxGeometry args={[.23,.23,.08]}/><meshStandardMaterial color="#edc784" metalness={.35}/></mesh>
      </group>
      {near&&<Html position={[0,1.4,0]} center style={{pointerEvents:'none'}}><span className="gate-label">
        {site.name}{claimed?' · explorado':site.guard&&status!=='cleared'?' · vigia por perto':''}
      </span></Html>}
    </group>
  </>;
}
