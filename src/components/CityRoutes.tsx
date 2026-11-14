"use client";

import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import { BoxGeometry, ConeGeometry, DodecahedronGeometry, MathUtils, type Group } from 'three';
import { cursorOn } from '@/lib/cursor';
import { REGIONS, type RegionId } from '@/lib/campaign';
import { cityDefences, GATE_HALF_WIDTH, overlandRoads, type CityGate } from '@/lib/overland';
import { cityPortal, goddardExit, GODDARD_PORTAL_PLAZA_WIDTH, isRacialCity, RACIAL_CITIES, type RacialCity } from '@/lib/kingdomCities';
import { useGame } from '@/lib/store';
import RealmEntrance from './RealmEntrance';
import PavingMaterial from './PavingMaterial';
import { MergedParts, type Part } from './MergedParts';

const grille = ():Part[] => Array.from({length:9},(_,i)=>({g:new BoxGeometry(.11,3.35,.12),p:[(i-4)*.46,1.68,0],c:"#343b43"}));

type GroundClick = (event:ThreeEvent<MouseEvent>)=>void;
function Gate({ gate, destination, paused, cross }: { gate: CityGate; destination?:string; paused: boolean; cross: () => void }) {
  const portcullis=useRef<Group>(null);
  const [x,z]=gate.point;
  const close=useGame(s=>Math.hypot(s.hero.position[0]-x,s.hero.position[1]-z)<14);
  const reduced=useGame(s=>s.settings.reduceMotion);
  useFrame((_,delta)=>{
    if(!portcullis.current)return;
    const [px,pz]=useGame.getState().hero.position;
    const target=Math.hypot(px-x,pz-z)<7?.055:1;
    const height=reduced?target:MathUtils.damp(portcullis.current.scale.y,target,9,delta);
    portcullis.current.scale.y=height;
    portcullis.current.position.y=3.35*(1-height);
  });
  return <group position={[x,0,z]} rotation={[0,gate.outward[0]?Math.PI/2:0,0]} {...cursorOn('point')} onClick={e=>{
    if(paused||e.button!==0||e.delta>6)return;
    e.stopPropagation();cross();
  }}>
    {[-1,1].map(side=><group key={side} position={[side*(GATE_HALF_WIDTH+.35),0,0]}>
      <mesh position={[0,2.05,0]} castShadow><boxGeometry args={[1.06,4.1,1.45]}/><meshStandardMaterial color="#596475" roughness={.9}/></mesh>
      <mesh position={[0,4.11,0]}><boxGeometry args={[1.26,.33,1.65]}/><meshStandardMaterial color="#8b929d"/></mesh>
      <mesh position={[-side*.35,2.45,.72]}><octahedronGeometry args={[.17]}/><meshStandardMaterial color="#e4a965" emissive="#e4a965" emissiveIntensity={.55}/></mesh>
    </group>)}
    <mesh position={[0,3.75,0]} castShadow><boxGeometry args={[4.25,.55,1.25]}/><meshStandardMaterial color="#8d8474" roughness={.88}/></mesh>
    <group ref={portcullis}><MergedParts parts={grille}/></group>
    {close&&<Html center position={[0,4.5,0]} style={{pointerEvents:'none'}}><span className="gate-label">{destination?gate.name+" · "+destination:gate.name}</span></Html>}
  </group>;
}

export default function CityRoutes({ region, paused, ground, cross, followRoad, approach }: {
  region: RegionId; paused:boolean; ground:GroundClick; cross:(gate:CityGate)=>void;
  followRoad:(point:[number,number])=>void; approach:(x:number,z:number,enter:()=>void)=>void;
}) {
  const { walls,gates }=useMemo(()=>cityDefences(region),[region]);
  const roads=overlandRoads(region);
  const position=useGame(s=>s.hero.position);
  const wallParts=useCallback(()=>walls.flatMap(({a,b})=>{
      const horizontal=a[1]===b[1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
      const segments=Math.max(1,Math.floor(length/2.1));
      return [
        {g:new BoxGeometry(horizontal?length:.98,2.75,horizontal?.98:length),p:[x,1.37,z],c:'#8d8474'},
        {g:new BoxGeometry(horizontal?length:1.13,.24,horizontal?1.13:length),p:[x,2.76,z],c:'#a89d88'},
        ...Array.from({length:segments},(_,i):Part=>{
          const shift=(i+.5)*length/segments-length/2;
          return {g:new BoxGeometry(.69,.47,.69),p:[x+(horizontal?shift:0),3.06,z+(horizontal?0:shift)],c:'#968b77'};
        }),
      ] satisfies Part[];
    }),[walls]);
  const roadsideParts=useCallback(()=>overlandRoads(region).flatMap(({points})=>points.slice(1).flatMap(([x,z],i)=>{
    const [a,b]=points[i],dx=x-a,dz=z-b,length=Math.hypot(dx,dz);
    if(length<10)return [];
    const cold=region==='iron-forge'||region==='gnomolandia',dry=region==='ogrimmar';
    return [-1,1].flatMap(side=>[.34,.7].flatMap((t,index):Part[]=>{
      const width=side*(4.8+index*2.4);
      const px=a+dx*t-dz*width/length,pz=b+dz*t+dx*width/length;
      if(dry)return [{g:new DodecahedronGeometry(.7+index*.32,0),p:[px,.49,pz],c:'#97775e'}];
      const height=2.2+index*.65;
      return [
        {g:new BoxGeometry(.27,.8,.27),p:[px,.4,pz],c:'#746050'},
        {g:new ConeGeometry(.92,height,7),p:[px,.62+height*.49,pz],c:cold?'#718d91':'#54764e'},
        {g:new ConeGeometry(.63,height*.68,7),p:[px,.92+height*.71,pz],c:cold?'#c4d4ce':'#76945f'},
      ];
    }));
  })),[region]);
  if(!walls.length)return null;
  const center=region==='goddard'?[0,-7] as const:cityPortal(region);
  const portals=region==='goddard'
    ? (Object.keys(RACIAL_CITIES) as RacialCity[]).map(to=>({to,point:goddardExit(to)}))
    : isRacialCity(region)?[{to:'goddard' as const,point:center}]:[];
  return <group>
    {roads.map(({to,points,end})=><group key={to}>
      {points.slice(1).map(([x,z],i)=>{
        const [a,b]=points[i],dx=x-a,dz=z-b;
        return <mesh key={i} position={[(x+a)/2,.046,(z+b)/2]} rotation={[-Math.PI/2,0,Math.atan2(-dz,dx)]} receiveShadow onClick={ground}>
          <planeGeometry args={[Math.hypot(dx,dz)+.8,2.9]}/><meshStandardMaterial color="#a49069" roughness={.94}/>
        </mesh>;
      })}
      <group position={[end[0],0,end[1]]} {...cursorOn('point')} onClick={e=>{if(paused||e.button!==0||e.delta>6)return;e.stopPropagation();followRoad(end);}}>
        <mesh position={[0,.84,0]}><boxGeometry args={[.18,1.68,.18]}/><meshStandardMaterial color="#513b30"/></mesh>
        <mesh position={[0,1.49,0]}><boxGeometry args={[2.28,.61,.22]}/><meshStandardMaterial color="#714d36"/></mesh>
        {Math.hypot(position[0]-end[0],position[1]-end[1])<22&&<Html center position={[0,1.96,0]} style={{pointerEvents:'none'}}><span className="gate-label">Estrada · {REGIONS[to].name}</span></Html>}
      </group>
    </group>)}
    <MergedParts castShadow receiveShadow parts={wallParts}/>
    {roads.length>0&&<MergedParts receiveShadow parts={roadsideParts}/>}
    {gates.map(gate=>{
      const exit=roads.find(road=>road.points[0][0]===gate.point[0]&&road.points[0][1]===gate.point[1]);
      return <Gate key={gate.name} gate={gate} destination={exit&&REGIONS[exit.to].name} paused={paused} cross={()=>cross(gate)}/>;
    })}
    <mesh position={[center[0],.056,center[1]]} rotation={[-Math.PI/2,0,0]} receiveShadow onClick={ground}>
      <planeGeometry args={[region==='goddard'?GODDARD_PORTAL_PLAZA_WIDTH:6,5.2]}/><PavingMaterial color="#a7b6b0" relief={false}/>
    </mesh>
    {portals.map(({to,point})=><group key={to}>
      <RealmEntrance point={point} label={REGIONS[to].name} kind="portal" paused={paused}
        onEnter={()=>approach(point[0],point[1],()=>useGame.getState().skyTravel(to))}/>
    </group>)}
  </group>;
}
