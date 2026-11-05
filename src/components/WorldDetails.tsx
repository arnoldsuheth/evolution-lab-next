"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BUILDINGS } from '@/lib/navigation';
import { useGame } from '@/lib/store';

export function HouseDetails({ index }: { index: number }) {
  const banner = useRef<THREE.Mesh>(null);
  const reduced = useGame(s => s.settings.reduceMotion);
  useFrame(state => { if (banner.current) banner.current.rotation.z = reduced ? 0 : Math.sin(state.clock.elapsedTime*1.25+index)*0.035; });
  const color = ['#607b77','#6b617e','#9a7855','#557966'][index];
  return <group>
    <mesh position={[-1.9,3.15,2.38]}><boxGeometry args={[0.08,0.72,0.1]} /><meshStandardMaterial color="#5b4b35" /></mesh>
    <mesh position={[-1.9,2.85,2.47]} ref={banner}><planeGeometry args={[0.58,0.83]} /><meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} /></mesh>
    <mesh position={[-1.9,2.88,2.48]}><octahedronGeometry args={[0.11]} /><meshStandardMaterial color="#cbb98a" /></mesh>
    {[-1.5,1.5].map(x=><group key={x} position={[x,1.65,2.45]}>
      <mesh position={[0,0,0]}><boxGeometry args={[0.27,0.39,0.24]} /><meshStandardMaterial color="#b09962" emissive="#b68c43" emissiveIntensity={0.35} /></mesh>
      <mesh position={[0,0.24,0]}><coneGeometry args={[0.22,0.2,4]} /><meshStandardMaterial color="#4d554e" /></mesh>
      <mesh position={[0,-0.23,0]}><boxGeometry args={[0.3,0.06,0.27]} /><meshStandardMaterial color="#4d554e" /></mesh>
    </group>)}
    <group position={[2.08,0.68,1.73]}>
      <mesh castShadow><cylinderGeometry args={[0.38,0.34,0.79,10]} /><meshStandardMaterial color="#7d6247" flatShading /></mesh>
      {[-0.23,0.23].map(y=><mesh key={y} position={[0,y,0]}><cylinderGeometry args={[0.39,0.39,0.07,10]} /><meshStandardMaterial color="#4f5c57" metalness={0.3} roughness={0.7} /></mesh>)}
    </group>
    <mesh position={[0,0.22,2.65]} receiveShadow><boxGeometry args={[1.8,0.25,0.5]} /><meshStandardMaterial color="#8a8b78" /></mesh>
  </group>;
}
function Flowers({ low }: { low: boolean }) {
  const stems = useRef<THREE.InstancedMesh>(null); const heads = useRef<THREE.InstancedMesh>(null);
  const count = low ? 70 : 180;
  const points = useMemo(()=>Array.from({length:count*2},(_,i)=>({x:Math.sin(i*8.137)*14,z:Math.cos(i*4.718)*10})).filter(p=>Math.abs(p.x)>3.8&&!BUILDINGS.some(b=>Math.abs(p.x-b.x)<b.w+0.8&&Math.abs(p.z-b.z)<b.d+0.8)).slice(0,count),[count]);
  useEffect(()=>{
    const matrix = new THREE.Matrix4(); const color = new THREE.Color();
    points.forEach((p,i)=>{matrix.makeTranslation(p.x,0.14,p.z);stems.current?.setMatrixAt(i,matrix);matrix.makeTranslation(p.x,0.29,p.z);heads.current?.setMatrixAt(i,matrix);color.set(['#d4c37a','#b6a0cb','#e2d6b0','#9fbc91'][i%4]);heads.current?.setColorAt(i,color);});
    if(stems.current) stems.current.instanceMatrix.needsUpdate=true;
    if(heads.current) {heads.current.instanceMatrix.needsUpdate=true;if(heads.current.instanceColor) heads.current.instanceColor.needsUpdate=true;}
  },[points]);
  return <group><instancedMesh ref={stems} args={[undefined,undefined,points.length]} frustumCulled={false}><cylinderGeometry args={[0.014,0.02,0.27,4]} /><meshStandardMaterial color="#536c44" /></instancedMesh><instancedMesh ref={heads} args={[undefined,undefined,points.length]} frustumCulled={false}><sphereGeometry args={[0.075,6,4]} /><meshStandardMaterial roughness={1} /></instancedMesh></group>;
}
function Fireflies({ reduced }: { reduced: boolean }) {
  const root = useRef<THREE.Points>(null);
  const vertices = useMemo(()=>new Float32Array(Array.from({length:72},(_,i)=> i%3===0 ? Math.sin(i*4.83)*9 : i%3===1 ? 0.7+(i%7)*0.22 : -17+Math.cos(i*1.94)*7)),[]);
  useFrame(state=>{if(root.current&&!reduced) root.current.position.y=Math.sin(state.clock.elapsedTime*0.65)*0.14;});
  return <points ref={root}><bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices,3]} /></bufferGeometry><pointsMaterial color="#d5df9e" size={0.065} transparent opacity={0.65} depthWrite={false} /></points>;
}
export default function WorldDetails({ night, low, reduced }: { night: boolean; low: boolean; reduced: boolean }) {
  return <group><Flowers low={low}/>{night&&!low&&<Fireflies reduced={reduced}/>}
    <group position={[-3.7,0,-10]}><mesh position={[0,0.75,0]}><cylinderGeometry args={[0.06,0.1,1.5,6]}/><meshStandardMaterial color="#5e4c39"/></mesh><mesh position={[0,1.38,0]}><boxGeometry args={[1.3,0.45,0.12]}/><meshStandardMaterial color="#7b6547"/></mesh><Html zIndexRange={[7,0]} position={[0,1.45,0.1]} center style={{pointerEvents:'none'}}><span className="trail-sign">FLORESTA ↑</span></Html></group>
    <group position={[14,0,-18]}><mesh position={[0,0.8,0]}><cylinderGeometry args={[0.07,0.1,1.6,6]}/><meshStandardMaterial color="#5e4c39"/></mesh><mesh position={[0,1.45,0]}><boxGeometry args={[1.5,0.45,0.14]}/><meshStandardMaterial color="#6b6053"/></mesh><Html zIndexRange={[7,0]} position={[0,1.45,0.1]} center style={{pointerEvents:'none'}}><span className="trail-sign">MINAS →</span></Html></group>
  </group>;
}
