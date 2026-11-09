import type {RegionId} from './campaign';
export const INSTANCES={
 cavern:{name:'Caverna dos Fragmentos',region:'aurora' as RegionId,x:-23,z:-37,level:8,lesson:'variables',material:'instance-crystal',description:'Cristais antigos atraem criaturas mais resistentes. Recompensa de XP dobrada e cristal exclusivo.'},
 monastery:{name:'Monastério dos Ecos',region:'ruins' as RegionId,x:19,z:-15,level:25,lesson:'functions',material:'instance-seal',description:'Uma ordem perdida protege os selos da memória. Recompensa de XP dobrada e selo exclusivo.'},
 "frost-cave":{name:'Gruta da Geada',region:'iron-forge' as RegionId,x:17,z:-9,level:1,lesson:null,material:'instance-crystal',description:'Caverna de gelo com veios e guardião.'},
 "red-rift":{name:'Fenda Rubra',region:'ogrimmar' as RegionId,x:16,z:-18,level:12,lesson:null,material:'instance-seal',description:'Submundo corrompido com elites e XP dobrado.'},
 "wood-rift":{name:'Fenda das Raízes',region:'bosque' as RegionId,x:-18,z:-19,level:18,lesson:null,material:'instance-seal',description:'Submundo corrompido com elites e XP dobrado.'},
} as const;
export type InstanceId=keyof typeof INSTANCES;
export function instanceRequirement(hero:{level:number;region:RegionId;dead:boolean},completed:string[],id:InstanceId){const place=INSTANCES[id];if(!place)return'Instância desconhecida';if(hero.dead)return'Aventura encerrada';if(hero.region!==place.region)return'A entrada fica em outra região';if(hero.level<place.level)return`Requer nível ${place.level}`;if(place.lesson&&!completed.includes(place.lesson))return'Conclua o capítulo exigido pelo guardião da entrada';return undefined;}
