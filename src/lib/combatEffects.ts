import type { ClassId } from './game';

/** Efeito visual de cada golpe: o ataque básico é um corte; o poder e as habilidades mostram a magia da classe. */
export type EffectKind = 'slash' | 'holy' | 'shock' | 'arrow' | 'gear' | 'star' | 'shadow' | 'heal' | 'cross' | 'storm';
export const CLASS_EFFECT: Record<ClassId, EffectKind> = {
  paladin: 'holy', warrior: 'shock', hunter: 'arrow', engineer: 'gear', mage: 'star', hacker: 'shadow', prophet: 'heal', duelist: 'cross', shaman: 'storm',
};
export const EFFECT_NAMES: Record<EffectKind, string> = {
  slash: 'Corte', holy: 'Coluna de luz', shock: 'Onda de choque', arrow: 'Flecha certeira', gear: 'Engrenagem faiscante', star: 'Estrela arcana', shadow: 'Névoa das sombras', heal: 'Luz restauradora', cross: 'Corte em X', storm: 'Raio dos espíritos',
};
export const EFFECT_SECONDS = 1.1;
export function effectFor(kind: 'attack' | 'power' | 'skill' | undefined, classId: ClassId): EffectKind { return kind === 'power' || kind === 'skill' ? CLASS_EFFECT[classId] : 'slash'; }

/** Alcance do ataque: corpo a corpo chega perto; arqueiros e conjuradores atacam de longe. */
export const ATTACK_RANGE: Record<ClassId, number> = { paladin: 4, warrior: 4, engineer: 4, hacker: 4, duelist: 4, hunter: 8.5, mage: 8.5, prophet: 8.5, shaman: 8.5 };
export type CombatAction = { kind: 'attack' | 'power' | 'skill'; skill?: string };

/** Efeito visual do poder do monstro (sai dele e acerta o herói). */
export const ENEMY_POWER_EFFECT: Record<string, { kind: EffectKind; color: string }> = {
  poison: { kind: 'shadow', color: '#7be36a' }, slow: { kind: 'shock', color: '#9fb6d8' }, freeze: { kind: 'holy', color: '#9ff0ff' }, burn: { kind: 'star', color: '#ff8a3d' }, charge: { kind: 'shock', color: '#e8b48a' },
};
