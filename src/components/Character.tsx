"use client";
import {useEffect,useMemo,useRef} from 'react';
import type * as THREE from 'three';
import {createPortal,useFrame} from '@react-three/fiber';
import {CLASSES,ITEMS,HAIR,EYES,type ClassId,type Look,type Race} from '@/lib/game';
import {activeEquipment} from '@/lib/equipment';
import {buildCartoonAvatar} from '@/lib/cartoonAvatar';
import {CLASS_STYLE} from '@/lib/cartoonAvatar';
import {buildAvatar,disposeAvatar} from '@/lib/avatarMesh';
import {useGame} from '@/lib/store';
import EquipmentVisual,{rarityTone} from './EquipmentVisual';
export default function Character({classId,look,equipped=[],walking=false,animated=true,preview=false,skinOverride,level=1,race:selectedRace,combatant=false,organic=false}:{classId:ClassId;look:Look;equipped?:string[];walking?:boolean;animated?:boolean;preview?:boolean;skinOverride?:string;level?:number;race?:Race;combatant?:boolean;organic?:boolean}){
 const race=selectedRace??CLASSES[classId].race,modelRef=useRef<THREE.Group>(null),phase=useRef(0),event=useGame(s=>combatant?s.battleEvent:null);
 const equipmentKey=equipped.join('|'),lookKey=JSON.stringify(look);
 const gear=useMemo(()=>activeEquipment({classId,level,dead:false,equipped:equipmentKey.split('|').filter(Boolean)},ITEMS),[classId,level,equipmentKey]);
 const weapon=gear.find(i=>i.slot==='weapon'||i.slot==='twohand'),offhand=gear.find(i=>i.slot==='offhand');
 const gearKey=gear.map(i=>i.slot).join(',');
 const avatar=useMemo(()=>{const selectedLook=JSON.parse(lookKey) as Look;if(organic)return buildAvatar({race,look:selectedLook,hairColor:HAIR[selectedLook.hairColor]??HAIR[0],eyeColor:EYES[selectedLook.eyes]??EYES[0],clothColor:CLASS_STYLE[classId].cloth,accent:CLASS_STYLE[classId].trim,skinOverride,gear:Object.fromEntries(gearKey.split(",").map(k=>[k,true]))});return buildCartoonAvatar({race,classId,look:selectedLook,hairColor:HAIR[selectedLook.hairColor]??HAIR[0],eyeColor:EYES[selectedLook.eyes]??EYES[0],skinOverride,gear:new Set(gearKey.split(','))});},[race,classId,lookKey,gearKey,skinOverride,organic]);
 const rig=useMemo(()=>({head:avatar.getObjectByName('head'),legs:[avatar.getObjectByName('legLeft'),avatar.getObjectByName('legRight')],arms:[avatar.getObjectByName('armLeft'),avatar.getObjectByName('armRight')],weapon:avatar.getObjectByName('weaponAnchor')!,offhand:avatar.getObjectByName('offhandAnchor')!}),[avatar]);
 useEffect(()=>()=>disposeAvatar(avatar),[avatar]);
 useFrame((_,delta)=>{const model=modelRef.current;if(!animated||!model)return;const joints={head:model.getObjectByName('head'),legs:[model.getObjectByName('legLeft'),model.getObjectByName('legRight')],arms:[model.getObjectByName('armLeft'),model.getObjectByName('armRight')]};phase.current+=Math.min(delta,.05)*(walking?9:1.8);const p=phase.current,a=walking?Math.sin(p)*.65:Math.sin(p)*.045,age=event?(Date.now()-event.time)/1000:2,swing=age<.55?Math.sin(age/.55*Math.PI):0;
 joints.legs.forEach((joint,i)=>{if(joint)joint.rotation.x=a*(i?1:-1);});joints.arms.forEach((joint,i)=>{if(joint){const activity=!combatant&&!preview&&!walking?(classId==='engineer'&&i===1?-.45+Math.sin(p*1.8)*.3:classId==='mage'&&i===0?-.35+Math.sin(p)*.12:0):0;joint.rotation.x=a*(i?-.65:.65)-swing*(i?1.4:.4)+activity;joint.rotation.z=(i?1:-1)*(.12+Math.sin(p*.6)*.035+swing*.15);}});
 if(joints.head){joints.head.rotation.y=walking?Math.sin(p*.5)*.035:Math.sin(p*.33)*.12;joints.head.rotation.z=Math.sin(p*.65)*.022;}
 model.position.y=walking?Math.abs(Math.sin(p))*.055:Math.sin(p)*.016;model.rotation.z=walking?Math.sin(p)*.025:0;});
 return <group scale={preview?1:.74}><primitive object={avatar} ref={modelRef}/>{weapon&&createPortal(<EquipmentVisual visual={weapon.visual} tone={rarityTone(weapon.rarity)}/>,rig.weapon)}{offhand&&createPortal(<EquipmentVisual visual={offhand.visual} tone={rarityTone(offhand.rarity)} small={offhand.visual==='dagger'}/>,rig.offhand)}{preview&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}><ringGeometry args={[.8,.82,48]}/><meshBasicMaterial color={CLASSES[classId].color} transparent opacity={.5}/></mesh>}</group>;
}
