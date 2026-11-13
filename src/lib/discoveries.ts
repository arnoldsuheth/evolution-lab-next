import type { RegionId } from './campaign';

type Point = [number, number];
export type Discovery = {
  id:string; region:RegionId; name:string; hint:string; point:Point; bronze:number; xp:number;
  guard?:string; branch?:Point;
};

export const DISCOVERIES: readonly Discovery[] = [
  {id:'forest-camp',region:'bosque',name:'Acampamento das Folhas',hint:'Derrote o vigia da matilha para abrir o baú do acampamento.',point:[43,17],branch:[39,21],guard:'wild-bosque-river-wolf-0',bronze:25,xp:45},
  {id:'frost-cache',region:'iron-forge',name:'Provisões do Degelo',hint:'Um baú de provisões deixado junto à travessia gelada.',point:[-40,24],bronze:22,xp:35},
  {id:'mist-cache',region:'gnomolandia',name:'Depósito da Névoa',hint:'Caixas de uma expedição gnômica na margem do canal.',point:[35,17],bronze:22,xp:35},
  {id:'basalt-cache',region:'ogrimmar',name:'Baú de Basalto',hint:'Uma reserva da guarda orc junto à corrente de lava.',point:[61,-9],bronze:24,xp:40},
  {id:'spring-cache',region:'aurora',name:'Provisões das Nascentes',hint:'Um baú deixado por viajantes na campina.',point:[-27,44],bronze:20,xp:32},
  {id:'cloister-cache',region:'ruins',name:'Relicário do Claustro',hint:'O relicário de um noviço do mosteiro.',point:[-19,47],bronze:35,xp:100},
  {id:'sand-cache',region:'frontier',name:'Esconderijo de Arenito',hint:'Suprimentos de uma caravana perdidos no vale.',point:[40,42],bronze:50,xp:150},
  {id:'obsidian-cache',region:'heart',name:'Cofre de Obsidiana',hint:'Um cofre abandonado perto da trilha vulcânica.',point:[-35,39],bronze:70,xp:220},
];

export const discoveryIn = (region:RegionId) => DISCOVERIES.find(site=>site.region===region);
export const DISCOVERY_REVEAL_RANGE = 8;
export const DISCOVERY_OPEN_RANGE = 3.2;
export function discoveryDistance(site:Discovery,[x,z]:Point) {
  return Math.hypot(site.point[0]-x,site.point[1]-z);
}
