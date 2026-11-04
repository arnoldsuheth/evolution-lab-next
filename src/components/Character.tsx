"use client";
import {useEffect,useMemo,useRef} from 'react';
import {createPortal,useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {CLASSES,ITEMS,HAIR,EYES,type ClassId,type Look,type Race} from '@/lib/game';
import {activeEquipment} from '@/lib/equipment';
import {buildAvatar,disposeAvatar} from '@/lib/avatarMesh';
import EquipmentVisual,{rarityTone} from './EquipmentVisual';
export default function Character({classId,look,equipped=[],walking=false,animated=true,preview=false,skinOverride,level=1,race:selectedRace}:{classId:ClassId;look:Look;equipped?:string[];walking?:boolean;animated?:boolean;preview?:boolean;skinOverride?:string;level?:number;race?:Race}){
 const race=selectedRace??CLASSES[classId].race,phase=useRef(0);
 const equipmentKey=equipped.join('|');
 const gear=useMemo(()=>activeEquipment({classId,level,dead:false,equipped:equipmentKey.split('|').filter(Boolean)},ITEMS),[classId,level,equipmentKey]);
 const chest=gear.find(i=>i.slot==='chest'),weapon=gear.find(i=>i.slot==='weapon'||i.slot==='twohand'),offhand=gear.find(i=>i.slot==='offhand');
 const accent=chest?rarityTone(chest.rarity):CLASSES[classId].color;
 const cloth=['#756e59','#58676a','#795d58','#5c6b52','#655e74','#8a7d62'][look.cloth]??'#756e59';
 const armorColors:Record<string,string>={Pesada:'#79858d',Leve:'#66705e',Couro:'#705f4c',Reforçada:'#727c77',Tecido:CLASSES[classId].color};
 const torsoColor=chest?armorColors[chest.armor??'']??cloth:cloth;
 const avatarRef=useRef<THREE.Group>(null);
 const lookKey=JSON.stringify(look),gearKey=gear.map(i=>i.slot).join(',');
 const avatar=useMemo(()=>{const selectedLook=JSON.parse(lookKey) as Look,slots=new Set(gearKey.split(','));return buildAvatar({race,look:selectedLook,hairColor:HAIR[selectedLook.hairColor]??HAIR[0],eyeColor:EYES[selectedLook.eyes]??EYES[0],clothColor:torsoColor,accent,skinOverride,gear:{chest:slots.has('chest'),head:slots.has('head'),shoulders:slots.has('shoulders'),hands:slots.has('hands'),legs:slots.has('legs'),feet:slots.has('feet'),back:slots.has('back')}});},[race,lookKey,gearKey,torsoColor,accent,skinOverride]);
 useEffect(()=>()=>disposeAvatar(avatar),[avatar]);
 useFrame((_,delta)=>{const model=avatarRef.current;if(!animated||!model)return;phase.current+=Math.min(delta,.05)*(walking?8:1.6);const a=walking?Math.sin(phase.current)*.42:0;for(const [name,sign]of [['legLeft',1],['legRight',-1],['armLeft',-.6],['armRight',.6]] as const){const joint=model.getObjectByName(name);if(joint)joint.rotation.x=a*sign;}model.position.y=walking?Math.abs(Math.sin(phase.current))*.025:Math.sin(phase.current)*.006;});
 return <group scale={preview?1:.74}><primitive object={avatar} ref={avatarRef}/>{weapon&&createPortal(<EquipmentVisual visual={weapon.visual} tone={rarityTone(weapon.rarity)}/>,avatar.getObjectByName('weaponAnchor')!)}{offhand&&createPortal(<EquipmentVisual visual={offhand.visual} tone={rarityTone(offhand.rarity)} small={offhand.visual==='dagger'}/>,avatar.getObjectByName('offhandAnchor')!)}{preview&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}><ringGeometry args={[.75,.763,64]}/><meshBasicMaterial color={accent} transparent opacity={.5}/></mesh>}</group>;
}
