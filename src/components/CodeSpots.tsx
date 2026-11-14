"use client";
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '@/lib/store';
import { adventureOf } from '@/lib/adventure';
import { CODE_SPOTS, spotAvailable, type CodeSpot } from '@/lib/codeSpots';
import { cursorOn } from '@/lib/cursor';

const open = (id: string) => window.dispatchEvent(new CustomEvent('lions-cave-spot', { detail: id }));
const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => <meshStandardMaterial color={color} roughness={.8} {...extra} />;
const FLOWER = ['#f3d36b', '#f2f0e6', '#e7859a', '#a99be6', '#f39c5a', '#f7b6c8'];

/** Lanterna feita pelo código do jogador: maior que os postes da vila e, acesa, com chama viva e halo visível até de dia. */
function Lamp({ lit }: { lit: boolean }) {
  const flame = useRef<THREE.Mesh>(null), halo = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { const t = clock.elapsedTime, f = 1 + Math.sin(t * 9) * .12 + Math.sin(t * 23) * .06;
    if (flame.current) flame.current.scale.set(f, 1 + (f - 1) * 2, f);
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(t * 2.4) * .1); });
  return <group><mesh position={[0, .08, 0]} castShadow><cylinderGeometry args={[.22, .28, .16, 8]} />{mat('#7a7f8a', { metalness: .2 })}</mesh>
    <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[.08, .11, 2.7, 8]} />{mat('#3d4350', { metalness: .4 })}</mesh>
    <mesh position={[0, 2.62, 0]}><boxGeometry args={[.6, .06, .6]} />{mat('#3d4350', { metalness: .4 })}</mesh>
    <mesh position={[0, 2.95, 0]}><boxGeometry args={[.46, .6, .46]} />{mat(lit ? '#fff1b8' : '#b39a62', { emissive: lit ? '#ffb43a' : '#3a2a10', emissiveIntensity: lit ? 2.6 : .4, transparent: true, opacity: lit ? .9 : 1 })}</mesh>
    {[[-.23, -.23], [.23, -.23], [-.23, .23], [.23, .23]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x, 2.95, z]}><boxGeometry args={[.05, .62, .05]} />{mat('#3d4350', { metalness: .4 })}</mesh>)}
    <mesh position={[0, 3.4, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[.46, .32, 4]} />{mat('#3d4350', { metalness: .3 })}</mesh>
    <mesh position={[0, 3.62, 0]}><sphereGeometry args={[.07, 8, 6]} />{mat('#d6b06a', { metalness: .6, roughness: .4 })}</mesh>
    {lit && <><mesh ref={flame} position={[0, 2.95, 0]}><coneGeometry args={[.11, .34, 8]} /><meshBasicMaterial color="#ff8a1f" /></mesh>
      <mesh ref={halo} position={[0, 2.95, 0]}><sphereGeometry args={[1.05, 16, 12]} /><meshBasicMaterial color="#ffd36b" transparent opacity={.3} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .05, 0]}><circleGeometry args={[2.4, 32]} /><meshBasicMaterial color="#ffd36b" transparent opacity={.22} depthWrite={false} /></mesh></>}{/* Sem pointLight: acender uma luz nova recompila a iluminação da cena inteira e trava o celular. */}</group>;
}
function Bed({ flowers, colors = FLOWER, wet = true }: { flowers: number; colors?: string[]; wet?: boolean }) {
  return <group><mesh position={[0, .07, 0]} receiveShadow><cylinderGeometry args={[1.05, 1.12, .14, 24]} />{mat('#e6dcc2', { roughness: 1 })}</mesh>
    <mesh position={[0, .15, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.92, 24]} />{mat(wet ? '#5d4630' : '#9a8366', { roughness: 1 })}</mesh>
    {Array.from({ length: flowers }, (_, i) => { const row = Math.floor(i / 3), col = i % 3, x = (col - 1) * .5, z = flowers > 3 ? (row - .5) * .5 : 0; return <group key={i} position={[x, .15, z]}><mesh position={[0, .17, 0]}><cylinderGeometry args={[.02, .03, .34, 5]} />{mat('#4f7d3d')}</mesh><mesh position={[0, .38, 0]}><sphereGeometry args={[.13, 10, 8]} />{mat(colors[i % colors.length], { emissive: colors[i % colors.length], emissiveIntensity: .12 })}</mesh></group>; })}</group>;
}
function Tree({ x }: { x: number }) {
  return <group position={[0, 0, x]}><mesh position={[0, .55, 0]} castShadow><cylinderGeometry args={[.12, .18, 1.1, 7]} />{mat('#7a5236')}</mesh><mesh position={[0, 1.45, 0]} castShadow><icosahedronGeometry args={[.62, 1]} />{mat('#6fb257', { flatShading: true })}</mesh></group>;
}
function Fountain({ on }: { on: boolean }) {
  const jet = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (jet.current) jet.current.scale.y = 1 + Math.sin(clock.elapsedTime * 4) * .08; });
  return <group><mesh position={[0, .3, 0]} castShadow receiveShadow><cylinderGeometry args={[1.25, 1.4, .6, 20]} />{mat('#d6cfbb')}</mesh>
    <mesh position={[0, .58, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.08, 24]} />{mat(on ? '#62c6ea' : '#8c8270', { emissive: on ? '#2a8fbf' : '#000000', emissiveIntensity: on ? .35 : 0 })}</mesh>
    <mesh position={[0, .9, 0]}><cylinderGeometry args={[.18, .24, .7, 10]} />{mat('#cfc7b1')}</mesh>
    {on && <mesh ref={jet} position={[0, 1.65, 0]}><cylinderGeometry args={[.05, .16, 1.1, 10]} /><meshStandardMaterial color="#bdeeff" transparent opacity={.75} emissive="#7fd6ff" emissiveIntensity={.4} /></mesh>}</group>;
}
function Bridge({ fixed }: { fixed: boolean }) {
  return <group><mesh position={[0, .03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.6, 5]} />{mat('#5fb6d8', { emissive: '#2a7fa8', emissiveIntensity: .2, roughness: .3 })}</mesh>
    {[0, 1, 2, 3].map(i => (fixed || i % 2 === 0) && <mesh key={i} position={[(i - 1.5) * .48, fixed ? .14 : .05, 0]} rotation={[0, 0, fixed ? 0 : (i - 1.5) * .3]} castShadow><boxGeometry args={[.42, .1, 1.5]} />{mat('#a87a4a')}</mesh>)}
    {fixed && [-1, 1].map(s => <mesh key={s} position={[0, .45, s * .78]}><boxGeometry args={[2, .08, .08]} />{mat('#7a5236')}</mesh>)}</group>;
}
function Result({ spot, built, night }: { spot: CodeSpot; built: boolean; night: boolean }) {
  switch (spot.kind) {
    case 'lantern': return <Lamp lit={built} />;
    case 'flowers': return <Bed flowers={built ? 6 : 0} wet={built} />;
    case 'nightlamp': return <group><Lamp lit={built && night} />{built && <Html position={[0, 3.9, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}><span className="spot-tag">{night ? '🌙 aceso' : '☀ apagado'}</span></Html>}</group>;
    case 'trees': return <group>{built ? [-4, -2, 0, 2, 4].map(z => <Tree key={z} x={z} />) : <mesh position={[0, .03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.2, 9.5]} />{mat('#8a7457', { roughness: 1 })}</mesh>}</group>;
    case 'water': return <group>{[-1.2, 1.2].map(z => <group key={z} position={[0, 0, z]}><Bed flowers={built ? 3 : 0} colors={['#7cc45a', '#9bd66e', '#7cc45a']} wet={built} /></group>)}</group>;
    case 'garden': return <Bed flowers={built ? 3 : 0} colors={['#f08bb0', '#f3d36b', '#7aa7f0']} wet={built} />;
    case 'fountain': return <Fountain on={built} />;
    case 'bridge': return <Bridge fixed={built} />;
  }
}
function Marker({ spot }: { spot: CodeSpot }) {
  const gem = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (gem.current) { gem.current.rotation.y = clock.elapsedTime * 1.5; gem.current.position.y = 4 + Math.sin(clock.elapsedTime * 2.5) * .12; } });
  return <group>
    <mesh ref={gem} position={[0, 4, 0]} {...cursorOn('point')} onClick={e => { if (e.delta > 6 || e.button !== 0) return; e.stopPropagation(); open(spot.id); }}><octahedronGeometry args={[.3]} /><meshStandardMaterial color="#7fe3ff" emissive="#2fb6e8" emissiveIntensity={1.4} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .06, 0]}><ringGeometry args={[1.3, 1.45, 40]} /><meshBasicMaterial color="#7fe3ff" transparent opacity={.75} depthWrite={false} /></mesh>
    <Html position={[0, 4.7, 0]} center zIndexRange={[6, 0]}><button className="spot-label" onClick={() => open(spot.id)}>✦ {spot.title} · código</button></Html>
  </group>;
}

/** Pontos de código da vila: o próximo brilha; os feitos mostram o resultado para sempre. */
export default function CodeSpots({ night }: { night: boolean }) {
  const raw = useGame(s => s.hero.adventure), built = adventureOf({ adventure: raw }).built;
  return <group>{CODE_SPOTS.map(spot => { const done = built.includes(spot.id), ready = !done && spotAvailable(built, spot.id);
    return <group key={spot.id} position={[spot.x, 0, spot.z]}>{(done || ready) && <Result spot={spot} built={done} night={night} />}{ready && <Marker spot={spot} />}</group>; })}</group>;
}
