import type { ClassId, Race } from "./game";

export const RACE_CLASSES: Record<Race, readonly ClassId[]> = {
  human: ['mage','prophet','paladin','hunter','warrior','hacker'],
  elf: ['hunter','mage','prophet','hacker','duelist'],
  dwarf: ['paladin','warrior','hunter','engineer'],
  orc: ['shaman','warrior'],
  gnome: ['mage','shaman','hunter','hacker'], // Gnomolândia: magos, xamãs e caçadores; hacker mantido para salvamentos antigos.
};

export const RACIAL_CITIES = {
  aurora: { name: "Pedra da Aurora", color: "#76a35a", race: "human" },
  "iron-forge": { name: "Iron Forge", color: "#a5bbc7", race: "dwarf" },
  gnomolandia: { name: "Gnomolândia", color: "#8aaab5", race: "gnome" },
  bosque: { name: "Bosque Arcano", color: "#66865c", race: "elf" },
  ogrimmar: { name: "Ogrimmar", color: "#a56c4d", race: "orc" },
} as const satisfies Record<string, { name: string; color: string; race: Race }>;
export type RacialCity = keyof typeof RACIAL_CITIES;
export type NewCity = Exclude<RacialCity, "aurora"> | "goddard";
export const isRacialCity = (id: string): id is RacialCity => Object.hasOwn(RACIAL_CITIES, id);
export const isNewCity = (id: string): id is NewCity => id === "goddard" || (id !== "aurora" && isRacialCity(id));
export const CITY_PORTAL = [0, -7] as const;
export const AURORA_PORTAL = [5, 7] as const;
export const GODDARD_PORTAL_PLAZA_WIDTH = 21;
export const GODDARD_BOOLE = [0,-10] as const;
export const CITY_BANK = [-8, 3] as const;
export const CITY_FORGE = [-8, -3] as const;
export const CITY_WAGON = [8, 3] as const;
export const CITY_SPAWN = [0, 5] as const;
export const cityForRace = (race: Race): RacialCity => (Object.keys(RACIAL_CITIES) as RacialCity[]).find(id => RACIAL_CITIES[id].race === race) ?? "aurora";
export const goddardExit = (id: RacialCity) => [(Object.keys(RACIAL_CITIES).indexOf(id)-2)*4.1,CITY_PORTAL[1]] as const;
export const cityPortal = (id: string) => id === "aurora" ? AURORA_PORTAL : CITY_PORTAL;

export function cityBuildings(city: NewCity) {
  if (city === "goddard") return [{x:0,z:-15,w:5,d:3},{x:-13,z:-5,w:2,d:2},{x:13,z:-5,w:2,d:2}];
  return [
    {x:-11,z:0,w:2.5,d:2},{x:11,z:0,w:2.5,d:2},
    {x:-16,z:-10,w:2.4,d:1.9},{x:-8,z:-15,w:2.4,d:1.9},
    {x:8,z:-15,w:2.4,d:1.9},{x:16,z:-10,w:2.4,d:1.9},
    ...(city==="bosque"?[{x:20,z:-4,w:2.4,d:1.9}]:[]),
  ];
}

const AURORA_HOUSES = [
  [-19,-7], [-19,-1], [-19,5], [-19,10], [18,-7], [18,4],
].map(([x,z]) => ({ x, z, w:1.6, d:1.2 }));

export function trainerHouses(city: RacialCity) {
  if (city === "aurora") return AURORA_HOUSES;
  const count = RACE_CLASSES[RACIAL_CITIES[city].race].length;
  return cityBuildings(city).slice(2, 2+count);
}

export function trainerPosition(city: RacialCity, index:number) {
  const b=trainerHouses(city)[index];
  return b?[b.x,b.z+.4] as const:undefined;
}

export function trainerHouseBlocks(b: {x:number;z:number;w:number;d:number}, x:number, z:number) {
  const dx=Math.abs(x-b.x),dz=z-b.z;
  if (dx>=b.w+.25 || Math.abs(dz)>=b.d+.25) return false;
  return dx>b.w-.32 || dz< -b.d+.32 || (dz>b.d-.28 && dx>.57);
}

export function cityWalkable(city: NewCity,x:number,z:number) {
  if (city === "goddard" && (Math.abs(x)>19||z< -21||z>12)) return false;
  const buildings = city === "goddard" ? cityBuildings(city) : [...cityBuildings(city).slice(0,2), ...trainerHouses(city)];
  return !buildings.some((b,i)=>{
    const dx=Math.abs(x-b.x),dz=z-b.z;
    if(dx>=b.w+.25||Math.abs(dz)>=b.d+.25)return false;
    if(city==="goddard"||i<2)return true;
    return trainerHouseBlocks(b,x,z);
  });
}
