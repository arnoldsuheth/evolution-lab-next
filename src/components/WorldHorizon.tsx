"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_BOUNDS } from '@/lib/worldBounds';
import { biomeOf } from '@/lib/biomes';
import { useGame } from '@/lib/store';

/** Cores do horizonte por região: terra além do limite, mar e montanhas (com neve ou rocha vulcânica). */
const LOOK: Record<string, { sea: string; rock: string; cap?: string; shore: string }> = {
  aurora: { sea: '#3f86a8', rock: '#6f7a5a', cap: '#f2f4f2', shore: '#c9b98a' },
  bosque: { sea: '#3a7d86', rock: '#56684a', cap: '#e9eee6', shore: '#b9ad7c' },
  'iron-forge': { sea: '#6f97ae', rock: '#7d8b96', cap: '#ffffff', shore: '#c7cdd2' },
  gnomolandia: { sea: '#4a8fb0', rock: '#6f8592', cap: '#f4f8fb', shore: '#c3bfa0' },
  ogrimmar: { sea: '#7a3a24', rock: '#4a3430', shore: '#8a6a4c' },
  ruins: { sea: '#45808f', rock: '#7a7464', cap: '#ece8dd', shore: '#c4b48a' },
  frontier: { sea: '#3d7590', rock: '#6a6a58', cap: '#eef0ee', shore: '#bfae80' },
  heart: { sea: '#3b2a68', rock: '#3c3550', shore: '#5a4c7a' },
  goddard: { sea: '#3f86a8', rock: '#6f7a5a', cap: '#f2f4f2', shore: '#c9b98a' },
};
const MID_Z = (WORLD_BOUNDS.maxZ + WORLD_BOUNDS.minZ) / 2, HALF_X = WORLD_BOUNDS.x, HALF_Z = (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ) / 2, SHORE = 16;
const rand = (n: number) => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

/** Picos em volta do mapa (fixos por região): parte na faixa de terra, parte como ilhas no mar. */
function peaks(seed: number) {
  const list: { x: number; z: number; h: number; r: number; island: boolean }[] = [];
  const perimeter = 2 * (HALF_X * 2 + HALF_Z * 2), n = 34;
  for (let i = 0; i < n; i++) {
    let d = (i / n + rand(seed + i) * .02) * perimeter, x = 0, z = 0, nx = 0, nz = 0;
    if ((d -= 0) < HALF_X * 2) { x = -HALF_X + d; z = -HALF_Z; nz = -1; }
    else if ((d -= HALF_X * 2) < HALF_Z * 2) { x = HALF_X; z = -HALF_Z + d; nx = 1; }
    else if ((d -= HALF_Z * 2) < HALF_X * 2) { x = HALF_X - d; z = HALF_Z; nz = 1; }
    else { d -= HALF_X * 2; x = -HALF_X; z = HALF_Z - d; nx = -1; }
    const island = rand(seed + i + 50) > .62, out = island ? SHORE + 14 + rand(seed + i + 9) * 26 : 6 + rand(seed + i + 7) * (SHORE - 2);
    list.push({ x: x + nx * out, z: z + nz * out, h: 9 + rand(seed + i + 3) * (island ? 14 : 26), r: 7 + rand(seed + i + 5) * 9, island });
  }
  return list;
}

/** Moldura retangular (4 faixas) em volta de um retângulo interno. */
function Frame({ inner, width, y, color }: { inner: [number, number]; width: number; y: number; color: string }) {
  const [hx, hz] = inner, ox = hx + width, strips: [number, number, number, number][] = [
    [0, -(hz + width / 2), ox * 2, width], [0, hz + width / 2, ox * 2, width], [-(hx + width / 2), 0, width, hz * 2], [hx + width / 2, 0, width, hz * 2]];
  return <>{strips.map(([x, z, w, d], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]} raycast={() => null}>
    <planeGeometry args={[w, d]} /><meshStandardMaterial color={color} roughness={.95} />
  </mesh>)}</>;
}
export default function WorldHorizon({ region }: { region: string }) {
  const look = LOOK[region] ?? LOOK.aurora, ground = biomeOf(region)?.ground?.[0] ?? '#586b44';
  const motion = useGame(s => !s.settings.reduceMotion), low = useGame(s => s.settings.quality === 'low');
  const seed = useMemo(() => [...region].reduce((a, c) => a + c.charCodeAt(0), 0), [region]);
  const list = useMemo(() => peaks(seed), [seed]);
  const geometry = useMemo(() => new THREE.ConeGeometry(1, 1, 7, 1), []);
  const cap = useMemo(() => new THREE.ConeGeometry(1, 1, 7, 1), []);
  useEffect(() => () => { geometry.dispose(); cap.dispose(); }, [geometry, cap]);
  const sea = useRef<THREE.Mesh>(null);
  // Mar respirando: o brilho sobe e desce bem devagar.
  useFrame(({ clock }) => { const m = sea.current; if (!m || !motion) return; (m.material as THREE.MeshStandardMaterial).emissiveIntensity = .12 + Math.sin(clock.elapsedTime * .6) * .05; });
  return <group position={[0, 0, MID_Z]}>
    {/* Mar até o horizonte (abaixo do chão do mapa) */}
    <mesh ref={sea} rotation={[-Math.PI / 2, 0, 0]} position={[0, -.7, 0]} raycast={() => null} receiveShadow={false}>
      <planeGeometry args={[900, 900]} /><meshStandardMaterial color={look.sea} emissive={look.sea} emissiveIntensity={.12} roughness={.35} metalness={.15} />
    </mesh>
    {/* Faixa de terra e praia só em volta do mapa (moldura), nunca por baixo dele: evita o chão tremendo */}
    <Frame inner={[HALF_X, HALF_Z]} width={SHORE} y={-.08} color={ground} />
    <Frame inner={[HALF_X + SHORE, HALF_Z + SHORE]} width={5} y={-.3} color={look.shore} />
    {/* Montanhas e ilhas */}
    {(low ? list.filter((_, i) => i % 2 === 0) : list).map((p, i) => <group key={i} position={[p.x, p.island ? -.7 : -.1, p.z]}>
      <mesh geometry={geometry} position={[0, p.h / 2, 0]} scale={[p.r, p.h, p.r]} rotation={[0, i, 0]} raycast={() => null}><meshStandardMaterial color={look.rock} roughness={.95} flatShading /></mesh>
      {look.cap && p.h > 18 && <mesh geometry={cap} position={[0, p.h * .86, 0]} scale={[p.r * .32, p.h * .28, p.r * .32]} rotation={[0, i, 0]} raycast={() => null}><meshStandardMaterial color={look.cap} roughness={.8} flatShading /></mesh>}
    </group>)}
  </group>;
}
