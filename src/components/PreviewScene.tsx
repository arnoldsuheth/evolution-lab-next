"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Prévia dos personagens e da natureza novos (pacotes CC0 do Quaternius).
 * Não faz parte do jogo: serve só para o Arnold aprovar o visual antes da troca.
 */
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/models/previa';
const C = (n: string) => `${base}/chars/${n}.glb`, N = (n: string) => `${base}/nature/${n}.glb`;

export type Hero = {
  name: string; outfit: 'Male_Ranger' | 'Female_Ranger' | 'Male_Peasant' | 'Female_Peasant';
  hair?: string; brows: 'Eyebrows_Regular' | 'Eyebrows_Female'; beard?: boolean;
  skin: string; hairColor: string; tint?: string; x: number; z: number; turn: number;
};
export const PREVIEW_HEROES: Hero[] = [
  { name: 'Guerreiro', outfit: 'Male_Ranger', hair: 'Hair_SimpleParted', brows: 'Eyebrows_Regular', beard: true, skin: '#ffffff', hairColor: '#4a2e1c', x: -2.4, z: 0, turn: .35 },
  { name: 'Caçadora', outfit: 'Female_Ranger', hair: 'Hair_Long', brows: 'Eyebrows_Female', skin: '#ffffff', hairColor: '#b8692f', x: -.8, z: .6, turn: .15 },
  { name: 'Shaman', outfit: 'Male_Peasant', hair: 'Hair_Buzzed', brows: 'Eyebrows_Regular', beard: true, skin: '#ffffff', hairColor: '#1f1a17', x: .8, z: .6, turn: -.15 },
  { name: 'Maga', outfit: 'Female_Peasant', hair: 'Hair_Buns', brows: 'Eyebrows_Female', skin: '#ffffff', hairColor: '#2a1a14', x: 2.4, z: 0, turn: -.35 },
];
export const PREVIEW_MOVES = { Idle_Loop: 'Parado', Walk_Loop: 'Andar', Jog_Fwd_Loop: 'Correr', Sword_Attack: 'Espada', Spell_Simple_Shoot: 'Magia', Punch_Jab: 'Soco', Dance_Loop: 'Dança' } as const;
export type Move = keyof typeof PREVIEW_MOVES;

/** Só a cabeça do corpo base: triângulos presos ao osso da cabeça ou do pescoço. */
function headOnly(mesh: THREE.SkinnedMesh) {
  const keep = new Set(mesh.skeleton.bones.map((b, i) => (/^(Head|neck_01)$/.test(b.name) ? i : -1)).filter(i => i >= 0));
  const g = mesh.geometry.clone(), idx = g.index!, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const main = (v: number) => { let best = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(v, k); if (x > w) { w = x; best = si.getComponent(v, k); } } return best; };
  const out: number[] = [];
  for (let t = 0; t < idx.count; t += 3) { const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2); if (keep.has(main(a)) && keep.has(main(b)) && keep.has(main(c))) out.push(a, b, c); }
  g.setIndex(out); mesh.geometry = g;
}

function tintMaterial(m: THREE.Material, color: string) {
  const c = (m as THREE.MeshStandardMaterial).clone(); c.color = new THREE.Color(color); return c;
}

function Character({ hero, move }: { hero: Hero; move: Move }) {
  const outfit = useGLTF(C(hero.outfit)), body = useGLTF(C(hero.outfit.startsWith('Female') ? 'Superhero_Female_FullBody' : 'Superhero_Male_FullBody'));
  const hair = useGLTF(C(hero.hair ?? 'Hair_Buzzed')), brows = useGLTF(C(hero.brows)), beard = useGLTF(C('Hair_Beard')), anims = useGLTF(C('UAL1'));
  const root = useMemo(() => {
    const scene = cloneSkinned(outfit.scene) as THREE.Group, bones: Record<string, THREE.Bone> = {};
    scene.traverse(o => { if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone; });
    // Pele das partes de roupa que mostram braço/perna recebe a cor escolhida.
    scene.traverse(o => { const m = o as THREE.SkinnedMesh; if (m.isSkinnedMesh && /Regular|skin/i.test((m.material as THREE.Material).name)) m.material = tintMaterial(m.material as THREE.Material, hero.skin); });
    const attach = (src: THREE.Object3D, edit?: (m: THREE.SkinnedMesh) => void) => {
      const copy = cloneSkinned(src);
      copy.traverse(o => {
        const m = o as THREE.SkinnedMesh; if (!m.isSkinnedMesh) return;
        edit?.(m);
        const skel = new THREE.Skeleton(m.skeleton.bones.map(b => bones[b.name] ?? b), m.skeleton.boneInverses);
        const mesh = new THREE.SkinnedMesh(m.geometry, m.material); mesh.name = m.name; mesh.frustumCulled = false; mesh.castShadow = true;
        mesh.bind(skel, m.bindMatrix); scene.add(mesh);
      });
    };
    attach(body.scene, m => { if (/superhero/i.test(m.name)) { headOnly(m); m.material = tintMaterial(m.material as THREE.Material, hero.skin); } });
    if (hero.hair) attach(hair.scene, m => { m.material = tintMaterial(m.material as THREE.Material, hero.hairColor); });
    attach(brows.scene, m => { m.material = tintMaterial(m.material as THREE.Material, hero.hairColor); });
    if (hero.beard) attach(beard.scene, m => { m.material = tintMaterial(m.material as THREE.Material, hero.hairColor); });
    scene.traverse(o => { o.castShadow = true; if ((o as THREE.Mesh).isMesh) o.frustumCulled = false; });
    return scene;
  }, [outfit.scene, body.scene, hair.scene, brows.scene, beard.scene, hero]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  useEffect(() => {
    const clip = anims.animations.find(a => a.name === move) ?? anims.animations.find(a => a.name === 'Idle_Loop');
    if (!clip) return;
    const action = mixer.clipAction(clip); action.reset().fadeIn(.25).play();
    if (!/Loop/.test(move)) { action.setLoop(THREE.LoopRepeat, Infinity); }
    return () => { action.fadeOut(.25); };
  }, [mixer, anims.animations, move]);
  useFrame((_, dt) => mixer.update(dt));
  return <group position={[hero.x, 0, hero.z]} rotation={[0, hero.turn, 0]}><primitive object={root} /></group>;
}

/** Personagens prontos (corpo, cabelo e roupa juntos): elfos e orcs do kit Fantasy Races. */
export const PREVIEW_RACES = [
  { name: 'Elfa', file: 'Elf_Female', x: -2.4, z: -2.2, turn: .3 }, { name: 'Elfo', file: 'Elf_Male', x: -.8, z: -2, turn: .1 },
  { name: 'Orc', file: 'Orc_Male', x: .8, z: -2, turn: -.1 }, { name: 'Orca', file: 'Orc_Female', x: 2.4, z: -2.2, turn: -.3 },
];
/** Pacote antigo Ultimate Modular Women: modelos low-poly com animações próprias. */
export const PREVIEW_LOWPOLY = [
  { name: 'Bruxa', file: 'W_Witch', x: -2.4, z: 2.6, turn: .3 }, { name: 'Medieval', file: 'W_Medieval', x: -.8, z: 2.9, turn: .1 },
  { name: 'Aventureira', file: 'W_Adventurer', x: .8, z: 2.9, turn: -.1 }, { name: 'Trabalhadora', file: 'W_Worker', x: 2.4, z: 2.6, turn: -.3 },
];
const OWN: Record<Move, string> = { Idle_Loop: 'Idle', Walk_Loop: 'Walk', Jog_Fwd_Loop: 'Run', Sword_Attack: 'Sword_Slash', Spell_Simple_Shoot: 'Interact', Punch_Jab: 'Punch_Right', Dance_Loop: 'Wave' };
function Ready({ file, x, z, turn, move, own }: { file: string; x: number; z: number; turn: number; move: Move; own?: boolean }) {
  const g = useGLTF(C(file)), lib = useGLTF(C('UAL1')), anims = own ? { animations: g.animations } : lib;
  const root = useMemo(() => { const c = cloneSkinned(g.scene) as THREE.Group; c.traverse(o => { o.castShadow = true; o.frustumCulled = false; }); return c; }, [g.scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  useEffect(() => {
    const clip = anims.animations.find(a => a.name === (own ? OWN[move] : move)); if (!clip) return;
    const action = mixer.clipAction(clip); action.reset().fadeIn(.25).play(); return () => { action.fadeOut(.25); };
  }, [mixer, anims.animations, move, own]);
  useFrame((_, dt) => mixer.update(dt));
  return <group position={[x, 0, z]} rotation={[0, turn, 0]}><primitive object={root} /></group>;
}

const PLANTS: [string, number, number, number, number][] = [
  ['CommonTree_1', -7, -7, 1, 0], ['CommonTree_3', 7, -8, .9, 1], ['CommonTree_5', -10, -2, .9, 2], ['Pine_1', 10, -3, 1, 0], ['Pine_3', -4, -12, 1.1, 1],
  ['TwistedTree_1', 3, -13, .5, 2], ['Bush_Common', -4.5, -3, 1, 0], ['Bush_Common_Flowers', 4.5, -3.5, 1, 1], ['Fern_1', -4.4, 1.6, 1, 0], ['Fern_1', 4.6, 1.4, 1, 2],
  ['Flower_3_Group', -4.6, 4.4, .35, 0], ['Flower_4_Group', 4.6, 4.2, .35, 1], ['Rock_Medium_1', -6.5, 1.5, .6, 0], ['Rock_Medium_2', 6.5, 1, .6, 1], ['Mushroom_Common', -5, -4.5, 1, 0],
  ['Plant_1', 5.5, -5, 1, 0], ['Grass_Common_Tall', -2.5, -2.4, .4, 0], ['Grass_Common_Tall', 2.4, -2, .4, 1], ['Grass_Wispy_Tall', 0, -3.5, .4, 0], ['Grass_Wispy_Tall', -6, 3.5, .4, 2],
  ['Flower_3_Group', 1, -2.8, .3, 2], ['Flower_4_Group', -1.2, -3, .3, 0],
];
function Plant({ name, x, z, s, r }: { name: string; x: number; z: number; s: number; r: number }) {
  const g = useGLTF(N(name)); const obj = useMemo(() => { const c = g.scene.clone(); c.traverse(o => { o.castShadow = true; o.receiveShadow = true; }); return c; }, [g.scene]);
  return <primitive object={obj} position={[x, 0, z]} scale={s} rotation={[0, r * 2.1, 0]} />;
}

export default function PreviewScene({ move }: { move: Move }) {
  return <Canvas shadows camera={{ position: [0, 3.6, 10.5], fov: 44 }} dpr={[1, 2]} gl={{ antialias: true }}>
    <color attach="background" args={['#a9d4ef']} />
    <fog attach="fog" args={['#a9d4ef', 14, 30]} />
    <hemisphereLight args={['#fff6e0', '#4c6b3a', 1.6]} />
    <directionalLight position={[6, 10, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[30, 48]} /><meshStandardMaterial color="#7fae52" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, .4]} receiveShadow><planeGeometry args={[7.5, 7.5]} /><meshStandardMaterial color="#c9a774" roughness={1} /></mesh>
    <Suspense fallback={null}>
      {PLANTS.map(([n, x, z, s, r], i) => <Plant key={i} name={n} x={x} z={z} s={s} r={r} />)}
      {PREVIEW_HEROES.map(h => <Character key={h.name} hero={h} move={move} />)}
      {PREVIEW_RACES.map(r => <Ready key={r.name} {...r} move={move} />)}
      {PREVIEW_LOWPOLY.map(r => <Ready key={r.name} {...r} move={move} own />)}
    </Suspense>
    <OrbitControls target={[0, 1, 0]} minDistance={3} maxDistance={16} maxPolarAngle={1.45} />
  </Canvas>;
}
