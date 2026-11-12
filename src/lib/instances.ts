import type {RegionId} from './campaign';
export const INSTANCES={
 cavern:{kind:'cave',name:'Caverna dos Fragmentos',region:'aurora' as RegionId,x:-23,z:-37,level:8,lesson:'variables',material:'instance-crystal',description:'Cristais antigos atraem criaturas mais resistentes. Recompensa de XP dobrada e cristal exclusivo.'},
 monastery:{kind:'monastery',name:'Monastério dos Ecos',region:'ruins' as RegionId,x:19,z:-15,level:25,lesson:'functions',material:'instance-seal',description:'Uma ordem perdida protege os selos da memória. Recompensa de XP dobrada e selo exclusivo.'},
 "frost-cave":{kind:'cave',name:'Gruta da Geada',region:'iron-forge' as RegionId,x:33,z:-17,level:1,lesson:null,material:'instance-crystal',description:'Caverna de gelo com veios e guardião.'},
 "red-rift":{kind:'rift',name:'Fenda Rubra',region:'ogrimmar' as RegionId,x:32,z:-29,level:12,lesson:null,material:'instance-seal',description:'Submundo corrompido com elites e XP dobrado.'},
 "wood-rift":{kind:'rift',name:'Fenda das Raízes',region:'bosque' as RegionId,x:-34,z:-28,level:18,lesson:null,material:'instance-seal',description:'Submundo corrompido com elites e XP dobrado.'},
 "gear-cave":{kind:'cave',name:'Gruta das Engrenagens',region:'gnomolandia' as RegionId,x:-33,z:-16,level:10,lesson:null,material:'instance-crystal',description:'Escavação abandonada com cristais e mecanismos antigos.'},
 "eclipse-rift":{kind:'rift',name:'Fenda do Eclipse',region:'frontier' as RegionId,x:29,z:-31,level:38,lesson:'arrays',material:'instance-seal',description:'Passagem para o submundo além da Fronteira dos Algoritmos.'},
} as const;
export type InstanceId=keyof typeof INSTANCES;
export function instanceRequirement(hero:{level:number;region:RegionId;dead:boolean},completed:string[],id:InstanceId){const place=INSTANCES[id];if(!place)return'Instância desconhecida';if(hero.dead)return'Aventura encerrada';if(hero.region!==place.region)return'A entrada fica em outra região';if(hero.level<place.level)return`Requer nível ${place.level}`;if(place.lesson&&!completed.includes(place.lesson))return'Conclua o capítulo exigido pelo guardião da entrada';return undefined;}
