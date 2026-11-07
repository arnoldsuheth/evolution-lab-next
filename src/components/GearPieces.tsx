"use client";
import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {GEAR_PIECES,RARITY_LOOK,type GearSlot,type PieceShape} from '@/lib/gearPieces';

type Tier=keyof typeof RARITY_LOOK;
let geometries:Record<PieceShape,THREE.BufferGeometry>|null=null;
function shapes(){return geometries??={dome:new THREE.SphereGeometry(1,18,10,0,Math.PI*2,0,Math.PI/2),cuff:new THREE.CylinderGeometry(1,1.08,1,16),ring:new THREE.TorusGeometry(1,.13,8,28),gem:new THREE.OctahedronGeometry(1),plate:new THREE.BoxGeometry(1,1,1)};}
const pieceMaterials=new Map<Tier,THREE.MeshStandardMaterial>();
export function pieceMaterial(tier:Tier){let m=pieceMaterials.get(tier);if(!m){const l=RARITY_LOOK[tier];m=new THREE.MeshStandardMaterial({color:l.color,metalness:l.metalness,roughness:l.roughness,emissive:l.glow,emissiveIntensity:l.glowIntensity,flatShading:true});pieceMaterials.set(tier,m);}return m;}

/** Prende as peças equipadas aos ossos do modelo (nomes de osso chegam sem ponto após o carregamento). */
export function attachGearPieces(model:THREE.Object3D,slots:{slot:GearSlot;tier:Tier}[]){
 const bones=new Map<string,THREE.Bone>();model.traverse(o=>{if(o instanceof THREE.Bone)bones.set(o.name,o);});
 for(const {slot,tier} of slots)for(const piece of GEAR_PIECES[slot]??[]){
  const bone=bones.get(THREE.PropertyBinding.sanitizeNodeName(piece.bone));if(!bone)continue;
  const mesh=new THREE.Mesh(shapes()[piece.shape],pieceMaterial(tier));mesh.name=`gear-${slot}`;mesh.castShadow=true;mesh.raycast=()=>{};
  mesh.position.set(...piece.position);mesh.scale.set(...piece.scale);if(piece.rotation)mesh.rotation.set(...piece.rotation);bone.add(mesh);
 }
}

/** Aura no chão e faíscas subindo: Épico em lilás, Mítico em dourado. */
export function GearAura({tier,animated=true}:{tier:Tier;animated?:boolean}){
 const look=RARITY_LOOK[tier],ring=useRef<THREE.Mesh>(null),sparks=useRef<THREE.Points>(null),count=tier==='mythic'?22:12;
 const assets=useMemo(()=>{
  const positions=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2,r=.45+(i%3)*.12;positions.set([Math.cos(a)*r,(i*.37)%1.8,Math.sin(a)*r],i*3);seeds[i]=(i*.618)%1;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  return {geometry,seeds,ringMaterial:new THREE.MeshBasicMaterial({color:look.glow,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),sparkMaterial:new THREE.PointsMaterial({color:look.trim,size:tier==='mythic'?.09:.07,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false})};
 },[count,look.glow,look.trim,tier]);
 useFrame((state,delta)=>{if(!animated)return;const t=state.clock.elapsedTime;
  if(ring.current){(ring.current.material as THREE.MeshBasicMaterial).opacity=.32+Math.sin(t*2.4)*.16;ring.current.rotation.z+=delta*.6;}
  const p=sparks.current?.geometry.getAttribute('position') as THREE.BufferAttribute|undefined;if(!p)return;
  for(let i=0;i<count;i++){let y=p.getY(i)+delta*(.45+assets.seeds[i]*.4);if(y>2.1)y=0;p.setY(i,y);}p.needsUpdate=true;
 });
 if(!look.aura)return null;
 return <group raycast={()=>null}>
  <mesh ref={ring} rotation={[-Math.PI/2,0,0]} position={[0,.03,0]} material={assets.ringMaterial} raycast={()=>null}><ringGeometry args={[.62,.86,40]}/></mesh>
  <points ref={sparks} geometry={assets.geometry} material={assets.sparkMaterial} raycast={()=>null}/>
 </group>;
}
