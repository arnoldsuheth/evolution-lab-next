import type {HeroData,Education} from './game';
import {RACIAL_CITIES,type NewCity} from './kingdomCities';
import type {InstanceId} from './instances';
import {MAIN_ORDER} from './journey';
export const NULLARION_SCALE = 'nullarion-scale';
export type RegionId='aurora'|'ruins'|'frontier'|'heart'|NewCity;
export const MONSTER_KINDS=['wolf','spider','boar','golem','wraith','dragon','stag','frostcat','beetle','basilisk'] as const;
export type MonsterKind=typeof MONSTER_KINDS[number];
export const REGIONS:Record<RegionId,{name:string;boss?:string;lesson?:string;level:number;color:string}>={aurora:{name:'Pedra da Aurora',level:1,color:'#76a35a'},ruins:{name:'Ruínas das Funções',boss:'boss-mines',lesson:'functions',level:15,color:'#647c83'},frontier:{name:'Fronteira dos Algoritmos',boss:'boss-ruins',lesson:'arrays',level:30,color:'#7b705d'},heart:{name:'Coração do Código Perdido',boss:'boss-frontier',lesson:'debug',level:45,color:'#5e5474'},
 'iron-forge':{...RACIAL_CITIES['iron-forge'],level:1},
 gnomolandia:{...RACIAL_CITIES.gnomolandia,level:1},
 bosque:{...RACIAL_CITIES.bosque,level:1},
 ogrimmar:{...RACIAL_CITIES.ogrimmar,level:1},
 goddard:{name:'Goddard',level:1,color:'#777fa1'}};
export interface Monster{id:string;name:string;kind:MonsterKind;region:RegionId;x:number;z:number;level:number;boss:boolean;instance?:InstanceId;hostile?:boolean}
// Os sufixos preservam o progresso de incursões gravadas antes da mudança de criaturas.
const EXPEDITION_ENCOUNTERS = [
 {instance:'frost-cave',region:'iron-forge',level:1,enemies:[['spider','wolf','Lobo da Geada'],['golem','boar','Javali Invernal'],['wraith','golem','Guardião do Gelo']]},
 {instance:'red-rift',region:'ogrimmar',level:12,enemies:[['spider','boar','Javali Rubro'],['golem','golem','Sentinela de Basalto'],['wraith','wraith','Arauto Rubro']]},
 {instance:'wood-rift',region:'bosque',level:18,enemies:[['spider','spider','Tecelã das Raízes'],['golem','wraith','Eco da Floresta'],['wraith','wolf','Lobo das Raízes']]},
 {instance:'gear-cave',region:'gnomolandia',level:10,enemies:[['spider','spider','Aranha de Cobre'],['golem','golem','Autômato Enferrujado'],['wraith','golem','Vigia das Engrenagens']]},
 {instance:'eclipse-rift',region:'frontier',level:38,enemies:[['spider','wolf','Lobo do Eclipse'],['golem','wraith','Arauto do Eclipse'],['wraith','dragon','Draco da Fenda']]},
] as const;
type Camp = [region:RegionId, id:string, kind:MonsterKind, name:string, level:number, x:number, z:number, hostile:boolean];
const CAMPS:Camp[] = [
 ['aurora','south-stag','stag','Cervo da Campina',2,-2,42,false],
 ['aurora','shore-beetle','beetle','Besouro das Dunas',3,48,41,false],
 ['aurora','west-wolf','wolf','Lobo da Estrada',4,-44,-4,true],
 ['aurora','south-boar','boar','Javali da Campina',2,-19,46,false],
 ['aurora','north-spider','spider','Aranha das Nascentes',5,5,-58,true],
 ['bosque','vale-stag','stag','Cervo do Vale Verde',2,22,-37,false],
 ['bosque','river-stag','stag','Cervo das Folhas',2,39,16,false],
 ['bosque','river-wolf','wolf','Lobo da Margem',3,42,23,true],
 ['bosque','costa-boar','boar','Javali do Litoral',3,39,31,false],
 ['bosque','raiz-wolf','wolf','Lobo das Raízes',4,-24,-48,true],
 ['bosque','moss-spider','spider','Aranha da Mata Fechada',5,19,-63,true],
 ['bosque','prado-beetle','beetle','Besouro de Folhagem',3,-15,53,false],
 ['iron-forge','tundra-stag','stag','Cervo da Tundra',2,16,-45,false],
 ['iron-forge','ice-frostcat','frostcat','Lince das Agulhas',4,28,-36,true],
 ['iron-forge','snow-boar','boar','Javali da Neve',3,-29,21,false],
 ['iron-forge','frost-golem','golem','Sentinela Glacial',6,14,-65,true],
 ['iron-forge','tundra-wolf','wolf','Lobo da Tundra',3,-40,24,true],
 ['gnomolandia','snow-stag','stag','Cervo do Degelo',2,15,-34,false],
 ['gnomolandia','copper-beetle','beetle','Besouro dos Veios',3,-42,-18,false],
 ['gnomolandia','mount-frostcat','frostcat','Lince de Prata',5,17,-57,true],
 ['gnomolandia','slope-golem','golem','Autômato da Serra',6,15,48,true],
 ['gnomolandia','mist-boar','boar','Javali da Névoa',3,35,18,false],
 ['ogrimmar','ash-boar','boar','Javali de Cinzas',2,-19,-41,false],
 ['ogrimmar','ridge-basilisk','basilisk','Basilisco do Vulcão',5,30,-52,true],
 ['ogrimmar','copper-beetle','beetle','Besouro das Terras Rubras',3,-35,43,false],
 ['ogrimmar','ravine-wolf','wolf','Lobo da Garganta',4,18,47,true],
 ['ogrimmar','basalt-golem','golem','Sentinela de Basalto',7,63,-4,true],
 ['ruins','archive-spider','spider','Aranha do Claustro',18,13,-42,true],
 ['ruins','old-stag','stag','Cervo do Mosteiro',17,-21,35,false],
 ['ruins','rune-wraith','wraith','Espectro das Escarpas',23,24,-60,true],
 ['ruins','shore-beetle','beetle','Besouro das Ruínas',19,29,35,false],
 ['frontier','canyon-basilisk','basilisk','Basilisco do Cânion',36,-24,-51,true],
 ['frontier','sand-beetle','beetle','Besouro de Areia',32,30,35,false],
 ['frontier','mesa-golem','golem','Guardião de Arenito',40,20,-64,true],
 ['frontier','frontier-boar','boar','Javali da Mesa',33,-22,44,false],
 ['heart','obsidian-golem','golem','Golem de Obsidiana',49,-24,-49,true],
 ['heart','ash-basilisk','basilisk','Basilisco de Cinzas',51,17,48,true],
 ['heart','ash-beetle','beetle','Besouro do Eclipse',46,21,-35,false],
 ['heart','crater-wraith','wraith','Espectro da Cratera',54,10,-66,true],
];
const CAMP_OFFSETS=[[-2.8,1.2],[.8,-1.9],[3.4,2.5]] as const;
const WILDLIFE:Monster[]=CAMPS.flatMap(([region,id,kind,name,level,x,z,hostile])=>
  CAMP_OFFSETS.map(([dx,dz],i)=>({
    id:`wild-${region}-${id}-${i}`,name,kind,region,level,x:x+dx,z:z+dz,boss:false,hostile,
  })));

export const MONSTERS:Monster[]=[
 {id:'cavern-spider',name:'Aranha Cristalina',kind:'spider',region:'aurora',instance:'cavern',x:-6,z:0,level:8,boss:false},
 {id:'cavern-golem',name:'Vigia de Quartzo',kind:'golem',region:'aurora',instance:'cavern',x:6,z:-8,level:10,boss:false},
 {id:'cavern-guardian',name:'Guardião dos Fragmentos',kind:'golem',region:'aurora',instance:'cavern',x:0,z:-18,level:12,boss:true},
 {id:'monastery-wraith',name:'Eco do Noviço',kind:'wraith',region:'ruins',instance:'monastery',x:-6,z:0,level:25,boss:false},
 {id:'monastery-golem',name:'Sentinela do Claustro',kind:'golem',region:'ruins',instance:'monastery',x:6,z:-8,level:27,boss:false},
 {id:'monastery-guardian',name:'Abade sem Memória',kind:'wraith',region:'ruins',instance:'monastery',x:0,z:-18,level:29,boss:true},
 {id:'village-boar',name:'Javali Jovem',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:-25,z:7,level:1,boss:false},
 {id:'village-boar-2',name:'Javali Jovem',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:-27.5,z:10.5,level:1,boss:false},
 {id:'village-boar-3',name:'Javali Malhado',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:-27,z:3.5,level:2,boss:false},
 {id:'village-spider',name:'Aranha do Pomar',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:12.5,z:28.5,level:1,boss:false},
 {id:'village-spider-2',name:'Aranha do Pomar',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:9.5,z:31.5,level:1,boss:false},
 {id:'village-spider-3',name:'Tecelã do Pomar',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:14.5,z:26.5,level:2,boss:false},
 {id:'field-wolf',name:'Lobo das Colinas',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-25,z:-4.5,level:3,boss:false},
 {id:'field-wolf-2',name:'Lobo das Colinas',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-28,z:-7.5,level:3,boss:false},
 {id:'field-wolf-3',name:'Loba Alfa das Colinas',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-26.5,z:-11.5,level:4,boss:false},
 {id:'village-boar-4',name:'Javali Jovem',kind:'boar',region:'aurora',x:-30,z:5,level:1,boss:false},
 {id:'village-boar-5',name:'Javali Malhado',kind:'boar',region:'aurora',x:-24,z:13,level:2,boss:false},
 {id:'village-boar-6',name:'Javali Jovem',kind:'boar',region:'aurora',x:-25,z:13,level:1,boss:false},
 {id:'village-spider-4',name:'Aranha do Pomar',kind:'spider',region:'aurora',x:7,z:25,level:1,boss:false},
 {id:'village-spider-5',name:'Aranha do Pomar',kind:'spider',region:'aurora',x:14,z:32,level:1,boss:false},
 {id:'village-spider-6',name:'Tecelã do Pomar',kind:'spider',region:'aurora',x:12,z:35,level:2,boss:false},
 {id:'field-wolf-4',name:'Lobo das Colinas',kind:'wolf',region:'aurora',x:-30,z:-3,level:3,boss:false},
 {id:'field-wolf-5',name:'Lobo das Colinas',kind:'wolf',region:'aurora',x:-25,z:-11,level:3,boss:false},
 {id:'field-wolf-6',name:'Lobo das Colinas',kind:'wolf',region:'aurora',x:-26,z:-9,level:3,boss:false},
 {id:'forest-wolf-3',name:'Lobo Espinhento',kind:'wolf',region:'aurora',x:-8,z:-18,level:2,boss:false},
 {id:'forest-spider-3',name:'Aranha das Runas',kind:'spider',region:'aurora',x:3,z:-24,level:4,boss:false},
 {id:'mine-golem-2',name:'Golem de Ferro',kind:'golem',region:'aurora',x:20,z:-26,level:10,boss:false},
 {id:'ruins-spider',name:'Aranha do Arquivo',kind:'spider' as MonsterKind,region:'ruins' as RegionId,x:12,z:3,level:15,boss:false},
 {id:'ruins-golem',name:'Sentinela Desperta',kind:'golem' as MonsterKind,region:'ruins' as RegionId,x:-15,z:-17,level:23,boss:false},
 {id:'frontier-wolf',name:'Lobo da Fronteira',kind:'wolf' as MonsterKind,region:'frontier' as RegionId,x:12,z:3,level:30,boss:false},
 {id:'frontier-golem',name:'Golem do Desfiladeiro',kind:'golem' as MonsterKind,region:'frontier' as RegionId,x:-15,z:-17,level:38,boss:false},
 {id:'heart-wraith',name:'Eco da Cidadela',kind:'wraith' as MonsterKind,region:'heart' as RegionId,x:12,z:3,level:45,boss:false},
 {id:'heart-dragon',name:'Draco do Eclipse',kind:'dragon' as MonsterKind,region:'heart' as RegionId,x:-15,z:-17,level:55,boss:false},
 {id:'forest-wolf',name:'Lobo Espinhento',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-4,z:-18,level:2,boss:false},
 {id:'forest-spider',name:'Aranha das Runas',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:-10,z:-23,level:4,boss:false},
 {id:'forest-wolf-2',name:'Lobo Espinhento',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-5.5,z:-14,level:2,boss:false},
 {id:'forest-spider-2',name:'Aranha das Runas',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:6,z:-25,level:4,boss:false},
 {id:'boss-forest',name:'Brutamato · Senhor do Bosque',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:3.5,z:-19,level:5,boss:true},
 {id:'mine-golem',name:'Golem de Ferro',kind:'golem' as MonsterKind,region:'aurora' as RegionId,x:20,z:-22,level:10,boss:false},
 {id:'boss-mines',name:'Granito · Vigia das Condições',kind:'golem' as MonsterKind,region:'aurora' as RegionId,x:22,z:-16,level:15,boss:true},
 {id:'rune-wraith',name:'Espectro Rúnico',kind:'wraith' as MonsterKind,region:'ruins' as RegionId,x:-5,z:-8,level:18,boss:false},
 {id:'boss-ruins',name:'Oráculo Fragmentado',kind:'wraith' as MonsterKind,region:'ruins' as RegionId,x:2,z:-19,level:30,boss:true},
 {id:'frontier-boar',name:'Javali de Obsidiana',kind:'boar' as MonsterKind,region:'frontier' as RegionId,x:-5,z:-8,level:32,boss:false},
 {id:'boss-frontier',name:'Aracna · Tecelã dos Caminhos',kind:'spider' as MonsterKind,region:'frontier' as RegionId,x:2,z:-19,level:45,boss:true},
 {id:'heart-golem',name:'Sentinela do Eclipse',kind:'golem' as MonsterKind,region:'heart' as RegionId,x:-5,z:-8,level:48,boss:false},
 ...(['iron-forge','gnomolandia','bosque','ogrimmar'] as const).flatMap(region =>
  ([{kind:'boar',name:'Javali jovem',x:-18,z:26,level:1},{kind:'wolf',name:'Lobo das trilhas',x:19,z:29,level:2},{kind:'spider',name:'Aranha do ermo',x:-23,z:35,level:3}] as const).flatMap(group =>
   [-1,0,1].map((offset,i)=>({...group,id:region+'-'+group.kind+'-'+i,region,x:group.x+offset*2.4,z:group.z+(i%2)*2,boss:false})))),
 ...EXPEDITION_ENCOUNTERS.flatMap(site=>site.enemies.map(([suffix, kind, name],i)=>({
  id:site.instance+'-'+suffix,kind,region:site.region,instance:site.instance,x:[-5,6,0][i],
  z:[1,-7,-18][i],level:site.level+i,name,boss:i===2,
 }))),
 {id:'aurora-meadow-stag',name:'Cervo da Campina',kind:'stag',region:'aurora',x:27,z:29,level:2,boss:false},
 {id:'aurora-amber-beetle',name:'Besouro Âmbar',kind:'beetle',region:'aurora',x:-38,z:28,level:3,boss:false},
 {id:'bosque-silver-stag',name:'Cervo Galho de Prata',kind:'stag',region:'bosque',x:16,z:-38,level:3,boss:false},
 {id:'bosque-moss-beetle',name:'Besouro de Musgo',kind:'beetle',region:'bosque',x:-23,z:-50,level:4,boss:false},
 {id:'iron-frostcat',name:'Lince da Geada',kind:'frostcat',region:'iron-forge',x:39,z:-19,level:4,boss:false},
 {id:'gnome-copper-beetle',name:'Besouro de Cobre',kind:'beetle',region:'gnomolandia',x:-43,z:-13,level:3,boss:false},
 {id:'orc-ridge-basilisk',name:'Basilisco da Garganta',kind:'basilisk',region:'ogrimmar',x:23,z:-43,level:5,boss:false},
 {id:'frontier-sand-basilisk',name:'Basilisco de Arenito',kind:'basilisk',region:'frontier',x:-42,z:-30,level:36,boss:false},
 ...WILDLIFE,
 {id:'boss-master',name:'Nullarion · Devorador do Código',kind:'dragon' as MonsterKind,region:'heart' as RegionId,x:2,z:-19,level:60,boss:true},
];
function mainStoryDelivered(education: Education) {
  return MAIN_ORDER.every(id => education.completed.includes(id) && education.deliveries.includes('main:'+id));
}
export function regionRequirement(hero:HeroData,education:Education,region:RegionId){const next=REGIONS[region];if(!next)return'Região desconhecida';if(hero.dead)return'Aventura encerrada';if(hero.level<next.level)return`Requer nível ${next.level}`;if(next.boss&&!hero.defeatedBosses.includes(next.boss))return'Derrote o chefe da região anterior';if(next.lesson&&!education.completed.includes(next.lesson))return'Conclua o capítulo de programação exigido';if(region==='heart'&&!mainStoryDelivered(education))return'Conclua e entregue todas as missões da história principal';return undefined;}
export function monsterRequirement(hero:HeroData,education:Education,id:string){const m=MONSTERS.find(m=>m.id===id);if(!m)return'Criatura desconhecida';if(hero.region!==m.region||(hero.instance??null)!==(m.instance??null))return'A criatura está em outra região ou instância';if(m.instance&&hero.instanceProgress?.includes(m.id))return'Criatura já vencida nesta incursão';if(m.instance&&m.boss&&MONSTERS.some(other=>other.instance===m.instance&&!other.boss&&!hero.instanceProgress?.includes(other.id)))return'Vença os dois guardiões menores antes do chefe';if(m.region==='aurora'){if(m.z < -12&&!education.completed.includes('variables'))return'Restaure a primeira runa para explorar a floresta';if(m.x>15&&m.z < -12&&(!education.completed.includes('conditions')||!hero.defeatedBosses.includes('boss-forest')))return'Derrote Brutamato e conclua Condições para entrar nas minas';}if(m.id==='boss-master'){if(!mainStoryDelivered(education))return'Conclua e entregue todas as missões da história principal';if(hero.level<60||!education.reviewedProjects.includes(14))return'O chefe final exige nível 60 e revisão do projeto final de jogos';}return undefined;}
export function nextRegion(region:RegionId):RegionId|undefined{return({aurora:'ruins',ruins:'frontier',frontier:'heart'} as Partial<Record<RegionId,RegionId>>)[region];}

export const CAMPAIGN_BOSSES = ['boss-forest', 'boss-mines', 'boss-ruins', 'boss-frontier', 'boss-master'] as const;

export function campaignGate(from: RegionId, to: RegionId): [number, number] | undefined {
  if (to === 'aurora' && (from === 'ruins' || from === 'frontier' || from === 'heart')) return [0, 10];
  if (nextRegion(from) !== to) return;
  return from === 'aurora' ? [25, -18] : [8, -24];
}

export const AGGRO_RADIUS = 4.2, SAFE_TOWN_RADIUS = 12;
export const isAggressive = (m: { boss:boolean; instance?:string; hostile?:boolean }) =>
  m.boss || !!m.instance || m.hostile === true;
