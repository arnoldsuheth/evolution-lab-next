"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CLASSES, SKIN, HAIR, EYES, type ClassId, type Look } from "@/lib/game";

type V3 = [number, number, number];
function Part({ position = [0, 0, 0], scale = [1, 1, 1], color, shape = "sphere", metal = false, rotation = [0, 0, 0] }: { position?: V3; scale?: V3; color: string; shape?: string; metal?: boolean; rotation?: V3 }) {
  return <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
    {shape === "box" ? <boxGeometry /> : shape === "cone" ? <coneGeometry args={[0.5, 1, 8]} /> : shape === "cylinder" ? <cylinderGeometry args={[0.5, 0.5, 1, 10]} /> : <sphereGeometry args={[0.5, 12, 10]} />}
    <meshStandardMaterial color={color} roughness={metal ? 0.45 : 0.9} metalness={metal ? 0.55 : 0} flatShading />
  </mesh>;
}
export default function Character({ classId, look, equipped = [], walking = false, animated = true, preview = false }: { classId: ClassId; look: Look; equipped?: string[]; walking?: boolean; animated?: boolean; preview?: boolean }) {
  const root = useRef<THREE.Group>(null); const left = useRef<THREE.Group>(null); const right = useRef<THREE.Group>(null); const armL = useRef<THREE.Group>(null); const armR = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const race = CLASSES[classId].race;
  const dimensions: Record<string, V3> = { human: [1, 1.1, 1], orc: [1.28, 1.18, 1.2], dwarf: [1.15, 0.82, 1.1], elf: [0.85, 1.2, 0.88], gnome: [0.8, 0.69, 0.82] };
  const body = 0.86 + look.body * 0.06;
  const scale = dimensions[race];
  const skin = SKIN[look.skin] ?? SKIN[1]; const hair = HAIR[look.hairColor] ?? HAIR[0];
  const cloth = ["#796553", "#555e66", "#79534e", "#53654c", "#665972", "#8d7d62"][look.cloth];
  const dressed = equipped.includes("tunic"); const accent = CLASSES[classId].color;
  const torso = dressed ? accent : cloth;
  useFrame((_, delta) => {
    if (!animated) return;
    phase.current += Math.min(delta, 0.05) * (walking ? 9 : 2);
    const a = walking ? Math.sin(phase.current) * 0.55 : 0;
    if (left.current) left.current.rotation.x = a;
    if (right.current) right.current.rotation.x = -a;
    if (armL.current) armL.current.rotation.x = -a * 0.65;
    if (armR.current) armR.current.rotation.x = a * 0.65;
    if (root.current) root.current.position.y = walking ? Math.abs(Math.sin(phase.current)) * 0.045 : Math.sin(phase.current) * 0.013;
  });
  return <group ref={root} scale={[scale[0] * body, scale[1], scale[2] * body]}>
    <Part position={[0, 1.05, 0]} scale={[0.95, 1.05, 0.62]} color={torso} shape="cylinder" />
    {!dressed && <><Part position={[0.26, 1.1, 0.3]} scale={[0.22, 0.29, 0.035]} color="#b09a7d" shape="box" rotation={[0, 0, 0.15]} /><Part position={[-0.29, 0.82, 0.3]} scale={[0.2, 0.16, 0.035]} color="#514535" shape="box" /></>}
    <Part position={[0, 0.77, 0]} scale={[1.02, 0.13, 0.7]} color="#40352a" shape="cylinder" />
    <Part position={[0, 0.77, 0.35]} scale={[0.15, 0.15, 0.05]} color="#b49b68" shape="box" metal />
    <Part position={[0, 1.61, 0]} scale={[0.32, 0.28, 0.33]} color={skin} shape="cylinder" />
    <Part position={[0, 1.96, 0]} scale={[0.72 + look.face * 0.025, 0.81 - look.face * 0.018, 0.65]} color={skin} />
    {[-1, 1].map(side => <group key={side}>
      <Part position={[side * 0.37, 1.96, 0]} scale={race === "elf" || race === "gnome" ? [0.32, 0.12, 0.14] : [0.12, 0.22, 0.16]} color={skin} rotation={[0, 0, side * 0.5]} />
      <Part position={[side * 0.14, 2.02, 0.29]} scale={[0.13, 0.1, 0.07]} color="#f6e7cd" />
      <Part position={[side * 0.14, 2.02, 0.33]} scale={[0.065, 0.08, 0.035]} color={EYES[look.eyes]} />
      <Part position={[side * 0.14, 2.12, 0.31]} scale={[0.21, 0.035 + look.brows * 0.008, 0.05]} color={hair} shape="box" rotation={[0, 0, side * (look.brows - 2) * 0.08]} />
      {race === "orc" && <Part position={[side * 0.15, 1.77, 0.34]} scale={[0.085, 0.22, 0.08]} color="#e2d5b3" shape="cone" />}
    </group>)}
    <Part position={[0, 1.94, 0.34]} scale={[0.13 + look.nose * 0.025, 0.16 + look.nose * 0.012, 0.17 + look.nose * 0.02]} color={skin} />
    <Part position={[0, 1.78, 0.28]} scale={[0.23, 0.035, 0.08]} color="#69483b" shape="box" />
    {look.hair > 0 && <>
      <Part position={[0, 2.22, -0.025]} scale={[0.78, 0.32 + look.hair * 0.035, 0.7]} color={hair} />
      {Array.from({ length: look.hair + 2 }, (_, i) => <Part key={i} position={[Math.sin(i * 1.6) * 0.27, 2.29 + (look.hair === 3 ? i * 0.05 : 0), Math.cos(i * 1.6) * 0.22]} scale={[0.22, 0.25 + look.hair * 0.045, 0.23]} color={hair} shape={look.hair === 3 ? "cone" : "sphere"} />)}
      {look.hair >= 4 && <Part position={[0, 1.97, -0.28]} scale={[0.7, look.hair === 5 ? 0.95 : 0.6, 0.2]} color={hair} />}
    </>}
    {look.beard > 0 && <Part position={[0, 1.64 - look.beard * 0.025, 0.23]} scale={[0.55 + look.beard * 0.025, 0.25 + look.beard * 0.12, 0.35]} color={hair} shape={look.beard % 2 ? "cone" : "sphere"} />}
    {look.moustache > 0 && [-1, 1].map(side => <Part key={side} position={[side * 0.1, 1.83, 0.36]} scale={[0.2 + look.moustache * 0.025, 0.07 + look.moustache * 0.01, 0.08]} color={hair} rotation={[0, 0, side * look.moustache * 0.08]} />)}
    {look.scar > 0 && <Part position={[0.23, 2.02 - look.scar * 0.02, 0.305]} scale={[0.018, 0.15 + look.scar * 0.018, 0.02]} color="#a96558" shape="box" rotation={[0, 0, 0.35 + look.scar * 0.08]} />}
    {look.tattoo > 0 && <Part position={[-0.26, 1.94, 0.3]} scale={[0.08 + look.tattoo * 0.01, 0.12, 0.02]} color={["", "#496575", "#574579", "#416959", "#8b4e44", "#51483b"][look.tattoo]} shape={look.tattoo % 2 ? "cone" : "box"} />}
    {look.accessory > 0 && <Part position={[0.4, 1.86 + look.accessory * 0.015, 0]} scale={[0.09, 0.14 + look.accessory * 0.015, 0.08]} color={look.accessory % 2 ? "#d4b878" : "#97aeb3"} metal />}
    {equipped.includes("helmet") && <><Part position={[0, 2.25, 0]} scale={[0.81, 0.35, 0.74]} color="#8c969d" shape="cylinder" metal /><Part position={[0, 2.28, 0]} scale={[0.12, 0.46, 0.5]} color={accent} shape="box" /></>}
    {([-1, 1] as const).map(side => <group key={side} ref={side === -1 ? armL : armR} position={[side * 0.58, 1.42, 0]}>
      <Part position={[0, -0.22, 0]} scale={[0.32, 0.67, 0.33]} color={torso} shape="cylinder" />
      <Part position={[0, -0.62, 0.01]} scale={[0.29, 0.28, 0.29]} color={skin} />
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
