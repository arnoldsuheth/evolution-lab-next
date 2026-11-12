"use client";

import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { biomeOf, isWater, landmarkDistance, type Landmark } from '@/lib/biomes';
import type { RegionId } from '@/lib/campaign';
import { walkable } from '@/lib/navigation';
import { overlandRoads } from '@/lib/overland';
import { WORLD_BOUNDS } from '@/lib/worldBounds';
import { MergedParts, type Part } from './MergedParts';

const ROCK = ['#655d52','#877d69','#aa9b80'];
const ICE = ['#6f8b99','#9ab9c5','#edf5ee'];
const VOLCANIC = ['#483841','#70504a','#b35a37'];
const SHORE = ['#5d7e78','#507e88','#315b73'];

function mountainGeometry(landmark:Landmark,low:boolean){
  const {kind,height,rx,rz}=landmark;
  const palette=(kind==='ice'?ICE:kind==='volcano'?VOLCANIC:ROCK).map(c=>new THREE.Color(c));
  const volcano=kind==='volcano';
  const rings=volcano?[[1,0],[.8,.22],[.53,.58],[.27,1],[.15,.74],[.015,.69]]
    :[[1,0],[.85,.13],[.64,.40],[.40,.68],[.19,.89],[.01,1]];
  const segments=low?13:20;
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  for(let row=0;row<rings.length;row++){
    const [radius,y]=rings[row];
    for(let i=0;i<segments;i++){
      const angle=i/segments*Math.PI*2;
      const ridge=Math.sin(i*2.8+landmark.x)*.11+Math.sin(i*5.3+row*.9)*.07;
      const factor=radius*(1+ridge*Math.min(1,row));
      const shoulder=volcano?0:Math.min(.18,row*.028);
      positions.push(Math.cos(angle)*factor*rx+rx*shoulder,
        height*y*(1+ridge*.48),Math.sin(angle)*factor*rz-rz*shoulder*.4);
      const color=palette[row>=3?2:row>=2?1:0].clone().multiplyScalar(1+ridge*.53);
      colors.push(color.r,color.g,color.b);
      if(row>0){
        const current=row*segments+i,next=row*segments+(i+1)%segments;
        indices.push(current-segments,current,next-segments,next-segments,current,next);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Mountain({landmark,low}:{landmark:Landmark;low:boolean}){
  const geometry=useMemo(()=>mountainGeometry(landmark,low),[landmark,low]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const {x,z,rx,rz,height,kind}=landmark;
  return <group position={[x,0,z]}>
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={.96} side={THREE.DoubleSide}/>
    </mesh>
    {kind==='volcano'&&<mesh position={[0,height*.704,0]} rotation={[-Math.PI/2,0,0]} scale={[rx*.14,rz*.14,1]}>
      <circleGeometry args={[1,18]}/><meshStandardMaterial color="#ff914f" emissive="#ef4d22" emissiveIntensity={1.8} roughness={.73}/>
    </mesh>}
  </group>;
}

function Coast({landmark,ice}:{landmark:Landmark;ice:boolean}){
  const {x,z,rx,rz,kind}=landmark,lava=kind==='lava';
  return <group position={[x,.025,z]} rotation={[-Math.PI/2,0,0]} scale={[rx,rz,1]}>
    <mesh><ringGeometry args={[.94,1.14,48]}/><meshStandardMaterial color={lava?'#603930':ice?'#aabfc4':'#bcb17d'} roughness={1}/></mesh>
    {[1,.89,.71].map((scale,i)=><mesh key={scale} position={[0,0,.008*(i+1)]} scale={[scale,scale,1]}>
      <circleGeometry args={[1,48]}/><meshStandardMaterial color={lava?['#893822','#ad4a2a','#bd542b'][i]:SHORE[i]}
        emissive={lava?'#b64320':'#163b4c'} emissiveIntensity={lava?.55:.14} roughness={lava?.7:.34}/>
    </mesh>)}
    {[-1,0,1].map(i=><mesh key={i} position={[.21*i,.18*i,.035]} scale={[.20,.10,1]}>
      <ringGeometry args={[.78,1,26,1,.35,2.45]}/><meshBasicMaterial color={lava?'#ed9952':'#a9d6da'} transparent opacity={.46} depthWrite={false}/>
    </mesh>)}
  </group>;
}

export default function Wildlands({region,low}:{region:RegionId;low:boolean}){
  const biome=biomeOf(region);
  const landscape=useCallback(()=>{
    if(!biome)return [];
    const roads=overlandRoads(region).flatMap(road=>road.points.slice(1).map(([x,z],i)=>[road.points[i][0],road.points[i][1],x,z] as const));
    return Array.from({length:low?115:235},(_,i)=>{
      const x=Math.sin(i*93.17+3)*Math.cos(i*1.98)*WORLD_BOUNDS.x;
      const z=-7+Math.sin(i*47.31+1)*Math.cos(i*2.47)*73;
      const size=.62+(i%7)*.15;
      if(Math.hypot(x,z)<31||!walkable(x,z,region)||biome.landmarks.some(mark=>landmarkDistance(mark,x,z)<1.08))return [];
      const onTrail=roads.some(([ax,az,bx,bz])=>{
        const dx=bx-ax,dz=bz-az,t=THREE.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);
        return Math.hypot(x-ax-dx*t,z-az-dz*t)<3.7;
      });
      if(onTrail)return [];
      if(biome.trees==='crystal')return [{g:new THREE.OctahedronGeometry(size,0),p:[x,size*.65,z],r:[.13,i,0],c:'#907d9e'}] satisfies Part[];
      if(biome.trees==='scrub')return [
        {g:new THREE.DodecahedronGeometry(size,0),p:[x,size*.31,z],r:[.1,i*.4,.3],c:i%2?'#8d7159':'#a48361'},
        {g:new THREE.IcosahedronGeometry(size*.39,0),p:[x+.75,.32,z-.16],c:'#7d8153'},
      ] satisfies Part[];
      const crowns:Part[]=biome.trees==='pine'
        ? [{g:new THREE.ConeGeometry(size*.91,size*2.25,7),p:[x,size*1.9,z],c:'#678484'},
           {g:new THREE.ConeGeometry(size*.63,size*1.55,7),p:[x,size*2.48,z],c:'#b8d0ce'}]
        : [{g:new THREE.IcosahedronGeometry(size*1.1,1),p:[x,size*2.15,z],c:i%2?'#5f8449':'#4e734b'},
           {g:new THREE.IcosahedronGeometry(size*.83,0),p:[x+size*.63,size*1.89,z-size*.2],c:'#7e9957'}];
      return [{g:new THREE.CylinderGeometry(size*.11,size*.18,size*1.75,6),p:[x,size*.87,z],c:'#6e5141'},...crowns] satisfies Part[];
    }).flat();
  },[biome,low,region]);
  if(!biome)return null;
  return <group>
    {biome.landmarks.map(landmark=>isWater(landmark)
      ?<Coast key={landmark.name} landmark={landmark} ice={biome.trees==='pine'}/>
      :<Mountain key={landmark.name} landmark={landmark} low={low}/>)}
    <MergedParts parts={landscape} receiveShadow/>
  </group>;
}
