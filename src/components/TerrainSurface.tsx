"use client";
import {useEffect,useMemo} from 'react';
import type {ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
/** Flat walkable ground with local colour variation; no collision/height disagreement. */
export default function TerrainSurface({onClick,color:groundColor}:{color?:string;onClick:(event:ThreeEvent<MouseEvent>)=>void}){
 const geometry=useMemo(()=>{
   const g=new THREE.PlaneGeometry(150,150,90,90),p=g.getAttribute('position'),colors=new Float32Array(p.count*3),color=new THREE.Color();
   const dark=new THREE.Color(groundColor??'#3e624d').multiplyScalar(.65),light=new THREE.Color(groundColor??'#879568').lerp(new THREE.Color('#b6b59b'),.22);
   for(let i=0;i<p.count;i++){const x=p.getX(i),z=-p.getY(i);const a=.5+.18*Math.sin(x*.24)*Math.cos(z*.2)+.1*Math.sin(x*1.75+z*.97);color.copy(dark).lerp(light,Math.max(0,Math.min(1,a)));color.toArray(colors,i*3);}
   g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;
 },[groundColor]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh rotation={[-Math.PI/2,0,0]} geometry={geometry} receiveShadow onClick={onClick}><meshStandardMaterial vertexColors roughness={1}/></mesh>;
}
