"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLASSES, HAIR, EYES, type ClassId, type Look } from "@/lib/game";

import { RACE_FORM, skinColor } from "@/lib/visual";
import { skinGeometry } from "@/lib/skinGeometry";

type V3 = [number, number, number];
function Part({ position = [0, 0, 0], scale = [1, 1, 1], color, shape = "sphere", metal = false, rotation = [0, 0, 0] }: { position?: V3; scale?: V3; color: string; shape?: string; metal?: boolean; rotation?: V3 }) {
  return <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
    {shape === "box" ? <boxGeometry /> : shape === "cone" ? <coneGeometry args={[0.5, 1, 8]} /> : shape === "cylinder" ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} /> : <sphereGeometry args={[0.5, 12, 10]} />}
    <meshStandardMaterial color={color} roughness={metal ? 0.45 : 0.9} metalness={metal ? 0.55 : 0} flatShading />
  </mesh>;
}
function SkinPart({ position = [0,0,0], scale = [1,1,1], color, shape = "sphere", rotation = [0,0,0] }: { position?: V3; scale?: V3; color: string; shape?: string; rotation?: V3 }) {
  const geometry = useMemo(() => skinGeometry(color,shape), [color,shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} scale={scale} rotation={rotation} geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={0.94} metalness={0} /></mesh>;
}
export default function Character({ classId, look, equipped = [], walking = false, animated = true, preview = false, skinOverride }: { classId: ClassId; look: Look; equipped?: string[]; walking?: boolean; animated?: boolean; preview?: boolean; skinOverride?: string }) {
  const root = useRef<THREE.Group>(null); const left = useRef<THREE.Group>(null); const right = useRef<THREE.Group>(null); const armL = useRef<THREE.Group>(null); const armR = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const race = CLASSES[classId].race;
  const form = RACE_FORM[race];
  const body = 0.86 + look.body * 0.06;
  const scale: V3 = [form.width, form.height, form.depth];
  const skin = skinOverride ?? skinColor(race, look.skin); const hair = HAIR[look.hairColor] ?? HAIR[0];
  const head = useRef<THREE.Group>(null);
  const cloth = ["#796553", "#555e66", "#79534e", "#53654c", "#665972", "#8d7d62"][look.cloth];
  const dressed = equipped.includes("tunic"); const accent = CLASSES[classId].color;
  const torso = dressed ? accent : cloth;
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
    <Part position={[0, 1.05, 0]} scale={[0.95, 1.05, 0.62]} color={torso} shape="cylinder" />
    {!dressed && <><Part position={[0.26, 1.1, 0.3]} scale={[0.22, 0.29, 0.035]} color="#b09a7d" shape="box" rotation={[0, 0, 0.15]} /><Part position={[-0.29, 0.82, 0.3]} scale={[0.2, 0.16, 0.035]} color="#514535" shape="box" /></>}
    <Part position={[0, 0.77, 0]} scale={[1.02, 0.13, 0.7]} color="#40352a" shape="cylinder" />
    <Part position={[0, 0.77, 0.35]} scale={[0.15, 0.15, 0.05]} color="#b49b68" shape="box" metal />
    <SkinPart position={[0,1.61,0]} scale={[0.32,0.28,0.33]} color={skin} shape="cylinder" />
    <group ref={head} position={[0,1.96,0]} scale={form.head}>
      <SkinPart scale={[0.72+look.face*0.025,0.81-look.face*0.018,0.65]} color={skin} />
      <SkinPart position={[0,-0.19,race==='orc'?0.15:0.04]} scale={[0.55*form.jaw,0.3,0.5]} color={skin} shape={race==='orc'?'box':'sphere'} />
      {[-1,1].map(side => <group key={side}>
        <SkinPart position={[side*0.38,0,0]} scale={race==='elf'?[0.42,0.15,0.17]:race==='gnome'?[0.22,0.29,0.16]:[0.13*form.ear,0.23,0.16]} color={skin} shape={race==='elf'?'cone':'sphere'} rotation={[0,0,side*(race==='elf'?-1.03:0.3)]} />
        <Part position={[side*0.14,0.06,0.293]} scale={[0.14*form.eye,0.11*form.eye,0.065]} color="#e9e7d6" />
        <Part position={[side*0.14,0.06,0.328]} scale={[0.075*form.eye,0.085*form.eye,0.035]} color={EYES[look.eyes]} />
        <Part position={[side*0.14,0.06,0.347]} scale={[0.03,0.057,0.015]} color="#1a252a" />
        <Part position={[side*0.125,0.09,0.352]} scale={[0.023,0.023,0.012]} color="#f3ead4" />
        <Part position={[side*0.14,0.17,0.3]} scale={[0.22,race==='orc'?0.075+look.brows*0.008:0.03+look.brows*0.007,0.06]} color={hair} shape="box" rotation={[0,0,side*(look.brows-2)*0.08]} />
        {race==='orc' && <Part position={[side*0.2,-0.12,0.43]} scale={[0.12,0.28+look.face*0.008,0.12]} color="#e0d6b9" shape="cone" rotation={[0,0,side*-0.18]} />}
        {race==='elf' && <Part position={[side*0.23,-0.09,0.22]} scale={[0.17,0.13,0.13]} color={skin} />}
      </group>)}
      <SkinPart position={[0,-0.035,race==='orc'?0.39:0.34]} scale={[0.13+look.nose*0.025+(race==='gnome'?0.08:0),0.15+look.nose*0.012,0.17+look.nose*0.02]} color={skin} />
      <Part position={[0,-0.18,race==='orc'?0.4:0.29]} scale={[0.23*form.jaw,0.025,0.065]} color={race==='orc'?'#314432':race==='gnome'?'#54637e':'#86594d'} shape="box" />
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
    {equipped.includes("helmet") && <><Part position={[0,0.29,0]} scale={[0.81,0.35,0.74]} color="#8c969d" shape="cylinder" metal /><Part position={[0,0.32,0]} scale={[0.12,0.46,0.5]} color={accent} shape="box" /></>}
    </group>
    {([-1, 1] as const).map(side => <group key={side} ref={side === -1 ? armL : armR} position={[side * 0.58, 1.42, 0]}>
      <Part position={[0, -0.22, 0]} scale={[0.32, 0.67, 0.33]} color={torso} shape="cylinder" />
      <SkinPart position={[0,-0.62,0.01]} scale={[race==="orc"?0.36:0.29,0.28,0.29]} color={skin} />
      {dressed && <Part position={[0, 0.02, 0]} scale={[0.45, 0.3, 0.45]} color={accent} />}
      {side === -1 && equipped.includes("shield") && <Part position={[-0.12, -0.4, 0.1]} scale={[0.16, 0.9, 0.75]} color="#9c8054" shape="cylinder" metal rotation={[0, 0, Math.PI / 2]} />}
      {side === 1 && equipped.some(id => ["sword", "greatsword", "dagger", "axe", "staff", "tool", "bow"].includes(id)) && <group position={[0, -0.65, 0.05]}>
        <Part position={[0, 0, 0]} scale={[0.08, equipped.includes("staff") ? 1.65 : 0.55, 0.08]} color="#654834" shape="cylinder" />
        {equipped.includes("staff") ? <Part position={[0, 0.9, 0]} scale={[0.3, 0.4, 0.3]} color="#ab93e2" shape="cone" /> : equipped.includes("bow") ? <Part position={[0.1, 0.25, 0]} scale={[0.08, 1.1, 0.1]} color="#bc8e53" shape="cylinder" rotation={[0, 0, 0.25]} /> : <Part position={[0, 0.55, 0]} scale={[equipped.includes("axe") ? 0.45 : 0.13, equipped.includes("dagger") ? 0.45 : 0.9, 0.07]} color="#bdc7c6" shape="box" metal />}
      </group>}
    </group>)}
    {([-1, 1] as const).map(side => <group key={side} position={[side * 0.24, 0.73, 0]} ref={side === -1 ? left : right}>
      <Part position={[0, -0.25, 0]} scale={[0.35, 0.65, 0.36]} color={dressed ? "#44484a" : "#564c40"} shape="cylinder" />
      <Part position={[0, -0.61, 0.09]} scale={[0.36, 0.24, 0.5]} color="#3f352d" shape="box" />
    </group>)}
    {preview && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><ringGeometry args={[0.85, 0.87, 64]} /><meshBasicMaterial color={accent} transparent opacity={0.65} /></mesh>}
  </group>;
}
