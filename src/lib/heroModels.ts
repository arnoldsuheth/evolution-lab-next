import type { ClassId, Race } from './game';
import { CLASS_STYLE } from './cartoonAvatar';
import { RACE_FORM } from './visual';

/**
 * Modelos KayKit Adventures 1.0 (CC0) com esqueleto e animações.
 * Cada classe usa um corpo-base, armas próprias e uma paleta recolorida.
 * Nenhum dado salvo muda: tudo é derivado de classId, raça, pele e equipamento.
 */
export type HeroBase = 'knight' | 'barbarian' | 'mage' | 'rogue' | 'rogue_hooded';
export const HERO_BASE_FILES: Record<HeroBase, string> = {
  knight: 'Knight.glb', barbarian: 'Barbarian.glb', mage: 'Mage.glb', rogue: 'Rogue.glb', rogue_hooded: 'Rogue_Hooded.glb',
};
export const HERO_WEAPON_MESHES = ['1H_Sword', '1H_Sword_Offhand', '2H_Sword', 'Badge_Shield', 'Rectangle_Shield', 'Round_Shield', 'Spike_Shield', '1H_Axe', '1H_Axe_Offhand', '2H_Axe', 'Barbarian_Round_Shield', 'Mug', 'Spellbook', 'Spellbook_open', '1H_Wand', '2H_Staff', 'Knife', 'Knife_Offhand', '1H_Crossbow', '2H_Crossbow', 'Throwable'] as const;

type HueRule = { hue: number; range: number; minSat: number; to: string };
export interface HeroStyle {
  base: HeroBase;
  /** Arma principal exibida quando há arma equipada. */
  weapon: string[];
  /** Item de mão secundária exibido quando há escudo/foco equipado. */
  offhand: string[];
  /** Peças do corpo-base escondidas (chapéus que não combinam com a classe). */
  hide: string[];
  recolor: HueRule[];
  /** Recolore o metal acinzentado da armadura. */
  metal?: string;
  idle: string; attack: string;
}

const cloth = (id: ClassId) => CLASS_STYLE[id].cloth, trim = (id: ClassId) => CLASS_STYLE[id].trim;
export const HERO_STYLE: Record<ClassId, HeroStyle> = {
  paladin: { base: 'knight', weapon: ['1H_Sword'], offhand: ['Badge_Shield'], hide: [], metal: '#3d6fc4', recolor: [{ hue: 358, range: 14, minSat: .45, to: '#22407e' }], idle: 'Idle', attack: '1H_Melee_Attack_Chop' },
  warrior: { base: 'barbarian', weapon: ['2H_Axe'], offhand: [], hide: ['Barbarian_Hat'], recolor: [{ hue: 204, range: 14, minSat: .25, to: cloth('warrior') }], idle: '2H_Melee_Idle', attack: '2H_Melee_Attack_Chop' },
  hunter: { base: 'rogue_hooded', weapon: ['2H_Crossbow'], offhand: [], hide: [], recolor: [{ hue: 160, range: 16, minSat: .5, to: cloth('hunter') }, { hue: 132, range: 10, minSat: .35, to: '#8fb35c' }], idle: 'Idle', attack: '2H_Ranged_Shoot' },
  engineer: { base: 'barbarian', weapon: ['1H_Axe'], offhand: ['Barbarian_Round_Shield'], hide: ['Barbarian_Hat'], recolor: [{ hue: 204, range: 14, minSat: .25, to: cloth('engineer') }], idle: 'Idle', attack: '1H_Melee_Attack_Chop' },
  mage: { base: 'mage', weapon: ['2H_Staff'], offhand: [], hide: [], recolor: [{ hue: 245, range: 12, minSat: .3, to: cloth('mage') }, { hue: 332, range: 12, minSat: .5, to: trim('mage') }], idle: 'Idle', attack: 'Spellcast_Shoot' },
  hacker: { base: 'rogue_hooded', weapon: ['Knife'], offhand: ['Knife_Offhand'], hide: [], recolor: [{ hue: 160, range: 16, minSat: .5, to: cloth('hacker') }, { hue: 132, range: 10, minSat: .35, to: trim('hacker') }], idle: 'Idle', attack: 'Dualwield_Melee_Attack_Stab' },
  prophet: { base: 'mage', weapon: ['1H_Wand'], offhand: ['Spellbook_open'], hide: ['Mage_Hat'], recolor: [{ hue: 245, range: 12, minSat: .3, to: cloth('prophet') }, { hue: 332, range: 12, minSat: .5, to: trim('prophet') }], idle: 'Idle', attack: 'Spellcast_Raise' },
  duelist: { base: 'rogue', weapon: ['Knife'], offhand: ['Knife_Offhand'], hide: [], recolor: [{ hue: 160, range: 16, minSat: .5, to: cloth('duelist') }, { hue: 132, range: 10, minSat: .35, to: trim('duelist') }], idle: 'Idle', attack: 'Dualwield_Melee_Attack_Slice' },
  shaman: { base: 'mage', weapon: ['2H_Staff'], offhand: [], hide: ['Mage_Hat'], recolor: [{ hue: 245, range: 12, minSat: .3, to: cloth('shaman') }, { hue: 332, range: 12, minSat: .5, to: trim('shaman') }], idle: 'Idle', attack: 'Spellcast_Long' },
};

/** Altura e largura relativas ao humano, a partir das formas já usadas pelo jogo. */
export function heroProportions(race: Race) {
  const form = RACE_FORM[race] ?? RACE_FORM.human, human = RACE_FORM.human;
  return { height: form.height / human.height, width: Math.max(.85, Math.min(1.25, Math.sqrt(form.width / human.width))) };
}

function hexToRgb(hex: string): [number, number, number] { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function rgbToHsv(r: number, g: number, b: number): [number, number, number] { const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0; if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, max ? d / max : 0, max]; }
function hsvToRgb(h: number, s: number, v: number): [number, number, number] { const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; }
const hueGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Pele do atlas KayKit: tom pêssego claro (matiz ~23°, saturação ~0,37). */
export const isAtlasSkin = (h: number, s: number, v: number) => h >= 16 && h <= 28 && s >= .26 && s <= .48 && v >= .74;

/**
 * Recolore os pixels RGBA do atlas: pele pela raça, roupa pela classe e,
 * quando indicado, o metal da armadura. Preserva o degradê de luz original.
 */
export function recolorAtlas(data: Uint8ClampedArray, style: Pick<HeroStyle, 'recolor' | 'metal'>, skin: string) {
  const [sh, ss, sv] = rgbToHsv(...hexToRgb(skin));
  const targets = style.recolor.map(rule => ({ rule, hsv: rgbToHsv(...hexToRgb(rule.to)) }));
  const metal = style.metal ? rgbToHsv(...hexToRgb(style.metal)) : null;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = rgbToHsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    let out: [number, number, number] | null = null;
    if (isAtlasSkin(h, s, v)) out = hsvToRgb(sh, clamp(ss * (s / .37)), clamp(sv * (v / .96)));
    else if (metal && s < .16 && v > .28 && v < .9 && h > 150 && h < 240) out = hsvToRgb(metal[0], clamp(metal[1] * (.75 + v * .3)), clamp(metal[2] * (v / .57) * .92));
    else if (v > .2) for (const { rule, hsv } of targets) if (s >= rule.minSat && hueGap(h, rule.hue) <= rule.range) { out = hsvToRgb(hsv[0], clamp(hsv[1] * (.65 + s * .35)), clamp(hsv[2] * (v / .55))); break; }
    if (out) { data[i] = Math.round(out[0] * 255); data[i + 1] = Math.round(out[1] * 255); data[i + 2] = Math.round(out[2] * 255); }
  }
  return data;
}
