"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/store';
import { regionWeather } from '@/lib/weather';

const rand = (n: number) => { const x = Math.sin(n * 12.9898 + 4.1414) * 43758.5453; return x - Math.floor(x); };
const W = 46, H = 20;

/** 5.0: chuva caindo no mundo (traços finos inclinados pelo vento), só quando a região está chovendo. */
export default function RainField({ region }: { region: string }) {
  const low = useGame(s => s.settings.quality === 'low'), motion = useGame(s => !s.settings.reduceMotion);
  const n = low ? 260 : 700;
  const geometry = useMemo(() => {
    const p = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) { const x = (rand(i) - .5) * W, y = rand(i + 7e3) * H, z = (rand(i + 9e3) - .5) * W; p.set([x, y, z, x + .12, y - .9, z + .05], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, [n]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const lines = useRef<THREE.LineSegments>(null), strength = useRef(0);
  useFrame(({ camera }, dt) => {
    const l = lines.current; if (!l) return;
    const w = regionWeather(region); strength.current += ((w.kind === 'rain' ? w.strength : 0) - strength.current) * Math.min(1, dt * .8);
    const s = strength.current; l.visible = s > .02; if (!l.visible) return;
    (l.material as THREE.LineBasicMaterial).opacity = .38 * s; l.position.set(camera.position.x, 0, camera.position.z);
    if (!motion) return;
    const a = (geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array, fall = Math.min(dt, .05) * 22;
    for (let i = 0; i < n; i++) { const k = i * 6; a[k + 1] -= fall; a[k + 4] -= fall; a[k] += fall * .12; a[k + 3] += fall * .12;
      if (a[k + 4] < 0) { a[k + 1] += H; a[k + 4] += H; a[k] -= .12 * H; a[k + 3] -= .12 * H; } }
    geometry.getAttribute('position').needsUpdate = true;
  });
  return <lineSegments ref={lines} geometry={geometry} frustumCulled={false} raycast={() => null} visible={false}>
    <lineBasicMaterial color="#cfe3ff" transparent opacity={0} depthWrite={false} />
  </lineSegments>;
}
