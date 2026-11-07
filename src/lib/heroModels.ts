import type { ClassId, Race } from './game';
import { CLASS_STYLE } from './cartoonAvatar';

/**
 * Modelos KayKit Adventures 1.0 (CC0) com esqueleto e animações.
 * Cada classe usa um corpo-base, armas próprias e uma paleta recolorida.
 * Nenhum dado salvo muda: tudo é derivado de classId, raça, aparência e equipamento.
 */
export type HeroBase = 'knight' | 'barbarian' | 'mage' | 'rogue' | 'rogue_hooded';
export const HERO_BASE_FILES: Record<HeroBase, string> = {
  knight: 'Knight.glb', barbarian: 'Barbarian.glb', mage: 'Mage.glb', rogue: 'Rogue.glb', rogue_hooded: 'Rogue_Hooded.glb',
};
export const HERO_WEAPON_MESHES = ['1H_Sword', '1H_Sword_Offhand', '2H_Sword', 'Badge_Shield', 'Rectangle_Shield', 'Round_Shield', 'Spike_Shield', '1H_Axe', '1H_Axe_Offhand', '2H_Axe', 'Barbarian_Round_Shield', 'Mug', 'Spellbook', 'Spellbook_open', '1H_Wand', '2H_Staff', 'Knife', 'Knife_Offhand', '1H_Crossbow', '2H_Crossbow', 'Throwable'] as const;
/** Peças de cada corpo-base: cabeça, capa e o que conta como elmo. */
export const HERO_PARTS: Record<HeroBase, { head: string; cape: string; helmet?: string; hood?: HeroBase }> = {
  knight: { head: 'Knight_Head', cape: 'Knight_Cape', helmet: 'Knight_Helmet' },
  barbarian: { head: 'Barbarian_Head', cape: 'Barbarian_Cape', helmet: 'Barbarian_Hat' },
  mage: { head: 'Mage_Head', cape: 'Mage_Cape', helmet: 'Mage_Hat' },
  rogue: { head: 'Rogue_Head', cape: 'Rogue_Cape', hood: 'rogue_hooded' },
  rogue_hooded: { head: 'Rogue_Head_Hooded', cape: 'Rogue_Cape' },
};
export const HERO_HAT_MESHES = ['Knight_Helmet', 'Barbarian_Hat', 'Mage_Hat'];

/** Peça 3D (de qualquer corpo-base: todos usam o mesmo esqueleto) que mostra o item igual ao ícone. */
export interface BorrowedMesh { mesh: string; base: HeroBase }
/** Arma da mão principal pelo desenho do item. Sem peça pronta (martelo, arco, arma de fogo...), usa o modelo simples. */
export const WEAPON_MESH: Record<string, BorrowedMesh> = {
  sword: { mesh: '1H_Sword', base: 'knight' }, greatsword: { mesh: '2H_Sword', base: 'knight' }, dagger: { mesh: 'Knife', base: 'rogue' },
  axe: { mesh: '1H_Axe', base: 'barbarian' }, staff: { mesh: '2H_Staff', base: 'mage' }, wand: { mesh: '1H_Wand', base: 'mage' }, crossbow: { mesh: '2H_Crossbow', base: 'rogue' },
};
export const OFFHAND_MESH: Record<string, BorrowedMesh> = {
  shield: { mesh: 'Badge_Shield', base: 'knight' }, sword: { mesh: '1H_Sword_Offhand', base: 'knight' }, dagger: { mesh: 'Knife_Offhand', base: 'rogue' },
};
/** Item de cabeça: chapéu de mago, capuz ou elmo de cavaleiro — a mesma regra do ícone. */
export type HeadLook = 'mage_hat' | 'hood' | 'helmet';
export function headLook(classId?: ClassId): HeadLook {
  return classId && ['mage', 'prophet', 'shaman'].includes(classId) ? 'mage_hat' : classId && ['hacker', 'hunter', 'duelist'].includes(classId) ? 'hood' : 'helmet';
}
export const HEAD_MESH: Record<Exclude<HeadLook, 'hood'>, BorrowedMesh> = { mage_hat: { mesh: 'Mage_Hat', base: 'mage' }, helmet: { mesh: 'Knight_Helmet', base: 'knight' } };

type HueRule = { hue: number; range: number; minSat: number; to: string };
export interface HeroStyle {
  base: HeroBase;
  /** Arma principal exibida quando há arma equipada. */
  weapon: string[];
  /** Item de mão secundária exibido quando há escudo/foco equipado. */
  offhand: string[];
  recolor: HueRule[];
  /** Recolore o metal acinzentado da armadura. */
  metal?: string;
  idle: string; attack: string;
}

const cloth = (id: ClassId) => CLASS_STYLE[id].cloth, trim = (id: ClassId) => CLASS_STYLE[id].trim;
export const HERO_STYLE: Record<ClassId, HeroStyle> = {
  paladin: { base: 'knight', weapon: ['1H_Sword'], offhand: ['Badge_Shield'], metal: '#3d6fc4', recolor: [{ hue: 358, range: 14, minSat: .45, to: '#22407e' }], idle: 'Idle', attack: '1H_Melee_Attack_Chop' },
  warrior: { base: 'barbarian', weapon: ['2H_Axe'], offhand: [], recolor: [{ hue: 204, range: 14, minSat: .25, to: cloth('warrior') }], idle: '2H_Melee_Idle', attack: '2H_Melee_Attack_Chop' },
  hunter: { base: 'rogue', weapon: ['2H_Crossbow'], offhand: [], recolor: [{ hue: 160, range: 16, minSat: .5, to: cloth('hunter') }, { hue: 132, range: 10, minSat: .35, to: '#8fb35c' }], idle: 'Idle', attack: '2H_Ranged_Shoot' },
  engineer: { base: 'barbarian', weapon: ['1H_Axe'], offhand: ['Barbarian_Round_Shield'], recolor: [{ hue: 204, range: 14, minSat: .25, to: cloth('engineer') }], idle: 'Idle', attack: '1H_Melee_Attack_Chop' },
  mage: { base: 'mage', weapon: ['2H_Staff'], offhand: [], recolor: [{ hue: 245, range: 12, minSat: .3, to: cloth('mage') }, { hue: 332, range: 12, minSat: .5, to: trim('mage') }], idle: 'Idle', attack: 'Spellcast_Shoot' },
  hacker: { base: 'rogue', weapon: ['Knife'], offhand: ['Knife_Offhand'], recolor: [{ hue: 160, range: 16, minSat: .5, to: cloth('hacker') }, { hue: 132, range: 10, minSat: .35, to: trim('hacker') }], idle: 'Idle', attack: 'Dualwield_Melee_Attack_Stab' },
  prophet: { base: 'mage', weapon: ['1H_Wand'], offhand: ['Spellbook_open'], recolor: [{ hue: 245, range: 12, minSat: .3, to: cloth('prophet') }, { hue: 332, range: 12, minSat: .5, to: trim('prophet') }], idle: 'Idle', attack: 'Spellcast_Raise' },
  duelist: { base: 'rogue', weapon: ['Knife'], offhand: ['Knife_Offhand'], recolor: [{ hue: 160, range: 16, minSat: .5, to: cloth('duelist') }, { hue: 132, range: 10, minSat: .35, to: trim('duelist') }], idle: 'Idle', attack: 'Dualwield_Melee_Attack_Slice' },
  shaman: { base: 'mage', weapon: ['2H_Staff'], offhand: [], recolor: [{ hue: 245, range: 12, minSat: .3, to: cloth('shaman') }, { hue: 332, range: 12, minSat: .5, to: trim('shaman') }], idle: 'Idle', attack: 'Spellcast_Long' },
};
export const HERO_WALK = 'Walking_A', HERO_PUNCH = 'Unarmed_Melee_Attack_Punch_A', HERO_HIT = 'Hit_A';
/** Todas as animações que o jogo usa. As demais são removidas dos arquivos publicados. */
export const HERO_ANIMATIONS = [...new Set(['Idle', HERO_WALK, HERO_PUNCH, HERO_HIT, ...Object.values(HERO_STYLE).flatMap(s => [s.idle, s.attack])])];

/** Penteados: cada opção usa a cabeça (com cabelo) de um corpo-base, às vezes com um prendedor. 0 = o da classe. */
export const HERO_HAIRSTYLES: { label: string; base: HeroBase | null; extra?: 'ponytail' | 'bun' }[] = [
  { label: 'Da classe', base: null }, { label: 'Curto', base: 'knight' }, { label: 'Longo', base: 'rogue' }, { label: 'Repartido', base: 'mage' }, { label: 'Rabo de cavalo', base: 'knight', extra: 'ponytail' }, { label: 'Coque', base: 'mage', extra: 'bun' },
];
/** Estrutura corporal muda a largura do herói. */
export const BODY_WIDTH = [.9, .95, 1, 1.05, 1.1, 1.15];

export interface HeroGear { head: boolean; chest: boolean; back: boolean }
export interface HeroDress { outfit: 'rags' | 'class'; hat: string | null; cape: boolean; head: HeroBase; extra?: 'ponytail' | 'bun'; covered: boolean }
/**
 * O iniciante veste roupas remendadas: sem elmo, sem capa e sem as cores da classe.
 * Peitoral traz as cores da classe; item de cabeça mostra o elmo (se o jogador quiser); capa vem com peitoral ou costas.
 */
export function heroDress(classId: ClassId, gear: HeroGear, hairStyle: number, showHelmet: boolean): HeroDress {
  const base = HERO_STYLE[classId].base, parts = HERO_PARTS[base], helmet = gear.head && showHelmet;
  const style = HERO_HAIRSTYLES[hairStyle], chosen = style?.base ?? base;
  return {
    outfit: gear.chest ? 'class' : 'rags',
    hat: helmet ? parts.helmet ?? null : null,
    cape: gear.chest || gear.back,
    head: helmet ? parts.hood ?? base : chosen,
    ...(!helmet && style?.extra ? { extra: style.extra } : {}),
    covered: helmet,
  };
}

/**
 * Tamanho por raça, igual para heróis e NPCs: humano, elfo e orc têm a mesma altura;
 * o anão tem silhueta baixa e larga; o gnomo é a menor raça. A largura dá a silhueta de cada raça.
 */
export const RACE_SIZE: Record<Race, { height: number; width: number }> = { human: { height: 1, width: 1 }, elf: { height: 1, width: .94 }, orc: { height: 1, width: 1.14 }, dwarf: { height: .68, width: 1.65 }, gnome: { height: .5, width: 1.05 } };
export function heroProportions(race: Race) { return RACE_SIZE[race] ?? RACE_SIZE.human; }

function hexToRgb(hex: string): [number, number, number] { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function rgbToHsv(r: number, g: number, b: number): [number, number, number] { const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0; if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, max ? d / max : 0, max]; }
function hsvToRgb(h: number, s: number, v: number): [number, number, number] { const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; }
const hueGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Pele do atlas KayKit: tom pêssego claro (matiz ~23°, saturação ~0,37). */
export const isAtlasSkin = (h: number, s: number, v: number) => h >= 16 && h <= 28 && s >= .26 && s <= .48 && v >= .74;
/** Cor do cabelo de cada cabeça no atlas (medida nos arquivos originais). */
export const HAIR_RULES: Record<HeroBase, { hue: number; range: number; sat: [number, number]; val: [number, number] }> = {
  knight: { hue: 34, range: 6, sat: [.3, .52], val: [.76, .94] },
  barbarian: { hue: 24, range: 8, sat: [.07, .2], val: [.38, .64] },
  mage: { hue: 312, range: 26, sat: [.04, .16], val: [.08, .26] },
  rogue: { hue: 15, range: 5, sat: [.5, .67], val: [.44, .72] },
  rogue_hooded: { hue: 15, range: 5, sat: [.5, .67], val: [.44, .72] },
};
export const RAGS_HUE = 30;

export interface RecolorOptions { rags?: boolean; hair?: { base: HeroBase; color: string }; eyes?: string }
/** Olhos pintados do atlas: azul-acinzentado bem escuro, igual nas cinco cabeças. */
export const isAtlasEye = (h: number, s: number, v: number) => h >= 188 && h <= 204 && s >= .24 && s <= .34 && v <= .22;
/**
 * Recolore os pixels RGBA do atlas: pele pela raça, cabelo pela escolha do jogador,
 * roupa pela classe (ou tecido remendado) e, quando indicado, o metal da armadura.
 * Preserva o degradê de luz original.
 */
export function recolorAtlas(data: Uint8ClampedArray, style: Pick<HeroStyle, 'recolor' | 'metal'>, skin: string, options: RecolorOptions = {}) {
  const [sh, ss, sv] = rgbToHsv(...hexToRgb(skin));
  const targets = style.recolor.map(rule => ({ rule, hsv: rgbToHsv(...hexToRgb(rule.to)) }));
  const metal = style.metal ? rgbToHsv(...hexToRgb(style.metal)) : null;
  const hairRule = options.hair ? HAIR_RULES[options.hair.base] : null, hair = options.hair ? rgbToHsv(...hexToRgb(options.hair.color)) : null;
  const hairRef = hairRule ? [(hairRule.sat[0] + hairRule.sat[1]) / 2, (hairRule.val[0] + hairRule.val[1]) / 2] : [1, 1];
  const eye = options.eyes ? rgbToHsv(...hexToRgb(options.eyes)) : null;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = rgbToHsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    let out: [number, number, number] | null = null;
    if (isAtlasSkin(h, s, v)) out = hsvToRgb(sh, clamp(ss * (s / .37)), clamp(sv * (v / .96)));
    else if (eye && isAtlasEye(h, s, v)) out = hsvToRgb(eye[0], clamp(Math.max(.35, eye[1])), clamp(Math.min(.46, eye[2] * .45 + v * 1.2)));
    else if (hairRule && hair && hueGap(h, hairRule.hue) <= hairRule.range && s >= hairRule.sat[0] && s <= hairRule.sat[1] && v >= hairRule.val[0] && v <= hairRule.val[1]) out = hsvToRgb(hair[0], clamp(hair[1] * (.7 + .3 * s / hairRef[0])), clamp(hair[2] * (.55 + .45 * v / hairRef[1])));
    else if (options.rags) { if (v > .06) out = hsvToRgb(RAGS_HUE + (h % 24 - 12) * .35, clamp(.34 + s * .22), clamp(.1 + v * .62)); }
    else if (metal && s < .16 && v > .28 && v < .9 && h > 150 && h < 240) out = hsvToRgb(metal[0], clamp(metal[1] * (.75 + v * .3)), clamp(metal[2] * (v / .57) * .92));
    else if (v > .2) for (const { rule, hsv } of targets) if (s >= rule.minSat && hueGap(h, rule.hue) <= rule.range) { out = hsvToRgb(hsv[0], clamp(hsv[1] * (.65 + s * .35)), clamp(hsv[2] * (v / .55))); break; }
    if (out) { data[i] = Math.round(out[0] * 255); data[i + 1] = Math.round(out[1] * 255); data[i + 2] = Math.round(out[2] * 255); }
  }
  return data;
}
