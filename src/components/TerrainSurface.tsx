"use client";
import {useEffect,useMemo} from 'react';
import type {ThreeEvent} from '@react-three/fiber';
import { biomeOf, isWater, landmarkDistance } from '@/lib/biomes';
import { WORLD_BOUNDS } from '@/lib/worldBounds';
import * as THREE from 'three';
/** Flat walkable ground with local colour variation; no collision/height disagreement. */
export default function TerrainSurface({onClick,color:groundColor,region}:{color?:string;region:string;onClick:(event:ThreeEvent<MouseEvent>)=>void}){
 const centerZ=(WORLD_BOUNDS.minZ+WORLD_BOUNDS.maxZ)/2;
 const geometry=useMemo(()=>{
   const g=new THREE.PlaneGeometry(WORLD_BOUNDS.x*2,WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ,90,90),p=g.getAttribute('position'),colors=new Float32Array(p.count*3),color=new THREE.Color();
   const biome=biomeOf(region);
   const [shadow,midtone,accent]=biome?.ground??['#53636a',groundColor??'#879568','#ada892'];
   const dark=new THREE.Color(shadow),light=new THREE.Color(midtone),detail=new THREE.Color(accent);
   for(let i=0;i<p.count;i++){
     const x=p.getX(i),z=-p.getY(i)+centerZ;
     const a=.48+.23*Math.sin(x*.117+z*.031)*Math.cos(z*.135)+.09*Math.sin(x*.62+z*.42);
     const coast=biome?.landmarks.find(mark=>isWater(mark)&&landmarkDistance(mark,x,z)<1.24);
     color.copy(dark).lerp(light,THREE.MathUtils.clamp(a,0,1));
     const patch=Math.max(0,Math.sin(x*.082-z*.11)*Math.cos(z*.071));
     color.lerp(detail,coast?.kind==='water'?.58:patch*.42).toArray(colors,i*3);
   }
   g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;
 },[groundColor,region,centerZ]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh position={[0,0,centerZ]} rotation={[-Math.PI/2,0,0]} geometry={geometry} receiveShadow onClick={onClick}><meshStandardMaterial vertexColors roughness={1}/></mesh>;
}
