"use client";
import {useLayoutEffect,useMemo,useRef} from 'react';
import {createPortal,useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {HERO_BASE_FILES,type BorrowedMesh} from '@/lib/heroModels';
import {rarityTier} from '@/lib/gearPieces';
import EquipmentVisual,{rarityTone} from './EquipmentVisual';

/**
 * O que o jogador equipou aparece no boneco igual ao ícone:
 * arma e elmo vêm das peças 3D do pacote (presas ao mesmo osso); itens sem peça pronta usam o modelo simples.
 * Raridade da ARMA: Comum sem brilho · Épico brilho leve · Mítico brilho + fogo (o item continua nítido).
 * ARMADURA (elmo): muda só a cor.
 */
const url=(base:string)=>`${(process.env.NEXT_PUBLIC_BASE_PATH??'')}/models/heroes/${base}`;

const looks=new Map<string,THREE.Material>();
const WEAPON_GLOW={epic:{color:"#b48cff",intensity:.45},mythic:{color:'#ffb43a',intensity:.55}};
const ARMOR_TINT={epic:'#8a63d6',mythic:'#e8b53e'};
function dressed(source:THREE.Material,kind:'weapon'|'armor',rarity:string){
 const tier=rarityTier(rarity);if(tier==='common'||!(source instanceof THREE.MeshStandardMaterial))return source;
 const key=`${source.uuid}|${kind}|${tier}`;let m=looks.get(key);
 if(!m){const g=source.clone();if(kind==='weapon'){const glow=WEAPON_GLOW[tier];g.emissive=new THREE.Color(glow.color);g.emissiveIntensity=glow.intensity;g.emissiveMap=source.map;}else{g.map=null;g.color=new THREE.Color(ARMOR_TINT[tier]);g.metalness=.55;g.roughness=.38;}m=g;looks.set(key,m);}
 return m;
}
const boneIn=(scene:THREE.Object3D,name:string)=>{const want=THREE.PropertyBinding.sanitizeNodeName(name);let found:THREE.Object3D|undefined;scene.traverse(o=>{if(!found&&o instanceof THREE.Bone&&o.name===want)found=o;});return found;};

/** Chamas pequenas subindo pela lâmina (só Mítico). Medidas no espaço da própria arma. */
function WeaponFire({from,to}:{from:THREE.Vector3;to:THREE.Vector3}){
 const group=useRef<THREE.Group>(null),len=from.distanceTo(to),count=7;
 const flames=useMemo(()=>Array.from({length:count},(_,i)=>({t:.25+.75*i/(count-1),side:(i%2?1:-1)*len*.035,seed:i*.37})),[len]);
 const geometry=useMemo(()=>new THREE.ConeGeometry(len*.06,len*.22,6),[len]);
 const materials=useMemo(()=>[new THREE.MeshBasicMaterial({color:'#ffc23a',transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}),new THREE.MeshBasicMaterial({color:'#ff6a1a',transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false})],[]);
 useFrame(({clock})=>{const g=group.current;if(!g)return;const t=clock.elapsedTime;g.children.forEach((c,i)=>{const f=flames[i];if(!f)return;const k=(t*1.6+f.seed)%1;c.position.lerpVectors(from,to,f.t);c.position.y+=k*len*.12;c.position.x+=f.side;const s=Math.sin(k*Math.PI);c.scale.setScalar(.35+s*.85);});});
 return <group ref={group} raycast={()=>null}>{flames.map((_,i)=><mesh key={i} geometry={geometry} material={materials[i%2]} raycast={()=>null}/>)}<pointLight position={to.toArray()} color="#ffa23a" intensity={1.4} distance={len*3}/></group>;
}
/** Ponta da peça (o lado mais longe da mão) e o meio do cabo, para o fogo. */
function bladeLine(geometry:THREE.BufferGeometry){
 geometry.computeBoundingBox();const b=geometry.boundingBox!,size=new THREE.Vector3();b.getSize(size);
 const axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z',center=new THREE.Vector3();b.getCenter(center);
 const tip=center.clone(),grip=center.clone(),far=Math.abs(b.max[axis])>=Math.abs(b.min[axis]);tip[axis]=far?b.max[axis]:b.min[axis];grip[axis]=far?b.min[axis]:b.max[axis];
 return {from:grip.lerp(tip,.3),to:tip};
}

/** Peça 3D de outro corpo-base presa ao osso certo deste herói. */
export function BorrowedPiece({piece,bone,scene,rarity,kind}:{piece:BorrowedMesh;bone:string;scene:THREE.Group;rarity:string;kind:'weapon'|'armor'}){
 const gltf=useGLTF(url(HERO_BASE_FILES[piece.base]));
 const object=useMemo(()=>{let source:THREE.Mesh|undefined;gltf.scene.traverse(o=>{if(!source&&o instanceof THREE.Mesh&&o.name===piece.mesh)source=o;});if(!source)return null;
  const m=new THREE.Mesh(source.geometry,dressed(source.material as THREE.Material,kind,rarity));m.name=`worn-${piece.mesh}`;m.castShadow=true;m.raycast=()=>{};
  m.position.copy(source.position);m.quaternion.copy(source.quaternion);m.scale.copy(source.scale);return m;},[gltf.scene,piece.mesh,kind,rarity]);
 useLayoutEffect(()=>{const target=boneIn(scene,bone);if(!object||!target)return;target.add(object);return()=>{object.removeFromParent();};},[object,scene,bone]);
 const line=useMemo(()=>object&&kind==='weapon'&&rarityTier(rarity)==='mythic'?bladeLine(object.geometry):null,[object,kind,rarity]);
 return object&&line?createPortal(<WeaponFire from={line.from} to={line.to}/>,object):null;
}

const BOW_FORWARD = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

/** Peças procedurais têm a origem no punho e seguem o osso durante as animações. */
export function SimpleWeapon({visual,bone,scene,rarity,small=false}:{visual:string;bone:string;scene:THREE.Group;rarity:string;small?:boolean}){
 const target=useMemo(()=>boneIn(scene,bone),[scene,bone]),tier=rarityTier(rarity);
 const grip=useRef<THREE.Group>(null);
 const handRotation=useRef(new THREE.Quaternion()), heroRotation=useRef(new THREE.Quaternion());
 useFrame(()=>{
  if (visual !== 'bow' || !grip.current || !target) return;
  // O clipe de disparo gira o pulso para a besta. A mão esquerda carrega o arco, que fica na vertical.
  target.getWorldQuaternion(handRotation.current).invert();
  scene.getWorldQuaternion(heroRotation.current);
  grip.current.quaternion.copy(handRotation.current).multiply(heroRotation.current).multiply(BOW_FORWARD);
 });
 if(!target)return null;
 const rotation: [number,number,number]=[0,visual==='bow'?-Math.PI/2:visual==='gun'?Math.PI/2:bone==='handslot.l'?0:Math.PI,0];
 const muzzle = visual === 'gun';
 return createPortal(<group ref={grip} rotation={rotation}>
  <EquipmentVisual visual={visual} tone={rarityTone(rarity)} small={small}/>
  {/* Sem pointLight: trocar de equipamento não recompila mais a iluminação da cena (travava no celular). */}
  {tier==='mythic'&&<WeaponFire from={muzzle?new THREE.Vector3(0,.21,.48):new THREE.Vector3(0,.22,0)} to={muzzle?new THREE.Vector3(0,.21,.88):new THREE.Vector3(0,.62,0)}/>}
 </group>,target);
}
