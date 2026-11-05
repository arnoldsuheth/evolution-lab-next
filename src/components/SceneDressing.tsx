"use client";
import {useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import {scatter,SCENERY_DENSITY,type Decoration} from '@/lib/scenery';

const FLOWER_COLORS=['#f3d36b','#f2f0e6','#e7859a','#a99be6','#f39c5a'];
function Instances({items,geometry,material,height,tint}:{items:Decoration[];geometry:THREE.BufferGeometry;material:THREE.Material;height:number;tint?:(d:Decoration,c:THREE.Color)=>void}){
 const mesh=useRef<THREE.InstancedMesh>(null);
 useLayoutEffect(()=>{const m=mesh.current;if(!m)return;const o=new THREE.Object3D(),c=new THREE.Color();
  items.forEach((d,i)=>{o.position.set(d.x,height*d.scale,d.z);o.rotation.set(0,d.turn,0);o.scale.setScalar(d.scale);o.updateMatrix();m.setMatrixAt(i,o.matrix);if(tint){tint(d,c);m.setColorAt(i,c);}});
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.computeBoundingSphere();},[items,height,tint]);
 return <instancedMesh ref={mesh} args={[geometry,material,items.length]} frustumCulled={false} raycast={()=>null}/>;
}
/** Grama, flores e pedrinhas instanciadas: poucas chamadas de desenho e nenhum clique bloqueado. */
export default function SceneDressing({quality='medium',groundColor='#607651'}:{quality?:'low'|'medium'|'high';groundColor?:string}){
 const density=SCENERY_DENSITY[quality]??SCENERY_DENSITY.medium;
 const grass=useMemo(()=>scatter(density.grass,7),[density.grass]),flowers=useMemo(()=>scatter(density.flowers,19,34,4),[density.flowers]),pebbles=useMemo(()=>scatter(density.pebbles,41,34,2),[density.pebbles]);
 const assets=useMemo(()=>{
  const blade=new THREE.ConeGeometry(.11,.85,3);blade.translate(0,.42,0);
  const tuft=new THREE.BufferGeometry();const parts=[-.5,0,.55].map((a,i)=>{const g=blade.clone();g.rotateZ(a*.45);g.rotateY(i*2.1);g.translate(Math.sin(i*2.1)*.12,0,Math.cos(i*2.1)*.12);return g;});
  const merged=mergeSimple(parts);tuft.copy(merged);parts.forEach(p=>p.dispose());blade.dispose();merged.dispose();
  const blossom=new THREE.IcosahedronGeometry(.17,0);blossom.translate(0,.55,0);
  const stone=new THREE.DodecahedronGeometry(.22,0);stone.scale(1,.55,.8);
  return {tuft,blossom,stone,grassMaterial:new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,flatShading:true}),flowerMaterial:new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.8,emissive:'#3a2a10',emissiveIntensity:.15}),stoneMaterial:new THREE.MeshStandardMaterial({color:'#8d8f86',roughness:.95,flatShading:true})};
 },[]);
 useEffect(()=>()=>{Object.values(assets).forEach(a=>a.dispose());},[assets]);
 const base=useMemo(()=>new THREE.Color(groundColor),[groundColor]);
 const grassTint=useMemo(()=>(d:Decoration,c:THREE.Color)=>{c.copy(base).lerp(new THREE.Color(d.tone>.5?'#9cc265':'#5f9a4c'),.55).multiplyScalar(.95+d.tone*.25);},[base]);
 const flowerTint=useMemo(()=>(d:Decoration,c:THREE.Color)=>{c.set(FLOWER_COLORS[Math.floor(d.tone*FLOWER_COLORS.length)%FLOWER_COLORS.length]);},[]);
 const stoneTint=useMemo(()=>(d:Decoration,c:THREE.Color)=>{c.set('#9a9b91').multiplyScalar(.8+d.tone*.35);},[]);
 return <group>
  <Instances items={grass} geometry={assets.tuft} material={assets.grassMaterial} height={0} tint={grassTint}/>
  <Instances items={flowers} geometry={assets.blossom} material={assets.flowerMaterial} height={0} tint={flowerTint}/>
  <Instances items={flowers} geometry={assets.tuft} material={assets.grassMaterial} height={0} tint={grassTint}/>
  <Instances items={pebbles} geometry={assets.stone} material={assets.stoneMaterial} height={.04} tint={stoneTint}/>
 </group>;
}
/** União simples de geometrias não indexadas com o mesmo formato de atributos. */
function mergeSimple(list:THREE.BufferGeometry[]){
 const geometries=list.map(g=>g.index?g.toNonIndexed():g),out=new THREE.BufferGeometry();
 for(const name of ['position','normal']){const arrays=geometries.map(g=>g.getAttribute(name).array as Float32Array),size=arrays.reduce((n,a)=>n+a.length,0),data=new Float32Array(size);let offset=0;for(const a of arrays){data.set(a,offset);offset+=a.length;}out.setAttribute(name,new THREE.BufferAttribute(data,3));}
 geometries.forEach((g,i)=>{if(g!==list[i])g.dispose();});return out;
}
