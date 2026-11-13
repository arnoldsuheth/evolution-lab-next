"use client";

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ogrimmar com cara de fortaleza orc: paliçada de troncos pontudos (com passagens nas estradas),
 * braseiros acesos (só brilho, sem luz extra, para não travar o celular), estandartes vermelhos,
 * tendas de couro, totens de presas, tambores de guerra e pedras rubras.
 */
const BRAZIERS: [number, number][] = [[-3, 8.5], [3, 8.5], [-6.8, -6.2], [6.8, -6.2], [-13.5, 4.6], [13.5, 4.6], [-4, -12], [4, -12]];
const BANNERS: [number, number, number][] = [[-2.3, -8.6, 0], [2.3, -8.6, 0], [-11, 2.7, 0], [11, 2.7, 0], [-16, -7.6, 0], [16, -7.6, 0]];
const TENTS: [number, number, number][] = [[-19, 9, .3], [19, 10, -.4], [-20, -4, .9], [20, -5, -.8]];
const TOTEMS: [number, number][] = [[-9.5, 9], [9.5, 9], [0, -21]];
const DRUMS: [number, number][] = [[-14, 8], [14.5, 9.5]];
const ROCKS: [number, number, number][] = [[-20.5, 12, 1.2], [20.5, 13, 1], [-20.5, -14, 1.4], [20.5, -12, 1.2], [-12, -18.5, 1.1], [13, -18.5, 1.3]];

function palisade(): THREE.Matrix4[] {
  const out: THREE.Matrix4[] = [], q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  // Estacas afiadas por dentro da muralha de pedra (x ±25, z −22 a 18), inclinadas para fora; vãos nos portões.
  let i = 0;
  const lean = (x: number, z: number, ax: number, az: number) => {
    const h = 1.5 + (i % 3) * .2;
    q.setFromEuler(new THREE.Euler(az * .4, 0, -ax * .4));
    out.push(new THREE.Matrix4().compose(p.set(x + ax * .3, h / 2, z + az * .3), q, s.set(.8, h, .8))); i++;
  };
  for (let x = -22.5; x <= 22.5; x += 1.5) if (Math.abs(x) > 4) { lean(x, 16.4, 0, 1); lean(x, -20.4, 0, -1); }
  for (let z = -19; z <= 15; z += 1.5) if (Math.abs(z - 3) > 4) { lean(-23.4, z, -1, 0); lean(23.4, z, 1, 0); }
  return out;
}

function Palisade() {
  const logs = useRef<THREE.InstancedMesh>(null), tips = useRef<THREE.InstancedMesh>(null), matrices = useMemo(() => palisade(), []);
  useLayoutEffect(() => {
    const tip = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    matrices.forEach((m, i) => {
      logs.current?.setMatrixAt(i, m);
      m.decompose(pos, q, sc);
      const up = new THREE.Vector3(0, sc.y / 2 + .2, 0).applyQuaternion(q);
      tips.current?.setMatrixAt(i, tip.compose(new THREE.Vector3(pos.x + up.x, pos.y + up.y, pos.z + up.z), q, new THREE.Vector3(.8, 1, .8)));
    });
    if (logs.current) logs.current.instanceMatrix.needsUpdate = true;
    if (tips.current) tips.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return <group>
    <instancedMesh ref={logs} args={[undefined, undefined, matrices.length]} castShadow raycast={() => null}><cylinderGeometry args={[.26, .3, 1, 7]} /><meshStandardMaterial color="#6b4a33" roughness={.95} /></instancedMesh>
    <instancedMesh ref={tips} args={[undefined, undefined, matrices.length]} raycast={() => null}><coneGeometry args={[.26, .45, 7]} /><meshStandardMaterial color="#8a6446" roughness={.9} /></instancedMesh>
  </group>;
}

function Brazier({ x, z, index }: { x: number; z: number; index: number }) {
  const flame = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const f = flame.current; if (!f) return;
    const t = clock.elapsedTime * 7 + index * 2.3;
    f.scale.set(1 + Math.sin(t) * .08, 1 + Math.sin(t * 1.7) * .16, 1 + Math.cos(t) * .08);
  });
  return <group position={[x, 0, z]}>
    {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.1) * .28, .45, Math.sin(i * 2.1) * .28]} rotation={[Math.sin(i * 2.1) * .3, 0, -Math.cos(i * 2.1) * .3]}><cylinderGeometry args={[.05, .06, .95, 5]} /><meshStandardMaterial color="#2c2522" metalness={.5} roughness={.5} /></mesh>)}
    <mesh position={[0, .95, 0]}><cylinderGeometry args={[.42, .26, .3, 9]} /><meshStandardMaterial color="#3a2e29" metalness={.55} roughness={.45} /></mesh>
    <group ref={flame} position={[0, 1.1, 0]}>
      <mesh position={[0, .22, 0]}><coneGeometry args={[.3, .65, 8]} /><meshStandardMaterial color="#ff8a2a" emissive="#ff5a12" emissiveIntensity={2.2} transparent opacity={.9} /></mesh>
      <mesh position={[0, .16, 0]}><coneGeometry args={[.17, .42, 7]} /><meshStandardMaterial color="#ffe08a" emissive="#ffc04a" emissiveIntensity={2.4} /></mesh>
    </group>
  </group>;
}

function Banner({ x, z, index }: { x: number; z: number; index: number }) {
  const cloth = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (cloth.current) cloth.current.rotation.y = Math.sin(clock.elapsedTime * 1.3 + index) * .18; });
  return <group position={[x, 0, z]}>
    <mesh position={[0, 1.8, 0]} castShadow><cylinderGeometry args={[.06, .08, 3.6, 6]} /><meshStandardMaterial color="#3b2a20" /></mesh>
    <mesh position={[0, 3.45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.04, .04, 1.1, 5]} /><meshStandardMaterial color="#3b2a20" /></mesh>
    <mesh position={[0, 3.6, 0]}><coneGeometry args={[.09, .3, 4]} /><meshStandardMaterial color="#d8d0bc" /></mesh>
    <mesh ref={cloth} position={[0, 2.75, .02]}><planeGeometry args={[.95, 1.35]} /><meshStandardMaterial color="#9c2a22" side={THREE.DoubleSide} roughness={.9} /></mesh>
    <mesh position={[0, 2.8, .035]}><circleGeometry args={[.22, 12]} /><meshStandardMaterial color="#1f1714" side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 2.06, .03]} rotation={[0, 0, Math.PI / 4]}><planeGeometry args={[.67, .67]} /><meshStandardMaterial color="#9c2a22" side={THREE.DoubleSide} /></mesh>
  </group>;
}

function Tent({ x, z, turn }: { x: number; z: number; turn: number }) {
  return <group position={[x, 0, z]} rotation={[0, turn, 0]}>
    <mesh position={[0, 1.05, 0]} castShadow><coneGeometry args={[1.9, 2.1, 6, 1, true]} /><meshStandardMaterial color="#a77b55" side={THREE.DoubleSide} roughness={.95} /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[Math.cos(i * 2.1) * .12, 2.3, Math.sin(i * 2.1) * .12]} rotation={[Math.sin(i * 2.1) * .35, 0, Math.cos(i * 2.1) * .35]}><cylinderGeometry args={[.04, .05, .8, 5]} /><meshStandardMaterial color="#4a3426" /></mesh>)}
    <mesh position={[0, .55, 1.62]} rotation={[-.45, 0, 0]}><planeGeometry args={[.8, 1.1]} /><meshStandardMaterial color="#2a1c16" side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 1.3, 1.25]} rotation={[-.45, 0, 0]}><ringGeometry args={[.18, .25, 3]} /><meshStandardMaterial color="#9c2a22" side={THREE.DoubleSide} /></mesh>
  </group>;
}

function Totem({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[.28, .36, 2.8, 7]} /><meshStandardMaterial color="#5a3d2b" /></mesh>
    {[.7, 1.5, 2.3].map((y, i) => <mesh key={y} position={[0, y, .26]}><boxGeometry args={[.42, .32, .1]} /><meshStandardMaterial color={i % 2 ? '#9c2a22' : '#d9b46a'} /></mesh>)}
    {[-1, 1].map(side => <mesh key={side} position={[side * .42, 2.75, .05]} rotation={[0, 0, side * -.9]}><coneGeometry args={[.09, .7, 6]} /><meshStandardMaterial color="#efe6cf" /></mesh>)}
    <mesh position={[0, 3.05, 0]}><sphereGeometry args={[.24, 8, 6]} /><meshStandardMaterial color="#e7ddc4" /></mesh>
  </group>;
}

function Drum({ x, z }: { x: number; z: number }) {
  return <group position={[x, 0, z]}>
    <mesh position={[0, .55, 0]} castShadow><cylinderGeometry args={[.6, .52, 1.1, 12]} /><meshStandardMaterial color="#6b3e26" /></mesh>
    <mesh position={[0, 1.11, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.6, 14]} /><meshStandardMaterial color="#d8c39a" /></mesh>
    {[.3, .8].map(y => <mesh key={y} position={[0, y, 0]}><torusGeometry args={[.58, .035, 5, 18]} /><meshStandardMaterial color="#2d2420" metalness={.5} /></mesh>)}
  </group>;
}

export default function OgrimmarDetails({ low }: { low: boolean }) {
  return <group>
    <Palisade />
    {BRAZIERS.map(([x, z], i) => <Brazier key={i} x={x} z={z} index={i} />)}
    {BANNERS.map(([x, z], i) => <Banner key={i} x={x} z={z} index={i} />)}
    {TOTEMS.map(([x, z]) => <Totem key={x + ':' + z} x={x} z={z} />)}
    {!low && TENTS.map(([x, z, turn]) => <Tent key={x} x={x} z={z} turn={turn} />)}
    {!low && DRUMS.map(([x, z]) => <Drum key={x} x={x} z={z} />)}
    {ROCKS.map(([x, z, s], i) => <mesh key={i} position={[x, s * .4, z]} rotation={[i * .7, i * 1.3, 0]} scale={[s, s * .8, s]} castShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#8a4a34" flatShading roughness={.95} /></mesh>)}
  </group>;
}
