"use client";
import {Suspense,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useGLTF,useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {ClassId,Race} from '@/lib/game';
import {BODY_WIDTH,HERO_BASE_FILES,HERO_HAT_MESHES,HERO_PARTS,HERO_PUNCH,HERO_STYLE,HERO_WALK,HERO_WEAPON_MESHES,heroDress,heroProportions,recolorAtlas,type HeroBase,type HeroGear,type RecolorOptions} from '@/lib/heroModels';
import {useGame} from '@/lib/store';

const base=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export const heroModelUrl=(model:HeroBase)=>`${base}/models/heroes/${HERO_BASE_FILES[model]}`;
/** Altura do herói no mesmo referencial do avatar procedural (antes da escala .74 do mundo). */
const HUMAN_HEIGHT=3;
const CASTERS=new Set<ClassId>(['mage','prophet','shaman']);
const materials=new Map<string,THREE.Material>();

function recolored(source:THREE.MeshStandardMaterial,key:string,classId:ClassId,skin:string,options:RecolorOptions){
 const cached=materials.get(key);if(cached)return cached;
 const image=source.map?.image as CanvasImageSource&{width:number;height:number}|undefined;
 if(!image||typeof document==='undefined')return source;
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return source;
 context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height);
 recolorAtlas(pixels.data,HERO_STYLE[classId],skin,options);context.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=source.clone();material.map=texture;material.needsUpdate=true;materials.set(key,material);return material;
}

/** Cabeça (penteado ou capuz) vinda de outro corpo-base; todos usam o mesmo esqueleto. */
function ForeignHead({from,host,classId,skin,hair}:{from:HeroBase;host:THREE.SkinnedMesh;classId:ClassId;skin:string;hair:string}){
 const gltf=useGLTF(heroModelUrl(from));
 useLayoutEffect(()=>{
  let source:THREE.SkinnedMesh|undefined;gltf.scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh&&o.name===HERO_PARTS[from].head)source=o;});
  const parent=host.parent;if(!source||!parent)return;
  const material=source.material instanceof THREE.MeshStandardMaterial?recolored(source.material,`${from}|${classId}|${skin}|head|${hair}`,classId,skin,{hair:{base:from,color:hair}}):source.material;
  const head=new THREE.SkinnedMesh(source.geometry,material);head.name='foreign-head';head.castShadow=true;
  head.position.copy(host.position);head.quaternion.copy(host.quaternion);head.scale.copy(host.scale);
  head.bind(host.skeleton,source.bindMatrix);parent.add(head);
  return()=>{head.removeFromParent();};
 },[gltf.scene,from,host,classId,skin,hair]);
 return null;
}

export default function HeroModel({classId,race,skin,hair='#825235',hairStyle=0,body=2,showHelmet=true,gear,armed,shielded,walking=false,animated=true,combatant=false,preview=false}:{classId:ClassId;race:Race;skin:string;hair?:string;hairStyle?:number;body?:number;showHelmet?:boolean;gear:HeroGear;armed:boolean;shielded:boolean;walking?:boolean;animated?:boolean;combatant?:boolean;preview?:boolean}){
 const style=HERO_STYLE[classId],gltf=useGLTF(heroModelUrl(style.base));
 const eventTime=useGame(s=>combatant?s.battleEvent?.time??0:0);
 const dress=heroDress(classId,gear,hairStyle,showHelmet),{outfit,hat,cape,head}=dress;
 const {scene,host}=useMemo(()=>{
  const model=clone(gltf.scene) as THREE.Group,show=new Set([...(armed?style.weapon:[]),...(shielded?style.offhand:[])]),parts=HERO_PARTS[style.base];let host:THREE.SkinnedMesh|null=null;
  model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.castShadow=true;o.receiveShadow=!preview;
   const weapon=(HERO_WEAPON_MESHES as readonly string[]).includes(o.name);
   if(weapon)o.visible=show.has(o.name);
   else if(HERO_HAT_MESHES.includes(o.name))o.visible=o.name===hat;
   else if(o.name===parts.cape)o.visible=cape;
   if(!(o.material instanceof THREE.MeshStandardMaterial))return;
   if(o.name===parts.head){if(o instanceof THREE.SkinnedMesh)host=o;o.visible=head===style.base;o.material=recolored(o.material,`${style.base}|${classId}|${skin}|head|${hair}`,classId,skin,{hair:{base:style.base,color:hair}});}
   else{const rags=outfit==='rags'&&!weapon;o.material=recolored(o.material,`${style.base}|${classId}|${skin}|${rags?'rags':'class'}`,classId,skin,{rags});}});
  const box=new THREE.Box3().setFromObject(model),height=Math.max(.01,box.max.y-box.min.y),form=heroProportions(race),width=form.width*(BODY_WIDTH[body]??1),scale=HUMAN_HEIGHT*form.height/height;
  model.scale.set(scale*width,scale,scale*width);model.position.y=-box.min.y*scale;
  return {scene:model,host};
 },[gltf.scene,style,classId,race,skin,hair,body,armed,shielded,preview,outfit,hat,cape,head]);
 const idle=armed?style.idle:'Idle',move=walking?HERO_WALK:idle,attack=armed||CASTERS.has(classId)?style.attack:HERO_PUNCH;
 return <group><Rig key={scene.uuid} scene={scene} clips={gltf.animations} move={move} walking={walking} animated={animated} attack={attack} eventTime={eventTime}/>{host&&head!==style.base&&<Suspense fallback={null}><ForeignHead from={head} host={host} classId={classId} skin={skin} hair={hair}/></Suspense>}</group>;
}

/** Animações presas a uma montagem do modelo; trocar roupa ou arma cria uma montagem nova (sem pose em T). */
function Rig({scene,clips,move,walking,animated,attack,eventTime}:{scene:THREE.Group;clips:THREE.AnimationClip[];move:string;walking:boolean;animated:boolean;attack:string;eventTime:number}){
 const root=useRef<THREE.Group>(null),first=useRef(true),{actions,mixer}=useAnimations(clips,root);
 useEffect(()=>()=>{scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();});mixer.stopAllAction();mixer.uncacheRoot(scene);},[scene,mixer]);
 // Antes do primeiro quadro: aplica a pose de descanso para não piscar a pose em T.
 useLayoutEffect(()=>{const action=actions[move]??actions.Idle;if(!action)return;action.reset().setEffectiveTimeScale(animated?(walking?1.35:1):0).fadeIn(animated&&!first.current?.18:0).play();mixer.update(0);first.current=false;return()=>{action.fadeOut(.18);};},[actions,mixer,move,walking,animated]);
 useEffect(()=>{if(!eventTime||!animated)return;const action=actions[attack];if(!action)return;
  action.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).fadeIn(.08).play();
  const timer=setTimeout(()=>action.fadeOut(.2),Math.max(250,action.getClip().duration*1000-200));return()=>clearTimeout(timer);
 },[eventTime,actions,attack,animated]);
 return <group ref={root}><primitive object={scene}/></group>;
}
