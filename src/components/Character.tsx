"use client";
import {Component,Suspense,useEffect,useMemo,useRef,type ReactNode} from 'react';
import type * as THREE from 'three';
import {createPortal,useFrame} from '@react-three/fiber';
import {CLASSES,ITEMS,HAIR,EYES,type ClassId,type Look,type Race} from '@/lib/game';
import {activeEquipment} from '@/lib/equipment';
import {buildCartoonAvatar} from '@/lib/cartoonAvatar';
import {CLASS_STYLE} from '@/lib/cartoonAvatar';
import {buildAvatar,disposeAvatar} from '@/lib/avatarMesh';
import {useGame} from '@/lib/store';
import EquipmentVisual,{rarityTone} from './EquipmentVisual';
import HeroModel from './HeroModel';
import KingdomHero,{CLASS_LOOK,kingdomWeapon} from './KingdomHero';
import {gradeOf,gradeInfo} from '@/lib/grades';
import {skinColor} from '@/lib/visual';
function ProceduralCharacter({classId,look,equipped=[],walking=false,animated=true,preview=false,skinOverride,level=1,race:selectedRace,combatant=false,organic=false}:{classId:ClassId;look:Look;equipped?:string[];walking?:boolean;animated?:boolean;preview?:boolean;skinOverride?:string;level?:number;race?:Race;combatant?:boolean;organic?:boolean;fullGear?:boolean;celestial?:boolean}){
 const race=selectedRace??CLASSES[classId].race,modelRef=useRef<THREE.Group>(null),phase=useRef(0),event=useGame(s=>combatant?s.battleEvent:null);
 const equipmentKey=equipped.join('|'),lookKey=JSON.stringify(look);
 const gear=useMemo(()=>activeEquipment({classId,level,dead:false,equipped:equipmentKey.split('|').filter(Boolean)},ITEMS),[classId,level,equipmentKey]);
 const weapon=gear.find(i=>i.slot==='weapon'||i.slot==='twohand'),offhand=gear.find(i=>i.slot==='offhand');
 const bow=weapon?.visual==='bow';
 const gearKey=gear.map(i=>i.slot).join(',');
 const avatar=useMemo(()=>{const selectedLook=JSON.parse(lookKey) as Look;if(organic)return buildAvatar({race,look:selectedLook,hairColor:HAIR[selectedLook.hairColor]??HAIR[0],eyeColor:EYES[selectedLook.eyes]??EYES[0],clothColor:CLASS_STYLE[classId].cloth,accent:CLASS_STYLE[classId].trim,skinOverride,gear:Object.fromEntries(gearKey.split(",").map(k=>[k,true]))});return buildCartoonAvatar({race,classId,look:selectedLook,hairColor:HAIR[selectedLook.hairColor]??HAIR[0],eyeColor:EYES[selectedLook.eyes]??EYES[0],skinOverride,gear:new Set(gearKey.split(','))});},[race,classId,lookKey,gearKey,skinOverride,organic]);
 const rig=useMemo(()=>({head:avatar.getObjectByName('head'),legs:[avatar.getObjectByName('legLeft'),avatar.getObjectByName('legRight')],arms:[avatar.getObjectByName('armLeft'),avatar.getObjectByName('armRight')],weapon:avatar.getObjectByName('weaponAnchor')!,offhand:avatar.getObjectByName('offhandAnchor')!}),[avatar]);
 useEffect(()=>()=>disposeAvatar(avatar),[avatar]);
 useFrame((_,delta)=>{const model=modelRef.current;if(!animated||!model)return;const joints={head:model.getObjectByName('head'),legs:[model.getObjectByName('legLeft'),model.getObjectByName('legRight')],arms:[model.getObjectByName('armLeft'),model.getObjectByName('armRight')]};phase.current+=Math.min(delta,.05)*(walking?9:1.8);const p=phase.current,a=walking?Math.sin(p)*.65:Math.sin(p)*.045,age=event?(Date.now()-event.time)/1000:2,swing=age<.55?Math.sin(age/.55*Math.PI):0;
 joints.legs.forEach((joint,i)=>{if(joint)joint.rotation.x=a*(i?1:-1);});joints.arms.forEach((joint,i)=>{if(joint){const activity=!combatant&&!preview&&!walking?(classId==='engineer'&&i===1?-.45+Math.sin(p*1.8)*.3:classId==='mage'&&i===0?-.35+Math.sin(p)*.12:0):0;joint.rotation.x=a*(i?-.65:.65)-swing*(bow?(i?.78:1.4):(i?1.4:.4))+activity;joint.rotation.z=(i?1:-1)*(.12+Math.sin(p*.6)*.035+swing*.15);}});
 if(joints.head){joints.head.rotation.y=walking?Math.sin(p*.5)*.035:Math.sin(p*.33)*.12;joints.head.rotation.z=Math.sin(p*.65)*.022;}
 model.position.y=walking?Math.abs(Math.sin(p))*.055:Math.sin(p)*.016;model.rotation.z=walking?Math.sin(p)*.025:0;});
 return <group scale={preview?1:.74}><primitive object={avatar} ref={modelRef}/>{weapon&&createPortal(<group rotation={[0,bow?-Math.PI/2:0,0]}><EquipmentVisual visual={weapon.visual} tone={rarityTone(weapon.rarity)}/></group>,bow?rig.offhand:rig.weapon)}{offhand&&createPortal(<EquipmentVisual visual={offhand.visual} tone={rarityTone(offhand.rarity)} small={offhand.visual==='dagger'}/>,rig.offhand)}{preview&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}><ringGeometry args={[.8,.82,48]}/><meshBasicMaterial color={CLASSES[classId].color} transparent opacity={.5}/></mesh>}</group>;
}

type CharacterProps=Parameters<typeof ProceduralCharacter>[0];
/** Se um modelo animado não carregar, o boneco procedural continua disponível. */
class ModelBoundary extends Component<{fallback:ReactNode;children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return{failed:true};}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
export default function Character(props:CharacterProps){
 const {classId,look,equipped=[],level=1,race:selectedRace,skinOverride,organic=false,preview=false}=props;
 const race=selectedRace??CLASSES[classId].race,equipmentKey=equipped.join('|');
 const gear=useMemo(()=>activeEquipment({classId,level,dead:false,equipped:equipmentKey.split('|').filter(Boolean)},ITEMS),[classId,level,equipmentKey]);
 const classic=useGame(s=>!!s.settings.classicCharacters);
 if(organic)return <ProceduralCharacter {...props}/>;
 const fallback=<ProceduralCharacter {...props} organic/>;
 if(!classic){
  const cl=CLASS_LOOK[classId],female=look.gender===1,weapon=gear.find(i=>i.slot==='weapon'||i.slot==='twohand'),off=gear.find(i=>i.slot==='offhand');
  const showArms=!!weapon||!!props.fullGear,showOff=!!off||!!props.fullGear;
  let right=showArms?kingdomWeapon(weapon?.visual)??cl.right??null:null,left=showOff?kingdomWeapon(off?.visual)??cl.left??null:null;
  if(right==='bow'){left=right;right=null;}
  const rank={D:0,C:1,B:2,A:3,S:4} as const,grades=gear.map(i=>gradeOf(i)).filter((g):g is NonNullable<typeof g>=>!!g);
  const top=grades.sort((a,b)=>rank[b]-rank[a])[0],tier=top==='S'?2:top==='A'||top==='B'?1:0;
  const hairStyle=female?[2,3,4,2,3][look.hair%5]:[0,1,0,1,1][look.hair%5];
  return <ModelBoundary fallback={fallback}><Suspense fallback={null}><KingdomHero classId={classId} race={race} female={female} skin={skinOverride??skinColor(race,look.skin)} hair={HAIR[look.hairColor]??HAIR[1]} hairStyle={hairStyle} beard={!female&&(look.beard>0||race==='dwarf')} right={right} left={left} tier={props.fullGear&&!top?1:tier as 0|1|2} glow={top&&rank[top]>=2?gradeInfo(top).color:null} walking={props.walking} animated={props.animated} combatant={props.combatant} halo={props.celestial}/></Suspense></ModelBoundary>;
 }
 const armed=gear.some(i=>i.slot==='weapon'||i.slot==='twohand'),shielded=gear.some(i=>i.slot==='offhand');
 const worn={head:gear.some(i=>i.slot==='head'),chest:gear.some(i=>i.slot==='chest'),back:gear.some(i=>i.slot==='back')},dressed=props.fullGear?{head:true,chest:true,back:true}:worn;
 return <ModelBoundary fallback={fallback}><Suspense fallback={null}><group scale={preview?1:.74}><HeroModel classId={classId} race={race} skin={skinOverride??skinColor(race,look.skin)} hair={HAIR[look.hairColor]??HAIR[1]} eyes={props.celestial?'#7fe8ff':look.eyes>0?EYES[look.eyes]:undefined} celestial={props.celestial} hairStyle={look.gender===1&&look.hair===0?(race==='dwarf'?3:2):look.hair} feminine={look.gender===1} face={{face:look.face,beard:look.beard,moustache:look.moustache,brows:look.brows,nose:look.nose,ears:look.ears??0,scar:look.scar,tattoo:look.tattoo,accessory:look.accessory}} body={look.body} showHelmet={look.helmet!==0} weaponRarity={gear.find(i=>i.slot==='weapon'||i.slot==='twohand')?.rarity} gearItems={gear} gear={dressed} armed={armed||!!props.fullGear} shielded={shielded||!!props.fullGear} walking={props.walking} animated={props.animated} combatant={props.combatant} preview={preview}/>{preview&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}><ringGeometry args={[.8,.82,48]}/><meshBasicMaterial color={CLASSES[classId].color} transparent opacity={.5}/></mesh>}</group></Suspense></ModelBoundary>;
}
