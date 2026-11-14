"use client";
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { ClassId, Race } from '@/lib/game';
import { useGame } from '@/lib/store';

/**
 * Lovelace 2.0: personagens do pacote Quaternius (CC0 / QAL) no jogo.
 * Roupa = peças das roupas Ranger e Camponês misturadas e pintadas por classe;
 * cabeça = raça (humano, elfo, orc; anão e gnomo menores); arma na mão; nível de equipamento muda o brilho.
 */
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/models/previa';
const C = (n: string) => `${base}/chars/${n}.glb`, PROP = (n: string) => `${base}/props/${n}.glb`;
const MR = 'Male_Ranger', MP = 'Male_Peasant', FR = 'Female_Ranger', FP = 'Female_Peasant';
type Part = [string, RegExp];
export type KWeapon = 'sword' | 'axe' | 'shield' | 'pickaxe' | 'staff' | 'wand' | 'bow' | 'dagger';
type ClassLook = { male: Part[]; female: Part[]; tint: string; right?: KWeapon; left?: KWeapon; gem?: string; attack: string };
const SWAP = (parts: Part[]): Part[] => parts.map(([f, re]) => [f.replace('Male', 'Female'), re]);
const L = (male: Part[], rest: Omit<ClassLook, 'male' | 'female'>, female?: Part[]): ClassLook => ({ male, female: female ?? SWAP(male), ...rest });
export const CLASS_LOOK: Record<ClassId, ClassLook> = {
  paladin: L([[MP, /Body|Legs|Arms/], [MR, /Pauldron|Feet/]], { tint: '#b9c6e0', right: 'sword', left: 'shield', attack: 'Sword_Attack' }, [[FP, /Body|Legs|Arms/], [FR, /Feet|Bracer/]]),
  warrior: L([[MP, /Body|Legs|Arms|Feet/], [MR, /Pauldron/]], { tint: '#c27a5c', right: 'axe', attack: 'Sword_Attack' }, [[FP, /Body|Legs|Arms|Feet/], [FR, /Bracer/]]),
  hunter: L([[MR, /.*/]], { tint: '#ffffff', left: 'bow', attack: 'Spell_Simple_Shoot' }),
  mage: L([[MP, /Body|Legs|Arms|Feet/], [MR, /Hood/]], { tint: '#a48fe6', right: 'staff', gem: '#6fc8ff', attack: 'Spell_Simple_Shoot' }, [[FP, /Body|Legs|Arms|Feet/], [FR, /Hood/]]),
  prophet: L([[MP, /Body|Legs|Arms|Feet/], [MR, /Belt/]], { tint: '#f2e3b8', right: 'wand', gem: '#ffd76a', attack: 'Spell_Simple_Shoot' }),
  shaman: L([[MP, /Body|Legs|Arms/], [MR, /Belt|Feet|Bracer/]], { tint: '#a9bd84', right: 'staff', gem: '#7dff9a', attack: 'Spell_Simple_Shoot' }),
  engineer: L([[MP, /Body|Legs|Arms/], [MR, /Feet/]], { tint: '#d6a25c', right: 'pickaxe', attack: 'Sword_Attack' }),
  hacker: L([[MR, /^(?!.*Pauldron).*/]], { tint: '#7d6bb5', right: 'dagger', left: 'dagger', attack: 'Punch_Jab' }),
  duelist: L([[MR, /^(?!.*Hood).*/]], { tint: '#d77a7a', right: 'sword', left: 'dagger', attack: 'Sword_Attack' }),
};
const RACE_BODY: Record<Race, [string, string]> = {
  human: ['Superhero_Male_FullBody', 'Superhero_Female_FullBody'], dwarf: ['Superhero_Male_FullBody', 'Superhero_Female_FullBody'], gnome: ['Superhero_Male_FullBody', 'Superhero_Female_FullBody'],
  elf: ['Elf_Male', 'Elf_Female'], orc: ['Orc_Male', 'Orc_Female'],
};
const RACE_SCALE: Record<Race, number> = { human: 1, elf: 1.03, orc: 1.06, dwarf: .82, gnome: .7 };
const HAIRS = ['Hair_SimpleParted', 'Hair_Buzzed', 'Hair_Long', 'Hair_Buns', 'Hair_BuzzedFemale'];
/** Arma do item equipado vira uma das armas do pacote (o resto usa a da classe). */
const ITEM_WEAPON: Record<string, KWeapon> = { sword: 'sword', axe: 'axe', hammer: 'axe', shield: 'shield', pickaxe: 'pickaxe', tool: 'pickaxe', gadget: 'pickaxe', staff: 'staff', focus: 'wand', wand: 'wand', bow: 'bow', crossbow: 'bow', slingshot: 'bow', dagger: 'dagger', gun: 'dagger' };
export const kingdomWeapon = (visual?: string) => visual ? ITEM_WEAPON[visual] : undefined;
export const KINGDOM_FILES = [MR, MP, FR, FP, 'UAL1', 'Superhero_Male_FullBody', 'Superhero_Female_FullBody', 'Eyebrows_Regular', 'Eyebrows_Female', 'Hair_Beard', ...HAIRS].map(C);
export const KINGDOM_PROPS = ['Sword_Bronze', 'Axe_Bronze', 'Shield_Wooden', 'Pickaxe_Bronze'].map(PROP);
// Baixa tudo de uma vez (em paralelo) em vez de um arquivo depois do outro.
if (typeof window !== 'undefined') [...KINGDOM_FILES, ...KINGDOM_PROPS, ...['Elf_Male', 'Elf_Female', 'Orc_Male', 'Orc_Female'].map(C)].forEach(f => useGLTF.preload(f));

function headOnly(mesh: THREE.SkinnedMesh) {
  const keep = new Set(mesh.skeleton.bones.map((b, i) => (/^(Head|neck_01)$/.test(b.name) ? i : -1)).filter(i => i >= 0));
  const g = mesh.geometry.clone(), idx = g.index!, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const main = (v: number) => { let best = 0, w = -1; for (let k = 0; k < 4; k++) { const x = sw.getComponent(v, k); if (x > w) { w = x; best = si.getComponent(v, k); } } return best; };
  const out: number[] = [];
  for (let t = 0; t < idx.count; t += 3) { const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2); if (keep.has(main(a)) && keep.has(main(b)) && keep.has(main(c))) out.push(a, b, c); }
  g.setIndex(out); mesh.geometry = g;
}
const tinted = (m: THREE.Material, color: string, mult = 1) => { const c = (m as THREE.MeshStandardMaterial).clone(); c.color = new THREE.Color(color).multiplyScalar(mult); return c; };

function weaponMesh(kind: KWeapon, props: Record<string, THREE.Group>, gem: string, glow: string | null): THREE.Object3D {
  const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, ...extra });
  const g = new THREE.Group();
  const prop = (name: string, s = 1) => { const p = props[name].clone(); p.scale.setScalar(s); return p; };
  if (kind === 'sword') g.add(prop('Sword_Bronze', .85));
  if (kind === 'axe') g.add(prop('Axe_Bronze', .85));
  if (kind === 'pickaxe') g.add(prop('Pickaxe_Bronze', .8));
  if (kind === 'shield') g.add(prop('Shield_Wooden', .9));
  if (kind === 'dagger') { const blade = new THREE.Mesh(new THREE.ConeGeometry(.035, .32, 4), std('#c9d2de', { metalness: .8, roughness: .25 })); blade.position.y = .24; g.add(blade, new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .12, 6), std('#3a2a20'))); }
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
  // Grau B ou acima: a arma ganha um brilho da cor do grau.
  if (glow) g.traverse(o => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mat = (m.material as THREE.MeshStandardMaterial).clone(); mat.emissive = new THREE.Color(glow); mat.emissiveIntensity = .35; m.material = mat; });
  g.traverse(o => { o.castShadow = true; });
  return g;
}

export type KingdomHeroProps = {
  classId: ClassId; race: Race; female: boolean; skin: string; hair: string; hairStyle: number; beard: boolean;
  right?: KWeapon | null; left?: KWeapon | null; tier: 0 | 1 | 2; glow: string | null; tint?: string;
  walking?: boolean; animated?: boolean; combatant?: boolean; halo?: boolean; preview?: boolean;
};
const HEIGHT = 2.2;

export default function KingdomHero(p: KingdomHeroProps) {
  const look = CLASS_LOOK[p.classId];
  const mr = useGLTF(C(MR)), mp = useGLTF(C(MP)), fr = useGLTF(C(FR)), fp = useGLTF(C(FP)), anims = useGLTF(C('UAL1'));
  const body = useGLTF(C(RACE_BODY[p.race][p.female ? 1 : 0]));
  const hair = useGLTF(C(HAIRS[p.hairStyle % HAIRS.length])), brows = useGLTF(C(p.female ? 'Eyebrows_Female' : 'Eyebrows_Regular')), beard = useGLTF(C('Hair_Beard'));
  const sword = useGLTF(PROP('Sword_Bronze')), axe = useGLTF(PROP('Axe_Bronze')), shield = useGLTF(PROP('Shield_Wooden')), pick = useGLTF(PROP('Pickaxe_Bronze'));
  const key = JSON.stringify([p.classId, p.race, p.female, p.skin, p.hair, p.hairStyle, p.beard, p.right, p.left, p.tier, p.glow, p.tint, p.halo]);
  const root = useMemo(() => {
    const outfits: Record<string, THREE.Group> = { [MR]: mr.scene, [MP]: mp.scene, [FR]: fr.scene, [FP]: fp.scene };
    const props: Record<string, THREE.Group> = { Sword_Bronze: sword.scene, Axe_Bronze: axe.scene, Shield_Wooden: shield.scene, Pickaxe_Bronze: pick.scene };
    const parts = p.female ? look.female : look.male, tint = p.tint ?? look.tint, accent = p.glow ?? look.gem ?? tint;
    const scene = cloneSkinned(outfits[parts[0][0]]) as THREE.Group, bones: Record<string, THREE.Bone> = {};
    scene.traverse(o => { if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone; });
    const drop: THREE.Object3D[] = []; scene.traverse(o => { if ((o as THREE.Mesh).isMesh) drop.push(o); }); drop.forEach(o => o.removeFromParent());
    const custom = RACE_BODY[p.race][0] !== 'Superhero_Male_FullBody';
    const paint = (m: THREE.SkinnedMesh) => {
      const mats = (Array.isArray(m.material) ? m.material : [m.material]).map(mt => {
        if (/Regular|skin/i.test(mt.name)) return tinted(mt, p.skin, 1.3);
        const c = tinted(mt, tint, 1.7) as THREE.MeshStandardMaterial;
        if (p.tier > 0) { c.metalness = p.tier === 2 ? .55 : .3; c.roughness = p.tier === 2 ? .35 : .5; c.emissive = new THREE.Color(accent); c.emissiveIntensity = p.tier === 2 ? .2 : .07; }
        return c;
      });
      m.material = Array.isArray(m.material) ? mats : mats[0];
    };
    const attach = (src: THREE.Object3D, keep: (m: THREE.SkinnedMesh) => boolean, edit?: (m: THREE.SkinnedMesh) => void) => {
      cloneSkinned(src).traverse(o => {
        const m = o as THREE.SkinnedMesh; if (!m.isSkinnedMesh || !keep(m)) return; edit?.(m);
        const mesh = new THREE.SkinnedMesh(m.geometry, m.material); mesh.name = m.name; mesh.frustumCulled = false; mesh.castShadow = true;
        mesh.bind(new THREE.Skeleton(m.skeleton.bones.map(b => bones[b.name] ?? b), m.skeleton.boneInverses), m.bindMatrix); scene.add(mesh);
      });
    };
    const seen = new Set<string>();
    for (const [file, re] of parts) attach(outfits[file], m => { const kind = m.name.replace(/^(Male|Female)_(Ranger|Peasant)_/, '').replace(/_.*$/, ''); const ok = re.test(m.name) && (!seen.has(kind) || /Acc|Belt|Bracer|Hood/.test(m.name)); if (ok) seen.add(kind); return ok; }, paint);
    const hairTint = (m: THREE.SkinnedMesh) => { m.material = tinted(m.material as THREE.Material, p.hair); };
    attach(body.scene, () => true, m => {
      if (/body|superhero|retopology/i.test(m.name)) { headOnly(m); m.material = tinted(m.material as THREE.Material, p.skin, 1.3); }
      else if (/hair|horns/i.test(m.name)) hairTint(m);
    });
    if (!custom) { if (p.hairStyle >= 0) attach(hair.scene, () => true, hairTint); attach(brows.scene, () => true, hairTint); if (p.beard) attach(beard.scene, () => true, hairTint); }
    const hold = (kind: KWeapon, bone: string, side: number) => { const hand = bones[bone]; if (!hand) return; const holder = new THREE.Group(); holder.position.set(side * .09, side * .03, 0); holder.rotation.set(0, 0, Math.PI); holder.add(weaponMesh(kind, props, look.gem ?? '#6fc8ff', p.tier ? accent : null)); hand.add(holder); };
    if (p.right) hold(p.right, 'hand_r', 1);
    if (p.left) hold(p.left, 'hand_l', -1);
    const metal = new THREE.MeshStandardMaterial({ color: p.tier === 2 ? '#e8c76a' : '#b8c0cc', metalness: .85, roughness: .3, emissive: p.tier === 2 ? '#7a5a10' : '#000000', emissiveIntensity: .4 });
    if (p.tier >= 1) {
      for (const [bone, side] of [['upperarm_r', 1], ['upperarm_l', -1]] as const) { const plate = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal); plate.scale.set(1, .7, 1.1); plate.rotation.z = -side * Math.PI / 2; plate.position.set(.05, 0, 0); bones[bone]?.add(plate); }
      const cape = new THREE.Mesh(new THREE.PlaneGeometry(.5, 1.05, 1, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color(tint).multiplyScalar(.8), side: THREE.DoubleSide, roughness: .8, emissive: p.tier === 2 ? accent : '#000000', emissiveIntensity: p.tier === 2 ? .12 : 0 }));
      const pos = cape.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, -Math.pow((.52 - y) / 1.05, 2) * .25); } pos.needsUpdate = true;
      const capeHolder = new THREE.Group(); capeHolder.add(cape); cape.position.y = -.5; bones.spine_03?.add(capeHolder); capeHolder.position.set(.05, -.12, 0); capeHolder.rotation.set(0, Math.PI / 2, Math.PI / 2);
    }
    if (p.tier === 2) {
      const gemMesh = new THREE.Mesh(new THREE.OctahedronGeometry(.05), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2.2 })); gemMesh.position.set(.08, .12, 0); bones.spine_03?.add(gemMesh);
      const aura = new THREE.Mesh(new THREE.RingGeometry(.45, .62, 40), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); aura.rotation.x = -Math.PI / 2; aura.position.y = .03; scene.add(aura);
    }
    if (p.halo) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .016, 8, 32), new THREE.MeshStandardMaterial({ color: '#ffe7a3', emissive: '#ffc94a', emissiveIntensity: 1.5 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, .3, 0); bones.Head?.add(ring); }
    scene.traverse(o => { o.castShadow = true; if ((o as THREE.Mesh).isMesh) o.frustumCulled = false; });
    scene.scale.setScalar(HEIGHT / 1.86 * RACE_SCALE[p.race]);
    return scene;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, mr.scene, mp.scene, fr.scene, fp.scene, body.scene, hair.scene, brows.scene, beard.scene, sword.scene, axe.scene, shield.scene, pick.scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(root); }, [mixer, root]);
  const clip = (n: string) => anims.animations.find(a => a.name === n);
  const move = p.walking ? 'Walk_Loop' : 'Idle_Loop';
  useEffect(() => {
    const c = clip(move); if (!c) return;
    const a = mixer.clipAction(c); a.reset().setEffectiveTimeScale(p.animated === false ? 0 : 1).fadeIn(.2).play(); mixer.update(0);
    return () => { a.fadeOut(.2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixer, move, p.animated, anims.animations]);
  const eventTime = useGame(s => p.combatant ? s.battleEvent?.time ?? 0 : 0), hurtTime = useGame(s => p.combatant && s.battleEvent?.received ? s.battleEvent.time : 0);
  const once = (name: string, delay = 0) => { const c = clip(name); if (!c) return () => {}; const a = mixer.clipAction(c); const t1 = setTimeout(() => a.reset().setLoop(THREE.LoopOnce, 1).fadeIn(.08).play(), delay); const t2 = setTimeout(() => a.fadeOut(.2), delay + Math.max(250, c.duration * 1000 - 200)); return () => { clearTimeout(t1); clearTimeout(t2); }; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => eventTime && p.animated !== false ? once(look.attack) : undefined, [eventTime]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => hurtTime && p.animated !== false ? once('Hit_Chest', 420) : undefined, [hurtTime]);
  useFrame((_, dt) => { mixer.update(Math.min(dt, .1)); });
  return <group scale={p.preview ? 1 / .74 : 1}><primitive object={root} /></group>;
}
