import { HUNTER_ARROW, type Item } from './catalogue';
import { isRacialCity } from './kingdomCities';

export const MARKET_STALLS = {
  fruit: { name: 'Frutas', color: '#aa4d43' },
  bread: { name: 'Padaria', color: '#ba8240' },
  weapons: { name: 'Armas e flechas', color: '#435d83' },
  shields: { name: 'Escudos', color: '#73578b' },
  clothing: { name: 'Tecidos e couro', color: '#4f785d' },
  armor: { name: 'Armaduras', color: '#626775' },
} as const;
export type MarketStall = keyof typeof MARKET_STALLS;
type Point = [number, number];
const IDS = Object.keys(MARKET_STALLS) as MarketStall[];
const OFFSETS = [-12, -8, -4, 4, 8, 12];
export const AURORA_MARKET_UNLOCK = 'arrays';

function layout(z: number, offsets = OFFSETS) {
  return IDS.map((id, index) => ({
    id, ...MARKET_STALLS[id],
    point: [offsets[index], z] as Point,
    approach: [offsets[index], z - 2] as Point,
  }));
}
const AURORA = layout(18, [-4, -7, -10, -13, -16, -19]);
const REGIONAL = layout(12, [-19, -13, -6, 6, 13, 19]);
const GODDARD = layout(6);

export function cityMarket(region: string) {
  if (region === 'aurora') return AURORA;
  if (region === 'goddard') return GODDARD;
  return isRacialCity(region) ? REGIONAL : [];
}

export function marketOpen(region: string, completed: readonly string[]) {
  return region !== 'aurora' || completed.includes(AURORA_MARKET_UNLOCK);
}

export function marketCounterBlocks(region: string, x: number, z: number) {
  return cityMarket(region).some(({point}) => Math.abs(point[0] - x) < 1.25 && Math.abs(point[1] - z) < .72);
}

export function marketStocks(stall: MarketStall, item: Item) {
  if (item.source !== 'shop') return false;
  switch (stall) {
    case 'fruit': return item.id.startsWith('food-fruit-');
    case 'bread': return item.id === 'food' || item.id.startsWith('food-bread-');
    case 'weapons': return item.category === 'weapon' || item.id === HUNTER_ARROW;
    case 'shields': return item.visual === 'shield';
    case 'clothing': return item.armor === 'Tecido' || item.armor === 'Couro' || item.slot === 'back';
    case 'armor': return item.category === 'armor' && item.visual !== 'shield' && item.armor !== 'Tecido' && item.armor !== 'Couro';
  }
}
