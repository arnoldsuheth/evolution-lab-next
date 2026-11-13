/** QA26: "peso" de cada golpe. Quanto mais o golpe tira da vida do monstro, mais forte a reação. */
export type HitTier = 'light' | 'medium' | 'heavy' | 'crushing';
export type HitFeel = { label: string; hitstop: number; knockback: number; shake: number; scale: number };

/** hitstop em segundos, recuo em unidades do mundo, tremor em pixels e tamanho do número. */
export const HIT_FEEL: Record<HitTier, HitFeel> = {
  light: { label: 'Golpe', hitstop: .04, knockback: .15, shake: 0, scale: 1 },
  medium: { label: 'Golpe firme', hitstop: .07, knockback: .3, shake: 2, scale: 1.1 },
  heavy: { label: 'Golpe pesado', hitstop: .1, knockback: .55, shake: 4, scale: 1.25 },
  crushing: { label: 'Golpe esmagador', hitstop: .14, knockback: .85, shake: 7, scale: 1.45 },
};

export function hitWeight(hit: { damage: number; maxHp: number; critical?: boolean; kind: 'attack' | 'power' | 'skill'; won?: boolean }): HitTier {
  if (hit.damage <= 0) return 'light';
  const share = Math.min(1, hit.damage / Math.max(1, hit.maxHp));
  const score = share * 4 + (hit.critical ? 1 : 0) + (hit.kind === 'attack' ? 0 : .6) + (hit.won ? 1 : 0);
  return score < .6 ? 'light' : score < 1.4 ? 'medium' : score < 2.2 ? 'heavy' : 'crushing';
}

/** Recuo do monstro ao longo do tempo: parado no impacto, empurrado e depois volta ao lugar. */
export function knockbackAt(age: number, tier: HitTier) {
  const feel = HIT_FEEL[tier];
  if (age < feel.hitstop) return 0;
  const t = (age - feel.hitstop) / .45;
  if (t >= 1) return 0;
  return feel.knockback * (t < .25 ? t / .25 : 1 - (t - .25) / .75);
}
