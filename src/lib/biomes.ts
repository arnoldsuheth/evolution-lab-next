import type { RegionId } from './campaign';

type Relief = 'ridge' | 'ice' | 'volcano' | 'water' | 'lava';
export type Landmark = { name:string; kind:Relief; x:number; z:number; rx:number; rz:number; height:number };
type Biome = {
  ground:[string,string,string]; horizon:string; trees:'broadleaf'|'pine'|'scrub'|'crystal';
  landmarks:Landmark[];
};

const feature=(kind:Relief,name:string,x:number,z:number,rx:number,rz:number,height=0):Landmark=>({kind,name,x,z,rx,rz,height});
const BIOMES: Partial<Record<RegionId,Biome>> = {
  aurora: { horizon:'#c7d4b2', ground:['#586b44','#839356','#aa9d68'], trees:'broadleaf', landmarks:[
    feature('ridge','Cordilheira da Aurora',-55,-44,18,23,18),
    feature('ridge','Serra das Nascentes',45,-49,19,21,15),
    feature('water','Mar da Aurora',70,49,19,22),
    feature('ridge','Colinas do Sul',-56,49,16,14,10),
  ] },
  bosque: { horizon:'#a8c5af', ground:['#3d5941','#718550','#99915e'], trees:'broadleaf', landmarks:[
    feature('ridge','Serra do Bosque',-51,-30,19,24,18),
    feature('ridge','Escarpas do Vale Verde',45,-42,18,22,16),
    feature('water','Mar das Folhas',70,36,22,33),
    feature('ridge','Alto das raízes',-41,43,22,15,12),
  ] },
  'iron-forge': { horizon:'#b7d2e3', ground:['#697b80','#adbdbd','#dde4df'], trees:'pine', landmarks:[
    feature('ice','Montanhas da Geada',-51,-34,20,25,22),
    feature('ice','Agulhas de Ferro',-20,-59,22,18,19),
    feature('ice','Crista do Norte',44,-48,19,22,21),
    feature('water','Mar Glacial',-67,44,23,28),
  ] },
  gnomolandia: { horizon:'#b2cadd', ground:['#677780','#a9b6bd','#c8dad9'], trees:'pine', landmarks:[
    feature('ice','Serra das Engrenagens',43,-38,20,24,19),
    feature('ice','Picos de Prata',-24,-57,22,18,17),
    feature('water','Costa da Névoa',66,37,22,33),
    feature('ice','Morros do Degelo',-40,46,18,15,12),
  ] },
  ogrimmar: { horizon:'#d9ae92', ground:['#6d4338','#ac7653','#b89869'], trees:'scrub', landmarks:[
    feature('volcano','Vulcão Rubro',49,-40,19,22,22),
    feature('ridge','Cordilheira das Terras Rubras',-49,-37,22,21,17),
    feature('ridge','Garganta dos Orcs',48,33,18,19,13),
    feature('water','Mar de Cobre',-68,39,23,29),
  ] },
  ruins: { horizon:'#bdc9b2', ground:['#4e625b','#819277','#a3a689'], trees:'broadleaf', landmarks:[
    feature('ridge','Serra do Mosteiro',-43,-38,19,25,17),
    feature('ridge','Escarpas do Arquivo',45,-44,19,22,15),
    feature('water','Mar das Ruínas',67,33,24,29),
    feature('ridge','Colinas do Claustro',-46,41,22,16,10),
  ] },
  frontier: { horizon:'#d7c4a3', ground:['#645748','#aa8b64','#c6a677'], trees:'scrub', landmarks:[
    feature('ridge','Cânion dos Algoritmos',-50,-46,20,19,17),
    feature('ridge','Mesa de Arenito',43,-47,17,18,15),
    feature('ridge','Falésias da Fronteira',-53,35,22,18,12),
    feature('water','Mar de Arenito',67,38,21,32),
  ] },
  heart: { horizon:'#c08f96', ground:['#423744','#735360','#98665f'], trees:'crystal', landmarks:[
    feature('volcano','Vulcão de Nullarion',40,-53,21,22,24),
    feature('ridge','Serra de Obsidiana',-52,-45,19,24,18),
    feature('lava','Mar de Lava',-66,40,22,30),
    feature('ridge','Cristas do Eclipse',50,32,21,16,14),
  ] },
};

export const biomeOf=(region:string)=>BIOMES[region as RegionId];
export const landmarkDistance=(landmark:Landmark,x:number,z:number)=>Math.hypot((x-landmark.x)/landmark.rx,(z-landmark.z)/landmark.rz);
export const isWater=(landmark:Landmark)=>landmark.kind==='water'||landmark.kind==='lava';
export function biomeBlocks(region:string,x:number,z:number){
  return biomeOf(region)?.landmarks.some(landmark=>landmarkDistance(landmark,x,z)<(isWater(landmark)?1:.88))??false;
}

// Raise airborne mounts before reaching the silhouette, including the crater rim.
export function flightRelief(region:string,x:number,z:number){
  return biomeOf(region)?.landmarks.reduce((height,landmark)=>
    Math.max(height,landmark.height*Math.min(1.2,Math.max(0,1.11-landmarkDistance(landmark,x,z))*1.56)),0)??0;
}
