"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/store';
import { nightness, regionWeather } from '@/lib/weather';

/** Sorteio fixo por índice. */
const rand = (n: number) => { const x = Math.sin(n * 78.233 + 12.9898) * 43758.5453; return x - Math.floor(x); };
let glowTex: THREE.DataTexture | null = null;
function glow() {
  if (glowTex) return glowTex;
  const n = 64, d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const r = Math.hypot(x - n / 2 + .5, y - n / 2 + .5) / (n / 2), a = r < .42 ? 1 : Math.max(0, 1 - (r - .42) / .58) ** 2.2 * .55; d.set([255, 255, 255, Math.round(a * 255)], (y * n + x) * 4); }
  glowTex = new THREE.DataTexture(d, n, n, THREE.RGBAFormat); glowTex.magFilter = glowTex.minFilter = THREE.LinearFilter; glowTex.needsUpdate = true; return glowTex;
}

/** 5.0: céu vivo. De dia: sol, nuvens e pássaros. De noite: estrelas piscando e a lua vermelha. Tudo acompanha a câmera, como o céu. */
export default function SkyLife({ light, region }: { light: number; region: string }) {
  const root = useRef<THREE.Group>(null), stars = useRef<THREE.Points>(null), clouds = useRef<THREE.Group>(null), birds = useRef<THREE.Group>(null);
  const sun = useRef<THREE.Sprite>(null), moon = useRef<THREE.Sprite>(null), moonHalo = useRef<THREE.Sprite>(null);
  const motion = useGame(s => !s.settings.reduceMotion), low = useGame(s => s.settings.quality === 'low');
  const night = nightness(light);
  const starGeo = useMemo(() => {
    const n = low ? 220 : 520, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = rand(i) * Math.PI * 2, e = .12 + rand(i + 900) * 1.35, r = 92; p.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g;
  }, [low]);
  useEffect(() => () => starGeo.dispose(), [starGeo]);
  const cloudList = useMemo(() => Array.from({ length: low ? 6 : 11 }, (_, i) => ({ a: rand(i + 40) * Math.PI * 2, r: 45 + rand(i + 60) * 35, y: 30 + rand(i + 80) * 14, s: 5 + rand(i + 20) * 7 })), [low]);

  useFrame(({ camera, clock }, dt) => {
    const g = root.current; if (!g) return; g.position.copy(camera.position);
    const t = clock.elapsedTime, weather = regionWeather(region), overcast = weather.kind === 'rain' ? weather.strength : weather.kind === 'snow' ? .5 : 0;
    // Estrelas: aparecem com a noite e piscam.
    if (stars.current) { const m = stars.current.material as THREE.PointsMaterial; m.opacity = night * (1 - overcast * .8) * (.75 + Math.sin(t * 2.3) * .08); stars.current.visible = m.opacity > .02; if (motion) stars.current.rotation.y += dt * .004; }
    // Lua vermelha (noite) e sol (dia).
    if (moon.current && moonHalo.current) { const o = night * (1 - overcast * .6); (moon.current.material as THREE.SpriteMaterial).opacity = o; (moonHalo.current.material as THREE.SpriteMaterial).opacity = o * (.45 + Math.sin(t * .8) * .08); moon.current.visible = moonHalo.current.visible = o > .02; }
    if (sun.current) { const o = (1 - night) * (1 - overcast * .85); (sun.current.material as THREE.SpriteMaterial).opacity = o * .95; sun.current.visible = o > .02; }
    // Nuvens: mais cinzas e cheias na chuva; à noite ficam escuras.
    if (clouds.current) { if (motion) clouds.current.rotation.y += dt * .006; const shade = new THREE.Color('#ffffff').lerp(new THREE.Color('#6d7484'), overcast).lerp(new THREE.Color('#1c2236'), night * .85);
      clouds.current.children.forEach(c => { const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial; m.color.copy(shade); m.opacity = .55 + overcast * .35; }); }
    // Pássaros: um bando cruza o céu de tempos em tempos, só de dia e sem chuva.
    if (birds.current) { const period = 38, k = (t % period) / 14, show = motion && night < .4 && overcast < .3 && k <= 1; birds.current.visible = show;
      if (show) { birds.current.position.set(-70 + k * 140, 24 + Math.sin(k * 3) * 2, -30 + k * 20); birds.current.children.forEach((b, i) => { const flap = Math.sin(t * 9 + i) * .5; b.children[0].rotation.z = flap; b.children[1].rotation.z = -flap; }); } }
  });

  return <group ref={root}>
    <points ref={stars} geometry={starGeo} raycast={() => null} renderOrder={-9}><pointsMaterial map={glow()} color="#fff6e0" size={1.1} sizeAttenuation transparent depthWrite={false} depthTest={false} fog={false} opacity={0} /></points>
    <sprite ref={moonHalo} position={[38, 46, -58]} scale={[30, 30, 1]} renderOrder={-8}><spriteMaterial map={glow()} color="#ff4a3a" transparent depthWrite={false} depthTest={false} fog={false} opacity={0} blending={THREE.AdditiveBlending} /></sprite>
    <sprite ref={moon} position={[38, 46, -58]} scale={[8, 8, 1]} renderOrder={-7}><spriteMaterial map={glow()} color="#ff6b52" transparent depthWrite={false} depthTest={false} fog={false} opacity={0} /></sprite>
    <sprite ref={sun} position={[-42, 58, 34]} scale={[18, 18, 1]} renderOrder={-8}><spriteMaterial map={glow()} color="#fff1c8" transparent depthWrite={false} depthTest={false} fog={false} opacity={0} blending={THREE.AdditiveBlending} /></sprite>
    <group ref={clouds}>{cloudList.map((c, i) => <mesh key={i} position={[Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r]} scale={[c.s * 2.2, c.s * .55, c.s * 1.3]} raycast={() => null} renderOrder={-6}>
      <sphereGeometry args={[1, 10, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={.6} depthWrite={false} fog={false} />
    </mesh>)}</group>
    <group ref={birds} visible={false}>{Array.from({ length: 7 }, (_, i) => <group key={i} position={[-(i % 4) * 1.6, (i % 3) * .5, (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.4]}>
      <mesh position={[-.35, 0, 0]} raycast={() => null}><boxGeometry args={[.7, .05, .18]} /><meshBasicMaterial color="#2a2a33" fog={false} /></mesh>
      <mesh position={[.35, 0, 0]} raycast={() => null}><boxGeometry args={[.7, .05, .18]} /><meshBasicMaterial color="#2a2a33" fog={false} /></mesh>
    </group>)}</group>
  </group>;
}
