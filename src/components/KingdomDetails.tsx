"use client";
import {useEffect,useMemo,useRef} from 'react';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {BUILDINGS,walkable} from '@/lib/navigation';
import type {RegionId} from '@/lib/campaign';

/** Small repeated details are instanced, preserving the existing walkable map. */
export default function KingdomDetails({region,low}:{region:RegionId;low:boolean}){
 const grass=useRef<THREE.InstancedMesh>(null),stones=useRef<THREE.InstancedMesh>(null);
 const blades=useMemo(()=>Array.from({length:low?180:460},(_,i)=>({x:Math.sin(i*12.989)*26,z:-7+Math.cos(i*7.233)*20,size:.07+(i%5)*.018})).filter(p=>walkable(p.x,p.z,true,true,region)&&Math.abs(p.x)>3&&Math.hypot(p.x,p.z)>6.5),[region,low]);
 const edging=useMemo(()=>region==='aurora'?Array.from({length:92},(_,i)=>{const side=i%2?1:-1;return{x:side*(2.55+(i%3)*.04),z:-27+Math.floor(i/2)*.88};}).filter(p=>Math.hypot(p.x,p.z)>6.4).filter(p=>!BUILDINGS.some(b=>Math.abs(p.x-b.x)<b.w+1&&Math.abs(p.z-b.z)<b.d+1)):[],[region]);
 useEffect(()=>{const m=new THREE.Matrix4(),c=new THREE.Color();blades.forEach((p,i)=>{m.compose(new THREE.Vector3(p.x,.07,p.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,i*2.4,.15)),new THREE.Vector3(p.size,p.size*2.4,p.size));grass.current?.setMatrixAt(i,m);c.set(['#7b9560','#607d50','#9aa66a','#486c52'][i%4]);grass.current?.setColorAt(i,c);});edging.forEach((p,i)=>{m.compose(new THREE.Vector3(p.x,.055,p.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,i*.6,0)),new THREE.Vector3(.24,.1,.33));stones.current?.setMatrixAt(i,m);});for(const mesh of [grass.current,stones.current])if(mesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}},[blades,edging]);
 return <group>
  <instancedMesh ref={grass} args={[undefined,undefined,blades.length]}><coneGeometry args={[1,1,3]}/><meshStandardMaterial roughness={1}/></instancedMesh>
  {edging.length>0&&<instancedMesh ref={stones} args={[undefined,undefined,edging.length]} receiveShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color="#c9c3ad" roughness={1}/></instancedMesh>}
  {region==='aurora'&&<>
   <mesh position={[0,.035,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><ringGeometry args={[5.53,5.83,64]}/><meshStandardMaterial color="#dccfa8" roughness={1}/></mesh>
   <mesh position={[0,.037,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.7,1.77,48]}/><meshStandardMaterial color="#cfe0d8" roughness={.8}/></mesh>
   <mesh position={[0,.036,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.9,3.05,64]}/><meshStandardMaterial color="#f8f2e2" roughness={.9}/></mesh>
   {/* Canteiros de flores nas diagonais: enfeite baixo, fora dos caminhos. */}
   {[1,3,5,7].map(k=>{const a=k*Math.PI/4;return <group key={k} position={[Math.cos(a)*4.1,0,Math.sin(a)*4.1]}><mesh position={[0,.05,0]} receiveShadow><cylinderGeometry args={[.78,.84,.1,20]}/><meshStandardMaterial color="#e6dcc2" roughness={1}/></mesh><mesh position={[0,.11,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.68,20]}/><meshStandardMaterial color="#86b866" roughness={1}/></mesh>{[0,1,2,3,4,5].map(j=><mesh key={j} position={[Math.cos(j*1.05+k)*.4,.2,Math.sin(j*1.05+k)*.4]}><sphereGeometry args={[.11,8,6]}/><meshStandardMaterial color={['#f3d36b','#f2f0e6','#e7859a','#a99be6','#f39c5a','#f7b6c8'][(j+k)%6]} roughness={.7}/></mesh>)}</group>;})}
   {BUILDINGS.map((b,i)=><group key={i} position={[b.x,0,b.z]}>
    <Html position={[0,3.5,2.5]} center zIndexRange={[4,0]} style={{pointerEvents:'none'}}><span className="service-sign">{['⚒ Oficina de Borin','⌂ Casa dos viajantes','✧ Arquivo das runas','☽ Pousada da Aurora'][i]}</span></Html>
    {[-1,1].map(side=><group key={side} position={[side*1.9,.3,2.7]}><mesh castShadow><boxGeometry args={[.58,.4,.46]}/><meshStandardMaterial color="#68513c" roughness={1}/></mesh><mesh position={[0,.27,0]} scale={[.45,.26,.33]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={i%2?'#687c53':'#8a7c60'} flatShading/></mesh></group>)}
   </group>)}
  </>}
  {region!=='aurora'&&<mesh position={[2,.035,-19]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[4.25,4.32,64]}/><meshStandardMaterial color={region==='heart'?'#9f81bd':region==='ruins'?'#8fb5b1':'#c2ab78'} emissive={region==='heart'?'#625075':'#4c645d'} emissiveIntensity={.3}/></mesh>}
 </group>;
}
