"use client";
import {Suspense,useEffect,useLayoutEffect,useMemo,useRef} from 'react';
import {useGLTF,useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {ClassId,Race} from '@/lib/game';
import {BODY_WIDTH,HERO_BASE_FILES,HERO_HAT_MESHES,HERO_HIT,HERO_PARTS,HERO_PUNCH,HERO_STYLE,HERO_WALK,HERO_WEAPON_MESHES,heroDress,heroProportions,recolorAtlas,type HeroBase,type HeroGear,type RecolorOptions} from '@/lib/heroModels';
import {useGame} from '@/lib/store';
import {buildFaceKit,RACE_HEAD,type FaceOptions} from '@/lib/faceKit';
import {gearLook} from '@/lib/gearPieces';
import {attachGearPieces,GearAura} from './GearPieces';

const base=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export const heroModelUrl=(model:HeroBase)=>`${base}/models/heroes/${HERO_BASE_FILES[model]}`;
/** Altura do herói no mesmo referencial do avatar procedural (antes da escala .74 do mundo). */
const HUMAN_HEIGHT=3;
/** Ossos que definem as pernas compactas do anão. */
const COMPACT_LEGS = new Set(["upperleg.l", "upperleg.r", "lowerleg.l", "lowerleg.r"]);
const NOT_BODY=(name:string)=>HERO_HAT_MESHES.includes(name)||(HERO_WEAPON_MESHES as readonly string[]).includes(name)||name.endsWith('_Cape');
const NO_FACE:FaceOptions['look']={beard:0,moustache:0,brows:0,nose:0,ears:0,scar:0,tattoo:0,accessory:0};
/** As animações fixam a escala da cabeça em 1; sem essa trilha, a cabeça maior do gnomo e do anão é preservada. */
const clipCache=new WeakMap<THREE.AnimationClip[],THREE.AnimationClip[]>();
function headFreeClips(clips:THREE.AnimationClip[]){let out=clipCache.get(clips);if(!out){out=clips.map(c=>{const k=c.clone();k.tracks=k.tracks.filter(t=>t.name!=='head.scale'&&!Array.from(COMPACT_LEGS).some(name=>t.name===name+'.scale'));return k;});clipCache.set(clips,out);}return out;}
const CASTERS=new Set<ClassId>(['mage','prophet','shaman']);
const materials=new Map<string,THREE.Material>();
/** Arma Épica brilha em lilás; Mítica, em dourado. */
const GLOW:Record<string,string>={'Épico':'#9b6bff','Mítico':'#ffc23a'};
function glowing(source:THREE.Material,rarity:string){const color=GLOW[rarity];if(!color||!(source instanceof THREE.MeshStandardMaterial))return source;const key=source.uuid+'|glow|'+rarity;let m=materials.get(key);if(!m){const g=source.clone();g.emissive=new THREE.Color(color);g.emissiveIntensity=rarity==='Mítico'?.9:.6;m=g;materials.set(key,m);}return m;}

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
function ForeignHead({from,host,classId,skin,hair,eyes}:{from:HeroBase;host:THREE.SkinnedMesh;classId:ClassId;skin:string;hair:string;eyes?:string}){
 const gltf=useGLTF(heroModelUrl(from));
 useLayoutEffect(()=>{
  let source:THREE.SkinnedMesh|undefined;gltf.scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh&&o.name===HERO_PARTS[from].head)source=o;});
  const parent=host.parent;if(!source||!parent)return;
  const material=source.material instanceof THREE.MeshStandardMaterial?recolored(source.material,`${from}|${classId}|${skin}|head|${hair}|${eyes}`,classId,skin,{hair:{base:from,color:hair},eyes}):source.material;
  const head=new THREE.SkinnedMesh(source.geometry,material);head.name='foreign-head';head.castShadow=true;
  head.position.copy(host.position);head.quaternion.copy(host.quaternion);head.scale.copy(host.scale);
  head.bind(host.skeleton,source.bindMatrix);parent.add(head);
  return()=>{head.removeFromParent();};
 },[gltf.scene,from,host,classId,skin,hair,eyes]);
 return null;
}

export default function HeroModel({classId,race,skin,hair='#825235',eyes,hairStyle=0,body:bodyShape=2,face=NO_FACE,showHelmet=true,weaponRarity='Comum',gearItems=[],gear,armed,shielded,walking=false,animated=true,combatant=false,preview=false}:{classId:ClassId;race:Race;skin:string;hair?:string;eyes?:string;hairStyle?:number;body?:number;face?:FaceOptions['look'];showHelmet?:boolean;weaponRarity?:string;gearItems?:{slot:string;rarity:string}[];gear:HeroGear;armed:boolean;shielded:boolean;walking?:boolean;animated?:boolean;combatant?:boolean;preview?:boolean}){
 const style=HERO_STYLE[classId],gltf=useGLTF(heroModelUrl(style.base));
 const eventTime=useGame(s=>combatant?s.battleEvent?.time??0:0),hurtTime=useGame(s=>combatant&&s.battleEvent?.received?s.battleEvent.time:0);
 const gearKey=gearItems.map(i=>`${i.slot}:${i.rarity}`).join('|'),equipmentLook=useMemo(()=>gearLook(gearKey?gearKey.split('|').map(e=>{const [slot,rarity]=e.split(':');return {slot,rarity};}):[]),[gearKey]);
 const dress=heroDress(classId,gear,hairStyle,showHelmet),{outfit,hat,cape,head,extra,covered}=dress,faceKey=JSON.stringify(face);
 const {scene,host}=useMemo(()=>{
  const model=clone(gltf.scene) as THREE.Group,show=new Set([...(armed?style.weapon:[]),...(shielded?style.offhand:[])]),parts=HERO_PARTS[style.base];let host:THREE.SkinnedMesh|null=null;
  model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.castShadow=true;o.receiveShadow=!preview;
   const weapon=(HERO_WEAPON_MESHES as readonly string[]).includes(o.name);
   if(weapon)o.visible=show.has(o.name);
   else if(HERO_HAT_MESHES.includes(o.name))o.visible=o.name===hat;
   else if(o.name===parts.cape)o.visible=cape;
   if(!(o.material instanceof THREE.MeshStandardMaterial))return;
   if(o.name===parts.head){if(o instanceof THREE.SkinnedMesh)host=o;o.visible=head===style.base;o.material=recolored(o.material,`${style.base}|${classId}|${skin}|head|${hair}|${eyes}`,classId,skin,{hair:{base:style.base,color:hair},eyes});}
   else{const rags=outfit==='rags'&&!weapon;o.material=recolored(o.material,`${style.base}|${classId}|${skin}|${rags?'rags':'class'}`,classId,skin,{rags});if(weapon&&o.visible)o.material=glowing(o.material,weaponRarity);}});
  // Peças de rosto presas ao osso da cabeça, no mesmo referencial em que a malha foi modelada.
  const headBone=host?(host as THREE.SkinnedMesh).skeleton.bones.find(b=>b.name==='head'):undefined;
  if(host&&headBone){const skeleton=(host as THREE.SkinnedMesh).skeleton,index=skeleton.bones.indexOf(headBone),kit=buildFaceKit({look:JSON.parse(faceKey),race,covered,extra,hair,skin});
   const anchor=new THREE.Group();anchor.name='face-anchor';anchor.matrixAutoUpdate=false;anchor.matrix.copy(skeleton.boneInverses[index]);anchor.add(kit);headBone.add(anchor);
   headBone.scale.setScalar(RACE_HEAD[race]??1);}
  if(race==='dwarf')model.traverse(node=>{if(node instanceof THREE.Bone&&COMPACT_LEGS.has(node.name))node.scale.y*=.78;});
  model.updateMatrixWorld(true);
  model.traverse(node=>{if(node instanceof THREE.SkinnedMesh)node.skeleton.update();});
  const body=new THREE.Box3();model.updateMatrixWorld(true);model.traverse(o=>{if(o instanceof THREE.Mesh&&!NOT_BODY(o.name)){if(o instanceof THREE.SkinnedMesh)o.computeBoundingBox();body.expandByObject(o);}});
  const form=heroProportions(race),width=form.width*(BODY_WIDTH[bodyShape]??1),scale=HUMAN_HEIGHT*form.height/Math.max(.01,body.max.y-body.min.y);
  model.scale.set(scale*width,scale,scale*width);model.position.y=-(body.isEmpty()?0:body.min.y)*scale;
  attachGearPieces(model,equipmentLook.slots);
  return {scene:model,host};
 },[equipmentLook,gltf.scene,style,classId,race,skin,hair,eyes,bodyShape,armed,shielded,preview,outfit,hat,cape,head,extra,covered,faceKey,weaponRarity]);
 const idle=armed?style.idle:'Idle',move=walking?HERO_WALK:idle,attack=armed||CASTERS.has(classId)?style.attack:HERO_PUNCH;
 return <group><GearAura tier={equipmentLook.best} animated={animated}/><Rig key={scene.uuid} scene={scene} clips={headFreeClips(gltf.animations)} move={move} walking={walking} animated={animated} attack={attack} eventTime={eventTime} hurtTime={hurtTime}/>{host&&head!==style.base&&<Suspense fallback={null}><ForeignHead from={head} host={host} classId={classId} skin={skin} hair={hair} eyes={eyes}/></Suspense>}</group>;
}

/** Animações presas a uma montagem do modelo; trocar roupa ou arma cria uma montagem nova (sem pose em T). */
function Rig({scene,clips,move,walking,animated,attack,eventTime,hurtTime=0}:{scene:THREE.Group;clips:THREE.AnimationClip[];move:string;walking:boolean;animated:boolean;attack:string;eventTime:number;hurtTime?:number}){
 const root=useRef<THREE.Group>(null),first=useRef(true),{actions,mixer}=useAnimations(clips,root);
 useEffect(()=>()=>{scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();});mixer.stopAllAction();mixer.uncacheRoot(scene);},[scene,mixer]);
 // Antes do primeiro quadro: aplica a pose de descanso para não piscar a pose em T.
 useLayoutEffect(()=>{const action=actions[move]??actions.Idle;if(!action)return;action.reset().setEffectiveTimeScale(animated?(walking?1.35:1):0).fadeIn(animated&&!first.current?.18:0).play();mixer.update(0);first.current=false;return()=>{action.fadeOut(.18);};},[actions,mixer,move,walking,animated]);
 useEffect(()=>{if(!eventTime||!animated)return;const action=actions[attack];if(!action)return;
  action.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).fadeIn(.08).play();
  const timer=setTimeout(()=>action.fadeOut(.2),Math.max(250,action.getClip().duration*1000-200));return()=>clearTimeout(timer);
 },[eventTime,actions,attack,animated]);
 // Levou golpe: depois do próprio ataque, o herói recua (animação de impacto).
 useEffect(()=>{if(!hurtTime||!animated)return;const action=actions[HERO_HIT];if(!action)return;const start=setTimeout(()=>{action.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).fadeIn(.06).play();},420);const stop=setTimeout(()=>action.fadeOut(.2),420+Math.max(200,action.getClip().duration*1000-150));return()=>{clearTimeout(start);clearTimeout(stop);};},[hurtTime,actions,animated]);
 return <group ref={root}><primitive object={scene}/></group>;
}
