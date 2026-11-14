"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import VillageHouse from './VillageHouse';

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

/** Uma classe de cada, só com o grátis: peças das 2 roupas misturadas, cores, raças e armas. */
type Part = [string, RegExp];
type Weapon = 'sword' | 'axe' | 'shield' | 'pickaxe' | 'staff' | 'wand' | 'bow' | 'dagger';
type ClassLook = { name: string; race: string; female: boolean; body?: string; parts: Part[]; tint: string; skin?: string; hair?: string; beard?: boolean; hairColor: string; right?: Weapon; left?: Weapon; gem?: string; halo?: boolean; scale?: number };
const MR = 'Male_Ranger', MP = 'Male_Peasant', FR = 'Female_Ranger', FP = 'Female_Peasant';
export const PREVIEW_CLASSES: ClassLook[] = [
  { name: 'Paladino', race: 'Humano', female: false, parts: [[MP, /Body|Legs|Arms/], [MR, /Pauldron|Feet/]], tint: '#b9c6e0', hair: 'Hair_SimpleParted', beard: true, hairColor: '#c99a45', right: 'sword', left: 'shield' },
  { name: 'Guerreiro', race: 'Orc', female: false, body: 'Orc_Male', skin: '#86a85c', parts: [[MP, /Body|Legs|Arms|Feet/], [MR, /Pauldron/]], tint: '#c27a5c', hairColor: '#1f1a17', right: 'axe' },
  { name: 'Caçador', race: 'Elfo', female: false, body: 'Elf_Male', skin: '#ffe6d2', parts: [[MR, /.*/]], tint: '#ffffff', hairColor: '#e8d7a8', left: 'bow' },
  { name: 'Maga', race: 'Humana', female: true, parts: [[FP, /Body|Legs|Arms|Feet/], [FR, /Hood/]], tint: '#a48fe6', hair: 'Hair_Long', hairColor: '#e8c070', right: 'staff', gem: '#6fc8ff' },
  { name: 'Profeta', race: 'Elfa', female: true, body: 'Elf_Female', skin: '#ffe6d2', parts: [[FP, /Body|Legs|Arms|Feet/], [FR, /Belt/]], tint: '#f2e3b8', hairColor: '#f3ead2', right: 'wand', gem: '#ffd76a', halo: true },
  { name: 'Shaman', race: 'Orc', female: true, body: 'Orc_Female', skin: '#86a85c', parts: [[FP, /Body|Legs|Arms/], [FR, /Belt|Feet|Bracer/]], tint: '#a9bd84', hairColor: '#1f1a17', right: 'staff', gem: '#7dff9a' },
  { name: 'Engenheiro', race: 'Anão (provisório)', female: false, scale: .84, parts: [[MP, /Body|Legs|Arms/], [MR, /Feet/]], tint: '#d6a25c', hair: 'Hair_Buzzed', beard: true, hairColor: '#8a4a22', right: 'pickaxe' },
  { name: 'Hacker', race: 'Elfa', female: true, body: 'Elf_Female', skin: '#ffe6d2', parts: [[FR, /^(?!.*Pauldron).*/]], tint: '#7d6bb5', hairColor: '#2a2050', right: 'dagger', left: 'dagger' },
  { name: 'Duelista', race: 'Elfo', female: false, body: 'Elf_Male', skin: '#ffe6d2', parts: [[MR, /^(?!.*Hood).*/]], tint: '#d77a7a', hairColor: '#e8d7a8', right: 'sword', left: 'dagger' },
];
const PROP = (n: string) => `${base}/props/${n}.glb`;
const lighter = (m: THREE.Material, c: string) => { const t = (m as THREE.MeshStandardMaterial).clone(); t.color = new THREE.Color(c).multiplyScalar(1.7); return t; };

/** Arma pronta (do pacote de objetos) ou feita aqui (cajado, varinha, arco, adaga). */
function weaponMesh(kind: Weapon, props: Record<string, THREE.Group>, gem = '#6fc8ff'): THREE.Object3D {
  const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, ...extra });
  const g = new THREE.Group();
  if (kind === 'sword') { const s = props.Sword_Bronze.clone(); s.scale.setScalar(.85); g.add(s); }
  if (kind === 'axe') { const s = props.Axe_Bronze.clone(); s.rotation.z = Math.PI / 2; s.position.y = .35; g.add(s); }
  if (kind === 'pickaxe') { const s = props.Pickaxe_Bronze.clone(); s.scale.setScalar(.8); g.add(s); }
  if (kind === 'shield') { const s = props.Shield_Wooden.clone(); s.scale.setScalar(.9); g.add(s); }
  if (kind === 'dagger') { const blade = new THREE.Mesh(new THREE.ConeGeometry(.035, .32, 4), std('#c9d2de', { metalness: .8, roughness: .25 })); blade.position.y = .24; const grip = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .12, 6), std('#3a2a20')); g.add(blade, grip); }
  if (kind === 'staff' || kind === 'wand') {
    const long = kind === 'staff', h = long ? 1.6 : .42;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(long ? .025 : .015, long ? .03 : .012, h, 7), std('#6b4a2e')); rod.position.y = long ? .45 : h / 2;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(long ? .08 : .035, 0), std(gem, { emissive: gem, emissiveIntensity: 1.4 })); orb.position.y = rod.position.y + h / 2 + .05;
    g.add(rod, orb);
  }
  if (kind === 'bow') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.55, .02, 6, 24, Math.PI * .8), std('#7a5230')); arc.rotation.z = Math.PI / 2 + Math.PI * .1; arc.position.x = -.12;
    const string = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, 1.05, 4), std('#e9e2cf')); string.position.x = .3;
    g.add(arc, string);
  }
  g.traverse(o => { o.castShadow = true; });
  return g;
}

export type Tier = 0 | 1 | 2;
export const TIER_NAMES = ['Comum', 'Raro', 'Épico'];
function ClassHero({ look, x, z, turn, move, tier }: { look: ClassLook; x: number; z: number; turn: number; move: Move; tier: Tier }) {
  const mr = useGLTF(C(MR)), mp = useGLTF(C(MP)), fr = useGLTF(C(FR)), fp = useGLTF(C(FP));
  const body = useGLTF(C(look.body ?? (look.female ? 'Superhero_Female_FullBody' : 'Superhero_Male_FullBody')));
  const hair = useGLTF(C(look.hair ?? 'Hair_Buzzed')), brows = useGLTF(C(look.female ? 'Eyebrows_Female' : 'Eyebrows_Regular')), beard = useGLTF(C('Hair_Beard')), anims = useGLTF(C('UAL1'));
  const sword = useGLTF(PROP('Sword_Bronze')), axe = useGLTF(PROP('Axe_Bronze')), shield = useGLTF(PROP('Shield_Wooden')), pick = useGLTF(PROP('Pickaxe_Bronze'));
  const root = useMemo(() => {
    const outfits: Record<string, THREE.Group> = { [MR]: mr.scene, [MP]: mp.scene, [FR]: fr.scene, [FP]: fp.scene };
    const props: Record<string, THREE.Group> = { Sword_Bronze: sword.scene, Axe_Bronze: axe.scene, Shield_Wooden: shield.scene, Pickaxe_Bronze: pick.scene };
    const scene = cloneSkinned(outfits[look.parts[0][0]]) as THREE.Group, bones: Record<string, THREE.Bone> = {};
    scene.traverse(o => { if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone; });
    const drop: THREE.Object3D[] = []; scene.traverse(o => { if ((o as THREE.Mesh).isMesh) drop.push(o); }); drop.forEach(o => o.removeFromParent());
    const paint = (m: THREE.SkinnedMesh) => { const mats = (Array.isArray(m.material) ? m.material : [m.material]).map(mt => { if (/Regular/.test(mt.name)) return look.skin ? tintMaterial(mt, look.skin) : mt; const c = lighter(mt, look.tint) as THREE.MeshStandardMaterial; if (tier > 0) { c.metalness = tier === 2 ? .55 : .3; c.roughness = tier === 2 ? .35 : .5; c.emissive = new THREE.Color(look.gem ?? look.tint); c.emissiveIntensity = tier === 2 ? .18 : .06; } return c; }); m.material = Array.isArray(m.material) ? mats : mats[0]; };
    const attach = (src: THREE.Object3D, keep: (m: THREE.SkinnedMesh) => boolean, edit?: (m: THREE.SkinnedMesh) => void) => {
      cloneSkinned(src).traverse(o => { const m = o as THREE.SkinnedMesh; if (!m.isSkinnedMesh || !keep(m)) return; edit?.(m);
        const mesh = new THREE.SkinnedMesh(m.geometry, m.material); mesh.name = m.name; mesh.frustumCulled = false; mesh.castShadow = true;
        mesh.bind(new THREE.Skeleton(m.skeleton.bones.map(b => bones[b.name] ?? b), m.skeleton.boneInverses), m.bindMatrix); scene.add(mesh); });
    };
    const seen = new Set<string>();
    for (const [file, re] of look.parts) attach(outfits[file], m => { const kind = m.name.replace(/^(Male|Female)_(Ranger|Peasant)_/, '').replace(/_.*$/, ''); const ok = re.test(m.name) && (!seen.has(kind) || /Acc|Belt|Bracer|Hood/.test(m.name)); if (ok) seen.add(kind); return ok; }, paint);
    const hairTint = (m: THREE.SkinnedMesh) => { m.material = tintMaterial(m.material as THREE.Material, look.hairColor); };
    attach(body.scene, () => true, m => { if (/body|superhero/i.test(m.name)) { headOnly(m); if (look.skin && look.body) m.material = tintMaterial(m.material as THREE.Material, look.skin); } else if (/hair|horns/i.test(m.name)) hairTint(m); });
    if (!look.body) { if (look.hair) attach(hair.scene, () => true, hairTint); attach(brows.scene, () => true, hairTint); if (look.beard) attach(beard.scene, () => true, hairTint); }
    // Mão: o osso aponta para os dedos (X). A arma fica de pé quando a mão está fechada.
    const hold = (kind: Weapon, bone: string, side: number) => { const hand = bones[bone]; if (!hand) return; const holder = new THREE.Group(); holder.position.set(side * .09, side * .03, 0); const r = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('rot')?.split(',').map(Number) : null; if (r) holder.rotation.set(r[0], r[1] * side, r[2] * side); else holder.rotation.set(0, 0, Math.PI); holder.add(weaponMesh(kind, props, look.gem)); hand.add(holder); };
    if (look.right) hold(look.right, 'hand_r', 1);
    if (look.left) hold(look.left, 'hand_l', -1);
    // Peças extras por nível: Raro ganha ombreiras de metal e capa; Épico ganha gema brilhante no peito, coroa/elmo e aura.
    const accent = look.gem ?? look.tint, metal = new THREE.MeshStandardMaterial({ color: tier === 2 ? '#e8c76a' : '#b8c0cc', metalness: .85, roughness: .3, emissive: tier === 2 ? '#7a5a10' : '#000000', emissiveIntensity: .4 });
    if (tier >= 1) {
      for (const [bone, side] of [['upperarm_r', 1], ['upperarm_l', -1]] as const) { const plate = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal); plate.scale.set(1, .7, 1.1); plate.rotation.z = -side * Math.PI / 2; plate.position.set(.05, 0, 0); bones[bone]?.add(plate); }
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(.5, 1.05, 1, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color(look.tint).multiplyScalar(.8), side: THREE.DoubleSide, roughness: .8, emissive: tier === 2 ? accent : '#000000', emissiveIntensity: tier === 2 ? .12 : 0 }));
      const pos = cape.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, -Math.pow((.52 - y) / 1.05, 2) * .25); } pos.needsUpdate = true;
      const capeHolder = new THREE.Group(); capeHolder.add(cape); cape.position.y = -.5; bones.spine_03?.add(capeHolder); capeHolder.position.set(.05, -.12, 0); capeHolder.rotation.set(0, Math.PI / 2, Math.PI / 2);
    }
    if (tier === 2) {
      const gemMesh = new THREE.Mesh(new THREE.OctahedronGeometry(.05), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.2 })); gemMesh.position.set(.08, .12, 0); bones.spine_03?.add(gemMesh);
      const crown = new THREE.Mesh(new THREE.TorusGeometry(.115, .02, 6, 24), metal); crown.rotation.x = Math.PI / 2; crown.position.set(0, .2, 0); if (!look.halo) bones.Head?.add(crown);
      const aura = new THREE.Mesh(new THREE.RingGeometry(.45, .62, 40), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); aura.rotation.x = -Math.PI / 2; aura.position.y = .03; aura.name = 'aura'; scene.add(aura);
    }
    if (look.halo) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .016, 8, 32), new THREE.MeshStandardMaterial({ color: '#ffe7a3', emissive: '#ffc94a', emissiveIntensity: 1.5 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, .3, 0); bones.Head?.add(ring); }
    scene.traverse(o => { o.castShadow = true; if ((o as THREE.Mesh).isMesh) o.frustumCulled = false; });
    if (look.scale) scene.scale.setScalar(look.scale);
    return scene;
  }, [mr.scene, mp.scene, fr.scene, fp.scene, body.scene, hair.scene, brows.scene, beard.scene, sword.scene, axe.scene, shield.scene, pick.scene, look, tier]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  useEffect(() => { const clip = anims.animations.find(a => a.name === move); if (!clip) return; const a = mixer.clipAction(clip); a.reset().fadeIn(.25).play(); return () => { a.fadeOut(.25); }; }, [mixer, anims.animations, move]);
  useFrame((_, dt) => mixer.update(dt));
  return <group position={[x, 0, z]} rotation={[0, turn, 0]}><primitive object={root} /></group>;
}

export const PREVIEW_MONSTERS = [{ name: 'Imp', file: 'M_Imp', x: -1.4, z: -3.2, turn: .4 }, { name: 'Puglin', file: 'M_Puglin', x: 1.4, z: -3.2, turn: -.4 }];

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

export default function PreviewScene({ move, classes = false, tier = 0 }: { move: Move; classes?: boolean; tier?: Tier }) {
  return <Canvas shadows camera={{ position: [0, 3.6, 10.5], fov: 44 }} dpr={[1, 2]} gl={{ antialias: true }}>
    <color attach="background" args={['#a9d4ef']} />
    <fog attach="fog" args={['#a9d4ef', 14, 30]} />
    <hemisphereLight args={['#fff6e0', '#4c6b3a', 1.6]} />
    <directionalLight position={[6, 10, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[30, 48]} /><meshStandardMaterial color="#7fae52" roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, .4]} receiveShadow><planeGeometry args={[7.5, 7.5]} /><meshStandardMaterial color="#c9a774" roughness={1} /></mesh>
    <Suspense fallback={null}>
      {PLANTS.map(([n, x, z, s, r], i) => <Plant key={i} name={n} x={x} z={z} s={s} r={r} />)}
      {classes ? <>{PREVIEW_CLASSES.map((c, i) => <ClassHero key={c.name} look={c} move={move} tier={tier} x={(i % 5 - 2) * 1.5 + (i >= 5 ? .75 : 0)} z={i >= 5 ? 1.8 : 0} turn={-(i % 5 - 2) * .12} />)}{PREVIEW_MONSTERS.map(m => <Ready key={m.name} {...m} move={move} />)}</> : <>
      {PREVIEW_HEROES.map(h => <Character key={h.name} hero={h} move={move} />)}
      <Suspense fallback={null}><group position={[-9, 0, -12]}><VillageHouse spec={{ w: 2, d: 2 }} /></group><group position={[0, 0, -13]}><VillageHouse spec={{ w: 3, d: 3, floors: 2, brick: true, seed: 1 }} /></group><group position={[9, 0, -12]} rotation={[0, -.4, 0]}><VillageHouse spec={{ w: 2, d: 3, floors: 2 }} /></group></Suspense>
      {PREVIEW_RACES.map(r => <Ready key={r.name} {...r} move={move} />)}
      {PREVIEW_LOWPOLY.map(r => <Ready key={r.name} {...r} move={move} own />)}</>}
    </Suspense>
    <OrbitControls target={[0, 1, 0]} minDistance={3} maxDistance={16} maxPolarAngle={1.45} />
  </Canvas>;
}
