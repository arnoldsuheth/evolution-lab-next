export type ItemId = "axe" | "shield" | "helmet";

export interface Hero {
  name: string;
  gold: number;
  xp: number;
  level: number;
  inventory: ItemId[];
  equipped: ItemId[];
  missionComplete: boolean;
}

export const catalog: Record<ItemId, { name: string; price: number }> = {
  axe: { name: "Machado de Ferro", price: 25 },
  shield: { name: "Escudo do Vale", price: 15 },
  helmet: { name: "Elmo da Aurora", price: 20 },
};

export const initialHero: Hero = {
  name: "Guardiao da Aurora",
  gold: 50,
  xp: 0,
  level: 1,
  inventory: [],
  equipped: [],
  missionComplete: false,
};

export function buyItem(hero: Hero, item: ItemId): Hero {
  if (!catalog[item]) return hero;
  if (hero.inventory.includes(item)) return hero;
  if (hero.gold < catalog[item].price) return hero;

  return {
    ...hero,
    gold: hero.gold - catalog[item].price,
    inventory: [...hero.inventory, item],
  };
}

export function equipItem(hero: Hero, item: ItemId): Hero {
  if (!hero.inventory.includes(item)) return hero;
  if (hero.equipped.includes(item)) return hero;

  return { ...hero, equipped: [...hero.equipped, item] };
}

export function checkAnswer(answer: string): boolean {
  return /^(let|const)\s+nivel\s*=\s*1\s*;$/.test(answer.trim());
}

export function completeMission(hero: Hero, answer: string): Hero {
  if (hero.missionComplete || !checkAnswer(answer)) return hero;

  const xp = hero.xp + 100;

  return {
    ...hero,
    xp,
    level: Math.floor(xp / 100) + 1,
    gold: hero.gold + 20,
    missionComplete: true,
  };
}