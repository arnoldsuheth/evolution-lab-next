import type {HeroData,Education} from './game';
export type RegionId='aurora'|'ruins'|'frontier'|'heart';
export type MonsterKind='wolf'|'spider'|'boar'|'golem'|'wraith'|'dragon';
export const REGIONS:Record<RegionId,{name:string;boss?:string;lesson?:string;level:number;color:string}>={aurora:{name:'Pedra da Aurora',level:1,color:'#76a35a'},ruins:{name:'Ruínas das Funções',boss:'boss-mines',lesson:'functions',level:15,color:'#647c83'},frontier:{name:'Fronteira dos Algoritmos',boss:'boss-ruins',lesson:'arrays',level:30,color:'#7b705d'},heart:{name:'Coração do Código Perdido',boss:'boss-frontier',lesson:'debug',level:45,color:'#5e5474'}};
export interface Monster{id:string;name:string;kind:MonsterKind;region:RegionId;x:number;z:number;level:number;boss:boolean;instance?:"cavern"|"monastery"}
export const MONSTERS:Monster[]=[
 {id:'cavern-spider',name:'Aranha Cristalina',kind:'spider',region:'aurora',instance:'cavern',x:-6,z:0,level:8,boss:false},
 {id:'cavern-golem',name:'Vigia de Quartzo',kind:'golem',region:'aurora',instance:'cavern',x:6,z:-8,level:10,boss:false},
 {id:'cavern-guardian',name:'Guardião dos Fragmentos',kind:'golem',region:'aurora',instance:'cavern',x:0,z:-18,level:12,boss:true},
 {id:'monastery-wraith',name:'Eco do Noviço',kind:'wraith',region:'ruins',instance:'monastery',x:-6,z:0,level:25,boss:false},
 {id:'monastery-golem',name:'Sentinela do Claustro',kind:'golem',region:'ruins',instance:'monastery',x:6,z:-8,level:27,boss:false},
 {id:'monastery-guardian',name:'Abade sem Memória',kind:'wraith',region:'ruins',instance:'monastery',x:0,z:-18,level:29,boss:true},
 {id:'village-boar',name:'Javali Jovem',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:-25,z:7,level:1,boss:false},
 {id:'village-boar-2',name:'Javali Jovem',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:-27.5,z:10.5,level:1,boss:false},
 {id:'village-boar-3',name:'Javali Malhado',kind:'boar' as MonsterKind,region:'aurora' as RegionId,x:-23,z:3.5,level:2,boss:false},
 {id:'village-spider',name:'Aranha do Pomar',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:12.5,z:18.5,level:1,boss:false},
 {id:'village-spider-2',name:'Aranha do Pomar',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:9.5,z:20.5,level:1,boss:false},
 {id:'village-spider-3',name:'Tecelã do Pomar',kind:'spider' as MonsterKind,region:'aurora' as RegionId,x:14.5,z:21.5,level:2,boss:false},
 {id:'field-wolf',name:'Lobo das Colinas',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-25,z:-4.5,level:3,boss:false},
 {id:'field-wolf-2',name:'Lobo das Colinas',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-28,z:-7.5,level:3,boss:false},
 {id:'field-wolf-3',name:'Loba Alfa das Colinas',kind:'wolf' as MonsterKind,region:'aurora' as RegionId,x:-22.5,z:-8.5,level:4,boss:false},
 {id:'village-boar-4',name:'Javali Jovem',kind:'boar',region:'aurora',x:-30,z:5,level:1,boss:false},
 {id:'village-boar-5',name:'Javali Malhado',kind:'boar',region:'aurora',x:-24,z:13,level:2,boss:false},
 {id:'village-boar-6',name:'Javali Jovem',kind:'boar',region:'aurora',x:-20,z:7,level:1,boss:false},
 {id:'village-spider-4',name:'Aranha do Pomar',kind:'spider',region:'aurora',x:7,z:17,level:1,boss:false},
 {id:'village-spider-5',name:'Aranha do Pomar',kind:'spider',region:'aurora',x:14,z:25,level:1,boss:false},
 {id:'village-spider-6',name:'Tecelã do Pomar',kind:'spider',region:'aurora',x:12,z:24,level:2,boss:false},
 {id:'field-wolf-4',name:'Lobo das Colinas',kind:'wolf',region:'aurora',x:-30,z:-3,level:3,boss:false},
 {id:'field-wolf-5',name:'Lobo das Colinas',kind:'wolf',region:'aurora',x:-23,z:-11,level:3,boss:false},
 {id:'field-wolf-6',name:'Lobo das Colinas',kind:'wolf',region:'aurora',x:-19,z:-8,level:3,boss:false},
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
 {id:'boss-master',name:'Nullarion · Devorador do Código',kind:'dragon' as MonsterKind,region:'heart' as RegionId,x:2,z:-19,level:60,boss:true},
];
export function regionRequirement(hero:HeroData,education:Education,region:RegionId){const next=REGIONS[region];if(!next)return'Região desconhecida';if(hero.dead)return'Aventura encerrada';if(hero.level<next.level)return`Requer nível ${next.level}`;if(next.boss&&!hero.defeatedBosses.includes(next.boss))return'Derrote o chefe da região anterior';if(next.lesson&&!education.completed.includes(next.lesson))return'Conclua o capítulo de programação exigido';return undefined;}
export function monsterRequirement(hero:HeroData,education:Education,id:string){const m=MONSTERS.find(m=>m.id===id);if(!m)return'Criatura desconhecida';if(hero.region!==m.region||(hero.instance??null)!==(m.instance??null))return'A criatura está em outra região ou instância';if(m.instance&&hero.instanceProgress?.includes(m.id))return'Criatura já vencida nesta incursão';if(m.instance&&m.boss&&MONSTERS.some(other=>other.instance===m.instance&&!other.boss&&!hero.instanceProgress?.includes(other.id)))return'Vença os dois guardiões menores antes do chefe';if(m.region==='aurora'){if(m.z < -12&&!education.completed.includes('variables'))return'Restaure a primeira runa para explorar a floresta';if(m.x>15&&(!education.completed.includes('conditions')||!hero.defeatedBosses.includes('boss-forest')))return'Derrote Brutamato e conclua Condições para entrar nas minas';}if(m.id==='boss-master'&&(hero.level<60||!education.reviewedProjects.includes(14)))return'O chefe final exige nível 60 e revisão do projeto final de jogos';return undefined;}
export function nextRegion(region:RegionId):RegionId|undefined{return({aurora:'ruins',ruins:'frontier',frontier:'heart'} as Partial<Record<RegionId,RegionId>>)[region];}

/** Monstros agressivos atacam quem chega perto: do nível 3 em diante e em todas as regiões de fora. Iniciantes e a vila são seguros. */
export const AGGRO_RADIUS = 4.2, SAFE_TOWN_RADIUS = 12;
/** Só chefes e criaturas das masmorras (caverna e monastério) atacam quem chega perto; o resto luta só se for atacado. */
export const isAggressive = (m: { boss: boolean; instance?: string }) => m.boss || !!m.instance;
