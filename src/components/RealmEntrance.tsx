"use client";

import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils, DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { useGame } from '@/lib/store';
import { cursorOn } from '@/lib/cursor';

export type EntranceKind = 'portal' | 'rift' | 'cave' | 'monastery';

export default function RealmEntrance({ point, label, kind, color, onEnter, paused }: {
  point: readonly [number,number]; label: string; kind: EntranceKind; color?: string; onEnter: () => void; paused: boolean;
}) {
  const [x,z] = point;
  const nearby=useGame(s=>Math.hypot(s.hero.position[0]-x,s.hero.position[1]-z)<12);
  const reduced=useGame(s=>s.settings.reduceMotion);
  const doors=useRef<Group>(null), aura=useRef<Mesh>(null);
  const fracture=useRef<Group>(null);
  const light=color??(kind==='rift'?'#fe865f':'#6ee6dc');
  useFrame(({clock},delta)=>{
    const [px,pz]=useGame.getState().hero.position;
    const open=Math.hypot(px-x,pz-z)<4;
    doors.current?.children.forEach((leaf,i)=>{
      const desired=(i===0?-1:1)*(open?1.58:.65);
      leaf.position.x=reduced?desired:MathUtils.damp(leaf.position.x,desired,7,delta);
    });
    fracture.current?.children.forEach((wall,i)=>{
      const target=(i===0?-1:1)*(open?.38:0);
      wall.position.x=reduced?target:MathUtils.damp(wall.position.x,target,7,delta);
    });
    if(aura.current){
      const phase=reduced?0:Math.sin(clock.elapsedTime*2+x)*.08;
      (aura.current.material as MeshBasicMaterial).opacity=(open?.74:.4)+phase;
      aura.current.scale.setScalar(1+phase*.25);
    }
  });
  function enter(event:ThreeEvent<MouseEvent>){
    if(paused||event.button!==0||event.delta>6)return;
    event.stopPropagation();
    onEnter();
  }
  return <group position={[x,0,z]} {...cursorOn('point')} onClick={enter}>
    <mesh position={[0,.12,0]} receiveShadow><boxGeometry args={[kind==='monastery'?5.8:3.8,.24,2.8]}/><meshStandardMaterial color={kind==='rift'?'#432b32':'#657477'} roughness={.86}/></mesh>
    {kind==='cave'?<>
      <mesh position={[0,1.42,-1.12]} scale={[1,.77,.7]}><icosahedronGeometry args={[3.05,1]}/><meshStandardMaterial color="#4c545e" roughness={.98} flatShading/></mesh>
      <mesh position={[0,1.13,.88]} scale={[1.13,.92,.15]}><sphereGeometry args={[1.18,16,9]}/><meshBasicMaterial color="#101721"/></mesh>
      {[-1,1].flatMap(side=>[0,1,2].map(i=><mesh key={side+':'+i} position={[side*(1.47+i*.38),.52+i*.26,.68-i*.47]} rotation={[.18,i*.6,side*.22]}><dodecahedronGeometry args={[.7+i*.18,0]}/><meshStandardMaterial color={i%2?'#72838b':'#5a6672'} roughness={.95}/></mesh>))}
    </>:kind==='rift'?<>
      <mesh position={[0,1.75,0]} scale={[.76,1.45,.11]}><icosahedronGeometry args={[1.27,0]}/><meshBasicMaterial color="#201521"/></mesh>
      <group ref={fracture}>{[-1,1].map(side=><group key={side}>
        {[0,1,2,3].map(i=><mesh key={i} position={[side*(.92+i%2*.23),.54+i*.73,.15]} rotation={[i*.28,0,side*(.27+i%2*.45)]}><dodecahedronGeometry args={[.58,0]}/><meshStandardMaterial color="#462c41" emissive={light} emissiveIntensity={i%2?.28:.12} roughness={.9}/></mesh>)}
      </group>)}</group>
      <mesh ref={aura} position={[0,1.77,.19]} scale={[.45,1.3,.08]}><octahedronGeometry args={[1.22,0]}/><meshBasicMaterial color={light} transparent opacity={.48} depthWrite={false}/></mesh>
      <mesh position={[0,1.77,.28]} scale={[.22,1.26,.045]}><octahedronGeometry args={[1.18,0]}/><meshBasicMaterial color="#fff1b9" transparent opacity={.65} depthWrite={false}/></mesh>
    </>:<>
      <mesh position={[0,1.75,-.25]}><boxGeometry args={[kind==='monastery'?5.3:3.55,3.35,.35]}/><meshStandardMaterial color={kind==='monastery'?'#8e8379':'#364753'} roughness={.86}/></mesh>
      {[-1,1].map(side=><group key={side} position={[side*1.64,0,.15]}>
        <mesh position={[0,1.73,0]}><boxGeometry args={[.46,3.35,.6]}/><meshStandardMaterial color="#74818a" roughness={.82}/></mesh>
        <mesh position={[0,2.06,.34]}><octahedronGeometry args={[.19,0]}/><meshStandardMaterial color={light} emissive={light} emissiveIntensity={.58}/></mesh>
      </group>)}
      {kind==='monastery'?<>
        <mesh position={[0,3.61,-.18]} rotation={[Math.PI/2,0,0]} scale={[1,1,.37]}><cylinderGeometry args={[2.93,2.93,.53,3,1,false,0]} /><meshStandardMaterial color="#514b52" roughness={.9}/></mesh>
        <mesh position={[0,3.56,.21]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.42,.42,.1,12]} /><meshStandardMaterial color="#c99d64" metalness={.42} roughness={.59}/></mesh>
        {[-1,1].map(side=><mesh key={side} position={[side*2.12,2.05,-.04]}><boxGeometry args={[.26,.84,.13]}/><meshStandardMaterial color="#e5b06f" emissive="#ad693b" emissiveIntensity={.37}/></mesh>)}
      </>:<mesh position={[0,3.39,.14]}><boxGeometry args={[3.9,.54,.65]}/><meshStandardMaterial color="#526272" metalness={.31} roughness={.63}/></mesh>}
      <mesh ref={aura} position={[0,1.65,.12]}><planeGeometry args={[2.57,2.82]}/><meshBasicMaterial color={kind==='portal'?light:'#161b23'} transparent opacity={.58} side={DoubleSide}/></mesh>
      <group ref={doors}>
        {[-1,1].map(side=><group key={side} position={[side*.65,1.65,.26]}>
          <mesh><boxGeometry args={[1.25,2.82,.18]}/><meshStandardMaterial color={kind==='portal'?'#243f51':'#493c37'} metalness={.36} roughness={.68}/></mesh>
          <mesh position={[0,0,.1]}><boxGeometry args={[.075,2.46,.05]}/><meshStandardMaterial color={kind==='portal'?light:'#b69772'} emissive={kind==='portal'?light:'#291810'} emissiveIntensity={.37}/></mesh>
        </group>)}
      </group>
    </>}
    {nearby&&<Html center position={[0,kind==='monastery'?4.65:4,0]} zIndexRange={[5,0]} style={{pointerEvents:'none'}}><span className="gate-label">{label}</span></Html>}
  </group>;
}
