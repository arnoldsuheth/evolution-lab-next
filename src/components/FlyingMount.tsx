"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { FLYING_MOUNTS, type FlyingMountId } from "@/lib/flyingMounts";

export default function FlyingMount({id,reduced}:{id:FlyingMountId;reduced:boolean}) {
  const wings=useRef<Group>(null);
  const style=FLYING_MOUNTS.find(m=>m.id===id)??FLYING_MOUNTS[0];
  const mechanical=id==="dragonfly", owl=id==="owl";
  useFrame(({clock})=>{
    if(!wings.current||reduced)return;
    wings.current.children.forEach((wing,i)=>{wing.rotation.z=(i===0?-1:1)*(.16+Math.sin(clock.elapsedTime*(mechanical?11:4))*.28);});
  });
  return <group>
    <mesh position={[0,.85,0]} scale={[.58,.58,1.05]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={style.body} flatShading/></mesh>
    <mesh position={[0,1.32,.64]} scale={[owl?.62:.47,.51,.5]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={style.wing} flatShading/></mesh>
    <mesh position={[0,1.23,1.1]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.2,.38,4]}/><meshStandardMaterial color={style.beak}/></mesh>
    <group ref={wings} position={[0,1,0]}>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*1.05,0,-.12]} rotation={[0,side*.2,0]} scale={[1.25,.12,mechanical?.34:.59]}>
          <icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={style.wing} flatShading/>
        </mesh>
        {mechanical&&<mesh position={[side*.9,-.06,-.62]} rotation={[0,-side*.35,0]} scale={[1.05,.07,.24]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color={style.wing}/></mesh>}
      </group>)}
    </group>
    <mesh position={[0,.8,-1.12]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[id==="manticore"?.14:.24,.85,5]}/><meshStandardMaterial color={style.body}/></mesh>
  </group>;
}
