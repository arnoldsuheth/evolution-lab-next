"use client";
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/store';

type Mood = { color: string; count: number; size: number; fall: number; drift: number; wobble: number; glow: boolean; nightBoost?: boolean; opacity: number };
/** 5.0: clima de cada região (partículas em volta do herói). fall < 0 sobe (brasas). */
export const REGION_MOOD: Record<string, Mood> = {
  aurora: { color: '#fff3c0', count: 90, size: 0.34, fall: .12, drift: .35, wobble: .5, glow: true, opacity: .8 },
  bosque: { color: '#d8ff7a', count: 90, size: 0.37, fall: 0, drift: .25, wobble: 1.1, glow: true, nightBoost: true, opacity: .9 },
  'iron-forge': { color: '#ffffff', count: 160, size: 0.28, fall: 1.1, drift: .4, wobble: .6, glow: false, opacity: .9 },
  gnomolandia: { color: '#8fdcff', count: 80, size: 0.25, fall: -.15, drift: .2, wobble: 1.4, glow: true, opacity: .85 },
  ogrimmar: { color: '#ff9a4a', count: 110, size: 0.23, fall: -.7, drift: .3, wobble: .9, glow: true, opacity: .9 },
  ruins: { color: '#d9c7a2', count: 90, size: 0.16, fall: .05, drift: .55, wobble: .4, glow: false, opacity: .55 },
  frontier: { color: '#d08a3c', count: 55, size: 0.37, fall: .55, drift: .6, wobble: 1.6, glow: false, opacity: .85 },
  heart: { color: '#b48cff', count: 120, size: 0.28, fall: -.25, drift: .3, wobble: 1.2, glow: true, opacity: .9 },
  goddard: { color: '#fff1c4', count: 50, size: 0.21, fall: -.08, drift: .2, wobble: .8, glow: true, opacity: .7 },
};
const BOX = { x: 26, y: 9, z: 26 };
/** Sorteio fixo por índice (mesmo resultado a cada desenho). */
const rand = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let dot: THREE.DataTexture | null = null;
function dotTexture() {
  if (dot) return dot;
  const n = 32, data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x - n / 2 + .5, y - n / 2 + .5) / (n / 2), a = Math.max(0, 1 - d) ** 2; data.set([255, 255, 255, Math.round(a * 255)], (y * n + x) * 4); }
  dot = new THREE.DataTexture(data, n, n, THREE.RGBAFormat); dot.magFilter = dot.minFilter = THREE.LinearFilter; dot.needsUpdate = true; return dot;
}

export default function RegionParticles({ region, center, light }: { region: string; center: RefObject<THREE.Vector3>; light: number }) {
  const mood = REGION_MOOD[region], low = useGame(s => s.settings.quality === 'low'), reduced = useGame(s => s.settings.reduceMotion);
  const count = mood ? (low ? Math.round(mood.count * .4) : mood.count) : 0;
  const { geometry, seeds } = useMemo(() => {
    const g = new THREE.BufferGeometry(), p = new Float32Array(count * 3), seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { p[i * 3] = (rand(i) - .5) * BOX.x; p[i * 3 + 1] = rand(i + 1e3) * BOX.y; p[i * 3 + 2] = (rand(i + 2e3) - .5) * BOX.z; seeds[i * 3] = rand(i + 3e3) * 6.28; seeds[i * 3 + 1] = .6 + rand(i + 4e3) * .8; seeds[i * 3 + 2] = rand(i + 5e3) * 6.28; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return { geometry: g, seeds };
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const points = useRef<THREE.Points>(null);
  useFrame(({ clock }, dt) => {
    const pts = points.current; if (!pts || !mood) return;
    pts.position.set(center.current.x, 0, center.current.z);
    const material = pts.material as THREE.PointsMaterial;
    material.opacity = mood.opacity * (mood.nightBoost ? .35 + (1 - light) * .65 : 1);
    if (reduced) return;
    const pos = geometry.getAttribute('position') as THREE.BufferAttribute, a = pos.array as Float32Array, t = clock.elapsedTime, step = Math.min(dt, .05);
    for (let i = 0; i < count; i++) {
      const k = i * 3, s = seeds[k + 1];
      a[k] += (Math.sin(t * mood.wobble * s + seeds[k]) * mood.drift + mood.drift * .3) * step;
      a[k + 1] -= mood.fall * s * step; a[k + 1] += Math.sin(t * 1.3 * s + seeds[k + 2]) * .08 * step * mood.wobble;
      a[k + 2] += Math.cos(t * mood.wobble * .8 * s + seeds[k + 2]) * mood.drift * step;
      // Reaparece do outro lado ao sair da caixa em volta do herói.
      if (a[k + 1] < 0) a[k + 1] += BOX.y; else if (a[k + 1] > BOX.y) a[k + 1] -= BOX.y;
      if (a[k] > BOX.x / 2) a[k] -= BOX.x; else if (a[k] < -BOX.x / 2) a[k] += BOX.x;
      if (a[k + 2] > BOX.z / 2) a[k + 2] -= BOX.z; else if (a[k + 2] < -BOX.z / 2) a[k + 2] += BOX.z;
    }
    pos.needsUpdate = true;
  });
  if (!mood || count === 0) return null;
  return <points ref={points} geometry={geometry} frustumCulled={false} raycast={() => null}>
    <pointsMaterial map={dotTexture()} color={mood.color} size={mood.size} sizeAttenuation transparent depthWrite={false} opacity={mood.opacity} blending={mood.glow ? THREE.AdditiveBlending : THREE.NormalBlending} />
  </points>;
}
