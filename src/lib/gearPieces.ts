/**
 * Peças de equipamento presas aos ossos do esqueleto KayKit (o mesmo para todas as classes).
 * Cada espaço equipado vira uma peça visível; a raridade define cor, metal e brilho.
 * Medidas no referencial do osso, antes da escala do herói.
 */
export type GearSlot = 'head' | 'shoulders' | 'chest' | 'hands' | 'legs' | 'feet' | 'belt' | 'back' | 'charm' | 'ring' | 'trinket';
export type PieceShape = 'dome' | 'cuff' | 'ring' | 'gem' | 'plate';
export interface GearPiece { bone: string; shape: PieceShape; position: [number, number, number]; scale: [number, number, number]; rotation?: [number, number, number] }

const mirror = (piece: GearPiece): GearPiece => ({ ...piece, bone: piece.bone.replace(/\.l$/, '.r'), position: [-piece.position[0], piece.position[1], piece.position[2]] });
const pair = (piece: GearPiece) => [piece, mirror(piece)];

export const GEAR_PIECES: Partial<Record<GearSlot, GearPiece[]>> = {
  shoulders: pair({ bone: 'upperarm.l', shape: 'dome', position: [0, .04, 0], scale: [.25, .2, .25], rotation: [Math.PI, 0, 0] }),
  hands: pair({ bone: 'wrist.l', shape: 'cuff', position: [0, .01, 0], scale: [.125, .07, .125] }),
  legs: pair({ bone: 'lowerleg.l', shape: 'plate', position: [0, .02, -.135], scale: [.15, .13, .05] }),
  feet: pair({ bone: 'lowerleg.l', shape: 'cuff', position: [0, .12, 0], scale: [.125, .06, .125] }),
  belt: [{ bone: 'hips', shape: 'ring', position: [0, .1, 0], scale: [.37, .37, .3], rotation: [Math.PI / 2, 0, 0] }],
  charm: [{ bone: 'chest', shape: 'gem', position: [0, .18, .27], scale: [.07, .09, .05] }],
};

export const RARITY_RANK: Record<string, number> = { 'Comum': 0, 'Incomum': 0, 'Raro': 1, 'Épico': 2, 'Lendário': 3, 'Mítico': 3 };
export interface RarityLook { color: string; trim: string; metalness: number; roughness: number; glow: string; glowIntensity: number; aura: boolean }
export const RARITY_LOOK: Record<'common' | 'epic' | 'mythic', RarityLook> = {
  common: { color: '#8b8f96', trim: '#6b4a32', metalness: .55, roughness: .55, glow: '#000000', glowIntensity: 0, aura: false },
  epic: { color: '#7f52d1', trim: '#d6c2ff', metalness: .7, roughness: .35, glow: '#a879ff', glowIntensity: .55, aura: true },
  mythic: { color: '#f2c14e', trim: '#fff2c4', metalness: .85, roughness: .25, glow: '#ffbf2e', glowIntensity: .9, aura: true },
};
export function rarityTier(rarity?: string): keyof typeof RARITY_LOOK { const rank = RARITY_RANK[rarity ?? ''] ?? 0; return rank >= 3 ? 'mythic' : rank >= 2 ? 'epic' : 'common'; }

/** Espaços visíveis com a raridade de cada um, e o nível mais alto (para a aura e os detalhes da armadura). */
export function gearLook(items: { slot: string; rarity: string }[]) {
  const slots: { slot: GearSlot; tier: keyof typeof RARITY_LOOK }[] = [];
  let best: keyof typeof RARITY_LOOK = 'common', armor: keyof typeof RARITY_LOOK = 'common';
  const order = { common: 0, epic: 1, mythic: 2 } as const;
  for (const item of items) {
    const tier = rarityTier(item.rarity);
    if (order[tier] > order[best]) best = tier;
    if (['head', 'chest', 'shoulders', 'legs', 'hands', 'feet', 'back'].includes(item.slot) && order[tier] > order[armor]) armor = tier;
    if (item.slot in GEAR_PIECES) slots.push({ slot: item.slot as GearSlot, tier });
  }
  return { slots, best, armor };
}
