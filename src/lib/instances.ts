import type {RegionId} from './campaign';
export const INSTANCES={
 cavern:{name:'Caverna dos Fragmentos',region:'aurora' as RegionId,x:-23,z:-37,level:8,lesson:'variables',material:'instance-crystal',description:'Cristais antigos atraem criaturas mais resistentes. Recompensa de XP dobrada e cristal exclusivo.'},
 monastery:{name:'Monastério dos Ecos',region:'ruins' as RegionId,x:19,z:-15,level:25,lesson:'functions',material:'instance-seal',description:'Uma ordem perdida protege os selos da memória. Recompensa de XP dobrada e selo exclusivo.'},
} as const;
export type InstanceId=keyof typeof INSTANCES;
export function instanceRequirement(hero:{level:number;region:RegionId;dead:boolean},completed:string[],id:InstanceId){const place=INSTANCES[id];if(!place)return'Instância desconhecida';if(hero.dead)return'Aventura encerrada';if(hero.region!==place.region)return'A entrada fica em outra região';if(hero.level<place.level)return`Requer nível ${place.level}`;if(!completed.includes(place.lesson))return'Conclua o capítulo exigido pelo guardião da entrada';return undefined;}
