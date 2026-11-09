import type { Race } from "./game";

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
export const AURORA_PORTAL = [3, 14] as const;
export const GODDARD_BOOLE = [0,-10] as const;
export const CITY_BANK = [-8, 3] as const;
export const CITY_FORGE = [-8, -3] as const;
export const CITY_WAGON = [8, 3] as const;
export const CITY_SPAWN = [0, 5] as const;
export const cityForRace = (race: Race): RacialCity => (Object.keys(RACIAL_CITIES) as RacialCity[]).find(id => RACIAL_CITIES[id].race === race) ?? "aurora";
export const goddardExit = (id: RacialCity) => [(Object.keys(RACIAL_CITIES).indexOf(id)-2)*2.7,CITY_PORTAL[1]] as const;
export const cityPortal = (id: string) => id === "aurora" ? AURORA_PORTAL : CITY_PORTAL;

export function cityBuildings(city: NewCity) {
  if (city === "goddard") return [{x:0,z:-15,w:5,d:3},{x:-13,z:-5,w:2,d:2},{x:13,z:-5,w:2,d:2}];
  return [
    {x:-8,z:0,w:2,d:1.7},{x:8,z:0,w:2,d:1.7},
    {x:-9,z:-9,w:2,d:1.8},{x:-4,z:-12,w:2,d:1.8},
    {x:4,z:-12,w:2,d:1.8},{x:9,z:-9,w:2,d:1.8},
    ...(city==="bosque"?[{x:14,z:-6,w:2,d:1.8}]:[]),
  ];
}

export function trainerPosition(city: Exclude<NewCity,"goddard">, index:number) {
  const b=cityBuildings(city)[index+2];
  return b?[b.x,b.z+.4] as const:undefined;
}

export function cityWalkable(city: NewCity,x:number,z:number) {
  if (city === "goddard" && (Math.abs(x)>19||z< -21||z>12)) return false;
  return !cityBuildings(city).some((b,i)=>{
    const dx=Math.abs(x-b.x),dz=z-b.z;
    if(dx>=b.w+.25||Math.abs(dz)>=b.d+.25)return false;
    if(city==="goddard"||i<2)return true;
    return dx>b.w-.42||dz< -b.d+.4||(dz>b.d-.35&&dx>.86);
  });
}
