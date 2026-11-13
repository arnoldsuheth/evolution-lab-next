"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/store';

/** Mancha macia (centro escuro, borda transparente), feita uma vez e dividida por todos. */
let blob: THREE.DataTexture | null = null;
function blobTexture() {
  if (blob) return blob;
  const n = 64, data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x - n / 2 + .5, y - n / 2 + .5) / (n / 2), a = Math.max(0, 1 - d) ** 1.6;
    data.set([0, 0, 0, Math.round(a * 255)], (y * n + x) * 4);
  }
  blob = new THREE.DataTexture(data, n, n, THREE.RGBAFormat); blob.magFilter = blob.minFilter = THREE.LinearFilter; blob.needsUpdate = true;
  return blob;
}

/** 5.0: sombra de contato. Firma o personagem no chão mesmo sem sombra projetada (barata: um plano). */
export function ContactShadow({ radius = .9, opacity = .38 }: { radius?: number; opacity?: number }) {
  const map = useMemo(() => blobTexture(), []);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .028, 0]} raycast={() => null} renderOrder={1}>
    <planeGeometry args={[radius * 2, radius * 2]} /><meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} />
  </mesh>;
}

const RANK = {
  elite: { color: '#ff9a3c', glow: '#ffcf8a', radius: 1.25 },
  rare: { color: '#f2c14e', glow: '#fff1c4', radius: 1.35 },
  boss: { color: '#a061ff', glow: '#ff5c7a', radius: 1.9 },
} as const;

/** 5.0: marca de perigo no chão. Elite = selo laranja; raro = anel dourado com brilhos; chefe = runas, coluna de luz e brasas. */
export function RankAura({ rank }: { rank: keyof typeof RANK }) {
  const look = RANK[rank], root = useRef<THREE.Group>(null), motion = useGame(s => !s.settings.reduceMotion);
  const ring = useMemo(() => new THREE.RingGeometry(look.radius * .78, look.radius, 48, 1), [look.radius]);
  const ticks = useMemo(() => new THREE.RingGeometry(look.radius * 1.04, look.radius * 1.12, 24, 1, 0, Math.PI * 2), [look.radius]);
  useEffect(() => () => { ring.dispose(); ticks.dispose(); }, [ring, ticks]);
  useFrame(({ clock }) => {
    const g = root.current; if (!g || !motion) return; const t = clock.elapsedTime;
    g.children[0].rotation.z = t * .6; g.children[1].rotation.z = -t * .35;
    const pulse = .5 + .5 * Math.sin(t * 2.4);
    ((g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = .35 + pulse * .3;
    for (let i = 3; i < g.children.length; i++) { const e = g.children[i], k = (t * .45 + i * .23) % 1; e.position.y = .2 + k * 2.6; e.scale.setScalar(1 - k * .7); }
  });
  return <group ref={root}>
    <mesh geometry={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, .045, 0]} raycast={() => null}><meshBasicMaterial color={look.color} transparent opacity={.5} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    <mesh geometry={ticks} rotation={[-Math.PI / 2, 0, 0]} position={[0, .046, 0]} raycast={() => null}><meshBasicMaterial color={look.glow} transparent opacity={.35} depthWrite={false} blending={THREE.AdditiveBlending} wireframe /></mesh>
    {rank === 'boss' ? <mesh position={[0, 1.6, 0]} raycast={() => null}><cylinderGeometry args={[look.radius * .85, look.radius, 3.2, 24, 1, true]} /><meshBasicMaterial color={look.color} transparent opacity={.1} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} /></mesh> : <group />}
    {(rank === 'elite' ? [] : Array.from({ length: rank === 'boss' ? 10 : 6 }, (_, i) => i)).map(i => <mesh key={i} position={[Math.cos(i * 2.4) * look.radius * .7, .3, Math.sin(i * 2.4) * look.radius * .7]} raycast={() => null}>
      <sphereGeometry args={[.06, 6, 5]} /><meshBasicMaterial color={rank === 'boss' ? look.glow : look.color} transparent opacity={.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>)}
  </group>;
}
