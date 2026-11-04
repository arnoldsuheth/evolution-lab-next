"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLASSES, ITEMS, HAIR, EYES, type ClassId, type Look, type Race } from "@/lib/game";

import { RACE_FORM, skinColor } from "@/lib/visual";
import EquipmentVisual, { rarityTone } from "./EquipmentVisual";
import { activeEquipment } from "@/lib/equipment";
import { BODY_TRAITS, FACE_TRAITS, NOSE_TRAITS } from "@/lib/characterTraits";
import { bodyGeometry } from "@/lib/bodyGeometry";
import { skinGeometry } from "@/lib/skinGeometry";

type V3 = [number, number, number];
function Part({ position = [0, 0, 0], scale = [1, 1, 1], color, shape = "sphere", metal = false, rotation = [0, 0, 0] }: { position?: V3; scale?: V3; color: string; shape?: string; metal?: boolean; rotation?: V3 }) {
  const geometry = useMemo(() => bodyGeometry(shape), [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} scale={scale} rotation={rotation} geometry={geometry} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={metal ? 0.4 : 0.85} metalness={metal ? 0.55 : 0} />
  </mesh>;
}
function SkinPart({ position = [0,0,0], scale = [1,1,1], color, shape = "sphere", rotation = [0,0,0] }: { position?: V3; scale?: V3; color: string; shape?: string; rotation?: V3 }) {
  const geometry = useMemo(() => skinGeometry(color,shape), [color,shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} scale={scale} rotation={rotation} geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={0.94} metalness={0} /></mesh>;
}
export default function Character({ classId, look, equipped = [], walking = false, animated = true, preview = false, skinOverride, level=1, race: selectedRace }: { classId: ClassId; look: Look; equipped?: string[]; walking?: boolean; animated?: boolean; preview?: boolean; skinOverride?: string; level?: number; race?: Race }) {
  const root = useRef<THREE.Group>(null); const left = useRef<THREE.Group>(null); const right = useRef<THREE.Group>(null); const armL = useRef<THREE.Group>(null); const armR = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const race = selectedRace ?? CLASSES[classId].race;
  const physique=BODY_TRAITS[look.body]??BODY_TRAITS[1],face=FACE_TRAITS[look.face]??FACE_TRAITS[0],nose=NOSE_TRAITS[look.nose]??NOSE_TRAITS[0];
  const form = RACE_FORM[race];
  const body = 1;
  const scale: V3 = [form.width, form.height*physique.height, form.depth];
  const skin = skinOverride ?? skinColor(race, look.skin); const hair = HAIR[look.hairColor] ?? HAIR[0];
  const head = useRef<THREE.Group>(null);
  const cloth = ["#796553", "#555e66", "#79534e", "#53654c", "#665972", "#8d7d62"][look.cloth];
  const gear=activeEquipment({classId,level,dead:false,equipped},ITEMS);
  const chest=gear.find(i=>i.slot==='chest'),headgear=gear.find(i=>i.slot==='head'),shoulders=gear.find(i=>i.slot==='shoulders'),gloves=gear.find(i=>i.slot==='hands'),boots=gear.find(i=>i.slot==='feet'),legs=gear.find(i=>i.slot==='legs'),back=gear.find(i=>i.slot==='back'),weapon=gear.find(i=>i.slot==='weapon'||i.slot==='twohand'),offhand=gear.find(i=>i.slot==='offhand');
  const dressed=!!chest,accent=chest?rarityTone(chest.rarity):CLASSES[classId].color;
  const armorColors:Record<string,string>={Pesada:'#78848a',Leve:'#666d58',Couro:'#735c43',Reforçada:'#687572',Tecido:CLASSES[classId].color};
  const torso=chest?armorColors[chest.armor??'']??CLASSES[classId].color:cloth;
  useFrame((_, delta) => {
    if (!animated) return;
    phase.current += Math.min(delta, 0.05) * (walking ? 9 : 2);
    const a = walking ? Math.sin(phase.current) * 0.55 : 0;
    if (left.current) left.current.rotation.x = a;
    if (right.current) right.current.rotation.x = -a;
    if (armL.current) armL.current.rotation.x = walking ? -a * 0.65 : Math.sin(phase.current * 0.7) * 0.035;
    if (armR.current) armR.current.rotation.x = walking ? a * 0.65 : -Math.sin(phase.current * 0.7 + 0.5) * 0.035;
    if (head.current) head.current.rotation.z = walking ? Math.sin(phase.current) * 0.012 : Math.sin(phase.current * 0.4) * 0.012;
    if (root.current) root.current.position.y = walking ? Math.abs(Math.sin(phase.current)) * 0.045 : Math.sin(phase.current) * 0.013;
  });
  return <group ref={root} scale={[scale[0] * body, scale[1], scale[2] * body]}>
    <Part position={[0, 1.05, 0]} scale={[1.02,1.08,0.64]} color={torso} shape={`torso-${look.body}`} />
    {!dressed && <><Part position={[0.26, 1.1, 0.3]} scale={[0.22, 0.29, 0.035]} color="#b09a7d" shape="box" rotation={[0, 0, 0.15]} /><Part position={[-0.29, 0.82, 0.3]} scale={[0.2, 0.16, 0.035]} color="#514535" shape="box" /></>}
    <Part position={[0, 0.77, 0]} scale={[1.02*physique.waist,0.13,0.7]} color="#40352a" shape="cylinder" />
    <Part position={[0, 0.77, 0.35]} scale={[0.15, 0.15, 0.05]} color="#b49b68" shape="box" metal />
    <SkinPart position={[0,1.61,0]} scale={[0.32,0.28,0.33]} color={skin} shape="cylinder" />
    <group ref={head} position={[0,1.96,0]} scale={form.head.map(v=>v*(race==='gnome'?0.98:race==='dwarf'?0.86:0.78)) as V3}>
      <SkinPart scale={[0.7,0.85,0.65]} color={skin} shape={`head-${look.face}`} />
      <SkinPart position={[0,-0.19,race==='orc'?0.15:0.04]} scale={[0.55*form.jaw*face.jaw,0.3*face.chin,0.5]} color={skin} shape="sphere" />
      {[-1,1].map(side => <group key={side}>
        <SkinPart position={[side*0.38,0,0]} scale={race==='elf'?[0.42,0.15,0.17]:race==='gnome'?[0.22,0.29,0.16]:[0.13*form.ear,0.23,0.16]} color={skin} shape={race==='elf'?'cone':'sphere'} rotation={[0,0,side*(race==='elf'?-1.03:0.3)]} />
        <Part position={[side*0.14,0.06,0.293]} scale={[0.125*form.eye,0.07*form.eye,0.065]} color="#e9e7d6" />
        <Part position={[side*0.14,0.06,0.328]} scale={[0.061*form.eye,0.063*form.eye,0.035]} color={EYES[look.eyes]} />
        <Part position={[side*0.14,0.06,0.347]} scale={[0.027,0.045,0.015]} color="#1a252a" />
        <Part position={[side*0.125,0.09,0.352]} scale={[0.023,0.023,0.012]} color="#f3ead4" />
        <Part position={[side*0.14,0.17,0.3]} scale={[look.brows===4?.18:.23,race==='orc'?.08:look.brows===2?.075:look.brows===4?.024:.045,0.06]} color={hair} rotation={[0,0,side*([0,.25,-.06,-.3,.1,.18][look.brows]??0)]} />
        {race==='orc' && <Part position={[side*0.2,-0.12,0.43]} scale={[0.12,0.28+look.face*0.008,0.12]} color="#e0d6b9" shape="cone" rotation={[0,0,side*-0.18]} />}
        {race==='elf' && <Part position={[side*0.23,-0.09,0.22]} scale={[0.17,0.13,0.13]} color={skin} />}
      </group>)}
      {[-1,1].map(side=><SkinPart key={`cheek-${side}`} position={[side*0.21,-0.06,0.2]} scale={[0.24*face.cheeks,0.22,0.19]} color={skin} />)}
      <SkinPart position={[0,-0.22,0.28]} scale={[0.23,0.06,0.1]} color={skin} />
      <group position={[0,-0.02,0]} rotation={[nose.tilt,0,0]}>
        <SkinPart position={[0,0.02,race==='orc'?0.36:0.3]} scale={[nose.width,nose.bridge,nose.depth]} color={skin} />
        <SkinPart position={[0,-0.065,nose.tip+(race==='gnome'?.055:0)]} scale={[nose.width*(race==='gnome'?1.35:1),.11,nose.depth]} color={skin} />
        {[-1,1].map(side=><SkinPart key={side} position={[side*nose.width*.38,-.095,nose.tip-.025]} scale={[nose.width*.55,.07,.09]} color={skin} />)}
      </group>
      <Part position={[0,-0.18,race==='orc'?0.4:0.29]} scale={[0.25*form.jaw,0.035,0.07]} color={race==='orc'?'#314432':race==='gnome'?'#54637e':'#86594d'} />
      {look.hair>0 && <>
        <Part position={[0,0.27,-0.035]} scale={[0.76,0.27,0.69]} color={hair} />
        {look.hair===1 && [0,1,2,3,4].map(i=><Part key={i} position={[Math.sin(i*1.5)*0.25,0.34,Math.cos(i*1.5)*0.2]} scale={[0.2,0.22,0.23]} color={hair} />)}
        {look.hair===2 && [0,1,2].map(i=><Part key={i} position={[-0.16+i*0.15,0.35,0.13]} scale={[0.26,0.15,0.35]} color={hair} rotation={[0,0,-0.3]} />)}
        {look.hair===3 && [0,1,2,3].map(i=><Part key={i} position={[0,0.45,-0.23+i*0.15]} scale={[0.16,0.44,0.22]} color={hair} shape="cone" />)}
        {look.hair===4 && <><Part position={[0,-0.05,-0.28]} scale={[0.8,1.12,0.28]} color={hair} />{[-1,1].map(side=><Part key={side} position={[side*0.32,-0.12,0]} scale={[0.16,0.82,0.24]} color={hair} />)}</>}
        {look.hair===5 && <><Part position={[0,0.04,-0.38]} scale={[0.24,0.7,0.24]} color={hair} /><Part position={[0,0.28,-0.4]} scale={[0.25,0.1,0.25]} color="#a18a65" shape="cylinder" /></>}
      </>}
      {look.beard>0 && <>
        <Part position={[0,-0.29,0.21]} scale={[0.6,look.beard===1?0.2:0.45,0.36]} color={hair} />
        {look.beard>=3 && Array.from({length:look.beard===3?1:look.beard===4?2:4},(_,i)=>{const count=look.beard===3?1:look.beard===4?2:4;const x=(i-(count-1)/2)*0.15;return <group key={i} position={[x,-0.58,0.22]}><Part scale={[0.16,0.5+((i%2)*0.07),0.17]} color={hair} shape="cylinder" /><Part position={[0,-0.16,0]} scale={[0.18,0.06,0.19]} color="#ae9463" shape="cylinder" metal /></group>;})}
      </>}
      {look.moustache>0 && [-1,1].map(side=><Part key={side} position={[side*0.105,-0.13,0.365]} scale={[0.2+look.moustache*0.02,0.06+look.moustache*0.01,0.08]} color={hair} rotation={[0,0,side*look.moustache*0.08]} />)}
      {look.scar>0 && <Part position={[0.23,0.06-look.scar*0.02,0.305]} scale={[0.018,0.15+look.scar*0.018,0.02]} color={race==='orc'?'#9aaf7a':race==='gnome'?'#c0bdc9':'#a96558'} shape="box" rotation={[0,0,0.35+look.scar*0.08]} />}
      {look.tattoo>0 && <Part position={[-0.26,-0.02,0.3]} scale={[0.08+look.tattoo*0.01,0.12,0.02]} color={['','#334b63','#51376e','#315346','#773d3b','#40372a'][look.tattoo]} shape={look.tattoo%2?'cone':'box'} />}
      {look.accessory>0 && <Part position={[0.42,-0.1+look.accessory*0.015,0]} scale={[0.09,0.14+look.accessory*0.015,0.08]} color={look.accessory%2?'#c6ab6d':'#97aeb3'} metal />}
    {headgear && <><Part position={[0,0.29,0]} scale={[0.81,0.35,0.74]} color="#8c969d" shape="cylinder" metal /><Part position={[0,0.32,0]} scale={[0.12,0.46,0.5]} color={accent} shape="box" /></>}
    </group>
    {([-1, 1] as const).map(side => <group key={side} ref={side === -1 ? armL : armR} position={[side * 0.58*physique.shoulders, 1.42, 0]} scale={[physique.arms,1,1]}>
      <Part position={[0,-0.12,0]} scale={[0.37,0.43,0.39]} color={torso} shape="capsule" rotation={[0,0,side*0.1]} />
      <SkinPart position={[0,-0.36,0.015]} scale={[0.29,0.31,0.3]} color={skin} />
      <SkinPart position={[0,-0.46,0.01]} scale={[0.27,0.31,0.27]} color={skin} />
      {gloves?<Part position={[0,-0.62,0.01]} scale={[0.31,0.3,0.31]} color={rarityTone(gloves.rarity)} />:<SkinPart position={[0,-0.62,0.01]} scale={[race==="orc"?0.3:0.23,0.26,0.19]} color={skin} />}
      {!gloves && <>{[0,1,2,3].map(f=><SkinPart key={f} position={[(f-1.5)*0.046,-0.76+Math.abs(f-1.5)*0.012,0.035]} scale={[0.055,0.17,0.07]} color={skin} />)}<SkinPart position={[-side*0.13,-0.65,0.075]} scale={[0.075,0.17,0.09]} rotation={[0,0,-side*0.5]} color={skin} /></>}
      {shoulders && <Part position={[0, 0.02, 0]} scale={[0.45, 0.3, 0.45]} color={shoulders?rarityTone(shoulders.rarity):accent} />}
      {side===-1&&offhand&&<group position={[-0.1,-0.55,0.1]}><EquipmentVisual visual={offhand.visual} tone={rarityTone(offhand.rarity)} small={offhand.visual==='dagger'} /></group>}
      {side===1&&weapon&&<group position={[0,-0.65,0.05]}><EquipmentVisual visual={weapon.visual} tone={rarityTone(weapon.rarity)} /></group>}
    </group>)}
    {([-1, 1] as const).map(side => <group key={side} position={[side * physique.stance, 0.73, 0]} scale={[physique.legs,1,1]} ref={side === -1 ? left : right}>
      <Part position={[0,-0.17,0]} scale={[0.4,0.46,0.41]} color={legs?rarityTone(legs.rarity):"#564c40"} shape="capsule" />
      <Part position={[0,-0.43,0.015]} scale={[0.3,0.38,0.32]} color={legs?rarityTone(legs.rarity):"#615545"} shape="capsule" />
      <Part position={[0, -0.61, 0.09]} scale={[0.36, 0.24, 0.5]} color={boots?rarityTone(boots.rarity):"#3f352d"} shape="box" />
    </group>)}
    {back&&<Part position={[0,1.05,-0.37]} scale={[1.05,1.1,0.1]} color={rarityTone(back.rarity)} shape="box" />}
    {preview && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><ringGeometry args={[0.85, 0.87, 64]} /><meshBasicMaterial color={accent} transparent opacity={0.65} /></mesh>}
  </group>;
}
