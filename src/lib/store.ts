"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  initialHero, buyItem, equipItem, completeMission,
  type Hero, type ItemId,
} from "./rpg";
import {
  defaultAppearance,
  armorColors,
  beardColors,
  type Appearance,
  type ArmorColor,
  type BeardColor,
} from "./appearance";

type GameState = {
  hero: Hero;
  appearance: Appearance;
  buy: (item: ItemId) => void;
  equip: (item: ItemId) => void;
  answer: (value: string) => void;
  setArmor: (value: ArmorColor) => void;
  setBeard: (value: BeardColor) => void;
};

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      hero: initialHero,
      appearance: defaultAppearance,

      buy: item => set(s => ({
        hero: buyItem(s.hero, item),
      })),

      equip: item => set(s => ({
        hero: equipItem(s.hero, item),
      })),

      answer: value => set(s => ({
        hero: completeMission(s.hero, value),
      })),

      setArmor: value => {
        if (!Object.hasOwn(armorColors, value)) return;
        set(s => ({
          appearance: { ...s.appearance, armor: value },
        }));
      },

      setBeard: value => {
        if (!Object.hasOwn(beardColors, value)) return;
        set(s => ({
          appearance: { ...s.appearance, beard: value },
        }));
      },
    }),
    {
      name: "genesis-reborn-rpg-v3",
      version: 1,
      skipHydration: true,
      partialize: s => ({
        hero: s.hero,
        appearance: s.appearance,
      }),
      merge: (saved, current) => {
        const previous = saved as Partial<GameState> | undefined;
        return {
          ...current,
          hero: previous?.hero ?? current.hero,
          appearance: {
            ...defaultAppearance,
            ...previous?.appearance,
          },
        };
      },
    }
  )
);