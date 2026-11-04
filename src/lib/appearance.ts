export type ArmorColor = "blue" | "red" | "green";
export type BeardColor = "copper" | "brown" | "silver";

export type Appearance = {
  armor: ArmorColor;
  beard: BeardColor;
};

export const defaultAppearance: Appearance = {
  armor: "blue",
  beard: "copper",
};

export const armorColors: Record<ArmorColor, string> = {
  blue: "#2f5577",
  red: "#873e43",
  green: "#426e55",
};

export const beardColors: Record<BeardColor, string> = {
  copper: "#945128",
  brown: "#493126",
  silver: "#b3b6bd",
};

export function validAppearance(value: Appearance): boolean {
  return Object.hasOwn(armorColors, value.armor) &&
    Object.hasOwn(beardColors, value.beard);
}
