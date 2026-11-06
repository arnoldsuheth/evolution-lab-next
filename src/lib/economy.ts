export const PROFESSIONS={blacksmith:'Ferreiro',weaponsmith:'Armeiro',tailor:'Alfaiate',leatherworker:'Coureiro',alchemist:'Alquimista'} as const;
export type Profession=keyof typeof PROFESSIONS;
export function equipmentValue(item:{power:number;defense:number;hp?:number;mp?:number;companion?:number;minLevel:number;rarity:string}){const attributes=item.power*14+item.defense*12+(item.hp??0)*2+(item.mp??0)*2+(item.companion??0)*16;const rarity=({Comum:1,'Épico':1.6,'Mítico':2.4,Incomum:1,Raro:1,'Lendário':2.4} as Record<string,number>)[item.rarity]??1;return Math.max(1,Math.ceil((10+item.minLevel*8+attributes)*rarity));}
export function currency(value:number){const total=Math.max(0,Math.floor(Number.isFinite(value)?value:0));const gold=Math.floor(total/10000),silver=Math.floor(total%10000/100),bronze=total%100;return [gold?`${gold} ouro`:'',silver?`${silver} prata`:'',bronze||!total?`${bronze} bronze`:''].filter(Boolean).join(' · ');}
export function repairCost(equipped:string[],durability:Record<string,number>,catalogue:Record<string,{price:number}>){return [...new Set(equipped)].reduce((cost,id)=>{const missing=100-(durability[id]??100);return cost+(missing>0&&catalogue[id]?Math.max(1,Math.ceil(catalogue[id].price*missing/1000)):0);},0);}
/** Custo do ferreiro para subir um passo (Comum → Épico → Mítico): moedas pela diferença de valor, fragmentos e cristais da faixa do item. */
export function forgeCost(base:{price:number;minLevel:number},next:{price:number},step:'epico'|'mitico',band:number){
 return {gold:Math.max(10,Math.ceil((next.price-base.price)*.5)),fragments:step==='epico'?3:6,materials:{[`mat-crystal-${band}`]:step==='epico'?2:4,...(step==='mitico'?{[`mat-ore-${band}`]:2}:{})} as Record<string,number>};
}
