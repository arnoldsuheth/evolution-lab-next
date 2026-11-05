"use client";
import {useEffect,useMemo,useRef} from 'react';
import {useGLTF,useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {ClassId,Race} from '@/lib/game';
import {HERO_BASE_FILES,HERO_STYLE,HERO_WEAPON_MESHES,heroProportions,recolorAtlas,type HeroBase} from '@/lib/heroModels';
import {useGame} from '@/lib/store';

const base=process.env.NEXT_PUBLIC_GITHUB_PAGES==='true'?'/evolution-lab-next':'';
export const heroModelUrl=(model:HeroBase)=>`${base}/models/heroes/${HERO_BASE_FILES[model]}`;
/** Altura do herói no mesmo referencial do avatar procedural (antes da escala .74 do mundo). */
const HUMAN_HEIGHT=3;
const CASTERS=new Set<ClassId>(['mage','prophet','shaman']);
const materials=new Map<string,THREE.Material>();

function recolored(source:THREE.MeshStandardMaterial,key:string,classId:ClassId,skin:string){
 const cached=materials.get(key);if(cached)return cached;
 const image=source.map?.image as CanvasImageSource&{width:number;height:number}|undefined;
 if(!image||typeof document==='undefined')return source;
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return source;
 context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height);
 recolorAtlas(pixels.data,HERO_STYLE[classId],skin);context.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const material=source.clone();material.map=texture;material.needsUpdate=true;materials.set(key,material);return material;
}

export default function HeroModel({classId,race,skin,armed,shielded,walking=false,animated=true,combatant=false,preview=false}:{classId:ClassId;race:Race;skin:string;armed:boolean;shielded:boolean;walking?:boolean;animated?:boolean;combatant?:boolean;preview?:boolean}){
 const style=HERO_STYLE[classId],gltf=useGLTF(heroModelUrl(style.base)),root=useRef<THREE.Group>(null);
 const eventTime=useGame(s=>combatant?s.battleEvent?.time??0:0);
 const scene=useMemo(()=>{
  const model=clone(gltf.scene) as THREE.Group,show=new Set([...(armed?style.weapon:[]),...(shielded?style.offhand:[])]);
  model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.castShadow=true;o.receiveShadow=!preview;
   if((HERO_WEAPON_MESHES as readonly string[]).includes(o.name)){o.visible=show.has(o.name);return;}
   if(style.hide.includes(o.name)){o.visible=false;return;}
   if(o.material instanceof THREE.MeshStandardMaterial)o.material=recolored(o.material,`${style.base}|${classId}|${skin}`,classId,skin);});
  const box=new THREE.Box3().setFromObject(model),height=Math.max(.01,box.max.y-box.min.y),form=heroProportions(race),scale=HUMAN_HEIGHT*form.height/height;
  model.scale.set(scale*form.width,scale,scale*form.width);model.position.y=-box.min.y*scale;
  return model;
 },[gltf.scene,style,classId,race,skin,armed,shielded,preview]);
 const {actions,mixer}=useAnimations(gltf.animations,root);
 const idle=armed?style.idle:'Idle',move=walking?'Walking_A':idle;
 useEffect(()=>()=>{scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();});mixer.uncacheRoot(scene);},[scene,mixer]);
 useEffect(()=>{const action=actions[move]??actions.Idle;if(!action)return;action.reset().setEffectiveTimeScale(animated?(walking?1.35:1):0).fadeIn(animated?.18:0).play();return()=>{action.fadeOut(.18);};},[actions,move,walking,animated]);
 useEffect(()=>{if(!eventTime||!animated)return;const name=armed||CASTERS.has(classId)?style.attack:'Unarmed_Melee_Attack_Punch_A',action=actions[name];if(!action)return;
  action.reset().setLoop(THREE.LoopOnce,1).setEffectiveWeight(1).fadeIn(.08).play();
  const timer=setTimeout(()=>action.fadeOut(.2),Math.max(250,action.getClip().duration*1000-200));return()=>clearTimeout(timer);
 },[eventTime,actions,armed,classId,style.attack,animated]);
 return <group ref={root}><primitive object={scene}/></group>;
}
