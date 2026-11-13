"use client";

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import MonsterModel from './MonsterModel';

/** Forma de Lobo do Shaman: o herói vira um lobo espiritual com brilho verde da natureza. */
export default function SpiritWolf({ reduced }: { reduced: boolean }) {
  const ring = useRef<THREE.Mesh>(null), wisps = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) { ring.current.rotation.z = t * .8; (ring.current.material as THREE.MeshBasicMaterial).opacity = .35 + Math.sin(t * 3) * .12; }
    if (wisps.current && !reduced) wisps.current.children.forEach((w, i) => { const a = t * 1.4 + i * 2.1; w.position.set(Math.cos(a) * .7, .5 + ((t * .6 + i * .33) % 1) * 1.1, Math.sin(a) * .7); });
  });
  return <group>
    <group scale={.82}><MonsterModel kind="wolf" boss={false} reduced={reduced} /></group>
    <mesh ref={ring} position={[0, .05, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[.62, .78, 32]} />
      <meshBasicMaterial color="#6dffa0" transparent opacity={.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
    <group ref={wisps}>{[0, 1, 2].map(i => <mesh key={i} raycast={() => null}><sphereGeometry args={[.06, 8, 6]} /><meshBasicMaterial color="#9dffbf" transparent opacity={.85} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>)}</group>
  </group>;
}
